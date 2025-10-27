/**
 * Status Bar Component
 * Fixed-position bottom bar with coordinates and zoom info
 */

import { useCanvas } from "../../hooks/useCanvas";
import { Point } from "../../types/admin-config";

// ============================================================================
// Component Props
// ============================================================================

interface StatusBarProps {
  mousePos?: Point | null;
  imageWidth?: number;
  imageHeight?: number;
  shapeCount?: number;
  additionalInfo?: React.ReactNode;
}

// ============================================================================
// Component
// ============================================================================

export default function StatusBar({
  mousePos,
  imageWidth,
  imageHeight,
  shapeCount,
  additionalInfo,
}: StatusBarProps) {
  const { scale, currentTool } = useCanvas();

  const zoomPercentage = Math.round(scale * 100);

  return (
    <div
      className="fixed bottom-0 left-0 right-0 h-8 bg-gray-800 text-gray-200 text-xs flex items-center justify-between px-4"
      style={{ zIndex: 10 }}
    >
      {/* Left Section */}
      <div className="flex items-center gap-6">
        {/* Current Tool */}
        <div className="flex items-center gap-2">
          <span className="text-gray-400">Tool:</span>
          <span className="font-medium capitalize">{currentTool}</span>
        </div>

        {/* Mouse Position */}
        {mousePos && (
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Position:</span>
            <span className="font-mono">
              {Math.round(mousePos.x)}, {Math.round(mousePos.y)}
            </span>
          </div>
        )}

        {/* Image Dimensions */}
        {imageWidth && imageHeight && (
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Image:</span>
            <span className="font-mono">
              {imageWidth} × {imageHeight}
            </span>
          </div>
        )}

        {/* Shape Count */}
        {shapeCount !== undefined && (
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Shapes:</span>
            <span className="font-medium">{shapeCount}</span>
          </div>
        )}
      </div>

      {/* Center Section */}
      {additionalInfo && (
        <div className="flex items-center">{additionalInfo}</div>
      )}

      {/* Right Section */}
      <div className="flex items-center gap-6">
        {/* Zoom Level */}
        <div className="flex items-center gap-2">
          <span className="text-gray-400">Zoom:</span>
          <span className="font-medium">{zoomPercentage}%</span>
        </div>
      </div>
    </div>
  );
}
