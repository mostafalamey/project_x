/**
 * Building Editor Component
 * Full-screen editor for building configuration with floor hotspots
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useBuildingsStore } from "../../stores/buildingsStore";
import { useMasterPlanStore } from "../../stores/masterPlanStore";
import { useSidebar } from "../../contexts/SidebarContext";
import { ImageDropzone } from "../upload";
import { FullViewportCanvas } from "../canvas";
import { imageRefToDataURL } from "../../utils/imageProcessing";
import type { ImageRef, Point, FloorReference } from "../../types/admin-config";
import {
  Upload,
  Plus,
  Pentagon,
  Hand,
  Save,
  Trash2,
  Download,
  Building2,
  Layers,
  Edit2,
} from "lucide-react";
import { Line, Circle, Group, Text } from "react-konva";

// ============================================================================
// Component Props
// ============================================================================

interface BuildingEditorProps {
  projectId: string;
}

// ============================================================================
// Component
// ============================================================================

export default function BuildingEditor({ projectId }: BuildingEditorProps) {
  const { sidebarWidth } = useSidebar();
  const {
    buildings,
    selectedBuildingId,
    loadBuildings,
    selectBuilding,
    updateBuilding,
    addFloor,
    updateFloor,
    deleteFloor,
    exportBuilding,
  } = useBuildingsStore();

  const { masterPlan, loadMasterPlan } = useMasterPlanStore();

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAddFloorOpen, setIsAddFloorOpen] = useState(false);
  const [buildingImageUrl, setBuildingImageUrl] = useState<string | null>(null);
  const [drawingMode, setDrawingMode] = useState<"none" | "polygon">("none");
  const [tempPoints, setTempPoints] = useState<Point[]>([]);
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null);
  const [newFloorName, setNewFloorName] = useState("");
  const [newFloorNumber, setNewFloorNumber] = useState("");
  const [editingFloorId, setEditingFloorId] = useState<string | null>(null);
  const [isEditFloorOpen, setIsEditFloorOpen] = useState(false);
  const [editFloorName, setEditFloorName] = useState("");
  const [editFloorNumber, setEditFloorNumber] = useState("");
  const stageRef = useRef<any>(null);

  // Load buildings and master plan on mount
  useEffect(() => {
    loadBuildings(projectId);
    loadMasterPlan(projectId);
  }, [projectId, loadBuildings, loadMasterPlan]);

  // Get buildings from master plan (these are the building entities created in master plan)
  const masterPlanBuildings = masterPlan?.buildings || [];

  // Get selected building
  const selectedBuilding = buildings.find((b) => b.id === selectedBuildingId);

  // Update building image URL when building changes
  useEffect(() => {
    if (selectedBuilding?.exteriorImage?.url) {
      setBuildingImageUrl(selectedBuilding.exteriorImage.url);
    } else {
      setBuildingImageUrl(null);
    }
  }, [selectedBuilding]);

  // Handle building selection
  const handleBuildingSelect = async (buildingId: string) => {
    if (!buildingId) {
      selectBuilding(null);
      return;
    }

    // Check if this building exists in our buildings store
    let existingBuilding = buildings.find((b) => b.id === buildingId);

    if (!existingBuilding) {
      // Create building config from master plan building
      const masterPlanBuilding = masterPlanBuildings.find(
        (b) => b.id === buildingId
      );

      if (masterPlanBuilding) {
        try {
          await useBuildingsStore.getState().addBuilding({
            id: buildingId, // Use the master plan building ID
            projectId,
            name: masterPlanBuilding.name,
            floors: [],
          });

          // Reload buildings to get the newly created one
          await loadBuildings(projectId);

          // Select the building after it's been created and loaded
          selectBuilding(buildingId);
        } catch (error) {
          console.error("Failed to create building config:", error);
          alert("Failed to create building configuration. Please try again.");
        }
      }
    } else {
      // Building exists, just select it
      selectBuilding(buildingId);
    }
  };

  // Handle image upload
  const handleImageUpload = async (imageRef: ImageRef) => {
    if (!selectedBuilding) {
      alert("Please select a building first");
      return;
    }

    try {
      // Convert blob to data URL for persistence
      let imageWithDataURL = imageRef;
      if (imageRef.blob) {
        const dataURL = await imageRefToDataURL(imageRef);
        imageWithDataURL = { ...imageRef, url: dataURL };
      }

      await updateBuilding(selectedBuilding.id, {
        exteriorImage: imageWithDataURL,
      });

      setIsUploadOpen(false);
    } catch (error) {
      console.error("Failed to upload building image:", error);
      alert("Failed to upload building image. Please try again.");
    }
  };

  // Handle floor creation
  const handleCreateFloor = async () => {
    if (!selectedBuilding) {
      alert("Please select a building first");
      return;
    }

    if (!newFloorName.trim()) {
      alert("Floor name is required");
      return;
    }

    if (!newFloorNumber.trim()) {
      alert("Floor number is required");
      return;
    }

    // Check if floor number already exists
    const floorNum = parseInt(newFloorNumber, 10);
    if (selectedBuilding.floors.some((f) => f.floorNumber === floorNum)) {
      alert("Floor number already exists in this building");
      return;
    }

    try {
      // Create floor without hotspot (will be added later when drawing polygon)
      await addFloor(selectedBuilding.id, {
        name: newFloorName,
        floorNumber: floorNum,
      });

      // Get the newly created floor and select it
      const updatedBuilding = buildings.find(
        (b) => b.id === selectedBuilding.id
      );
      const newFloor = updatedBuilding?.floors.find(
        (f) => f.floorNumber === floorNum
      );

      if (newFloor) {
        setSelectedFloorId(newFloor.id);
      }

      // Reset form and close modal
      setNewFloorName("");
      setNewFloorNumber("");
      setIsAddFloorOpen(false);

      alert("Floor created! Now click the Polygon button to draw its hotspot.");
    } catch (error) {
      console.error("Failed to create floor:", error);
      alert("Failed to create floor. Please try again.");
    }
  };

  // Handle canvas click for polygon drawing
  const handleCanvasClick = useCallback(
    async (e: any) => {
      // If clicking on background and not in drawing mode, deselect
      const clickedOnBackground =
        e.target.getClassName() === "Image" || e.target === e.target.getStage();
      if (clickedOnBackground && drawingMode === "none") {
        setSelectedFloorId(null);
        return;
      }

      if (!selectedBuilding || drawingMode !== "polygon" || !selectedFloorId) {
        return;
      }

      const stage = e.target.getStage();
      const pointerPosition = stage.getRelativePointerPosition();

      if (!pointerPosition) return;

      const point: Point = {
        x: pointerPosition.x,
        y: pointerPosition.y,
      };

      // Check if clicking near the start point to close polygon
      if (tempPoints.length >= 3) {
        const firstPoint = tempPoints[0];
        const distance = Math.sqrt(
          Math.pow(point.x - firstPoint.x, 2) +
            Math.pow(point.y - firstPoint.y, 2)
        );

        // If within 15 pixels of start, close the polygon and save
        if (distance < 15) {
          try {
            await updateFloor(selectedBuilding.id, selectedFloorId, {
              hotspot: {
                type: "polygon",
                vertices: tempPoints,
                closed: true,
              },
            });

            // Reset state
            setTempPoints([]);
            setDrawingMode("none");

            alert("Floor hotspot created successfully!");
          } catch (error) {
            console.error("Failed to save floor hotspot:", error);
            alert("Failed to save floor hotspot. Please try again.");
          }
          return;
        }
      }

      // Add vertex to polygon
      setTempPoints([...tempPoints, point]);
    },
    [selectedBuilding, drawingMode, selectedFloorId, tempPoints, updateFloor]
  );

  // Setup stage event listeners
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    stage.off("click");

    stage.on("click", handleCanvasClick);

    return () => {
      stage.off("click");
    };
  }, [handleCanvasClick]);

  // Handle escape key to cancel drawing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setTempPoints([]);
        setDrawingMode("none");
        setSelectedFloorId(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handle floor deletion
  const handleDeleteFloor = async (floorId: string) => {
    if (!selectedBuilding) return;

    if (
      !window.confirm(
        "Are you sure you want to delete this floor? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await deleteFloor(selectedBuilding.id, floorId);
      setSelectedFloorId(null);
      alert("Floor deleted successfully!");
    } catch (error) {
      console.error("Failed to delete floor:", error);
      alert("Failed to delete floor. Please try again.");
    }
  };

  // Handle floor hotspot deletion
  const handleDeleteFloorHotspot = useCallback(async () => {
    if (!selectedBuilding || !selectedFloorId) return;

    const floor = selectedBuilding.floors.find((f) => f.id === selectedFloorId);
    if (!floor || !floor.hotspot) return;

    if (!window.confirm("Delete this floor hotspot?")) {
      return;
    }

    try {
      await updateFloor(selectedBuilding.id, selectedFloorId, {
        hotspot: undefined,
      });
      setSelectedFloorId(null);
    } catch (error) {
      console.error("Failed to delete hotspot:", error);
      alert("Failed to delete hotspot. Please try again.");
    }
  }, [selectedBuilding, selectedFloorId, updateFloor]);

  // Handle opening edit floor modal
  const handleEditFloor = (floor: FloorReference) => {
    setEditingFloorId(floor.id);
    setEditFloorName(floor.name);
    setEditFloorNumber(floor.floorNumber.toString());
    setIsEditFloorOpen(true);
  };

  // Handle floor update
  const handleUpdateFloor = async () => {
    if (!selectedBuilding || !editingFloorId) return;

    if (!editFloorName.trim()) {
      alert("Floor name is required");
      return;
    }

    const floorNum = parseInt(editFloorNumber, 10);
    if (isNaN(floorNum)) {
      alert("Floor number must be a valid number");
      return;
    }

    // Check for duplicate floor numbers (excluding current floor)
    if (
      selectedBuilding.floors.some(
        (f) => f.id !== editingFloorId && f.floorNumber === floorNum
      )
    ) {
      alert("Floor number already exists in this building");
      return;
    }

    try {
      await updateFloor(selectedBuilding.id, editingFloorId, {
        name: editFloorName,
        floorNumber: floorNum,
      });

      setIsEditFloorOpen(false);
      setEditingFloorId(null);
      setEditFloorName("");
      setEditFloorNumber("");
      alert("Floor updated successfully!");
    } catch (error) {
      console.error("Failed to update floor:", error);
      alert("Failed to update floor. Please try again.");
    }
  };

  // Handle vertex drag
  const handleVertexDragMove = async (
    floorId: string,
    vertexIndex: number,
    newX: number,
    newY: number
  ) => {
    if (!selectedBuilding) return;

    const floor = selectedBuilding.floors.find((f) => f.id === floorId);
    if (!floor || !floor.hotspot) return;

    const newVertices = [...floor.hotspot.vertices];
    newVertices[vertexIndex] = { x: newX, y: newY };

    try {
      await updateFloor(selectedBuilding.id, floorId, {
        hotspot: {
          ...floor.hotspot,
          vertices: newVertices,
        },
      });
    } catch (error) {
      console.error("Failed to update vertex:", error);
    }
  };

  // Handle building export
  const handleExportBuilding = async () => {
    if (!selectedBuilding) {
      alert("Please select a building first");
      return;
    }

    if (!selectedBuilding.exteriorImage) {
      alert("Building exterior image is required for export");
      return;
    }

    if (selectedBuilding.floors.length === 0) {
      alert("Building must have at least one floor to export");
      return;
    }

    // Check if all floors have hotspots
    const floorsWithoutHotspots = selectedBuilding.floors.filter(
      (f) => !f.hotspot || !f.hotspot.vertices || f.hotspot.vertices.length < 3
    );

    if (floorsWithoutHotspots.length > 0) {
      const floorNames = floorsWithoutHotspots.map((f) => f.name).join(", ");
      alert(
        `The following floors are missing hotspots: ${floorNames}\n\nPlease draw hotspots for all floors before exporting.`
      );
      return;
    }

    if (!window.confirm("Export this building to /data/buildings?")) {
      return;
    }

    try {
      const result = await exportBuilding(selectedBuilding.id);
      alert(
        `Building exported successfully!\n\nFiles saved to: ${result.path}\n- ${result.stats.floors} floors exported`
      );
    } catch (error) {
      console.error("Export error:", error);
      alert(
        `Failed to export building: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const internalSidebarWidth = selectedBuilding ? 320 : 0; // w-80 = 320px

  return (
    <div className="h-screen w-screen relative">
      {/* Toolbar - Fixed overlay at top (starts after main sidebar) */}
      <div
        className="fixed top-0 right-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between"
        style={{ zIndex: 10, left: `${sidebarWidth}px` }}
      >
        <div className="flex items-center gap-2">
          {/* Building Selector */}
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-gray-600" />
            <select
              value={selectedBuildingId || ""}
              onChange={(e) => handleBuildingSelect(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Select building"
              aria-label="Select building"
            >
              <option value="">Select Building</option>
              {masterPlanBuildings.map((building) => (
                <option key={building.id} value={building.id}>
                  {building.name}
                </option>
              ))}
            </select>
          </div>

          {selectedBuilding && (
            <>
              <div className="w-px h-6 bg-gray-300 mx-2" />

              {/* Upload Button */}
              <button
                onClick={() => setIsUploadOpen(true)}
                className={`px-3 py-2 rounded-lg border-2 transition-colors flex items-center gap-2 ${
                  !buildingImageUrl
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:border-gray-300 text-gray-700"
                }`}
                title="Upload building exterior image"
              >
                <Upload className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {buildingImageUrl ? "Change Image" : "Upload Image"}
                </span>
              </button>

              {buildingImageUrl && (
                <>
                  <div className="w-px h-6 bg-gray-300 mx-2" />

                  {/* Drawing Tools */}
                  <button
                    onClick={() => {
                      setDrawingMode("none");
                      setTempPoints([]);
                    }}
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
                    onClick={() => {
                      if (!selectedFloorId) {
                        alert("Please select a floor first");
                        return;
                      }
                      setDrawingMode("polygon");
                      setTempPoints([]);
                    }}
                    disabled={!selectedFloorId}
                    className={`p-2 rounded-lg border-2 transition-colors ${
                      drawingMode === "polygon"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : !selectedFloorId
                        ? "border-gray-200 text-gray-400 cursor-not-allowed"
                        : "border-gray-200 hover:border-gray-300 text-gray-700"
                    }`}
                    title={
                      selectedFloorId
                        ? "Draw floor hotspot polygon"
                        : "Select a floor first"
                    }
                  >
                    <Pentagon className="w-4 h-4" />
                  </button>
                </>
              )}
            </>
          )}
        </div>

        {/* Info & Actions */}
        {selectedBuilding && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {selectedBuilding.floors.length} floors
            </span>

            {/* Export Button */}
            {selectedBuilding.floors.length > 0 && buildingImageUrl && (
              <>
                <div className="w-px h-6 bg-gray-300" />
                <button
                  onClick={handleExportBuilding}
                  className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  title="Export building to /data/buildings"
                >
                  <Download className="w-4 h-4" />
                  <span className="text-sm font-medium">Export Building</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Sidebar - Floor List (Fixed overlay on left, next to main sidebar) */}
      {selectedBuilding && (
        <div
          className="fixed top-16 bottom-0 w-80 bg-gray-400/70 backdrop-blur-md border-r border-gray-200 overflow-y-auto shadow-lg"
          style={{ left: `${sidebarWidth}px`, zIndex: 15 }}
        >
          <div className="p-4">
            {/* Add Floor Button */}
            <button
              onClick={() => setIsAddFloorOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mb-4"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Add Floor</span>
            </button>

            {/* Floor List */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Floors
              </h3>
              {selectedBuilding.floors.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  No floors added yet.
                  <br />
                  Click "Add Floor" to begin.
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedBuilding.floors
                    .sort((a, b) => b.floorNumber - a.floorNumber)
                    .map((floor) => (
                      <div
                        key={floor.id}
                        className={`p-3 border rounded-lg transition-colors cursor-pointer ${
                          selectedFloorId === floor.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => setSelectedFloorId(floor.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div className="font-medium text-gray-900">
                                {floor.name}
                              </div>
                              {!floor.hotspot && (
                                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                                  No hotspot
                                </span>
                              )}
                            </div>
                            <div
                              className={`text-sm ${
                                selectedFloorId === floor.id
                                  ? "text-gray-900"
                                  : "text-gray-200"
                              }`}
                            >
                              Floor {floor.floorNumber}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditFloor(floor);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit floor"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteFloor(floor.id);
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete floor"
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

      {/* Canvas Area - Full viewport */}
      <div
        className="fixed inset-0"
        style={{
          cursor: drawingMode !== "none" ? "crosshair" : "default",
          zIndex: 0,
        }}
      >
        {!selectedBuilding ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
            <Building2 className="w-16 h-16 mb-4" />
            <p className="text-lg mb-2">No building selected</p>
            <p className="text-sm">
              Select a building from the dropdown to begin
            </p>
          </div>
        ) : !buildingImageUrl ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
            <Upload className="w-16 h-16 mb-4" />
            <p className="text-lg mb-2">No building image uploaded</p>
            <p className="text-sm">Click "Upload Image" to begin</p>
          </div>
        ) : (
          <FullViewportCanvas
            imageUrl={buildingImageUrl}
            onCanvasReady={(stage) => {
              stageRef.current = stage;
            }}
          >
            {/* Render floor hotspots */}
            <Group>
              {/* Existing floor hotspots */}
              {selectedBuilding.floors
                .filter((floor) => floor.hotspot)
                .map((floor) => {
                  const isSelected = selectedFloorId === floor.id;
                  const points = floor.hotspot!.vertices.flatMap((p) => [
                    p.x,
                    p.y,
                  ]);

                  return (
                    <Group key={floor.id}>
                      {/* Polygon fill */}
                      <Line
                        points={points}
                        closed
                        fill={
                          isSelected
                            ? "rgba(34, 197, 94, 0.3)"
                            : "rgba(139, 92, 246, 0.2)"
                        }
                        stroke={isSelected ? "#22c55e" : "#8b5cf6"}
                        strokeWidth={2}
                        onClick={() => setSelectedFloorId(floor.id)}
                        onTap={() => setSelectedFloorId(floor.id)}
                      />

                      {/* Floor label */}
                      <Text
                        x={
                          floor.hotspot!.vertices.reduce(
                            (sum, v) => sum + v.x,
                            0
                          ) / floor.hotspot!.vertices.length
                        }
                        y={
                          floor.hotspot!.vertices.reduce(
                            (sum, v) => sum + v.y,
                            0
                          ) / floor.hotspot!.vertices.length
                        }
                        text={floor.name}
                        fontSize={14}
                        fill={isSelected ? "#16a34a" : "#6d28d9"}
                        fontStyle="bold"
                        align="center"
                        offsetX={30}
                      />

                      {/* Vertex handles when selected */}
                      {isSelected &&
                        floor.hotspot!.vertices.map((point, idx) => (
                          <Circle
                            key={idx}
                            x={point.x}
                            y={point.y}
                            radius={6}
                            fill="#22c55e"
                            stroke="#fff"
                            strokeWidth={2}
                            draggable
                            onDragMove={(e) => {
                              const newX = e.target.x();
                              const newY = e.target.y();
                              handleVertexDragMove(floor.id, idx, newX, newY);
                            }}
                            onMouseEnter={(e) => {
                              const stage = e.target.getStage();
                              if (stage) {
                                stage.container().style.cursor = "move";
                              }
                            }}
                            onMouseLeave={(e) => {
                              const stage = e.target.getStage();
                              if (stage) {
                                stage.container().style.cursor =
                                  drawingMode !== "none"
                                    ? "crosshair"
                                    : "default";
                              }
                            }}
                          />
                        ))}
                    </Group>
                  );
                })}

              {/* Temporary drawing points */}
              {drawingMode === "polygon" && tempPoints.length > 0 && (
                <Group>
                  {/* Draw lines between points */}
                  <Line
                    points={tempPoints.flatMap((p) => [p.x, p.y])}
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dash={[5, 5]}
                  />

                  {/* Draw points */}
                  {tempPoints.map((point, idx) => (
                    <Circle
                      key={idx}
                      x={point.x}
                      y={point.y}
                      radius={5}
                      fill={idx === 0 ? "#10b981" : "#3b82f6"}
                      stroke="#fff"
                      strokeWidth={2}
                    />
                  ))}

                  {/* Line from last point to first (if enough points) */}
                  {tempPoints.length >= 3 && (
                    <Line
                      points={[
                        tempPoints[tempPoints.length - 1].x,
                        tempPoints[tempPoints.length - 1].y,
                        tempPoints[0].x,
                        tempPoints[0].y,
                      ]}
                      stroke="#10b981"
                      strokeWidth={2}
                      dash={[10, 5]}
                    />
                  )}
                </Group>
              )}
            </Group>
          </FullViewportCanvas>
        )}

        {/* Delete Hotspot Button - Shows when floor with hotspot is selected */}
        {selectedBuilding &&
          selectedFloorId &&
          selectedBuilding.floors.find((f) => f.id === selectedFloorId)
            ?.hotspot &&
          drawingMode === "none" && (
            <button
              onClick={handleDeleteFloorHotspot}
              className="absolute bottom-4 right-4 z-10 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 shadow-lg"
              title="Delete floor hotspot"
            >
              <Trash2 className="w-4 h-4" />
              Delete Hotspot
            </button>
          )}
      </div>

      {/* Add Floor Modal */}
      {isAddFloorOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Add Floor
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Floor Name
                </label>
                <input
                  type="text"
                  value={newFloorName}
                  onChange={(e) => setNewFloorName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ground Floor"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Floor Number
                </label>
                <input
                  type="number"
                  value={newFloorNumber}
                  onChange={(e) => setNewFloorNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>

              <p className="text-sm text-gray-600">
                After creating the floor, select it from the list and click the
                Polygon button to draw its hotspot.
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsAddFloorOpen(false);
                  setNewFloorName("");
                  setNewFloorNumber("");
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFloor}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Floor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Floor Modal */}
      {isEditFloorOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Edit Floor
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Floor Name
                </label>
                <input
                  type="text"
                  value={editFloorName}
                  onChange={(e) => setEditFloorName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ground Floor"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Floor Number
                </label>
                <input
                  type="number"
                  value={editFloorNumber}
                  onChange={(e) => setEditFloorNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsEditFloorOpen(false);
                  setEditingFloorId(null);
                  setEditFloorName("");
                  setEditFloorNumber("");
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateFloor}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Upload Building Exterior Image
            </h3>

            <ImageDropzone
              onImageSelect={handleImageUpload}
              currentImage={selectedBuilding?.exteriorImage || null}
              onImageRemove={async () => {
                if (
                  selectedBuilding &&
                  window.confirm(
                    "Are you sure you want to remove the building image?"
                  )
                ) {
                  await updateBuilding(selectedBuilding.id, {
                    exteriorImage: undefined,
                  });
                  setBuildingImageUrl(null);
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
    </div>
  );
}
