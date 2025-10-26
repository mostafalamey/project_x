/**
 * Project Store
 * Manages global project configuration and metadata
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { db } from "../services/persistence/dexieDB";
import type { ProjectConfig } from "../types/admin-config";

// ============================================================================
// Store Interface
// ============================================================================

interface ProjectStore {
  // State
  config: ProjectConfig | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadProject: (id: string) => Promise<void>;
  createProject: (config: Partial<ProjectConfig>) => Promise<ProjectConfig>;
  updateProject: (updates: Partial<ProjectConfig>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setProject: (config: ProjectConfig | null) => void;
  clearError: () => void;
}

// ============================================================================
// Store Implementation
// ============================================================================

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      // Initial state
      config: null,
      isLoading: false,
      error: null,

      // Load project by ID
      loadProject: async (id: string) => {
        set({ isLoading: true, error: null });

        try {
          const project = await db.projects.get(id);

          if (!project) {
            throw new Error(`Project with ID "${id}" not found`);
          }

          set({ config: project, isLoading: false });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to load project";
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      // Create new project
      createProject: async (config: Partial<ProjectConfig>) => {
        set({ isLoading: true, error: null });

        try {
          const now = new Date().toISOString();
          const newProject: ProjectConfig = {
            id: crypto.randomUUID(),
            name: config.name || "Untitled Project",
            slug:
              config.slug || generateSlug(config.name || "untitled-project"),
            developer: config.developer || {
              name: "Developer Name",
              contact: {},
            },
            metadata: config.metadata || {},
            version: "1.0.0",
            createdAt: now,
            updatedAt: now,
          };

          await db.projects.add(newProject);
          set({ config: newProject, isLoading: false });

          return newProject;
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to create project";
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      // Update project
      updateProject: async (updates: Partial<ProjectConfig>) => {
        const { config } = get();

        if (!config) {
          throw new Error("No project loaded");
        }

        set({ isLoading: true, error: null });

        try {
          const updatedProject: ProjectConfig = {
            ...config,
            ...updates,
            updatedAt: new Date().toISOString(),
          };

          await db.projects.update(config.id, updatedProject);
          set({ config: updatedProject, isLoading: false });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to update project";
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      // Delete project
      deleteProject: async (id: string) => {
        set({ isLoading: true, error: null });

        try {
          await db.projects.delete(id);
          set({ config: null, isLoading: false });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to delete project";
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      // Set project directly
      setProject: (config: ProjectConfig | null) => {
        set({ config, error: null });
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: "project-store",
      partialize: (state) => ({
        config: state.config,
      }),
    }
  )
);

// ============================================================================
// Helper Functions
// ============================================================================

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
