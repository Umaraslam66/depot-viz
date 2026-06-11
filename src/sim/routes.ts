import { buildConnectedRouteModuleIds } from "./railGraph";
import type { Connection, TrackModule, WorldState } from "./types";

export interface RouteInfo {
  id: string;
  moduleIds: string[];
}

const TRAIN_HEIGHT = 0.55;

function connectedComponents(modules: TrackModule[], connections: Connection[]): Map<string, string[]> {
  const parent = new Map<string, string>();
  const find = (id: string): string => {
    let root = id;
    while (parent.get(root) !== root) root = parent.get(root)!;
    return root;
  };
  modules.forEach((m) => parent.set(m.id, m.id));
  connections.forEach((c) => {
    if (!parent.has(c.fromModuleId) || !parent.has(c.toModuleId)) return;
    parent.set(find(c.fromModuleId), find(c.toModuleId));
  });
  const groups = new Map<string, string[]>();
  modules.forEach((m) => {
    const root = find(m.id);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root)!.push(m.id);
  });
  return groups;
}

export function findRoutes(world: WorldState): RouteInfo[] {
  const groups = [...connectedComponents(world.trackModules, world.connections).values()]
    .filter((ids) => ids.length >= 2);
  const moduleOrder = new Map(world.trackModules.map((m, i) => [m.id, i]));
  groups.sort((a, b) => Math.min(...a.map((id) => moduleOrder.get(id)!)) - Math.min(...b.map((id) => moduleOrder.get(id)!)));

  const routes: RouteInfo[] = [];
  groups.forEach((ids) => {
    const idSet = new Set(ids);
    const componentModules = world.trackModules.filter((m) => idSet.has(m.id));
    const componentConnections = world.connections.filter(
      (c) => idSet.has(c.fromModuleId) && idSet.has(c.toModuleId),
    );
    const path = buildConnectedRouteModuleIds(componentModules, componentConnections);
    if (path) {
      routes.push({ id: `route-${routes.length + 1}`, moduleIds: path });
    }
  });
  return routes;
}

export function routeWaypoints(world: WorldState, route: RouteInfo): [number, number, number][] {
  const byId = new Map(world.trackModules.map((m) => [m.id, m]));
  return route.moduleIds
    .map((id) => byId.get(id))
    .filter((m): m is TrackModule => Boolean(m))
    .map((m) => [m.position[0], TRAIN_HEIGHT, m.position[2]]);
}

export function resolveTrainRoute(world: WorldState, routeId: string | null, routes: RouteInfo[]): RouteInfo | null {
  if (routes.length === 0) return null;
  return routes.find((r) => r.id === routeId) ?? routes[0];
}
