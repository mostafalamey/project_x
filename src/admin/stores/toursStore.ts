/**
 * Tours Store
 * Manages virtual tour configurations with panoramic scenes and hotspots
 */

import { create } from "zustand";
import db from "../services/persistence/dexieDB";
import type {
  TourConfig,
  TourScene,
  SceneHotspot,
} from "../types/admin-config";

interface ToursState {
  tours: TourConfig[];
  selectedTourId: string | null;
  selectedSceneId: string | null;
  selectedHotspotId: string | null;

  // Tour CRUD
  loadTours: (modelId: string) => Promise<void>;
  createTour: (modelId: string, name: string) => Promise<TourConfig>;
  getTourByModelId: (modelId: string) => TourConfig | undefined;
  selectTour: (tourId: string | null) => void;
  updateTour: (tourId: string, updates: Partial<TourConfig>) => Promise<void>;
  deleteTour: (tourId: string) => Promise<void>;

  // Scene CRUD
  addScene: (tourId: string, scene: Omit<TourScene, "id">) => Promise<void>;
  updateScene: (
    tourId: string,
    sceneId: string,
    updates: Partial<TourScene>
  ) => Promise<void>;
  deleteScene: (tourId: string, sceneId: string) => Promise<void>;
  selectScene: (sceneId: string | null) => void;
  setStartingScene: (tourId: string, sceneId: string) => Promise<void>;

  // Hotspot CRUD
  addHotspot: (
    tourId: string,
    sceneId: string,
    hotspot: Omit<SceneHotspot, "id">
  ) => Promise<void>;
  updateHotspot: (
    tourId: string,
    sceneId: string,
    hotspotId: string,
    updates: Partial<SceneHotspot>
  ) => Promise<void>;
  deleteHotspot: (
    tourId: string,
    sceneId: string,
    hotspotId: string
  ) => Promise<void>;
  selectHotspot: (hotspotId: string | null) => void;
}

export const useToursStore = create<ToursState>((set, get) => ({
  tours: [],
  selectedTourId: null,
  selectedSceneId: null,
  selectedHotspotId: null,

  // ============================================================================
  // Tour CRUD
  // ============================================================================

  loadTours: async (modelId: string) => {
    const allTours = await db.tours.toArray();
    const modelTours = allTours.filter(
      (t: TourConfig) => t.modelId === modelId
    );
    set({ tours: modelTours });
  },

  createTour: async (modelId: string, name: string) => {
    const projectId = "default"; // TODO: Get from project store

    const newTour: TourConfig = {
      id: `tour-${Date.now()}`,
      projectId,
      modelId,
      name,
      startingSceneId: "",
      scenes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.tours.add(newTour);
    set((state) => ({ tours: [...state.tours, newTour] }));
    return newTour;
  },

  getTourByModelId: (modelId: string) => {
    const { tours } = get();
    return tours.find((t) => t.modelId === modelId);
  },

  selectTour: (tourId: string | null) => {
    set({ selectedTourId: tourId });
  },

  updateTour: async (tourId: string, updates: Partial<TourConfig>) => {
    await db.tours.update(tourId, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    set((state) => ({
      tours: state.tours.map((tour) =>
        tour.id === tourId
          ? { ...tour, ...updates, updatedAt: new Date().toISOString() }
          : tour
      ),
    }));
  },

  deleteTour: async (tourId: string) => {
    await db.tours.delete(tourId);
    set((state) => ({
      tours: state.tours.filter((tour) => tour.id !== tourId),
      selectedTourId:
        state.selectedTourId === tourId ? null : state.selectedTourId,
    }));
  },

  // ============================================================================
  // Scene CRUD
  // ============================================================================

  addScene: async (tourId: string, scene: Omit<TourScene, "id">) => {
    const { tours } = get();
    const tour = tours.find((t) => t.id === tourId);
    if (!tour) return;

    const newScene: TourScene = {
      ...scene,
      id: `scene-${Date.now()}`,
    };

    const updatedScenes = [...tour.scenes, newScene];

    // If this is the first scene, set it as starting scene
    const updates: Partial<TourConfig> = { scenes: updatedScenes };
    if (tour.scenes.length === 0) {
      updates.startingSceneId = newScene.id;
    }

    await get().updateTour(tourId, updates);
  },

  updateScene: async (
    tourId: string,
    sceneId: string,
    updates: Partial<TourScene>
  ) => {
    const { tours } = get();
    const tour = tours.find((t) => t.id === tourId);
    if (!tour) return;

    const updatedScenes = tour.scenes.map((scene) =>
      scene.id === sceneId ? { ...scene, ...updates } : scene
    );

    await get().updateTour(tourId, { scenes: updatedScenes });
  },

  deleteScene: async (tourId: string, sceneId: string) => {
    const { tours, selectedSceneId } = get();
    const tour = tours.find((t) => t.id === tourId);
    if (!tour) return;

    const updatedScenes = tour.scenes.filter((scene) => scene.id !== sceneId);

    // Update starting scene if it was deleted
    const updates: Partial<TourConfig> = { scenes: updatedScenes };
    if (tour.startingSceneId === sceneId) {
      updates.startingSceneId =
        updatedScenes.length > 0 ? updatedScenes[0].id : "";
    }

    await get().updateTour(tourId, updates);

    // Deselect if deleted
    if (selectedSceneId === sceneId) {
      set({ selectedSceneId: null });
    }
  },

  selectScene: (sceneId: string | null) => {
    set({ selectedSceneId: sceneId });
  },

  setStartingScene: async (tourId: string, sceneId: string) => {
    await get().updateTour(tourId, { startingSceneId: sceneId });
  },

  // ============================================================================
  // Hotspot CRUD
  // ============================================================================

  addHotspot: async (
    tourId: string,
    sceneId: string,
    hotspot: Omit<SceneHotspot, "id">
  ) => {
    const { tours } = get();
    const tour = tours.find((t) => t.id === tourId);
    if (!tour) return;

    const scene = tour.scenes.find((s) => s.id === sceneId);
    if (!scene) return;

    const newHotspot: SceneHotspot = {
      ...hotspot,
      id: `hotspot-${Date.now()}`,
    };

    const updatedHotspots = [...scene.hotspots, newHotspot];
    await get().updateScene(tourId, sceneId, { hotspots: updatedHotspots });
  },

  updateHotspot: async (
    tourId: string,
    sceneId: string,
    hotspotId: string,
    updates: Partial<SceneHotspot>
  ) => {
    const { tours } = get();
    const tour = tours.find((t) => t.id === tourId);
    if (!tour) return;

    const scene = tour.scenes.find((s) => s.id === sceneId);
    if (!scene) return;

    const updatedHotspots = scene.hotspots.map((hotspot) =>
      hotspot.id === hotspotId ? { ...hotspot, ...updates } : hotspot
    );

    await get().updateScene(tourId, sceneId, { hotspots: updatedHotspots });
  },

  deleteHotspot: async (tourId: string, sceneId: string, hotspotId: string) => {
    const { tours, selectedHotspotId } = get();
    const tour = tours.find((t) => t.id === tourId);
    if (!tour) return;

    const scene = tour.scenes.find((s) => s.id === sceneId);
    if (!scene) return;

    const updatedHotspots = scene.hotspots.filter(
      (hotspot) => hotspot.id !== hotspotId
    );
    await get().updateScene(tourId, sceneId, { hotspots: updatedHotspots });

    // Deselect if deleted
    if (selectedHotspotId === hotspotId) {
      set({ selectedHotspotId: null });
    }
  },

  selectHotspot: (hotspotId: string | null) => {
    set({ selectedHotspotId: hotspotId });
  },
}));
