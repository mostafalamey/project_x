import { AnimatePresence, motion } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { BackNav } from "../components/BackNav";
import { BrowseModelsButton } from "../components/BrowseModelsButton";
import { ModelList } from "../components/ModelList";
import { SearchPanel } from "../components/SearchPanel";
import { Tooltip } from "../components/Tooltip";
import { useTransitionContext } from "../contexts/TransitionContext";
import { filterModels, type ModelFilters } from "../data/enrichment";
import { loadMasterPlan, loadModels } from "../data/loaders";
import type {
  MasterPlan,
  MasterPlanAngle,
  MasterPlanBuilding,
  MasterPlanSequence,
  Model,
  Polygon,
} from "../data/types";
import { useKeyboard } from "../hooks/useKeyboard";
import { usePointerPan } from "../hooks/usePointerPan";
import { useZoomPan } from "../hooks/useZoomPan";
import { prefersReducedMotion } from "../utils/accessibility";

const VIEWBOX = { width: 960, height: 600 };
const SEQUENCE_FRAME_MS = 120;

type FetchState<T> = {
  status: "idle" | "loading" | "error" | "success";
  data: T | null;
  error: string | null;
};

type SequenceState = {
  playing: boolean;
  frames: string[];
  index: number;
  targetAngle: number | null;
};

const initialState = <T,>(): FetchState<T> => ({
  status: "idle",
  data: null,
  error: null,
});

const clampAngleIndex = (index: number, total: number) => {
  if (!Number.isFinite(index) || total === 0) {
    return 0;
  }

  return ((index % total) + total) % total;
};

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

const DEFAULT_SEQUENCE_PATTERN = "frame-{index}.jpg";
const SEQUENCE_INDEX_TOKEN = "{index}";

const ensureLeadingSlash = (input: string) =>
  input.startsWith("/") ? input : `/${input}`;

const normalizeFolderPath = (folder: string) => {
  const trimmed = folder.trim();

  if (!trimmed) {
    return null;
  }

  const withLeading = ensureLeadingSlash(trimmed);

  return withLeading.endsWith("/")
    ? withLeading.slice(0, withLeading.length - 1)
    : withLeading;
};

const formatFrameFilename = (pattern: string, index: number) => {
  if (pattern.includes(SEQUENCE_INDEX_TOKEN)) {
    return pattern.split(SEQUENCE_INDEX_TOKEN).join(`${index}`);
  }

  return `${pattern}${index}`;
};

const buildSequenceFramePaths = (sequence?: MasterPlanSequence) => {
  if (!sequence || sequence.frameCount <= 0) {
    return [];
  }

  const normalizedFolder = normalizeFolderPath(sequence.folder);

  if (!normalizedFolder) {
    return [];
  }

  const pattern = sequence.filenamePattern ?? DEFAULT_SEQUENCE_PATTERN;

  return Array.from({ length: sequence.frameCount }, (_, offset) => {
    const frameIndex = offset + 1;
    const filename = formatFrameFilename(pattern, frameIndex);

    return `${normalizedFolder}/${filename}`;
  });
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

// Panorama hotspots - positions for 360 tour entry points
type PanoramaHotspot = {
  id: string;
  tourId: string;
  sceneId?: string;
  angleIndex: number; // Which angle this hotspot appears on
  x: number; // SVG coordinate
  y: number; // SVG coordinate
  label: string;
};

const PANORAMA_HOTSPOTS: PanoramaHotspot[] = [
  {
    id: "entrance-pano",
    tourId: "street-view",
    sceneId: "entrance",
    angleIndex: 0,
    x: 480,
    y: 500,
    label: "Main Entrance 360°",
  },
  {
    id: "plaza-pano",
    tourId: "street-view",
    sceneId: "plaza",
    angleIndex: 1,
    x: 380,
    y: 400,
    label: "Central Plaza 360°",
  },
  {
    id: "garden-pano",
    tourId: "street-view",
    sceneId: "garden",
    angleIndex: 2,
    x: 600,
    y: 350,
    label: "Garden View 360°",
  },
  {
    id: "parking-pano",
    tourId: "street-view",
    sceneId: "parking",
    angleIndex: 3,
    x: 300,
    y: 450,
    label: "Parking Area 360°",
  },
];

export const MasterPlanView = () => {
  const navigate = useNavigate();
  const { startTransition, direction } = useTransitionContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const [state, setState] = useState<FetchState<MasterPlan>>(initialState);

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

  const [currentAngleIndex, setCurrentAngleIndex] = useState(
    () => Number(searchParams.get("angle")) || 0
  );
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(
    null
  );
  const [hoveredBuildingId, setHoveredBuildingId] = useState<string | null>(
    null
  );
  const [hoveredPanoId, setHoveredPanoId] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [sequenceState, setSequenceState] = useState<SequenceState>({
    playing: false,
    frames: [],
    index: 0,
    targetAngle: null,
  });
  const pointerStartXRef = useRef<number | null>(null);
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
    let cancelled = false;

    const fetchMasterPlan = async () => {
      setState((previous) => ({ ...previous, status: "loading", error: null }));

      try {
        const data = await loadMasterPlan();

        if (!cancelled) {
          setState({ status: "success", data, error: null });
          setCurrentAngleIndex((previousIndex) =>
            clampAngleIndex(previousIndex, data.angles.length)
          );
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            status: "error",
            data: null,
            error:
              error instanceof Error
                ? error.message
                : "Unable to load master plan data",
          });
        }
      }
    };

    fetchMasterPlan();

    return () => {
      cancelled = true;
    };
  }, []);

  // Load models
  useEffect(() => {
    if (!showSearch) return;

    let cancelled = false;

    const fetchModels = async () => {
      setModelsState((prev) => ({ ...prev, status: "loading", error: null }));

      try {
        const data = await loadModels();

        if (!cancelled) {
          setModelsState({ status: "success", data, error: null });
          setFilteredModels(data);
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
  }, [showSearch]);

  // Apply filters when filters or models change
  useEffect(() => {
    if (modelsState.status === "success" && modelsState.data) {
      const filtered = filterModels(modelsState.data, filters);
      setFilteredModels(filtered);
    }
  }, [modelsState, filters]);

  useEffect(() => {
    if (state.data) {
      const sources = new Set<string>();

      state.data.angles.forEach((angle) => {
        sources.add(angle.image);
        buildSequenceFramePaths(angle.sequenceToNext).forEach((frame) => {
          sources.add(frame);
        });
      });

      sources.forEach((src) => {
        const image = new Image();
        image.src = src;
      });
    }
  }, [state.data]);

  useEffect(() => {
    if (state.data && state.data.angles.length > 0) {
      const normalized = clampAngleIndex(
        currentAngleIndex,
        state.data.angles.length
      );

      if (normalized !== currentAngleIndex) {
        setCurrentAngleIndex(normalized);
        return;
      }

      const params = new URLSearchParams(searchParams);
      params.set("angle", normalized.toString());
      setSearchParams(params, { replace: true });
    }
  }, [currentAngleIndex, searchParams, setSearchParams, state.data]);

  useEffect(() => {
    if (!sequenceState.playing) {
      if (
        sequenceState.targetAngle !== null &&
        sequenceState.targetAngle !== currentAngleIndex
      ) {
        setCurrentAngleIndex(sequenceState.targetAngle);
        return;
      }

      if (
        sequenceState.targetAngle !== null &&
        sequenceState.targetAngle === currentAngleIndex
      ) {
        setSequenceState((previous) =>
          previous.targetAngle === null
            ? previous
            : { ...previous, targetAngle: null }
        );
      }
      return;
    }

    if (
      sequenceState.frames.length === 0 ||
      sequenceState.index >= sequenceState.frames.length
    ) {
      setSequenceState((prev) => ({
        ...prev,
        playing: false,
        index: 0,
        frames: [],
      }));
      return;
    }

    const timer = window.setTimeout(() => {
      setSequenceState((prev) => ({ ...prev, index: prev.index + 1 }));
    }, SEQUENCE_FRAME_MS);

    return () => window.clearTimeout(timer);
  }, [currentAngleIndex, sequenceState]);

  const normalizedIndex = useMemo(() => {
    if (!state.data) {
      return 0;
    }

    return clampAngleIndex(currentAngleIndex, state.data.angles.length);
  }, [currentAngleIndex, state.data]);

  const currentAngle: MasterPlanAngle | null = useMemo(() => {
    if (!state.data) {
      return null;
    }

    return state.data.angles[normalizedIndex];
  }, [normalizedIndex, state.data]);

  const buildingDictionary = useMemo(() => {
    const dictionary = new Map<string, MasterPlanBuilding>();

    state.data?.buildings.forEach((building) => {
      dictionary.set(building.id, building);
    });

    return dictionary;
  }, [state.data]);

  const activeStatusBuildingId = hoveredBuildingId ?? selectedBuildingId;
  const activeStatusBuilding = activeStatusBuildingId
    ? buildingDictionary.get(activeStatusBuildingId)
    : null;

  const activeHotspot = useMemo(() => {
    if (!currentAngle || !activeStatusBuildingId) {
      return null;
    }

    return (
      currentAngle.hotspots.find(
        (hotspot) => hotspot.buildingId === activeStatusBuildingId
      ) ?? null
    );
  }, [activeStatusBuildingId, currentAngle]);

  const tooltipPosition = useMemo(() => {
    if (!activeHotspot) {
      return null;
    }

    const centroid = centroidOfPolygons(activeHotspot.polygons);

    if (!centroid) {
      return null;
    }

    return {
      left: `${(centroid.x / VIEWBOX.width) * 100}%`,
      top: `${(centroid.y / VIEWBOX.height) * 100}%`,
    };
  }, [activeHotspot]);

  const displayImageSrc = useMemo(() => {
    if (sequenceState.playing && sequenceState.frames.length) {
      const frameIndex = Math.min(
        sequenceState.index,
        sequenceState.frames.length - 1
      );

      return sequenceState.frames[frameIndex];
    }

    return currentAngle?.image ?? null;
  }, [currentAngle, sequenceState]);

  const handleCycle = (direction: 1 | -1) => {
    if (
      !state.data ||
      state.data.angles.length === 0 ||
      sequenceState.playing
    ) {
      return;
    }

    const total = state.data.angles.length;
    const target = clampAngleIndex(normalizedIndex + direction, total);

    if (target === normalizedIndex) {
      return;
    }

    if (direction === 1) {
      const angle = state.data.angles[normalizedIndex];
      const framesToPlay = buildSequenceFramePaths(angle.sequenceToNext);

      if (framesToPlay.length > 0) {
        setSequenceState({
          playing: true,
          frames: [...framesToPlay, state.data.angles[target].image],
          index: 0,
          targetAngle: target,
        });
        return;
      }
    } else {
      const targetAngle = state.data.angles[target];
      const reverseFrames = buildSequenceFramePaths(targetAngle.sequenceToNext);

      if (reverseFrames.length > 0) {
        setSequenceState({
          playing: true,
          frames: [
            ...reverseFrames.slice().reverse(),
            state.data.angles[target].image,
          ],
          index: 0,
          targetAngle: target,
        });
        return;
      }
    }

    setCurrentAngleIndex(target);
  };

  const handleHotspotActivate = (buildingId: string, polygon?: Polygon) => {
    setSelectedBuildingId(buildingId);

    // Calculate polygon center for transition origin
    let origin = { x: 0.5, y: 0.5 }; // Default to center
    if (polygon && polygon.length >= 2) {
      // Polygon is array of numbers: [x1, y1, x2, y2, ...]
      const points: { x: number; y: number }[] = [];
      for (let i = 0; i < polygon.length; i += 2) {
        points.push({ x: polygon[i], y: polygon[i + 1] });
      }

      // Calculate centroid
      const centroidX =
        points.reduce(
          (sum: number, p: { x: number; y: number }) => sum + p.x,
          0
        ) / points.length;
      const centroidY =
        points.reduce(
          (sum: number, p: { x: number; y: number }) => sum + p.y,
          0
        ) / points.length;

      // Convert to normalized coordinates (0-1 range)
      origin = {
        x: centroidX / VIEWBOX.width,
        y: centroidY / VIEWBOX.height,
      };
    }

    const targetUrl = `/building/${buildingId}?angle=${normalizedIndex}`;
    startTransition(targetUrl, origin);

    // Small delay to ensure AnimatePresence properly processes the exit animation
    setTimeout(() => {
      navigate(targetUrl);
    }, 50);
  };

  const handlePanoramaActivate = (hotspot: PanoramaHotspot) => {
    const url = hotspot.sceneId
      ? `/tour/${hotspot.tourId}?scene=${hotspot.sceneId}`
      : `/tour/${hotspot.tourId}`;
    navigate(url);
  };

  const statusMessage = useMemo(() => {
    if (state.status === "loading") {
      return "Loading master plan angles...";
    }

    if (state.status === "error") {
      return state.error ?? "Unable to load master plan right now.";
    }

    if (sequenceState.playing) {
      return "Animating camera rotation...";
    }

    if (hoveredPanoId) {
      const pano = PANORAMA_HOTSPOTS.find((p) => p.id === hoveredPanoId);
      return pano
        ? `Click to explore ${pano.label}`
        : "Click to explore 360° view";
    }

    if (hoveredBuildingId && activeStatusBuilding) {
      return `Previewing ${activeStatusBuilding.name}.`; // maybe include stats
    }

    if (selectedBuildingId && activeStatusBuilding) {
      return `Launching ${activeStatusBuilding.name} elevation...`;
    }

    return "Swipe or use controls to rotate the plan, then select a building.";
  }, [
    activeStatusBuilding,
    hoveredBuildingId,
    hoveredPanoId,
    selectedBuildingId,
    sequenceState.playing,
    state,
  ]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    // Only enable swipe-to-switch-angle when at default zoom
    if (zoomPanState.zoom !== 1) return;
    pointerStartXRef.current = event.clientX;
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    // Only enable swipe-to-switch-angle when at default zoom
    if (zoomPanState.zoom !== 1) return;

    if (pointerStartXRef.current === null) {
      return;
    }

    const delta = event.clientX - pointerStartXRef.current;

    if (Math.abs(delta) > 40) {
      handleCycle(delta > 0 ? -1 : 1);
    }

    pointerStartXRef.current = null;
  };

  const handlePointerLeave = () => {
    pointerStartXRef.current = null;
  };

  const handleHoverStart = (buildingId: string) => {
    setHoveredBuildingId(buildingId);
  };

  const handleHoverEnd = (buildingId: string) => {
    setHoveredBuildingId((previous) =>
      previous === buildingId ? null : previous
    );
  };

  const currentHotspots = currentAngle?.hotspots ?? [];

  // Combined pointer handlers for root container
  const combinedPointerHandlers = {
    ...pointerHandlers,
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => {
      // Call pan handler first
      pointerHandlers.onPointerDown(e);
      // Then swipe handler (only works when zoom === 1)
      handlePointerDown(e);
    },
    onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => {
      pointerHandlers.onPointerUp();
      handlePointerUp(e);
    },
    onPointerLeave: () => {
      pointerHandlers.onPointerCancel();
      handlePointerLeave();
    },
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
        {...combinedPointerHandlers}
      >
        {/* Single motion.div for zoom/pan - contains both image and SVG */}
        <motion.div
          className="absolute inset-0"
          initial={false}
          animate={{
            opacity: imageError ? 0.2 : 1,
            scale: (sequenceState.playing ? 1.01 : 1) * zoomPanState.zoom,
            x: zoomPanState.pan.x,
            y: zoomPanState.pan.y,
          }}
          transition={{
            duration: zoomPanState.isInteracting ? 0 : 0.6,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {displayImageSrc && !imageError ? (
            <motion.img
              key={displayImageSrc}
              src={displayImageSrc}
              alt={
                currentAngle ? `Master plan ${currentAngle.id}` : "Master plan"
              }
              className="h-full w-full object-cover"
              onError={() => setImageError(true)}
              initial={{ opacity: 0.4, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-950" />
          )}

          {/* SVG hotspots - in same transform container */}
          <svg
            className="pointer-events-auto absolute inset-0 h-full w-full"
            viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
            preserveAspectRatio="xMidYMid meet"
            role="presentation"
          >
            {currentHotspots.map((hotspot) => {
              const buildingInfo = buildingDictionary.get(hotspot.buildingId);
              const isHovered = hoveredBuildingId === hotspot.buildingId;
              const isSelected = selectedBuildingId === hotspot.buildingId;
              const hasHoveredBuilding = hoveredBuildingId !== null;

              const fillClass =
                isHovered || isSelected
                  ? "fill-emerald-400/10 stroke-emerald-200"
                  : hasHoveredBuilding
                  ? "fill-slate-950/50 stroke-emerald-200/50"
                  : "fill-transparent stroke-emerald-200/50";

              return (
                <g
                  key={`${hotspot.buildingId}-${currentAngle?.id ?? "angle"}`}
                  className="cursor-pointer focus:outline-none focus-visible:outline-none"
                  onClick={() =>
                    handleHotspotActivate(
                      hotspot.buildingId,
                      hotspot.polygons[0]
                    )
                  }
                  onPointerDown={(event) => {
                    event.stopPropagation();
                  }}
                  onPointerUp={(event) => {
                    event.stopPropagation();
                  }}
                  onMouseEnter={() => handleHoverStart(hotspot.buildingId)}
                  onMouseLeave={() => handleHoverEnd(hotspot.buildingId)}
                  onFocus={() => handleHoverStart(hotspot.buildingId)}
                  onBlur={() => handleHoverEnd(hotspot.buildingId)}
                  onKeyDown={(event) =>
                    handleKeyActivation(event, () =>
                      handleHotspotActivate(
                        hotspot.buildingId,
                        hotspot.polygons[0]
                      )
                    )
                  }
                  role="button"
                  tabIndex={0}
                  aria-label={
                    buildingInfo
                      ? `Open ${buildingInfo.name}`
                      : `Open ${hotspot.buildingId}`
                  }
                >
                  {hotspot.polygons.map((polygon, index) => (
                    <polygon
                      key={`${hotspot.buildingId}-${index}`}
                      points={polygonToPointString(polygon)}
                      className={`stroke-[1.5] transition ${fillClass}`}
                    />
                  ))}
                </g>
              );
            })}

            {/* Panorama Hotspots - 360° tour entry points */}
            {PANORAMA_HOTSPOTS.filter(
              (pano) => pano.angleIndex === normalizedIndex
            ).map((pano) => {
              const isHovered = hoveredPanoId === pano.id;
              const iconSize = 32;
              const iconX = pano.x - iconSize / 2;
              const iconY = pano.y - iconSize / 2;

              return (
                <g
                  key={pano.id}
                  className="cursor-pointer focus:outline-none focus-visible:outline-none"
                  onClick={() => handlePanoramaActivate(pano)}
                  onPointerDown={(event) => {
                    event.stopPropagation();
                  }}
                  onPointerUp={(event) => {
                    event.stopPropagation();
                  }}
                  onMouseEnter={() => setHoveredPanoId(pano.id)}
                  onMouseLeave={() => setHoveredPanoId(null)}
                  onFocus={() => setHoveredPanoId(pano.id)}
                  onBlur={() => setHoveredPanoId(null)}
                  onKeyDown={(event) =>
                    handleKeyActivation(event, () =>
                      handlePanoramaActivate(pano)
                    )
                  }
                  role="button"
                  tabIndex={0}
                  aria-label={pano.label}
                >
                  {/* Background circle */}
                  <circle
                    cx={pano.x}
                    cy={pano.y}
                    r={isHovered ? 28 : 20}
                    className={`transition-all ${
                      isHovered
                        ? "fill-emerald-400/90 stroke-emerald-200"
                        : "fill-emerald-500/70 stroke-emerald-300/60"
                    }`}
                    strokeWidth="2"
                  />
                  {/* 360 icon using 360 icon - foreignObject allows HTML/React */}
                  <foreignObject
                    x={iconX}
                    y={iconY}
                    width={iconSize}
                    height={iconSize}
                    className="pointer-events-none"
                  >
                    <div className="flex h-full w-full items-center justify-center">
                      <img
                        src="/360_icon.svg"
                        alt="360° View"
                        className={`transition-all ${
                          isHovered ? "size-32" : "size-16"
                        }`}
                      />
                    </div>
                  </foreignObject>
                </g>
              );
            })}
          </svg>
        </motion.div>

        {/* Gradient overlay - not zoomed */}
        <div className="pointer-events-none absolute inset-0 h-1/3 bg-gradient-to-b from-slate-950/70 to-transparent" />
        <div className="pointer-events-none absolute bottom-0 inset-x-0 h-1/4 bg-gradient-to-t from-slate-950/70 to-transparent" />

        {/* UI Layer - not zoomed */}
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-10">
          <div className="flex w-full items-start justify-between gap-4">
            <div className="pointer-events-auto flex flex-col gap-3">
              <BackNav label="Map" to="/" />
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.5em] text-emerald-300">
                  Aurora Complex
                </span>
                <h1 className="mt-3 text-4xl font-bold sm:text-5xl">
                  Master Plan View
                </h1>
                <p className="mt-3 max-w-xl text-sm text-slate-200">
                  Rotate through cinematic angles, explore up to four hotspots
                  per building, and dive straight into elevation views.
                </p>
              </div>
            </div>
            <div className="pointer-events-auto flex flex-col items-end gap-3 text-xs font-semibold uppercase tracking-[0.45em] text-slate-200">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="rounded-full border border-slate-500/70 px-4 py-2 transition hover:border-emerald-400 hover:text-emerald-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                  onClick={() => handleCycle(-1)}
                  disabled={
                    state.status !== "success" ||
                    sequenceState.playing ||
                    zoomPanState.zoom !== 1
                  }
                  aria-label="View previous master plan angle"
                >
                  Prev
                </button>
                <div
                  className="rounded-full border border-slate-500/70 px-4 py-2"
                  role="status"
                  aria-live="polite"
                  aria-label={`Currently viewing angle ${normalizedIndex + 1}${
                    state.data ? ` of ${state.data.angles.length}` : ""
                  }`}
                >
                  Angle {normalizedIndex + 1}
                  {state.data ? ` / ${state.data.angles.length}` : ""}
                </div>
                <button
                  type="button"
                  className="rounded-full border border-slate-500/70 px-4 py-2 transition hover:border-emerald-400 hover:text-emerald-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                  onClick={() => handleCycle(1)}
                  disabled={
                    state.status !== "success" ||
                    sequenceState.playing ||
                    zoomPanState.zoom !== 1
                  }
                  aria-label="View next master plan angle"
                >
                  Next
                </button>
              </div>
              <span className="text-[10px] uppercase tracking-[0.45em] text-slate-400">
                {zoomPanState.zoom === 1
                  ? "Swipe horizontally or use controls"
                  : "Reset zoom to switch angles"}
              </span>
              <BrowseModelsButton
                isOpen={showSearch}
                onClick={() => setShowSearch(!showSearch)}
                className="mt-4"
              />
            </div>
          </div>

          <div className="pointer-events-none relative flex-1">
            <AnimatePresence>
              {activeStatusBuilding && tooltipPosition ? (
                <motion.div
                  key={activeStatusBuilding.id}
                  className="pointer-events-none absolute max-w-xs -translate-x-1/2 -translate-y-[140%]"
                  style={tooltipPosition}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                >
                  <Tooltip
                    title={activeStatusBuilding.id}
                    content={activeStatusBuilding.name}
                    footer={`${activeStatusBuilding.summary.totalFloors} floors · ${activeStatusBuilding.summary.availableUnits} units available`}
                  />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <div className="pointer-events-none flex w-full items-center justify-center">
            <motion.div
              key={statusMessage}
              className="rounded-full bg-slate-950/80 px-6 py-3 text-xs font-semibold uppercase tracking-[0.45em] text-slate-200 shadow-lg shadow-slate-950/60"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              role="status"
              aria-live="polite"
              aria-label={`Status: ${statusMessage}`}
            >
              {statusMessage}
            </motion.div>
          </div>
        </div>

        {/* Search Panel Overlay */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              className="absolute inset-0 z-20 flex items-start justify-end bg-slate-950/40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSearch(false)}
            >
              <motion.div
                className="h-full w-full max-w-2xl overflow-y-auto bg-slate-900/95 p-8 shadow-2xl"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Browse Models</h2>
                  <button
                    type="button"
                    onClick={() => setShowSearch(false)}
                    className="rounded-full p-2 transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    aria-label="Close search panel"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {modelsState.status === "loading" ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                      <Loader2 className="mb-4 inline-block h-12 w-12 animate-spin text-emerald-500" />
                      <p className="text-slate-400">Loading models...</p>
                    </div>
                  </div>
                ) : modelsState.status === "error" ? (
                  <div className="rounded-2xl border border-red-500/20 bg-red-900/10 p-8 text-center">
                    <p className="text-red-400">{modelsState.error}</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <SearchPanel
                      filters={filters}
                      onFiltersChange={setFilters}
                      resultCount={filteredModels.length}
                      showAvailability={false}
                    />
                    <ModelList
                      models={filteredModels}
                      onModelSelect={() => setShowSearch(false)}
                      backLocation="/masterplan"
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
