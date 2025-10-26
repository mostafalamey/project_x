/**
 * Admin Header Component
 * Top header bar with project name and autosave indicator
 */

import { useProjectStore } from "../../stores/projectStore";
import { Save, CheckCircle, AlertCircle } from "lucide-react";
import { useAutosave } from "../../hooks/useAutosave";
import { useEffect } from "react";

// ============================================================================
// Component
// ============================================================================

export default function AdminHeader() {
  const { config } = useProjectStore();
  const { isSaving, lastSaved, hasUnsavedChanges, error } = useAutosave();

  // Format last saved time
  const formatLastSaved = (date: Date | null) => {
    if (!date) return null;

    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      {/* Project Info */}
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {config?.name || "No Project Loaded"}
        </h2>
        {config?.slug && (
          <span className="text-sm text-gray-500">({config.slug})</span>
        )}
      </div>

      {/* Autosave Status */}
      <div className="flex items-center gap-2">
        {isSaving && (
          <div className="flex items-center gap-2 text-blue-600">
            <Save className="w-4 h-4 animate-pulse" />
            <span className="text-sm">Saving...</span>
          </div>
        )}

        {!isSaving && hasUnsavedChanges && (
          <div className="flex items-center gap-2 text-amber-600">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">Unsaved changes</span>
          </div>
        )}

        {!isSaving && !hasUnsavedChanges && lastSaved && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">Saved {formatLastSaved(lastSaved)}</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm" title={error}>
              Save failed
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
