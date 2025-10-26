/**
 * Master Plan Editor Component
 * Full-screen editor for master plan with angle images and building hotspots
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useMasterPlanStore } from "../../stores/masterPlanStore";
import { ImageDropzone } from "../upload";
import { TransitionUploadModal, PanoramicUploadModal } from "../modals";
import { FullViewportCanvas, BuildingHotspotTool } from "../canvas";
import { imageRefToDataURL } from "../../utils/imageProcessing";
import {
  exportMasterPlan,
  checkServerHealth,
} from "../../services/api/masterPlanExport";
import type { ImageRef, Point } from "../../types/admin-config";
import {
  Upload,
  Plus,
  Pentagon,
  Hand,
  Trash2,
  Download,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  X,
  Pencil,
  Film,
  MapPin,
} from "lucide-react";
import { Circle, Group, Text } from "react-konva";
import type { TourPoint } from "../../types/admin-config";

// ============================================================================
// Tour Point Marker Component
// ============================================================================

interface TourPointMarkerProps {
  tourPoint: TourPoint;
  position: Point;
  isSelected: boolean;
  onClick: () => void;
}

function TourPointMarker({
  tourPoint,
  position,
  isSelected,
  onClick,
}: TourPointMarkerProps) {
  return (
    <Group x={position.x} y={position.y} onClick={onClick} onTap={onClick}>
      {/* Outer circle (border) */}
      <Circle
        radius={16}
        fill={isSelected ? "#10b981" : "#22c55e"}
        stroke={isSelected ? "#059669" : "#16a34a"}
        strokeWidth={3}
        shadowColor="black"
        shadowBlur={10}
        shadowOpacity={0.3}
        shadowOffsetY={2}
      />
      {/* Inner circle (icon background) */}
      <Circle radius={10} fill="white" />
      {/* Label if exists */}
      {tourPoint.name && (
        <Text
          text={tourPoint.name}
          fontSize={12}
          fill={isSelected ? "#059669" : "#16a34a"}
          fontStyle="bold"
          y={20}
          x={-30}
          width={60}
          align="center"
        />
      )}
      {/* Indicator if panoramic image exists */}
      {tourPoint.panoramicImage && (
        <Circle
          x={10}
          y={-10}
          radius={5}
          fill="#3b82f6"
          stroke="white"
          strokeWidth={2}
        />
      )}
    </Group>
  );
}

// ============================================================================
// Component Props
// ============================================================================

interface MasterPlanEditorProps {
  projectId: string;
}

// ============================================================================
// Component
// ============================================================================

export default function MasterPlanEditor({ projectId }: MasterPlanEditorProps) {
  const {
    masterPlan,
    angles,
    selectedAngleId,
    selectedBuildingId,
    tourPoints,
    selectedTourPointId: storeTourPointId,
    loadMasterPlan,
    addAngle,
    updateAngle,
    deleteAngle,
    selectAngle,
    addBuilding,
    updateBuilding,
    deleteBuilding,
    selectBuilding,
    addHotspot,
    updateHotspot,
    deleteHotspot,
    addTransitionFrames,
    removeTransition,
    addTourPoint,
    updateTourPointName,
    updateTourPointPosition,
    deleteTourPoint,
    uploadPanoramicImage,
    selectTourPoint,
  } = useMasterPlanStore();

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAddBuildingOpen, setIsAddBuildingOpen] = useState(false);
  const [isAddTourPointOpen, setIsAddTourPointOpen] = useState(false);
  const [isChangeAngleImageOpen, setIsChangeAngleImageOpen] = useState(false);
  const [isTransitionUploadOpen, setIsTransitionUploadOpen] = useState(false);
  const [isPanoramicUploadOpen, setIsPanoramicUploadOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [editingBuildingId, setEditingBuildingId] = useState<string | null>(
    null
  );
  const [editingTourPointId, setEditingTourPointId] = useState<string | null>(
    null
  );
  const [currentAngleImageUrl, setCurrentAngleImageUrl] = useState<
    string | null
  >(null);
  const [drawingMode, setDrawingMode] = useState<
    "none" | "building" | "tourPoint"
  >("none");
  const [tempPoints, setTempPoints] = useState<Point[]>([]);
  const [selectedHotspotId, setSelectedHotspotId] = useState<string | null>(
    null
  );
  const [newBuildingName, setNewBuildingName] = useState("");
  const [newBuildingId, setNewBuildingId] = useState("");
  const [newBuildingTotalFloors, setNewBuildingTotalFloors] = useState("");
  const [newBuildingAvailableUnits, setNewBuildingAvailableUnits] =
    useState("");
  const [newTourPointName, setNewTourPointName] = useState("");
  const stageRef = useRef<any>(null);

  // Load master plan on mount
  useEffect(() => {
    loadMasterPlan(projectId);
  }, [projectId, loadMasterPlan]);

  // Get current angle
  const currentAngle = angles.find((a) => a.id === selectedAngleId);

  // Update angle image URL when angle changes
  useEffect(() => {
    if (currentAngle?.backgroundImage?.url) {
      setCurrentAngleImageUrl(currentAngle.backgroundImage.url);
    } else {
      setCurrentAngleImageUrl(null);
    }
  }, [currentAngle]);

  // Handle angle image upload
  const handleAngleUpload = async (imageRef: ImageRef) => {
    try {
      // Convert blob to data URL for persistence
      let imageWithDataURL = imageRef;
      if (imageRef.blob) {
        const dataURL = await imageRefToDataURL(imageRef);
        imageWithDataURL = { ...imageRef, url: dataURL };
      }

      // Add new angle
      await addAngle({
        backgroundImage: imageWithDataURL,
        sequenceIndex: angles.length,
        hotspots: [],
        tourPointIds: [], // Initialize empty tour point IDs
      });

      setIsUploadOpen(false);
    } catch (error) {
      console.error("Failed to upload angle image:", error);
      alert("Failed to upload angle image. Please try again.");
    }
  };

  // Handle building creation
  const handleCreateBuilding = async () => {
    if (!newBuildingName.trim()) {
      alert("Building name is required");
      return;
    }

    if (!newBuildingId.trim()) {
      alert("Building ID is required");
      return;
    }

    try {
      // Check if ID already exists when creating new building
      if (!editingBuildingId && buildings.some((b) => b.id === newBuildingId)) {
        alert("Building ID already exists. Please use a unique ID.");
        return;
      }

      if (editingBuildingId) {
        // Update existing building
        await updateBuilding(editingBuildingId, {
          id: newBuildingId,
          name: newBuildingName,
          displayName: newBuildingName,
          totalFloors: newBuildingTotalFloors
            ? parseInt(newBuildingTotalFloors, 10)
            : undefined,
          availableUnits: newBuildingAvailableUnits
            ? parseInt(newBuildingAvailableUnits, 10)
            : undefined,
        });
      } else {
        // Create new building
        await addBuilding({
          id: newBuildingId,
          name: newBuildingName,
          displayName: newBuildingName,
          totalFloors: newBuildingTotalFloors
            ? parseInt(newBuildingTotalFloors, 10)
            : undefined,
          availableUnits: newBuildingAvailableUnits
            ? parseInt(newBuildingAvailableUnits, 10)
            : undefined,
        });
      }

      setNewBuildingName("");
      setNewBuildingId("");
      setNewBuildingTotalFloors("");
      setNewBuildingAvailableUnits("");
      setEditingBuildingId(null);
      setIsAddBuildingOpen(false);
    } catch (error) {
      console.error("Failed to save building:", error);
      alert("Failed to save building. Please try again.");
    }
  };

  // Handle create/edit tour point
  const handleCreateTourPoint = async () => {
    if (!newTourPointName.trim()) {
      alert("Tour point name is required");
      return;
    }

    try {
      if (editingTourPointId) {
        // Update existing tour point name
        await updateTourPointName(editingTourPointId, newTourPointName);
        setNewTourPointName("");
        setEditingTourPointId(null);
        setIsAddTourPointOpen(false);
      } else {
        // Create new tour point (addTourPoint already selects it in store)
        if (!selectedAngleId) {
          alert("Please select an angle first");
          return;
        }
        await addTourPoint(
          newTourPointName,
          { x: 0, y: 0 }, // Temporary position - user will place it
          selectedAngleId
        );
        // Clear form and close modal
        setNewTourPointName("");
        setIsAddTourPointOpen(false);
        // Enable drawing mode so user can place the tour point
        setDrawingMode("tourPoint");
      }
    } catch (error) {
      console.error("Failed to create/update tour point:", error);
      alert("Failed to save tour point. Please try again.");
    }
  };

  // Handle edit tour point
  const handleEditTourPoint = (tourPoint: (typeof tourPoints)[0]) => {
    setNewTourPointName(tourPoint.name);
    setEditingTourPointId(tourPoint.id);
    setIsAddTourPointOpen(true);
  };

  // Get buildings from master plan
  const buildings = masterPlan?.buildings || [];

  // Handle edit building
  const handleEditBuilding = (building: (typeof buildings)[0]) => {
    setNewBuildingName(building.name);
    setNewBuildingId(building.id);
    setNewBuildingTotalFloors(
      building.totalFloors ? building.totalFloors.toString() : ""
    );
    setNewBuildingAvailableUnits(
      building.availableUnits ? building.availableUnits.toString() : ""
    );
    setEditingBuildingId(building.id);
    setIsAddBuildingOpen(true);
  };

  // Navigate between angles
  const handlePreviousAngle = () => {
    const currentIndex = angles.findIndex((a) => a.id === selectedAngleId);
    if (currentIndex > 0) {
      selectAngle(angles[currentIndex - 1].id);
    }
  };

  const handleNextAngle = () => {
    const currentIndex = angles.findIndex((a) => a.id === selectedAngleId);
    if (currentIndex < angles.length - 1) {
      selectAngle(angles[currentIndex + 1].id);
    }
  };

  // Handle canvas click for polygon drawing
  const handleCanvasClick = useCallback(
    async (e: any) => {
      // If clicking on empty space (not a hotspot or tour point), deselect
      const clickedOnBackground =
        e.target.getClassName() === "Image" || e.target === e.target.getStage();
      if (clickedOnBackground && drawingMode === "none") {
        setSelectedHotspotId(null);
        selectTourPoint(null);
      }

      const stage = e.target.getStage();
      // Get pointer position relative to the stage (accounts for zoom/pan)
      const pointerPosition = stage.getRelativePointerPosition();

      if (!pointerPosition) return;

      const point: Point = {
        x: pointerPosition.x,
        y: pointerPosition.y,
      };

      // Handle tour point placement
      if (drawingMode === "tourPoint" && selectedAngleId && storeTourPointId) {
        try {
          // Update the position of the selected tour point for this angle
          await updateTourPointPosition(
            storeTourPointId,
            selectedAngleId,
            point
          );
          setDrawingMode("none");
        } catch (error) {
          console.error("Failed to place tour point:", error);
          alert(
            `Failed to place tour point: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
        return;
      }

      if (
        drawingMode !== "building" ||
        !selectedBuildingId ||
        !selectedAngleId
      ) {
        return;
      }

      // Escape key clears temp points
      if (tempPoints.length > 0) {
        // Check if clicking near the start point to close polygon
        if (tempPoints.length >= 3) {
          const firstPoint = tempPoints[0];
          const distance = Math.sqrt(
            Math.pow(point.x - firstPoint.x, 2) +
              Math.pow(point.y - firstPoint.y, 2)
          );

          // If within 15 pixels of start, close the polygon
          if (distance < 15) {
            addHotspot(selectedAngleId, {
              type: "polygon",
              vertices: tempPoints,
              closed: true,
            });
            setTempPoints([]);
            setDrawingMode("none");
            return;
          }
        }
      }

      // Add vertex to polygon
      setTempPoints([...tempPoints, point]);
    },
    [
      drawingMode,
      selectedBuildingId,
      selectedAngleId,
      tempPoints,
      addHotspot,
      addTourPoint,
    ]
  );

  // Handle hotspot vertex update
  const handleUpdateHotspot = useCallback(
    (hotspotId: string, vertices: Point[]) => {
      if (!selectedAngleId) return;

      updateHotspot(selectedAngleId, hotspotId, {
        geometry: {
          type: "polygon",
          vertices,
          closed: true,
        },
      });
    },
    [selectedAngleId, updateHotspot]
  );

  // Handle hotspot deletion
  const handleDeleteHotspot = useCallback(() => {
    if (!selectedAngleId || !selectedHotspotId) return;

    if (window.confirm("Delete this building hotspot?")) {
      deleteHotspot(selectedAngleId, selectedHotspotId);
      setSelectedHotspotId(null);
    }
  }, [selectedAngleId, selectedHotspotId, deleteHotspot]);

  // Handle angle deletion
  const handleDeleteAngle = useCallback(() => {
    if (!selectedAngleId) return;

    const angle = angles.find((a) => a.id === selectedAngleId);
    const hotspotCount = angle?.hotspots?.length || 0;

    const message =
      hotspotCount > 0
        ? `Delete this angle and all ${hotspotCount} hotspot(s)?`
        : "Delete this angle?";

    if (window.confirm(message)) {
      deleteAngle(selectedAngleId);
    }
  }, [selectedAngleId, angles, deleteAngle]);

  // Handle angle image change
  const handleChangeAngleImage = useCallback(
    async (imageRef: ImageRef) => {
      if (!selectedAngleId) return;

      try {
        // Convert blob to data URL for persistence
        let imageWithDataURL = imageRef;
        if (imageRef.blob) {
          const dataURL = await imageRefToDataURL(imageRef);
          imageWithDataURL = { ...imageRef, url: dataURL };
        }

        await updateAngle(selectedAngleId, {
          backgroundImage: imageWithDataURL,
        });

        setIsChangeAngleImageOpen(false);
      } catch (error) {
        console.error("Failed to change angle image:", error);
        alert("Failed to change angle image. Please try again.");
      }
    },
    [selectedAngleId, updateAngle]
  );

  // Handle transition upload
  const handleTransitionUpload = useCallback(
    async (frames: ImageRef[]) => {
      if (!selectedAngleId) return;

      try {
        // Convert blobs to data URLs for persistence
        const framesWithDataURLs = await Promise.all(
          frames.map(async (frame) => {
            if (frame.blob) {
              const dataURL = await imageRefToDataURL(frame);
              // Remove blob property and set data URL - blobs can't be serialized to IndexedDB
              const { blob, ...frameWithoutBlob } = frame;
              return { ...frameWithoutBlob, url: dataURL };
            }
            return frame;
          })
        );

        await addTransitionFrames(selectedAngleId, framesWithDataURLs);
        setIsTransitionUploadOpen(false);
      } catch (error) {
        console.error("Failed to upload transition frames:", error);
        alert(
          `Failed to upload transition frames: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
    [selectedAngleId, addTransitionFrames]
  );

  // Handle transition removal
  const handleRemoveTransition = useCallback(() => {
    if (!selectedAngleId) return;

    if (window.confirm("Remove transition sequence for this angle?")) {
      removeTransition(selectedAngleId);
    }
  }, [selectedAngleId, removeTransition]);

  // Handle export to backend
  const handleExport = useCallback(async () => {
    if (angles.length === 0) {
      alert("No angles to export. Please add at least one angle first.");
      return;
    }

    setIsExporting(true);

    try {
      // Check if server is running
      const serverOk = await checkServerHealth();
      if (!serverOk) {
        throw new Error(
          "Backend server is not running. Please start it with: cd server && npm start"
        );
      }

      // Get buildings from master plan
      const buildings = masterPlan?.buildings || [];

      // Export master plan with tour points
      const response = await exportMasterPlan({
        angles,
        buildings,
        tourPoints,
        projectId,
      });

      alert(
        `✅ Master Plan Exported!\n\n` +
          `Angles: ${response.stats.angles}\n` +
          `Buildings: ${response.stats.buildings}\n` +
          `Hotspots: ${response.stats.hotspots}\n` +
          `Images: ${response.stats.images}\n` +
          `Tour Points: ${tourPoints.length}\n\n` +
          `Saved to: ${response.files.masterplan}`
      );
    } catch (error) {
      console.error("Export failed:", error);
      alert(
        `❌ Export Failed\n\n${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsExporting(false);
    }
  }, [angles, masterPlan, tourPoints, projectId]);

  // Setup stage event listeners
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    // Remove any existing listeners first
    stage.off("click");

    // Add new listeners
    stage.on("click", handleCanvasClick);

    return () => {
      stage.off("click");
    };
  }, [handleCanvasClick]);

  // Handle Escape key to cancel drawing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setTempPoints([]);
        setDrawingMode("none");
        setSelectedHotspotId(null);
      } else if (e.key === "Delete" || e.key === "Backspace") {
        // Delete selected hotspot
        if (selectedHotspotId && drawingMode === "none") {
          handleDeleteHotspot();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedHotspotId, drawingMode, handleDeleteHotspot]);

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Upload Angle Button */}
          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            title="Upload angle image"
          >
            <Upload className="w-4 h-4" />
            <span className="text-sm font-medium">
              {angles.length === 0 ? "Upload First Angle" : "Add Angle"}
            </span>
          </button>

          {angles.length > 0 && (
            <>
              <div className="w-px h-6 bg-gray-300 mx-2" />

              {/* Angle Navigation */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePreviousAngle}
                  disabled={
                    !selectedAngleId ||
                    angles.findIndex((a) => a.id === selectedAngleId) === 0
                  }
                  className="p-2 rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
                  title="Previous angle"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <select
                  value={selectedAngleId || ""}
                  onChange={(e) => selectAngle(e.target.value)}
                  className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm font-medium"
                  aria-label="Select angle view"
                >
                  {angles.map((angle) => (
                    <option key={angle.id} value={angle.id}>
                      Angle {angle.sequenceIndex + 1}
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleNextAngle}
                  disabled={
                    !selectedAngleId ||
                    angles.findIndex((a) => a.id === selectedAngleId) ===
                      angles.length - 1
                  }
                  className="p-2 rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
                  title="Next angle"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Angle Management */}
              {selectedAngleId && (
                <>
                  <button
                    onClick={() => setIsChangeAngleImageOpen(true)}
                    className="p-2 rounded-lg border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-gray-700"
                    title="Change angle image"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handleDeleteAngle}
                    className="p-2 rounded-lg border-2 border-gray-200 hover:border-red-300 hover:bg-red-50 transition-colors text-gray-700 hover:text-red-600"
                    title="Delete angle"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {/* Transition Button */}
                  {(() => {
                    const angle = angles.find((a) => a.id === selectedAngleId);
                    if (!angle) return null;

                    const isLastAngle = !angles.some(
                      (a) => a.sequenceIndex === angle.sequenceIndex + 1
                    );
                    const hasTransition = angle?.transitionToNext;

                    return (
                      <button
                        onClick={() => setIsTransitionUploadOpen(true)}
                        className={`p-2 rounded-lg border-2 transition-colors ${
                          hasTransition
                            ? "border-purple-300 bg-purple-50 text-purple-700"
                            : "border-gray-200 hover:border-purple-300 hover:bg-purple-50 text-gray-700"
                        }`}
                        title={
                          hasTransition
                            ? `Transition: ${angle.transitionToNext?.frameCount} frames`
                            : isLastAngle
                            ? "Add closing transition animation"
                            : "Add transition to next angle"
                        }
                      >
                        <Film className="w-4 h-4" />
                      </button>
                    );
                  })()}
                </>
              )}

              <div className="w-px h-6 bg-gray-300 mx-2" />

              {/* Drawing Tools */}
              <button
                onClick={() => setDrawingMode("none")}
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
                onClick={() => setDrawingMode("building")}
                className={`p-2 rounded-lg border-2 transition-colors ${
                  drawingMode === "building"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:border-gray-300 text-gray-700"
                }`}
                title="Draw Building Hotspot"
                disabled={!selectedBuildingId}
              >
                <Pentagon className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  if (storeTourPointId) {
                    setDrawingMode("tourPoint");
                  }
                }}
                disabled={!storeTourPointId}
                className={`p-2 rounded-lg border-2 transition-colors ${
                  drawingMode === "tourPoint"
                    ? "border-green-500 bg-green-50 text-green-700"
                    : !storeTourPointId
                    ? "border-gray-200 text-gray-400 cursor-not-allowed opacity-50"
                    : "border-gray-200 hover:border-green-300 text-gray-700"
                }`}
                title={
                  storeTourPointId
                    ? "Place tour point on map"
                    : "Select a tour point first"
                }
              >
                <MapPin className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Info and Actions */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>{angles.length} angles</span>
            <span>{buildings.length} buildings</span>
          </div>

          {angles.length > 0 && (
            <>
              <div className="w-px h-6 bg-gray-300" />
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Export master plan to public/data"
              >
                <Download className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {isExporting ? "Exporting..." : "Export"}
                </span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Building List Sidebar */}
        {angles.length > 0 && (
          <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Buildings
              </h3>
              <button
                onClick={() => setIsAddBuildingOpen(true)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Building
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {buildings.length === 0 ? (
                <p className="text-sm text-gray-500 text-center mt-4">
                  No buildings yet. Add one to start.
                </p>
              ) : (
                <div className="space-y-2">
                  {buildings.map((building) => (
                    <div
                      key={building.id}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                        selectedBuildingId === building.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => selectBuilding(building.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {building.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            ID: {building.id}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditBuilding(building);
                            }}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Edit building"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (
                                window.confirm(
                                  `Delete building "${building.name}"? This will remove all its hotspots from all angles.`
                                )
                              ) {
                                deleteBuilding(building.id);
                              }
                            }}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete building"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tour Points Section */}
            <div className="border-t border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Street View Tours
                </h3>
                <button
                  onClick={() => setIsAddTourPointOpen(true)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Tour Point
                </button>
              </div>

              <div className="overflow-y-auto p-4 max-h-64">
                {tourPoints.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center mt-4">
                    No tour points yet. Add one to start.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {tourPoints.map((tourPoint) => (
                      <div
                        key={tourPoint.id}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                          storeTourPointId === tourPoint.id
                            ? "border-green-500 bg-green-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => selectTourPoint(tourPoint.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {tourPoint.name}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {tourPoint.positions.length} position(s)
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditTourPoint(tourPoint);
                              }}
                              className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                              title="Edit tour point"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (
                                  window.confirm(
                                    `Delete tour point "${tourPoint.name}"? This will remove it from all angles.`
                                  )
                                ) {
                                  deleteTourPoint(tourPoint.id);
                                }
                              }}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                              title="Delete tour point"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Canvas Area */}
        <div
          className="flex-1 overflow-hidden relative bg-gray-100"
          style={{ cursor: drawingMode !== "none" ? "crosshair" : "default" }}
        >
          {currentAngleImageUrl ? (
            <>
              <FullViewportCanvas
                imageUrl={currentAngleImageUrl}
                onCanvasReady={(stage) => {
                  stageRef.current = stage;
                }}
              >
                <BuildingHotspotTool
                  hotspots={currentAngle?.hotspots || []}
                  buildings={buildings}
                  selectedBuildingId={selectedBuildingId}
                  selectedHotspotId={selectedHotspotId}
                  tempPoints={tempPoints}
                  onSelect={(hotspotId) => setSelectedHotspotId(hotspotId)}
                  onUpdateHotspot={handleUpdateHotspot}
                  isDrawingMode={drawingMode === "building"}
                />

                {/* Tour Point Markers */}
                {currentAngle &&
                  tourPoints
                    .filter((tp) => currentAngle.tourPointIds?.includes(tp.id))
                    .map((tourPoint) => {
                      const position = tourPoint.positions.find(
                        (p) => p.angleId === currentAngle.id
                      );
                      if (!position) return null;
                      return (
                        <TourPointMarker
                          key={tourPoint.id}
                          tourPoint={tourPoint}
                          position={position.position}
                          isSelected={storeTourPointId === tourPoint.id}
                          onClick={() => {
                            selectTourPoint(tourPoint.id);
                            setDrawingMode("none");
                          }}
                        />
                      );
                    })}
              </FullViewportCanvas>

              {/* Drawing Instructions Overlay */}
              {drawingMode === "building" && selectedBuildingId && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-10">
                  <Pentagon className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Click to add vertices. Click near start or double-click to
                    close polygon. Press ESC to cancel.
                  </span>
                </div>
              )}

              {/* Tour Point Instructions */}
              {drawingMode === "tourPoint" && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-10">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Click on the image to place a street view tour point
                  </span>
                </div>
              )}

              {/* No Building Selected Warning */}
              {drawingMode === "building" && !selectedBuildingId && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-orange-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-10">
                  <span className="text-sm font-medium">
                    ⚠️ Select a building from the sidebar first
                  </span>
                </div>
              )}

              {/* Delete Hotspot Button */}
              {selectedHotspotId && drawingMode === "none" && (
                <div className="absolute bottom-4 right-4 z-10">
                  <button
                    onClick={handleDeleteHotspot}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-lg"
                    title="Delete hotspot"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-sm font-medium">Delete Hotspot</span>
                  </button>
                </div>
              )}

              {/* Tour Point Actions */}
              {storeTourPointId && drawingMode === "none" && (
                <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
                  <button
                    onClick={() => setIsPanoramicUploadOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
                    title="Upload panoramic image"
                  >
                    <Upload className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      Upload Panoramic
                    </span>
                  </button>
                  <button
                    onClick={async () => {
                      if (
                        confirm(
                          "Delete this tour point? This cannot be undone."
                        )
                      ) {
                        try {
                          await deleteTourPoint(storeTourPointId);
                          selectTourPoint(null);
                        } catch (error) {
                          console.error("Failed to delete tour point:", error);
                          alert(
                            `Failed to delete tour point: ${
                              error instanceof Error
                                ? error.message
                                : "Unknown error"
                            }`
                          );
                        }
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-lg"
                    title="Delete tour point"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      Delete Tour Point
                    </span>
                  </button>
                </div>
              )}
            </>
          ) : angles.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
              <Upload className="w-16 h-16 mb-4" />
              <p className="text-lg mb-2">No angles uploaded</p>
              <p className="text-sm">Click "Upload First Angle" to begin</p>
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
              <p className="text-lg mb-2">Select an angle</p>
              <p className="text-sm">Choose an angle from the dropdown above</p>
            </div>
          )}
        </div>
      </div>

      {/* Upload Angle Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Upload Angle Image
            </h3>

            <ImageDropzone
              onImageSelect={handleAngleUpload}
              currentImage={null}
              onImageRemove={() => {}}
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

      {/* Add/Edit Building Modal */}
      {isAddBuildingOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingBuildingId ? "Edit Building" : "Add Building"}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Building Name *
                </label>
                <input
                  type="text"
                  value={newBuildingName}
                  onChange={(e) => setNewBuildingName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Building A"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Building ID *
                </label>
                <input
                  type="text"
                  value={newBuildingId}
                  onChange={(e) => setNewBuildingId(e.target.value)}
                  disabled={!!editingBuildingId}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    editingBuildingId ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                  placeholder="e.g., b11"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {editingBuildingId
                    ? "ID cannot be changed when editing"
                    : "Unique identifier (lowercase, no spaces)"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Floors
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newBuildingTotalFloors}
                    onChange={(e) => setNewBuildingTotalFloors(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 42"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Available Units
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newBuildingAvailableUnits}
                    onChange={(e) =>
                      setNewBuildingAvailableUnits(e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 18"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsAddBuildingOpen(false);
                  setNewBuildingName("");
                  setNewBuildingId("");
                  setNewBuildingTotalFloors("");
                  setNewBuildingAvailableUnits("");
                  setEditingBuildingId(null);
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBuilding}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingBuildingId ? "Save Changes" : "Add Building"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Angle Image Modal */}
      {isChangeAngleImageOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Change Angle Image
            </h3>

            <ImageDropzone
              onImageSelect={handleChangeAngleImage}
              currentImage={null}
              onImageRemove={() => {}}
              maxSizeMB={20}
            />

            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setIsChangeAngleImageOpen(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transition Upload Modal */}
      {isTransitionUploadOpen &&
        selectedAngleId &&
        (() => {
          const currentAngle = angles.find((a) => a.id === selectedAngleId);
          if (!currentAngle) return null;

          const nextAngle = angles.find(
            (a) => a.sequenceIndex === currentAngle.sequenceIndex + 1
          );

          // For last angle, next index is 0 (loop back to start)
          const nextAngleIndex = nextAngle ? nextAngle.sequenceIndex : 0;

          return (
            <TransitionUploadModal
              isOpen={isTransitionUploadOpen}
              onClose={() => setIsTransitionUploadOpen(false)}
              onUpload={handleTransitionUpload}
              onDelete={handleRemoveTransition}
              currentAngleIndex={currentAngle.sequenceIndex}
              nextAngleIndex={nextAngleIndex}
              existingTransition={currentAngle.transitionToNext}
            />
          );
        })()}

      {/* Add/Edit Tour Point Modal */}
      {isAddTourPointOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingTourPointId ? "Edit Tour Point" : "Add Tour Point"}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tour Point Name *
                </label>
                <input
                  type="text"
                  value={newTourPointName}
                  onChange={(e) => setNewTourPointName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., Main Entrance"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">
                  {editingTourPointId
                    ? "Update the tour point name"
                    : "After creating, click the MapPin button and place the tour point on the map"}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsAddTourPointOpen(false);
                  setNewTourPointName("");
                  setEditingTourPointId(null);
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTourPoint}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                {editingTourPointId ? "Save Changes" : "Create & Place"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Panoramic Upload Modal */}
      {isPanoramicUploadOpen && storeTourPointId && (
        <PanoramicUploadModal
          isOpen={isPanoramicUploadOpen}
          onClose={() => setIsPanoramicUploadOpen(false)}
          onUpload={async (image) => {
            await uploadPanoramicImage(storeTourPointId, image);
            setIsPanoramicUploadOpen(false);
          }}
          tourPointName={
            tourPoints.find((tp) => tp.id === storeTourPointId)?.name ||
            "Tour Point"
          }
          existingImage={
            tourPoints.find((tp) => tp.id === storeTourPointId)?.panoramicImage
          }
        />
      )}
    </div>
  );
}
