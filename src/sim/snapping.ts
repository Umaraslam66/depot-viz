import {
  distance,
  getModulePortDefinitions,
  moduleHasPorts,
  normalizeRotation,
  worldPosition,
  getWorldPorts,
  type Vec3,
  type WorldPort,
} from "./geometry";
import type { Connection, ModuleType, TrackModule, WorldState } from "./types";

export const SNAP_TOLERANCE = 3.1;
export const OVERLAP_TOLERANCE = 2.8;
export const GRID_SIZE = 4;

export function snapToGrid(value: number): number {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

export function isPortConnected(connections: Connection[], moduleId: string, portId: string): boolean {
  return connections.some(
    (c) =>
      (c.fromModuleId === moduleId && c.fromPortId === portId) ||
      (c.toModuleId === moduleId && c.toPortId === portId),
  );
}

export function findNearestOpenPort(
  world: WorldState,
  point: Vec3,
  excludeModuleId: string | null = null,
): (WorldPort & { distance: number }) | null {
  let nearest: (WorldPort & { distance: number }) | null = null;
  world.trackModules.forEach((module) => {
    if (module.id === excludeModuleId || !moduleHasPorts(module.type)) return;
    getWorldPorts(module).forEach((port) => {
      if (isPortConnected(world.connections, module.id, port.id)) return;
      const d = distance(port.position, point);
      if (d <= SNAP_TOLERANCE && (!nearest || d < nearest.distance)) {
        nearest = { ...port, distance: d };
      }
    });
  });
  return nearest;
}

export function getPreferredSourcePortId(type: ModuleType): string | null {
  const ports = getModulePortDefinitions(type);
  if (ports.length === 0) return null;
  return ports.some((p) => p.id === "A") ? "A" : ports[0].id;
}

export function alignModulePortToTarget(
  module: TrackModule,
  sourcePortId: string,
  targetPort: WorldPort,
): TrackModule {
  const sourcePort = getModulePortDefinitions(module.type).find((p) => p.id === sourcePortId);
  if (!sourcePort) return module;
  const localAngle = Math.atan2(sourcePort.direction[1], sourcePort.direction[0]);
  const desiredAngle = Math.atan2(-targetPort.direction.z, -targetPort.direction.x);
  const aligned: TrackModule = { ...module, rotation: normalizeRotation(localAngle - desiredAngle) };
  const sourceAtOrigin = worldPosition(
    { ...aligned, position: [0, 0, 0] },
    sourcePort.local[0],
    0.18,
    sourcePort.local[1],
  );
  aligned.position = [
    targetPort.position.x - sourceAtOrigin.x,
    0,
    targetPort.position.z - sourceAtOrigin.z,
  ];
  return aligned;
}

export function moduleOverlaps(
  modules: TrackModule[],
  candidate: TrackModule,
  excludeModuleId: string | null = null,
): boolean {
  return modules.some((existing) => {
    if (existing.id === excludeModuleId || existing.id === candidate.id) return false;
    return (
      Math.hypot(existing.position[0] - candidate.position[0], existing.position[2] - candidate.position[2]) <
      OVERLAP_TOLERANCE
    );
  });
}

export type PlacementPlan =
  | { kind: "place"; module: TrackModule; connection: Connection | null }
  | { kind: "rejected"; reason: "overlap" };

export function planModulePlacement(
  world: WorldState,
  type: ModuleType,
  point: Vec3,
  snapEnabled: boolean,
  rotation = 0,
  id = "pending",
): PlacementPlan {
  let module: TrackModule = {
    id,
    type,
    position: [snapEnabled ? snapToGrid(point.x) : point.x, 0, snapEnabled ? snapToGrid(point.z) : point.z],
    rotation: normalizeRotation(rotation),
  };
  let connection: Connection | null = null;

  if (snapEnabled && moduleHasPorts(type)) {
    const targetPort = findNearestOpenPort(world, point);
    const sourcePortId = getPreferredSourcePortId(type);
    if (targetPort && sourcePortId) {
      module = alignModulePortToTarget(module, sourcePortId, targetPort);
      connection = {
        fromModuleId: targetPort.moduleId,
        fromPortId: targetPort.id,
        toModuleId: module.id,
        toPortId: sourcePortId,
      };
    }
  }

  if (moduleHasPorts(type) && moduleOverlaps(world.trackModules, module)) {
    return { kind: "rejected", reason: "overlap" };
  }
  return { kind: "place", module, connection };
}

export type MovePlan =
  | { kind: "move"; position: [number, number, number]; rotation: number; connection: Connection | null }
  | { kind: "rejected"; reason: "overlap" | "missing" };

export function planModuleMove(
  world: WorldState,
  moduleId: string,
  point: Vec3,
  snapEnabled: boolean,
): MovePlan {
  const module = world.trackModules.find((m) => m.id === moduleId);
  if (!module) return { kind: "rejected", reason: "missing" };

  let candidate: TrackModule = {
    ...module,
    position: [snapEnabled ? snapToGrid(point.x) : point.x, 0, snapEnabled ? snapToGrid(point.z) : point.z],
  };
  let connection: Connection | null = null;

  if (snapEnabled && moduleHasPorts(module.type)) {
    // Ignore the moved module's own connections when looking for a snap target.
    const detached: WorldState = {
      ...world,
      connections: world.connections.filter((c) => c.fromModuleId !== moduleId && c.toModuleId !== moduleId),
    };
    const targetPort = findNearestOpenPort(detached, point, moduleId);
    const sourcePortId = getPreferredSourcePortId(module.type);
    if (targetPort && sourcePortId) {
      candidate = alignModulePortToTarget(candidate, sourcePortId, targetPort);
      connection = {
        fromModuleId: targetPort.moduleId,
        fromPortId: targetPort.id,
        toModuleId: moduleId,
        toPortId: sourcePortId,
      };
    }
  }

  if (moduleHasPorts(module.type) && moduleOverlaps(world.trackModules, candidate, moduleId)) {
    return { kind: "rejected", reason: "overlap" };
  }
  return { kind: "move", position: candidate.position, rotation: candidate.rotation, connection };
}
