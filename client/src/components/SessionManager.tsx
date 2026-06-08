import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";

/**
 * Session Manager Component
 * Provides utilities for managing user session state
 */
export function SessionManager() {
  const handleClearSession = useCallback(() => {
    if (
      confirm(
        "Are you sure you want to clear your session? This will reset all saved inputs and preferences."
      )
    ) {
      try {
        // Clear all prompt engineer related localStorage
        const keysToRemove = [
          "home_active_tab",
          "generator_state",
          "improver_state",
          "prompt_engineer_custom_tabs",
        ];

        keysToRemove.forEach((key) => {
          localStorage.removeItem(key);
        });

        toast.success("Session cleared successfully");
        // Reload to apply changes
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } catch (error) {
        toast.error("Failed to clear session");
        console.error(error);
      }
    }
  }, []);

  const handleExportSession = useCallback(() => {
    try {
      const sessionData = {
        activeTab: localStorage.getItem("home_active_tab"),
        generatorState: localStorage.getItem("generator_state"),
        improverState: localStorage.getItem("improver_state"),
        customTabs: localStorage.getItem("prompt_engineer_custom_tabs"),
        exportedAt: new Date().toISOString(),
      };

      const dataStr = JSON.stringify(sessionData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `prompt-engineer-session-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success("Session exported successfully");
    } catch (error) {
      toast.error("Failed to export session");
      console.error(error);
    }
  }, []);

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportSession}
        className="border border-slate-200 hover:bg-slate-50 text-xs"
        title="Export your current session state"
      >
        <RotateCcw className="w-3 h-3 mr-1" />
        Export
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleClearSession}
        className="border border-red-200 text-red-600 hover:bg-red-50 text-xs"
        title="Clear all session data"
      >
        <Trash2 className="w-3 h-3 mr-1" />
        Clear
      </Button>
    </div>
  );
}
