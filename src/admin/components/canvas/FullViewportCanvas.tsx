/**
 * Full Viewport Canvas Component
 * Konva Stage at 100vw × 100vh for drawing on images
 */

import { useRef, useEffect, useState } from "react";
import { Stage, Layer, Image as KonvaImage } from "react-konva";
import { useCanvas } from "../../hooks/useCanvas";
import useImage from "use-image";

// ============================================================================
// Component Props
// ============================================================================

interface FullViewportCanvasProps {
  imageUrl?: string;
  children?: React.ReactNode;
  onCanvasReady?: (stage: any) => void;
}

// ============================================================================
// Component
// ============================================================================

export default function FullViewportCanvas({
  imageUrl,
  children,
  onCanvasReady,
}: FullViewportCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const { scale, offset, setScale, setOffset, zoomToFit, panBy } = useCanvas();

  const [image] = useImage(imageUrl || "", "anonymous");

  // Update canvas dimensions on mount and resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);

    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Fit image to canvas on load
  useEffect(() => {
    if (image && dimensions.width > 0 && dimensions.height > 0) {
      zoomToFit(dimensions.width, dimensions.height, image.width, image.height);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image, dimensions.width, dimensions.height]);

  // Notify parent when canvas is ready
  useEffect(() => {
    if (stageRef.current && onCanvasReady) {
      onCanvasReady(stageRef.current);
    }
  }, [onCanvasReady]);

  // Handle mouse wheel zoom
  const handleWheel = (e: any) => {
    e.evt.preventDefault();

    const stage = e.target.getStage();
    const oldScale = scale;
    const pointer = stage.getPointerPosition();

    // Zoom factor
    const scaleBy = 1.1;
    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;

    // Constrain scale
    const constrainedScale = Math.max(0.1, Math.min(5, newScale));

    // Calculate new offset to zoom towards pointer
    const mousePointTo = {
      x: (pointer.x - offset.x) / oldScale,
      y: (pointer.y - offset.y) / oldScale,
    };

    const newOffset = {
      x: pointer.x - mousePointTo.x * constrainedScale,
      y: pointer.y - mousePointTo.y * constrainedScale,
    };

    setScale(constrainedScale);
    setOffset(newOffset);
  };

  // Handle drag/pan
  const handleDragEnd = (e: any) => {
    const stage = e.target.getStage();
    setOffset({
      x: stage.x(),
      y: stage.y(),
    });
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-gray-900 overflow-hidden"
      style={{ zIndex: 0 }}
    >
      {dimensions.width > 0 && dimensions.height > 0 && (
        <Stage
          ref={stageRef}
          width={dimensions.width}
          height={dimensions.height}
          scaleX={scale}
          scaleY={scale}
          x={offset.x}
          y={offset.y}
          draggable
          onWheel={handleWheel}
          onDragEnd={handleDragEnd}
        >
          <Layer>
            {/* Background Image */}
            {image && (
              <KonvaImage image={image} x={0} y={0} listening={false} />
            )}

            {/* Custom shapes/overlays */}
            {children}
          </Layer>
        </Stage>
      )}

      {!imageUrl && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-gray-400 text-lg">No image loaded</p>
        </div>
      )}
    </div>
  );
}
