import { getWorldPorts } from "./geometry";
import { findRoutes, resolveTrainRoute } from "./routes";
import { OVERLAP_TOLERANCE, isPortConnected } from "./snapping";
import type { WorldState } from "./types";

export interface ValidationWarning {
  type: "disconnected-port" | "overlap" | "route" | "disabled-train" | "conflict-scope";
  severity: "info" | "warning";
  message: string;
  position: [number, number, number];
  objectType: "module" | "train" | "conflict";
  objectId: string;
}

export function validateWorld(world: WorldState): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  world.trackModules.forEach((module) => {
    getWorldPorts(module).forEach((port) => {
      if (!isPortConnected(world.connections, module.id, port.id)) {
        warnings.push({
          type: "disconnected-port",
          severity: "info",
          message: `${module.name ?? module.type} has open port ${port.id}.`,
          position: [port.position.x, port.position.y, port.position.z],
          objectType: "module",
          objectId: module.id,
        });
      }
    });
  });

  world.trackModules.forEach((module, index) => {
    world.trackModules.slice(index + 1).forEach((other) => {
      const d = Math.hypot(module.position[0] - other.position[0], module.position[2] - other.position[2]);
      if (d < OVERLAP_TOLERANCE) {
        warnings.push({
          type: "overlap",
          severity: "warning",
          message: `${module.name ?? module.type} overlaps ${other.name ?? other.type}.`,
          position: [
            (module.position[0] + other.position[0]) / 2,
            0,
            (module.position[2] + other.position[2]) / 2,
          ],
          objectType: "module",
          objectId: module.id,
        });
      }
    });
  });

  const routes = findRoutes(world);
  world.trains.forEach((train) => {
    if (!resolveTrainRoute(world, train.routeId, routes)) {
      warnings.push({
        type: "route",
        severity: "warning",
        message: `${train.name} has no available route.`,
        position: [0, 0.1, 0],
        objectType: "train",
        objectId: train.id,
      });
    }
    if (!train.enabled) {
      warnings.push({
        type: "disabled-train",
        severity: "warning",
        message: `${train.name} is disabled.`,
        position: [0, 0.1, 0],
        objectType: "train",
        objectId: train.id,
      });
    }
  });

  world.conflicts.forEach((conflict) => {
    if (conflict.active && conflict.affectedModuleIds.length === 0 && conflict.affectedTrainIds.length === 0) {
      warnings.push({
        type: "conflict-scope",
        severity: "warning",
        message: `${conflict.label} has no affected objects.`,
        position: conflict.position,
        objectType: "conflict",
        objectId: conflict.id,
      });
    }
  });

  return warnings;
}

export function countActionableWarnings(warnings: ValidationWarning[]): number {
  return warnings.filter((w) => w.severity !== "info").length;
}
