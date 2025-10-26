/**
 * Polygon Drawing Tool Component
 * Handles Main Complex polygon drawing and rendering
 */

import { Line, Circle, Group } from "react-konva";
import type { PolygonGeometry, Landmark } from "../../types/admin-config";

// ============================================================================
// Component Props
// ============================================================================

interface PolygonDrawingToolProps {
  landmarks: Landmark[];
  selectedId: string | null;
  tempPoints: Array<{ x: number; y: number }>;
  onSelect: (id: string) => void;
  isDrawingMode: boolean;
}

// ============================================================================
// Component
// ============================================================================

export default function PolygonDrawingTool({
  landmarks,
  selectedId,
  tempPoints,
  onSelect,
  isDrawingMode,
}: PolygonDrawingToolProps) {
  // Filter only complex landmarks with polygon geometry
  const complexLandmarks = landmarks.filter(
    (landmark) => landmark.type === "complex" && "vertices" in landmark.geometry
  );

  return (
    <Group>
      {/* Render existing polygons */}
      {complexLandmarks.map((landmark) => {
        const geometry = landmark.geometry as PolygonGeometry;
        const isSelected = landmark.id === selectedId;

        // Flatten points array for Konva Line component
        const points = geometry.vertices.flatMap((p) => [p.x, p.y]);

        return (
          <Group key={landmark.id}>
            {/* Polygon fill */}
            <Line
              points={points}
              closed
              fill={
                isSelected
                  ? "rgba(34, 197, 94, 0.2)"
                  : "rgba(59, 130, 246, 0.2)"
              }
              stroke={isSelected ? "#22c55e" : "#3b82f6"}
              strokeWidth={2}
              onClick={(e) => {
                e.cancelBubble = true; // Prevent event from bubbling to stage
                onSelect(landmark.id);
              }}
              onTap={(e) => {
                e.cancelBubble = true; // Prevent event from bubbling to stage
                onSelect(landmark.id);
              }}
              onMouseEnter={(e) => {
                if (!isDrawingMode) {
                  const container = e.target.getStage()?.container();
                  if (container) container.style.cursor = "pointer";
                }
              }}
              onMouseLeave={(e) => {
                const container = e.target.getStage()?.container();
                if (container)
                  container.style.cursor = isDrawingMode
                    ? "crosshair"
                    : "default";
              }}
            />

            {/* Vertex handles when selected */}
            {isSelected &&
              geometry.vertices.map((point, idx) => (
                <Circle
                  key={idx}
                  x={point.x}
                  y={point.y}
                  radius={4}
                  fill="#22c55e"
                  stroke="#fff"
                  strokeWidth={2}
                  onMouseEnter={(e) => {
                    const container = e.target.getStage()?.container();
                    if (container) container.style.cursor = "move";
                  }}
                  onMouseLeave={(e) => {
                    const container = e.target.getStage()?.container();
                    if (container) container.style.cursor = "default";
                  }}
                />
              ))}
          </Group>
        );
      })}

      {/* Render temporary drawing polygon */}
      {isDrawingMode && tempPoints.length > 0 && (
        <Group>
          {/* Temporary polygon lines */}
          {tempPoints.length > 1 && (
            <Line
              points={tempPoints.flatMap((p) => [p.x, p.y])}
              stroke="#f59e0b"
              strokeWidth={2}
              dash={[5, 5]}
            />
          )}

          {/* Temporary vertices */}
          {tempPoints.map((point, idx) => (
            <Circle
              key={idx}
              x={point.x}
              y={point.y}
              radius={idx === 0 && tempPoints.length >= 3 ? 8 : 4}
              fill={idx === 0 && tempPoints.length >= 3 ? "#22c55e" : "#f59e0b"}
              stroke="#fff"
              strokeWidth={2}
            />
          ))}

          {/* First vertex hint - larger circle when you can close */}
          {tempPoints.length >= 3 && (
            <Circle
              x={tempPoints[0].x}
              y={tempPoints[0].y}
              radius={12}
              stroke="#22c55e"
              strokeWidth={2}
              dash={[3, 3]}
              opacity={0.5}
            />
          )}
        </Group>
      )}
    </Group>
  );
}
