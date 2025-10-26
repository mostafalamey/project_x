/**
 * Path Style Editor Component
 * Properties panel for editing path styles and deleting paths
 */

import { useState, useEffect } from "react";
import { X, Save, Trash2, Route } from "lucide-react";
import type { LandmarkPath } from "../../types/admin-config";

// ============================================================================
// Component Props
// ============================================================================

interface PathStyleEditorProps {
  path: LandmarkPath | null;
  onSave: (updates: Partial<LandmarkPath>) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

// ============================================================================
// Component
// ============================================================================

export default function PathStyleEditor({
  path,
  onSave,
  onDelete,
  onClose,
}: PathStyleEditorProps) {
  const [formData, setFormData] = useState({
    stroke: "#000000",
    strokeWidth: "2",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form when path changes
  useEffect(() => {
    if (path) {
      setFormData({
        stroke: path.style?.stroke || "#000000",
        strokeWidth: path.style?.strokeWidth?.toString() || "2",
      });
      setErrors({});
    }
  }, [path]);

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    const width = parseFloat(formData.strokeWidth);
    if (isNaN(width) || width <= 0) {
      newErrors.strokeWidth = "Width must be a positive number";
    }

    if (width > 20) {
      newErrors.strokeWidth = "Width must be 20 or less";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save
  const handleSave = () => {
    if (!path || !validate()) return;

    const updates: Partial<LandmarkPath> = {
      style: {
        stroke: formData.stroke,
        strokeWidth: parseFloat(formData.strokeWidth),
      },
    };

    onSave(updates);
  };

  // Handle delete
  const handleDelete = () => {
    if (!path) return;

    if (window.confirm(`Delete this path? This action cannot be undone.`)) {
      onDelete(path.id);
      onClose();
    }
  };

  if (!path) return null;

  return (
    <div className="absolute right-0 top-0 bottom-0 w-96 bg-white shadow-2xl flex flex-col z-10 border-l border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Route className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Edit Path Style
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          title="Close"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Stroke Color */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Line Color
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={formData.stroke}
              onChange={(e) =>
                setFormData({ ...formData, stroke: e.target.value })
              }
              className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
              title="Select color"
            />
            <input
              type="text"
              value={formData.stroke}
              onChange={(e) =>
                setFormData({ ...formData, stroke: e.target.value })
              }
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              placeholder="#000000"
            />
          </div>
        </div>

        {/* Stroke Width */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Line Width (pixels)
          </label>
          <input
            type="text"
            value={formData.strokeWidth}
            onChange={(e) =>
              setFormData({ ...formData, strokeWidth: e.target.value })
            }
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.strokeWidth ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="e.g., 2"
          />
          {errors.strokeWidth && (
            <p className="text-red-500 text-sm mt-1">{errors.strokeWidth}</p>
          )}
        </div>

        {/* Preview */}
        <div className="pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Preview</h4>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <svg width="100%" height="60" className="overflow-visible">
              <line
                x1="20"
                y1="30"
                x2="calc(100% - 20)"
                y2="30"
                stroke={formData.stroke}
                strokeWidth={formData.strokeWidth}
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Path Info */}
        <div className="pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Path Info</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>From: Main Complex</p>
            <p>To: POI</p>
            <p className="text-xs text-gray-500 mt-2 font-mono break-all">
              {path.pathData.substring(0, 80)}
              {path.pathData.length > 80 ? "..." : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-200 flex gap-2">
        <button
          onClick={handleSave}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Save className="w-4 h-4" />
          Save Changes
        </button>
        <button
          onClick={handleDelete}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          title="Delete Path"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
