/**
 * Tour Scene Editor Component
 * Full-screen editor for 360° virtual tour configuration with React Photo Sphere Viewer
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { Viewer } from "@photo-sphere-viewer/core";
import "@photo-sphere-viewer/core/index.css";
import { MarkersPlugin } from "@photo-sphere-viewer/markers-plugin";
import "@photo-sphere-viewer/markers-plugin/index.css";
import { useToursStore } from "../../stores/toursStore";
import { ImageDropzone } from "../upload";
import { imageRefToDataURL } from "../../utils/imageProcessing";
import {
  exportTourToBackend,
  downloadTourAsJSON,
} from "../../services/tourExport";
import type { ImageRef, SceneHotspot } from "../../types/admin-config";
import {
  Upload,
  Plus,
  Trash2,
  Edit2,
  Play,
  Star,
  Camera,
  Navigation,
  Download,
  X,
  ArrowRight,
  DoorOpen,
  Info,
} from "lucide-react";

// ============================================================================
// Component Props
// ============================================================================

interface TourSceneEditorProps {
  modelId: string;
  projectId: string;
  onClose?: () => void;
}

// ============================================================================
// Component
// ============================================================================

export default function TourSceneEditor({
  modelId,
  projectId,
  onClose,
}: TourSceneEditorProps) {
  const {
    tours,
    selectedSceneId,
    selectedHotspotId,
    loadTours,
    createTour,
    getTourByModelId,
    addScene,
    updateScene,
    deleteScene,
    selectScene,
    setStartingScene,
    addHotspot,
    updateHotspot,
    deleteHotspot,
    selectHotspot,
  } = useToursStore();

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAddHotspotOpen, setIsAddHotspotOpen] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [pendingHotspotPosition, setPendingHotspotPosition] = useState<{
    yaw: number;
    pitch: number;
  } | null>(null);

  // Scene editing state
  const [isEditSceneOpen, setIsEditSceneOpen] = useState(false);
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [editSceneName, setEditSceneName] = useState("");
  const [newSceneName, setNewSceneName] = useState("");

  // Hotspot editing state
  const [isEditHotspotOpen, setIsEditHotspotOpen] = useState(false);
  const [editingHotspotId, setEditingHotspotId] = useState<string | null>(null);

  // Hotspot form state
  const [hotspotTargetSceneId, setHotspotTargetSceneId] = useState("");
  const [hotspotTooltip, setHotspotTooltip] = useState("");
  const [hotspotIcon, setHotspotIcon] = useState<"arrow" | "door" | "info">(
    "arrow"
  );
  const [hotspotTargetYaw, setHotspotTargetYaw] = useState<number>(0);
  const [hotspotTargetPitch, setHotspotTargetPitch] = useState<number>(0);

  const viewerRef = useRef<Viewer | null>(null);
  const markersPluginRef = useRef<MarkersPlugin | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pendingCameraOverrideRef = useRef<{
    yaw: number;
    pitch: number;
  } | null>(null);

  // Load tour on mount
  useEffect(() => {
    loadTours(modelId);
  }, [modelId, loadTours]);

  // Get current tour and scene
  const tour = getTourByModelId(modelId);
  const selectedScene = tour?.scenes.find((s) => s.id === selectedSceneId);

  // Initialize and manage Photo Sphere Viewer
  useEffect(() => {
    if (!containerRef.current || !selectedScene?.panoramaImage) {
      return;
    }

    // Get panorama URL
    const img = selectedScene.panoramaImage;
    let panoramaUrl: string;
    let blobUrl: string | null = null;

    if (img.url) {
      panoramaUrl = img.url;
    } else if (img.blob) {
      blobUrl = URL.createObjectURL(img.blob);
      panoramaUrl = blobUrl;
    } else {
      return;
    }

    console.log("🔄 Initializing viewer for scene:", selectedScene.name);

    // Destroy existing viewer if any
    if (viewerRef.current) {
      viewerRef.current.destroy();
      viewerRef.current = null;
    }

    // Create new viewer instance
    try {
      // Check for pending camera override from hotspot navigation
      const cameraOverride = pendingCameraOverrideRef.current;
      const yaw = cameraOverride?.yaw ?? selectedScene.defaultYaw ?? 0;
      const pitch = cameraOverride?.pitch ?? selectedScene.defaultPitch ?? 0;

      console.log("📷 Initializing viewer with camera:", {
        yaw,
        pitch,
        zoom: selectedScene.defaultZoom ?? 50,
        hasOverride: !!cameraOverride,
        override: cameraOverride,
      });

      const viewer = new Viewer({
        container: containerRef.current,
        panorama: panoramaUrl,
        navbar: [],
        defaultYaw: yaw,
        defaultPitch: pitch,
        defaultZoomLvl: selectedScene.defaultZoom ?? 50,
        mousewheel: true,
        mousemove: true,
        touchmoveTwoFingers: true,
        plugins: [MarkersPlugin],
      });

      viewerRef.current = viewer;

      // Get the markers plugin instance
      const markersPlugin = viewer.getPlugin(MarkersPlugin) as MarkersPlugin;
      markersPluginRef.current = markersPlugin;

      // Clear the camera override ref after it's been used
      if (cameraOverride) {
        console.log("✅ Camera override applied successfully, clearing ref");
        pendingCameraOverrideRef.current = null;
      }

      // Add click event listener for adding new hotspots
      viewer.addEventListener("click", (data: any) => {
        console.log("=== CLICK EVENT ===", data);

        if (!isPreviewMode && !isAddHotspotOpen) {
          const { yaw, pitch } = data.data;

          if (yaw !== undefined && pitch !== undefined) {
            console.log("✓ Got click position:", { yaw, pitch });
            setPendingHotspotPosition({ yaw, pitch });
            setIsAddHotspotOpen(true);
          }
        }
      });

      console.log("✅ Viewer initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize viewer:", error);
    }

    // Cleanup
    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [selectedSceneId, selectedScene]);

  // Helper function to get icon component for hotspot icon selection
  const getHotspotIconComponent = (iconType: string) => {
    switch (iconType) {
      case "arrow":
        return <ArrowRight className="w-5 h-5" />;
      case "door":
        return <DoorOpen className="w-5 h-5" />;
      case "info":
        return <Info className="w-5 h-5" />;
      default:
        return <ArrowRight className="w-5 h-5" />;
    }
  };

  // Helper function to get SVG icon for hotspot markers
  const getHotspotIconSVG = (iconType: string): string => {
    switch (iconType) {
      case "arrow":
        // ArrowRight icon
        return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`;
      case "door":
        // Door/DoorOpen icon
        return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 4h3a2 2 0 0 1 2 2v14"/><path d="M2 20h3"/><path d="M13 20h9"/><path d="M10 12v.01"/><path d="M13 4.562v16.157a1 1 0 0 1-1.242.97L5 20V5.562a2 2 0 0 1 1.515-1.94l4-1A2 2 0 0 1 13 4.561Z"/></svg>`;
      case "info":
        // Info icon
        return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`;
      default:
        return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`;
    }
  };

  // Update markers when hotspots change
  useEffect(() => {
    if (!markersPluginRef.current || !selectedScene) return;

    const markersPlugin = markersPluginRef.current;

    console.log("🎯 Updating markers for scene:", selectedScene.name, {
      hotspotCount: selectedScene.hotspots.length,
      isPreviewMode,
    });

    // Clear all existing markers
    markersPlugin.clearMarkers();

    // Add markers for all hotspots
    selectedScene.hotspots.forEach((hotspot) => {
      const targetScene = tour?.scenes.find(
        (s) => s.id === hotspot.targetSceneId
      );

      console.log("➕ Adding marker:", {
        id: hotspot.id,
        position: hotspot.position,
        targetScene: targetScene?.name,
        targetCamera: {
          yaw: hotspot.targetYaw,
          pitch: hotspot.targetPitch,
        },
      });

      markersPlugin.addMarker({
        id: hotspot.id,
        position: {
          yaw: hotspot.position.yaw,
          pitch: hotspot.position.pitch,
        },
        html: `<div class="hotspot-marker" style="
          width: 40px;
          height: 40px;
          background: ${isPreviewMode ? "#10b981" : "#3b82f6"};
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 16px;
          cursor: pointer;
          transition: transform 0.2s;
        " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">${getHotspotIconSVG(
          hotspot.icon || "arrow"
        )}</div>`,
        tooltip: hotspot.tooltip || `Go to ${targetScene?.name || "scene"}`,
        data: hotspot,
      });
    });

    // Add marker click listener
    const handleMarkerClick = (e: any) => {
      const hotspot = e.marker.data as SceneHotspot;

      console.log("🖱️ Marker clicked:", {
        hotspotId: hotspot.id,
        isPreviewMode,
        targetSceneId: hotspot.targetSceneId,
        targetYaw: hotspot.targetYaw,
        targetPitch: hotspot.targetPitch,
      });

      if (isPreviewMode && hotspot.targetSceneId) {
        // In preview mode, navigate to the target scene with saved camera orientation
        if (
          hotspot.targetYaw !== undefined &&
          hotspot.targetPitch !== undefined
        ) {
          console.log("📷 Setting camera override ref:", {
            yaw: hotspot.targetYaw,
            pitch: hotspot.targetPitch,
          });
          // Use ref instead of state to avoid triggering extra re-renders
          pendingCameraOverrideRef.current = {
            yaw: hotspot.targetYaw,
            pitch: hotspot.targetPitch,
          };
        } else {
          console.warn(
            "⚠️ No target camera orientation saved for this hotspot"
          );
        }

        // Trigger transition animation
        setIsTransitioning(true);

        // Wait for transition to complete before changing scene
        setTimeout(() => {
          selectScene(hotspot.targetSceneId);
          // Fade back in after scene change
          setTimeout(() => {
            setIsTransitioning(false);
          }, 100);
        }, 400);
      } else if (!isPreviewMode) {
        // In edit mode, open edit hotspot modal
        handleEditHotspot(hotspot.id);
      }
    };

    markersPlugin.addEventListener("select-marker", handleMarkerClick);

    return () => {
      markersPlugin.removeEventListener("select-marker", handleMarkerClick);
    };
  }, [selectedScene?.hotspots, isPreviewMode, tour?.scenes]);

  // Handle create tour if not exists
  const handleCreateTour = async () => {
    await createTour(modelId, `Tour for Model ${modelId}`);
  };

  // Handle panorama upload
  const handlePanoramaUpload = async (imageRef: ImageRef) => {
    if (!tour) return;

    const sceneName = newSceneName.trim() || `Scene ${tour.scenes.length + 1}`;

    try {
      // Convert blob to data URL for persistence
      let imageWithDataURL = imageRef;
      if (imageRef.blob) {
        const dataURL = await imageRefToDataURL(imageRef);
        imageWithDataURL = { ...imageRef, url: dataURL };
      }

      await addScene(tour.id, {
        name: sceneName,
        panoramaImage: imageWithDataURL,
        hotspots: [],
      });

      setIsUploadOpen(false);
      setNewSceneName("");
    } catch (error) {
      console.error("Failed to add scene:", error);
    }
  };

  // Handle scene selection
  const handleSceneSelect = (sceneId: string) => {
    selectScene(sceneId);
    selectHotspot(null);
  };

  // Handle scene deletion
  const handleDeleteScene = async (sceneId: string) => {
    if (!tour) return;

    if (
      !window.confirm(
        "Delete this scene? This will also delete all hotspots in it."
      )
    ) {
      return;
    }

    await deleteScene(tour.id, sceneId);
  };

  // Handle set starting scene
  const handleSetStartingScene = async (sceneId: string) => {
    if (!tour) return;
    await setStartingScene(tour.id, sceneId);
  };

  // Handle edit scene
  const handleEditScene = (sceneId: string) => {
    const scene = tour?.scenes.find((s) => s.id === sceneId);
    if (scene) {
      setEditingSceneId(sceneId);
      setEditSceneName(scene.name);
      setIsEditSceneOpen(true);
    }
  };

  // Handle update scene name
  const handleUpdateSceneName = async () => {
    if (!tour || !editingSceneId || !editSceneName.trim()) return;

    await updateScene(tour.id, editingSceneId, { name: editSceneName.trim() });
    setIsEditSceneOpen(false);
    setEditingSceneId(null);
    setEditSceneName("");
  };

  // Handle update scene image
  const handleUpdateSceneImage = async (imageRef: ImageRef) => {
    if (!tour || !editingSceneId) return;

    try {
      let imageWithDataURL = imageRef;
      if (imageRef.blob) {
        const dataURL = await imageRefToDataURL(imageRef);
        imageWithDataURL = { ...imageRef, url: dataURL };
      }

      await updateScene(tour.id, editingSceneId, {
        panoramaImage: imageWithDataURL,
      });

      setIsEditSceneOpen(false);
      setEditingSceneId(null);
      setEditSceneName("");
    } catch (error) {
      console.error("Failed to update scene image:", error);
    }
  };

  // Handle set current view as starting view
  const handleSetCurrentView = async () => {
    if (!tour || !selectedScene || !viewerRef.current) return;

    const position = viewerRef.current.getPosition();
    const zoom = viewerRef.current.getZoomLevel();

    await updateScene(tour.id, selectedScene.id, {
      defaultYaw: position.yaw,
      defaultPitch: position.pitch,
      defaultZoom: zoom,
    });

    window.alert("Starting view saved for this scene!");
  };

  // Handle panorama click to add hotspot
  const handlePanoramaClick = (yaw: number, pitch: number) => {
    if (isPreviewMode) return;

    setPendingHotspotPosition({ yaw, pitch });
    setIsAddHotspotOpen(true);
  };

  // Handle create hotspot
  const handleCreateHotspot = async () => {
    if (!tour || !selectedScene || !pendingHotspotPosition) return;

    if (!hotspotTargetSceneId) {
      window.alert("Please select a target scene");
      return;
    }

    // Get current camera orientation to preserve spatial consistency
    const currentCameraPosition = viewerRef.current?.getPosition();

    console.log("🎯 Creating hotspot with target camera orientation:", {
      targetYaw: currentCameraPosition?.yaw,
      targetPitch: currentCameraPosition?.pitch,
      markerPosition: pendingHotspotPosition,
    });

    await addHotspot(tour.id, selectedScene.id, {
      targetSceneId: hotspotTargetSceneId,
      position: pendingHotspotPosition,
      tooltip: hotspotTooltip || undefined,
      icon: hotspotIcon,
      targetYaw: currentCameraPosition?.yaw,
      targetPitch: currentCameraPosition?.pitch,
    });

    // Reset form
    setIsAddHotspotOpen(false);
    setPendingHotspotPosition(null);
    setHotspotTargetSceneId("");
    setHotspotTooltip("");
    setHotspotIcon("arrow");
  };

  // Handle edit hotspot
  const handleEditHotspot = (hotspotId: string) => {
    if (!selectedScene) return;

    const hotspot = selectedScene.hotspots.find((h) => h.id === hotspotId);
    if (!hotspot) return;

    setEditingHotspotId(hotspotId);
    setPendingHotspotPosition(hotspot.position);
    setHotspotTargetSceneId(hotspot.targetSceneId);
    setHotspotTooltip(hotspot.tooltip || "");
    setHotspotIcon((hotspot.icon as "arrow" | "door" | "info") || "arrow");
    setHotspotTargetYaw(hotspot.targetYaw ?? 0);
    setHotspotTargetPitch(hotspot.targetPitch ?? 0);
    setIsEditHotspotOpen(true);
  };

  // Handle update hotspot
  const handleUpdateHotspot = async () => {
    if (!tour || !selectedScene || !editingHotspotId || !pendingHotspotPosition)
      return;

    if (!hotspotTargetSceneId) {
      window.alert("Please select a target scene");
      return;
    }

    await updateHotspot(tour.id, selectedScene.id, editingHotspotId, {
      targetSceneId: hotspotTargetSceneId,
      position: pendingHotspotPosition,
      tooltip: hotspotTooltip || undefined,
      icon: hotspotIcon,
      targetYaw: hotspotTargetYaw,
      targetPitch: hotspotTargetPitch,
    });

    // Reset form
    setIsEditHotspotOpen(false);
    setEditingHotspotId(null);
    setPendingHotspotPosition(null);
    setHotspotTargetSceneId("");
    setHotspotTooltip("");
    setHotspotIcon("arrow");
    setHotspotTargetYaw(0);
    setHotspotTargetPitch(0);
  };

  // Handle delete hotspot
  const handleDeleteHotspot = async (hotspotId: string) => {
    if (!tour || !selectedScene) return;

    if (!window.confirm("Delete this hotspot?")) return;

    await deleteHotspot(tour.id, selectedScene.id, hotspotId);
  };

  // Handle hotspot click in preview mode
  const handleHotspotClick = (hotspot: SceneHotspot) => {
    if (isPreviewMode) {
      // Navigate to target scene
      selectScene(hotspot.targetSceneId);
    } else {
      // Select for editing
      selectHotspot(hotspot.id);
    }
  };

  // Handle export tour
  const handleExportTour = async () => {
    if (!tour) return;

    // Validate tour has all required data
    if (tour.scenes.length === 0) {
      window.alert("Cannot export: Tour has no scenes");
      return;
    }

    if (!tour.startingSceneId) {
      window.alert("Cannot export: Please set a starting scene");
      return;
    }

    const confirmed = window.confirm(
      `Export tour for model ${modelId}?\n\nScenes: ${
        tour.scenes.length
      }\nHotspots: ${tour.scenes.reduce(
        (sum, s) => sum + s.hotspots.length,
        0
      )}`
    );

    if (!confirmed) return;

    const result = await exportTourToBackend(modelId, tour);

    if (result.success) {
      window.alert(
        `✅ ${result.message}\n${
          result.filename ? `File: ${result.filename}` : ""
        }`
      );
    } else {
      window.alert(`❌ Export failed: ${result.message}`);
    }
  };

  return (
    <>
      {/* CSS for transition animation */}
      <style>{`
        @keyframes zoomFade {
          0% {
            opacity: 0;
            transform: scale(0.95);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes fadeIn {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }
      `}</style>

      <div className="fixed inset-0 z-50 bg-white flex flex-col">
        {/* Toolbar */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Tour Status */}
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-gray-600" />
              {!tour ? (
                <button
                  onClick={handleCreateTour}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Create Tour
                </button>
              ) : (
                <span className="text-sm text-gray-600">
                  {tour.scenes.length} scene
                  {tour.scenes.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {tour && (
              <>
                <div className="w-px h-6 bg-gray-300 mx-2" />

                {/* Upload Scene Button */}
                <button
                  onClick={() => setIsUploadOpen(true)}
                  className="px-3 py-2 rounded-lg border-2 border-gray-200 hover:border-gray-300 text-gray-700 transition-colors flex items-center gap-2"
                  title="Upload panoramic image"
                >
                  <Upload className="w-4 h-4" />
                  <span className="text-sm font-medium">Add Scene</span>
                </button>

                {selectedScene && (
                  <>
                    <div className="w-px h-6 bg-gray-300 mx-2" />

                    {/* Add Hotspot Button */}
                    <button
                      onClick={() => {
                        // Set default position (center of view)
                        setPendingHotspotPosition({ yaw: 0, pitch: 0 });
                        setIsAddHotspotOpen(true);
                      }}
                      className="px-3 py-2 rounded-lg border-2 border-blue-200 hover:border-blue-300 bg-blue-50 text-blue-700 transition-colors flex items-center gap-2"
                      title="Add hotspot (or click on panorama to place)"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="text-sm font-medium">Add Hotspot</span>
                    </button>

                    {/* Set Current View Button */}
                    <button
                      onClick={handleSetCurrentView}
                      className="px-3 py-2 rounded-lg border-2 border-purple-200 hover:border-purple-300 text-purple-700 hover:bg-purple-50 transition-colors flex items-center gap-2"
                      title="Save current camera position as default view for this scene"
                    >
                      <Camera className="w-4 h-4" />
                      <span className="text-sm font-medium">Set View</span>
                    </button>

                    {/* Preview Mode Toggle */}
                    <button
                      onClick={() => setIsPreviewMode(!isPreviewMode)}
                      className={`px-3 py-2 rounded-lg border-2 transition-colors flex items-center gap-2 ${
                        isPreviewMode
                          ? "border-green-500 bg-green-50 text-green-700"
                          : "border-gray-200 hover:border-gray-300 text-gray-700"
                      }`}
                      title={
                        isPreviewMode ? "Exit preview mode" : "Preview tour"
                      }
                    >
                      <Play className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {isPreviewMode ? "Exit Preview" : "Preview"}
                      </span>
                    </button>
                  </>
                )}
              </>
            )}
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {tour && tour.scenes.length > 0 && (
              <button
                onClick={handleExportTour}
                className="px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors flex items-center gap-2"
                title="Export tour configuration"
              >
                <Download className="w-4 h-4" />
                <span className="text-sm font-medium">Export Tour</span>
              </button>
            )}

            {onClose && (
              <button
                onClick={onClose}
                className="px-3 py-2 rounded-lg border-2 border-gray-200 hover:border-gray-300 text-gray-700 transition-colors flex items-center gap-2"
                title="Close tour editor"
              >
                <X className="w-4 h-4" />
                <span className="text-sm font-medium">Close</span>
              </button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar - Scene List */}
          {tour && tour.scenes.length > 0 && (
            <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Scenes
                </h3>

                <div className="space-y-2">
                  {tour.scenes.map((scene) => {
                    const isStarting = tour.startingSceneId === scene.id;
                    const isSelected = selectedSceneId === scene.id;

                    return (
                      <div
                        key={scene.id}
                        className={`p-3 border rounded-lg transition-colors cursor-pointer ${
                          isSelected
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => handleSceneSelect(scene.id)}
                      >
                        {/* Scene Header */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 flex-1">
                            <div className="font-medium text-gray-900">
                              {scene.name}
                            </div>
                            {isStarting && (
                              <span title="Starting scene">
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditScene(scene.id);
                              }}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Edit scene"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSetStartingScene(scene.id);
                              }}
                              className={`p-1.5 rounded transition-colors ${
                                isStarting
                                  ? "text-yellow-500"
                                  : "text-gray-400 hover:text-yellow-500"
                              }`}
                              title="Set as starting scene"
                            >
                              <Star
                                className={`w-3.5 h-3.5 ${
                                  isStarting ? "fill-yellow-500" : ""
                                }`}
                              />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteScene(scene.id);
                              }}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete scene"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Scene Details */}
                        <div className="text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <Navigation className="w-3 h-3" />
                            <span>
                              {scene.hotspots.length} hotspot
                              {scene.hotspots.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>

                        {/* Hotspots List */}
                        {scene.hotspots.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <div className="space-y-1">
                              {scene.hotspots.map((hotspot) => {
                                const targetScene = tour.scenes.find(
                                  (s) => s.id === hotspot.targetSceneId
                                );
                                return (
                                  <div
                                    key={hotspot.id}
                                    className="flex items-center justify-between p-1.5 bg-gray-50 rounded text-xs hover:bg-gray-100 transition-colors"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                      {/* Show the hotspot's selected icon */}
                                      <span className="text-blue-600 flex-shrink-0">
                                        {hotspot.icon === "door" ? (
                                          <DoorOpen className="w-3 h-3" />
                                        ) : hotspot.icon === "info" ? (
                                          <Info className="w-3 h-3" />
                                        ) : (
                                          <ArrowRight className="w-3 h-3" />
                                        )}
                                      </span>
                                      <span className="truncate text-gray-700">
                                        {hotspot.tooltip ||
                                          `→ ${targetScene?.name || "Unknown"}`}
                                      </span>
                                      {hotspot.targetYaw !== undefined &&
                                        hotspot.targetPitch !== undefined && (
                                          <span title="Has saved camera orientation">
                                            <Camera className="w-3 h-3 text-green-600 flex-shrink-0" />
                                          </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-0.5 flex-shrink-0">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEditHotspot(hotspot.id);
                                        }}
                                        className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                                        title="Edit hotspot"
                                      >
                                        <Edit2 className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteHotspot(hotspot.id);
                                        }}
                                        className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                                        title="Delete hotspot"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Viewer Area */}
          <div className="flex-1 overflow-hidden relative bg-gray-900">
            {!tour ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                <Camera className="w-16 h-16 mb-4" />
                <p className="text-lg mb-2">No tour created</p>
                <p className="text-sm">Click "Create Tour" to begin</p>
              </div>
            ) : tour.scenes.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                <Upload className="w-16 h-16 mb-4" />
                <p className="text-lg mb-2">No scenes added</p>
                <p className="text-sm">
                  Click "Add Scene" to upload a panoramic image
                </p>
              </div>
            ) : !selectedScene ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                <Camera className="w-16 h-16 mb-4" />
                <p className="text-lg mb-2">No scene selected</p>
                <p className="text-sm">Select a scene from the list to begin</p>
              </div>
            ) : (
              <div className="h-full relative">
                {/* Photo Sphere Viewer Container */}
                {selectedScene.panoramaImage ? (
                  <>
                    <div
                      ref={containerRef}
                      className="h-full w-full transition-transform duration-500 ease-out"
                      style={{
                        position: "relative",
                        transform: isTransitioning ? "scale(1.05)" : "scale(1)",
                      }}
                    />

                    {/* Scene Transition Overlay */}
                    {isTransitioning && (
                      <div
                        className="absolute inset-0 bg-black z-50 pointer-events-none"
                        style={{
                          opacity: 1,
                          animation: "fadeIn 0.4s ease-in-out",
                        }}
                      />
                    )}

                    {/* Instruction overlay */}
                    {!isPreviewMode && selectedScene.hotspots.length === 0 && (
                      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm flex items-center gap-2 pointer-events-none z-10">
                        <Navigation className="w-4 h-4" />
                        <span>
                          Click anywhere on the panorama to add a hotspot
                        </span>
                      </div>
                    )}

                    {/* Hotspot count indicator */}
                    {selectedScene.hotspots.length > 0 && (
                      <div className="absolute top-4 right-4 bg-gray-900 bg-opacity-75 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2 z-10">
                        <Navigation className="w-4 h-4" />
                        <span>
                          {selectedScene.hotspots.length} hotspot
                          {selectedScene.hotspots.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <Camera className="w-16 h-16 mb-4 mx-auto" />
                      <p className="text-lg mb-2">Loading panorama...</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Upload Modal */}
        {isUploadOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Upload Panoramic Image
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Upload an equirectangular 360° panoramic image (2:1 aspect ratio
                recommended)
              </p>

              {/* Scene Name Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scene Name (optional)
                </label>
                <input
                  type="text"
                  value={newSceneName}
                  onChange={(e) => setNewSceneName(e.target.value)}
                  placeholder={`Scene ${(tour?.scenes.length ?? 0) + 1}`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <ImageDropzone
                onImageSelect={handlePanoramaUpload}
                autoResize={false}
                maxSizeMB={50}
              />

              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setIsUploadOpen(false);
                    setNewSceneName("");
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Scene Modal */}
        {isEditSceneOpen && editingSceneId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Edit Scene
              </h2>

              {/* Scene Name Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scene Name
                </label>
                <input
                  type="text"
                  value={editSceneName}
                  onChange={(e) => setEditSceneName(e.target.value)}
                  placeholder="Enter scene name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Update Image Section */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Update Panoramic Image (optional)
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Upload a new image to replace the current panorama
                </p>
                <ImageDropzone
                  onImageSelect={handleUpdateSceneImage}
                  autoResize={false}
                  maxSizeMB={50}
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setIsEditSceneOpen(false);
                    setEditingSceneId(null);
                    setEditSceneName("");
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateSceneName}
                  disabled={!editSceneName.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Hotspot Modal */}
        {isAddHotspotOpen && pendingHotspotPosition && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Add Hotspot
              </h2>

              <div className="space-y-4">
                {/* Position Info */}
                {pendingHotspotPosition && (
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Position (adjustable)
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {/* Yaw Input */}
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Yaw (horizontal angle)
                        </label>
                        <input
                          type="number"
                          value={pendingHotspotPosition.yaw.toFixed(2)}
                          onChange={(e) =>
                            setPendingHotspotPosition({
                              ...pendingHotspotPosition,
                              yaw: parseFloat(e.target.value) || 0,
                            })
                          }
                          step="0.1"
                          min="-180"
                          max="180"
                          placeholder="0.00"
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      {/* Pitch Input */}
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Pitch (vertical angle)
                        </label>
                        <input
                          type="number"
                          value={pendingHotspotPosition.pitch.toFixed(2)}
                          onChange={(e) =>
                            setPendingHotspotPosition({
                              ...pendingHotspotPosition,
                              pitch: parseFloat(e.target.value) || 0,
                            })
                          }
                          step="0.1"
                          min="-90"
                          max="90"
                          placeholder="0.00"
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      Yaw: -180° to 180° (left to right), Pitch: -90° to 90°
                      (down to up)
                    </p>
                  </div>
                )}

                {/* Target Scene */}
                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 mb-1"
                    htmlFor="target-scene-select"
                  >
                    Target Scene *
                  </label>
                  <select
                    id="target-scene-select"
                    value={hotspotTargetSceneId}
                    onChange={(e) => setHotspotTargetSceneId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select scene...</option>
                    {tour?.scenes
                      .filter((s) => s.id !== selectedSceneId)
                      .map((scene) => (
                        <option key={scene.id} value={scene.id}>
                          {scene.name}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Tooltip */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tooltip
                  </label>
                  <input
                    type="text"
                    value={hotspotTooltip}
                    onChange={(e) => setHotspotTooltip(e.target.value)}
                    placeholder="e.g., Go to Living Room"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Icon */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Icon
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["arrow", "door", "info"] as const).map((icon) => (
                      <button
                        key={icon}
                        onClick={() => setHotspotIcon(icon)}
                        className={`px-4 py-3 rounded-lg border-2 transition-colors flex flex-col items-center gap-1 ${
                          hotspotIcon === icon
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-200 hover:border-gray-300 text-gray-700"
                        }`}
                      >
                        {getHotspotIconComponent(icon)}
                        <span className="text-xs capitalize">{icon}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setIsAddHotspotOpen(false);
                    setPendingHotspotPosition(null);
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateHotspot}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Hotspot
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Hotspot Modal */}
        {isEditHotspotOpen && editingHotspotId && pendingHotspotPosition && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Edit Hotspot
              </h2>

              <div className="space-y-4">
                {/* Position Info */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Position (adjustable)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Yaw Input */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Yaw (horizontal angle)
                      </label>
                      <input
                        type="number"
                        value={pendingHotspotPosition.yaw.toFixed(2)}
                        onChange={(e) =>
                          setPendingHotspotPosition({
                            ...pendingHotspotPosition,
                            yaw: parseFloat(e.target.value) || 0,
                          })
                        }
                        step="0.1"
                        min="-180"
                        max="180"
                        placeholder="0.00"
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    {/* Pitch Input */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Pitch (vertical angle)
                      </label>
                      <input
                        type="number"
                        value={pendingHotspotPosition.pitch.toFixed(2)}
                        onChange={(e) =>
                          setPendingHotspotPosition({
                            ...pendingHotspotPosition,
                            pitch: parseFloat(e.target.value) || 0,
                          })
                        }
                        step="0.1"
                        min="-90"
                        max="90"
                        placeholder="0.00"
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Target Scene */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Scene *
                  </label>
                  <select
                    value={hotspotTargetSceneId}
                    onChange={(e) => setHotspotTargetSceneId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    title="Select target scene"
                  >
                    <option value="">Select scene...</option>
                    {tour?.scenes
                      .filter((s) => s.id !== selectedSceneId)
                      .map((scene) => (
                        <option key={scene.id} value={scene.id}>
                          {scene.name}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Tooltip */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tooltip (optional)
                  </label>
                  <input
                    type="text"
                    value={hotspotTooltip}
                    onChange={(e) => setHotspotTooltip(e.target.value)}
                    placeholder="e.g., Go to Living Room"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Icon Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Icon Style
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["arrow", "door", "info"] as const).map((iconType) => (
                      <button
                        key={iconType}
                        onClick={() => setHotspotIcon(iconType)}
                        className={`p-3 border-2 rounded-lg transition-colors flex flex-col items-center gap-1 ${
                          hotspotIcon === iconType
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-200 hover:border-gray-300 text-gray-700"
                        }`}
                      >
                        {getHotspotIconComponent(iconType)}
                        <span className="text-xs capitalize">{iconType}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target Camera Orientation */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Target Scene Camera Orientation
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Target Yaw Input */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Target Yaw
                      </label>
                      <input
                        type="number"
                        value={hotspotTargetYaw.toFixed(2)}
                        onChange={(e) =>
                          setHotspotTargetYaw(parseFloat(e.target.value) || 0)
                        }
                        step="0.1"
                        min="-180"
                        max="180"
                        placeholder="0.00"
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    {/* Target Pitch Input */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Target Pitch
                      </label>
                      <input
                        type="number"
                        value={hotspotTargetPitch.toFixed(2)}
                        onChange={(e) =>
                          setHotspotTargetPitch(parseFloat(e.target.value) || 0)
                        }
                        step="0.1"
                        min="-90"
                        max="90"
                        placeholder="0.00"
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Camera view when arriving at the target scene (maintains
                    spatial consistency)
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setIsEditHotspotOpen(false);
                    setEditingHotspotId(null);
                    setPendingHotspotPosition(null);
                    setHotspotTargetSceneId("");
                    setHotspotTooltip("");
                    setHotspotIcon("arrow");
                    setHotspotTargetYaw(0);
                    setHotspotTargetPitch(0);
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateHotspot}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Update Hotspot
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
