/**
 * Circle Marker Tool Component
 * Handles POI (Point of Interest) marker placement and rendering
 */

import { Circle, Group } from "react-konva";
import type { CircleGeometry, Landmark } from "../../types/admin-config";

// ============================================================================
// Component Props
// ============================================================================

interface CircleMarkerToolProps {
  landmarks: Landmark[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onPlace: (x: number, y: number) => void;
  onUpdate: (id: string, updates: Partial<Landmark>) => void;
  isDrawingMode: boolean;
}

// ============================================================================
// Component
// ============================================================================

export default function CircleMarkerTool({
  landmarks,
  selectedId,
  onSelect,
  onPlace,
  onUpdate,
  isDrawingMode,
}: CircleMarkerToolProps) {
  // Filter only POI landmarks with circle geometry
  const poiLandmarks = landmarks.filter(
    (landmark) => landmark.type === "poi" && "center" in landmark.geometry
  );

  return (
    <Group>
      {poiLandmarks.map((landmark) => {
        const geometry = landmark.geometry as CircleGeometry;
        const isSelected = landmark.id === selectedId;

        return (
          <Group key={landmark.id}>
            {/* Main circle */}
            <Circle
              x={geometry.center.x}
              y={geometry.center.y}
              radius={geometry.radius}
              fill={
                isSelected
                  ? "rgba(59, 130, 246, 0.3)"
                  : "rgba(239, 68, 68, 0.3)"
              }
              stroke={isSelected ? "#3b82f6" : "#ef4444"}
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

            {/* Selection handles */}
            {isSelected && (
              <>
                {/* Center handle - draggable to move POI */}
                <Circle
                  x={geometry.center.x}
                  y={geometry.center.y}
                  radius={6}
                  fill="#3b82f6"
                  stroke="#fff"
                  strokeWidth={2}
                  draggable
                  onDragMove={(e) => {
                    const newX = e.target.x();
                    const newY = e.target.y();

                    // Update geometry with new center position
                    onUpdate(landmark.id, {
                      geometry: {
                        type: "circle",
                        center: { x: newX, y: newY },
                        radius: geometry.radius,
                      },
                    });
                  }}
                  onMouseEnter={(e) => {
                    const container = e.target.getStage()?.container();
                    if (container) container.style.cursor = "move";
                  }}
                  onMouseLeave={(e) => {
                    const container = e.target.getStage()?.container();
                    if (container) container.style.cursor = "default";
                  }}
                />

                {/* Radius handles (N, S, E, W) */}
                {[
                  { x: 0, y: -1 }, // North
                  { x: 0, y: 1 }, // South
                  { x: 1, y: 0 }, // East
                  { x: -1, y: 0 }, // West
                ].map((dir, idx) => (
                  <Circle
                    key={idx}
                    x={geometry.center.x + dir.x * geometry.radius}
                    y={geometry.center.y + dir.y * geometry.radius}
                    radius={4}
                    fill="#fff"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    onMouseEnter={(e) => {
                      const container = e.target.getStage()?.container();
                      if (container) container.style.cursor = "pointer";
                    }}
                    onMouseLeave={(e) => {
                      const container = e.target.getStage()?.container();
                      if (container) container.style.cursor = "default";
                    }}
                  />
                ))}
              </>
            )}
          </Group>
        );
      })}
    </Group>
  );
}
