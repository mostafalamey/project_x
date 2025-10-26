/**
 * Canvas Controls Component
 * Zoom and pan controls for the canvas
 */

import { ZoomIn, ZoomOut, Maximize2, Move } from "lucide-react";
import { useCanvas } from "../../hooks/useCanvas";

// ============================================================================
// Component Props
// ============================================================================

interface CanvasControlsProps {
  imageWidth?: number;
  imageHeight?: number;
  canvasWidth?: number;
  canvasHeight?: number;
}

// ============================================================================
// Component
// ============================================================================

export default function CanvasControls({
  imageWidth,
  imageHeight,
  canvasWidth,
  canvasHeight,
}: CanvasControlsProps) {
  const { scale, zoomIn, zoomOut, zoomToFit, centerImage } = useCanvas();

  const handleZoomToFit = () => {
    if (imageWidth && imageHeight && canvasWidth && canvasHeight) {
      zoomToFit(canvasWidth, canvasHeight, imageWidth, imageHeight);
    }
  };

  const handleCenter = () => {
    if (imageWidth && imageHeight && canvasWidth && canvasHeight) {
      centerImage(canvasWidth, canvasHeight, imageWidth, imageHeight);
    }
  };

  const zoomPercentage = Math.round(scale * 100);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-lg border border-gray-200 p-2 flex items-center gap-2 z-10">
      {/* Zoom Out */}
      <button
        onClick={zoomOut}
        className="p-2 hover:bg-gray-100 rounded transition-colors"
        title="Zoom Out (Ctrl + -)"
      >
        <ZoomOut className="w-5 h-5 text-gray-700" />
      </button>

      {/* Zoom Level */}
      <div className="px-3 py-1 bg-gray-50 rounded min-w-[60px] text-center">
        <span className="text-sm font-medium text-gray-700">
          {zoomPercentage}%
        </span>
      </div>

      {/* Zoom In */}
      <button
        onClick={zoomIn}
        className="p-2 hover:bg-gray-100 rounded transition-colors"
        title="Zoom In (Ctrl + +)"
      >
        <ZoomIn className="w-5 h-5 text-gray-700" />
      </button>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Zoom to Fit */}
      <button
        onClick={handleZoomToFit}
        className="p-2 hover:bg-gray-100 rounded transition-colors"
        title="Fit to Screen (Ctrl + 0)"
        disabled={!imageWidth || !imageHeight}
      >
        <Maximize2 className="w-5 h-5 text-gray-700" />
      </button>

      {/* Center Image */}
      <button
        onClick={handleCenter}
        className="p-2 hover:bg-gray-100 rounded transition-colors"
        title="Center Image"
        disabled={!imageWidth || !imageHeight}
      >
        <Move className="w-5 h-5 text-gray-700" />
      </button>
    </div>
  );
}
