import { AnimatePresence, motion } from "framer-motion";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { BackNav } from "../components/BackNav";
import { loadBuilding } from "../data/loaders";
import type { Building, BuildingFloor, Polygon } from "../data/types";

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
  const [state, setState] = useState<FetchState<Building>>(initialState);
  const [highlightedFloorId, setHighlightedFloorId] = useState<string | null>(
    searchParams.get("floor")
  );
  const [hoveredFloorId, setHoveredFloorId] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [zoomingFloorId, setZoomingFloorId] = useState<string | null>(null);
  const transitionTimerRef = useRef<number | null>(null);

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

  const handleFloorNavigate = (floorId: string) => {
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

    if (transitionTimerRef.current !== null) {
      window.clearTimeout(transitionTimerRef.current);
    }

    transitionTimerRef.current = window.setTimeout(() => {
      navigate(`/building/${buildingId}/floor/${floorId}?${params.toString()}`);
    }, ZOOM_DELAY_MS);
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      <motion.div
        className="pointer-events-none absolute inset-0"
        initial={false}
        animate={{
          opacity: imageError ? 0.15 : 1,
          scale: zoomingFloorId ? 1.04 : 1,
        }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        {state.data?.elevationImage && !imageError ? (
          <motion.img
            key={state.data.elevationImage}
            src={state.data.elevationImage}
            alt={state.data.name ?? "Building elevation"}
            className="pointer-events-none h-full w-full object-cover"
            onError={() => setImageError(true)}
            initial={{ opacity: 0.4, scale: 1.02 }}
            animate={{ opacity: 1, scale: zoomingFloorId ? 1.06 : 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900" />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-slate-950/60" />
      </motion.div>

      <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-8 sm:p-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="pointer-events-auto flex flex-col gap-4">
            <BackNav
              label="Master plan"
              to={
                masterPlanAngle
                  ? `/masterplan?angle=${masterPlanAngle}`
                  : "/masterplan"
              }
            />
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.45em] text-emerald-300">
                {state.data?.id ?? "Building"}
              </span>
              <h1 className="mt-3 text-4xl font-bold sm:text-5xl">
                {state.data?.name ?? "Building Elevation"}
              </h1>
              <p className="mt-3 max-w-xl text-sm text-slate-200">
                Hover floors to preview stats, then click to dive into the plan.
                The elevation stays immersive while overlays float above the
                imagery.
              </p>
            </div>
          </div>
          {state.data ? (
            <div className="pointer-events-auto flex flex-col items-end gap-2 rounded-3xl border border-slate-700/60 bg-slate-900/50 px-6 py-4 text-xs uppercase tracking-[0.45em] text-slate-200">
              <span>Total floors · {sortedFloors.length}</span>
              <span>Hotspot floors · {hotspotFloorCount}</span>
            </div>
          ) : null}
        </div>

        <AnimatePresence>
          {statusMessage ? (
            <motion.div
              key={statusMessage}
              className="pointer-events-none self-center rounded-full bg-slate-950/85 px-6 py-3 text-xs font-semibold uppercase tracking-[0.45em] text-slate-200 shadow-lg shadow-slate-950/60"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              {statusMessage}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="absolute inset-0 z-10">
        <svg
          className="pointer-events-auto h-full w-full"
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
            const fillClass =
              isHovered || isHighlighted || isZooming
                ? "fill-emerald-400/30 stroke-emerald-200"
                : "fill-emerald-400/12 stroke-emerald-200/50";

            const centroid = centroidOfPolygons(polygons);

            return (
              <g
                key={floor.id}
                className="cursor-pointer focus:outline-none focus-visible:outline-none"
                onFocus={() => setHoveredFloorId(floor.id)}
                onBlur={() =>
                  setHoveredFloorId((prev) => (prev === floor.id ? null : prev))
                }
                onMouseEnter={() => setHoveredFloorId(floor.id)}
                onMouseLeave={() =>
                  setHoveredFloorId((prev) => (prev === floor.id ? null : prev))
                }
                onClick={() => handleFloorNavigate(floor.id)}
                onKeyDown={(event) =>
                  handleKeyActivation(event, () =>
                    handleFloorNavigate(floor.id)
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
                    className={`stroke-[1.5] transition ${fillClass}`}
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
      </div>

      <AnimatePresence>
        {tooltipFloor && tooltipPosition ? (
          <motion.div
            key={tooltipFloor.id}
            className="pointer-events-none absolute z-30 max-w-xs -translate-x-1/2 -translate-y-[120%] rounded-2xl border border-emerald-400/40 bg-slate-900/85 px-5 py-4 text-sm text-slate-200 shadow-xl shadow-emerald-500/20"
            style={tooltipPosition}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.45em] text-emerald-300">
              Floor {tooltipFloor.number}
            </p>
            <p className="mt-2 text-xs text-slate-300">
              Select to open the floor plan view
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};
