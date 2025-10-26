/**
 * Export Menu Component
 * Dropdown menu for exporting different data formats
 */

import { useState, useRef, useEffect } from "react";
import { Download, FileJson, Package, ChevronDown, Loader } from "lucide-react";
import {
  exportModelsViaBackend,
  exportCompleteProjectViaBackend,
} from "../../services/api/backendApi";

// ============================================================================
// Component Props
// ============================================================================

interface ExportMenuProps {
  projectId?: string;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export default function ExportMenu({
  projectId = "default",
  className = "",
}: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const handleExportModels = async () => {
    setIsOpen(false);
    setIsExporting(true);

    try {
      const result = await exportModelsViaBackend(projectId);
      showNotification("success", `✓ ${result.message}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to export models";
      showNotification("error", message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportComplete = async () => {
    setIsOpen(false);
    setIsExporting(true);

    try {
      const result = await exportCompleteProjectViaBackend(projectId);
      showNotification("success", `✓ ${result.message}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to export project";
      showNotification("error", message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      {/* Export Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
      >
        {isExporting ? (
          <Loader className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        <span>{isExporting ? "Exporting..." : "Export"}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          <div className="px-3 py-2 text-xs text-gray-500 font-medium uppercase tracking-wide border-b border-gray-100">
            Export Options
          </div>

          <button
            onClick={handleExportModels}
            className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
          >
            <FileJson className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-gray-900">
                Export Models
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                Save to public/data/models/ automatically
              </div>
            </div>
          </button>

          <button
            onClick={handleExportComplete}
            className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
          >
            <Package className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-gray-900">
                Export Complete Project
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                Save everything to public/data/ automatically
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Success/Error Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-top ${
            notification.type === "success"
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <div className="w-2 h-2 bg-green-500 rounded-full" />
            ) : (
              <div className="w-2 h-2 bg-red-500 rounded-full" />
            )}
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
