/**
 * Map Editor Component
 * Full-screen editor for interactive map with landmark and path drawing
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useMapStore, type DrawingMode } from "../../stores/mapStore";
import { ImageDropzone } from "../upload";
import {
  FullViewportCanvas,
  CircleMarkerTool,
  PolygonDrawingTool,
  PathDrawingTool,
} from "../canvas";
import LandmarkEditor from "./LandmarkEditor";
import PathStyleEditor from "./PathStyleEditor";
import { imageRefToDataURL } from "../../utils/imageProcessing";
import {
  validateLandmarks,
  downloadLandmarksJSON,
  exportMapToServer,
} from "../../utils/exportUtils";
import type { ImageRef, Point, Landmark } from "../../types/admin-config";
import {
  Upload,
  Circle,
  Pentagon,
  Route,
  Hand,
  Save,
  Trash2,
  Download,
  Trash,
} from "lucide-react";

// ============================================================================
// Component Props
// ============================================================================

interface MapEditorProps {
  projectId: string;
}

// ============================================================================
// Component
// ============================================================================

export default function MapEditor({ projectId }: MapEditorProps) {
  const {
    mapConfig,
    landmarks,
    paths,
    drawingMode,
    selectedLandmarkId,
    selectedPathId,
    loadMap,
    setMapImage,
    updateMap,
    setDrawingMode,
    selectLandmark,
    selectPath,
    addLandmark,
    updateLandmark,
    deleteLandmark,
    addPath,
    updatePath,
    deletePath,
  } = useMapStore();

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [mapImageUrl, setMapImageUrl] = useState<string | null>(null);
  const [tempPoints, setTempPoints] = useState<Point[]>([]); // For polygon drawing
  const [tempPathPoints, setTempPathPoints] = useState<Point[]>([]); // For path drawing
  const [tempPathStart, setTempPathStart] = useState<string | null>(null);
  const stageRef = useRef<any>(null);

  // Load map on mount
  useEffect(() => {
    loadMap(projectId);
  }, [projectId, loadMap]);

  // Update map image URL when config changes
  useEffect(() => {
    if (mapConfig?.backgroundImage?.url) {
      setMapImageUrl(mapConfig.backgroundImage.url);
    }
  }, [mapConfig]);

  // Handle image upload
  const handleImageUpload = async (imageRef: ImageRef) => {
    try {
      // Convert blob to data URL for persistence
      let imageWithDataURL = imageRef;
      if (imageRef.blob) {
        const dataURL = await imageRefToDataURL(imageRef);
        imageWithDataURL = { ...imageRef, url: dataURL };
      }

      // If no map exists, create a new one with the image
      if (!mapConfig) {
        const now = new Date().toISOString();
        const newMap = {
          id: crypto.randomUUID(),
          projectId,
          backgroundImage: imageWithDataURL,
          viewport: {
            width: imageWithDataURL.width,
            height: imageWithDataURL.height,
          },
          createdAt: now,
          updatedAt: now,
        };

        // Manually add to database and update store
        const { db } = await import("../../services/persistence/dexieDB");
        await db.maps.add(newMap);

        // Reload map to update store
        await loadMap(projectId);
      } else {
        // Update existing map
        await setMapImage(imageWithDataURL);
      }

      setIsUploadOpen(false);
    } catch (error) {
      console.error("Failed to upload map image:", error);
    }
  };

  // Handle tool selection
  const handleToolSelect = (mode: DrawingMode) => {
    // Warn if switching away from complex drawing with points in progress
    if (
      drawingMode === "complex" &&
      tempPoints.length > 0 &&
      mode !== "complex"
    ) {
      if (
        !window.confirm(
          "You have an incomplete polygon. Switching tools will discard it. Continue?"
        )
      ) {
        return;
      }
    }

    setDrawingMode(mode);
    setTempPoints([]); // Clear temporary points when switching tools
    selectLandmark(null); // Deselect any selected landmark
  };

  // Handle canvas click for drawing
  const handleCanvasClick = useCallback(
    (e: any) => {
      if (!mapConfig) return;

      const stage = e.target.getStage();
      // Get pointer position relative to the stage (accounts for zoom/pan)
      const pointerPosition = stage.getRelativePointerPosition();

      if (!pointerPosition) return;

      const point: Point = {
        x: pointerPosition.x,
        y: pointerPosition.y,
      };

      // If clicking on the background (not a shape) in select mode, deselect landmark
      if (drawingMode === "none") {
        const clickedOnBackground =
          e.target.getClassName() === "Image" || e.target === stage;
        if (clickedOnBackground) {
          selectLandmark(null);
          return;
        }
      }

      if (drawingMode === "poi") {
        // Place POI marker (stays in POI mode for multiple placements)
        const now = new Date().toISOString();
        addLandmark({
          projectId,
          type: "poi",
          name: `POI ${landmarks.filter((l) => l.type === "poi").length + 1}`,
          geometry: {
            type: "circle",
            center: point,
            radius: 20, // Default radius
          },
        });
        // Don't reset mode - user must click Hand tool to exit POI mode
      } else if (drawingMode === "complex") {
        // Check if only one complex landmark is allowed
        const existingComplex = landmarks.find((l) => l.type === "complex");
        if (existingComplex && tempPoints.length === 0) {
          alert(
            "Only one Main Complex landmark is allowed. Please delete the existing one first."
          );
          setDrawingMode("none");
          return;
        }

        // Check if clicking near the start point to close polygon
        if (tempPoints.length >= 3) {
          const firstPoint = tempPoints[0];
          const distance = Math.sqrt(
            Math.pow(point.x - firstPoint.x, 2) +
              Math.pow(point.y - firstPoint.y, 2)
          );

          // If within 15 pixels of start, close the polygon
          if (distance < 15) {
            addLandmark({
              projectId,
              type: "complex",
              name: "Main Complex",
              geometry: {
                type: "polygon",
                vertices: tempPoints,
                closed: true,
              },
            });
            setTempPoints([]);
            setDrawingMode("none");
            return;
          }
        }

        // Add vertex to polygon
        setTempPoints([...tempPoints, point]);
      } else if (drawingMode === "path") {
        // If no start landmark selected, ignore canvas clicks
        if (!tempPathStart) {
          return;
        }

        // Add point to path
        setTempPathPoints([...tempPathPoints, point]);
      }
    },
    [
      mapConfig,
      drawingMode,
      tempPoints,
      tempPathPoints,
      tempPathStart,
      projectId,
      landmarks,
      addLandmark,
      setDrawingMode,
      selectLandmark,
    ]
  );

  // Handle double-click to close polygon
  const handleCanvasDoubleClick = useCallback(() => {
    if (drawingMode === "complex" && tempPoints.length >= 3) {
      const now = new Date().toISOString();
      addLandmark({
        projectId,
        type: "complex",
        name: "Main Complex",
        geometry: {
          type: "polygon",
          vertices: tempPoints,
          closed: true,
        },
      });
      setTempPoints([]);
      setDrawingMode("none");
    }
  }, [drawingMode, tempPoints, projectId, addLandmark, setDrawingMode]);

  // Setup stage event listeners
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    // Remove any existing listeners first
    stage.off("click");
    stage.off("dblclick");

    // Add new listeners
    stage.on("click", handleCanvasClick);
    stage.on("dblclick", handleCanvasDoubleClick);

    return () => {
      stage.off("click");
      stage.off("dblclick");
    };
  }, [handleCanvasClick, handleCanvasDoubleClick]);

  // Handle landmark click for path drawing
  const handleLandmarkClickForPath = useCallback(
    (landmarkId: string) => {
      if (drawingMode !== "path") {
        selectLandmark(landmarkId);
        return;
      }

      const landmark = landmarks.find((l) => l.id === landmarkId);
      if (!landmark) return;

      // If no start point, set this as start (must be complex)
      if (!tempPathStart) {
        if (landmark.type === "complex") {
          setTempPathStart(landmarkId);
        } else {
          alert("Path must start from the Main Complex landmark.");
        }
        return;
      }

      // If clicking the same landmark, cancel
      if (tempPathStart === landmarkId) {
        setTempPathStart(null);
        return;
      }

      // If clicking a POI, complete the path
      if (landmark.type === "poi") {
        // Need at least the start point
        if (tempPathPoints.length === 0) {
          alert(
            "Please place at least one point on the map before ending the path."
          );
          return;
        }

        const fromLandmark = landmarks.find((l) => l.id === tempPathStart);
        if (!fromLandmark) return;

        // Get start point (from complex centroid or center)
        const fromPoint =
          "center" in fromLandmark.geometry
            ? fromLandmark.geometry.center
            : fromLandmark.geometry.vertices.reduce(
                (acc, v, i, arr) => ({
                  x: acc.x + v.x / arr.length,
                  y: acc.y + v.y / arr.length,
                }),
                { x: 0, y: 0 }
              );

        // Get end point (POI center)
        const toPoint =
          "center" in landmark.geometry
            ? landmark.geometry.center
            : { x: 0, y: 0 };

        // Build complete path: start + intermediate points + end
        const allPoints = [fromPoint, ...tempPathPoints, toPoint];

        // Generate SVG path data (M x y L x y L x y ...)
        const pathData = allPoints
          .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
          .join(" ");

        addPath({
          projectId,
          fromLandmarkId: tempPathStart,
          toLandmarkId: landmarkId,
          pathData,
          style: {
            stroke: "#000000",
            strokeWidth: 2,
          },
        });

        // Reset path drawing state
        setTempPathStart(null);
        setTempPathPoints([]);
      } else {
        alert("Path must end at a POI landmark.");
      }
    },
    [
      drawingMode,
      tempPathStart,
      tempPathPoints,
      landmarks,
      addPath,
      selectLandmark,
      projectId,
    ]
  );

  // Handle escape key to cancel drawing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setTempPoints([]);
        setTempPathPoints([]);
        setTempPathStart(null);
        setDrawingMode("none");
        selectLandmark(null); // Also deselect landmark
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setDrawingMode, selectLandmark]);

  // Handle landmark property updates
  const handleLandmarkSave = (updates: Partial<Landmark>) => {
    if (selectedLandmarkId) {
      updateLandmark(selectedLandmarkId, updates);
    }
  };

  // Handle landmark deletion
  const handleLandmarkDelete = (id: string) => {
    deleteLandmark(id);
    selectLandmark(null);
  };

  // Handle export
  const handleExport = async () => {
    // Validate before export
    const validation = validateLandmarks(landmarks, paths);

    if (!validation.isValid) {
      const errorMessage = [
        "Cannot export landmarks due to the following errors:",
        "",
        ...validation.errors,
      ].join("\n");
      alert(errorMessage);
      return;
    }

    // Show warnings if any
    if (validation.warnings.length > 0) {
      const warningMessage = [
        "Export will proceed with the following warnings:",
        "",
        ...validation.warnings,
        "",
        "Do you want to continue?",
      ].join("\n");

      if (!window.confirm(warningMessage)) {
        return;
      }
    }

    // Export to server
    try {
      const result = await exportMapToServer(
        landmarks,
        paths,
        mapImageUrl,
        projectId
      );

      if (result.success) {
        alert(
          "✅ Map exported successfully!\n\n" +
            "Files saved to:\n" +
            "• public/data/map.jpg (or .png)\n" +
            "• public/data/landmarks.json"
        );
      } else {
        alert(
          "❌ Export failed!\n\n" + (result.error || "Unknown error occurred")
        );
      }
    } catch (error) {
      console.error("Export error:", error);
      alert("❌ Export failed! Make sure the server is running on port 3002.");
    }
  };

  // Handle clear all
  const handleClearAll = async () => {
    if (landmarks.length === 0 && paths.length === 0) {
      alert("Nothing to clear. The map is already empty.");
      return;
    }

    const message = [
      "⚠️ WARNING: This will permanently delete:",
      "",
      `• ${landmarks.length} landmark(s)`,
      `• ${paths.length} path(s)`,
      "",
      "This action cannot be undone!",
      "",
      "Are you sure you want to continue?",
    ].join("\n");

    if (!window.confirm(message)) {
      return;
    }

    try {
      // Delete all paths first
      for (const path of paths) {
        await deletePath(path.id);
      }

      // Then delete all landmarks
      for (const landmark of landmarks) {
        await deleteLandmark(landmark.id);
      }

      // Clear selections and reset drawing state
      selectLandmark(null);
      selectPath(null);
      setDrawingMode("none");
      setTempPoints([]);
      setTempPathPoints([]);
      setTempPathStart(null);

      alert("All landmarks and paths have been deleted successfully.");
    } catch (error) {
      console.error("Error clearing landmarks:", error);
      alert("An error occurred while clearing landmarks. Please try again.");
    }
  };

  // Get selected landmark
  const selectedLandmark =
    landmarks.find((l) => l.id === selectedLandmarkId) || null;

  // Get selected path
  const selectedPath = paths.find((p) => p.id === selectedPathId) || null;

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Upload Button */}
          <button
            onClick={() => setIsUploadOpen(true)}
            className={`px-3 py-2 rounded-lg border-2 transition-colors flex items-center gap-2 ${
              !mapConfig
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-200 hover:border-gray-300 text-gray-700"
            }`}
            title="Upload map image"
          >
            <Upload className="w-4 h-4" />
            <span className="text-sm font-medium">
              {mapConfig ? "Change Map" : "Upload Map"}
            </span>
          </button>

          {mapConfig && (
            <>
              <div className="w-px h-6 bg-gray-300 mx-2" />

              {/* Drawing Tools */}
              <button
                onClick={() => handleToolSelect("none")}
                className={`p-2 rounded-lg border-2 transition-colors ${
                  drawingMode === "none"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:border-gray-300 text-gray-700"
                }`}
                title="Select mode"
              >
                <Hand className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleToolSelect("poi")}
                className={`p-2 rounded-lg border-2 transition-colors ${
                  drawingMode === "poi"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:border-gray-300 text-gray-700"
                }`}
                title="Add POI (Point of Interest)"
              >
                <Circle className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleToolSelect("complex")}
                className={`p-2 rounded-lg border-2 transition-colors ${
                  drawingMode === "complex"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:border-gray-300 text-gray-700"
                }`}
                title="Draw Main Complex (Polygon)"
              >
                <Pentagon className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleToolSelect("path")}
                className={`p-2 rounded-lg border-2 transition-colors ${
                  drawingMode === "path"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:border-gray-300 text-gray-700"
                }`}
                title="Draw Path (Connect landmarks)"
              >
                <Route className="w-4 h-4" />
              </button>

              <div className="w-px h-6 bg-gray-300 mx-2" />

              {/* Export Button */}
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                title="Export landmarks to JSON"
              >
                <Download className="w-4 h-4" />
                <span className="text-sm font-medium">Export</span>
              </button>

              {/* Clear All Button */}
              <button
                onClick={handleClearAll}
                className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                title="Delete all landmarks and paths"
              >
                <Trash className="w-4 h-4" />
                <span className="text-sm font-medium">Clear All</span>
              </button>
            </>
          )}
        </div>

        {/* Info */}
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>{landmarks.length} landmarks</span>
          <span>{paths.length} paths</span>
        </div>
      </div>

      {/* Canvas Area */}
      <div
        className="flex-1 overflow-hidden relative bg-gray-100"
        style={{ cursor: drawingMode !== "none" ? "crosshair" : "default" }}
      >
        {mapImageUrl ? (
          <FullViewportCanvas
            imageUrl={mapImageUrl}
            onCanvasReady={(stage) => {
              stageRef.current = stage;
            }}
          >
            {/* Circle markers (POI) */}
            <CircleMarkerTool
              landmarks={landmarks}
              selectedId={selectedLandmarkId}
              onSelect={handleLandmarkClickForPath}
              onPlace={(x, y) => {}}
              onUpdate={updateLandmark}
              isDrawingMode={drawingMode === "poi"}
            />

            {/* Polygon tool (Main Complex) */}
            <PolygonDrawingTool
              landmarks={landmarks}
              selectedId={selectedLandmarkId}
              tempPoints={tempPoints}
              onSelect={handleLandmarkClickForPath}
              isDrawingMode={drawingMode === "complex"}
            />

            {/* Path drawing tool */}
            <PathDrawingTool
              landmarks={landmarks}
              paths={paths}
              selectedPathId={selectedPathId}
              tempPathPoints={tempPathPoints}
              onSelect={selectPath}
              onPathCreate={(fromId, toId) => {}}
              onPathUpdate={(pathId, newPathData) => {
                updatePath(pathId, { pathData: newPathData });
              }}
              isDrawingMode={drawingMode === "path"}
              tempPathStart={tempPathStart}
            />
          </FullViewportCanvas>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
            <Upload className="w-16 h-16 mb-4" />
            <p className="text-lg mb-2">No map uploaded</p>
            <p className="text-sm">Click "Upload Map" to begin</p>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {mapConfig ? "Change Map Image" : "Upload Map Image"}
            </h3>

            <ImageDropzone
              onImageSelect={handleImageUpload}
              currentImage={mapConfig?.backgroundImage || null}
              onImageRemove={async () => {
                if (
                  window.confirm(
                    "Are you sure you want to remove the current map image?\n\nWarning: All landmarks and paths will also be deleted!"
                  )
                ) {
                  try {
                    // Delete all paths first
                    for (const path of paths) {
                      await deletePath(path.id);
                    }

                    // Then delete all landmarks
                    for (const landmark of landmarks) {
                      await deleteLandmark(landmark.id);
                    }

                    // Clear the map image
                    await updateMap({
                      backgroundImage: undefined,
                      viewport: { width: 0, height: 0 },
                    });

                    setMapImageUrl(null);

                    // Clear any drawing state
                    selectLandmark(null);
                    selectPath(null);
                    setDrawingMode("none");
                    setTempPoints([]);
                    setTempPathPoints([]);
                    setTempPathStart(null);
                  } catch (error) {
                    console.error("Failed to remove map image:", error);
                    alert("Failed to remove map image. Please try again.");
                  }
                }
              }}
              maxSizeMB={20}
            />

            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setIsUploadOpen(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Landmark Editor Panel */}
      {selectedLandmark && (
        <LandmarkEditor
          landmark={selectedLandmark}
          onSave={handleLandmarkSave}
          onDelete={handleLandmarkDelete}
          onClose={() => selectLandmark(null)}
        />
      )}

      {/* Path Style Editor Panel */}
      {selectedPath && (
        <PathStyleEditor
          path={selectedPath}
          onSave={async (updates) => {
            await updatePath(selectedPath.id, updates);
          }}
          onDelete={async (id) => {
            await deletePath(id);
          }}
          onClose={() => selectPath(null)}
        />
      )}
    </div>
  );
}
