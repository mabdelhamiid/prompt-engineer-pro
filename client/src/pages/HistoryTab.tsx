import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Trash2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

export default function HistoryTab() {
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const { data: history, isLoading } = trpc.prompt.getHistory.useQuery({
    limit: 100,
  });

  const deleteMutation = trpc.prompt.deleteHistory.useMutation({
    onSuccess: () => {
      toast.success("History item deleted");
      trpc.useUtils().prompt.getHistory.invalidate();
    },
    onError: () => {
      toast.error("Failed to delete history item");
    },
  });

  const handleCopy = async (text: string, id: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      toast.success("Copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy to clipboard");
      console.error(error);
    }
  };

  const handleConfirmDelete = () => {
    if (deleteTarget !== null) {
      deleteMutation.mutate({ historyId: deleteTarget });
      setDeleteTarget(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-slate-600" />
      </div>
    );
  }

  const isEmpty = !history || history.length === 0;

  return (
    <div className="space-y-6">
      {/* Empty State */}
      {isEmpty && (
        <Card className="p-12 border border-slate-200 bg-slate-50 text-center">
          <div className="space-y-3">
            <p className="text-slate-600">Your history is empty</p>
            <p className="text-sm text-slate-500">
              Generate or improve prompts to see them appear here
            </p>
          </div>
        </Card>
      )}

      {/* History Items */}
      {!isEmpty && (
        <div className="space-y-4">
          {history?.map((item) => (
            <Card
              key={item.id}
              className="p-6 border border-slate-200 bg-white hover:shadow-md transition-shadow"
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-block px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded">
                        {item.type === "generation" ? "Generated" : "Improved"}
                      </span>
                      <span className="text-xs text-slate-500">{item.framework}</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleCopy(item.outputPrompt, item.id)}
                    variant="ghost"
                    size="sm"
                    className="text-slate-600 hover:text-blue-600"
                    aria-label="Copy prompt"
                    title="Copy prompt"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {/* Input */}
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-1">
                    {item.type === "generation" ? "Your Idea" : "Original Prompt"}
                  </p>
                  <p className="text-sm text-slate-700 line-clamp-2">{item.inputText}</p>
                </div>

                {/* Output */}
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-1">
                    {item.type === "generation" ? "Generated Prompt" : "Improved Prompt"}
                  </p>
                  <p className="text-sm text-slate-700 line-clamp-3">{item.outputPrompt}</p>
                </div>

                {/* Improvement Breakdown (if available) */}
                {item.improvementBreakdown && (
                  <div className="pt-2 border-t border-slate-200">
                    <p className="text-xs font-semibold text-slate-600 mb-2">Improvements</p>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {Object.entries(item.improvementBreakdown).map(([key, value]: [string, any]) => (
                        <div
                          key={key}
                          className="px-2 py-1 bg-slate-50 rounded text-xs"
                        >
                          <p className="font-semibold text-slate-900 capitalize">{key}</p>
                          <p className="text-slate-600 line-clamp-1">{value.explanation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Delete Button */}
                <div className="pt-2 flex justify-end">
                  <Button
                    onClick={() => setDeleteTarget(item.id)}
                    disabled={deleteMutation.isPending}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    aria-label="Delete history item"
                    title="Delete history item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Stats */}
      {!isEmpty && (
        <Card className="p-4 border border-slate-200 bg-slate-50">
          <p className="text-sm text-slate-600">
            Showing {history?.length || 0} item{(history?.length || 0) !== 1 ? "s" : ""} in history
          </p>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete history item?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
