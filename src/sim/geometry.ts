import type { ModuleType, TrackModule } from "./types";

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface PortDefinition {
  id: string;
  local: [number, number];
  direction: [number, number];
}

export interface WorldPort {
  id: string;
  moduleId: string;
  position: Vec3;
  direction: Vec3;
}

export function worldPosition(module: TrackModule, localX: number, localY: number, localZ: number): Vec3 {
  const cos = Math.cos(module.rotation);
  const sin = Math.sin(module.rotation);
  return {
    x: module.position[0] + localX * cos + localZ * sin,
    y: localY,
    z: module.position[2] - localX * sin + localZ * cos,
  };
}

export function localDirectionToWorld(module: TrackModule, localX: number, localZ: number): Vec3 {
  const cos = Math.cos(module.rotation);
  const sin = Math.sin(module.rotation);
  const x = localX * cos + localZ * sin;
  const z = -localX * sin + localZ * cos;
  const length = Math.hypot(x, z) || 1;
  return { x: x / length, y: 0, z: z / length };
}

export function getModulePortDefinitions(type: ModuleType): PortDefinition[] {
  switch (type) {
    case "straight":
      return [
        { id: "A", local: [-4, 0], direction: [-1, 0] },
        { id: "B", local: [4, 0], direction: [1, 0] },
      ];
    case "station":
      return [
        { id: "A", local: [-4.4, 0], direction: [-1, 0] },
        { id: "B", local: [4.4, 0], direction: [1, 0] },
      ];
    case "curve":
      return [
        { id: "A", local: [4, 0], direction: [1, 0] },
        { id: "B", local: [0, 4], direction: [0, 1] },
      ];
    case "turnout":
      return [
        { id: "A", local: [-4, 0], direction: [-1, 0] },
        { id: "B", local: [4, 0], direction: [1, 0] },
        { id: "C", local: [3.0, -1.35], direction: [0.96, -0.28] },
      ];
    default:
      return [];
  }
}

export function moduleHasPorts(type: ModuleType): boolean {
  return getModulePortDefinitions(type).length > 0;
}

export function getWorldPorts(module: TrackModule): WorldPort[] {
  return getModulePortDefinitions(module.type).map((def) => ({
    id: def.id,
    moduleId: module.id,
    position: worldPosition(module, def.local[0], 0.18, def.local[1]),
    direction: localDirectionToWorld(module, def.direction[0], def.direction[1]),
  }));
}

export function normalizeRotation(rotation: number): number {
  const fullTurn = Math.PI * 2;
  return ((rotation % fullTurn) + fullTurn) % fullTurn;
}

export function distance(a: Vec3, b: Vec3): number {
  return Math.hypot(a.x - b.x, a.z - b.z);
}
