import { AnimatePresence, motion } from "framer-motion";
import { Clock, MapPin } from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { PageHeader } from "../components/PageHeader";
import { useTransitionContext } from "../contexts/TransitionContext";
import { loadLandmarks } from "../data/loaders";
import type { Landmark } from "../data/types";
import { useKeyboard } from "../hooks/useKeyboard";
import { usePointerPan } from "../hooks/usePointerPan";
import { useZoomPan } from "../hooks/useZoomPan";
import { prefersReducedMotion } from "../utils/accessibility";

const MAP_VIEWBOX = { width: 1920, height: 1080 };
const MAP_IMAGE = `${import.meta.env.BASE_URL}data/map.jpeg`;

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
  const { t, i18n } = useTranslation(["pages", "common"]);
  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(i18n.language),
    [i18n.language]
  );
  const { direction } = useTransitionContext();
  const [landmarkState, setLandmarkState] =
    useState<FetchState<Landmark[]>>(initialState);
  const [activeLandmarkId, setActiveLandmarkId] = useState<string | null>(null);

  const reducedMotion = prefersReducedMotion();

  // Check if current language is RTL
  const isRTLMode = i18n.dir() === "rtl";

  // Helper function to get translated landmark text
  const getLandmarkText = (
    landmark: Landmark,
    field: "name" | "description"
  ) => {
    const translationKey = `common:landmarks.${landmark.id}.${field}`;
    const translated = t(translationKey, { defaultValue: "" });
    // If translation exists and is not the key itself, use it; otherwise fall back to original
    return translated && translated !== translationKey
      ? translated
      : landmark[field] || "";
  };

  // Determine animation variants based on direction
  const exitVariant = reducedMotion
    ? { opacity: 0 } // opacity only for reduced motion
    : direction === "backward"
    ? { opacity: 0, scale: 0.7 } // zoom OUT when going back
    : { opacity: 0, scale: 1.5 }; // zoom IN when going forward

  const initialVariant = reducedMotion
    ? { opacity: 0 } // opacity only for reduced motion
    : direction === "backward"
    ? { opacity: 0, scale: 1.5 } // start zoomed IN when coming back
    : { opacity: 0, scale: 1.3 }; // start slightly zoomed IN on first load
  const [hoveredLandmarkId, setHoveredLandmarkId] = useState<string | null>(
    null
  );
  const [mapImageError, setMapImageError] = useState(false);
  const [pendingMasterplan, setPendingMasterplan] = useState(false);
  const navigateTimerRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
    enabled: zoomPanState.zoom > 1,
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
    enabled: true,
  });

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

  useEffect(() => {
    window.clearTimeout(navigateTimerRef.current ?? undefined);

    if (!pendingMasterplan) {
      return () => {
        window.clearTimeout(navigateTimerRef.current ?? undefined);
      };
    }

    // Small delay to ensure AnimatePresence properly processes the exit animation
    const timeoutId = setTimeout(() => {
      navigate("/masterplan");
    }, 50);

    return () => {
      window.clearTimeout(navigateTimerRef.current ?? undefined);
      clearTimeout(timeoutId);
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
    if (!activeLandmark || !activeLandmark.path) {
      return null;
    }

    if (activeLandmark.type === "complex") {
      return null;
    }

    // Convert flat array [x1, y1, x2, y2, ...] to SVG path
    const pathArray = activeLandmark.path;

    if (!Array.isArray(pathArray) || pathArray.length < 4) {
      return null;
    }

    let pathString = `M ${pathArray[0]} ${pathArray[1]}`;

    for (let i = 2; i < pathArray.length; i += 2) {
      pathString += ` L ${pathArray[i]} ${pathArray[i + 1]}`;
    }

    return pathString;
  }, [activeLandmark]);

  const handleHotspotActivate = (landmark: Landmark) => {
    setActiveLandmarkId(landmark.id);
    setPendingMasterplan(landmark.type === "complex");
  };

  const statusMessage = useMemo(() => {
    if (landmarkState.status === "loading") {
      return t("pages:mapView.loadingLandmarks");
    }

    if (landmarkState.status === "error") {
      return landmarkState.error ?? t("common:messages.errorLoading");
    }

    if (pendingMasterplan && complexLandmark) {
      return t("pages:mapView.loadingWithName", {
        name: getLandmarkText(complexLandmark, "name"),
      });
    }

    if (activeLandmark && complexLandmark) {
      if (activeLandmark.type === "complex") {
        return t("pages:mapView.loadingComplex", {
          name: getLandmarkText(complexLandmark, "name"),
        });
      }

      return t("pages:mapView.routeStatus", {
        from: getLandmarkText(complexLandmark, "name"),
        to: getLandmarkText(activeLandmark, "name"),
      });
    }

    if (hoveredLandmark) {
      return getLandmarkText(hoveredLandmark, "name");
    }

    return t("pages:mapView.hoverHint");
  }, [
    activeLandmark,
    complexLandmark,
    hoveredLandmark,
    landmarkState,
    pendingMasterplan,
    t,
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

  return (
    <motion.div
      className="h-screen w-screen"
      initial={initialVariant}
      animate={{ opacity: 1, scale: 1 }}
      exit={exitVariant}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {/* Page Header with Theme Toggle and Language Switcher */}
      <div className="absolute top-md z-50 ltr:right-md rtl:left-md">
        <PageHeader />
      </div>

      <div
        ref={containerRef}
        className="relative h-screen w-screen overflow-hidden bg-slate-950 text-slate-100"
        {...pointerHandlers}
      >
        <motion.div
          className="absolute inset-0"
          initial={false}
          animate={{
            scale: zoomPanState.zoom,
            x: zoomPanState.pan.x,
            y: zoomPanState.pan.y,
          }}
          transition={{
            duration: zoomPanState.isInteracting ? 0 : 0.3,
            ease: "easeOut",
          }}
          style={{ originX: 0.5, originY: 0.5 }}
        >
          {!mapImageError ? (
            <img
              alt={t("pages:mapView.mapAlt")}
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
            preserveAspectRatio="xMidYMid slice"
            role="presentation"
            onPointerDown={handleBackgroundPointerDown}
          >
            <defs>
              <marker
                id="landmark-arrow"
                markerWidth="6"
                markerHeight="6"
                refX="6"
                refY="3"
                orient="auto"
              >
                <path d="M 0 0 L 6 3 L 0 6 z" fill="rgb(16 185 129, 0.85)" />
              </marker>
              {/* Dynamic marker for custom path colors */}
              {activeLandmark?.pathStyle?.stroke && (
                <marker
                  id={`landmark-arrow-${activeLandmark.id}`}
                  markerWidth="6"
                  markerHeight="6"
                  refX="6"
                  refY="3"
                  orient="auto"
                >
                  <path
                    d="M 0 0 L 6 3 L 0 6 z"
                    fill={activeLandmark.pathStyle.stroke}
                  />
                </marker>
              )}
            </defs>
            <AnimatePresence>
              {pathDefinition ? (
                <motion.path
                  key={pathDefinition}
                  d={pathDefinition}
                  stroke={
                    activeLandmark?.pathStyle?.stroke || "rgb(16 185 129)"
                  }
                  strokeWidth={activeLandmark?.pathStyle?.strokeWidth || 4}
                  strokeLinecap="round"
                  fill="none"
                  markerEnd={
                    activeLandmark?.pathStyle?.stroke
                      ? `url(#landmark-arrow-${activeLandmark.id})`
                      : "url(#landmark-arrow)"
                  }
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
                  ? "fill-slate-800/75 stroke-slate-500"
                  : "fill-slate-800/75 stroke-slate-200";
              const activeClass =
                landmark.type === "complex"
                  ? "fill-slate-600/40 stroke-slate-500"
                  : "fill-slate-600/25 stroke-slate-200";
              const activate = () => handleHotspotActivate(landmark);
              const onPointerEnter = () => handlePointerEnter(landmark.id);
              const onPointerLeave = () => handlePointerLeave(landmark.id);

              // Get translated landmark name
              const landmarkName = getLandmarkText(landmark, "name");
              const landmarkDescription = getLandmarkText(
                landmark,
                "description"
              );

              // Render based on landmark type, not coords structure
              if (landmark.type === "complex") {
                // Complex landmarks render as polygonal shapes
                if (polygon && polygon.length) {
                  return (
                    <g key={landmark.id}>
                      <motion.g
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
                        onKeyDown={(event) =>
                          handleKeyActivation(event, activate)
                        }
                        role="button"
                        tabIndex={0}
                        aria-label={t("pages:mapView.selectHotspot", {
                          name: landmark.name,
                        })}
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
                      </motion.g>

                      {/* Label with styled background - always visible */}
                      {anchorPoint && (
                        <g style={{ pointerEvents: "none" }}>
                          <rect
                            x={
                              anchorPoint.x -
                              (landmarkName.length * 10 + 32) / 2
                            }
                            y={anchorPoint.y - 70}
                            width={landmarkName.length * 10 + 32}
                            height={40}
                            rx={6}
                            className="fill-slate-800/90 stroke-slate-300/50 stroke-1"
                          />
                          <text
                            x={anchorPoint.x}
                            y={anchorPoint.y - 44}
                            textAnchor="middle"
                            className="fill-slate-100 text-[18px] font-bold"
                            style={{ unicodeBidi: "plaintext" }}
                          >
                            {landmarkName}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                }
              } else {
                // Non-complex landmarks (POI) render as circles with styled labels
                if (point) {
                  return (
                    <g key={landmark.id}>
                      {/* POI Circle with hover/active animation - only this scales */}
                      <motion.g
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
                        onKeyDown={(event) =>
                          handleKeyActivation(event, activate)
                        }
                        role="button"
                        tabIndex={0}
                        aria-label={t("pages:mapView.selectHotspot", {
                          name: landmark.name,
                        })}
                        initial={false}
                        animate={{
                          scale: isActive || isHovered ? 1.12 : 1,
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 280,
                          damping: 22,
                        }}
                        style={{
                          transformOrigin: `${point.x}px ${point.y}px`,
                        }}
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
                      </motion.g>

                      {/* Label with styled background - always visible, no scale */}
                      <g style={{ pointerEvents: "none" }}>
                        {/* Background rectangle for label */}
                        <rect
                          x={
                            isRTLMode
                              ? point.x - (landmarkName.length * 7 + 20) - 28
                              : point.x + 28
                          }
                          y={point.y - 14}
                          width={landmarkName.length * 7 + 20}
                          height={28}
                          rx={3}
                          className="fill-slate-800/90 stroke-slate-300/50 stroke-1"
                        />
                        {/* Label text */}
                        <text
                          x={
                            isRTLMode
                              ? point.x -
                                (landmarkName.length * 7 + 20) / 2 -
                                28
                              : point.x +
                                (landmarkName.length * 7 + 20) / 2 +
                                28
                          }
                          y={point.y + 3}
                          textAnchor="middle"
                          className="fill-slate-100 text-[12px] font-medium"
                          style={{ unicodeBidi: "plaintext" }}
                        >
                          {landmarkName}
                        </text>
                      </g>

                      {/* Expanded info card when selected (not on hover) */}
                      <AnimatePresence>
                        {anchorPoint && isActive ? (
                          <motion.g
                            key={`info-card-${landmark.id}`}
                            initial={{ opacity: 0, y: 8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.95 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                          >
                            <foreignObject
                              x={
                                isRTLMode
                                  ? anchorPoint.x - 288
                                  : anchorPoint.x + 28
                              }
                              y={anchorPoint.y + 24}
                              width={260}
                              height={landmark.image ? 220 : 140}
                              overflow="visible"
                            >
                              <div className="rounded-card bg-surface-elevated/95 p-sm shadow-tooltip border border-border-muted backdrop-blur-sm">
                                {landmark.image && (
                                  <img
                                    src={`${import.meta.env.BASE_URL}data/${
                                      landmark.image
                                    }`}
                                    alt={landmarkName}
                                    className="w-full h-24 object-cover rounded-md mb-sm"
                                    onError={(e) => {
                                      e.currentTarget.style.display = "none";
                                    }}
                                  />
                                )}
                                <h3 className="text-sm font-bold text-text-primary mb-xs">
                                  {landmarkName}
                                </h3>
                                {landmarkDescription && (
                                  <p className="text-xs text-text-secondary mb-sm leading-relaxed">
                                    {landmarkDescription}
                                  </p>
                                )}
                                <div className="flex items-center gap-sm text-caption text-text-tertiary">
                                  {typeof landmark.distanceK === "number" && (
                                    <div className="flex items-center gap-xs">
                                      <MapPin className="w-3 h-3" />
                                      <span>
                                        {t("pages:mapView.distanceAway", {
                                          distance: numberFormatter.format(
                                            landmark.distanceK
                                          ),
                                        })}
                                      </span>
                                    </div>
                                  )}
                                  {typeof landmark.timeMin === "number" && (
                                    <div className="flex items-center gap-xs">
                                      <Clock className="w-3 h-3" />
                                      <span>
                                        {t("pages:mapView.driveTime", {
                                          time: numberFormatter.format(
                                            landmark.timeMin
                                          ),
                                        })}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </foreignObject>
                          </motion.g>
                        ) : null}
                      </AnimatePresence>
                    </g>
                  );
                }
              }

              return null;
            })}
          </svg>
        </motion.div>

        <div className="pointer-events-none absolute inset-0 h-1/3 bg-gradient-to-b from-slate-950/70 to-transparent" />
        <div className="pointer-events-none absolute bottom-0 inset-x-0 h-1/4 bg-gradient-to-t from-slate-950/70 to-transparent" />

        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-lg">
          <div className="flex w-full max-w-xl flex-col gap-md">
            <div className="pointer-events-auto space-y-md">
              <span className="text-xs font-semibold uppercase tracking-[0.5em] text-primary">
                {t("pages:mapView.complexName")}
              </span>
              <h1 className="text-heading-1 font-bold">
                {t("pages:mapView.title")}
              </h1>
              <p className="text-sm text-text-primary leading-relaxed">
                {t("pages:mapView.subtitle")}
              </p>
            </div>
          </div>
          <div className="flex w-full items-center justify-center">
            <motion.div
              className="pointer-events-auto rounded-badge bg-surface-elevated/80 px-lg py-sm text-xs font-semibold uppercase tracking-[0.4em] text-text-secondary shadow-elevated"
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
    </motion.div>
  );
};
