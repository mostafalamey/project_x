import "@photo-sphere-viewer/core/index.css";
import "@photo-sphere-viewer/markers-plugin/index.css";

import { useEffect, useMemo, useRef, useState } from "react";
import { Viewer } from "@photo-sphere-viewer/core";
import { MarkersPlugin } from "@photo-sphere-viewer/markers-plugin";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import { useTransitionContext } from "../contexts/TransitionContext";
import { loadTour } from "../data/loaders";
import type { PanoScene, Tour, PanoLink } from "../data/types";
import { useNavigationStore } from "../stores/navigationStore";
import { prefersReducedMotion } from "../utils/accessibility";
import { getDataUrl } from "../utils/paths";

type FetchState<T> = {
  status: "idle" | "loading" | "error" | "success";
  data: T | null;
  error: string | null;
};

const initialState = <T,>(): FetchState<T> => ({
  status: "idle",
  data: null,
  error: null,
});

const findScene = (tour: Tour | null, sceneId: string | null) => {
  if (!tour || !sceneId) {
    return null;
  }

  return tour.scenes.find((scene) => scene.id === sceneId) ?? null;
};

/**
 * Gets the panorama image URL from a scene, supporting both old and new formats
 */
const getSceneImageUrl = (scene: PanoScene): string | undefined => {
  // New format: panoramaImage object
  if (scene.panoramaImage?.url) {
    return getDataUrl(scene.panoramaImage.url);
  }
  // Old format: image string
  return getDataUrl(scene.image);
};

/**
 * Gets the scene hotspots/links, supporting both old and new formats
 */
const getSceneHotspots = (
  scene: PanoScene
): Array<{ id: string; targetSceneId: string; yaw: number; pitch: number }> => {
  // New format: hotspots array
  if (scene.hotspots && scene.hotspots.length > 0) {
    return scene.hotspots.map((hotspot) => ({
      id: hotspot.id,
      targetSceneId: hotspot.targetSceneId,
      yaw: hotspot.position.yaw,
      pitch: hotspot.position.pitch,
    }));
  }
  // Old format: links array with x, y coordinates
  if (scene.links && scene.links.length > 0) {
    return scene.links.map((link) => ({
      id: link.target,
      targetSceneId: link.target,
      yaw: (link.x * Math.PI) / 180,
      pitch: (link.y * Math.PI) / 180,
    }));
  }
  return [];
};

export const TourViewer = () => {
  const { tourId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { direction } = useTransitionContext();
  const { tourBackLocation, clearTourBackLocation } = useNavigationStore();
  const [state, setState] = useState<FetchState<Tour>>(initialState);
  const [currentSceneId, setCurrentSceneId] = useState<string | null>(null);
  const [showSceneList, setShowSceneList] = useState(false);
  const [allPanoramasPreloaded, setAllPanoramasPreloaded] = useState(false);
  const [viewerReady, setViewerReady] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Store target camera orientation for scene transitions
  const [targetOrientation, setTargetOrientation] = useState<{
    yaw: number;
    pitch: number;
    zoom: number;
  } | null>(null);

  // Viewer refs for v5 direct integration
  const viewerRef = useRef<Viewer | null>(null);
  const markersPluginRef = useRef<MarkersPlugin | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const preloadedImagesRef = useRef<Map<string, boolean>>(new Map());

  useEffect(() => {
    if (!tourId) {
      return;
    }

    let cancelled = false;

    const fetchTour = async () => {
      setState((previous) => ({ ...previous, status: "loading", error: null }));

      try {
        const data = await loadTour(tourId);

        if (!cancelled) {
          setState({ status: "success", data, error: null });
          // Support both old (startSceneId) and new (startingSceneId) formats
          const startScene =
            data.startingSceneId ??
            data.startSceneId ??
            data.scenes[0]?.id ??
            null;
          setCurrentSceneId(startScene);
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            status: "error",
            data: null,
            error:
              error instanceof Error
                ? error.message
                : "Unable to load tour data",
          });
        }
      }
    };

    fetchTour();

    return () => {
      cancelled = true;
    };
  }, [tourId]);

  // Preload all panorama images upfront
  useEffect(() => {
    if (state.status !== "success" || !state.data) {
      return;
    }

    const tourData = state.data;

    const preloadAllImages = async () => {
      console.log("TourViewer: Starting to preload all panorama images...");
      const imagePromises = tourData.scenes.map((scene) => {
        return new Promise<void>((resolve, reject) => {
          const imageUrl = getSceneImageUrl(scene);
          if (!imageUrl) {
            console.warn(`TourViewer: No image URL for scene ${scene.id}`);
            resolve();
            return;
          }

          // Check if already preloaded
          if (preloadedImagesRef.current.get(scene.id)) {
            resolve();
            return;
          }

          const img = new Image();
          img.onload = () => {
            preloadedImagesRef.current.set(scene.id, true);
            console.log(`TourViewer: Preloaded image for scene ${scene.id}`);
            resolve();
          };
          img.onerror = () => {
            console.error(
              `TourViewer: Failed to preload image for scene ${scene.id}`
            );
            reject(new Error(`Failed to load ${scene.id}`));
          };
          img.src = imageUrl;
        });
      });

      try {
        await Promise.all(imagePromises);
        console.log("TourViewer: All panorama images preloaded successfully");
        setAllPanoramasPreloaded(true);
      } catch (error) {
        console.error("TourViewer: Error preloading images:", error);
        // Continue anyway, some images might have loaded
        setAllPanoramasPreloaded(true);
      }
    };

    preloadAllImages();
  }, [state.status, state.data]);

  useEffect(() => {
    if (state.status !== "success" || !state.data) {
      return;
    }

    const requestedScene = searchParams.get("scene");
    if (!requestedScene) {
      return;
    }

    if (findScene(state.data, requestedScene)) {
      setCurrentSceneId(requestedScene);
    }
  }, [searchParams, state]);

  useEffect(() => {
    if (state.status !== "success" || !currentSceneId) {
      return;
    }

    const sceneParam = searchParams.get("scene");
    if (sceneParam === currentSceneId) {
      return;
    }

    const params = new URLSearchParams(searchParams);
    params.set("scene", currentSceneId);
    setSearchParams(params, { replace: true });
  }, [currentSceneId, searchParams, setSearchParams, state.status]);

  const currentScene = useMemo(
    () => findScene(state.data, currentSceneId),
    [state.data, currentSceneId]
  );

  // Initialize Photo Sphere Viewer once when all panoramas are preloaded
  useEffect(() => {
    if (!containerRef.current || !currentScene || !allPanoramasPreloaded) {
      return;
    }

    // Only create viewer if it doesn't exist
    if (viewerRef.current) {
      return;
    }

    const container = containerRef.current;

    try {
      const sceneImageUrl = getSceneImageUrl(currentScene);
      if (!sceneImageUrl) {
        throw new Error("No image URL found for scene");
      }

      console.log("TourViewer: Creating viewer instance for first time");
      console.log("TourViewer: Initial scene image URL:", sceneImageUrl);
      console.log(
        "TourViewer: Full URL will be:",
        window.location.origin + sceneImageUrl
      );

      // Create new viewer instance
      const viewer = new Viewer({
        container: container,
        panorama: sceneImageUrl,
        defaultYaw:
          targetOrientation?.yaw ?? currentScene.initialView?.yaw ?? 0,
        defaultPitch:
          targetOrientation?.pitch ?? currentScene.initialView?.pitch ?? 0,
        defaultZoomLvl:
          targetOrientation?.zoom ??
          (currentScene.initialView?.fov
            ? Math.max(
                0,
                Math.min(100, 100 - (currentScene.initialView.fov - 50) / 0.7)
              )
            : 50),
        navbar: false,
        plugins: [
          [
            MarkersPlugin,
            {
              markers: [],
            },
          ],
        ],
      });

      viewerRef.current = viewer;

      // Clear target orientation after using it
      if (targetOrientation) {
        setTargetOrientation(null);
      }

      // Get markers plugin
      const markersPlugin = viewer.getPlugin(MarkersPlugin) as MarkersPlugin;
      markersPluginRef.current = markersPlugin;

      // Define marker click handler
      const handleMarkerClick = (e: any) => {
        console.log("TourViewer: Marker clicked:", e.marker);
        const hotspot = e.marker.data as {
          id: string;
          targetSceneId: string;
          yaw: number;
          pitch: number;
        };
        if (hotspot && hotspot.targetSceneId) {
          // Hide the clicked marker immediately
          if (markersPluginRef.current) {
            markersPluginRef.current.removeMarker(e.marker.id);
          }

          // Capture current camera orientation before transitioning
          if (viewerRef.current) {
            const position = viewerRef.current.getPosition();
            const zoomLevel = viewerRef.current.getZoomLevel();

            console.log("TourViewer: Capturing camera orientation:", {
              yaw: position.yaw,
              pitch: position.pitch,
              zoom: zoomLevel,
            });

            setTargetOrientation({
              yaw: position.yaw,
              pitch: position.pitch,
              zoom: zoomLevel,
            });
          }

          setCurrentSceneId(hotspot.targetSceneId);
        }
      };

      // Handle viewer ready - add initial markers
      viewer.addEventListener("ready", () => {
        console.log("TourViewer: Viewer is ready, adding initial markers");

        const hotspots = getSceneHotspots(currentScene);
        console.log(
          `TourViewer: Initial scene "${currentScene.id}" has ${hotspots.length} hotspots`
        );

        if (hotspots.length > 0 && markersPlugin) {
          const markers = hotspots.map((hotspot) => ({
            id: hotspot.id,
            position: {
              yaw: hotspot.yaw,
              pitch: hotspot.pitch,
            },
            html: `<div class="hotspot-marker-3d" style="width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.3s ease;">
              <svg width="80" height="80" viewBox="0 0 80 80" style="filter: drop-shadow(0 4px 12px rgba(0,0,0,0.4));">
                <defs>
                  <radialGradient id="diskGradient-${hotspot.id}" cx="40%" cy="30%">
                    <stop offset="0%" style="stop-color:rgba(255,255,255,0.9);stop-opacity:1" />
                    <stop offset="40%" style="stop-color:rgba(16,185,129,1);stop-opacity:1" />
                    <stop offset="100%" style="stop-color:rgba(5,150,105,0.8);stop-opacity:1" />
                  </radialGradient>
                  <radialGradient id="ringGradient-${hotspot.id}" cx="50%" cy="50%">
                    <stop offset="0%" style="stop-color:rgba(255,255,255,0.8);stop-opacity:1" />
                    <stop offset="100%" style="stop-color:rgba(16,185,129,0.6);stop-opacity:1" />
                  </radialGradient>
                </defs>
                
                <!-- Outer glow ring (ellipse for 3D effect) -->
                <ellipse cx="40" cy="45" rx="36" ry="18" fill="url(#ringGradient-${hotspot.id})" opacity="0.4">
                  <animate attributeName="opacity" values="0.4;0.7;0.4" dur="2s" repeatCount="indefinite"/>
                </ellipse>
                
                <!-- Main disk (ellipse for 3D floor effect) -->
                <ellipse cx="40" cy="42" rx="28" ry="14" fill="url(#diskGradient-${hotspot.id})" stroke="rgba(255,255,255,0.9)" stroke-width="2"/>
                
                <!-- Arrow indicator pointing up/forward -->
                <g transform="translate(40, 42)">
                  <path d="M 0,-8 L -4,-2 L -1.5,-2 L -1.5,4 L 1.5,4 L 1.5,-2 L 4,-2 Z" fill="white" opacity="0.95"/>
                </g>
              </svg>
            </div>
            <style>
              .hotspot-marker-3d:hover {
                transform: scale(1.2);
              }
              .hotspot-marker-3d:hover svg {
                filter: drop-shadow(0 6px 16px rgba(16,185,129,0.6));
              }
            </style>`,
            tooltip:
              findScene(state.data, hotspot.targetSceneId)?.name ||
              hotspot.targetSceneId.replace(/-/g, " "),
            data: hotspot,
          }));

          markersPlugin.setMarkers(markers);
          console.log(`TourViewer: Added ${markers.length} initial markers`);

          // Add event listener for initial markers
          markersPlugin.addEventListener("select-marker", handleMarkerClick);
        }

        setViewerReady(true);
      });
    } catch (error) {
      console.error("Failed to initialize viewer:", error);
      setViewerReady(true); // Set ready even on error to hide loading
    }

    // Cleanup only on unmount
    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
        markersPluginRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allPanoramasPreloaded]);

  // Update panorama and markers when scene changes (without recreating viewer)
  useEffect(() => {
    if (
      !viewerRef.current ||
      !currentScene ||
      !allPanoramasPreloaded ||
      !viewerReady
    ) {
      return;
    }

    const viewer = viewerRef.current;
    const markersPlugin = markersPluginRef.current;

    const sceneImageUrl = getSceneImageUrl(currentScene);
    if (!sceneImageUrl) {
      console.error("No image URL found for scene");
      return;
    }

    // Check if this is still the initial scene (don't update on first render)
    const currentPanorama = viewer.config.panorama;
    if (currentPanorama === sceneImageUrl) {
      console.log("TourViewer: Skipping update, already on this scene");
      return;
    }

    console.log(`TourViewer: Switching to scene "${currentScene.id}"`);

    // Apply target orientation if available, otherwise use scene's initial view
    const newYaw = targetOrientation?.yaw ?? currentScene.initialView?.yaw ?? 0;
    const newPitch =
      targetOrientation?.pitch ?? currentScene.initialView?.pitch ?? 0;
    const newZoom =
      targetOrientation?.zoom ??
      (currentScene.initialView?.fov
        ? Math.max(
            0,
            Math.min(100, 100 - (currentScene.initialView.fov - 50) / 0.7)
          )
        : 50);

    // Define marker click handler
    const handleMarkerClick = (e: any) => {
      console.log("TourViewer: Marker clicked:", e.marker);
      const hotspot = e.marker.data as {
        id: string;
        targetSceneId: string;
        yaw: number;
        pitch: number;
      };
      if (hotspot && hotspot.targetSceneId) {
        // Hide the clicked marker immediately
        if (markersPluginRef.current) {
          markersPluginRef.current.removeMarker(e.marker.id);
        }

        // Capture current camera orientation before transitioning
        if (viewerRef.current) {
          const position = viewerRef.current.getPosition();
          const zoomLevel = viewerRef.current.getZoomLevel();

          console.log("TourViewer: Capturing camera orientation:", {
            yaw: position.yaw,
            pitch: position.pitch,
            zoom: zoomLevel,
          });

          setTargetOrientation({
            yaw: position.yaw,
            pitch: position.pitch,
            zoom: zoomLevel,
          });
        }

        setCurrentSceneId(hotspot.targetSceneId);
      }
    };

    // Set transitioning state
    setIsTransitioning(true);

    // Switch panorama with crossfade (no zoom animations)
    viewer
      .setPanorama(sceneImageUrl, {
        position: { yaw: newYaw, pitch: newPitch },
        zoom: newZoom,
        transition: true, // Enable smooth crossfade (default 1500ms)
        showLoader: false, // Don't show loader since images are preloaded
      })
      .then(() => {
        console.log(`TourViewer: Panorama switched to "${currentScene.id}"`);

        // Clear transitioning state
        setIsTransitioning(false);

        // Clear target orientation after using it
        if (targetOrientation) {
          setTargetOrientation(null);
        }

        // Update markers for new scene
        if (markersPlugin) {
          const hotspots = getSceneHotspots(currentScene);
          console.log(
            `TourViewer: Scene "${currentScene.id}" has ${hotspots.length} hotspots`
          );

          // Remove old event listener
          markersPlugin.removeEventListener("select-marker", handleMarkerClick);

          if (hotspots.length > 0) {
            const markers = hotspots.map((hotspot) => ({
              id: hotspot.id,
              position: {
                yaw: hotspot.yaw,
                pitch: hotspot.pitch,
              },
              html: `<div class="hotspot-marker-3d" style="width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.3s ease;">
              <svg width="80" height="80" viewBox="0 0 80 80" style="filter: drop-shadow(0 4px 12px rgba(0,0,0,0.4));">
                <defs>
                  <radialGradient id="diskGradient-${hotspot.id}" cx="40%" cy="30%">
                    <stop offset="0%" style="stop-color:rgba(255,255,255,0.9);stop-opacity:1" />
                    <stop offset="40%" style="stop-color:rgba(16,185,129,1);stop-opacity:1" />
                    <stop offset="100%" style="stop-color:rgba(5,150,105,0.8);stop-opacity:1" />
                  </radialGradient>
                  <radialGradient id="ringGradient-${hotspot.id}" cx="50%" cy="50%">
                    <stop offset="0%" style="stop-color:rgba(255,255,255,0.8);stop-opacity:1" />
                    <stop offset="100%" style="stop-color:rgba(16,185,129,0.6);stop-opacity:1" />
                  </radialGradient>
                </defs>
                
                <!-- Outer glow ring (ellipse for 3D effect) -->
                <ellipse cx="40" cy="45" rx="36" ry="18" fill="url(#ringGradient-${hotspot.id})" opacity="0.4">
                  <animate attributeName="opacity" values="0.4;0.7;0.4" dur="2s" repeatCount="indefinite"/>
                </ellipse>
                
                <!-- Main disk (ellipse for 3D floor effect) -->
                <ellipse cx="40" cy="42" rx="28" ry="14" fill="url(#diskGradient-${hotspot.id})" stroke="rgba(255,255,255,0.9)" stroke-width="2"/>
                
                <!-- Arrow indicator pointing up/forward -->
                <g transform="translate(40, 42)">
                  <path d="M 0,-8 L -4,-2 L -1.5,-2 L -1.5,4 L 1.5,4 L 1.5,-2 L 4,-2 Z" fill="white" opacity="0.95"/>
                </g>
              </svg>
            </div>
            <style>
              .hotspot-marker-3d:hover {
                transform: scale(1.2);
              }
              .hotspot-marker-3d:hover svg {
                filter: drop-shadow(0 6px 16px rgba(16,185,129,0.6));
              }
            </style>`,
              tooltip:
                findScene(state.data, hotspot.targetSceneId)?.name ||
                hotspot.targetSceneId.replace(/-/g, " "),
              data: hotspot,
            }));

            markersPlugin.setMarkers(markers);
            console.log(`TourViewer: Updated ${markers.length} markers`);

            // Add event listener after markers are set
            markersPlugin.addEventListener("select-marker", handleMarkerClick);
          } else {
            markersPlugin.clearMarkers();
          }
        }
      })
      .catch((error) => {
        console.error("Failed to switch panorama:", error);
        setIsTransitioning(false); // Clear transitioning state on error
      });
  }, [currentScene, state.data, allPanoramasPreloaded, viewerReady]);

  const backHref = useMemo(() => {
    // First priority: Use stored back location from Zustand
    console.log("DEBUG: tourBackLocation from Zustand:", tourBackLocation);
    console.log("DEBUG: state.data:", state.data);
    console.log("DEBUG: state.status:", state.status);

    if (tourBackLocation) {
      console.log("DEBUG: Using Zustand back location:", tourBackLocation);
      return tourBackLocation;
    }

    // Fallback to URL parameter-based logic
    // Check if this is a street-view tour (non-unit tour)
    if (state.data && state.data.modelId === null) {
      console.log("DEBUG: Street-view tour, going to masterplan");
      // Check if we have a backAngle parameter
      const backAngle = searchParams.get("backAngle");
      if (backAngle) {
        console.log("DEBUG: Using backAngle parameter:", backAngle);
        return `/masterplan?angle=${backAngle}`;
      }
      return "/masterplan";
    }

    const unit = searchParams.get("unit");
    const building = searchParams.get("building");
    const floor = searchParams.get("floor");
    const angle = searchParams.get("angle");

    console.log(
      "DEBUG backHref - unit:",
      unit,
      "building:",
      building,
      "floor:",
      floor,
      "angle:",
      angle
    );

    // If we have building and floor but no unit, go back to floor plan
    if (building && floor && !unit) {
      const params = new URLSearchParams();
      if (angle) {
        params.set("angle", angle);
      }
      const query = params.toString();
      const result = query.length
        ? `/building/${building}/floor/${floor}?${query}`
        : `/building/${building}/floor/${floor}`;
      console.log("DEBUG: Going back to floor plan:", result);
      return result;
    }

    // If we have unit, go back to unit view
    if (unit) {
      const params = new URLSearchParams();
      if (building) {
        params.set("building", building);
      }
      if (floor) {
        params.set("floor", floor);
      }
      if (angle) {
        params.set("angle", angle);
      }
      const query = params.toString();
      const result = query.length ? `/unit/${unit}?${query}` : `/unit/${unit}`;
      console.log("DEBUG: Going back to unit:", result);
      return result;
    }

    console.log("DEBUG: Default - going to masterplan");
    return "/masterplan";
  }, [tourBackLocation, searchParams, state.data]);

  const backLabel = useMemo(() => {
    // Check if we have a stored back location from Zustand
    if (tourBackLocation) {
      // Parse the back location to determine the label
      if (tourBackLocation.includes("/model/")) {
        return "Back to Model";
      }
      if (tourBackLocation.includes("/floor/")) {
        return "Back to Floor Plan";
      }
      if (tourBackLocation.includes("/unit/")) {
        return "Back to Unit";
      }
      if (tourBackLocation.includes("/masterplan")) {
        return "Back to Master Plan";
      }
      return "Back";
    }

    // Fallback to URL parameter-based logic
    // Street-view tours go back to master plan
    if (state.data && state.data.modelId === null) {
      return "Back to Master Plan";
    }

    const unit = searchParams.get("unit");
    const building = searchParams.get("building");
    const floor = searchParams.get("floor");

    // If we have building and floor but no unit, we came from floor plan
    if (building && floor && !unit) {
      return "Back to Floor Plan";
    }

    // Unit tours go back to unit
    if (unit) {
      return "Back to Unit";
    }

    return "Back to Master Plan";
  }, [tourBackLocation, searchParams, state.data]);

  const handleSceneChange = (nextSceneId: string) => {
    if (nextSceneId === currentSceneId) {
      return;
    }

    // Capture current camera orientation before transitioning
    if (viewerRef.current) {
      const position = viewerRef.current.getPosition();
      const zoomLevel = viewerRef.current.getZoomLevel();

      console.log("TourViewer: Capturing camera orientation for scene list:", {
        yaw: position.yaw,
        pitch: position.pitch,
        zoom: zoomLevel,
      });

      setTargetOrientation({
        yaw: position.yaw,
        pitch: position.pitch,
        zoom: zoomLevel,
      });
    }

    setCurrentSceneId(nextSceneId);
    const params = new URLSearchParams(searchParams);
    params.set("scene", nextSceneId);
    setSearchParams(params, { replace: true });
  };

  const handleSceneCardSelect = (scene: PanoScene) => {
    handleSceneChange(scene.id);
  };

  const navigate = useNavigate();

  const handleBack = () => {
    clearTourBackLocation(); // Clear the stored location after using it
    navigate(backHref);
  };

  const unitName = useMemo(() => {
    const unit = searchParams.get("unit");
    if (unit) {
      return `Unit ${unit}`;
    }
    if (state.data?.modelId) {
      return `Model ${state.data.modelId}`;
    }
    return "Street View";
  }, [searchParams, state.data]);

  const reducedMotion = prefersReducedMotion();

  // Determine animation variants based on direction
  const exitVariant = reducedMotion
    ? { opacity: 0 } // opacity only for reduced motion
    : direction === "backward"
    ? { opacity: 0, scale: 0.7 } // zoom OUT when going back to floor plan
    : { opacity: 0, scale: 1.5 }; // zoom IN when going forward (rare)

  return (
    <motion.div
      className="relative h-screen w-screen overflow-hidden bg-bg-base"
      initial={{ opacity: 1, scale: 1 }} // No enter animation - appear instantly
      animate={{ opacity: 1, scale: 1 }}
      exit={exitVariant}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {/* Full-screen Panorama Viewer */}
      <div className="absolute inset-0">
        {currentScene ? (
          <div className="h-full w-full">
            <div ref={containerRef} className="h-full w-full" />
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-bg-base">
            <div className="flex flex-col items-center gap-md">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-border border-t-primary"></div>
              <span className="text-sm uppercase tracking-[0.35em] text-text-tertiary">
                {allPanoramasPreloaded
                  ? "Initializing tour..."
                  : "Preloading panoramas..."}
              </span>
              {!allPanoramasPreloaded && state.data && (
                <span className="text-xs text-text-tertiary">
                  Loading {state.data.scenes.length} scenes for smooth
                  navigation
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Transition Indicator - Subtle overlay during scene transitions */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-20 pointer-events-none"
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="flex flex-col items-center gap-sm">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error State */}
      {state.status === "error" && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-bg-base">
          <div className="flex flex-col items-center gap-md px-lg text-center">
            <div className="rounded-badge bg-error/10 p-md">
              <svg
                className="h-12 w-12 text-error"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-text-primary">
              Unable to Load Tour
            </h2>
            <p className="text-sm text-text-secondary">{state.error}</p>
            <button
              onClick={handleBack}
              className="mt-md rounded-button bg-primary px-lg py-sm text-sm font-semibold text-text-inverse transition-hover hover:bg-primary-hover"
            >
              Go Back
            </button>
          </div>
        </div>
      )}

      {/* Floating UI Overlays */}
      {state.status === "success" && currentScene && (
        <>
          {/* Top Bar: Back Button + Unit Name */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="absolute left-0 right-0 top-0 z-30 px-lg py-lg"
          >
            <div className="flex items-center justify-between">
              <button
                onClick={handleBack}
                className="group flex items-center gap-sm rounded-badge bg-surface-elevated/80 px-md py-sm backdrop-blur-md transition-hover hover:bg-surface-elevated/90"
              >
                <svg
                  className="h-5 w-5 text-text-secondary transition group-hover:text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                <span className="text-sm font-semibold text-text-primary">
                  {backLabel}
                </span>
              </button>

              <div className="rounded-badge bg-surface-elevated/80 px-lg py-sm backdrop-blur-md">
                <span className="text-sm font-semibold text-text-primary">
                  {unitName}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Bottom Left: Scene Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="absolute bottom-20 left-6 z-30"
          >
            <div className="rounded-card bg-surface-elevated/80 px-md py-md backdrop-blur-md">
              <div className="flex flex-col gap-xs">
                <span className="text-xs font-semibold uppercase tracking-[0.35em] text-primary">
                  Scene
                </span>
                <span className="text-lg font-bold text-text-primary capitalize">
                  {currentScene.name || currentScene.id.replace(/-/g, " ")}
                </span>
                {(() => {
                  const hotspotCount = getSceneHotspots(currentScene).length;
                  return hotspotCount > 0 ? (
                    <span className="text-xs text-text-tertiary">
                      {hotspotCount} hotspot
                      {hotspotCount !== 1 ? "s" : ""} available
                    </span>
                  ) : null;
                })()}
              </div>
            </div>
          </motion.div>

          {/* Bottom Right: Scene List Toggle + Mini Map */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="absolute bottom-20 right-6 z-30 flex flex-col items-end gap-sm"
          >
            {/* Scene List Button */}
            <button
              onClick={() => setShowSceneList(!showSceneList)}
              className="group flex items-center gap-sm rounded-badge bg-surface-elevated/80 px-md py-sm backdrop-blur-md transition-hover hover:bg-surface-elevated/90"
            >
              <svg
                className="h-5 w-5 text-text-secondary transition group-hover:text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              <span className="text-sm font-semibold text-text-primary">
                Scenes ({state.data?.scenes.length ?? 0})
              </span>
            </button>
          </motion.div>

          {/* Floating Scene List Panel */}
          <AnimatePresence>
            {showSceneList && (
              <motion.div
                initial={{ opacity: 0, x: 300 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 300 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="absolute bottom-32 right-6 z-40 w-80 max-h-[60vh] overflow-hidden rounded-card bg-surface-elevated/95 backdrop-blur-md shadow-modal"
              >
                <div className="border-b border-border px-md py-md">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.35em] text-text-secondary">
                      Tour Scenes
                    </h3>
                    <button
                      onClick={() => setShowSceneList(false)}
                      className="text-text-tertiary transition-hover hover:text-text-primary"
                      aria-label="Close scene list"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="overflow-y-auto max-h-[calc(60vh-4rem)] p-sm">
                  <div className="flex flex-col gap-sm">
                    {state.data?.scenes.map((scene) => {
                      const hotspotCount = getSceneHotspots(scene).length;
                      return (
                        <button
                          key={scene.id}
                          type="button"
                          onClick={() => {
                            handleSceneCardSelect(scene);
                            setShowSceneList(false);
                          }}
                          className={`flex flex-col gap-sm rounded-card border px-md py-sm text-left transition-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                            scene.id === currentSceneId
                              ? "border-primary/70 bg-primary/20"
                              : "border-border-muted bg-surface-base/60 hover:border-primary/50 hover:bg-primary/10"
                          }`}
                        >
                          <span className="text-sm font-semibold capitalize text-text-primary">
                            {scene.name || scene.id.replace(/-/g, " ")}
                          </span>
                          <span className="text-xs text-text-tertiary">
                            {hotspotCount
                              ? `${hotspotCount} hotspot${
                                  hotspotCount !== 1 ? "s" : ""
                                }`
                              : "No hotspots"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </motion.div>
  );
};
