import * as THREE from "three";

export function worldPosition(moduleRecord, localX, localY, localZ) {
  const rotationValue = moduleRecord.rotation ?? 0;
  const cosValue = Math.cos(rotationValue);
  const sinValue = Math.sin(rotationValue);
  return new THREE.Vector3(
    moduleRecord.position[0] + localX * cosValue + localZ * sinValue,
    localY,
    moduleRecord.position[2] - localX * sinValue + localZ * cosValue,
  );
}

export function localDirectionToWorld(moduleRecord, localX, localZ) {
  const rotationValue = moduleRecord.rotation ?? 0;
  const cosValue = Math.cos(rotationValue);
  const sinValue = Math.sin(rotationValue);
  return new THREE.Vector3(
    localX * cosValue + localZ * sinValue,
    0,
    -localX * sinValue + localZ * cosValue,
  ).normalize();
}

export function getModulePortDefinitions(moduleType) {
  if (moduleType === "straight") {
    return [
      { id: "A", local: [-4, 0], direction: [-1, 0] },
      { id: "B", local: [4, 0], direction: [1, 0] },
    ];
  }
  if (moduleType === "station") {
    return [
      { id: "A", local: [-4.4, 0], direction: [-1, 0] },
      { id: "B", local: [4.4, 0], direction: [1, 0] },
    ];
  }
  if (moduleType === "curve") {
    return [
      { id: "A", local: [4, 0], direction: [1, 0] },
      { id: "B", local: [0, 4], direction: [0, 1] },
    ];
  }
  if (moduleType === "turnout") {
    return [
      { id: "A", local: [-4, 0], direction: [-1, 0] },
      { id: "B", local: [4, 0], direction: [1, 0] },
      { id: "C", local: [3.0, -1.35], direction: [0.96, -0.28] },
    ];
  }
  return [];
}

export function moduleHasPorts(moduleType) {
  return getModulePortDefinitions(moduleType).length > 0;
}

export function getWorldPorts(moduleRecord) {
  return getModulePortDefinitions(moduleRecord.type).map((portDefinition) => ({
    id: portDefinition.id,
    moduleId: moduleRecord.id,
    position: worldPosition(moduleRecord, portDefinition.local[0], 0.18, portDefinition.local[1]),
    direction: localDirectionToWorld(moduleRecord, portDefinition.direction[0], portDefinition.direction[1]),
    local: portDefinition.local,
    localDirection: portDefinition.direction,
  }));
}

export function normalizeRotation(rotationValue) {
  const fullTurn = Math.PI * 2;
  return ((rotationValue % fullTurn) + fullTurn) % fullTurn;
}
