import type { Connection, TrackModule } from "./types";

function compareModuleOrder(leftId: string, rightId: string, moduleOrder: Map<string, number>): number {
  return (
    (moduleOrder.get(leftId) ?? Number.MAX_SAFE_INTEGER) - (moduleOrder.get(rightId) ?? Number.MAX_SAFE_INTEGER) ||
    leftId.localeCompare(rightId)
  );
}

function comparePath(leftPath: string[], rightPath: string[], moduleOrder: Map<string, number>): number {
  if (leftPath.length !== rightPath.length) {
    return leftPath.length - rightPath.length;
  }
  for (let index = 0; index < leftPath.length; index += 1) {
    const orderComparison = compareModuleOrder(rightPath[index], leftPath[index], moduleOrder);
    if (orderComparison !== 0) {
      return orderComparison;
    }
  }
  return 0;
}

export function buildConnectedRouteModuleIds(
  trackModules: TrackModule[],
  connections: Connection[],
): string[] | null {
  const moduleOrder = new Map(trackModules.map((m, index) => [m.id, index]));
  const moduleIds = new Set(moduleOrder.keys());
  const adjacency = new Map<string, Set<string>>();

  connections.forEach((c) => {
    if (!moduleIds.has(c.fromModuleId) || !moduleIds.has(c.toModuleId)) return;
    if (!adjacency.has(c.fromModuleId)) adjacency.set(c.fromModuleId, new Set());
    if (!adjacency.has(c.toModuleId)) adjacency.set(c.toModuleId, new Set());
    adjacency.get(c.fromModuleId)!.add(c.toModuleId);
    adjacency.get(c.toModuleId)!.add(c.fromModuleId);
  });

  if (adjacency.size < 2) return null;

  let bestPath: string[] = [];
  const sortedStartIds = [...adjacency.keys()].sort((l, r) => compareModuleOrder(l, r, moduleOrder));

  function visit(moduleId: string, visited: Set<string>, path: string[]): void {
    const nextPath = [...path, moduleId];
    if (comparePath(nextPath, bestPath, moduleOrder) > 0) {
      bestPath = nextPath;
    }
    const neighbors = [...(adjacency.get(moduleId) ?? [])]
      .filter((n) => !visited.has(n))
      .sort((l, r) => compareModuleOrder(l, r, moduleOrder));
    neighbors.forEach((n) => {
      const nextVisited = new Set(visited);
      nextVisited.add(n);
      visit(n, nextVisited, nextPath);
    });
  }

  sortedStartIds.forEach((id) => visit(id, new Set([id]), []));
  return bestPath.length >= 2 ? bestPath : null;
}
