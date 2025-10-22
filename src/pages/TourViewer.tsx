import "photo-sphere-viewer/dist/photo-sphere-viewer.css";

import { useEffect, useMemo, useState } from "react";
import { ReactPhotoSphereViewer } from "react-photo-sphere-viewer";
import { useParams, useSearchParams } from "react-router-dom";

import { BackNav } from "../components/BackNav";
import { loadTour } from "../data/loaders";
import type { PanoScene, Tour } from "../data/types";

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
    // Check if this is a street-view tour (non-unit tour)
    if (state.data && state.data.modelId === null) {
      return "/masterplan";
    }

    const unit = searchParams.get("unit");
    const building = searchParams.get("building");
    const floor = searchParams.get("floor");
    const angle = searchParams.get("angle");

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
      return query.length ? `/unit/${unit}?${query}` : `/unit/${unit}`;
    }

    return "/masterplan";
  }, [searchParams, state.data]);

  const backLabel = useMemo(() => {
    // Street-view tours go back to master plan
    if (state.data && state.data.modelId === null) {
      return "Master Plan";
    }

    // Unit tours go back to unit
    const unit = searchParams.get("unit");
    if (unit) {
      return "Unit";
    }

    return "Master Plan";
  }, [searchParams, state.data]);

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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-12">
        <BackNav label={backLabel} to={backHref} />
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">Panorama Tour</h1>
          <p className="text-sm text-slate-300">
            Rendered with react-photo-sphere-viewer, this tour preloads adjacent
            scenes and keeps navigation entirely client-side for static hosting.
          </p>
          {state.status === "loading" ? (
            <span className="text-xs uppercase tracking-[0.35em] text-slate-500">
              Loading panorama assets...
            </span>
          ) : null}
          {state.status === "error" ? (
            <span className="text-xs uppercase tracking-[0.35em] text-red-400">
              {state.error}
            </span>
          ) : null}
        </header>
        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-slate-900/40">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
              Viewer canvas
            </h2>
            {currentScene ? (
              <span className="text-xs uppercase tracking-[0.35em] text-slate-400">
                Scene: {currentScene.id}
              </span>
            ) : null}
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60 relative">
            {currentScene ? (
              <>
                {panoLoading && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/90">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-emerald-400"></div>
                      <span className="text-xs uppercase tracking-[0.35em] text-slate-400">
                        Loading panorama...
                      </span>
                    </div>
                  </div>
                )}
                <div
                  className={`transition-opacity duration-300 ${
                    isFading ? "opacity-0" : "opacity-100"
                  }`}
                >
                  <ReactPhotoSphereViewer
                    key={currentScene.id}
                    src={currentScene.image}
                    height="420px"
                    width="100%"
                    littlePlanet={false}
                    pitch={currentScene.initialView?.pitch}
                    yaw={currentScene.initialView?.yaw}
                    fov={currentScene.initialView?.fov}
                    onReady={() => setPanoLoading(false)}
                  />
                </div>
              </>
            ) : (
              <div className="flex h-[420px] items-center justify-center text-sm text-slate-400">
                Select a scene to begin the tour.
              </div>
            )}
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {state.data?.scenes.map((scene) => (
              <button
                key={scene.id}
                type="button"
                onClick={() => handleSceneCardSelect(scene)}
                className={`flex flex-col gap-2 rounded-xl border px-4 py-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 ${
                  scene.id === currentSceneId
                    ? "border-emerald-400/70 bg-emerald-500/10 text-emerald-200"
                    : "border-slate-700/60 bg-slate-900/60 hover:border-emerald-400/50 hover:bg-emerald-500/10"
                }`}
              >
                <span className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-300">
                  Scene {scene.id}
                </span>
                <span className="text-xs text-slate-400">
                  {scene.links?.length
                    ? `${scene.links.length} hotspots`
                    : "No hotspots defined"}
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
