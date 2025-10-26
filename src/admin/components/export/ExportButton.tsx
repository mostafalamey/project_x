/**
 * Export Button Component
 * Button to export data to JSON with download
 */

import { useState } from "react";
import { Download, CheckCircle, AlertCircle, Loader } from "lucide-react";

// ============================================================================
// Component Props
// ============================================================================

interface ExportButtonProps {
  onExport: () => Promise<void>;
  label?: string;
  filename?: string;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export default function ExportButton({
  onExport,
  label = "Export",
  variant = "secondary",
  size = "md",
  className = "",
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setStatus("idle");
    setError(null);

    try {
      await onExport();
      setStatus("success");

      // Reset success status after 3 seconds
      setTimeout(() => {
        setStatus("idle");
      }, 3000);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Export failed");

      // Reset error status after 5 seconds
      setTimeout(() => {
        setStatus("idle");
        setError(null);
      }, 5000);
    } finally {
      setIsExporting(false);
    }
  };

  // Variant styles
  const variantStyles = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary:
      "bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-400",
    ghost: "bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-400",
  };

  // Size styles
  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  // Status styles
  const statusStyles = {
    success: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500",
    error: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
  };

  const baseStyles =
    "rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2";

  const buttonClasses = `${baseStyles} ${
    status === "success"
      ? statusStyles.success
      : status === "error"
      ? statusStyles.error
      : variantStyles[variant]
  } ${sizeStyles[size]} ${className}`;

  return (
    <div className="relative">
      <button
        onClick={handleExport}
        disabled={isExporting}
        className={buttonClasses}
        title={error || undefined}
      >
        {isExporting && <Loader className="w-4 h-4 animate-spin" />}
        {!isExporting && status === "success" && (
          <CheckCircle className="w-4 h-4" />
        )}
        {!isExporting && status === "error" && (
          <AlertCircle className="w-4 h-4" />
        )}
        {!isExporting && status === "idle" && <Download className="w-4 h-4" />}

        <span>
          {isExporting
            ? "Exporting..."
            : status === "success"
            ? "Exported!"
            : status === "error"
            ? "Failed"
            : label}
        </span>
      </button>

      {error && (
        <div className="absolute top-full left-0 mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800 whitespace-nowrap z-10 shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
}
