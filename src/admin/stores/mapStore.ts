/**
 * Map Store
 * Manages interactive map configuration with landmarks
 */

import { create } from "zustand";
import { db } from "../services/persistence/dexieDB";
import type {
  MapConfig,
  Landmark,
  LandmarkPath,
  ImageRef,
} from "../types/admin-config";

// ============================================================================
// Drawing Mode Types
// ============================================================================

export type DrawingMode = "none" | "poi" | "complex" | "path";

// ============================================================================
// Store Interface
// ============================================================================

interface MapStore {
  // State
  mapConfig: MapConfig | null;
  landmarks: Landmark[];
  paths: LandmarkPath[];
  selectedLandmarkId: string | null;
  selectedPathId: string | null;
  drawingMode: DrawingMode;
  isLoading: boolean;
  error: string | null;

  // Actions - Map
  loadMap: (projectId: string) => Promise<void>;
  updateMap: (updates: Partial<MapConfig>) => Promise<void>;
  setMapImage: (image: ImageRef) => Promise<void>;

  // Actions - Landmarks
  addLandmark: (
    landmark: Omit<Landmark, "id" | "createdAt" | "updatedAt">
  ) => Promise<void>;
  updateLandmark: (id: string, updates: Partial<Landmark>) => Promise<void>;
  deleteLandmark: (id: string) => Promise<void>;
  selectLandmark: (id: string | null) => void;

  // Actions - Paths
  addPath: (
    path: Omit<LandmarkPath, "id" | "createdAt" | "updatedAt">
  ) => Promise<void>;
  updatePath: (id: string, updates: Partial<LandmarkPath>) => Promise<void>;
  deletePath: (id: string) => Promise<void>;
  selectPath: (id: string | null) => void;

  // Actions - Drawing
  setDrawingMode: (mode: DrawingMode) => void;

  clearError: () => void;
}

// ============================================================================
// Store Implementation
// ============================================================================

export const useMapStore = create<MapStore>((set, get) => ({
  // Initial state
  mapConfig: null,
  landmarks: [],
  paths: [],
  selectedLandmarkId: null,
  selectedPathId: null,
  drawingMode: "none",
  isLoading: false,
  error: null,

  // Load map and landmarks
  loadMap: async (projectId: string) => {
    set({ isLoading: true, error: null });

    try {
      const map = await db.maps.where("projectId").equals(projectId).first();
      const landmarks = await db.landmarks
        .where("projectId")
        .equals(projectId)
        .toArray();
      const paths = await db.paths
        .where("projectId")
        .equals(projectId)
        .toArray();

      set({ mapConfig: map || null, landmarks, paths, isLoading: false });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load map";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // Update map config
  updateMap: async (updates) => {
    const { mapConfig } = get();

    if (!mapConfig) {
      throw new Error("No map loaded");
    }

    set({ isLoading: true, error: null });

    try {
      const updatedData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await db.maps.update(mapConfig.id, updatedData);

      set((state) => ({
        mapConfig: state.mapConfig
          ? { ...state.mapConfig, ...updatedData }
          : null,
        isLoading: false,
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update map";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // Set map background image
  setMapImage: async (image) => {
    const { mapConfig } = get();

    if (!mapConfig) {
      throw new Error("No map loaded");
    }

    await get().updateMap({ backgroundImage: image });
  },

  // Add landmark
  addLandmark: async (landmark) => {
    set({ isLoading: true, error: null });

    try {
      const now = new Date().toISOString();
      const { mapConfig } = get();

      if (!mapConfig) {
        throw new Error("No map loaded");
      }

      const newLandmark: Landmark = {
        ...landmark,
        id: crypto.randomUUID(),
        projectId: mapConfig.projectId,
        createdAt: now,
        updatedAt: now,
      };

      await db.landmarks.add(newLandmark);

      set((state) => ({
        landmarks: [...state.landmarks, newLandmark],
        isLoading: false,
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to add landmark";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // Update landmark
  updateLandmark: async (id, updates) => {
    set({ isLoading: true, error: null });

    try {
      const updatedData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await db.landmarks.update(id, updatedData);

      set((state) => ({
        landmarks: state.landmarks.map((l) =>
          l.id === id ? { ...l, ...updatedData } : l
        ),
        isLoading: false,
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update landmark";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // Delete landmark
  deleteLandmark: async (id) => {
    set({ isLoading: true, error: null });

    try {
      await db.landmarks.delete(id);

      set((state) => ({
        landmarks: state.landmarks.filter((l) => l.id !== id),
        selectedLandmarkId:
          state.selectedLandmarkId === id ? null : state.selectedLandmarkId,
        isLoading: false,
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete landmark";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // Select landmark
  selectLandmark: (id) => {
    set({ selectedLandmarkId: id });
  },

  // Add path
  addPath: async (path) => {
    set({ isLoading: true, error: null });

    try {
      const now = new Date().toISOString();
      const { mapConfig } = get();

      if (!mapConfig) {
        throw new Error("No map loaded");
      }

      const newPath: LandmarkPath = {
        ...path,
        id: crypto.randomUUID(),
        projectId: mapConfig.projectId,
        createdAt: now,
        updatedAt: now,
      };

      await db.paths.add(newPath);

      set((state) => ({
        paths: [...state.paths, newPath],
        isLoading: false,
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to add path";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // Update path
  updatePath: async (id, updates) => {
    set({ isLoading: true, error: null });

    try {
      const updatedData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await db.paths.update(id, updatedData);

      set((state) => ({
        paths: state.paths.map((p) =>
          p.id === id ? { ...p, ...updatedData } : p
        ),
        isLoading: false,
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update path";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // Delete path
  deletePath: async (id) => {
    set({ isLoading: true, error: null });

    try {
      await db.paths.delete(id);

      set((state) => ({
        paths: state.paths.filter((p) => p.id !== id),
        selectedPathId:
          state.selectedPathId === id ? null : state.selectedPathId,
        isLoading: false,
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete path";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // Select path
  selectPath: (id) => {
    set({ selectedPathId: id });
  },

  // Set drawing mode
  setDrawingMode: (mode) => {
    set({ drawingMode: mode, selectedLandmarkId: null, selectedPathId: null });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));
