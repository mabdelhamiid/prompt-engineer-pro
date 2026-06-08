import { useState } from "react";
import { useCustomTabs, type CustomTab } from "@/hooks/useCustomTabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { Plus, Trash2, Edit2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { FRAMEWORKS, type Framework } from "@shared/const";

export default function CustomTabsTab() {
  const { tabs, createTab, updateTab, deleteTab } = useCustomTabs();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    framework: Framework;
    systemPrompt: string;
    temperature: number;
  }>({
    name: "",
    description: "",
    framework: "CO-STAR",
    systemPrompt: "",
    temperature: 0.7,
  });

  const handleCreateTab = () => {
    if (!formData.name.trim()) {
      toast.error("Please enter a tab name");
      return;
    }

    try {
      createTab({
        name: formData.name,
        description: formData.description,
        framework: formData.framework,
        systemPrompt: formData.systemPrompt,
        temperature: formData.temperature,
      });

      toast.success("Custom tab created!");
      setFormData({
        name: "",
        description: "",
        framework: "CO-STAR",
        systemPrompt: "",
        temperature: 0.7,
      });
      setShowCreateForm(false);
    } catch (error) {
      toast.error("Failed to create custom tab");
      console.error(error);
    }
  };

  const handleUpdateTab = (id: string) => {
    if (!formData.name.trim()) {
      toast.error("Please enter a tab name");
      return;
    }

    try {
      updateTab(id, {
        name: formData.name,
        description: formData.description,
        framework: formData.framework,
        systemPrompt: formData.systemPrompt,
        temperature: formData.temperature,
      });

      toast.success("Custom tab updated!");
      setEditingId(null);
      setFormData({
        name: "",
        description: "",
        framework: "CO-STAR",
        systemPrompt: "",
        temperature: 0.7,
      });
    } catch (error) {
      toast.error("Failed to update custom tab");
      console.error(error);
    }
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      deleteTab(deleteTarget);
      toast.success("Custom tab deleted");
      setDeleteTarget(null);
    }
  };

  const handleEditTab = (tab: CustomTab) => {
    setEditingId(tab.id);
    setFormData({
      name: tab.name,
      description: tab.description || "",
      framework: tab.framework,
      systemPrompt: tab.systemPrompt || "",
      temperature: tab.temperature || 0.7,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setShowCreateForm(false);
    setFormData({
      name: "",
      description: "",
      framework: "CO-STAR",
      systemPrompt: "",
      temperature: 0.7,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Custom Tabs</h2>
          <p className="text-slate-600 text-sm mt-1">
            Create reusable generation logic templates for your workflows
          </p>
        </div>
        {!showCreateForm && editingId === null && (
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Tab
          </Button>
        )}
      </div>

      {/* Create/Edit Form */}
      {(showCreateForm || editingId) && (
        <Card className="p-6 border border-blue-200 bg-blue-50">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            {editingId ? "Edit Custom Tab" : "Create Custom Tab"}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Tab Name *
              </label>
              <Input
                placeholder="e.g., Email Writing, Code Review"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Description
              </label>
              <Textarea
                placeholder="Describe what this tab is for..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="min-h-20 border border-slate-200 rounded-lg p-3"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Framework
                </label>
                <Select
                  value={formData.framework}
                  onValueChange={(value: Framework) =>
                    setFormData({ ...formData, framework: value })
                  }
                >
                  <SelectTrigger className="border border-slate-200 rounded-lg">
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

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Temperature (0-1)
                </label>
                <Input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={formData.temperature}
                  onChange={(e) =>
                    setFormData({ ...formData, temperature: parseFloat(e.target.value) })
                  }
                  className="border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                System Prompt (Optional)
              </label>
              <Textarea
                placeholder="Custom system instructions for this tab..."
                value={formData.systemPrompt}
                onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                className="min-h-24 border border-slate-200 rounded-lg p-3"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={() =>
                  editingId
                    ? handleUpdateTab(editingId)
                    : handleCreateTab()
                }
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg"
              >
                <Check className="w-4 h-4 mr-2" />
                {editingId ? "Update" : "Create"}
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                className="border border-slate-200 hover:bg-slate-100"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Tabs List */}
      {tabs.length === 0 && !showCreateForm && editingId === null ? (
        <Card className="p-12 border border-slate-200 bg-slate-50 text-center">
          <div className="space-y-3">
            <p className="text-slate-600">No custom tabs yet</p>
            <p className="text-sm text-slate-500">
              Create your first custom tab to save generation logic templates
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tabs.map((tab) => (
            <Card key={tab.id} className="p-6 border border-slate-200 bg-white hover:shadow-md transition-shadow">
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">{tab.name}</h3>
                    {tab.description && (
                      <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                        {tab.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 py-3 border-t border-b border-slate-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Framework:</span>
                    <span className="font-semibold text-blue-600">{tab.framework}</span>
                  </div>
                  {tab.temperature !== undefined && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Temperature:</span>
                      <span className="font-semibold text-slate-900">{tab.temperature}</span>
                    </div>
                  )}
                  {tab.systemPrompt && (
                    <div className="text-sm">
                      <span className="text-slate-600">System Prompt:</span>
                      <p className="text-slate-700 mt-1 line-clamp-2 italic">
                        "{tab.systemPrompt}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Metadata */}
                <div className="text-xs text-slate-500">
                  Created {new Date(tab.createdAt).toLocaleDateString()}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => handleEditTab(tab)}
                    variant="outline"
                    size="sm"
                    className="flex-1 border border-slate-200 hover:bg-slate-50"
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    onClick={() => setDeleteTarget(tab.id)}
                    variant="outline"
                    size="sm"
                    className="flex-1 border border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete custom tab?</AlertDialogTitle>
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
