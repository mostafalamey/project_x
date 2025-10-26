/**
 * Floor Editor Component
 * Full-screen editor for floor plan configuration with unit hotspots
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useFloorsStore } from "../../stores/floorsStore";
import { useBuildingsStore } from "../../stores/buildingsStore";
import { useModelsStore } from "../../stores/modelsStore";
import { ImageDropzone } from "../upload";
import { FullViewportCanvas } from "../canvas";
import { imageRefToDataURL } from "../../utils/imageProcessing";
import { exportFloor, checkServerHealth } from "../../services/api/floorExport";
import type { ImageRef, Point, UnitHotspot } from "../../types/admin-config";
import {
  Upload,
  Plus,
  Pentagon,
  Hand,
  Download,
  Layers,
  Edit2,
  Trash2,
  Building2,
} from "lucide-react";
import { Line, Circle, Group, Text } from "react-konva";

// ============================================================================
// Component Props
// ============================================================================

interface FloorEditorProps {
  projectId: string;
}

// ============================================================================
// Component
// ============================================================================

export default function FloorEditor({ projectId }: FloorEditorProps) {
  const {
    floors,
    selectedFloorId,
    selectedUnitId,
    loadAllFloors,
    selectFloor,
    updateFloor,
    addUnit,
    updateUnit,
    deleteUnit,
    selectUnit,
  } = useFloorsStore();

  const { buildings, loadBuildings } = useBuildingsStore();
  const { models, loadModels } = useModelsStore();

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAddUnitOpen, setIsAddUnitOpen] = useState(false);
  const [isEditUnitOpen, setIsEditUnitOpen] = useState(false);
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [floorImageUrl, setFloorImageUrl] = useState<string | null>(null);
  const [drawingMode, setDrawingMode] = useState<"none" | "polygon">("none");
  const [tempPoints, setTempPoints] = useState<Point[]>([]);
  const [newUnitNumber, setNewUnitNumber] = useState("");
  const [newUnitModelId, setNewUnitModelId] = useState("");
  const [newUnitAvailability, setNewUnitAvailability] = useState<
    "available" | "sold" | "reserved"
  >("available");
  const [newUnitPrice, setNewUnitPrice] = useState("");
  const [overlappingUnits, setOverlappingUnits] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const stageRef = useRef<any>(null);

  // Helper function to check if two polygons overlap
  const checkPolygonsOverlap = useCallback(
    (poly1: Point[], poly2: Point[]): boolean => {
      // Simple bounding box check first (fast)
      const bbox1 = {
        minX: Math.min(...poly1.map((p) => p.x)),
        maxX: Math.max(...poly1.map((p) => p.x)),
        minY: Math.min(...poly1.map((p) => p.y)),
        maxY: Math.max(...poly1.map((p) => p.y)),
      };
      const bbox2 = {
        minX: Math.min(...poly2.map((p) => p.x)),
        maxX: Math.max(...poly2.map((p) => p.x)),
        minY: Math.min(...poly2.map((p) => p.y)),
        maxY: Math.max(...poly2.map((p) => p.y)),
      };

      // If bounding boxes don't overlap, polygons definitely don't overlap
      if (
        bbox1.maxX < bbox2.minX ||
        bbox2.maxX < bbox1.minX ||
        bbox1.maxY < bbox2.minY ||
        bbox2.maxY < bbox1.minY
      ) {
        return false;
      }

      // Check if any point from poly1 is inside poly2 or vice versa
      const isPointInPolygon = (point: Point, polygon: Point[]): boolean => {
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
          const xi = polygon[i].x,
            yi = polygon[i].y;
          const xj = polygon[j].x,
            yj = polygon[j].y;
          const intersect =
            yi > point.y !== yj > point.y &&
            point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
          if (intersect) inside = !inside;
        }
        return inside;
      };

      // Check if any vertex from one polygon is inside the other
      for (const point of poly1) {
        if (isPointInPolygon(point, poly2)) return true;
      }
      for (const point of poly2) {
        if (isPointInPolygon(point, poly1)) return true;
      }

      return false;
    },
    []
  );

  // Load data on mount
  useEffect(() => {
    loadBuildings(projectId);
    loadModels(projectId);
    loadAllFloors(projectId);
  }, [projectId, loadBuildings, loadModels, loadAllFloors]);

  // Get selected floor
  const selectedFloor = floors.find((f) => f.id === selectedFloorId);

  // Check for overlapping units whenever floor units change
  useEffect(() => {
    if (!selectedFloor) {
      setOverlappingUnits([]);
      return;
    }

    const unitsWithGeometry = selectedFloor.units.filter(
      (u) => u.geometry.vertices.length >= 3
    );

    const overlapping: string[] = [];
    for (let i = 0; i < unitsWithGeometry.length; i++) {
      for (let j = i + 1; j < unitsWithGeometry.length; j++) {
        const unit1 = unitsWithGeometry[i];
        const unit2 = unitsWithGeometry[j];
        if (
          checkPolygonsOverlap(unit1.geometry.vertices, unit2.geometry.vertices)
        ) {
          if (!overlapping.includes(unit1.id)) overlapping.push(unit1.id);
          if (!overlapping.includes(unit2.id)) overlapping.push(unit2.id);
        }
      }
    }

    setOverlappingUnits(overlapping);
  }, [selectedFloor, checkPolygonsOverlap]);

  // Update floor image URL when floor changes
  useEffect(() => {
    if (selectedFloor?.floorPlanImage?.url) {
      setFloorImageUrl(selectedFloor.floorPlanImage.url);
    } else {
      setFloorImageUrl(null);
    }
  }, [selectedFloor]);

  // Group floors by building
  const floorsByBuilding = floors.reduce((acc, floor) => {
    if (!acc[floor.buildingId]) {
      acc[floor.buildingId] = [];
    }
    acc[floor.buildingId].push(floor);
    return acc;
  }, {} as Record<string, typeof floors>);

  // Handle floor selection
  const handleFloorSelect = (floorId: string) => {
    if (!floorId) {
      selectFloor(null);
      return;
    }
    selectFloor(floorId);
  };

  // Handle image upload
  const handleImageUpload = async (imageRef: ImageRef) => {
    if (!selectedFloor) {
      return;
    }

    try {
      // Convert blob to data URL for persistence
      let imageWithDataURL = imageRef;
      if (imageRef.blob) {
        const dataURL = await imageRefToDataURL(imageRef);
        imageWithDataURL = { ...imageRef, url: dataURL };
      }

      await updateFloor(selectedFloor.id, {
        floorPlanImage: imageWithDataURL,
      });

      setIsUploadOpen(false);
    } catch (error) {
      console.error("Failed to upload floor plan image:", error);
    }
  };

  // Handle canvas click for polygon drawing
  const handleCanvasClick = useCallback(
    async (e: any) => {
      // If clicking on background and not in drawing mode, deselect
      const clickedOnBackground =
        e.target.getClassName() === "Image" || e.target === e.target.getStage();
      if (clickedOnBackground && drawingMode === "none") {
        selectUnit(null);
        return;
      }

      if (!selectedFloor || drawingMode !== "polygon") {
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
          // Save the polygon to the selected unit
          if (!selectedUnitId) {
            setDrawingMode("none");
            setTempPoints([]);
            return;
          }

          const unit = selectedFloor.units.find((u) => u.id === selectedUnitId);
          if (!unit) {
            setDrawingMode("none");
            setTempPoints([]);
            return;
          }

          // Update unit with polygon
          updateUnit(selectedFloor.id, selectedUnitId, {
            geometry: {
              type: "polygon",
              vertices: tempPoints,
              closed: true,
            },
          })
            .then(() => {
              setDrawingMode("none");
              setTempPoints([]);
            })
            .catch((error) => {
              console.error("Failed to update unit polygon:", error);
            });
          return;
        }
      }

      // Add vertex to polygon
      setTempPoints([...tempPoints, point]);
    },
    [selectedFloor, selectedUnitId, drawingMode, tempPoints, updateUnit]
  );

  // Handle unit creation
  const handleCreateUnit = async () => {
    if (!selectedFloor) {
      return;
    }

    if (!newUnitNumber.trim()) {
      return;
    }

    if (!newUnitModelId) {
      return;
    }

    // Check for duplicate unit numbers
    if (selectedFloor.units.some((u) => u.unitNumber === newUnitNumber)) {
      return;
    }

    try {
      // Create unit without geometry (will be drawn later)
      await addUnit(selectedFloor.id, {
        unitNumber: newUnitNumber,
        modelId: newUnitModelId,
        availability: newUnitAvailability,
        pricing: newUnitPrice ? { price: parseFloat(newUnitPrice) } : undefined,
        geometry: {
          type: "polygon",
          vertices: [],
          closed: true,
        },
      });

      // Reset form
      setNewUnitNumber("");
      setNewUnitModelId("");
      setNewUnitAvailability("available");
      setNewUnitPrice("");
      setTempPoints([]);
      setIsAddUnitOpen(false);
    } catch (error) {
      console.error("Failed to create unit:", error);
    }
  };

  // Handle unit deletion
  const handleDeleteUnit = async (unitId: string) => {
    if (!selectedFloor) return;

    if (
      !window.confirm(
        "Are you sure you want to delete this unit? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await deleteUnit(selectedFloor.id, unitId);
      selectUnit(null);
    } catch (error) {
      console.error("Failed to delete unit:", error);
    }
  };

  // Handle unit vertex dragging
  const handleVertexDragMove = async (
    unitId: string,
    vertexIndex: number,
    newX: number,
    newY: number
  ) => {
    if (!selectedFloor) return;

    const unit = selectedFloor.units.find((u) => u.id === unitId);
    if (!unit || unit.geometry.vertices.length === 0) return;

    const newVertices = [...unit.geometry.vertices];
    newVertices[vertexIndex] = { x: newX, y: newY };

    try {
      await updateUnit(selectedFloor.id, unitId, {
        geometry: {
          ...unit.geometry,
          vertices: newVertices,
        },
      });
    } catch (error) {
      console.error("Failed to update vertex:", error);
    }
  };

  // Handle opening edit modal
  const handleEditUnit = (unit: UnitHotspot) => {
    setEditingUnitId(unit.id);
    setNewUnitNumber(unit.unitNumber);
    setNewUnitModelId(unit.modelId);
    setNewUnitAvailability(unit.availability);
    setNewUnitPrice(unit.pricing?.price?.toString() || "");
    setIsEditUnitOpen(true);
  };

  // Handle unit update
  const handleUpdateUnit = async () => {
    if (!selectedFloor || !editingUnitId) return;

    if (!newUnitNumber.trim()) {
      return;
    }

    if (!newUnitModelId) {
      return;
    }

    // Check for duplicate unit numbers (excluding current unit)
    const duplicate = selectedFloor.units.find(
      (u) => u.unitNumber === newUnitNumber && u.id !== editingUnitId
    );
    if (duplicate) {
      return;
    }

    try {
      await updateUnit(selectedFloor.id, editingUnitId, {
        unitNumber: newUnitNumber,
        modelId: newUnitModelId,
        availability: newUnitAvailability,
        pricing: newUnitPrice ? { price: parseFloat(newUnitPrice) } : undefined,
      });

      // Reset form
      setNewUnitNumber("");
      setNewUnitModelId("");
      setNewUnitAvailability("available");
      setNewUnitPrice("");
      setEditingUnitId(null);
      setIsEditUnitOpen(false);
    } catch (error) {
      console.error("Failed to update unit:", error);
    }
  };

  // Handle export floor
  const handleExportFloor = useCallback(async () => {
    if (!selectedFloor) {
      window.alert("Please select a floor to export");
      return;
    }

    if (selectedFloor.units.length === 0) {
      window.alert("No units to export. Please add units before exporting.");
      return;
    }

    const building = buildings.find((b) => b.id === selectedFloor.buildingId);
    if (!building) {
      window.alert("Building not found for this floor");
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

      // Export floor
      const response = await exportFloor({
        floor: selectedFloor,
        building: {
          id: building.id,
          name: building.name,
        },
        models,
        projectId,
      });

      window.alert(
        `✅ Floor Exported!\n\n` +
          `Floor: ${selectedFloor.name} (Floor ${selectedFloor.floorNumber})\n` +
          `Building: ${building.name}\n` +
          `Units: ${response.stats.units}\n` +
          `Models Referenced: ${response.stats.modelsReferenced}\n\n` +
          `Saved to: ${response.files.floor}`
      );
    } catch (error) {
      console.error("Export failed:", error);
      window.alert(
        `❌ Export Failed\n\n${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsExporting(false);
    }
  }, [selectedFloor, buildings, models, projectId]);

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
        selectUnit(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectUnit]);

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Floor Selector */}
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-gray-600" />
            <select
              value={selectedFloorId || ""}
              onChange={(e) => handleFloorSelect(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Select floor"
            >
              <option value="">Select Floor</option>
              {Object.entries(floorsByBuilding).map(
                ([buildingId, buildingFloors]) => {
                  const building = buildings.find((b) => b.id === buildingId);
                  return (
                    <optgroup
                      key={buildingId}
                      label={building?.name || buildingId}
                    >
                      {buildingFloors
                        .sort((a, b) => b.floorNumber - a.floorNumber)
                        .map((floor) => (
                          <option key={floor.id} value={floor.id}>
                            {floor.name} (Floor {floor.floorNumber})
                          </option>
                        ))}
                    </optgroup>
                  );
                }
              )}
            </select>
          </div>

          {selectedFloor && (
            <>
              <div className="w-px h-6 bg-gray-300 mx-2" />

              {/* Upload Button */}
              <button
                onClick={() => setIsUploadOpen(true)}
                className={`px-3 py-2 rounded-lg border-2 transition-colors flex items-center gap-2 ${
                  !floorImageUrl
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:border-gray-300 text-gray-700"
                }`}
                title="Upload floor plan image"
              >
                <Upload className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {floorImageUrl ? "Change Image" : "Upload Image"}
                </span>
              </button>

              {floorImageUrl && (
                <>
                  <div className="w-px h-6 bg-gray-300 mx-2" />

                  {/* Drawing Tools */}
                  <button
                    onClick={() => {
                      setDrawingMode("none");
                      setTempPoints([]);
                      selectUnit(null);
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
                      if (!selectedUnitId) {
                        return;
                      }
                      setDrawingMode("polygon");
                      setTempPoints([]);
                    }}
                    disabled={!selectedUnitId}
                    className={`p-2 rounded-lg border-2 transition-colors ${
                      drawingMode === "polygon"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : selectedUnitId
                        ? "border-gray-200 hover:border-gray-300 text-gray-700"
                        : "border-gray-200 text-gray-400 cursor-not-allowed opacity-50"
                    }`}
                    title={
                      selectedUnitId
                        ? "Draw unit polygon"
                        : "Select a unit first"
                    }
                  >
                    <Pentagon className="w-4 h-4" />
                  </button>
                </>
              )}
            </>
          )}
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {selectedFloor && selectedFloor.units.length > 0 && (
            <button
              onClick={handleExportFloor}
              disabled={isExporting}
              className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                isExporting
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              } text-white`}
              title="Export floor configuration to backend"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">
                {isExporting ? "Exporting..." : "Export Floor"}
              </span>
            </button>
          )}

          {/* Info */}
          {selectedFloor && (
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>{selectedFloor.units.length} units</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Unit List */}
        {selectedFloor && floorImageUrl && (
          <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
            <div className="p-4">
              {/* Building Info */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  Building
                </h3>
                <div className="space-y-1 text-xs text-gray-600">
                  <div>
                    <span className="font-medium">ID:</span>{" "}
                    {selectedFloor.buildingId}
                  </div>
                  <div>
                    <span className="font-medium">Name:</span>{" "}
                    {buildings.find((b) => b.id === selectedFloor.buildingId)
                      ?.name || "Unknown"}
                  </div>
                </div>
              </div>

              {/* Add Unit Button */}
              <button
                onClick={() => setIsAddUnitOpen(true)}
                className="w-full mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Unit
              </button>

              {/* Overlap Warning */}
              {overlappingUnits.length > 0 && (
                <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <span className="text-orange-600 text-lg">⚠️</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-orange-900">
                        Overlapping Units Detected
                      </p>
                      <p className="text-xs text-orange-700 mt-1">
                        {overlappingUnits.length} unit
                        {overlappingUnits.length > 1 ? "s" : ""}{" "}
                        {overlappingUnits.length > 1 ? "have" : "has"}{" "}
                        overlapping boundaries. Check units marked with ⚠️
                        below.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Unit List */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Units
                </h3>
                {selectedFloor.units.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">
                    No units added yet.
                    <br />
                    Click "Add Unit" to begin.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedFloor.units.map((unit) => {
                      const model = models.find((m) => m.id === unit.modelId);
                      const hasPolygon = unit.geometry.vertices.length > 0;
                      const isOverlapping = overlappingUnits.includes(unit.id);
                      return (
                        <div
                          key={unit.id}
                          className={`p-3 border rounded-lg transition-colors cursor-pointer ${
                            selectedUnitId === unit.id
                              ? "border-blue-500 bg-blue-50"
                              : isOverlapping
                              ? "border-orange-300 bg-orange-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => selectUnit(unit.id)}
                        >
                          {/* Unit Header with Title and Action Buttons */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 flex-1">
                              <div className="font-medium text-gray-900">
                                Unit {unit.unitNumber}
                              </div>
                              {!hasPolygon && (
                                <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded">
                                  No polygon
                                </span>
                              )}
                              {isOverlapping && (
                                <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-800 rounded flex items-center gap-1">
                                  ⚠️ Overlap
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditUnit(unit);
                                }}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Edit unit"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteUnit(unit.id);
                                }}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Delete unit"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Unit Details */}
                          <div>
                            <div className="text-xs text-gray-600 space-y-0.5">
                              {model ? (
                                <>
                                  <div>
                                    <span className="font-medium">Model:</span>{" "}
                                    {model.id}
                                  </div>
                                  <div className="flex gap-3">
                                    {model.bedrooms !== undefined && (
                                      <span>🛏️ {model.bedrooms} bed</span>
                                    )}
                                    {model.bathrooms !== undefined && (
                                      <span>🚿 {model.bathrooms} bath</span>
                                    )}
                                  </div>
                                  {model.areaM2 && (
                                    <div>📏 {model.areaM2} m²</div>
                                  )}
                                </>
                              ) : (
                                <div className="text-gray-400">
                                  Unknown Model
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-gray-400 mt-1.5">
                              {unit.availability === "available" &&
                                "🟢 Available"}
                              {unit.availability === "sold" && "🔴 Sold"}
                              {unit.availability === "reserved" &&
                                "🟡 Reserved"}
                            </div>
                          </div>
                        </div>
                      );
                    })}
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
          {floors.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
              <Building2 className="w-16 h-16 mb-4" />
              <p className="text-lg mb-2 font-semibold">No floors exist</p>
              <p className="text-sm mb-4 text-center max-w-md">
                Floors are created in the Building section by drawing hotspots
                on building exterior images.
              </p>
              <button
                onClick={() => {
                  // Navigate to Buildings tab
                  const buildingsTab = document.querySelector(
                    '[role="tab"][aria-label="Buildings"]'
                  ) as HTMLElement;
                  if (buildingsTab) buildingsTab.click();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Building2 className="w-4 h-4" />
                Go to Buildings Section
              </button>
            </div>
          ) : !selectedFloor ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
              <Layers className="w-16 h-16 mb-4" />
              <p className="text-lg mb-2">No floor selected</p>
              <p className="text-sm">
                Select a floor from the dropdown to begin
              </p>
            </div>
          ) : !floorImageUrl ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
              <Upload className="w-16 h-16 mb-4" />
              <p className="text-lg mb-2">No floor plan image uploaded</p>
              <p className="text-sm">Click "Upload Image" to begin</p>
            </div>
          ) : (
            <FullViewportCanvas
              imageUrl={floorImageUrl}
              onCanvasReady={(stage) => {
                stageRef.current = stage;
              }}
            >
              <Group>
                {/* Existing unit hotspots */}
                {selectedFloor.units
                  .filter((unit) => unit.geometry)
                  .map((unit) => {
                    const isSelected = selectedUnitId === unit.id;
                    const isOverlapping = overlappingUnits.includes(unit.id);
                    const points = unit.geometry!.vertices.flatMap((p) => [
                      p.x,
                      p.y,
                    ]);

                    return (
                      <Group key={unit.id}>
                        {/* Polygon fill */}
                        <Line
                          points={points}
                          closed
                          fill={
                            isSelected
                              ? "rgba(59, 130, 246, 0.3)"
                              : isOverlapping
                              ? "rgba(251, 146, 60, 0.2)"
                              : "rgba(139, 92, 246, 0.2)"
                          }
                          stroke={
                            isSelected
                              ? "#3b82f6"
                              : isOverlapping
                              ? "#f97316"
                              : "#8b5cf6"
                          }
                          strokeWidth={isOverlapping ? 3 : 2}
                          onClick={() => selectUnit(unit.id)}
                          onTap={() => selectUnit(unit.id)}
                        />

                        {/* Unit label */}
                        <Text
                          x={
                            unit.geometry!.vertices.reduce(
                              (sum, v) => sum + v.x,
                              0
                            ) / unit.geometry!.vertices.length
                          }
                          y={
                            unit.geometry!.vertices.reduce(
                              (sum, v) => sum + v.y,
                              0
                            ) / unit.geometry!.vertices.length
                          }
                          text={
                            isOverlapping
                              ? `⚠️ ${unit.unitNumber}`
                              : unit.unitNumber
                          }
                          fontSize={14}
                          fill={
                            isSelected
                              ? "#1e40af"
                              : isOverlapping
                              ? "#c2410c"
                              : "#6d28d9"
                          }
                          fontStyle="bold"
                          align="center"
                          offsetX={isOverlapping ? 30 : 20}
                        />

                        {/* Draggable vertices (only for selected unit) */}
                        {isSelected &&
                          unit.geometry!.vertices.map((vertex, idx) => (
                            <Circle
                              key={idx}
                              x={vertex.x}
                              y={vertex.y}
                              radius={6}
                              fill="#3b82f6"
                              stroke="#fff"
                              strokeWidth={2}
                              draggable
                              onDragMove={(e) => {
                                const newX = e.target.x();
                                const newY = e.target.y();
                                handleVertexDragMove(unit.id, idx, newX, newY);
                              }}
                              onMouseEnter={(e) => {
                                const container = e.target
                                  .getStage()
                                  ?.container();
                                if (container) {
                                  container.style.cursor = "move";
                                }
                              }}
                              onMouseLeave={(e) => {
                                const container = e.target
                                  .getStage()
                                  ?.container();
                                if (container) {
                                  container.style.cursor = "default";
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
        </div>
      </div>

      {/* Add Unit Modal */}
      {isAddUnitOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Add Unit
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit Number
                </label>
                <input
                  type="text"
                  value={newUnitNumber}
                  onChange={(e) => setNewUnitNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="101"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Model
                </label>
                <select
                  value={newUnitModelId}
                  onChange={(e) => setNewUnitModelId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  title="Select unit model"
                >
                  <option value="">Select model</option>
                  {models.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Show inherited model properties */}
              {newUnitModelId && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs font-medium text-gray-500 mb-2">
                    Model Details
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    {(() => {
                      const selectedModel = models.find(
                        (m) => m.id === newUnitModelId
                      );
                      if (!selectedModel) return null;

                      return (
                        <>
                          <div>
                            <span className="text-gray-500">Bedrooms:</span>
                            <span className="ml-1 font-medium text-gray-900">
                              {selectedModel.bedrooms}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Bathrooms:</span>
                            <span className="ml-1 font-medium text-gray-900">
                              {selectedModel.bathrooms}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Area:</span>
                            <span className="ml-1 font-medium text-gray-900">
                              {selectedModel.areaM2}m²
                            </span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={newUnitAvailability}
                  onChange={(e) =>
                    setNewUnitAvailability(e.target.value as any)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  title="Unit availability status"
                >
                  <option value="available">Available</option>
                  <option value="sold">Sold</option>
                  <option value="reserved">Reserved</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (optional)
                </label>
                <input
                  type="number"
                  value={newUnitPrice}
                  onChange={(e) => setNewUnitPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsAddUnitOpen(false);
                  setNewUnitNumber("");
                  setNewUnitModelId("");
                  setNewUnitAvailability("available");
                  setNewUnitPrice("");
                  setTempPoints([]);
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateUnit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Unit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Unit Modal */}
      {isEditUnitOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Edit Unit
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit Number
                </label>
                <input
                  type="text"
                  value={newUnitNumber}
                  onChange={(e) => setNewUnitNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="101"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Model
                </label>
                <select
                  value={newUnitModelId}
                  onChange={(e) => setNewUnitModelId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  title="Select unit model"
                >
                  <option value="">Select model</option>
                  {models.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Show inherited model properties */}
              {newUnitModelId && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs font-medium text-gray-500 mb-2">
                    Model Details
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    {(() => {
                      const selectedModel = models.find(
                        (m) => m.id === newUnitModelId
                      );
                      if (!selectedModel) return null;

                      return (
                        <>
                          <div>
                            <span className="text-gray-500">Bedrooms:</span>
                            <span className="ml-1 font-medium text-gray-900">
                              {selectedModel.bedrooms}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Bathrooms:</span>
                            <span className="ml-1 font-medium text-gray-900">
                              {selectedModel.bathrooms}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Area:</span>
                            <span className="ml-1 font-medium text-gray-900">
                              {selectedModel.areaM2}m²
                            </span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={newUnitAvailability}
                  onChange={(e) =>
                    setNewUnitAvailability(e.target.value as any)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  title="Unit availability status"
                >
                  <option value="available">Available</option>
                  <option value="sold">Sold</option>
                  <option value="reserved">Reserved</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (optional)
                </label>
                <input
                  type="number"
                  value={newUnitPrice}
                  onChange={(e) => setNewUnitPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsEditUnitOpen(false);
                  setNewUnitNumber("");
                  setNewUnitModelId("");
                  setNewUnitAvailability("available");
                  setNewUnitPrice("");
                  setEditingUnitId(null);
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateUnit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Update Unit
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
              Upload Floor Plan Image
            </h3>

            <ImageDropzone
              onImageSelect={handleImageUpload}
              currentImage={selectedFloor?.floorPlanImage || null}
              onImageRemove={async () => {
                if (
                  selectedFloor &&
                  window.confirm(
                    "Are you sure you want to remove the floor plan image?"
                  )
                ) {
                  await updateFloor(selectedFloor.id, {
                    floorPlanImage: undefined,
                  });
                }
              }}
              maxSizeMB={20}
            />

            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setIsUploadOpen(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
