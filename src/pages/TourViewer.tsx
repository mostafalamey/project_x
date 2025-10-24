import "photo-sphere-viewer/dist/photo-sphere-viewer.css";

import { useEffect, useMemo, useRef, useState } from "react";
import { ReactPhotoSphereViewer } from "react-photo-sphere-viewer";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import { useTransitionContext } from "../contexts/TransitionContext";
import { loadTour } from "../data/loaders";
import type { PanoScene, Tour } from "../data/types";
import { useNavigationStore } from "../stores/navigationStore";
import { prefersReducedMotion } from "../utils/accessibility";

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

export const TourViewer = () => {
  const { tourId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { direction } = useTransitionContext();
  const { tourBackLocation, clearTourBackLocation } = useNavigationStore();
  const [state, setState] = useState<FetchState<Tour>>(initialState);
  const [currentSceneId, setCurrentSceneId] = useState<string | null>(null);
  const [isFading, setIsFading] = useState(false);
  const [panoLoading, setPanoLoading] = useState(true);

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
          setCurrentSceneId(data.startSceneId ?? data.scenes[0]?.id ?? null);
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

  useEffect(() => {
    if (!currentScene || !state.data) {
      return;
    }

    currentScene.links?.forEach((link) => {
      const scene = findScene(state.data, link.target);
      if (scene) {
        const image = new Image();
        image.src = scene.image;
      }
    });
  }, [currentScene, state.data]);

  const backHref = useMemo(() => {
    // First priority: Use stored back location from Zustand
    console.log("DEBUG: tourBackLocation from Zustand:", tourBackLocation);
    if (tourBackLocation) {
      console.log("DEBUG: Using Zustand back location:", tourBackLocation);
      return tourBackLocation;
    }

    // Fallback to URL parameter-based logic
    // Check if this is a street-view tour (non-unit tour)
    if (state.data && state.data.modelId === null) {
      console.log("DEBUG: Street-view tour, going to masterplan");
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

    setIsFading(true);
    setPanoLoading(true);
    window.setTimeout(() => {
      setCurrentSceneId(nextSceneId);
      const params = new URLSearchParams(searchParams);
      params.set("scene", nextSceneId);
      setSearchParams(params, { replace: true });
      setIsFading(false);
    }, 250);
  };

  const handleSceneCardSelect = (scene: PanoScene) => {
    handleSceneChange(scene.id);
  };

  const navigate = useNavigate();
  const [showSceneList, setShowSceneList] = useState(false);

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
          <motion.div
            key={currentScene.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: isFading ? 0 : 1 }}
            transition={{ duration: 0.25 }}
            className="h-full w-full"
          >
            <ReactPhotoSphereViewer
              src={currentScene.image}
              height="100vh"
              width="100%"
              littlePlanet={false}
              pitch={currentScene.initialView?.pitch}
              yaw={currentScene.initialView?.yaw}
              fov={currentScene.initialView?.fov}
              onReady={() => setPanoLoading(false)}
            />
          </motion.div>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-bg-base">
            <div className="flex flex-col items-center gap-md">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-border border-t-primary"></div>
              <span className="text-sm uppercase tracking-[0.35em] text-text-tertiary">
                Initializing tour...
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      <AnimatePresence>
        {panoLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 flex items-center justify-center bg-bg-overlay backdrop-blur-sm"
          >
            <div className="flex flex-col items-center gap-md">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-border border-t-primary"></div>
              <span className="text-sm uppercase tracking-[0.35em] text-text-tertiary">
                Loading panorama...
              </span>
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
                  {currentScene.id.replace(/-/g, " ")}
                </span>
                {currentScene.links && currentScene.links.length > 0 && (
                  <span className="text-xs text-text-tertiary">
                    {currentScene.links.length} hotspot
                    {currentScene.links.length !== 1 ? "s" : ""} available
                  </span>
                )}
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
                    {state.data?.scenes.map((scene) => (
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
                          {scene.id.replace(/-/g, " ")}
                        </span>
                        <span className="text-xs text-text-tertiary">
                          {scene.links?.length
                            ? `${scene.links.length} hotspot${
                                scene.links.length !== 1 ? "s" : ""
                              }`
                            : "No hotspots"}
                        </span>
                      </button>
                    ))}
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
