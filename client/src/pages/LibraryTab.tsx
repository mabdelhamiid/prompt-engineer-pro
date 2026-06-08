import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Loader2, Copy, Check, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

export default function LibraryTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const { data: allPrompts, isLoading } = trpc.library.getAll.useQuery();

  const deleteMutation = trpc.library.delete.useMutation({
    onSuccess: () => {
      toast.success("Prompt deleted from library");
      trpc.useUtils().library.getAll.invalidate();
    },
    onError: () => {
      toast.error("Failed to delete prompt");
    },
  });

  const displayPrompts = useMemo(() => {
    if (!allPrompts) return [];
    if (!searchQuery.trim()) return allPrompts;
    const q = searchQuery.toLowerCase();
    return allPrompts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.prompt.toLowerCase().includes(q) ||
        (p.tags && p.tags.toLowerCase().includes(q))
    );
  }, [allPrompts, searchQuery]);

  const handleCopy = async (text: string, promptId: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(promptId);
      setTimeout(() => setCopiedId(null), 2000);
      toast.success("Copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy to clipboard");
      console.error(error);
    }
  };

  const handleConfirmDelete = () => {
    if (deleteTarget !== null) {
      deleteMutation.mutate({ promptId: deleteTarget });
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

  const isEmpty = displayPrompts.length === 0;

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <Card className="p-6 border border-slate-200 bg-white">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by title, tags, or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border border-slate-200 rounded-lg"
          />
        </div>
      </Card>

      {/* Empty State */}
      {isEmpty && (
        <Card className="p-12 border border-slate-200 bg-slate-50 text-center">
          <div className="space-y-3">
            <p className="text-slate-600">
              {searchQuery ? "No prompts match your search" : "Your library is empty"}
            </p>
            <p className="text-sm text-slate-500">
              {searchQuery
                ? "Try a different search term"
                : "Generate or improve prompts and save them to build your library"}
            </p>
          </div>
        </Card>
      )}

      {/* Prompts Grid */}
      {!isEmpty && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {displayPrompts.map((savedPrompt) => (
            <Card
              key={savedPrompt.id}
              className="p-6 border border-slate-200 bg-white hover:shadow-md transition-shadow"
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">{savedPrompt.title}</h3>
                    {savedPrompt.framework && (
                      <p className="text-xs text-slate-500 mt-1">{savedPrompt.framework}</p>
                    )}
                  </div>
                  <Button
                    onClick={() => handleCopy(savedPrompt.prompt, savedPrompt.id)}
                    variant="ghost"
                    size="sm"
                    className="text-slate-600 hover:text-blue-600"
                    aria-label="Copy prompt"
                    title="Copy prompt"
                  >
                    {copiedId === savedPrompt.id ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {/* Prompt Preview */}
                <p className="text-sm text-slate-700 line-clamp-3">{savedPrompt.prompt}</p>

                {/* Tags */}
                {savedPrompt.tags && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {savedPrompt.tags.split(",").map((tag) => (
                      <span
                        key={tag.trim()}
                        className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded"
                      >
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                )}

                {/* Notes */}
                {savedPrompt.notes && (
                  <p className="text-xs text-slate-600 italic pt-2">{savedPrompt.notes}</p>
                )}

                {/* Delete Button */}
                <div className="pt-2 flex justify-end">
                  <Button
                    onClick={() => setDeleteTarget(savedPrompt.id)}
                    disabled={deleteMutation.isPending}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    aria-label="Delete prompt"
                    title="Delete prompt"
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
            Showing {displayPrompts.length} prompt{displayPrompts.length !== 1 ? "s" : ""}
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete prompt?</AlertDialogTitle>
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
