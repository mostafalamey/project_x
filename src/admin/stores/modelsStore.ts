/**
 * Models Store
 * Manages apartment model configurations
 */

import { create } from "zustand";
import { db } from "../services/persistence/dexieDB";
import type { Model, Rotation360Config, ImageRef } from "../types/admin-config";

// ============================================================================
// Store Interface
// ============================================================================

interface ModelsStore {
  // State
  models: Model[];
  selectedModelId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadModels: (projectId: string) => Promise<void>;
  addModel: (model: Omit<Model, "createdAt" | "updatedAt">) => Promise<void>;
  updateModel: (id: string, updates: Partial<Model>) => Promise<void>;
  deleteModel: (id: string) => Promise<void>;
  reorderModels: (modelIds: string[]) => Promise<void>;
  selectModel: (id: string | null) => void;
  add360Rotation: (modelId: string, config: Rotation360Config) => Promise<void>;
  update360Frame: (
    modelId: string,
    frameIndex: number,
    image: ImageRef
  ) => Promise<void>;
  clearError: () => void;
}

// ============================================================================
// Store Implementation
// ============================================================================

export const useModelsStore = create<ModelsStore>((set, get) => ({
  // Initial state
  models: [],
  selectedModelId: null,
  isLoading: false,
  error: null,

  // Load models for project
  loadModels: async (projectId: string) => {
    set({ isLoading: true, error: null });

    try {
      const models = await db.models
        .where("projectId")
        .equals(projectId)
        .sortBy("displayOrder");

      set({ models, isLoading: false });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load models";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // Add new model
  addModel: async (model) => {
    set({ isLoading: true, error: null });

    try {
      const now = new Date().toISOString();
      const { models } = get();
      const newModel: Model = {
        ...model,
        // Use the provided ID from the form, don't generate UUID
        id: model.id,
        displayOrder: models.length,
        createdAt: now,
        updatedAt: now,
      };

      await db.models.add(newModel);
      set((state) => ({
        models: [...state.models, newModel],
        isLoading: false,
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to add model";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // Update model
  updateModel: async (id, updates) => {
    set({ isLoading: true, error: null });

    try {
      const updatedData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await db.models.update(id, updatedData);

      set((state) => ({
        models: state.models.map((m) =>
          m.id === id ? { ...m, ...updatedData } : m
        ),
        isLoading: false,
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update model";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // Delete model
  deleteModel: async (id) => {
    set({ isLoading: true, error: null });

    try {
      await db.models.delete(id);

      set((state) => ({
        models: state.models.filter((m) => m.id !== id),
        selectedModelId:
          state.selectedModelId === id ? null : state.selectedModelId,
        isLoading: false,
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete model";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // Reorder models
  reorderModels: async (modelIds) => {
    set({ isLoading: true, error: null });

    try {
      const { models } = get();
      const reordered = modelIds
        .map((id, index) => {
          const model = models.find((m) => m.id === id);
          if (!model) return null;
          return { ...model, displayOrder: index };
        })
        .filter(Boolean) as Model[];

      // Update all models in database
      await Promise.all(
        reordered.map((model) =>
          db.models.update(model.id, { displayOrder: model.displayOrder })
        )
      );

      set({ models: reordered, isLoading: false });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to reorder models";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // Select model
  selectModel: (id) => {
    set({ selectedModelId: id });
  },

  // Add 360° rotation
  add360Rotation: async (modelId, config) => {
    set({ isLoading: true, error: null });

    try {
      await db.models.update(modelId, {
        rotation360: config,
        updatedAt: new Date().toISOString(),
      });

      set((state) => ({
        models: state.models.map((m) =>
          m.id === modelId ? { ...m, rotation360: config } : m
        ),
        isLoading: false,
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to add 360° rotation";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // Update 360° frame
  update360Frame: async (modelId, frameIndex, image) => {
    set({ isLoading: true, error: null });

    try {
      const { models } = get();
      const model = models.find((m) => m.id === modelId);

      if (!model?.rotation360) {
        throw new Error("Model does not have 360° rotation");
      }

      const frames = [...(model.rotation360.frames || [])];
      frames[frameIndex] = image;

      await db.models.update(modelId, {
        rotation360: { ...model.rotation360, frames },
        updatedAt: new Date().toISOString(),
      });

      set((state) => ({
        models: state.models.map((m) =>
          m.id === modelId && m.rotation360
            ? {
                ...m,
                rotation360: { ...m.rotation360, frames },
              }
            : m
        ),
        isLoading: false,
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update 360° frame";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));
