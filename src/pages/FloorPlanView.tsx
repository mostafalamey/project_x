import { AnimatePresence, motion } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import {
  useCallback,
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
import {
  deriveTourId,
  enrichFloorData,
  filterModels,
  getTourIdForModel,
  getTourPathByModelId,
  type EnrichedFloor,
  type EnrichedUnitHotspot,
  type ModelFilters,
} from "../data/enrichment";
import { loadFloor, loadModels, loadUnits } from "../data/loaders";
import type { Model, Unit } from "../data/types";
import { useKeyboard } from "../hooks/useKeyboard";
import { usePointerPan } from "../hooks/usePointerPan";
import { useZoomPan } from "../hooks/useZoomPan";
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

const VIEWBOX_WIDTH = 1920;
const VIEWBOX_HEIGHT = 1080;

const toPointString = (shape: number[]) => {
  const points: string[] = [];

  for (let index = 0; index < shape.length; index += 2) {
    const x = shape[index];
    const y = shape[index + 1];

    if (typeof x === "number" && typeof y === "number") {
      points.push(`${x},${y}`);
    }
  }

  return points.join(" ");
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

const getPolygonBounds = (shape: number[]) => {
  const xs: number[] = [];
  const ys: number[] = [];

  for (let index = 0; index < shape.length; index += 2) {
    const x = shape[index];
    const y = shape[index + 1];

    if (typeof x === "number") {
      xs.push(x);
    }

    if (typeof y === "number") {
      ys.push(y);
    }
  }

  if (!xs.length || !ys.length) {
    return {
      minX: 0,
      maxX: 0,
      minY: 0,
      maxY: 0,
      centerX: 0,
      centerY: 0,
    };
  }

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return {
    minX,
    maxX,
    minY,
    maxY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
};

const clamp = (value: number, minimum: number, maximum: number) => {
  if (!Number.isFinite(value)) {
    return minimum;
  }

  return Math.min(Math.max(value, minimum), maximum);
};

const formatMatrixValue = (value: number) => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.round(value * 1000) / 1000;
};

export const FloorPlanView = () => {
  const { buildingId, floorId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { direction } = useTransitionContext();
  const { setTourBackLocation } = useNavigationStore();
  const [state, setState] = useState<FetchState<EnrichedFloor>>(initialState);
  const [hoveredUnitId, setHoveredUnitId] = useState<string | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [selectedUnitTourId, setSelectedUnitTourId] = useState<string | null>(
    null
  );
  const [imageError, setImageError] = useState(false);
  const isUnitSelected = Boolean(selectedUnitId);

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
  const [unitLookup, setUnitLookup] = useState<Map<string, Unit> | null>(null);
  const [modelLookup, setModelLookup] = useState<Map<string, Model> | null>(
    null
  );
  const [unitLoadError, setUnitLoadError] = useState<string | null>(null);
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
    panTo,
    zoomTo,
    setInteracting,
  } = useZoomPan(containerSize, containerSize); // Use containerSize for both since content fills container

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
    const planImage = state.data?.floorPlanImage;

    if (!planImage) {
      setImageError(false);
      return;
    }

    let cancelled = false;
    const image = new Image();

    const handleLoad = () => {
      if (!cancelled) {
        setImageError(false);
      }
    };

    const handleError = () => {
      if (!cancelled) {
        setImageError(true);
      }
    };

    image.addEventListener("load", handleLoad);
    image.addEventListener("error", handleError);
    image.src = planImage;

    return () => {
      cancelled = true;
      image.removeEventListener("load", handleLoad);
      image.removeEventListener("error", handleError);
    };
  }, [state.data?.floorPlanImage]);

  useEffect(() => {
    if (!buildingId || !floorId) {
      return;
    }

    let cancelled = false;

    const fetchFloor = async () => {
      setState((previous) => ({ ...previous, status: "loading", error: null }));

      try {
        const [floor, units, models] = await Promise.all([
          loadFloor(buildingId, floorId),
          loadUnits(),
          loadModels(),
        ]);

        if (!cancelled) {
          const enrichedFloor = enrichFloorData(floor, units, models);
          setState({ status: "success", data: enrichedFloor, error: null });
          setUnitLookup(new Map(units.map((u) => [u.id, u])));
          setModelLookup(new Map(models.map((m) => [m.id, m])));
          setUnitLoadError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            status: "error",
            data: null,
            error:
              error instanceof Error
                ? error.message
                : "Unable to load floor plan",
          });
        }
      }
    };

    fetchFloor();

    return () => {
      cancelled = true;
    };
  }, [buildingId, floorId]);

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

  const backHref = useMemo(() => {
    if (!buildingId) {
      return "/masterplan";
    }

    const params = new URLSearchParams();
    const angle = searchParams.get("angle");

    if (angle) {
      params.set("angle", angle);
    }

    if (params.size) {
      return `/building/${buildingId}?${params.toString()}`;
    }

    return `/building/${buildingId}`;
  }, [buildingId, searchParams]);

  const handleUnitSelect = useCallback(
    async (unit: EnrichedUnitHotspot) => {
      const model = modelLookup?.get(unit.tooltip.modelId);

      if (!model) {
        console.warn(
          `Model ${unit.tooltip.modelId} not found for unit ${unit.unitId}`
        );
        return;
      }

      const tourId = await getTourIdForModel(
        unit.tooltip.modelId,
        Array.from(modelLookup?.values() ?? [])
      );

      if (!tourId) {
        console.warn(`No tour available for model ${unit.tooltip.modelId}`);
        return;
      }

      const params = new URLSearchParams();
      params.set("unit", unit.unitId);

      if (buildingId) {
        params.set("building", buildingId);
      }

      if (floorId) {
        params.set("floor", floorId);
      }

      const angle = searchParams.get("angle");

      if (angle) {
        params.set("angle", angle);
      }

      // Store the floor plan location as the back location
      const backParams = new URLSearchParams();
      if (angle) {
        backParams.set("angle", angle);
      }
      const backQuery = backParams.toString();
      const backUrl = backQuery
        ? `/building/${buildingId}/floor/${floorId}?${backQuery}`
        : `/building/${buildingId}/floor/${floorId}`;

      console.log(
        "FloorPlanView: Storing back location for unit tour:",
        backUrl
      );
      setTourBackLocation(backUrl);

      // Navigate to tour without query params
      navigate(`/tour/${tourId}`);
    },
    [
      modelLookup,
      buildingId,
      floorId,
      navigate,
      searchParams,
      setTourBackLocation,
    ]
  );

  const selectedUnit = useMemo(() => {
    if (!state.data || !selectedUnitId) {
      return null;
    }

    return (
      state.data.units.find((unit) => unit.unitId === selectedUnitId) ?? null
    );
  }, [selectedUnitId, state.data]);

  // Check for tour when selected unit changes
  useEffect(() => {
    if (!selectedUnit || !modelLookup) {
      setSelectedUnitTourId(null);
      return;
    }

    let cancelled = false;

    const checkTour = async () => {
      try {
        const tourId = await getTourIdForModel(
          selectedUnit.tooltip.modelId,
          Array.from(modelLookup.values())
        );

        if (!cancelled) {
          console.log(
            `Tour detection for model ${selectedUnit.tooltip.modelId}:`,
            tourId ? `Found tour ${tourId}` : "No tour available"
          );
          setSelectedUnitTourId(tourId);
        }
      } catch (error) {
        console.warn("Error checking for tour:", error);
        if (!cancelled) {
          setSelectedUnitTourId(null);
        }
      }
    };

    checkTour();

    return () => {
      cancelled = true;
    };
  }, [selectedUnit, modelLookup]);

  const hoveredUnit = useMemo(() => {
    if (!state.data || !hoveredUnitId) {
      return null;
    }

    return (
      state.data.units.find((unit) => unit.unitId === hoveredUnitId) ?? null
    );
  }, [hoveredUnitId, state.data]);

  const unitSummary = useMemo(() => {
    if (!state.data) {
      return {
        total: 0,
        available: 0,
        reserved: 0,
        sold: 0,
      };
    }

    return state.data.units.reduce(
      (accumulator, unit) => {
        accumulator.total += 1;

        if (unit.tooltip.availability === "available") {
          accumulator.available += 1;
        } else if (unit.tooltip.availability === "reserved") {
          accumulator.reserved += 1;
        } else if (unit.tooltip.availability === "sold") {
          accumulator.sold += 1;
        }

        return accumulator;
      },
      { total: 0, available: 0, reserved: 0, sold: 0 }
    );
  }, [state.data]);

  const resetHover = () => {
    setHoveredUnitId(null);
  };

  const handleUnitActivate = useCallback(
    (unit: EnrichedUnitHotspot) => {
      setSelectedUnitId(unit.unitId);
      setHoveredUnitId(unit.unitId);

      // Calculate zoom to focus on the unit
      if (!containerRef.current) return;

      const bounds = getPolygonBounds(unit.shape);
      const containerRect = containerRef.current.getBoundingClientRect();

      // Calculate how much we need to zoom to fit the unit nicely
      const padding = 100; // padding in viewBox units
      const unitWidth = bounds.maxX - bounds.minX + padding * 2;
      const unitHeight = bounds.maxY - bounds.minY + padding * 2;

      // Calculate zoom level based on container and viewBox dimensions
      const zoomX = containerRect.width / unitWidth;
      const zoomY = containerRect.height / unitHeight;
      const targetZoom = Math.min(zoomX, zoomY, 3); // Cap at 3x zoom

      // Calculate the center of the unit in viewBox coordinates
      const unitCenterX = bounds.centerX;
      const unitCenterY = bounds.centerY;

      // Convert viewBox coordinates to screen coordinates
      // The viewBox is scaled to fit the container using "xMidYMid slice"
      const viewBoxAspect = VIEWBOX_WIDTH / VIEWBOX_HEIGHT;
      const containerAspect = containerRect.width / containerRect.height;

      let scale: number;
      let offsetX = 0;
      let offsetY = 0;

      if (containerAspect > viewBoxAspect) {
        // Container is wider - viewBox height matches, width is cropped
        scale = containerRect.height / VIEWBOX_HEIGHT;
        offsetX = (containerRect.width - VIEWBOX_WIDTH * scale) / 2;
      } else {
        // Container is taller - viewBox width matches, height is cropped
        scale = containerRect.width / VIEWBOX_WIDTH;
        offsetY = (containerRect.height - VIEWBOX_HEIGHT * scale) / 2;
      }

      // Convert unit center from viewBox to screen coordinates (before zoom)
      const screenCenterX = unitCenterX * scale + offsetX;
      const screenCenterY = unitCenterY * scale + offsetY;

      // Calculate pan offset to center the unit
      // After zooming, we want the unit center to be at the screen center
      const panX = (containerRect.width / 2 - screenCenterX) * targetZoom;
      const panY = (containerRect.height / 2 - screenCenterY) * targetZoom;

      // Apply zoom and pan
      zoomTo(targetZoom);
      panTo({ x: panX, y: panY });
    },
    [zoomTo, panTo]
  );

  const hoveredTooltipFrame = useMemo(() => {
    if (!hoveredUnit) {
      return null;
    }

    const bounds = getPolygonBounds(hoveredUnit.shape);
    const width = 220;
    const height = 120;
    let x = bounds.centerX - width / 2;
    let y = bounds.minY - height - 16;

    if (x < 12) {
      x = 12;
    }

    if (x + width > VIEWBOX_WIDTH - 12) {
      x = VIEWBOX_WIDTH - width - 12;
    }

    if (y < 12) {
      y = Math.min(bounds.maxY + 16, VIEWBOX_HEIGHT - height - 12);
    }

    return { x, y, width, height };
  }, [hoveredUnit]);

  const statusMessage = useMemo(() => {
    if (state.status === "loading") {
      return "Loading floor hotspots...";
    }

    if (state.status === "error") {
      return state.error ?? "Unable to load floor plan.";
    }

    if (!state.data || state.data.units.length === 0) {
      return "No units available on this floor yet.";
    }

    return "Hover units to preview details, then select for full information.";
  }, [state.data, state.error, state.status]);

  const selectedUnitRecord = useMemo(() => {
    if (!selectedUnitId || !unitLookup) {
      return null;
    }

    return unitLookup.get(selectedUnitId) ?? null;
  }, [selectedUnitId, unitLookup]);

  const selectedUnitModel = useMemo(() => {
    if (!selectedUnit) {
      return null;
    }

    return selectedUnit.tooltip.modelTitle ?? selectedUnit.tooltip.modelId;
  }, [selectedUnit]);

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
        <div
          className="absolute inset-0 z-10"
          style={{
            transform: `scale(${zoomPanState.zoom}) translate(${
              zoomPanState.pan.x / zoomPanState.zoom
            }px, ${zoomPanState.pan.y / zoomPanState.zoom}px)`,
            transformOrigin: "center center",
            transition: zoomPanState.isInteracting
              ? "none"
              : "transform 0.3s ease-out",
          }}
        >
          <div className="relative h-full w-full">
            {/* Floor plan image */}
            {state.data?.floorPlanImage && !imageError ? (
              <img
                src={state.data.floorPlanImage}
                alt={`Floor ${state.data.floorNumber} plan`}
                className="pointer-events-none absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 flex items-center justify-center">
                <span className="text-slate-400 text-sm">
                  Floor plan imagery unavailable
                </span>
              </div>
            )}

            {/* SVG overlay for unit hotspots */}
            <svg
              className="pointer-events-auto absolute inset-0 h-full w-full"
              viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
              preserveAspectRatio="xMidYMid slice"
              role="img"
              aria-label={
                state.data
                  ? `Floor ${state.data.floorNumber} plan with interactive unit hotspots`
                  : "Floor plan"
              }
            >
              {state.data?.units.map((unit) => {
                const isHovered = hoveredUnitId === unit.unitId;
                const isSelected = selectedUnitId === unit.unitId;
                const hasHoveredUnit = hoveredUnitId !== null;
                const hasSelectedUnit = selectedUnitId !== null;

                const polygonClassName = (() => {
                  if (isSelected) {
                    return "fill-transparent stroke-emerald-200 stroke-[3px]";
                  }

                  if (hasSelectedUnit) {
                    // When a unit is selected, dim all other units
                    return isHovered
                      ? "fill-slate-900/40 stroke-emerald-200/30"
                      : "fill-slate-950/60 stroke-slate-700/30";
                  }

                  if (isHovered) {
                    return "fill-emerald-400/35 stroke-emerald-100";
                  }

                  return hasHoveredUnit
                    ? "fill-slate-950/50 stroke-emerald-200/50"
                    : "fill-transparent stroke-emerald-200/50";
                })();

                return (
                  <g
                    key={unit.unitId}
                    className="cursor-pointer transition-transform duration-500 ease-out focus:outline-none"
                    onClick={() => handleUnitActivate(unit)}
                    onMouseEnter={() => setHoveredUnitId(unit.unitId)}
                    onMouseLeave={resetHover}
                    onFocus={() => {
                      setHoveredUnitId(unit.unitId);
                    }}
                    onBlur={resetHover}
                    onKeyDown={(event) =>
                      handleKeyActivation(event, () => handleUnitActivate(unit))
                    }
                    role="button"
                    tabIndex={0}
                    aria-label={`Inspect unit ${unit.unitId}`}
                  >
                    <polygon
                      points={toPointString(unit.shape)}
                      className={`${polygonClassName} stroke-[2px] transition-colors duration-300`}
                      vectorEffect="non-scaling-stroke"
                    />
                  </g>
                );
              })}
              <AnimatePresence>
                {hoveredUnit && hoveredTooltipFrame ? (
                  <motion.g
                    key={hoveredUnit.unitId}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <foreignObject
                      x={hoveredTooltipFrame.x}
                      y={hoveredTooltipFrame.y}
                      width={hoveredTooltipFrame.width}
                      height={hoveredTooltipFrame.height}
                      pointerEvents="none"
                    >
                      <Tooltip
                        title={hoveredUnit.tooltip.modelId}
                        content={`${hoveredUnit.tooltip.areaM2} m^2 · ${hoveredUnit.tooltip.bedrooms} bed · ${hoveredUnit.tooltip.bathrooms} bath`}
                        footer={`Status: ${hoveredUnit.tooltip.availability}`}
                      />
                    </foreignObject>
                  </motion.g>
                ) : null}
              </AnimatePresence>
            </svg>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-0 z-30 flex flex-col justify-between p-lg sm:p-xl">
          {/* Gradient overlays for readability */}
          <div className="pointer-events-none absolute inset-0 h-1/3 bg-gradient-to-b from-slate-950/70 to-transparent" />
          <div className="pointer-events-none absolute bottom-0 inset-x-0 h-1/4 bg-gradient-to-t from-slate-950/70 to-transparent" />

          {/* Header */}
          <div className="flex flex-col gap-lg sm:flex-row sm:items-start sm:justify-between z-40">
            <div className="pointer-events-auto flex flex-col gap-md">
              <BackNav label="Building" to={backHref} />
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.45em] text-text-accent">
                  ({state.data?.buildingId ?? "Building ID"}){" "}
                  {state.data?.buildingName ?? "Building"}
                </span>
                <h1 className="mt-sm text-heading-1 font-bold">
                  {state.data
                    ? `Floor ${state.data.floorNumber}`
                    : "Floor Plan"}
                </h1>
                <p className="mt-sm max-w-xl text-sm text-text-primary">
                  Explore the full floor layout. Hover units to preview key
                  stats, then select a unit to focus its outline and open the
                  quick details panel with a direct link to the 360 tour.
                </p>
              </div>
            </div>
            {state.data ? (
              <div className="pointer-events-auto flex flex-col items-end gap-md">
                <div className="flex flex-col items-end gap-sm rounded-card border border-border-muted bg-surface-elevated/55 px-lg py-md text-xs uppercase tracking-[0.45em] text-text-secondary">
                  <span>Total units · {unitSummary.total}</span>
                  <span>Available · {unitSummary.available}</span>
                  <span>Reserved · {unitSummary.reserved}</span>
                  <span>Sold · {unitSummary.sold}</span>
                </div>
                <BrowseModelsButton
                  isOpen={showSearch}
                  onClick={() => setShowSearch(!showSearch)}
                />
              </div>
            ) : null}
          </div>
          {statusMessage ? (
            <div className="pointer-events-none z-40 self-center rounded-badge bg-surface-elevated/85 px-lg py-sm text-xs font-semibold uppercase tracking-[0.45em] text-text-secondary shadow-elevated">
              {statusMessage}
            </div>
          ) : null}
        </div>
        {/* Status Panel */}
        {selectedUnit ? (
          <div className="fixed inset-0 z-40 flex items-center justify-end transition-opacity">
            <div className="relative mr-md w-1/5 max-w-sm rounded-card border border-border bg-surface-elevated/90 p-lg text-sm shadow-modal">
              <button
                type="button"
                onClick={() => {
                  setSelectedUnitId(null);
                  setHoveredUnitId(null);
                  resetZoom();
                }}
                className="absolute right-md top-md rounded-badge border border-border bg-surface-base/60 px-sm py-xs text-caption uppercase tracking-[0.25em] text-text-tertiary transition-hover hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                aria-label="Close unit details"
              >
                Close
              </button>
              <p className="text-caption uppercase tracking-[0.35em] text-primary">
                {selectedUnit.tooltip.modelId}
              </p>
              <h2 className="mt-sm text-heading-3 font-semibold text-text-primary">
                {selectedUnitModel}
              </h2>
              <p className="mt-xs text-xs uppercase tracking-[0.3em] text-text-tertiary">
                Unit · {selectedUnit.unitId}
              </p>
              <dl className="mt-lg space-y-sm text-base text-text-secondary">
                <div className="flex items-center justify-between">
                  <dt className="text-text-tertiary">Area</dt>
                  <dd>{selectedUnit.tooltip.areaM2} m^2</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-text-tertiary">Bedrooms</dt>
                  <dd>{selectedUnit.tooltip.bedrooms}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-text-tertiary">Bathrooms</dt>
                  <dd>{selectedUnit.tooltip.bathrooms}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-text-tertiary">Status</dt>
                  <dd>{selectedUnit.tooltip.availability}</dd>
                </div>
                {selectedUnit.tooltip.price ? (
                  <div className="flex items-center justify-between">
                    <dt className="text-text-tertiary">Price</dt>
                    <dd>${selectedUnit.tooltip.price.toLocaleString()}</dd>
                  </div>
                ) : selectedUnitRecord?.price ? (
                  <div className="flex items-center justify-between">
                    <dt className="text-text-tertiary">Price</dt>
                    <dd>${selectedUnitRecord.price.toLocaleString()}</dd>
                  </div>
                ) : null}
              </dl>
              {unitLoadError ? (
                <p className="mt-md text-xs text-error">{unitLoadError}</p>
              ) : null}
              <button
                type="button"
                className="mt-lg w-full rounded-badge bg-primary px-lg py-sm text-sm font-semibold uppercase tracking-[0.3em] text-text-inverse transition-hover hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring disabled:cursor-not-allowed disabled:bg-surface-base disabled:text-text-disabled disabled:hover:bg-surface-base disabled:opacity-60"
                onClick={() => {
                  if (selectedUnitTourId) {
                    handleUnitSelect(selectedUnit);
                  }
                }}
                disabled={!selectedUnitTourId}
                title={
                  selectedUnitTourId
                    ? "View virtual tour of this unit"
                    : "No virtual tour available for this unit"
                }
              >
                {selectedUnitTourId ? "View 360 Tour" : "Tour Not Available"}
              </button>
            </div>
          </div>
        ) : null}

        {/* Search Panel Overlay */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              className="absolute inset-0 z-50 flex items-start justify-end bg-slate-950/40 backdrop-blur-sm"
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
                      contextParams={{
                        building: buildingId,
                        floor: floorId,
                        angle: searchParams.get("angle") ?? undefined,
                      }}
                      backLocation={(() => {
                        const angle = searchParams.get("angle");
                        const params = angle ? `?angle=${angle}` : "";
                        return `/building/${buildingId}/floor/${floorId}${params}`;
                      })()}
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
