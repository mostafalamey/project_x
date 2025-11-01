/**
 * Master Plan Store
 * Manages master plan configuration with angles and transitions
 */

import { create } from "zustand";
import { db } from "../services/persistence/dexieDB";
import type {
  MasterPlanConfig,
  BuildingReference,
  AngleView,
  BuildingHotspot,
  PolygonGeometry,
  TransitionSequence,
  TourPoint,
  Point,
  ImageRef,
} from "../types/admin-config";

// ============================================================================
// Store Interface
// ============================================================================

interface MasterPlanStore {
  // State
  masterPlan: MasterPlanConfig | null;
  angles: AngleView[];
  tourPoints: TourPoint[]; // All tour points for the project
  selectedAngleId: string | null;
  selectedBuildingId: string | null;
  selectedTourPointId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions - Master Plan
  loadMasterPlan: (projectId: string) => Promise<void>;
  updateMasterPlan: (updates: Partial<MasterPlanConfig>) => Promise<void>;
  setMasterPlanImage: (image: ImageRef) => Promise<void>;

  // Actions - Buildings
  addBuilding: (building: BuildingReference) => Promise<void>;
  updateBuilding: (
    id: string,
    updates: Partial<BuildingReference>
  ) => Promise<void>;
  deleteBuilding: (id: string) => Promise<void>;
  selectBuilding: (id: string | null) => void;

  // Actions - Angles
  addAngle: (
    angle: Omit<
      AngleView,
      "id" | "masterPlanId" | "projectId" | "createdAt" | "updatedAt"
    >
  ) => Promise<void>;
  updateAngle: (id: string, updates: Partial<AngleView>) => Promise<void>;
  deleteAngle: (id: string) => Promise<void>;
  selectAngle: (id: string | null) => void;

  // Actions - Hotspots
  addHotspot: (angleId: string, geometry: PolygonGeometry) => Promise<void>;
  updateHotspot: (
    angleId: string,
    hotspotId: string,
    updates: Partial<BuildingHotspot>
  ) => Promise<void>;
  deleteHotspot: (angleId: string, hotspotId: string) => Promise<void>;

  // Actions - Transitions
  addTransitionFrames: (angleId: string, frames: ImageRef[]) => Promise<void>;
  removeTransition: (angleId: string) => Promise<void>;

  // Actions - Tour Points
  addTourPoint: (
    name: string,
    position: Point,
    angleId: string
  ) => Promise<void>;
  updateTourPointName: (tourPointId: string, name: string) => Promise<void>;
  updateTourPointPosition: (
    tourPointId: string,
    angleId: string,
    position: Point
  ) => Promise<void>;
  deleteTourPoint: (tourPointId: string) => Promise<void>;
  uploadPanoramicImage: (tourPointId: string, image: ImageRef) => Promise<void>;
  selectTourPoint: (tourPointId: string | null) => void;

  clearError: () => void;
}

// ============================================================================
// Store Implementation
// ============================================================================

export const useMasterPlanStore = create<MasterPlanStore>((set, get) => ({
  // Initial state
  masterPlan: null,
  angles: [],
  tourPoints: [],
  selectedAngleId: null,
  selectedBuildingId: null,
  selectedTourPointId: null,
  isLoading: false,
  error: null,

  // Load master plan
  loadMasterPlan: async (projectId: string) => {
    set({ isLoading: true, error: null });

    try {
      let masterPlan = await db.masterPlans
        .where("projectId")
        .equals(projectId)
        .first();

      // Create master plan if it doesn't exist
      if (!masterPlan) {
        const now = new Date().toISOString();
        const newMasterPlan: MasterPlanConfig = {
          id: crypto.randomUUID(),
          projectId,
          backgroundImage: {
            id: crypto.randomUUID(),
            filename: "",
            url: "",
            width: 0,
            height: 0,
            size: 0,
            mimeType: "image/jpeg",
            uploadedAt: now,
          },
          buildings: [],
          createdAt: now,
          updatedAt: now,
        };

        await db.masterPlans.add(newMasterPlan);
        masterPlan = newMasterPlan;
      }

      const angles = await db.angles
        .where("projectId")
        .equals(projectId)
        .toArray();

      // Ensure tourPointIds is initialized for all angles
      angles.forEach((angle) => {
        if (!angle.tourPointIds) {
          angle.tourPointIds = [];
        }
      });

      // Sort angles by sequence index
      angles.sort((a, b) => a.sequenceIndex - b.sequenceIndex);

      // Load all tour points for this project
      const tourPoints = await db.tourPoints
        .where("projectId")
        .equals(projectId)
        .toArray();

      // Auto-select first angle if none selected and angles exist
      const selectedAngleId =
        angles.length > 0 && !get().selectedAngleId
          ? angles[0].id
          : get().selectedAngleId;

      set({
        masterPlan,
        angles,
        tourPoints,
        selectedAngleId,
        isLoading: false,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load master plan";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // Update master plan
  updateMasterPlan: async (updates) => {
    const { masterPlan } = get();

    if (!masterPlan) {
      throw new Error("No master plan loaded");
    }

    set({ isLoading: true, error: null });

    try {
      const updatedData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await db.masterPlans.update(masterPlan.id, updatedData);

      set((state) => ({
        masterPlan: state.masterPlan
          ? { ...state.masterPlan, ...updatedData }
          : null,
        isLoading: false,
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update master plan";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // Set master plan image
  setMasterPlanImage: async (image) => {
    const { masterPlan } = get();

    if (!masterPlan) {
      throw new Error("No master plan loaded");
    }

    await get().updateMasterPlan({ backgroundImage: image });
  },

  // Add building
  addBuilding: async (building) => {
    const { masterPlan } = get();

    if (!masterPlan) {
      throw new Error("No master plan loaded");
    }

    set({ isLoading: true, error: null });

    try {
      const newBuilding: BuildingReference = {
        ...building,
      };

      const updatedBuildings = [...masterPlan.buildings, newBuilding];

      await db.masterPlans.update(masterPlan.id, {
        buildings: updatedBuildings,
        updatedAt: new Date().toISOString(),
      });

      set((state) => ({
        masterPlan: state.masterPlan
          ? { ...state.masterPlan, buildings: updatedBuildings }
          : null,
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
    const { masterPlan } = get();

    if (!masterPlan) {
      throw new Error("No master plan loaded");
    }

    set({ isLoading: true, error: null });

    try {
      const updatedBuildings = masterPlan.buildings.map((b) =>
        b.id === id ? { ...b, ...updates } : b
      );

      await db.masterPlans.update(masterPlan.id, {
        buildings: updatedBuildings,
        updatedAt: new Date().toISOString(),
      });

      set((state) => ({
        masterPlan: state.masterPlan
          ? { ...state.masterPlan, buildings: updatedBuildings }
          : null,
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
    const { masterPlan, angles } = get();

    if (!masterPlan) {
      throw new Error("No master plan loaded");
    }

    set({ isLoading: true, error: null });

    try {
      // Remove building from master plan
      const updatedBuildings = masterPlan.buildings.filter((b) => b.id !== id);

      // Remove all hotspots with this buildingId from all angles
      const updatedAngles = angles.map((angle) => ({
        ...angle,
        hotspots: angle.hotspots.filter((h) => h.buildingId !== id),
      }));

      // Update master plan in database
      await db.masterPlans.update(masterPlan.id, {
        buildings: updatedBuildings,
        updatedAt: new Date().toISOString(),
      });

      // Update all angles in database
      for (const angle of updatedAngles) {
        await db.angles.update(angle.id, {
          hotspots: angle.hotspots,
          updatedAt: new Date().toISOString(),
        });
      }

      set((state) => ({
        masterPlan: state.masterPlan
          ? { ...state.masterPlan, buildings: updatedBuildings }
          : null,
        angles: updatedAngles,
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

  // Add angle
  addAngle: async (angle) => {
    set({ isLoading: true, error: null });

    try {
      const now = new Date().toISOString();
      const { masterPlan } = get();

      if (!masterPlan) {
        throw new Error("No master plan loaded");
      }

      const newAngle: AngleView = {
        ...angle,
        id: crypto.randomUUID(),
        masterPlanId: masterPlan.id,
        projectId: masterPlan.projectId,
        tourPointIds: [], // Initialize empty tour point IDs array
        createdAt: now,
        updatedAt: now,
      };

      await db.angles.add(newAngle);

      set((state) => ({
        angles: [...state.angles, newAngle],
        selectedAngleId: newAngle.id, // Auto-select the newly added angle
        isLoading: false,
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to add angle";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // Update angle
  updateAngle: async (id, updates) => {
    set({ isLoading: true, error: null });

    try {
      const updatedData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await db.angles.update(id, updatedData);

      set((state) => ({
        angles: state.angles.map((a) =>
          a.id === id ? { ...a, ...updatedData } : a
        ),
        isLoading: false,
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update angle";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // Delete angle
  deleteAngle: async (id) => {
    set({ isLoading: true, error: null });

    try {
      await db.angles.delete(id);

      set((state) => ({
        angles: state.angles.filter((a) => a.id !== id),
        selectedAngleId:
          state.selectedAngleId === id ? null : state.selectedAngleId,
        isLoading: false,
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete angle";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // Select angle
  selectAngle: (id) => {
    set({ selectedAngleId: id });
  },

  // Add transition frames to angle
  addTransitionFrames: async (angleId, frames) => {
    set({ isLoading: true, error: null });

    try {
      const angle = get().angles.find((a) => a.id === angleId);

      if (!angle) {
        throw new Error("Angle not found");
      }

      // Calculate folder path based on angle sequence
      const nextAngle = get().angles.find(
        (a) => a.sequenceIndex === angle.sequenceIndex + 1
      );

      // For last angle, loop back to first angle (angle 0)
      const nextSequenceIndex = nextAngle ? nextAngle.sequenceIndex : 0;

      // Ensure frames are clean objects without blob references
      const cleanFrames = frames.map((frame) => {
        const { blob, ...cleanFrame } = frame;
        return {
          id: cleanFrame.id,
          filename: cleanFrame.filename,
          url: cleanFrame.url,
          width: cleanFrame.width,
          height: cleanFrame.height,
          size: cleanFrame.size,
          mimeType: cleanFrame.mimeType,
          uploadedAt: cleanFrame.uploadedAt,
        };
      });

      const transition: TransitionSequence = {
        folder: `/data/masterplan/transitions/angle-${angle.sequenceIndex}-to-${nextSequenceIndex}`,
        frameCount: cleanFrames.length,
        filenamePattern: "frame-{index}.jpg",
        frames: cleanFrames,
      };

      // Update in database
      await db.angles.update(angleId, {
        transitionToNext: transition,
        updatedAt: new Date().toISOString(),
      });

      // Verify it was saved
      const savedAngle = await db.angles.get(angleId);

      set((state) => ({
        angles: state.angles.map((a) =>
          a.id === angleId ? { ...a, transitionToNext: transition } : a
        ),
        isLoading: false,
      }));
    } catch (error) {
      console.error("❌ Failed to save transition:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Failed to add transition frames";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // Remove transition from angle
  removeTransition: async (angleId) => {
    set({ isLoading: true, error: null });

    try {
      await db.angles.update(angleId, {
        transitionToNext: undefined,
        updatedAt: new Date().toISOString(),
      });

      set((state) => ({
        angles: state.angles.map((a) =>
          a.id === angleId ? { ...a, transitionToNext: undefined } : a
        ),
        isLoading: false,
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to remove transition";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // Add hotspot to angle
  addHotspot: async (angleId, geometry) => {
    const { selectedBuildingId } = get();

    if (!selectedBuildingId) {
      throw new Error("No building selected");
    }

    set({ isLoading: true, error: null });

    try {
      const angle = get().angles.find((a) => a.id === angleId);

      if (!angle) {
        throw new Error("Angle not found");
      }

      const newHotspot: BuildingHotspot = {
        id: crypto.randomUUID(),
        buildingId: selectedBuildingId,
        geometry,
        label: undefined,
      };

      const updatedHotspots = [...angle.hotspots, newHotspot];

      await db.angles.update(angleId, {
        hotspots: updatedHotspots,
        updatedAt: new Date().toISOString(),
      });

      set((state) => ({
        angles: state.angles.map((a) =>
          a.id === angleId ? { ...a, hotspots: updatedHotspots } : a
        ),
        isLoading: false,
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to add hotspot";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // Update hotspot
  updateHotspot: async (angleId, hotspotId, updates) => {
    set({ isLoading: true, error: null });

    try {
      const angle = get().angles.find((a) => a.id === angleId);

      if (!angle) {
        throw new Error("Angle not found");
      }

      const updatedHotspots = angle.hotspots.map((h) =>
        h.id === hotspotId ? { ...h, ...updates } : h
      );

      await db.angles.update(angleId, {
        hotspots: updatedHotspots,
        updatedAt: new Date().toISOString(),
      });

      set((state) => ({
        angles: state.angles.map((a) =>
          a.id === angleId ? { ...a, hotspots: updatedHotspots } : a
        ),
        isLoading: false,
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update hotspot";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // Delete hotspot
  deleteHotspot: async (angleId, hotspotId) => {
    set({ isLoading: true, error: null });

    try {
      const angle = get().angles.find((a) => a.id === angleId);

      if (!angle) {
        throw new Error("Angle not found");
      }

      const updatedHotspots = angle.hotspots.filter((h) => h.id !== hotspotId);

      await db.angles.update(angleId, {
        hotspots: updatedHotspots,
        updatedAt: new Date().toISOString(),
      });

      set((state) => ({
        angles: state.angles.map((a) =>
          a.id === angleId ? { ...a, hotspots: updatedHotspots } : a
        ),
        isLoading: false,
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete hotspot";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // Add tour point - creates tour point visible on ALL angles with current position on specified angle
  addTourPoint: async (name, position, angleId) => {
    set({ isLoading: true, error: null });

    try {
      const { masterPlan, angles } = get();

      if (!masterPlan) {
        throw new Error("No master plan loaded");
      }

      const angle = angles.find((a) => a.id === angleId);
      if (!angle) {
        throw new Error("Angle not found");
      }

      const now = new Date().toISOString();
      const newTourPoint: TourPoint = {
        id: crypto.randomUUID(),
        name: name || `Tour Point ${get().tourPoints.length + 1}`,
        positions: [
          {
            angleId,
            position,
          },
        ],
        initialView: {
          yaw: 0,
          pitch: 0,
          fov: 90,
        },
        projectId: masterPlan.projectId,
        createdAt: now,
        updatedAt: now,
      };

      // Add to database
      await db.tourPoints.add(newTourPoint);

      // Add tour point ID to ALL angles
      const updatedAngles = angles.map((a) => ({
        ...a,
        tourPointIds: [...a.tourPointIds, newTourPoint.id],
      }));

      // Update all angles in database
      await Promise.all(
        updatedAngles.map((a) =>
          db.angles.update(a.id, {
            tourPointIds: a.tourPointIds,
            updatedAt: now,
          })
        )
      );

      set((state) => ({
        angles: updatedAngles,
        tourPoints: [...state.tourPoints, newTourPoint],
        selectedTourPointId: newTourPoint.id,
        isLoading: false,
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to add tour point";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // Update tour point name
  updateTourPointName: async (tourPointId, name) => {
    set({ isLoading: true, error: null });

    try {
      const now = new Date().toISOString();

      await db.tourPoints.update(tourPointId, {
        name,
        updatedAt: now,
      });

      set((state) => ({
        tourPoints: state.tourPoints.map((tp) =>
          tp.id === tourPointId ? { ...tp, name, updatedAt: now } : tp
        ),
        isLoading: false,
      }));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to update tour point name";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // Update tour point position for a specific angle
  updateTourPointPosition: async (tourPointId, angleId, position) => {
    set({ isLoading: true, error: null });

    try {
      const tourPoint = get().tourPoints.find((tp) => tp.id === tourPointId);

      if (!tourPoint) {
        throw new Error("Tour point not found");
      }

      const now = new Date().toISOString();

      // Update or add position for this angle
      const positions = [...tourPoint.positions];
      const existingIndex = positions.findIndex((p) => p.angleId === angleId);

      if (existingIndex >= 0) {
        positions[existingIndex] = { angleId, position };
      } else {
        positions.push({ angleId, position });
      }

      await db.tourPoints.update(tourPointId, {
        positions,
        updatedAt: now,
      });

      set((state) => ({
        tourPoints: state.tourPoints.map((tp) =>
          tp.id === tourPointId ? { ...tp, positions, updatedAt: now } : tp
        ),
        isLoading: false,
      }));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to update tour point position";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // Delete tour point from all angles
  deleteTourPoint: async (tourPointId) => {
    set({ isLoading: true, error: null });

    try {
      const { angles } = get();

      // Delete from tourPoints table
      await db.tourPoints.delete(tourPointId);

      // Remove tour point ID from all angles
      const updatedAngles = angles.map((a) => ({
        ...a,
        tourPointIds: a.tourPointIds.filter((id) => id !== tourPointId),
      }));

      // Update all angles in database
      const now = new Date().toISOString();
      await Promise.all(
        updatedAngles.map((a) =>
          db.angles.update(a.id, {
            tourPointIds: a.tourPointIds,
            updatedAt: now,
          })
        )
      );

      set((state) => ({
        angles: updatedAngles,
        tourPoints: state.tourPoints.filter((tp) => tp.id !== tourPointId),
        selectedTourPointId:
          state.selectedTourPointId === tourPointId
            ? null
            : state.selectedTourPointId,
        isLoading: false,
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete tour point";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // Upload panoramic image for tour point
  uploadPanoramicImage: async (tourPointId, image) => {
    set({ isLoading: true, error: null });

    try {
      const now = new Date().toISOString();

      await db.tourPoints.update(tourPointId, {
        panoramicImage: image,
        updatedAt: now,
      });

      set((state) => ({
        tourPoints: state.tourPoints.map((tp) =>
          tp.id === tourPointId
            ? { ...tp, panoramicImage: image, updatedAt: now }
            : tp
        ),
        isLoading: false,
      }));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to upload panoramic image";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // Select tour point
  selectTourPoint: (tourPointId) => {
    set({ selectedTourPointId: tourPointId });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));
