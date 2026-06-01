function compareModuleOrder(leftId, rightId, moduleOrder) {
  return (moduleOrder.get(leftId) ?? Number.MAX_SAFE_INTEGER) - (moduleOrder.get(rightId) ?? Number.MAX_SAFE_INTEGER)
    || leftId.localeCompare(rightId);
}

function comparePath(leftPath, rightPath, moduleOrder) {
  if (leftPath.length !== rightPath.length) {
    return leftPath.length - rightPath.length;
  }
  for (let index = 0; index < Math.min(leftPath.length, rightPath.length); index += 1) {
    const orderComparison = compareModuleOrder(rightPath[index], leftPath[index], moduleOrder);
    if (orderComparison !== 0) {
      return orderComparison;
    }
  }
  return 0;
}

export function buildConnectedRouteModuleIds(trackModules, connections) {
  const moduleOrder = new Map(trackModules.map((moduleRecord, index) => [moduleRecord.id, index]));
  const moduleIds = new Set(moduleOrder.keys());
  const adjacency = new Map();

  connections.forEach((connectionRecord) => {
    const fromId = connectionRecord.fromModuleId;
    const toId = connectionRecord.toModuleId;
    if (!moduleIds.has(fromId) || !moduleIds.has(toId)) {
      return;
    }
    if (!adjacency.has(fromId)) adjacency.set(fromId, new Set());
    if (!adjacency.has(toId)) adjacency.set(toId, new Set());
    adjacency.get(fromId).add(toId);
    adjacency.get(toId).add(fromId);
  });

  if (adjacency.size < 2) {
    return null;
  }

  let bestPath = [];
  const sortedStartIds = [...adjacency.keys()].sort((leftId, rightId) => compareModuleOrder(leftId, rightId, moduleOrder));

  function visit(moduleId, visited, path) {
    const nextPath = [...path, moduleId];
    if (comparePath(nextPath, bestPath, moduleOrder) > 0) {
      bestPath = nextPath;
    }
    const neighbors = [...(adjacency.get(moduleId) ?? [])]
      .filter((neighborId) => !visited.has(neighborId))
      .sort((leftId, rightId) => compareModuleOrder(leftId, rightId, moduleOrder));
    neighbors.forEach((neighborId) => {
      const nextVisited = new Set(visited);
      nextVisited.add(neighborId);
      visit(neighborId, nextVisited, nextPath);
    });
  }

  sortedStartIds.forEach((moduleId) => visit(moduleId, new Set([moduleId]), []));
  return bestPath.length >= 2 ? bestPath : null;
}

export function isActionableValidationWarning(warningRecord) {
  return warningRecord.severity !== "info";
}

export function countActionableWarnings(warnings) {
  return warnings.filter(isActionableValidationWarning).length;
}
