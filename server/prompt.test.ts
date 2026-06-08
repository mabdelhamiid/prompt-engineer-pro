import { describe, expect, it, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `user-${userId}`,
    email: `user${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Prompt Generation", () => {
  it("should generate a prompt from an idea with CO-STAR framework", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.prompt.generate({
      idea: "Create a prompt that helps users write better emails",
      framework: "CO-STAR",
    });

    expect(result).toBeDefined();
    expect(result.prompt).toBeDefined();
    expect(result.prompt.length).toBeGreaterThan(0);
    expect(result.framework).toBe("CO-STAR");
  }, { timeout: 15000 });

  it("should generate a prompt with RISEN framework", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.prompt.generate({
      idea: "Create a prompt for code review assistance",
      framework: "RISEN",
    });

    expect(result).toBeDefined();
    expect(result.prompt).toBeDefined();
    expect(result.framework).toBe("RISEN");
  }, { timeout: 15000 });

  it("should generate a prompt with RTF framework", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.prompt.generate({
      idea: "Create a prompt for summarizing documents",
      framework: "RTF",
    });

    expect(result).toBeDefined();
    expect(result.prompt).toBeDefined();
    expect(result.framework).toBe("RTF");
  }, { timeout: 15000 });

  it("should generate a prompt with CRAFT framework", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.prompt.generate({
      idea: "Create a prompt for brainstorming ideas",
      framework: "CRAFT",
    });

    expect(result).toBeDefined();
    expect(result.prompt).toBeDefined();
    expect(result.framework).toBe("CRAFT");
  }, { timeout: 15000 });

  it("should reject generation with empty idea", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.prompt.generate({
        idea: "",
        framework: "CO-STAR",
      });
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.code).toBe("BAD_REQUEST");
    }
  });

  it("should reject generation with short idea", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.prompt.generate({
        idea: "short",
        framework: "CO-STAR",
      });
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.code).toBe("BAD_REQUEST");
    }
  });
});

describe("Prompt Improvement", () => {
  it("should improve a prompt with breakdown", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.prompt.improve({
      prompt: "Write a story about a person who discovers a hidden treasure",
      framework: "CO-STAR",
    });

    expect(result).toBeDefined();
    expect(result.originalPrompt).toBeDefined();
    expect(result.improvedPrompt).toBeDefined();
    expect(result.improvedPrompt.length).toBeGreaterThan(0);
    expect(result.breakdown).toBeDefined();
    expect(result.framework).toBe("CO-STAR");
  }, { timeout: 15000 });

  it("should include improvement breakdown dimensions", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.prompt.improve({
      prompt: "Help me write code",
      framework: "RISEN",
    });

    expect(result.breakdown).toBeDefined();
    expect(result.breakdown.clarity).toBeDefined();
    expect(result.breakdown.specificity).toBeDefined();
    expect(result.breakdown.context).toBeDefined();
    expect(result.breakdown.tone).toBeDefined();
    expect(result.breakdown.constraints).toBeDefined();

    // Each dimension should have before, after, and explanation
    Object.values(result.breakdown).forEach((dimension: any) => {
      expect(dimension).toHaveProperty("before");
      expect(dimension).toHaveProperty("after");
      expect(dimension).toHaveProperty("explanation");
    });
  }, { timeout: 15000 });

  it("should reject improvement with empty prompt", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.prompt.improve({
        prompt: "",
        framework: "CO-STAR",
      });
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.code).toBe("BAD_REQUEST");
    }
  });
});

describe("Prompt History", () => {
  it("should retrieve user's prompt history", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Generate a prompt first
    await caller.prompt.generate({
      idea: "Create a prompt for writing poetry",
      framework: "CO-STAR",
    });

    // Get history
    const history = await caller.prompt.getHistory({ limit: 50 });

    expect(history).toBeDefined();
    expect(Array.isArray(history)).toBe(true);
    if (history.length > 0) {
      expect(history[0]).toHaveProperty("id");
      expect(history[0]).toHaveProperty("type");
      expect(history[0]).toHaveProperty("inputText");
      expect(history[0]).toHaveProperty("outputPrompt");
      expect(history[0]).toHaveProperty("framework");
      expect(history[0]).toHaveProperty("createdAt");
    }
  });

  it("should filter history by user context", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Generate multiple prompts
    await caller.prompt.generate({
      idea: "Create a prompt for testing",
      framework: "CO-STAR",
    });

    await caller.prompt.generate({
      idea: "Create another prompt for testing",
      framework: "RISEN",
    });

    // Get history
    const history = await caller.prompt.getHistory({ limit: 50 });

    // Should have at least the prompts we just generated
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].userId).toBe(ctx.user.id);
  }, { timeout: 15000 });

  it("should delete history item for authenticated user only", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Generate a prompt
    await caller.prompt.generate({
      idea: "Create a prompt to be deleted",
      framework: "CO-STAR",
    });

    // Get history
    const historyBefore = await caller.prompt.getHistory({ limit: 50 });
    const itemToDelete = historyBefore[0];

    if (itemToDelete) {
      // Delete the item
      const result = await caller.prompt.deleteHistory({
        historyId: itemToDelete.id,
      });

      expect(result.success).toBe(true);
    }
  }, { timeout: 15000 });
});

describe("Saved Prompts Library", () => {
  it("should save a prompt to library", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.library.save({
      title: "My First Saved Prompt",
      prompt: "This is a test prompt for the library",
      framework: "CO-STAR",
      tags: "test,example",
      notes: "This is a test note",
    });

    expect(result.success).toBe(true);
  });

  it("should retrieve all saved prompts for user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Save a prompt
    await caller.library.save({
      title: "Test Prompt 1",
      prompt: "Test prompt content",
      framework: "CO-STAR",
    });

    // Get all saved prompts
    const prompts = await caller.library.getAll();

    expect(Array.isArray(prompts)).toBe(true);
    if (prompts.length > 0) {
      expect(prompts[0]).toHaveProperty("id");
      expect(prompts[0]).toHaveProperty("title");
      expect(prompts[0]).toHaveProperty("prompt");
      expect(prompts[0]).toHaveProperty("userId");
    }
  });

  it("should search saved prompts by title", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Save prompts
    await caller.library.save({
      title: "Email Writing Prompt",
      prompt: "Help me write professional emails",
    });

    await caller.library.save({
      title: "Code Review Prompt",
      prompt: "Help me review code",
    });

    // Search for email-related prompts
    const results = await caller.library.search({
      query: "email",
    });

    expect(Array.isArray(results)).toBe(true);
    if (results.length > 0) {
      expect(results[0].title.toLowerCase()).toContain("email");
    }
  });

  it("should search saved prompts by tags", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Save prompts with tags
    await caller.library.save({
      title: "Prompt 1",
      prompt: "Content 1",
      tags: "writing,creative",
    });

    await caller.library.save({
      title: "Prompt 2",
      prompt: "Content 2",
      tags: "coding,technical",
    });

    // Search by tag
    const results = await caller.library.search({
      query: "creative",
    });

    expect(Array.isArray(results)).toBe(true);
  });

  it("should delete saved prompt", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Save a prompt
    await caller.library.save({
      title: "Prompt to Delete",
      prompt: "This will be deleted",
    });

    // Get all prompts
    const promptsBefore = await caller.library.getAll();
    const promptToDelete = promptsBefore[0];

    if (promptToDelete) {
      // Delete it
      const result = await caller.library.delete({
        promptId: promptToDelete.id,
      });

      expect(result.success).toBe(true);
    }
  });

  it("should update saved prompt", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Save a prompt
    await caller.library.save({
      title: "Original Title",
      prompt: "Original content",
      tags: "original",
    });

    // Get the prompt
    const prompts = await caller.library.getAll();
    const prompt = prompts[0];

    if (prompt) {
      // Update it
      const result = await caller.library.update({
        promptId: prompt.id,
        title: "Updated Title",
        tags: "updated,modified",
      });

      expect(result.success).toBe(true);
    }
  });

  it("should filter library by user context", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Save multiple prompts
    await caller.library.save({
      title: "Test Prompt 1",
      prompt: "Content 1",
    });

    await caller.library.save({
      title: "Test Prompt 2",
      prompt: "Content 2",
    });

    // Get library
    const lib = await caller.library.getAll();

    // Should have the prompts we just saved
    expect(lib.length).toBeGreaterThan(0);
    expect(lib[0].userId).toBe(ctx.user.id);
  });

  it("should reject save without title", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.library.save({
        title: "",
        prompt: "Content",
      });
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.code).toBe("BAD_REQUEST");
    }
  });
});
