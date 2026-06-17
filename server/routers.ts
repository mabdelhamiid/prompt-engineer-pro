import { COOKIE_NAME, FRAMEWORKS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import {
  savePromptHistory,
  getPromptHistory,
  deletePromptHistory,
  savePromptToLibrary,
  getSavedPrompts,
  searchSavedPrompts,
  deleteSavedPrompt,
  updateSavedPrompt,
} from "./db";

/**
 * Generate a system prompt for the LLM based on selected framework
 */
function getFrameworkSystemPrompt(framework: string): string {
  const frameworks: Record<string, string> = {
    "CO-STAR": `You are an expert prompt engineer. When generating prompts, structure them using the CO-STAR framework:
- Context: Set the scene and provide background information
- Objective: Clearly state what the AI should do
- Style: Specify the tone and style of response
- Tone: Define the emotional quality
- Audience: Identify who the response is for
- Response format: Specify how the output should be formatted

Generate a well-structured prompt that incorporates all these elements.`,

    RISEN: `You are an expert prompt engineer. When generating prompts, structure them using the RISEN framework:
- Role: Define the role the AI should take
- Instructions: Provide clear, step-by-step instructions
- Steps: Break down the process into logical steps
- End goal: State the desired outcome
- Notes: Add any important context or constraints

Generate a well-structured prompt that incorporates all these elements.`,

    RTF: `You are an expert prompt engineer. When generating prompts, structure them using the RTF framework:
- Role: Define the role the AI should take
- Task: Clearly state the task
- Format: Specify the output format

Generate a well-structured prompt that incorporates all these elements.`,

    CRAFT: `You are an expert prompt engineer. When generating prompts, structure them using the CRAFT framework:
- Context: Provide relevant background
- Role: Define the role the AI should take
- Action: Specify what the AI should do
- Format: Specify the output format
- Task: State the specific task

Generate a well-structured prompt that incorporates all these elements.`,
  };

  return frameworks[framework] || frameworks["CO-STAR"];
}

const BREAKDOWN_DIMENSION = {
  type: "object" as const,
  properties: {
    before: { type: "string" as const },
    after: { type: "string" as const },
    explanation: { type: "string" as const },
  },
  required: ["before", "after", "explanation"] as const,
  additionalProperties: false as const,
};

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  /**
   * Prompt Generation: Convert natural language to optimized prompt
   */
  prompt: router({
    generate: protectedProcedure
      .input(
        z.object({
          idea: z.string().min(10, "Idea must be at least 10 characters"),
          framework: z.enum(FRAMEWORKS),
          systemPromptOverride: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const baseSystemPrompt = getFrameworkSystemPrompt(input.framework);
        const systemPrompt = input.systemPromptOverride
          ? `${baseSystemPrompt}\n\nAdditional instructions: ${input.systemPromptOverride}`
          : baseSystemPrompt;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `Based on the following idea, generate an optimized prompt:\n\n"${input.idea}"\n\nGenerate a clear, well-structured prompt that can be used with an AI model.`,
            },
          ],
        });

        const content = response.choices[0]?.message.content;
        const generatedPrompt =
          typeof content === "string" ? content : "Failed to generate prompt";

        try {
          await savePromptHistory(ctx.user.id, "generation", input.idea, generatedPrompt, input.framework);
        } catch { /* DB unavailable — history not saved */ }

        return { prompt: generatedPrompt, framework: input.framework };
      }),

    /**
     * Prompt Improvement: Analyze and improve existing prompt — single LLM call
     */
    improve: protectedProcedure
      .input(
        z.object({
          prompt: z.string().min(10, "Prompt must be at least 10 characters"),
          framework: z.enum(FRAMEWORKS),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const baseSystemPrompt = getFrameworkSystemPrompt(input.framework);

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `${baseSystemPrompt}\n\nYour task is to analyze and improve an existing prompt. Return a JSON object with the improved prompt and a breakdown of improvements across five dimensions: clarity, specificity, context, tone, and constraints.`,
            },
            {
              role: "user",
              content: `Analyze and improve this prompt:\n\n"${input.prompt}"\n\nReturn both the improved version and a detailed breakdown of the changes.`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "improve_result",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  improvedPrompt: { type: "string" },
                  breakdown: {
                    type: "object",
                    properties: {
                      clarity: BREAKDOWN_DIMENSION,
                      specificity: BREAKDOWN_DIMENSION,
                      context: BREAKDOWN_DIMENSION,
                      tone: BREAKDOWN_DIMENSION,
                      constraints: BREAKDOWN_DIMENSION,
                    },
                    required: ["clarity", "specificity", "context", "tone", "constraints"],
                    additionalProperties: false,
                  },
                },
                required: ["improvedPrompt", "breakdown"],
                additionalProperties: false,
              },
            },
          },
        });

        const fallbackBreakdown = {
          clarity: { before: "", after: "", explanation: "Analysis not available" },
          specificity: { before: "", after: "", explanation: "Analysis not available" },
          context: { before: "", after: "", explanation: "Analysis not available" },
          tone: { before: "", after: "", explanation: "Analysis not available" },
          constraints: { before: "", after: "", explanation: "Analysis not available" },
        };

        let improvedPrompt = "Failed to improve prompt";
        let breakdown = fallbackBreakdown;

        try {
          const msgContent = response.choices[0]?.message.content;
          if (typeof msgContent === "string") {
            const parsed = JSON.parse(msgContent);
            improvedPrompt = parsed.improvedPrompt || improvedPrompt;
            breakdown = parsed.breakdown || fallbackBreakdown;
          }
        } catch (error) {
          console.error("Failed to parse improve response:", error);
        }

        try {
          await savePromptHistory(ctx.user.id, "improvement", input.prompt, improvedPrompt, input.framework, JSON.stringify(breakdown));
        } catch { /* DB unavailable — history not saved */ }

        return {
          originalPrompt: input.prompt,
          improvedPrompt,
          breakdown,
          framework: input.framework,
        };
      }),

    /**
     * Get prompt history for current user
     */
    getHistory: protectedProcedure
      .input(z.object({ limit: z.number().default(50) }))
      .query(async ({ ctx, input }) => {
        const history = await getPromptHistory(ctx.user.id, input.limit);
        return history.map((item) => ({
          ...item,
          improvementBreakdown: item.improvementBreakdown
            ? JSON.parse(item.improvementBreakdown)
            : null,
        }));
      }),

    /**
     * Delete history item
     */
    deleteHistory: protectedProcedure
      .input(z.object({ historyId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deletePromptHistory(input.historyId, ctx.user.id);
        return { success: true };
      }),
  }),

  /**
   * Saved Prompts Library Management
   */
  library: router({
    save: protectedProcedure
      .input(
        z.object({
          title: z.string().min(1, "Title is required"),
          prompt: z.string().min(1, "Prompt is required"),
          framework: z.enum(FRAMEWORKS).optional(),
          tags: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await savePromptToLibrary(
          ctx.user.id,
          input.title,
          input.prompt,
          input.framework,
          input.tags,
          input.notes
        );
        return { success: true };
      }),

    getAll: protectedProcedure.query(async ({ ctx }) => {
      return getSavedPrompts(ctx.user.id);
    }),

    search: protectedProcedure
      .input(z.object({ query: z.string().min(1) }))
      .query(async ({ ctx, input }) => {
        return searchSavedPrompts(ctx.user.id, input.query);
      }),

    delete: protectedProcedure
      .input(z.object({ promptId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteSavedPrompt(input.promptId, ctx.user.id);
        return { success: true };
      }),

    update: protectedProcedure
      .input(
        z.object({
          promptId: z.number(),
          title: z.string().optional(),
          prompt: z.string().optional(),
          framework: z.enum(FRAMEWORKS).optional(),
          tags: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { promptId, ...updates } = input;
        await updateSavedPrompt(promptId, ctx.user.id, updates);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
