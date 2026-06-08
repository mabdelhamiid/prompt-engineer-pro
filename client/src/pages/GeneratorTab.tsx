import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useSessionStorage } from "@/hooks/useSessionStorage";
import { useCustomTabs } from "@/hooks/useCustomTabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import ComparisonView from "@/components/ComparisonView";
import { FRAMEWORKS, type Framework } from "@shared/const";

interface GeneratorState {
  idea: string;
  framework: Framework;
}

interface GeneratorTabProps {
  defaultFramework?: Framework;
  customSystemPrompt?: string;
  stateKey?: string;
}

export default function GeneratorTab({
  defaultFramework,
  customSystemPrompt,
  stateKey = "generator_state",
}: GeneratorTabProps) {
  const [state, setState] = useSessionStorage<GeneratorState>(stateKey, {
    idea: "",
    framework: defaultFramework ?? "CO-STAR",
  });

  const [showSaveAsTab, setShowSaveAsTab] = useState(false);
  const [tabName, setTabName] = useState("");
  const [tabDescription, setTabDescription] = useState("");

  const { createTab } = useCustomTabs();

  const generateMutation = trpc.prompt.generate.useMutation();
  const saveToLibraryMutation = trpc.library.save.useMutation({
    onSuccess: () => {
      toast.success("Prompt saved to library!");
    },
    onError: () => {
      toast.error("Failed to save prompt");
    },
  });

  const handleGenerate = async () => {
    if (!state.idea.trim()) {
      toast.error("Please enter an idea");
      return;
    }

    try {
      await generateMutation.mutateAsync({
        idea: state.idea,
        framework: state.framework,
        systemPromptOverride: customSystemPrompt || undefined,
      });
      toast.success("Prompt generated successfully!");
    } catch (error) {
      toast.error("Failed to generate prompt");
      console.error(error);
    }
  };

  const handleSaveAsCustomTab = () => {
    if (!tabName.trim()) {
      toast.error("Please enter a tab name");
      return;
    }

    try {
      createTab({
        name: tabName,
        description: tabDescription,
        framework: state.framework,
        systemPrompt: state.idea,
      });

      toast.success("Custom tab created from this generation logic!");
      setShowSaveAsTab(false);
      setTabName("");
      setTabDescription("");
    } catch (error) {
      toast.error("Failed to create custom tab");
      console.error(error);
    }
  };

  const generatedPrompt = generateMutation.data?.prompt;

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card className="p-6 border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Your Idea
            </label>
            <Textarea
              placeholder="Describe what you want the prompt to do. Be as detailed as you'd like..."
              value={state.idea}
              onChange={(e) => setState({ ...state, idea: e.target.value })}
              className="min-h-32 border border-slate-200 rounded-lg p-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {customSystemPrompt && (
            <div className="px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-xs font-semibold text-purple-700 mb-1">Custom Instructions Active</p>
              <p className="text-xs text-purple-600 line-clamp-2">{customSystemPrompt}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Framework
              </label>
              <Select
                value={state.framework}
                onValueChange={(value: Framework) => setState({ ...state, framework: value })}
              >
                <SelectTrigger className="border border-slate-200 rounded-lg hover:border-blue-300 transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FRAMEWORKS.map((fw) => (
                    <SelectItem key={fw} value={fw}>
                      {fw}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleGenerate}
                disabled={generateMutation.isPending}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-2 rounded-lg transition-all shadow-md hover:shadow-lg"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Prompt"
                )}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Output Section */}
      {generatedPrompt && (
        <div className="space-y-6">
          {/* Comparison View */}
          <ComparisonView
            originalLabel="Your Idea"
            originalContent={state.idea}
            improvedLabel="Generated Prompt"
            improvedContent={generatedPrompt}
            improvedSubtitle={`${state.framework} Framework`}
            improvedBgClass="bg-blue-50"
            improvedBorderClass="border-blue-200"
          />

          {/* Quick Actions */}
          <Card className="p-6 border border-slate-200 bg-white shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="border border-slate-200 hover:bg-slate-50 justify-start"
                onClick={() => {
                  const title = state.idea.substring(0, 50) || "Generated Prompt";
                  saveToLibraryMutation.mutate({
                    title,
                    prompt: generatedPrompt,
                    framework: state.framework,
                  });
                }}
                disabled={saveToLibraryMutation.isPending}
              >
                {saveToLibraryMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save to Library
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                className="border border-slate-200 hover:bg-slate-50 justify-start"
                onClick={() => setShowSaveAsTab(true)}
              >
                <Save className="w-4 h-4 mr-2" />
                Save as Custom Tab
              </Button>
            </div>
          </Card>

          {/* Save as Custom Tab Form */}
          {showSaveAsTab && (
            <Card className="p-6 border border-blue-200 bg-blue-50">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Save as Custom Tab</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Tab Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Email Writing"
                    value={tabName}
                    onChange={(e) => setTabName(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Description
                  </label>
                  <Textarea
                    placeholder="Describe this tab's purpose..."
                    value={tabDescription}
                    onChange={(e) => setTabDescription(e.target.value)}
                    className="min-h-20 border border-slate-200 rounded-lg p-3"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={handleSaveAsCustomTab}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg"
                  >
                    Create Tab
                  </Button>
                  <Button
                    onClick={() => {
                      setShowSaveAsTab(false);
                      setTabName("");
                      setTabDescription("");
                    }}
                    variant="outline"
                    className="border border-slate-200 hover:bg-slate-100"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
