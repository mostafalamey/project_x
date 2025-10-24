import { AnimatePresence, motion } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { BackNav } from "../components/BackNav";
import { BrowseModelsButton } from "../components/BrowseModelsButton";
import { ModelList } from "../components/ModelList";
import { SearchPanel } from "../components/SearchPanel";
import { Tooltip } from "../components/Tooltip";
import { useTransitionContext } from "../contexts/TransitionContext";
import { filterModels, type ModelFilters } from "../data/enrichment";
import { loadBuilding, loadModels } from "../data/loaders";
import type { Building, BuildingFloor, Model, Polygon } from "../data/types";
import { useKeyboard } from "../hooks/useKeyboard";
import { usePointerPan } from "../hooks/usePointerPan";
import { useZoomPan } from "../hooks/useZoomPan";
import { prefersReducedMotion } from "../utils/accessibility";

const VIEWBOX = { width: 960, height: 1440 };
const ZOOM_DELAY_MS = 360;

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

const polygonToPointString = (polygon: Polygon) => {
  const segments: string[] = [];

  for (let index = 0; index < polygon.length; index += 2) {
    const x = polygon[index];
    const y = polygon[index + 1];

    if (typeof x === "number" && typeof y === "number") {
      segments.push(`${x},${y}`);
    }
  }

  return segments.join(" ");
};

const centroidOfPolygons = (polygons: Polygon[]) => {
  let totalX = 0;
  let totalY = 0;
  let count = 0;

  polygons.forEach((polygon) => {
    for (let index = 0; index < polygon.length; index += 2) {
      const x = polygon[index];
      const y = polygon[index + 1];

      if (typeof x === "number" && typeof y === "number") {
        totalX += x;
        totalY += y;
        count += 1;
      }
    }
  });

  if (count === 0) {
    return null;
  }

  return {
    x: totalX / count,
    y: totalY / count,
  };
};

const generateFallbackRectangles = (
  index: number,
  total: number
): Polygon[] => {
  if (total <= 0) {
    return [];
  }

  const paddingTop = 140;
  const paddingBottom = 160;
  const gapRaw = 32;
  const availableHeight = Math.max(
    200,
    VIEWBOX.height - paddingTop - paddingBottom
  );
  const gap = total > 1 ? gapRaw : 0;
  const heightPerBand = Math.max(
    90,
    Math.min(220, (availableHeight - gap * Math.max(total - 1, 0)) / total)
  );
  const yTop = paddingTop + index * (heightPerBand + gap);
  const yBottom = Math.min(
    yTop + heightPerBand,
    VIEWBOX.height - paddingBottom
  );
  const xPadding = Math.round(VIEWBOX.width * 0.18);
  const xLeft = xPadding;
  const xRight = VIEWBOX.width - xPadding;

  return [[xLeft, yTop, xRight, yTop, xRight, yBottom, xLeft, yBottom]];
};

const handleKeyActivation = (
  event: KeyboardEvent<SVGElement>,
  handler: () => void
) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    handler();
  }
};

export const BuildingView = () => {
  const { buildingId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { startTransition, direction } = useTransitionContext();
  const [state, setState] = useState<FetchState<Building>>(initialState);
  const [highlightedFloorId, setHighlightedFloorId] = useState<string | null>(
    searchParams.get("floor")
  );

  const reducedMotion = prefersReducedMotion();

  // Determine animation variants based on direction
  const exitVariant = reducedMotion
    ? { opacity: 0 } // opacity only for reduced motion
    : direction === "backward"
    ? { opacity: 0, scale: 0.7 } // zoom OUT when going back
    : { opacity: 0, scale: 1.5 }; // zoom IN when going forward

  const initialVariant = reducedMotion
    ? { opacity: 0 } // opacity only for reduced motion
    : direction === "backward"
    ? { opacity: 0, scale: 1.5 } // start zoomed IN when coming from deeper level
    : { opacity: 0, scale: 0.7 }; // start zoomed OUT when coming from shallower level
  const [hoveredFloorId, setHoveredFloorId] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [zoomingFloorId, setZoomingFloorId] = useState<string | null>(null);
  const transitionTimerRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Search/Models state
  const [showSearch, setShowSearch] = useState(false);
  const [modelsState, setModelsState] =
    useState<FetchState<Model[]>>(initialState);
  const [filters, setFilters] = useState<ModelFilters>({});
  const [filteredModels, setFilteredModels] = useState<Model[]>([]);

  // Zoom/pan state
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const {
    state: zoomPanState,
    zoomIn,
    zoomOut,
    resetZoom,
    panBy,
    setInteracting,
  } = useZoomPan(containerSize, containerSize); // Use containerSize for both since image uses object-cover

  // Pointer-based panning (mouse drag)
  const { pointerHandlers } = usePointerPan({
    enabled: zoomPanState.zoom > 1 && !showSearch,
    onPanStart: () => setInteracting(true),
    onPan: (delta) => panBy(delta),
    onPanEnd: () => setInteracting(false),
  });

  // Keyboard controls
  useKeyboard({
    onZoomIn: () => zoomIn(),
    onZoomOut: () => zoomOut(),
    onResetZoom: resetZoom,
    onPan: (dx, dy) => panBy({ x: dx, y: dy }),
    enabled: !showSearch, // Disable when search panel is open
  });

  // Wheel zoom handler
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();

      const rect = container.getBoundingClientRect();
      const originX = event.clientX - rect.left - rect.width / 2;
      const originY = event.clientY - rect.top - rect.height / 2;

      if (event.deltaY < 0) {
        zoomIn({ x: originX, y: originY });
      } else {
        zoomOut({ x: originX, y: originY });
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [zoomIn, zoomOut]);

  useEffect(() => {
    if (!buildingId) {
      return;
    }

    let cancelled = false;

    const fetchBuilding = async () => {
      setState((previous) => ({ ...previous, status: "loading", error: null }));

      try {
        const data = await loadBuilding(buildingId);

        if (!cancelled) {
          setState({ status: "success", data, error: null });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            status: "error",
            data: null,
            error:
              error instanceof Error
                ? error.message
                : "Unable to load building data",
          });
        }
      }
    };

    fetchBuilding();

    return () => {
      cancelled = true;
    };
  }, [buildingId]);

  // Reset image loaded state when elevation image URL changes
  useEffect(() => {
    if (state.data?.elevationImage) {
      setImageLoaded(false);
      setImageError(false);
    }
  }, [state.data?.elevationImage]);

  // Load models when search panel is opened
  useEffect(() => {
    if (!showSearch) {
      return;
    }

    if (modelsState.status !== "idle") {
      return;
    }

    let cancelled = false;

    const fetchModels = async () => {
      setModelsState((prev) => ({ ...prev, status: "loading", error: null }));

      try {
        const data = await loadModels();

        if (!cancelled) {
          setModelsState({ status: "success", data, error: null });
        }
      } catch (error) {
        if (!cancelled) {
          setModelsState({
            status: "error",
            data: null,
            error:
              error instanceof Error
                ? error.message
                : "Unable to load models data",
          });
        }
      }
    };

    fetchModels();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSearch]);

  // Apply filters
  useEffect(() => {
    if (modelsState.status !== "success" || !modelsState.data) {
      setFilteredModels([]);
      return;
    }

    const filtered = filterModels(modelsState.data, filters);
    setFilteredModels(filtered);
  }, [filters, modelsState]);

  useEffect(() => {
    if (
      state.status === "success" &&
      state.data &&
      highlightedFloorId &&
      !state.data.floors.some((floor) => floor.id === highlightedFloorId)
    ) {
      setHighlightedFloorId(null);
    }
  }, [highlightedFloorId, state]);

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current !== null) {
        window.clearTimeout(transitionTimerRef.current);
      }
    };
  }, []);

  const sortedFloors = useMemo(() => {
    if (!state.data) {
      return [] as BuildingFloor[];
    }

    return [...state.data.floors].sort((a, b) => b.number - a.number);
  }, [state.data]);

  const floorDictionary = useMemo(() => {
    const dictionary = new Map<string, BuildingFloor>();

    sortedFloors.forEach((floor) => {
      dictionary.set(floor.id, floor);
    });

    return dictionary;
  }, [sortedFloors]);

  const hotspotFloorCount = useMemo(
    () =>
      sortedFloors.filter((floor) => (floor.elevationPolygons?.length ?? 0) > 0)
        .length,
    [sortedFloors]
  );

  const polygonsByFloor = useMemo(() => {
    const total = sortedFloors.length;
    const entries = sortedFloors.map((floor, index) => {
      if (floor.elevationPolygons && floor.elevationPolygons.length > 0) {
        return [floor.id, floor.elevationPolygons] as const;
      }

      return [floor.id, generateFallbackRectangles(index, total)] as const;
    });

    return new Map<(typeof entries)[number][0], (typeof entries)[number][1]>(
      entries
    );
  }, [sortedFloors]);

  const masterPlanAngle = searchParams.get("angle");
  const hoveredFloor = hoveredFloorId
    ? floorDictionary.get(hoveredFloorId)
    : null;
  const tooltipFloor = hoveredFloor;

  const tooltipPosition = useMemo(() => {
    if (!tooltipFloor) {
      return null;
    }

    const polygons = polygonsByFloor.get(tooltipFloor.id) ?? [];

    if (polygons.length === 0) {
      return null;
    }

    const centroid = centroidOfPolygons(polygons);

    if (!centroid) {
      return null;
    }

    return {
      left: `${(centroid.x / VIEWBOX.width) * 100}%`,
      top: `${(centroid.y / VIEWBOX.height) * 100}%`,
    };
  }, [polygonsByFloor, tooltipFloor]);

  const statusMessage = useMemo(() => {
    if (state.status === "loading") {
      return "Loading elevation hotspots...";
    }

    if (state.status === "error") {
      return state.error ?? "Unable to load building data.";
    }

    return "Select a floor to open the floor plan.";
  }, [state]);

  const handleFloorNavigate = (floorId: string, polygons?: Polygon[]) => {
    if (!buildingId || zoomingFloorId === floorId) {
      return;
    }

    const floor = floorDictionary.get(floorId);

    if (!floor) {
      return;
    }

    setHighlightedFloorId(floorId);
    setHoveredFloorId(null);
    setZoomingFloorId(floorId);

    const params = new URLSearchParams();
    params.set("building", buildingId);
    params.set("floor", floorId);

    const angle = searchParams.get("angle");

    if (angle) {
      params.set("angle", angle);
    }

    // Calculate origin for transition
    let origin = { x: 0.5, y: 0.5 }; // Default to center
    if (polygons && polygons.length > 0) {
      const centroid = centroidOfPolygons(polygons);
      if (centroid) {
        origin = {
          x: centroid.x / VIEWBOX.width,
          y: centroid.y / VIEWBOX.height,
        };
      }
    }

    const targetUrl = `/building/${buildingId}/floor/${floorId}?${params.toString()}`;
    startTransition(targetUrl, origin);

    if (transitionTimerRef.current !== null) {
      window.clearTimeout(transitionTimerRef.current);
    }

    // Small delay to ensure AnimatePresence properly processes the exit animation
    setTimeout(() => {
      navigate(targetUrl);
    }, 50);
  };

  return (
    <motion.div
      className="h-screen w-screen"
      initial={initialVariant}
      animate={{ opacity: 1, scale: 1 }}
      exit={exitVariant}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <div
        ref={containerRef}
        className="relative h-screen w-screen overflow-hidden bg-slate-950 text-slate-100"
        {...pointerHandlers}
      >
        {/* Single motion.div for zoom/pan - contains both image and SVG */}
        <motion.div
          className="absolute inset-0"
          initial={false}
          animate={{
            opacity: imageError ? 0.15 : 1,
            scale: zoomPanState.zoom,
            x: zoomPanState.pan.x,
            y: zoomPanState.pan.y,
          }}
          transition={{
            duration: zoomPanState.isInteracting ? 0 : 0.45,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {state.data?.elevationImage && !imageError ? (
            <motion.img
              key={state.data.elevationImage}
              src={state.data.elevationImage}
              alt={state.data.name ?? "Building elevation"}
              className="pointer-events-none h-full w-full object-cover"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              initial={{ opacity: 0.4, scale: 1.02 }}
              animate={{
                opacity: imageLoaded ? 1 : 0.4,
                scale: imageLoaded ? 1 : 1.02,
              }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900" />
          )}

          {/* SVG floor hotspots - in same transform container */}
          <svg
            className="pointer-events-auto absolute inset-0 h-full w-full"
            viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
            role="presentation"
            onMouseLeave={() => setHoveredFloorId(null)}
          >
            {sortedFloors.map((floor) => {
              const polygons = polygonsByFloor.get(floor.id) ?? [];

              if (polygons.length === 0) {
                return null;
              }

              const isHovered = hoveredFloorId === floor.id;
              const isHighlighted = highlightedFloorId === floor.id;
              const isZooming = zoomingFloorId === floor.id;
              const hasHoveredFloor = hoveredFloorId !== null;
              const fillClass =
                isHovered || isHighlighted || isZooming
                  ? "fill-emerald-400/10 stroke-emerald-200"
                  : hasHoveredFloor
                  ? "fill-slate-950/50 stroke-emerald-200/50"
                  : "fill-transparent stroke-emerald-200/50";

              const centroid = centroidOfPolygons(polygons);

              return (
                <g
                  key={floor.id}
                  className="cursor-pointer focus:outline-none focus-visible:outline-none"
                  onFocus={() => setHoveredFloorId(floor.id)}
                  onBlur={() =>
                    setHoveredFloorId((prev) =>
                      prev === floor.id ? null : prev
                    )
                  }
                  onMouseEnter={() => setHoveredFloorId(floor.id)}
                  onMouseLeave={() =>
                    setHoveredFloorId((prev) =>
                      prev === floor.id ? null : prev
                    )
                  }
                  onClick={() => handleFloorNavigate(floor.id, polygons)}
                  onKeyDown={(event) =>
                    handleKeyActivation(event, () =>
                      handleFloorNavigate(floor.id, polygons)
                    )
                  }
                  role="button"
                  tabIndex={0}
                  aria-label={`Open floor ${floor.number} plan`}
                >
                  {polygons.map((polygon: Polygon, index: number) => (
                    <polygon
                      key={`${floor.id}-${index}`}
                      points={polygonToPointString(polygon)}
                      className={`stroke-[2] transition ${fillClass}`}
                    />
                  ))}
                  {centroid ? (
                    <text
                      x={centroid.x}
                      y={centroid.y}
                      className="fill-slate-100 text-[11px] font-semibold uppercase tracking-[0.4em] text-center"
                      textAnchor="middle"
                    >
                      {`F${floor.number}`}
                    </text>
                  ) : null}
                </g>
              );
            })}
          </svg>
        </motion.div>

        {/* Gradient overlay - not zoomed */}
        <div className="pointer-events-none absolute inset-0 h-1/3 bg-gradient-to-b from-slate-950/70 to-transparent" />
        <div className="pointer-events-none absolute bottom-0 inset-x-0 h-1/4 bg-gradient-to-t from-slate-950/70 to-transparent" />

        {/* UI Layer - not zoomed */}
        <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-lg sm:p-xl">
          <div className="flex flex-col gap-lg sm:flex-row sm:items-start sm:justify-between">
            <div className="pointer-events-auto flex flex-col gap-md">
              <BackNav
                label="Master plan"
                to={
                  masterPlanAngle
                    ? `/masterplan?angle=${masterPlanAngle}`
                    : "/masterplan"
                }
              />
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.45em] text-text-accent">
                  {state.data?.id ?? "Building"}
                </span>
                <h1 className="mt-3 text-4xl font-bold sm:text-5xl">
                  {state.data?.name ?? "Building Elevation"}
                </h1>
                <p className="mt-3 max-w-xl text-sm">
                  Hover floors to preview stats, then click to dive into the
                  plan. The elevation stays immersive while overlays float above
                  the imagery.
                </p>
              </div>
            </div>
            {state.data ? (
              <div className="pointer-events-auto flex flex-col items-end gap-md">
                <div className="flex flex-col items-end gap-sm rounded-card border border-border-muted bg-surface-elevated/50 px-lg py-md text-xs uppercase tracking-[0.45em] text-text-secondary">
                  <span>Total floors · {sortedFloors.length}</span>
                </div>
                <BrowseModelsButton
                  isOpen={showSearch}
                  onClick={() => setShowSearch(!showSearch)}
                />
              </div>
            ) : null}
          </div>

          <AnimatePresence>
            {statusMessage ? (
              <motion.div
                key={statusMessage}
                className="pointer-events-none self-center rounded-badge bg-surface-elevated/85 px-lg py-sm text-xs font-semibold uppercase tracking-[0.45em] text-text-secondary shadow-elevated"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
                {statusMessage}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Tooltip - not zoomed */}
        <AnimatePresence>
          {tooltipFloor && tooltipPosition ? (
            <motion.div
              key={tooltipFloor.id}
              className="pointer-events-none absolute z-30 max-w-xs -translate-x-1/2 -translate-y-[120%]"
              style={tooltipPosition}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
            >
              <Tooltip
                title={`Floor ${tooltipFloor.number}`}
                footer="Select to open the floor plan view"
              />
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Search Panel Overlay */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              className="absolute inset-0 z-40 flex items-start justify-end bg-slate-950/40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSearch(false)}
            >
              <motion.div
                className="h-full w-full max-w-2xl overflow-y-auto bg-surface-elevated/95 p-lg shadow-modal"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-lg flex items-center justify-between">
                  <h2 className="text-heading-3 font-bold">Browse Models</h2>
                  <button
                    type="button"
                    onClick={() => setShowSearch(false)}
                    className="rounded-button p-sm transition-hover hover:bg-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                    aria-label="Close search panel"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {modelsState.status === "loading" ||
                modelsState.status === "idle" ? (
                  <div className="flex items-center justify-center py-2xl">
                    <div className="text-center">
                      <Loader2 className="mb-md inline-block h-12 w-12 animate-spin text-primary" />
                      <p className="text-text-secondary">Loading models...</p>
                    </div>
                  </div>
                ) : modelsState.status === "error" ? (
                  <div className="rounded-card border border-error/20 bg-error/10 p-lg text-center">
                    <p className="text-error">{modelsState.error}</p>
                  </div>
                ) : (
                  <div className="space-y-lg">
                    <SearchPanel
                      filters={filters}
                      onFiltersChange={setFilters}
                      resultCount={filteredModels.length}
                      showAvailability={false}
                    />
                    <ModelList
                      models={filteredModels}
                      onModelSelect={() => setShowSearch(false)}
                      backLocation={`/building/${buildingId}`}
                    />
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
