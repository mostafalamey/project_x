import { create } from "zustand";

interface NavigationState {
  tourBackLocation: string | null;
  setTourBackLocation: (location: string) => void;
  clearTourBackLocation: () => void;
  modelBackLocation: string | null;
  setModelBackLocation: (location: string) => void;
  clearModelBackLocation: () => void;
}

export const useNavigationStore = create<NavigationState>()((set) => ({
  tourBackLocation: null,
  setTourBackLocation: (location: string) =>
    set({ tourBackLocation: location }),
  clearTourBackLocation: () => set({ tourBackLocation: null }),
  modelBackLocation: null,
  setModelBackLocation: (location: string) =>
    set({ modelBackLocation: location }),
  clearModelBackLocation: () => set({ modelBackLocation: null }),
}));
