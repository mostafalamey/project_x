import { AnimatePresence, motion } from "framer-motion";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useNavigate } from "react-router-dom";

import { loadLandmarks } from "../data/loaders";
import type { Landmark } from "../data/types";

const MAP_VIEWBOX = { width: 960, height: 600 };
const MAP_IMAGE = "/data/map.png";
const PATH_CURVE_OFFSET = 140;

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

const pointFromCoords = (coords: Landmark["coords"]) => {
  if (Array.isArray(coords)) {
    return null;
  }

  return coords;
};

const polygonFromCoords = (coords: Landmark["coords"]) => {
  if (!Array.isArray(coords)) {
    return null;
  }

  const points: Array<{ x: number; y: number }> = [];

  for (let index = 0; index < coords.length; index += 2) {
    const x = coords[index];
    const y = coords[index + 1];

    if (typeof x === "number" && typeof y === "number") {
      points.push({ x, y });
    }
  }

  return points;
};

const toPointString = (points: Array<{ x: number; y: number }>) =>
  points.map((point) => `${point.x},${point.y}`).join(" ");

const computeCentroid = (points: Array<{ x: number; y: number }>) => {
  if (!points.length) {
    return null;
  }

  const total = points.reduce(
    (accumulator, point) => ({
      x: accumulator.x + point.x,
      y: accumulator.y + point.y,
    }),
    { x: 0, y: 0 }
  );

  return {
    x: total.x / points.length,
    y: total.y / points.length,
  };
};

const getLandmarkPoint = (landmark: Landmark) => {
  const point = pointFromCoords(landmark.coords);
  if (point) {
    return point;
  }

  const polygon = polygonFromCoords(landmark.coords);
  if (polygon?.length) {
    return computeCentroid(polygon);
  }

  return null;
};

const labelOffset = (value: number) => value - 12;

const handleKeyActivation = (
  event: KeyboardEvent<SVGElement>,
  handler: () => void
) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    handler();
  }
};

export const MapView = () => {
  const navigate = useNavigate();
  const [landmarkState, setLandmarkState] =
    useState<FetchState<Landmark[]>>(initialState);
  const [activeLandmarkId, setActiveLandmarkId] = useState<string | null>(null);
  const [hoveredLandmarkId, setHoveredLandmarkId] = useState<string | null>(
    null
  );
  const [mapImageError, setMapImageError] = useState(false);
  const [pendingMasterplan, setPendingMasterplan] = useState(false);
  const navigateTimerRef = useRef<number | null>(null);

  const clearSelection = () => {
    window.clearTimeout(navigateTimerRef.current ?? undefined);
    navigateTimerRef.current = null;
    setActiveLandmarkId(null);
    setHoveredLandmarkId(null);
    setPendingMasterplan(false);
  };

  useEffect(() => {
    let cancelled = false;

    const fetchLandmarks = async () => {
      setLandmarkState((previous) => ({
        ...previous,
        status: "loading",
        error: null,
      }));

      try {
        const data = await loadLandmarks();

        if (!cancelled) {
          setLandmarkState({ status: "success", data, error: null });
        }
      } catch (error) {
        if (!cancelled) {
          setLandmarkState({
            status: "error",
            data: null,
            error:
              error instanceof Error
                ? error.message
                : "Unable to load landmarks",
          });
        }
      }
    };

    fetchLandmarks();

    return () => {
      cancelled = true;
    };
  }, []);

  const complexLandmark = useMemo(
    () => landmarkState.data?.find((item) => item.type === "complex"),
    [landmarkState.data]
  );

  const complexPoint = useMemo(
    () => (complexLandmark ? getLandmarkPoint(complexLandmark) : null),
    [complexLandmark]
  );

  useEffect(() => {
    window.clearTimeout(navigateTimerRef.current ?? undefined);

    if (!pendingMasterplan) {
      return () => {
        window.clearTimeout(navigateTimerRef.current ?? undefined);
      };
    }

    navigateTimerRef.current = window.setTimeout(() => {
      navigate("/masterplan");
    }, 900);

    return () => {
      window.clearTimeout(navigateTimerRef.current ?? undefined);
    };
  }, [navigate, pendingMasterplan]);

  useEffect(
    () => () => {
      window.clearTimeout(navigateTimerRef.current ?? undefined);
    },
    []
  );

  const activeLandmark = useMemo(
    () =>
      landmarkState.data?.find((item) => item.id === activeLandmarkId) ?? null,
    [activeLandmarkId, landmarkState.data]
  );

  const hoveredLandmark = useMemo(
    () =>
      landmarkState.data?.find((item) => item.id === hoveredLandmarkId) ?? null,
    [hoveredLandmarkId, landmarkState.data]
  );

  const pathDefinition = useMemo(() => {
    if (!complexLandmark || !complexPoint || !activeLandmark) {
      return null;
    }

    if (activeLandmark.type === "complex") {
      return null;
    }

    const targetPoint = getLandmarkPoint(activeLandmark);

    if (!targetPoint) {
      return null;
    }

    const controlX = (complexPoint.x + targetPoint.x) / 2;
    const controlY =
      Math.min(complexPoint.y, targetPoint.y) - PATH_CURVE_OFFSET;

    return `M ${complexPoint.x} ${complexPoint.y} Q ${controlX} ${controlY} ${targetPoint.x} ${targetPoint.y}`;
  }, [activeLandmark, complexLandmark, complexPoint]);

  const handleHotspotActivate = (landmark: Landmark) => {
    setActiveLandmarkId(landmark.id);
    setPendingMasterplan(landmark.type === "complex");
  };

  const statusMessage = useMemo(() => {
    if (landmarkState.status === "loading") {
      return "Loading landmark hotspots...";
    }

    if (landmarkState.status === "error") {
      return landmarkState.error ?? "Unable to display landmarks right now.";
    }

    if (pendingMasterplan && complexLandmark) {
      return `Opening ${complexLandmark.name} master plan...`;
    }

    if (activeLandmark && complexLandmark) {
      if (activeLandmark.type === "complex") {
        return `Select confirmed. Preparing master plan for ${complexLandmark.name}.`;
      }

      return `Path engaged: ${complexLandmark.name} → ${activeLandmark.name}.`;
    }

    if (hoveredLandmark) {
      return `Previewing ${hoveredLandmark.name}. Click to trace the route.`;
    }

    return "Hover or tap a hotspot to explore the Aurora campus.";
  }, [
    activeLandmark,
    complexLandmark,
    hoveredLandmark,
    landmarkState,
    pendingMasterplan,
  ]);

  const handlePointerEnter = (landmarkId: string) => {
    setHoveredLandmarkId(landmarkId);
  };

  const handlePointerLeave = (landmarkId: string) => {
    setHoveredLandmarkId((previous) =>
      previous === landmarkId ? null : previous
    );
  };

  const handleBackgroundPointerDown = (
    event: ReactPointerEvent<SVGSVGElement>
  ) => {
    if (event.target === event.currentTarget) {
      clearSelection();
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      <motion.div
        className="absolute inset-0"
        initial={false}
        animate={{
          scale: pendingMasterplan ? 1.35 : 1,
        }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        style={{ originX: 0.5, originY: 0.5 }}
      >
        {!mapImageError ? (
          <img
            alt="Aurora complex campus map"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
            src={MAP_IMAGE}
            onError={() => setMapImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-950" />
        )}
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox={`0 0 ${MAP_VIEWBOX.width} ${MAP_VIEWBOX.height}`}
          preserveAspectRatio="xMidYMid meet"
          role="presentation"
          onPointerDown={handleBackgroundPointerDown}
        >
          <defs>
            <marker
              id="landmark-arrow"
              markerWidth="10"
              markerHeight="10"
              refX="5"
              refY="5"
              orient="auto"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="rgb(16 185 129, 0.85)" />
            </marker>
          </defs>
          <AnimatePresence>
            {pathDefinition ? (
              <motion.path
                key={pathDefinition}
                d={pathDefinition}
                stroke="rgb(16 185 129)"
                strokeWidth={4}
                strokeLinecap="round"
                fill="none"
                markerEnd="url(#landmark-arrow)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                exit={{ pathLength: 0, opacity: 0 }}
                transition={{ duration: 0.9, ease: "easeInOut" }}
                style={{ pointerEvents: "none" }}
              />
            ) : null}
          </AnimatePresence>
          {landmarkState.data?.map((landmark) => {
            const point = pointFromCoords(landmark.coords);
            const polygon = polygonFromCoords(landmark.coords);
            const anchorPoint = point ?? computeCentroid(polygon ?? []);
            const isActive = activeLandmarkId === landmark.id;
            const isHovered = hoveredLandmarkId === landmark.id;
            const accentClass =
              landmark.type === "complex"
                ? "fill-emerald-400/30 stroke-emerald-200"
                : "fill-emerald-400/15 stroke-emerald-200";
            const activeClass =
              landmark.type === "complex"
                ? "fill-emerald-400/40 stroke-emerald-100"
                : "fill-emerald-400/25 stroke-emerald-200";
            const activate = () => handleHotspotActivate(landmark);
            const onPointerEnter = () => handlePointerEnter(landmark.id);
            const onPointerLeave = () => handlePointerLeave(landmark.id);

            if (point) {
              return (
                <motion.g
                  key={landmark.id}
                  className="cursor-pointer focus:outline-none focus-visible:outline-none"
                  onClick={(event) => {
                    event.stopPropagation();
                    activate();
                  }}
                  onPointerDown={(event) => {
                    event.stopPropagation();
                    activate();
                  }}
                  onMouseEnter={onPointerEnter}
                  onMouseLeave={onPointerLeave}
                  onFocus={onPointerEnter}
                  onBlur={onPointerLeave}
                  onKeyDown={(event) => handleKeyActivation(event, activate)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Select ${landmark.name}`}
                  initial={false}
                  animate={{
                    scale: isActive || isHovered ? 1.12 : 1,
                  }}
                  transition={{ type: "spring", stiffness: 280, damping: 22 }}
                >
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={18}
                    className={`stroke-2 transition ${
                      isActive || isHovered ? activeClass : accentClass
                    }`}
                  />
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={6}
                    className="fill-emerald-200"
                  />
                  <AnimatePresence>
                    {anchorPoint && (isActive || isHovered) ? (
                      <motion.g
                        key={`tooltip-${landmark.id}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                      >
                        <rect
                          x={anchorPoint.x + 16}
                          y={anchorPoint.y - 48}
                          rx={10}
                          ry={10}
                          width={180}
                          height={44}
                          className="fill-slate-950/85 stroke stroke-emerald-400/40"
                        />
                        <text
                          x={anchorPoint.x + 26}
                          y={anchorPoint.y - 26}
                          className="fill-emerald-200 text-[11px] font-semibold uppercase tracking-[0.3em]"
                        >
                          {landmark.name}
                        </text>
                        <text
                          x={anchorPoint.x + 26}
                          y={anchorPoint.y - 12}
                          className="fill-slate-300 text-[11px]"
                        >
                          {landmark.type === "complex"
                            ? "Complex gateway"
                            : "Point of interest"}
                        </text>
                      </motion.g>
                    ) : null}
                  </AnimatePresence>
                </motion.g>
              );
            }

            if (polygon && polygon.length) {
              return (
                <motion.g
                  key={landmark.id}
                  className="cursor-pointer focus:outline-none focus-visible:outline-none"
                  onClick={(event) => {
                    event.stopPropagation();
                    activate();
                  }}
                  onPointerDown={(event) => {
                    event.stopPropagation();
                    activate();
                  }}
                  onMouseEnter={onPointerEnter}
                  onMouseLeave={onPointerLeave}
                  onFocus={onPointerEnter}
                  onBlur={onPointerLeave}
                  onKeyDown={(event) => handleKeyActivation(event, activate)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Select ${landmark.name}`}
                  initial={false}
                  animate={{
                    opacity: isActive || isHovered ? 1 : 0.8,
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <polygon
                    points={toPointString(polygon)}
                    className={`stroke-2 transition ${
                      isActive || isHovered ? activeClass : accentClass
                    }`}
                  />
                  <text
                    x={polygon[0].x}
                    y={labelOffset(polygon[0].y)}
                    className="fill-slate-100 text-[10px] font-semibold uppercase tracking-[0.32em]"
                  >
                    {landmark.name}
                  </text>
                  <AnimatePresence>
                    {anchorPoint && (isActive || isHovered) ? (
                      <motion.g
                        key={`tooltip-${landmark.id}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                      >
                        <rect
                          x={anchorPoint.x + 20}
                          y={anchorPoint.y - 52}
                          rx={10}
                          ry={10}
                          width={200}
                          height={48}
                          className="fill-slate-950/85 stroke stroke-emerald-400/40"
                        />
                        <text
                          x={anchorPoint.x + 30}
                          y={anchorPoint.y - 28}
                          className="fill-emerald-200 text-[11px] font-semibold uppercase tracking-[0.3em]"
                        >
                          {landmark.name}
                        </text>
                        <text
                          x={anchorPoint.x + 30}
                          y={anchorPoint.y - 12}
                          className="fill-slate-300 text-[11px]"
                        >
                          {"Navigate to complex to explore deeper"}
                        </text>
                      </motion.g>
                    ) : null}
                  </AnimatePresence>
                </motion.g>
              );
            }

            return null;
          })}
        </svg>
      </motion.div>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950/70 via-transparent to-slate-950/80" />

      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-10">
        <div className="flex w-full max-w-xl flex-col gap-4">
          <div className="pointer-events-auto space-y-4">
            <span className="text-xs font-semibold uppercase tracking-[0.5em] text-emerald-300">
              Aurora Complex
            </span>
            <h1 className="text-4xl font-bold sm:text-5xl">
              Immersive Map View
            </h1>
            <p className="text-sm text-slate-200">
              Discover the campus from a bird&apos;s-eye perspective. Hover over
              a hotspot to learn more, trace animated routes from the gateway to
              nearby points of interest, and enter the master plan through the
              complex marker.
            </p>
          </div>
        </div>
        <div className="flex w-full items-center justify-center">
          <motion.div
            className="pointer-events-auto rounded-full bg-slate-950/80 px-6 py-3 text-xs font-semibold uppercase tracking-[0.4em] text-slate-200 shadow-lg shadow-slate-950/60"
            key={statusMessage}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
          >
            {statusMessage}
          </motion.div>
        </div>
      </div>
    </div>
  );
};
