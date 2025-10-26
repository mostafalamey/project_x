/**
 * Floors Store
 * Manages floor plans with unit hotspots
 */

import { create } from "zustand";
import { db } from "../services/persistence/dexieDB";
import type { FloorConfig, UnitHotspot } from "../types/admin-config";

// ============================================================================
// Store Interface
// ============================================================================

interface FloorsStore {
  // State
  floors: FloorConfig[];
  selectedFloorId: string | null;
  selectedUnitId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions - Floors
  loadFloors: (buildingId: string) => Promise<void>;
  loadAllFloors: (projectId: string) => Promise<void>;
  addFloor: (
    floor: Omit<FloorConfig, "id" | "createdAt" | "updatedAt">
  ) => Promise<void>;
  updateFloor: (id: string, updates: Partial<FloorConfig>) => Promise<void>;
  deleteFloor: (id: string) => Promise<void>;
  selectFloor: (id: string | null) => void;

  // Actions - Units
  addUnit: (floorId: string, unit: Omit<UnitHotspot, "id">) => Promise<void>;
  updateUnit: (
    floorId: string,
    unitId: string,
    updates: Partial<UnitHotspot>
  ) => Promise<void>;
  deleteUnit: (floorId: string, unitId: string) => Promise<void>;
  selectUnit: (id: string | null) => void;

  clearError: () => void;
}

// ============================================================================
// Store Implementation
// ============================================================================

export const useFloorsStore = create<FloorsStore>((set, get) => ({
  // Initial state
  floors: [],
  selectedFloorId: null,
  selectedUnitId: null,
  isLoading: false,
  error: null,

  // Load floors for building
  loadFloors: async (buildingId: string) => {
    set({ isLoading: true, error: null });

    try {
      const floors = await db.floors
        .where("buildingId")
        .equals(buildingId)
        .sortBy("floorNumber");

      set({ floors, isLoading: false });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load floors";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // Load all floors for project
  loadAllFloors: async (projectId: string) => {
    set({ isLoading: true, error: null });

    try {
      const floors = await db.floors
        .where("projectId")
        .equals(projectId)
        .sortBy("floorNumber");

      set({ floors, isLoading: false });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load floors";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // Add floor
  addFloor: async (floor) => {
    set({ isLoading: true, error: null });

    try {
      const now = new Date().toISOString();
      const newFloor: FloorConfig = {
        ...floor,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      };

      await db.floors.add(newFloor);

      set((state) => ({
        floors: [...state.floors, newFloor].sort(
          (a, b) => a.floorNumber - b.floorNumber
        ),
        isLoading: false,
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to add floor";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // Update floor
  updateFloor: async (id, updates) => {
    set({ isLoading: true, error: null });

    try {
      const updatedData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await db.floors.update(id, updatedData);

      set((state) => ({
        floors: state.floors.map((f) =>
          f.id === id ? { ...f, ...updatedData } : f
        ),
        isLoading: false,
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update floor";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // Delete floor
  deleteFloor: async (id) => {
    set({ isLoading: true, error: null });

    try {
      await db.floors.delete(id);

      set((state) => ({
        floors: state.floors.filter((f) => f.id !== id),
        selectedFloorId:
          state.selectedFloorId === id ? null : state.selectedFloorId,
        isLoading: false,
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete floor";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // Select floor
  selectFloor: (id) => {
    set({ selectedFloorId: id });
  },

  // Add unit to floor
  addUnit: async (floorId, unit) => {
    set({ isLoading: true, error: null });

    try {
      const { floors } = get();
      const floor = floors.find((f) => f.id === floorId);

      if (!floor) {
        throw new Error("Floor not found");
      }

      const newUnit: UnitHotspot = {
        ...unit,
        id: crypto.randomUUID(),
      };

      const updatedUnits = [...floor.units, newUnit];

      await db.floors.update(floorId, {
        units: updatedUnits,
        updatedAt: new Date().toISOString(),
      });

      set((state) => ({
        floors: state.floors.map((f) =>
          f.id === floorId ? { ...f, units: updatedUnits } : f
        ),
        isLoading: false,
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to add unit";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // Update unit
  updateUnit: async (floorId, unitId, updates) => {
    set({ isLoading: true, error: null });

    try {
      const { floors } = get();
      const floor = floors.find((f) => f.id === floorId);

      if (!floor) {
        throw new Error("Floor not found");
      }

      const updatedUnits = floor.units.map((u) =>
        u.id === unitId ? { ...u, ...updates } : u
      );

      await db.floors.update(floorId, {
        units: updatedUnits,
        updatedAt: new Date().toISOString(),
      });

      set((state) => ({
        floors: state.floors.map((f) =>
          f.id === floorId ? { ...f, units: updatedUnits } : f
        ),
        isLoading: false,
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update unit";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // Delete unit
  deleteUnit: async (floorId, unitId) => {
    set({ isLoading: true, error: null });

    try {
      const { floors } = get();
      const floor = floors.find((f) => f.id === floorId);

      if (!floor) {
        throw new Error("Floor not found");
      }

      const updatedUnits = floor.units.filter((u) => u.id !== unitId);

      await db.floors.update(floorId, {
        units: updatedUnits,
        updatedAt: new Date().toISOString(),
      });

      set((state) => ({
        floors: state.floors.map((f) =>
          f.id === floorId ? { ...f, units: updatedUnits } : f
        ),
        selectedUnitId:
          state.selectedUnitId === unitId ? null : state.selectedUnitId,
        isLoading: false,
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete unit";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // Select unit
  selectUnit: (id) => {
    set({ selectedUnitId: id });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));
