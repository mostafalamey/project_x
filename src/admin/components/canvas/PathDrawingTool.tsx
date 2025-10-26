/**
 * Path Drawing Tool Component
 * Handles drawing and rendering paths between landmarks with custom polyline paths
 */

import { Line, Circle, Group } from "react-konva";
import type { Landmark, LandmarkPath, Point } from "../../types/admin-config";

// ============================================================================
// Component Props
// ============================================================================

interface PathDrawingToolProps {
  landmarks: Landmark[];
  paths: LandmarkPath[];
  selectedPathId: string | null;
  tempPathPoints: Point[];
  onSelect: (id: string | null) => void;
  onPathCreate: (fromId: string, toId: string) => void;
  onPathUpdate?: (pathId: string, newPathData: string) => void;
  isDrawingMode: boolean;
  tempPathStart: string | null;
}

// ============================================================================
// Helper Functions
// ============================================================================

// Get the center point of a landmark
function getLandmarkCenter(landmark: Landmark): Point {
  if ("center" in landmark.geometry) {
    return landmark.geometry.center;
  } else if ("vertices" in landmark.geometry) {
    // Calculate centroid of polygon
    const vertices = landmark.geometry.vertices;
    const sum = vertices.reduce(
      (acc, v) => ({ x: acc.x + v.x, y: acc.y + v.y }),
      { x: 0, y: 0 }
    );
    return {
      x: sum.x / vertices.length,
      y: sum.y / vertices.length,
    };
  }
  return { x: 0, y: 0 };
}

// Parse SVG path data into points array for rendering
function parsePathData(pathData: string): Point[] {
  const points: Point[] = [];

  // Simple parser for "M x y L x y L x y" format
  const commands = pathData.trim().split(/\s+/);

  for (let i = 0; i < commands.length; i++) {
    if (commands[i] === "M" || commands[i] === "L") {
      const x = parseFloat(commands[i + 1]);
      const y = parseFloat(commands[i + 2]);
      if (!isNaN(x) && !isNaN(y)) {
        points.push({ x, y });
      }
      i += 2;
    }
  }

  return points;
}

// Generate SVG path data from points array
function generatePathData(points: Point[]): string {
  if (points.length === 0) return "";

  const pathParts = points.map((point, index) => {
    const command = index === 0 ? "M" : "L";
    return `${command} ${point.x} ${point.y}`;
  });

  return pathParts.join(" ");
}

// ============================================================================
// Component
// ============================================================================

export default function PathDrawingTool({
  landmarks,
  paths,
  selectedPathId,
  tempPathPoints,
  onSelect,
  onPathCreate,
  onPathUpdate,
  isDrawingMode,
  tempPathStart,
}: PathDrawingToolProps) {
  // Create a map of landmark IDs to landmarks for quick lookup
  const landmarkMap = new Map(landmarks.map((l) => [l.id, l]));

  return (
    <Group>
      {/* Render existing paths */}
      {paths.map((path) => {
        const fromLandmark = landmarkMap.get(path.fromLandmarkId);
        const toLandmark = landmarkMap.get(path.toLandmarkId);

        if (!fromLandmark || !toLandmark) return null;

        const isSelected = path.id === selectedPathId;

        // Parse path data into points for rendering
        const points = parsePathData(path.pathData);
        if (points.length < 2) return null;

        return (
          <Group key={path.id}>
            {/* Main path line */}
            <Line
              points={points.flatMap((p) => [p.x, p.y])}
              stroke={path.style?.stroke || "#000000"}
              strokeWidth={path.style?.strokeWidth || 2}
              lineCap="round"
              lineJoin="round"
              listening={!isDrawingMode}
              onClick={(e: any) => {
                e.cancelBubble = true;
                onSelect(path.id);
              }}
              onTap={(e: any) => {
                e.cancelBubble = true;
                onSelect(path.id);
              }}
              onMouseEnter={(e: any) => {
                if (!isDrawingMode) {
                  const container = e.target.getStage()?.container();
                  if (container) container.style.cursor = "pointer";
                }
              }}
              onMouseLeave={(e: any) => {
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = "default";
              }}
            />

            {/* Selection indicator - thicker transparent overlay */}
            {isSelected && (
              <Line
                points={points.flatMap((p) => [p.x, p.y])}
                stroke="#3b82f6"
                strokeWidth={(path.style?.strokeWidth || 2) + 4}
                opacity={0.3}
                lineCap="round"
                lineJoin="round"
                listening={false}
              />
            )}

            {/* Vertex handles when selected */}
            {isSelected &&
              points.map((point, idx) => {
                const isFirstOrLast = idx === 0 || idx === points.length - 1;
                const isIntermediate = !isFirstOrLast;

                return (
                  <Circle
                    key={idx}
                    x={point.x}
                    y={point.y}
                    radius={isIntermediate ? 5 : 4}
                    fill={
                      idx === 0
                        ? "#22c55e"
                        : idx === points.length - 1
                        ? "#ef4444"
                        : "#3b82f6"
                    }
                    stroke="#fff"
                    strokeWidth={2}
                    draggable={isIntermediate}
                    listening={isIntermediate}
                    onDragMove={(e: any) => {
                      if (!isIntermediate || !onPathUpdate) return;

                      const newPos = { x: e.target.x(), y: e.target.y() };

                      // Update the points array with new position
                      const updatedPoints = [...points];
                      updatedPoints[idx] = newPos;

                      // Generate new path data
                      const newPathData = generatePathData(updatedPoints);

                      // Call update callback
                      onPathUpdate(path.id, newPathData);
                    }}
                    onMouseEnter={(e: any) => {
                      if (isIntermediate) {
                        const container = e.target.getStage()?.container();
                        if (container) container.style.cursor = "move";
                      }
                    }}
                    onMouseLeave={(e: any) => {
                      const container = e.target.getStage()?.container();
                      if (container) container.style.cursor = "default";
                    }}
                  />
                );
              })}
          </Group>
        );
      })}

      {/* Render temporary path during drawing */}
      {isDrawingMode && tempPathStart && tempPathPoints.length > 0 && (
        <Group>
          {/* Temporary path lines */}
          <Line
            points={tempPathPoints.flatMap((p) => [p.x, p.y])}
            stroke="#f59e0b"
            strokeWidth={2}
            dash={[5, 5]}
            lineCap="round"
            lineJoin="round"
            listening={false}
          />

          {/* Temporary vertices */}
          {tempPathPoints.map((point, idx) => (
            <Circle
              key={idx}
              x={point.x}
              y={point.y}
              radius={4}
              fill={idx === 0 ? "#22c55e" : "#f59e0b"}
              stroke="#fff"
              strokeWidth={2}
              listening={false}
            />
          ))}
        </Group>
      )}

      {/* Highlight starting landmark when in path mode */}
      {isDrawingMode && tempPathStart && (
        <Group>
          {(() => {
            const fromLandmark = landmarkMap.get(tempPathStart);
            if (!fromLandmark) return null;

            const fromPoint = getLandmarkCenter(fromLandmark);

            return (
              <Circle
                x={fromPoint.x}
                y={fromPoint.y}
                radius={12}
                stroke="#22c55e"
                strokeWidth={3}
                dash={[5, 5]}
                listening={false}
              />
            );
          })()}
        </Group>
      )}
    </Group>
  );
}
