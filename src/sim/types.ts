export type ModuleType = "straight" | "curve" | "turnout" | "station" | "signal";

export interface TrackModule {
  id: string;
  type: ModuleType;
  position: [number, number, number];
  rotation: number; // radians, normalized 0..2PI
  name?: string;
}

export interface Connection {
  fromModuleId: string;
  fromPortId: string;
  toModuleId: string;
  toPortId: string;
}

export interface Train {
  id: string;
  name: string;
  color: string;
  speed: number; // world units per sim second
  startOffset: number; // 0..1 along route
  enabled: boolean;
  routeId: string | null; // null = first available route
}

export type ConflictType = "headway" | "junction" | "platform" | "blocked" | "delay";

export interface Conflict {
  id: string;
  type: ConflictType;
  severity: "medium" | "high";
  position: [number, number, number];
  affectedModuleIds: string[];
  affectedTrainIds: string[];
  label: string;
  active: boolean;
}

export interface WorldState {
  trackModules: TrackModule[];
  connections: Connection[];
  trains: Train[];
  conflicts: Conflict[];
}

// Story types are defined now so the JSON format is stable; Plan 2 implements them.
export type EnvironmentPreset = "daylight" | "goldenHour" | "nightOps" | "overcast";

export interface EnvironmentSettings {
  preset: EnvironmentPreset;
  sunAzimuth: number; // radians
  fogAmount: number; // 0..1
}

export type ShotCamera =
  | { kind: "framed"; position: [number, number, number]; target: [number, number, number] }
  | { kind: "orbit"; target: [number, number, number]; radius: number; height: number }
  | { kind: "follow"; trainId: string; distance: number };

export interface Annotation {
  id: string;
  text: string;
  targetType: "module" | "train" | "conflict";
  targetId: string;
}

export interface Shot {
  id: string;
  name: string;
  durationSec: number;
  camera: ShotCamera;
  environment: EnvironmentSettings;
  simulationSpeed: number;
  caption?: string;
  visibleAnnotationIds: string[];
  transition: "fly" | "cut";
}

export interface StoryState {
  shots: Shot[];
  annotations: Annotation[];
}

export interface ScenarioMeta {
  title: string;
  author: string;
  notes: string;
}

export interface ScenarioV2 {
  version: 2;
  nextId: number;
  meta: ScenarioMeta;
  world: WorldState;
  story: StoryState;
}
