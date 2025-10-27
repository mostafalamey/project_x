/**
 * Project Export Button Component
 * Handles full project export to ZIP
 */

import { useState } from "react";
import { Download, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { aggregateProjectData } from "../../services/export/projectAggregator";
import { exportProjectToZip } from "../../services/export/zipGenerator";
import { useProjectStore } from "../../stores/projectStore";

// ============================================================================
// Component
// ============================================================================

export default function ProjectExportButton() {
  const { config: projectConfig } = useProjectStore();
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleExport = async () => {
    if (!projectConfig) {
      alert("No project loaded. Please create or load a project first.");
      return;
    }

    setIsExporting(true);
    setExportStatus("idle");
    setErrorMessage("");

    try {
      // Aggregate all project data
      const projectData = await aggregateProjectData(projectConfig.id);

      // Generate and download ZIP
      await exportProjectToZip(projectData, projectConfig.name || "project");

      setExportStatus("success");
      setTimeout(() => setExportStatus("idle"), 3000);
    } catch (error) {
      console.error("Export failed:", error);
      setExportStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Unknown error");
      setTimeout(() => setExportStatus("idle"), 5000);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleExport}
        disabled={isExporting || !projectConfig}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
          ${
            isExporting || !projectConfig
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : exportStatus === "success"
              ? "bg-green-600 text-white"
              : exportStatus === "error"
              ? "bg-red-600 text-white"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }
        `}
        title={
          !projectConfig
            ? "No project loaded"
            : "Export full project to ZIP file"
        }
      >
        {isExporting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Exporting...
          </>
        ) : exportStatus === "success" ? (
          <>
            <CheckCircle className="w-5 h-5" />
            Exported!
          </>
        ) : exportStatus === "error" ? (
          <>
            <AlertCircle className="w-5 h-5" />
            Export Failed
          </>
        ) : (
          <>
            <Download className="w-5 h-5" />
            Export Project
          </>
        )}
      </button>

      {/* Error Message */}
      {exportStatus === "error" && errorMessage && (
        <div className="absolute top-full left-0 mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 max-w-md shadow-lg z-50">
          <p className="font-medium">Export failed:</p>
          <p className="mt-1">{errorMessage}</p>
        </div>
      )}

      {/* No Project Warning */}
      {!projectConfig && !isExporting && (
        <div className="absolute top-full right-0 mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 max-w-xs shadow-lg z-50">
          <p className="font-medium mb-1">No project loaded</p>
          <p>
            The page is initializing your project. If this persists, go to{" "}
            <strong>Project Settings</strong> to create or configure your
            project.
          </p>
        </div>
      )}
    </div>
  );
}
