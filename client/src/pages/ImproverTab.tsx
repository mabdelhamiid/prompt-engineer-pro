import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useSessionStorage } from "@/hooks/useSessionStorage";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ChevronDown, ChevronUp, Save } from "lucide-react";
import { toast } from "sonner";
import ComparisonView from "@/components/ComparisonView";
import { FRAMEWORKS, type Framework } from "@shared/const";

interface ImprovementDimension {
  before: string;
  after: string;
  explanation: string;
}

interface ImproverState {
  prompt: string;
  framework: Framework;
}

export default function ImproverTab() {
  const [state, setState] = useSessionStorage<ImproverState>("improver_state", {
    prompt: "",
    framework: "CO-STAR",
  });

  const [expandedDimension, setExpandedDimension] = useState<string | null>(null);
  const [saveTitle, setSaveTitle] = useState("");
  const [saveTags, setSaveTags] = useState("");
  const [saveNotes, setSaveNotes] = useState("");
  const [showSaveForm, setShowSaveForm] = useState(false);

  const improveMutation = trpc.prompt.improve.useMutation();
  const saveToLibraryMutation = trpc.library.save.useMutation({
    onSuccess: () => {
      toast.success("Prompt saved to library!");
      setShowSaveForm(false);
      setSaveTitle("");
      setSaveTags("");
      setSaveNotes("");
    },
    onError: () => {
      toast.error("Failed to save prompt");
    },
  });

  const handleImprove = async () => {
    if (!state.prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    try {
      await improveMutation.mutateAsync({
        prompt: state.prompt,
        framework: state.framework,
      });
      toast.success("Prompt improved successfully!");
    } catch (error) {
      toast.error("Failed to improve prompt");
      console.error(error);
    }
  };

  const data = improveMutation.data;
  const breakdown = data?.breakdown;

  const handleSaveToLibrary = () => {
    if (!saveTitle.trim() || !data) {
      toast.error("Please enter a title");
      return;
    }

    saveToLibraryMutation.mutate({
      title: saveTitle,
      prompt: data.improvedPrompt,
      framework: data.framework,
      tags: saveTags || undefined,
      notes: saveNotes || undefined,
    });
  };

  const dimensions = [
    { key: "clarity", label: "Clarity", icon: "✨" },
    { key: "specificity", label: "Specificity", icon: "🎯" },
    { key: "context", label: "Context", icon: "📚" },
    { key: "tone", label: "Tone", icon: "🎭" },
    { key: "constraints", label: "Constraints", icon: "📋" },
  ];

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card className="p-6 border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Your Prompt
            </label>
            <Textarea
              placeholder="Paste your existing prompt here for analysis and improvement..."
              value={state.prompt}
              onChange={(e) => setState({ ...state, prompt: e.target.value })}
              className="min-h-32 border border-slate-200 rounded-lg p-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

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
                onClick={handleImprove}
                disabled={improveMutation.isPending}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-2 rounded-lg transition-all shadow-md hover:shadow-lg"
              >
                {improveMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  "Analyze & Improve"
                )}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Output Section */}
      {data && (
        <div className="space-y-6">
          {/* Comparison View */}
          <ComparisonView
            originalLabel="Original Prompt"
            originalContent={data.originalPrompt}
            improvedLabel="Improved Prompt"
            improvedContent={data.improvedPrompt}
            improvedSubtitle={`${data.framework} Framework`}
            improvedBgClass="bg-green-50"
            improvedBorderClass="border-green-200"
          />

          {/* Improvement Breakdown */}
          {breakdown && (
            <Card className="p-6 border border-slate-200 bg-white shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Improvement Breakdown</h3>
              <div className="space-y-3">
                {dimensions.map(({ key, label, icon }) => {
                  const dim = breakdown[key as keyof typeof breakdown] as ImprovementDimension;
                  const isExpanded = expandedDimension === key;

                  return (
                    <div key={key} className="border border-slate-200 rounded-lg overflow-hidden hover:border-slate-300 transition-colors">
                      <button
                        onClick={() => setExpandedDimension(isExpanded ? null : key)}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{icon}</span>
                          <span className="font-semibold text-slate-900">{label}</span>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-600" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-600" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 space-y-3">
                          <div>
                            <p className="text-xs font-semibold text-slate-600 mb-1">Before</p>
                            <p className="text-sm text-slate-700 italic">{dim.before || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-600 mb-1">After</p>
                            <p className="text-sm text-slate-700 italic">{dim.after || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-600 mb-1">Why</p>
                            <p className="text-sm text-slate-700">{dim.explanation}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Save to Library Section */}
          {!showSaveForm ? (
            <Card className="p-6 border border-slate-200 bg-white shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Quick Actions</h3>
              <Button
                variant="outline"
                className="border border-slate-200 hover:bg-slate-50 justify-start"
                onClick={() => setShowSaveForm(true)}
              >
                <Save className="w-4 h-4 mr-2" />
                Save to Library
              </Button>
            </Card>
          ) : (
            <Card className="p-6 border border-blue-200 bg-blue-50">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Save to Library</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Title *
                  </label>
                  <Input
                    placeholder="Give this prompt a memorable title..."
                    value={saveTitle}
                    onChange={(e) => setSaveTitle(e.target.value)}
                    className="border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Tags (comma-separated)
                  </label>
                  <Input
                    placeholder="e.g., writing, creative, brainstorm"
                    value={saveTags}
                    onChange={(e) => setSaveTags(e.target.value)}
                    className="border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Notes
                  </label>
                  <Textarea
                    placeholder="Add any notes about this prompt..."
                    value={saveNotes}
                    onChange={(e) => setSaveNotes(e.target.value)}
                    className="min-h-20 border border-slate-200 rounded-lg p-3"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={handleSaveToLibrary}
                    disabled={saveToLibraryMutation.isPending}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg"
                  >
                    {saveToLibraryMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save"
                    )}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowSaveForm(false);
                      setSaveTitle("");
                      setSaveTags("");
                      setSaveNotes("");
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
