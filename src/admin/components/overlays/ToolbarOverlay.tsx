/**
 * Toolbar Overlay Component
 * Fixed-position toolbar with drawing tools
 */

import { Tool } from "../../types/canvas";
import {
  MousePointer2,
  Circle,
  Pentagon,
  MoveHorizontal,
  Trash2,
} from "lucide-react";

// ============================================================================
// Component Props
// ============================================================================

interface ToolbarOverlayProps {
  currentTool: Tool;
  onToolChange: (tool: Tool) => void;
  onClearCanvas?: () => void;
  disabled?: boolean;
}

// ============================================================================
// Tool Definitions
// ============================================================================

const tools: Array<{
  id: Tool;
  icon: any;
  label: string;
  description: string;
}> = [
  {
    id: "select",
    icon: MousePointer2,
    label: "Select",
    description: "Select and move shapes",
  },
  {
    id: "circle",
    icon: Circle,
    label: "Circle",
    description: "Draw circles (POI landmarks)",
  },
  {
    id: "polygon",
    icon: Pentagon,
    label: "Polygon",
    description: "Draw polygons (complex boundaries)",
  },
  {
    id: "path",
    icon: MoveHorizontal,
    label: "Path",
    description: "Draw paths between landmarks",
  },
];

// ============================================================================
// Component
// ============================================================================

export default function ToolbarOverlay({
  currentTool,
  onToolChange,
  onClearCanvas,
  disabled = false,
}: ToolbarOverlayProps) {
  return (
    <div className="fixed top-20 left-6 bg-white rounded-lg shadow-lg border border-gray-200 p-2 flex flex-col gap-2 z-10">
      {/* Tools */}
      {tools.map((tool) => {
        const Icon = tool.icon;
        const isActive = currentTool === tool.id;

        return (
          <button
            key={tool.id}
            onClick={() => onToolChange(tool.id)}
            disabled={disabled}
            className={`p-3 rounded transition-colors ${
              isActive
                ? "bg-blue-600 text-white"
                : "text-gray-700 hover:bg-gray-100"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            title={`${tool.label}: ${tool.description}`}
          >
            <Icon className="w-5 h-5" />
          </button>
        );
      })}

      {/* Divider */}
      {onClearCanvas && (
        <>
          <div className="h-px bg-gray-300 my-1" />

          {/* Clear Canvas */}
          <button
            onClick={onClearCanvas}
            disabled={disabled}
            className={`p-3 rounded text-red-600 hover:bg-red-50 transition-colors ${
              disabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
            title="Clear Canvas"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </>
      )}
    </div>
  );
}
