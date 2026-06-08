import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ComparisonViewProps {
  originalLabel: string;
  originalContent: string;
  improvedLabel: string;
  improvedContent: string;
  improvedSubtitle?: string;
  originalBgClass?: string;
  improvedBgClass?: string;
  improvedBorderClass?: string;
}

export default function ComparisonView({
  originalLabel,
  originalContent,
  improvedLabel,
  improvedContent,
  improvedSubtitle,
  originalBgClass = "bg-white",
  improvedBgClass = "bg-blue-50",
  improvedBorderClass = "border-blue-200",
}: ComparisonViewProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (text: string, id: string) => {
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Original */}
      <Card className={`p-6 border border-slate-200 ${originalBgClass}`}>
        <h3 className="text-sm font-semibold text-slate-900 mb-3">{originalLabel}</h3>
        <p className="text-slate-700 whitespace-pre-wrap text-sm">{originalContent}</p>
      </Card>

      {/* Improved */}
      <Card className={`p-6 border ${improvedBorderClass} ${improvedBgClass}`}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{improvedLabel}</h3>
            {improvedSubtitle && (
              <p className="text-xs text-slate-600 mt-1">{improvedSubtitle}</p>
            )}
          </div>
          <Button
            onClick={() => handleCopy(improvedContent, "improved")}
            variant="ghost"
            size="sm"
            className="text-slate-600 hover:text-blue-600"
            aria-label="Copy improved prompt"
            title="Copy improved prompt"
          >
            {copiedId === "improved" ? (
              <Check className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-slate-700 whitespace-pre-wrap text-sm">{improvedContent}</p>
      </Card>
    </div>
  );
}
