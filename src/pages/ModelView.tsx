import { motion } from "framer-motion";
import {
  BedDouble,
  Bath,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Video,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { BackNav } from "../components/BackNav";
import { useTransitionContext } from "../contexts/TransitionContext";
import { getTourIdForModel } from "../data/enrichment";
import { loadModels } from "../data/loaders";
import type { Model } from "../data/types";
import { useModelRotation } from "../hooks/useModelRotation";
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

export const ModelView = () => {
  const { modelId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { direction } = useTransitionContext();
  const { setTourBackLocation, modelBackLocation, clearModelBackLocation } =
    useNavigationStore();

  const [state, setState] = useState<FetchState<Model>>(initialState);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [tourId, setTourId] = useState<string | null>(null);
  const [allModels, setAllModels] = useState<Model[]>([]);

  // Debug: Log URL parameters
  useEffect(() => {
    console.log("ModelView URL params:", {
      modelId,
      building: searchParams.get("building"),
      floor: searchParams.get("floor"),
      angle: searchParams.get("angle"),
      unit: searchParams.get("unit"),
    });
  }, [modelId, searchParams]);

  // Load model data
  useEffect(() => {
    if (!modelId) {
      navigate("/masterplan");
      return;
    }

    let cancelled = false;

    const fetchModel = async () => {
      setState((prev) => ({ ...prev, status: "loading", error: null }));

      try {
        const models = await loadModels();
        const model = models.find((m) => m.id === modelId);

        if (!cancelled) {
          setAllModels(models); // Store all models for tour detection
          if (model) {
            setState({ status: "success", data: model, error: null });
          } else {
            setState({
              status: "error",
              data: null,
              error: `Model "${modelId}" not found`,
            });
          }
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            status: "error",
            data: null,
            error:
              error instanceof Error
                ? error.message
                : "Unable to load model data",
          });
        }
      }
    };

    fetchModel();

    return () => {
      cancelled = true;
    };
  }, [modelId, navigate]);

  const model = state.data;
  const rotation360 = model?.rotation360;

  // Check for tour when model is loaded
  useEffect(() => {
    if (!model || !modelId || allModels.length === 0) {
      setTourId(null);
      return;
    }

    let cancelled = false;

    const checkTour = async () => {
      try {
        const detectedTourId = await getTourIdForModel(modelId, allModels);

        if (!cancelled) {
          console.log(
            `ModelView: Tour detection for model ${modelId}:`,
            detectedTourId
              ? `Found tour ${detectedTourId}`
              : "No tour available"
          );
          setTourId(detectedTourId);
        }
      } catch (error) {
        console.warn("ModelView: Error checking for tour:", error);
        if (!cancelled) {
          setTourId(null);
        }
      }
    };

    checkTour();

    return () => {
      cancelled = true;
    };
  }, [model, modelId, allModels]);

  // Back navigation logic
  const backHref = useMemo(() => {
    // First priority: Use stored back location from Zustand
    if (modelBackLocation) {
      console.log("ModelView: Using Zustand back location:", modelBackLocation);
      return modelBackLocation;
    }

    // Fallback to masterplan
    return "/masterplan";
  }, [modelBackLocation]);

  const backLabel = useMemo(() => {
    if (modelBackLocation) {
      if (modelBackLocation.includes("/floor/")) {
        return "Back to Floor Plan";
      }
      if (modelBackLocation.includes("/building/")) {
        return "Back to Building";
      }
      if (modelBackLocation.includes("/masterplan")) {
        return "Back to Master Plan";
      }
    }
    return "Back to Models";
  }, [modelBackLocation]);

  const handleBack = () => {
    clearModelBackLocation();
    navigate(backHref);
  };

  // Initialize rotation hook
  const { currentFrame, handlers, incrementFrame, decrementFrame } =
    useModelRotation({
      frameCount: rotation360?.frameCount ?? 1,
      initialFrame: 0,
      sensitivity: 30, // 30 pixels per frame
    });

  // Keyboard navigation for rotation
  useEffect(() => {
    if (state.status !== "success" || !rotation360) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input fields
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        decrementFrame();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        incrementFrame();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.status, rotation360, decrementFrame, incrementFrame]);

  // Generate frame URL with zero-padding support
  const getFrameUrl = (frame: number): string => {
    if (!rotation360) return model?.imagePath ?? "";

    const pattern = rotation360.filenamePattern ?? "frame-{index}.jpg";

    // Check if pattern contains zero-padded placeholder (e.g., "model-A_{index}.jpg" where we need 4 digits)
    // If the pattern includes underscore before {index}, assume 4-digit zero padding
    const needsZeroPadding = pattern.includes("_{index}");
    const frameStr = needsZeroPadding
      ? frame.toString().padStart(4, "0")
      : frame.toString();

    const filename = pattern.replace("{index}", frameStr);
    return `${rotation360.folder}/${filename}`;
  };

  const currentImageUrl = rotation360
    ? getFrameUrl(currentFrame)
    : model?.imagePath ?? "";

  // Reset image loaded state when URL changes
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [currentImageUrl]);

  // Preload adjacent frames for smooth rotation
  useEffect(() => {
    if (!rotation360) return;

    const framesToPreload = [
      currentFrame - 1,
      currentFrame,
      currentFrame + 1,
    ].map((f) => {
      const wrapped = f % rotation360.frameCount;
      return wrapped < 0 ? wrapped + rotation360.frameCount : wrapped;
    });

    framesToPreload.forEach((frame) => {
      const img = new Image();
      img.src = getFrameUrl(frame);
    });
  }, [currentFrame, rotation360]);

  // Animation variants
  const containerVariants = {
    initial: (direction: "forward" | "backward") => ({
      opacity: 0,
      scale: direction === "forward" ? 1.05 : 0.95,
    }),
    animate: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: prefersReducedMotion() ? 0.01 : 0.3,
        ease: "easeOut",
      },
    },
    exit: (direction: "forward" | "backward") => ({
      opacity: 0,
      scale: direction === "forward" ? 0.95 : 1.05,
      transition: {
        duration: prefersReducedMotion() ? 0.01 : 0.25,
        ease: "easeIn",
      },
    }),
  };

  // Loading state
  if (state.status === "loading") {
    return (
      <motion.div
        custom={direction}
        variants={containerVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="flex min-h-screen flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
      >
        <div className="relative z-20 p-6">
          <BackNav label={backLabel} to={backHref} />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-emerald-500" />
            <p className="text-lg text-slate-400">Loading model...</p>
          </div>
        </div>
      </motion.div>
    );
  }

  // Error state
  if (state.status === "error") {
    return (
      <motion.div
        custom={direction}
        variants={containerVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="flex min-h-screen flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
      >
        <div className="relative z-20 p-6">
          <BackNav label={backLabel} to={backHref} />
        </div>
        <div className="flex flex-1 items-center justify-center px-4">
          <div className="max-w-md text-center">
            <div className="mb-4 text-6xl">⚠️</div>
            <h2 className="mb-2 text-2xl font-bold text-slate-100">
              Model Not Found
            </h2>
            <p className="mb-6 text-slate-400">{state.error}</p>
            <button
              onClick={() => navigate("/masterplan")}
              className="rounded-lg bg-emerald-500 px-6 py-3 font-semibold text-slate-900 transition hover:bg-emerald-400"
            >
              Browse Models
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Success state - styled like MasterPlanView
  return (
    <motion.div
      custom={direction}
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="h-screen w-screen"
    >
      <div
        className="relative h-screen w-screen overflow-hidden bg-slate-950 text-slate-100"
        {...handlers}
        style={{
          cursor: rotation360 && !imageError ? "grab" : "default",
          touchAction: "none",
        }}
      >
        {/* Full-screen Image */}
        <div className="absolute inset-0">
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950">
              <Loader2 className="h-16 w-16 animate-spin text-emerald-500" />
            </div>
          )}

          {!imageError ? (
            <img
              src={currentImageUrl}
              alt={model?.title ?? `Model ${model?.id}`}
              className="h-full w-full object-cover select-none"
              draggable={false}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              style={{
                opacity: imageLoaded ? 1 : 0,
              }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950">
              <div className="text-center">
                <div className="mb-4 text-6xl text-slate-600">📦</div>
                <p className="text-slate-400">Image not available</p>
              </div>
            </div>
          )}
        </div>

        {/* Gradient overlays - matching MasterPlanView */}
        <div className="pointer-events-none absolute inset-0 h-1/4 bg-gradient-to-b from-slate-950/70 to-transparent" />
        <div className="pointer-events-none absolute bottom-0 inset-x-0 h-1/4 bg-gradient-to-t from-slate-950/70 to-transparent" />

        {/* UI Layer - overlaid on top */}
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-lg">
          {/* Top Section - Back button and Title */}
          <div className="flex w-full items-start justify-between gap-md">
            <div className="pointer-events-auto flex flex-col gap-sm">
              <BackNav label={backLabel} to={backHref} />
              <div className="max-w-xl">
                <span className="text-xs font-semibold uppercase tracking-[0.5em] text-primary">
                  Model {model?.id}
                </span>
                <h1 className="mt-sm text-heading-1 font-bold">
                  {model?.title ?? `Model ${model?.id}`}
                </h1>
                <div className="mt-md flex flex-wrap items-center gap-md text-text-primary">
                  <div className="flex items-center gap-sm">
                    <BedDouble className="h-5 w-5 text-primary" />
                    <span className="text-sm">
                      {model?.bedrooms}{" "}
                      {model?.bedrooms === 1 ? "Bedroom" : "Bedrooms"}
                    </span>
                  </div>
                  <div className="flex items-center gap-sm">
                    <Bath className="h-5 w-5 text-primary" />
                    <span className="text-sm">
                      {model?.bathrooms}{" "}
                      {model?.bathrooms === 1 ? "Bathroom" : "Bathrooms"}
                    </span>
                  </div>
                  <div className="rounded-badge border border-border px-md py-sm text-xs font-semibold uppercase tracking-[0.45em]">
                    {model?.areaM2} m²
                  </div>
                </div>
                {model?.description && (
                  <p className="mt-sm text-sm text-text-primary leading-relaxed">
                    {model.description}
                  </p>
                )}
                {tourId && (
                  <button
                    type="button"
                    onClick={() => {
                      // Store the back location (THIS ModelView page) before navigating
                      const building = searchParams.get("building");
                      const floor = searchParams.get("floor");
                      const angle = searchParams.get("angle");

                      // Build the back URL to this ModelView page
                      const params = new URLSearchParams();
                      if (building) params.set("building", building);
                      if (floor) params.set("floor", floor);
                      if (angle) params.set("angle", angle);
                      const query = params.toString();
                      const backUrl = query
                        ? `/model/${modelId}?${query}`
                        : `/model/${modelId}`;

                      console.log("ModelView: Storing back location:", backUrl);
                      setTourBackLocation(backUrl);

                      // Navigate to tour (no query params needed!)
                      navigate(`/tour/${tourId}`);
                    }}
                    className="mt-md inline-flex items-center gap-sm rounded-badge bg-primary px-md py-sm text-sm font-semibold text-text-inverse transition-hover hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                  >
                    <Video className="h-4 w-4" />
                    <span>Explore 360° Virtual Tour</span>
                  </button>
                )}
              </div>
            </div>

            {/* Frame Counter - top right */}
            {rotation360 && imageLoaded && !imageError && (
              <div className="pointer-events-auto flex flex-col items-end gap-sm text-xs font-semibold uppercase tracking-[0.45em] text-text-secondary">
                <div className="rounded-badge border border-border px-md py-sm">
                  Frame {currentFrame + 1} / {rotation360.frameCount}
                </div>
                <span className="text-caption uppercase tracking-[0.45em] text-text-tertiary">
                  Drag to rotate 360°
                </span>
              </div>
            )}
          </div>

          {/* Middle Section - Rotation Hints */}
          {rotation360 && imageLoaded && !imageError && (
            <div className="flex items-center justify-between">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 0.6, x: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="pointer-events-none flex items-center gap-sm rounded-badge bg-surface-elevated/80 px-md py-sm text-text-secondary backdrop-blur-sm"
              >
                <ChevronLeft className="h-5 w-5" />
                <span className="text-sm">Swipe</span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 0.6, x: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="pointer-events-none flex items-center gap-sm rounded-badge bg-surface-elevated/80 px-md py-sm text-text-secondary backdrop-blur-sm"
              >
                <span className="text-sm">to rotate</span>
                <ChevronRight className="h-5 w-5" />
              </motion.div>
            </div>
          )}

          {/* Bottom Section - Status Message */}
          <div className="pointer-events-none flex w-full items-center justify-center">
            {rotation360 && imageLoaded && !imageError && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="rounded-badge bg-surface-elevated/80 px-lg py-sm text-center text-xs font-semibold uppercase tracking-[0.45em] text-text-secondary shadow-elevated backdrop-blur-sm"
                role="status"
                aria-live="polite"
              >
                Drag to rotate 360°
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
