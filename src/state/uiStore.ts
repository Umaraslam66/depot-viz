import { create } from "zustand";

export type Tool = "select" | "straight" | "curve" | "turnout" | "station" | "signal" | "train" | "conflict";

export interface Selection {
  type: "module" | "train" | "conflict";
  id: string;
}

interface UiStore {
  tool: Tool;
  selection: Selection | null;
  placementRotation: number;
  snapEnabled: boolean;
  playing: boolean;
  simSpeed: number;
  quality: "performance" | "balanced" | "high";
  draggingId: string | null;
  saveStatus: "saved" | "saving" | "error";
  setTool: (tool: Tool) => void;
  setSelection: (selection: Selection | null) => void;
  rotatePlacement: () => void;
  setSnapEnabled: (on: boolean) => void;
  setPlaying: (on: boolean) => void;
  setSimSpeed: (speed: number) => void;
  setQuality: (q: UiStore["quality"]) => void;
  setDraggingId: (id: string | null) => void;
  setSaveStatus: (s: UiStore["saveStatus"]) => void;
  reset: () => void;
}

const initial = {
  tool: "select" as Tool,
  selection: null,
  placementRotation: 0,
  snapEnabled: true,
  playing: false,
  simSpeed: 1,
  quality: "balanced" as const,
  draggingId: null,
  saveStatus: "saved" as const,
};

export const useUiStore = create<UiStore>()((set, get) => ({
  ...initial,
  setTool: (tool) => set({ tool, selection: tool === "select" ? get().selection : null }),
  setSelection: (selection) => set({ selection }),
  rotatePlacement: () => set({ placementRotation: (get().placementRotation + Math.PI / 2) % (Math.PI * 2) }),
  setSnapEnabled: (snapEnabled) => set({ snapEnabled }),
  setPlaying: (playing) => set({ playing }),
  setSimSpeed: (simSpeed) => set({ simSpeed }),
  setQuality: (quality) => set({ quality }),
  setDraggingId: (draggingId) => set({ draggingId }),
  setSaveStatus: (saveStatus) => set({ saveStatus }),
  reset: () => set(initial),
}));
