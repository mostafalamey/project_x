/**
 * Building Hotspot Tool Component
 * Handles building hotspot polygon drawing and rendering on master plan angles
 */

import { Line, Circle, Group, Text } from "react-konva";
import type {
  BuildingHotspot,
  BuildingReference,
} from "../../types/admin-config";
import type { Point } from "../../types/admin-config";

// ============================================================================
// Component Props
// ============================================================================

interface BuildingHotspotToolProps {
  hotspots: BuildingHotspot[];
  buildings: BuildingReference[];
  selectedBuildingId: string | null;
  selectedHotspotId: string | null;
  tempPoints: Point[];
  onSelect: (hotspotId: string) => void;
  onUpdateHotspot: (hotspotId: string, vertices: Point[]) => void;
  isDrawingMode: boolean;
}

// ============================================================================
// Component
// ============================================================================

export default function BuildingHotspotTool({
  hotspots,
  buildings,
  selectedBuildingId,
  selectedHotspotId,
  tempPoints,
  onSelect,
  onUpdateHotspot,
  isDrawingMode,
}: BuildingHotspotToolProps) {
  // Get building name helper
  const getBuildingName = (buildingId: string) => {
    const building = buildings.find((b) => b.id === buildingId);
    return building?.name || "Unknown Building";
  };

  // Get hotspot color based on selection
  const getHotspotColor = (buildingId: string) => {
    if (buildingId === selectedBuildingId) {
      return {
        fill: "rgba(34, 197, 94, 0.3)",
        stroke: "#22c55e",
      };
    }
    return {
      fill: "rgba(59, 130, 246, 0.2)",
      stroke: "#3b82f6",
    };
  };

  return (
    <Group>
      {/* Render existing hotspots */}
      {hotspots.map((hotspot) => {
        const colors = getHotspotColor(hotspot.buildingId);
        const points = hotspot.geometry.vertices.flatMap((p) => [p.x, p.y]);
        const buildingName = getBuildingName(hotspot.buildingId);

        // Calculate centroid for label
        const centroid = hotspot.geometry.vertices.reduce(
          (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
          { x: 0, y: 0 }
        );
        centroid.x /= hotspot.geometry.vertices.length;
        centroid.y /= hotspot.geometry.vertices.length;

        return (
          <Group key={hotspot.id}>
            {/* Polygon */}
            <Line
              points={points}
              closed
              fill={colors.fill}
              stroke={colors.stroke}
              strokeWidth={2}
              onClick={(e) => {
                e.cancelBubble = true;
                onSelect(hotspot.id);
              }}
              onTap={(e) => {
                e.cancelBubble = true;
                onSelect(hotspot.id);
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

            {/* Label */}
            <Text
              x={centroid.x}
              y={centroid.y}
              text={buildingName}
              fontSize={14}
              fontFamily="system-ui, -apple-system, sans-serif"
              fill={colors.stroke}
              fontStyle="bold"
              align="center"
              verticalAlign="middle"
              offsetX={buildingName.length * 3.5} // Approximate centering
              offsetY={7}
              listening={false}
            />

            {/* Vertex handles when hotspot is selected */}
            {selectedHotspotId === hotspot.id &&
              hotspot.geometry.vertices.map((point, idx) => (
                <Circle
                  key={idx}
                  x={point.x}
                  y={point.y}
                  radius={6}
                  fill={colors.stroke}
                  stroke="#fff"
                  strokeWidth={2}
                  draggable
                  onDragMove={(e) => {
                    // Update vertex position during drag
                    const newVertices = [...hotspot.geometry.vertices];
                    newVertices[idx] = {
                      x: e.target.x(),
                      y: e.target.y(),
                    };
                    onUpdateHotspot(hotspot.id, newVertices);
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
              ))}
          </Group>
        );
      })}

      {/* Render temporary polygon being drawn */}
      {tempPoints.length > 0 && (
        <Group>
          {/* Temporary line */}
          {tempPoints.length > 1 && (
            <Line
              points={tempPoints.flatMap((p) => [p.x, p.y])}
              stroke="#3b82f6"
              strokeWidth={2}
              dash={[5, 5]}
              listening={false}
            />
          )}

          {/* Temporary vertices */}
          {tempPoints.map((point, idx) => (
            <Circle
              key={idx}
              x={point.x}
              y={point.y}
              radius={idx === 0 ? 6 : 4}
              fill={idx === 0 ? "#22c55e" : "#3b82f6"}
              stroke="#fff"
              strokeWidth={2}
              listening={false}
            />
          ))}

          {/* Close indicator (snap to start) */}
          {tempPoints.length >= 3 && (
            <Circle
              x={tempPoints[0].x}
              y={tempPoints[0].y}
              radius={12}
              stroke="#22c55e"
              strokeWidth={2}
              dash={[4, 4]}
              listening={false}
            />
          )}
        </Group>
      )}
    </Group>
  );
}
