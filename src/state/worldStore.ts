import { create } from "zustand";
import { temporal } from "zundo";
import { demoScenario } from "../sim/demoScenario";
import type { Vec3 } from "../sim/geometry";
import { planModuleMove, planModulePlacement } from "../sim/snapping";
import type {
  Conflict,
  ModuleType,
  ScenarioMeta,
  ScenarioV2,
  StoryState,
  TrackModule,
  Train,
  WorldState,
} from "../sim/types";

export interface WorldStore extends WorldState {
  nextId: number;
  meta: ScenarioMeta;
  story: StoryState;
  allocateId: (prefix: string) => string;
  replaceScenario: (scenario: ScenarioV2) => void;
  setMeta: (patch: Partial<ScenarioMeta>) => void;
  placeModule: (type: ModuleType, point: Vec3, snap: boolean, rotation: number) => string | null;
  moveModule: (moduleId: string, point: Vec3, snap: boolean) => void;
  rotateModule: (moduleId: string) => void;
  removeModule: (moduleId: string) => void;
  duplicateModule: (moduleId: string) => string | null;
  addTrain: (point: Vec3) => string;
  updateTrain: (trainId: string, patch: Partial<Train>) => void;
  removeTrain: (trainId: string) => void;
  addConflict: (point: Vec3) => string;
  updateConflict: (conflictId: string, patch: Partial<Conflict>) => void;
  moveConflict: (conflictId: string, point: Vec3) => void;
  removeConflict: (conflictId: string) => void;
}

const TRAIN_COLORS = ["#3d6ea5", "#4f9d69", "#9333ea", "#d97706", "#dc2626"];

export const useWorldStore = create<WorldStore>()(
  temporal(
    (set, get) => ({
      ...demoScenario.world,
      nextId: demoScenario.nextId,
      meta: demoScenario.meta,
      story: demoScenario.story,

      allocateId: (prefix) => {
        const id = `${prefix}${get().nextId}`;
        set({ nextId: get().nextId + 1 });
        return id;
      },

      replaceScenario: (scenario) =>
        set({
          ...scenario.world,
          nextId: scenario.nextId,
          meta: scenario.meta,
          story: scenario.story,
        }),

      setMeta: (patch) => set({ meta: { ...get().meta, ...patch } }),

      placeModule: (type, point, snap, rotation) => {
        const id = get().allocateId("m");
        const plan = planModulePlacement(get(), type, point, snap, rotation, id);
        if (plan.kind === "rejected") return null;
        set({
          trackModules: [...get().trackModules, plan.module],
          connections: plan.connection ? [...get().connections, plan.connection] : get().connections,
        });
        return id;
      },

      moveModule: (moduleId, point, snap) => {
        const plan = planModuleMove(get(), moduleId, point, snap);
        if (plan.kind !== "move") return;
        set({
          trackModules: get().trackModules.map((m) =>
            m.id === moduleId ? { ...m, position: plan.position, rotation: plan.rotation } : m,
          ),
          connections: [
            ...get().connections.filter((c) => c.fromModuleId !== moduleId && c.toModuleId !== moduleId),
            ...(plan.connection ? [plan.connection] : []),
          ],
        });
      },

      rotateModule: (moduleId) =>
        set({
          trackModules: get().trackModules.map((m) =>
            m.id === moduleId ? { ...m, rotation: (m.rotation + Math.PI / 2) % (Math.PI * 2) } : m,
          ),
          connections: get().connections.filter(
            (c) => c.fromModuleId !== moduleId && c.toModuleId !== moduleId,
          ),
        }),

      removeModule: (moduleId) =>
        set({
          trackModules: get().trackModules.filter((m) => m.id !== moduleId),
          connections: get().connections.filter(
            (c) => c.fromModuleId !== moduleId && c.toModuleId !== moduleId,
          ),
          conflicts: get().conflicts.map((c) => ({
            ...c,
            affectedModuleIds: c.affectedModuleIds.filter((id) => id !== moduleId),
          })),
        }),

      duplicateModule: (moduleId) => {
        const source = get().trackModules.find((m) => m.id === moduleId);
        if (!source) return null;
        const id = get().allocateId("m");
        const copy: TrackModule = {
          ...source,
          id,
          position: [source.position[0] + 4, 0, source.position[2] + 4],
        };
        set({ trackModules: [...get().trackModules, copy] });
        return id;
      },

      addTrain: (point) => {
        const id = get().allocateId("t");
        const train: Train = {
          id,
          name: `TR-${get().nextId}`,
          color: TRAIN_COLORS[get().trains.length % TRAIN_COLORS.length],
          speed: 6,
          startOffset: (get().trains.length * 0.21) % 1,
          enabled: true,
          routeId: null,
        };
        void point; // trains run on routes; the click point only triggers creation
        set({ trains: [...get().trains, train] });
        return id;
      },

      updateTrain: (trainId, patch) =>
        set({ trains: get().trains.map((t) => (t.id === trainId ? { ...t, ...patch } : t)) }),

      removeTrain: (trainId) =>
        set({
          trains: get().trains.filter((t) => t.id !== trainId),
          conflicts: get().conflicts.map((c) => ({
            ...c,
            affectedTrainIds: c.affectedTrainIds.filter((id) => id !== trainId),
          })),
        }),

      addConflict: (point) => {
        const id = get().allocateId("c");
        const conflict: Conflict = {
          id,
          type: "headway",
          severity: "medium",
          position: [point.x, 0, point.z],
          affectedModuleIds: [],
          affectedTrainIds: [],
          label: "New conflict",
          active: true,
        };
        set({ conflicts: [...get().conflicts, conflict] });
        return id;
      },

      updateConflict: (conflictId, patch) =>
        set({ conflicts: get().conflicts.map((c) => (c.id === conflictId ? { ...c, ...patch } : c)) }),

      moveConflict: (conflictId, point) =>
        set({
          conflicts: get().conflicts.map((c) =>
            c.id === conflictId ? { ...c, position: [point.x, 0, point.z] } : c,
          ),
        }),

      removeConflict: (conflictId) =>
        set({ conflicts: get().conflicts.filter((c) => c.id !== conflictId) }),
    }),
    {
      limit: 50,
      partialize: (state) => ({
        trackModules: state.trackModules,
        connections: state.connections,
        trains: state.trains,
        conflicts: state.conflicts,
        nextId: state.nextId,
      }),
    },
  ),
);

export function buildScenarioSnapshot(): ScenarioV2 {
  const s = useWorldStore.getState();
  return {
    version: 2,
    nextId: s.nextId,
    meta: s.meta,
    world: {
      trackModules: s.trackModules,
      connections: s.connections,
      trains: s.trains,
      conflicts: s.conflicts,
    },
    story: s.story,
  };
}
