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
import {
  deriveTourId,
  enrichFloorData,
  getUnitTourPath,
  type EnrichedFloor,
  type EnrichedUnitHotspot,
} from "../data/enrichment";
import { loadFloor, loadModels, loadUnits } from "../data/loaders";
import type { Model, Unit } from "../data/types";

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

const VIEWBOX_WIDTH = 960;
const VIEWBOX_HEIGHT = 720;
const DEFAULT_TRANSFORM_MATRIX = "matrix(1 0 0 1 0 0)";

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

type ViewportTransform = {
  matrix: string;
  scale: number;
  translateX: number;
  translateY: number;
};

const DEFAULT_VIEWPORT_TRANSFORM: ViewportTransform = {
  matrix: DEFAULT_TRANSFORM_MATRIX,
  scale: 1,
  translateX: 0,
  translateY: 0,
};

const composeMatrix = (
  scale: number,
  translateX: number,
  translateY: number
) => {
  const a = formatMatrixValue(scale);
  const d = formatMatrixValue(scale);
  const e = formatMatrixValue(translateX);
  const f = formatMatrixValue(translateY);

  return `matrix(${a} 0 0 ${d} ${e} ${f})`;
};

const calculateViewportTransform = (
  unit: EnrichedUnitHotspot | null
): ViewportTransform => {
  if (!unit) {
    return DEFAULT_VIEWPORT_TRANSFORM;
  }

  const bounds = getPolygonBounds(unit.shape);
  const width = Math.max(bounds.maxX - bounds.minX, 1);
  const height = Math.max(bounds.maxY - bounds.minY, 1);
  const padding = 80;
  const paddedWidth = width + padding * 2;
  const paddedHeight = height + padding * 2;
  const scale = Math.min(
    VIEWBOX_WIDTH / paddedWidth,
    VIEWBOX_HEIGHT / paddedHeight
  );

  if (!Number.isFinite(scale) || scale <= 1) {
    return DEFAULT_VIEWPORT_TRANSFORM;
  }

  const translateX = clamp(
    VIEWBOX_WIDTH / 2 - scale * bounds.centerX,
    VIEWBOX_WIDTH - scale * VIEWBOX_WIDTH,
    0
  );
  const translateY = clamp(
    VIEWBOX_HEIGHT / 2 - scale * bounds.centerY,
    VIEWBOX_HEIGHT - scale * VIEWBOX_HEIGHT,
    0
  );

  return {
    matrix: composeMatrix(scale, translateX, translateY),
    scale,
    translateX,
    translateY,
  };
};

export const FloorPlanView = () => {
  const { buildingId, floorId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState<FetchState<EnrichedFloor>>(initialState);
  const [hoveredUnitId, setHoveredUnitId] = useState<string | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const isUnitSelected = Boolean(selectedUnitId);
  const [unitLookup, setUnitLookup] = useState<Map<string, Unit> | null>(null);
  const [modelLookup, setModelLookup] = useState<Map<string, Model> | null>(
    null
  );
  const [unitLoadError, setUnitLoadError] = useState<string | null>(null);

  useEffect(() => {
    const planImage = state.data?.planImage;

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
  }, [state.data?.planImage]);

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
    (unit: EnrichedUnitHotspot) => {
      const unitRecord = unitLookup?.get(unit.unitId);
      const model = modelLookup?.get(unit.tooltip.modelId);

      if (!unitRecord || !model) {
        return;
      }

      const tourPath = getUnitTourPath(
        unitRecord,
        Array.from(modelLookup?.values() ?? [])
      );
      const tourId = tourPath ? deriveTourId(tourPath) : null;

      if (!tourId) {
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

      navigate(`/tour/${tourId}?${params.toString()}`);
    },
    [unitLookup, modelLookup, buildingId, floorId, navigate, searchParams]
  );

  const selectedUnit = useMemo(() => {
    if (!state.data || !selectedUnitId) {
      return null;
    }

    return (
      state.data.units.find((unit) => unit.unitId === selectedUnitId) ?? null
    );
  }, [selectedUnitId, state.data]);

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

        if (unit.tooltip.availability === "Available") {
          accumulator.available += 1;
        } else if (unit.tooltip.availability === "Reserved") {
          accumulator.reserved += 1;
        } else if (unit.tooltip.availability === "Sold") {
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

  const handleUnitActivate = useCallback((unit: EnrichedUnitHotspot) => {
    setSelectedUnitId(unit.unitId);
    setHoveredUnitId(unit.unitId);
  }, []);

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

  const viewportTransform = useMemo(
    () => calculateViewportTransform(selectedUnit),
    [selectedUnit]
  );

  const [animatedTransform, setAnimatedTransform] = useState<ViewportTransform>(
    DEFAULT_VIEWPORT_TRANSFORM
  );
  const animationFrameRef = useRef<number | null>(null);
  const animatedTransformRef = useRef<ViewportTransform>(
    DEFAULT_VIEWPORT_TRANSFORM
  );

  useEffect(() => {
    animatedTransformRef.current = animatedTransform;
  }, [animatedTransform]);

  useEffect(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    const start = animatedTransformRef.current;
    const end = viewportTransform;

    const deltaScale = end.scale - start.scale;
    const deltaX = end.translateX - start.translateX;
    const deltaY = end.translateY - start.translateY;

    const isNoOp =
      Math.abs(deltaScale) < 0.001 &&
      Math.abs(deltaX) < 0.5 &&
      Math.abs(deltaY) < 0.5;

    if (isNoOp) {
      setAnimatedTransform(end);
      animatedTransformRef.current = end;
      return;
    }

    const duration = 600;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = clamp(elapsed / duration, 0, 1);
      const eased = ease(progress);

      const scale = start.scale + deltaScale * eased;
      const translateX = start.translateX + deltaX * eased;
      const translateY = start.translateY + deltaY * eased;

      const next: ViewportTransform = {
        scale,
        translateX,
        translateY,
        matrix: composeMatrix(scale, translateX, translateY),
      };

      setAnimatedTransform(next);
      animatedTransformRef.current = next;

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(tick);
      }
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [viewportTransform]);

  const tooltipScale =
    animatedTransform.scale > 1 ? animatedTransform.scale : 1;

  const selectedUnitRecord = useMemo(() => {
    if (!selectedUnitId || !unitLookup) {
      return null;
    }

    return unitLookup.get(selectedUnitId) ?? null;
  }, [selectedUnitId, unitLookup]);

  const selectedUnitTourId = useMemo(() => {
    if (!selectedUnitRecord || !modelLookup) {
      return null;
    }

    const tourPath = getUnitTourPath(
      selectedUnitRecord,
      Array.from(modelLookup.values())
    );
    return tourPath ? deriveTourId(tourPath) : null;
  }, [selectedUnitRecord, modelLookup]);

  const selectedUnitModel = useMemo(() => {
    if (!selectedUnit) {
      return null;
    }

    return selectedUnit.tooltip.modelId ?? selectedUnit.unitId;
  }, [selectedUnit]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="absolute inset-0 z-10">
        <div className="relative h-full w-full">
          <svg
            className="pointer-events-auto h-full w-full"
            viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
            preserveAspectRatio="xMidYMid slice"
            role="img"
            aria-label={
              state.data
                ? `Floor ${state.data.number} plan with interactive unit hotspots`
                : "Floor plan"
            }
          >
            <g transform={animatedTransform.matrix}>
              {state.data?.planImage && !imageError ? (
                <image
                  href={state.data.planImage}
                  width={VIEWBOX_WIDTH}
                  height={VIEWBOX_HEIGHT}
                  preserveAspectRatio="xMidYMid slice"
                  aria-label={
                    state.data
                      ? `Floor ${state.data.number} plan image`
                      : "Floor plan"
                  }
                />
              ) : (
                <g>
                  <rect
                    width={VIEWBOX_WIDTH}
                    height={VIEWBOX_HEIGHT}
                    fill="url(#plan-placeholder-gradient)"
                  />
                  <text
                    x={VIEWBOX_WIDTH / 2}
                    y={VIEWBOX_HEIGHT / 2}
                    textAnchor="middle"
                    className="fill-slate-400 text-sm"
                  >
                    Floor plan imagery unavailable
                  </text>
                  <defs>
                    <linearGradient
                      id="plan-placeholder-gradient"
                      x1="0%"
                      x2="100%"
                      y1="0%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#0f172a" />
                      <stop offset="100%" stopColor="#020617" />
                    </linearGradient>
                  </defs>
                </g>
              )}
              {state.data?.units.map((unit) => {
                const isHovered = hoveredUnitId === unit.unitId;
                const isSelected = selectedUnitId === unit.unitId;
                const bounds = getPolygonBounds(unit.shape);
                const transform = isSelected
                  ? `translate(${bounds.centerX} ${
                      bounds.centerY
                    }) scale(1.05) translate(${-bounds.centerX} ${-bounds.centerY})`
                  : undefined;
                const polygonClassName = (() => {
                  if (isSelected) {
                    return "fill-transparent stroke-emerald-200";
                  }

                  if (isUnitSelected) {
                    return isHovered
                      ? "fill-slate-900/60 stroke-emerald-200/40"
                      : "fill-slate-950/80 stroke-slate-700/70";
                  }

                  return isHovered
                    ? "fill-emerald-400/35 stroke-emerald-100"
                    : "fill-emerald-400/18 stroke-emerald-200/70";
                })();

                return (
                  <g
                    key={unit.unitId}
                    className="cursor-pointer transition-transform duration-500 ease-out focus:outline-none"
                    transform={transform}
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
                      className={`${polygonClassName} stroke-[3px] transition-colors duration-300`}
                      vectorEffect="non-scaling-stroke"
                    />
                  </g>
                );
              })}
              {hoveredUnit && hoveredTooltipFrame ? (
                <g transform={`scale(${1 / tooltipScale})`}>
                  <foreignObject
                    x={hoveredTooltipFrame.x * tooltipScale}
                    y={hoveredTooltipFrame.y * tooltipScale}
                    width={hoveredTooltipFrame.width * tooltipScale}
                    height={hoveredTooltipFrame.height * tooltipScale}
                    pointerEvents="none"
                  >
                    <div className="rounded-xl bg-slate-900/85 px-4 py-3 text-left shadow-xl shadow-slate-950/50">
                      <p className="text-[0.65rem] uppercase tracking-[0.35em] text-emerald-300">
                        {hoveredUnit.tooltip.modelId}
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-100">
                        {hoveredUnit.tooltip.areaM2} m^2 ·{" "}
                        {hoveredUnit.tooltip.bedrooms} bed ·{" "}
                        {hoveredUnit.tooltip.bathrooms} bath
                      </p>
                      <p className="mt-1 text-[0.75rem] text-slate-400">
                        Status: {hoveredUnit.tooltip.availability}
                      </p>
                    </div>
                  </foreignObject>
                </g>
              ) : null}
            </g>
          </svg>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950/70 via-transparent to-slate-950/80" />
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 z-30 flex flex-col justify-between p-8 sm:p-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="pointer-events-auto flex flex-col gap-4">
            <BackNav label="Building" to={backHref} />
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.45em] text-emerald-300">
                {state.data?.id ?? floorId ?? "Floor"}
              </span>
              <h1 className="mt-3 text-4xl font-bold sm:text-5xl">
                {state.data ? `Floor ${state.data.number}` : "Floor Plan"}
              </h1>
              <p className="mt-3 max-w-xl text-sm text-slate-200">
                Explore the full floor layout. Hover units to preview key stats,
                then select a unit to focus its outline and open the quick
                details panel with a direct link to the 360 tour.
              </p>
            </div>
          </div>
          {state.data ? (
            <div className="pointer-events-auto flex flex-col items-end gap-2 rounded-3xl border border-slate-700/60 bg-slate-900/55 px-6 py-4 text-xs uppercase tracking-[0.45em] text-slate-200">
              <span>Total units · {unitSummary.total}</span>
              <span>Available · {unitSummary.available}</span>
              <span>Reserved · {unitSummary.reserved}</span>
              <span>Sold · {unitSummary.sold}</span>
            </div>
          ) : null}
        </div>
        {statusMessage ? (
          <div className="pointer-events-none self-center rounded-full bg-slate-950/85 px-6 py-3 text-xs font-semibold uppercase tracking-[0.45em] text-slate-200 shadow-lg shadow-slate-950/60">
            {statusMessage}
          </div>
        ) : null}
      </div>
      {/* Status Panel */}
      {selectedUnit ? (
        <div className="fixed inset-0 z-40 flex items-center justify-end transition-opacity">
          <div className="relative mr-12 w-full max-w-sm rounded-3xl border border-slate-800 bg-slate-950/90 p-8 text-sm shadow-2xl">
            <button
              type="button"
              onClick={() => {
                setSelectedUnitId(null);
                setHoveredUnitId(null);
              }}
              className="absolute right-4 top-4 rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-[0.7rem] uppercase tracking-[0.25em] text-slate-400 transition hover:text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
              aria-label="Close unit details"
            >
              Close
            </button>
            <p className="text-[0.65rem] uppercase tracking-[0.35em] text-emerald-300">
              Unit Selected
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-100">
              {selectedUnitModel}
            </h2>
            <p className="mt-1 text-xs uppercase tracking-[0.3em] text-slate-400">
              Unit ID · {selectedUnit.unitId}
            </p>
            <dl className="mt-6 space-y-3 text-base text-slate-200">
              <div className="flex items-center justify-between">
                <dt className="text-slate-400">Area</dt>
                <dd>{selectedUnit.tooltip.areaM2} m^2</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-400">Bedrooms</dt>
                <dd>{selectedUnit.tooltip.bedrooms}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-400">Bathrooms</dt>
                <dd>{selectedUnit.tooltip.bathrooms}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-400">Status</dt>
                <dd>{selectedUnit.tooltip.availability}</dd>
              </div>
              {selectedUnit.tooltip.price ? (
                <div className="flex items-center justify-between">
                  <dt className="text-slate-400">Price</dt>
                  <dd>${selectedUnit.tooltip.price.toLocaleString()}</dd>
                </div>
              ) : selectedUnitRecord?.price ? (
                <div className="flex items-center justify-between">
                  <dt className="text-slate-400">Price</dt>
                  <dd>${selectedUnitRecord.price.toLocaleString()}</dd>
                </div>
              ) : null}
            </dl>
            {unitLoadError ? (
              <p className="mt-4 text-xs text-red-400">{unitLoadError}</p>
            ) : null}
            <button
              type="button"
              className="mt-8 w-full rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-slate-900 transition hover:bg-emerald-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500 disabled:hover:bg-slate-800"
              onClick={() => handleUnitSelect(selectedUnit)}
              disabled={!selectedUnitTourId}
            >
              {selectedUnitTourId ? "View 360 Tour" : "Tour asset unavailable"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};
