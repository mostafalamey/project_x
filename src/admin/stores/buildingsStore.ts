/**
 * Buildings Store
 * Manages building configurations with floors
 */

import { create } from "zustand";
import { db } from "../services/persistence/dexieDB";
import type { BuildingConfig, FloorReference } from "../types/admin-config";

// ============================================================================
// Store Interface
// ============================================================================

interface BuildingsStore {
  // State
  buildings: BuildingConfig[];
  selectedBuildingId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadBuildings: (projectId: string) => Promise<void>;
  addBuilding: (
    building: Omit<BuildingConfig, "createdAt" | "updatedAt"> & { id?: string }
  ) => Promise<void>;
  updateBuilding: (
    id: string,
    updates: Partial<BuildingConfig>
  ) => Promise<void>;
  deleteBuilding: (id: string) => Promise<void>;
  selectBuilding: (id: string | null) => void;

  // Floor Actions
  addFloor: (
    buildingId: string,
    floor: Omit<FloorReference, "id">
  ) => Promise<void>;
  updateFloor: (
    buildingId: string,
    floorId: string,
    updates: Partial<FloorReference>
  ) => Promise<void>;
  deleteFloor: (buildingId: string, floorId: string) => Promise<void>;

  // Export
  exportBuilding: (buildingId: string) => Promise<any>;

  clearError: () => void;
}

// ============================================================================
// Store Implementation
// ============================================================================

export const useBuildingsStore = create<BuildingsStore>((set, get) => ({
  // Initial state
  buildings: [],
  selectedBuildingId: null,
  isLoading: false,
  error: null,

  // Load buildings for project
  loadBuildings: async (projectId: string) => {
    set({ isLoading: true, error: null });

    try {
      const buildings = await db.buildings
        .where("projectId")
        .equals(projectId)
        .toArray();

      set({ buildings, isLoading: false });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load buildings";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // Add building
  addBuilding: async (building) => {
    set({ isLoading: true, error: null });

    try {
      const now = new Date().toISOString();
      const newBuilding: BuildingConfig = {
        ...building,
        id: building.id || crypto.randomUUID(), // Use provided ID or generate new one
        createdAt: now,
        updatedAt: now,
      };

      await db.buildings.add(newBuilding);

      set((state) => ({
        buildings: [...state.buildings, newBuilding],
        isLoading: false,
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to add building";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // Update building
  updateBuilding: async (id, updates) => {
    set({ isLoading: true, error: null });

    try {
      const updatedData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await db.buildings.update(id, updatedData);

      set((state) => ({
        buildings: state.buildings.map((b) =>
          b.id === id ? { ...b, ...updatedData } : b
        ),
        isLoading: false,
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update building";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // Delete building
  deleteBuilding: async (id) => {
    set({ isLoading: true, error: null });

    try {
      await db.buildings.delete(id);

      set((state) => ({
        buildings: state.buildings.filter((b) => b.id !== id),
        selectedBuildingId:
          state.selectedBuildingId === id ? null : state.selectedBuildingId,
        isLoading: false,
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete building";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // Select building
  selectBuilding: (id) => {
    set({ selectedBuildingId: id });
  },

  // Add floor to building
  addFloor: async (buildingId, floor) => {
    set({ isLoading: true, error: null });

    try {
      const { buildings } = get();
      const building = buildings.find((b) => b.id === buildingId);

      if (!building) {
        throw new Error("Building not found");
      }

      const floorId = crypto.randomUUID();
      const newFloor: FloorReference = {
        ...floor,
        id: floorId,
      };

      const updatedFloors = [...building.floors, newFloor];

      await db.buildings.update(buildingId, {
        floors: updatedFloors,
        updatedAt: new Date().toISOString(),
      });

      set((state) => ({
        buildings: state.buildings.map((b) =>
          b.id === buildingId ? { ...b, floors: updatedFloors } : b
        ),
        isLoading: false,
      }));

      // Propagate floor entity to floorsStore
      const { useFloorsStore } = await import("./floorsStore");
      await useFloorsStore.getState().addFloor({
        buildingId,
        floorNumber: floor.floorNumber,
        name: floor.name,
        units: [],
        projectId: building.projectId,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to add floor";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // Update floor
  updateFloor: async (buildingId, floorId, updates) => {
    set({ isLoading: true, error: null });

    try {
      const { buildings } = get();
      const building = buildings.find((b) => b.id === buildingId);

      if (!building) {
        throw new Error("Building not found");
      }

      const updatedFloors = building.floors.map((f) =>
        f.id === floorId ? { ...f, ...updates } : f
      );

      await db.buildings.update(buildingId, {
        floors: updatedFloors,
        updatedAt: new Date().toISOString(),
      });

      set((state) => ({
        buildings: state.buildings.map((b) =>
          b.id === buildingId ? { ...b, floors: updatedFloors } : b
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
  deleteFloor: async (buildingId, floorId) => {
    set({ isLoading: true, error: null });

    try {
      const { buildings } = get();
      const building = buildings.find((b) => b.id === buildingId);

      if (!building) {
        throw new Error("Building not found");
      }

      const updatedFloors = building.floors.filter((f) => f.id !== floorId);

      await db.buildings.update(buildingId, {
        floors: updatedFloors,
        updatedAt: new Date().toISOString(),
      });

      set((state) => ({
        buildings: state.buildings.map((b) =>
          b.id === buildingId ? { ...b, floors: updatedFloors } : b
        ),
        isLoading: false,
      }));

      // Also delete from floorsStore
      const { useFloorsStore } = await import("./floorsStore");
      await useFloorsStore.getState().deleteFloor(floorId);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete floor";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // Export building to backend
  exportBuilding: async (buildingId) => {
    set({ isLoading: true, error: null });

    try {
      const { buildings } = get();
      const building = buildings.find((b) => b.id === buildingId);

      if (!building) {
        throw new Error("Building not found");
      }

      if (!building.exteriorImage) {
        throw new Error("Building exterior image is required for export");
      }

      if (building.floors.length === 0) {
        throw new Error("Building must have at least one floor to export");
      }

      // Call backend API to export building
      const response = await fetch(
        `http://localhost:3002/api/export/building/${buildingId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ building }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to export building");
      }

      const result = await response.json();
      set({ isLoading: false });

      return result;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to export building";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));
