import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const sceneCanvas = document.querySelector(".scene-canvas");
const runStatus = document.querySelector("#run-status");
const toolButtons = [...document.querySelectorAll("[data-tool]")];
const presetButtons = [...document.querySelectorAll("[data-preset]")];
const rotateToolButton = document.querySelector("#rotate-tool");
const clearSelectionButton = document.querySelector("#clear-selection");
const playPauseButton = document.querySelector("#play-pause");
const resetTimeButton = document.querySelector("#reset-time");
const followTrainButton = document.querySelector("#follow-train");
const speedInput = document.querySelector("#scenario-speed");
const speedValue = document.querySelector("#scenario-speed-value");
const trainNameInput = document.querySelector("#train-name");
const renameTrainButton = document.querySelector("#rename-train");
const nextTrainButton = document.querySelector("#next-train");
const labelsToggle = document.querySelector("#overlay-labels");
const conflictsToggle = document.querySelector("#overlay-conflicts");
const blocksToggle = document.querySelector("#overlay-blocks");
const pathsToggle = document.querySelector("#overlay-paths");
const readoutList = document.querySelector("#scenario-readout");
const shareButton = document.querySelector("#share-scenario");

let renderer;
try {
  renderer = new THREE.WebGLRenderer({
    canvas: sceneCanvas,
    antialias: true,
    alpha: false,
  });
} catch (webglCreationError) {
  const fallbackPanel = document.createElement("div");
  fallbackPanel.className = "webgl-fallback";
  fallbackPanel.textContent = "Rail Scenario Planner needs WebGL. Try a browser with hardware graphics enabled.";
  document.body.append(fallbackPanel);
  throw webglCreationError;
}

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xdfe7ef);

const camera = new THREE.PerspectiveCamera(
  window.innerWidth <= 760 ? 50 : 42,
  window.innerWidth / window.innerHeight,
  0.1,
  260,
);
camera.position.set(38, 38, 42);

const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.dampingFactor = 0.08;
orbitControls.enablePan = true;
orbitControls.screenSpacePanning = true;
orbitControls.minDistance = 12;
orbitControls.maxDistance = 115;
orbitControls.minPolarAngle = Math.PI * 0.08;
orbitControls.maxPolarAngle = Math.PI * 0.48;
orbitControls.target.set(0, 0, 0);
orbitControls.update();

scene.add(new THREE.HemisphereLight(0xffffff, 0x9aa7b4, 1.9));
const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
keyLight.position.set(26, 44, 18);
scene.add(keyLight);
const fillLight = new THREE.DirectionalLight(0xd8e9ff, 0.8);
fillLight.position.set(-26, 24, -22);
scene.add(fillLight);

const colors = {
  ground: 0xf4f7fa,
  grid: 0xc7d2de,
  rail: 0x334155,
  sleeper: 0x8b9aaa,
  ballast: 0xd6dee8,
  platform: 0xcbd5e1,
  platformEdge: 0xf59e0b,
  station: 0x1f4b76,
  signalRed: 0xdc2626,
  signalGreen: 0x059669,
  signalMast: 0x475569,
  occupied: 0x2563eb,
  path: 0x0f766e,
  conflictLow: 0xf59e0b,
  conflictHigh: 0xdc2626,
  selection: 0x38bdf8,
};

const materials = {
  ground: new THREE.MeshStandardMaterial({ color: colors.ground, roughness: 0.86, metalness: 0.01 }),
  grid: new THREE.LineBasicMaterial({ color: colors.grid, transparent: true, opacity: 0.72 }),
  rail: new THREE.MeshStandardMaterial({ color: colors.rail, roughness: 0.36, metalness: 0.28 }),
  sleeper: new THREE.MeshStandardMaterial({ color: colors.sleeper, roughness: 0.76, metalness: 0.02 }),
  ballast: new THREE.MeshStandardMaterial({ color: colors.ballast, roughness: 0.88, metalness: 0 }),
  platform: new THREE.MeshStandardMaterial({ color: colors.platform, roughness: 0.82, metalness: 0.02 }),
  platformEdge: new THREE.MeshStandardMaterial({ color: colors.platformEdge, roughness: 0.54, metalness: 0.02 }),
  station: new THREE.MeshStandardMaterial({ color: colors.station, roughness: 0.58, metalness: 0.05 }),
  signalMast: new THREE.MeshStandardMaterial({ color: colors.signalMast, roughness: 0.46, metalness: 0.18 }),
  signalRed: new THREE.MeshStandardMaterial({
    color: colors.signalRed,
    emissive: colors.signalRed,
    emissiveIntensity: 0.5,
    roughness: 0.34,
  }),
  signalGreen: new THREE.MeshStandardMaterial({
    color: colors.signalGreen,
    emissive: colors.signalGreen,
    emissiveIntensity: 0.42,
    roughness: 0.34,
  }),
  occupied: new THREE.MeshBasicMaterial({
    color: colors.occupied,
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
    side: THREE.DoubleSide,
  }),
  path: new THREE.LineBasicMaterial({ color: colors.path, transparent: true, opacity: 0.7 }),
  selection: new THREE.MeshBasicMaterial({
    color: colors.selection,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
    side: THREE.DoubleSide,
  }),
};

const scenarioGroup = new THREE.Group();
const labelGroup = new THREE.Group();
const overlayGroup = new THREE.Group();
const trainGroup = new THREE.Group();
scene.add(scenarioGroup, overlayGroup, trainGroup, labelGroup);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const gridSize = 4;
const scenarioVersion = 1;
const moduleObjects = new Map();
const trainObjects = new Map();
const labelObjects = new Map();
const conflictObjects = new Map();
const pathCurves = new Map();
const clock = new THREE.Clock();
const scratchVector = new THREE.Vector3();
const scratchLookAt = new THREE.Vector3();
const orientationHelper = new THREE.Object3D();

let cameraPresetActive = false;
let desiredCameraPosition = camera.position.clone();
let desiredCameraTarget = orbitControls.target.clone();
let selectedTrainId = null;
let selectedModuleId = null;
let activeTool = "straight";
let toolRotation = 0;
let followingTrain = false;
let urlUpdateTimer = 0;

const appState = {
  running: true,
  time: 0,
  speed: Number(speedInput?.value ?? 1),
  overlays: {
    labels: true,
    conflicts: true,
    blocks: true,
    paths: true,
  },
};

const defaultScenario = {
  version: scenarioVersion,
  nextId: 20,
  trackModules: [
    { id: "m1", type: "station", position: [-18, 0, -4], rotation: 0, name: "Central" },
    { id: "m2", type: "straight", position: [-10, 0, -4], rotation: 0 },
    { id: "m3", type: "turnout", position: [-2, 0, -4], rotation: 0, name: "J1" },
    { id: "m4", type: "straight", position: [6, 0, -4], rotation: 0 },
    { id: "m5", type: "station", position: [15, 0, -4], rotation: 0, name: "East Park" },
    { id: "m6", type: "curve", position: [22, 0, 2], rotation: Math.PI * 0.5 },
    { id: "m7", type: "straight", position: [15, 0, 10], rotation: Math.PI },
    { id: "m8", type: "station", position: [5, 0, 10], rotation: Math.PI, name: "Airport Branch" },
    { id: "m9", type: "curve", position: [-6, 0, 6], rotation: Math.PI },
    { id: "m10", type: "straight", position: [-16, 0, 10], rotation: Math.PI },
    { id: "m11", type: "curve", position: [-24, 0, 2], rotation: Math.PI * 1.5 },
    { id: "m12", type: "signal", position: [-6, 0, -7], rotation: 0, name: "S12" },
    { id: "m13", type: "signal", position: [9, 0, -7], rotation: 0, name: "S18" },
  ],
  connections: [],
  trains: [
    {
      id: "t1",
      displayName: "IC-214",
      color: "#2563eb",
      route: "main",
      speed: 7.2,
      startOffset: 0,
      enabled: true,
    },
    {
      id: "t2",
      displayName: "RE-08",
      color: "#059669",
      route: "main",
      speed: 6.1,
      startOffset: 0.34,
      enabled: true,
    },
    {
      id: "t3",
      displayName: "FR-772",
      color: "#9333ea",
      route: "branch",
      speed: 5.2,
      startOffset: 0.18,
      enabled: true,
    },
  ],
  conflicts: [
    {
      id: "c1",
      type: "junction",
      severity: "high",
      position: [-2, 0, -4],
      affectedModuleIds: ["m3"],
      affectedTrainIds: ["t1", "t2"],
      label: "Junction J1 crossing move",
      active: true,
    },
    {
      id: "c2",
      type: "platform",
      severity: "medium",
      position: [15, 0, -4],
      affectedModuleIds: ["m5"],
      affectedTrainIds: ["t2"],
      label: "Platform 2 occupied",
      active: true,
    },
    {
      id: "c3",
      type: "blocked",
      severity: "high",
      position: [6, 0, -4],
      affectedModuleIds: ["m4"],
      affectedTrainIds: ["t1"],
      label: "Maintenance possession on block B4",
      active: true,
    },
  ],
  view: {
    preset: "overview",
    speed: 1,
    overlays: {
      labels: true,
      conflicts: true,
      blocks: true,
      paths: true,
    },
  },
};

let scenario = loadScenarioFromUrl() ?? structuredClone(defaultScenario);
selectedTrainId = scenario.trains.find((trainRecord) => trainRecord.enabled)?.id ?? scenario.trains[0]?.id ?? null;

const cameraPresets = {
  overview: {
    position: new THREE.Vector3(36, 38, 42),
    target: new THREE.Vector3(0, 0, 0),
  },
  station: {
    position: new THREE.Vector3(7, 17, 24),
    target: new THREE.Vector3(15, 1, -4),
  },
  junction: {
    position: new THREE.Vector3(-14, 18, 18),
    target: new THREE.Vector3(-2, 1, -4),
  },
  blocks: {
    position: new THREE.Vector3(2, 30, 18),
    target: new THREE.Vector3(2, 0, 1),
  },
};

function structuredClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadScenarioFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const encodedScenario = urlParams.get("scenario");
  if (!encodedScenario) {
    return null;
  }

  try {
    const decodedJson = decodeURIComponent(escape(atob(encodedScenario)));
    const parsedScenario = JSON.parse(decodedJson);
    if (!Array.isArray(parsedScenario.trackModules) || !Array.isArray(parsedScenario.trains)) {
      return null;
    }
    return {
      ...structuredClone(defaultScenario),
      ...parsedScenario,
      view: {
        ...defaultScenario.view,
        ...(parsedScenario.view ?? {}),
        overlays: {
          ...defaultScenario.view.overlays,
          ...(parsedScenario.view?.overlays ?? {}),
        },
      },
    };
  } catch {
    return null;
  }
}

function encodeScenario() {
  const shareScenario = {
    version: scenarioVersion,
    nextId: scenario.nextId,
    trackModules: scenario.trackModules,
    connections: scenario.connections,
    trains: scenario.trains,
    conflicts: scenario.conflicts,
    view: {
      preset: scenario.view.preset,
      speed: appState.speed,
      overlays: appState.overlays,
    },
  };
  const jsonValue = JSON.stringify(shareScenario);
  return btoa(unescape(encodeURIComponent(jsonValue)));
}

function scheduleUrlUpdate() {
  urlUpdateTimer = 0.8;
}

function commitScenarioToUrl() {
  const nextUrl = new URL(window.location.href);
  nextUrl.searchParams.set("scenario", encodeScenario());
  window.history.replaceState(null, "", nextUrl);
}

function createGround() {
  const groundMesh = new THREE.Mesh(new THREE.BoxGeometry(84, 0.35, 58), materials.ground);
  groundMesh.position.y = -0.2;
  scene.add(groundMesh);

  const gridLines = [];
  for (let gridLine = -40; gridLine <= 40; gridLine += gridSize) {
    gridLines.push(new THREE.Vector3(gridLine, 0.02, -28), new THREE.Vector3(gridLine, 0.02, 28));
  }
  for (let gridLine = -28; gridLine <= 28; gridLine += gridSize) {
    gridLines.push(new THREE.Vector3(-40, 0.02, gridLine), new THREE.Vector3(40, 0.02, gridLine));
  }
  const gridGeometry = new THREE.BufferGeometry().setFromPoints(gridLines);
  scene.add(new THREE.LineSegments(gridGeometry, materials.grid));

  const axisMaterial = new THREE.LineBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.72 });
  const axisGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-40, 0.035, 0),
    new THREE.Vector3(40, 0.035, 0),
    new THREE.Vector3(0, 0.035, -28),
    new THREE.Vector3(0, 0.035, 28),
  ]);
  scene.add(new THREE.LineSegments(axisGeometry, axisMaterial));
}

function createTextTexture(textValue, options = {}) {
  const canvas = document.createElement("canvas");
  const width = options.width ?? 512;
  const height = options.height ?? 160;
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  const bg = options.background ?? "rgba(255, 255, 255, 0.94)";
  const fg = options.color ?? "#111827";
  context.clearRect(0, 0, width, height);
  context.fillStyle = bg;
  roundRect(context, 8, 8, width - 16, height - 16, 18);
  context.fill();
  context.strokeStyle = options.border ?? "rgba(148, 163, 184, 0.75)";
  context.lineWidth = 4;
  roundRect(context, 8, 8, width - 16, height - 16, 18);
  context.stroke();
  context.fillStyle = fg;
  context.font = `700 ${options.fontSize ?? 46}px Inter, Segoe UI, Arial, sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(textValue, width * 0.5, height * 0.52, width - 42);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function roundRect(context, xValue, yValue, widthValue, heightValue, radiusValue) {
  context.beginPath();
  context.moveTo(xValue + radiusValue, yValue);
  context.arcTo(xValue + widthValue, yValue, xValue + widthValue, yValue + heightValue, radiusValue);
  context.arcTo(xValue + widthValue, yValue + heightValue, xValue, yValue + heightValue, radiusValue);
  context.arcTo(xValue, yValue + heightValue, xValue, yValue, radiusValue);
  context.arcTo(xValue, yValue, xValue + widthValue, yValue, radiusValue);
  context.closePath();
}

function createLabelSprite(textValue, positionValue, options = {}) {
  const spriteMaterial = new THREE.SpriteMaterial({
    map: createTextTexture(textValue, options),
    transparent: true,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.position.copy(positionValue);
  sprite.scale.set(options.scaleX ?? 5.2, options.scaleY ?? 1.28, 1);
  labelGroup.add(sprite);
  return sprite;
}

function clearGroup(groupValue) {
  while (groupValue.children.length > 0) {
    groupValue.remove(groupValue.children[groupValue.children.length - 1]);
  }
}

function addBox(targetGroup, dimensions, position, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(dimensions[0], dimensions[1], dimensions[2]), material);
  mesh.position.set(position[0], position[1], position[2]);
  targetGroup.add(mesh);
  return mesh;
}

function addRailPair(targetGroup, lengthValue, material = materials.rail) {
  [-0.62, 0.62].forEach((zOffset) => {
    addBox(targetGroup, [lengthValue, 0.16, 0.12], [0, 0.2, zOffset], material);
  });
  const sleeperCount = Math.max(4, Math.round(lengthValue / 1.15));
  for (let sleeperIndex = 0; sleeperIndex < sleeperCount; sleeperIndex += 1) {
    const xValue = -lengthValue * 0.5 + (sleeperIndex + 0.5) * (lengthValue / sleeperCount);
    addBox(targetGroup, [0.18, 0.12, 1.72], [xValue, 0.08, 0], materials.sleeper);
  }
}

function addCurveRails(targetGroup, radiusValue, angleValue) {
  const railMaterial = materials.rail;
  const sleeperMaterial = materials.sleeper;
  [-0.62, 0.62].forEach((offsetValue) => {
    const curve = new THREE.EllipseCurve(0, 0, radiusValue + offsetValue, radiusValue + offsetValue, 0, angleValue, false, 0);
    const points = curve.getPoints(48).map((pointValue) => new THREE.Vector3(pointValue.x, 0.2, pointValue.y));
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const railLine = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: railMaterial.color }));
    targetGroup.add(railLine);
  });

  for (let sleeperIndex = 0; sleeperIndex < 12; sleeperIndex += 1) {
    const angle = (angleValue / 11) * sleeperIndex;
    const sleeper = addBox(targetGroup, [0.14, 0.12, 1.75], [Math.cos(angle) * radiusValue, 0.08, Math.sin(angle) * radiusValue], sleeperMaterial);
    sleeper.rotation.y = -angle;
  }
}

function createTrackModuleObject(moduleRecord) {
  const moduleGroup = new THREE.Group();
  moduleGroup.userData.moduleId = moduleRecord.id;
  moduleGroup.position.set(moduleRecord.position[0], moduleRecord.position[1], moduleRecord.position[2]);
  moduleGroup.rotation.y = moduleRecord.rotation ?? 0;

  if (moduleRecord.type === "straight") {
    addBox(moduleGroup, [8.2, 0.12, 2.2], [0, 0.01, 0], materials.ballast);
    addRailPair(moduleGroup, 8);
  } else if (moduleRecord.type === "curve") {
    addBox(moduleGroup, [8.2, 0.1, 8.2], [2.05, 0.005, 2.05], materials.ballast);
    addCurveRails(moduleGroup, 4, Math.PI * 0.5);
  } else if (moduleRecord.type === "turnout") {
    addBox(moduleGroup, [8.4, 0.12, 3.3], [0, 0.01, 0.35], materials.ballast);
    addRailPair(moduleGroup, 8);
    const divergeGroup = new THREE.Group();
    divergeGroup.position.set(-0.2, 0, 0.22);
    divergeGroup.rotation.y = -Math.PI * 0.14;
    addRailPair(divergeGroup, 6.4);
    moduleGroup.add(divergeGroup);
    createLabelSprite(moduleRecord.name ?? "Junction", worldPosition(moduleRecord, 0, 2.1, -2.4), { scaleX: 3.3, scaleY: 0.86, fontSize: 38 });
  } else if (moduleRecord.type === "station") {
    addBox(moduleGroup, [9.2, 0.12, 2.2], [0, 0.01, 0], materials.ballast);
    addRailPair(moduleGroup, 8.8);
    addBox(moduleGroup, [8.8, 0.42, 1.35], [0, 0.26, 1.92], materials.platform);
    addBox(moduleGroup, [8.8, 0.12, 0.12], [0, 0.54, 1.22], materials.platformEdge);
    addBox(moduleGroup, [2.3, 1.08, 1.05], [-2.5, 0.86, 2.02], materials.station);
    createLabelSprite(moduleRecord.name ?? "Station", worldPosition(moduleRecord, 0, 2.55, 2.85), { scaleX: 4.4, scaleY: 1.05, fontSize: 42 });
  } else if (moduleRecord.type === "signal") {
    addBox(moduleGroup, [0.28, 2.2, 0.28], [0, 1.1, 0], materials.signalMast);
    addBox(moduleGroup, [0.95, 0.54, 0.24], [0.34, 2.2, 0], materials.signalMast);
    const redLamp = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), materials.signalRed);
    redLamp.position.set(0.05, 2.22, 0.16);
    moduleGroup.add(redLamp);
    const greenLamp = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), materials.signalGreen);
    greenLamp.position.set(0.55, 2.22, 0.16);
    moduleGroup.add(greenLamp);
    createLabelSprite(moduleRecord.name ?? "Signal", worldPosition(moduleRecord, 0, 3.0, 0), { scaleX: 2.8, scaleY: 0.82, fontSize: 38 });
  }

  if (selectedModuleId === moduleRecord.id) {
    const selectionRing = new THREE.Mesh(new THREE.RingGeometry(2.7, 3.05, 48), materials.selection);
    selectionRing.rotation.x = -Math.PI * 0.5;
    selectionRing.position.y = 0.08;
    moduleGroup.add(selectionRing);
  }

  return moduleGroup;
}

function worldPosition(moduleRecord, localX, localY, localZ) {
  const rotationValue = moduleRecord.rotation ?? 0;
  const cosValue = Math.cos(rotationValue);
  const sinValue = Math.sin(rotationValue);
  return new THREE.Vector3(
    moduleRecord.position[0] + localX * cosValue + localZ * sinValue,
    localY,
    moduleRecord.position[2] - localX * sinValue + localZ * cosValue,
  );
}

function createConflictObject(conflictRecord) {
  const conflictGroup = new THREE.Group();
  const isHighSeverity = conflictRecord.severity === "high";
  const colorValue = isHighSeverity ? colors.conflictHigh : colors.conflictLow;
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: colorValue,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const fillMaterial = new THREE.MeshBasicMaterial({
    color: colorValue,
    transparent: true,
    opacity: 0.12,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const ringMesh = new THREE.Mesh(new THREE.RingGeometry(1.65, 2.0, 48), ringMaterial);
  ringMesh.rotation.x = -Math.PI * 0.5;
  ringMesh.position.y = 0.14;
  conflictGroup.add(ringMesh);
  const fillMesh = new THREE.Mesh(new THREE.CircleGeometry(1.62, 48), fillMaterial);
  fillMesh.rotation.x = -Math.PI * 0.5;
  fillMesh.position.y = 0.13;
  conflictGroup.add(fillMesh);
  const poleMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.2, 12), ringMaterial);
  poleMesh.position.y = 1.15;
  conflictGroup.add(poleMesh);
  conflictGroup.position.set(conflictRecord.position[0], 0, conflictRecord.position[2]);
  createLabelSprite(conflictRecord.label, new THREE.Vector3(conflictRecord.position[0], 3.15, conflictRecord.position[2]), {
    background: isHighSeverity ? "rgba(254, 242, 242, 0.96)" : "rgba(255, 251, 235, 0.96)",
    border: isHighSeverity ? "rgba(220, 38, 38, 0.85)" : "rgba(217, 119, 6, 0.85)",
    color: isHighSeverity ? "#991b1b" : "#92400e",
    scaleX: 6.1,
    scaleY: 1.05,
    fontSize: 36,
  });
  return conflictGroup;
}

function getMainRoutePoints() {
  return [
    new THREE.Vector3(-20, 0.38, -4),
    new THREE.Vector3(-10, 0.38, -4),
    new THREE.Vector3(-2, 0.38, -4),
    new THREE.Vector3(8, 0.38, -4),
    new THREE.Vector3(17, 0.38, -4),
    new THREE.Vector3(24, 0.38, 3),
    new THREE.Vector3(17, 0.38, 10),
    new THREE.Vector3(5, 0.38, 10),
    new THREE.Vector3(-8, 0.38, 8),
    new THREE.Vector3(-20, 0.38, 10),
    new THREE.Vector3(-26, 0.38, 2),
    new THREE.Vector3(-20, 0.38, -4),
  ];
}

function getBranchRoutePoints() {
  return [
    new THREE.Vector3(-2, 0.5, -4),
    new THREE.Vector3(2, 0.5, 0),
    new THREE.Vector3(5, 0.5, 6),
    new THREE.Vector3(5, 0.5, 10),
    new THREE.Vector3(10, 0.5, 10),
    new THREE.Vector3(17, 0.5, 10),
  ];
}

function getRouteCurve(routeName) {
  if (pathCurves.has(routeName)) {
    return pathCurves.get(routeName);
  }
  const routePoints = routeName === "branch" ? getBranchRoutePoints() : getMainRoutePoints();
  const routeCurve = new THREE.CatmullRomCurve3(routePoints, routeName !== "branch", "centripetal", 0.08);
  pathCurves.set(routeName, routeCurve);
  return routeCurve;
}

function createPathOverlay(routeName) {
  const routeCurve = getRouteCurve(routeName);
  const points = routeCurve.getSpacedPoints(routeName === "branch" ? 90 : 180);
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  return new THREE.Line(geometry, materials.path);
}

function createTrainObject(trainRecord) {
  const group = new THREE.Group();
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(trainRecord.color),
    roughness: 0.5,
    metalness: 0.05,
  });
  const roofMaterial = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.46, metalness: 0.04 });
  const windowMaterial = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    emissive: 0x1e3a8a,
    emissiveIntensity: 0.16,
    roughness: 0.3,
  });

  addBox(group, [2.35, 0.72, 0.92], [0, 0.68, 0], bodyMaterial);
  addBox(group, [2.0, 0.16, 0.78], [0, 1.12, 0], roofMaterial);
  [-0.62, 0, 0.62].forEach((xValue) => {
    addBox(group, [0.32, 0.24, 0.04], [xValue, 0.78, 0.48], windowMaterial);
    addBox(group, [0.32, 0.24, 0.04], [xValue, 0.78, -0.48], windowMaterial);
  });
  [-0.72, 0.72].forEach((xValue) => {
    [-0.48, 0.48].forEach((zValue) => {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.12, 16), materials.rail);
      wheel.position.set(xValue, 0.28, zValue);
      wheel.rotation.x = Math.PI * 0.5;
      group.add(wheel);
    });
  });

  const haloMaterial = new THREE.MeshBasicMaterial({
    color: selectedTrainId === trainRecord.id ? colors.selection : new THREE.Color(trainRecord.color),
    transparent: true,
    opacity: selectedTrainId === trainRecord.id ? 0.32 : 0.14,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const halo = new THREE.Mesh(new THREE.CircleGeometry(1.65, 40), haloMaterial);
  halo.rotation.x = -Math.PI * 0.5;
  halo.position.y = 0.04;
  group.add(halo);

  return group;
}

function updateOverlayVisibility() {
  labelGroup.visible = appState.overlays.labels;
  overlayGroup.children.forEach((overlayObject) => {
    overlayObject.visible = true;
  });
  conflictObjects.forEach((conflictObject) => {
    conflictObject.visible = appState.overlays.conflicts;
  });
  overlayGroup.children.forEach((childObject) => {
    if (childObject.isLine) {
      childObject.visible = appState.overlays.paths;
    }
  });
}

function updateSelectedTrain() {
  scenario.trains.forEach((trainRecord) => {
    const trainObject = trainObjects.get(trainRecord.id);
    if (!trainObject) {
      return;
    }
    const haloMesh = trainObject.children.find((childObject) => childObject.geometry?.type === "CircleGeometry");
    if (haloMesh) {
      haloMesh.material.opacity = trainRecord.id === selectedTrainId ? 0.34 : 0.12;
      haloMesh.material.color.set(trainRecord.id === selectedTrainId ? colors.selection : trainRecord.color);
    }
  });
  updateTrainNameInput();
}

function updateTrainNameInput() {
  const selectedTrain = scenario.trains.find((trainRecord) => trainRecord.id === selectedTrainId);
  if (trainNameInput && selectedTrain) {
    trainNameInput.value = selectedTrain.displayName;
  }
}

function updateReadout() {
  const activeConflicts = scenario.conflicts.filter((conflictRecord) => conflictRecord.active);
  const enabledTrains = scenario.trains.filter((trainRecord) => trainRecord.enabled);
  const items = [
    `${enabledTrains.length} trains active across ${scenario.trackModules.length} planning objects.`,
    "Block occupancy shown as blue section bands.",
  ];

  activeConflicts.forEach((conflictRecord) => {
    const trainNames = conflictRecord.affectedTrainIds
      .map((trainId) => scenario.trains.find((trainRecord) => trainRecord.id === trainId)?.displayName)
      .filter(Boolean)
      .join(", ");
    items.push(`${conflictRecord.label}${trainNames ? `: ${trainNames}` : ""}`);
  });

  readoutList.replaceChildren(
    ...items.map((itemText, itemIndex) => {
      const listItem = document.createElement("li");
      listItem.textContent = itemText;
      if (itemIndex >= 2) {
        listItem.className = itemText.toLowerCase().includes("maintenance") ? "is-danger" : "is-warning";
      }
      return listItem;
    }),
  );
}

function setCameraPreset(presetName) {
  const presetValue = cameraPresets[presetName] ?? cameraPresets.overview;
  desiredCameraPosition.copy(presetValue.position);
  desiredCameraTarget.copy(presetValue.target);
  cameraPresetActive = true;
  followingTrain = false;
  scenario.view.preset = presetName;
  presetButtons.forEach((buttonElement) => {
    buttonElement.classList.toggle("is-active", buttonElement.dataset.preset === presetName);
  });
  followTrainButton?.classList.remove("is-active");
  scheduleUrlUpdate();
}

function snapToGrid(value) {
  return Math.round(value / gridSize) * gridSize;
}

function pointerToGround(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  raycaster.ray.intersectPlane(groundPlane, scratchVector);
  return scratchVector.clone();
}

function nextId(prefix) {
  const idValue = `${prefix}${scenario.nextId}`;
  scenario.nextId += 1;
  return idValue;
}

function addScenarioObject(positionValue) {
  const snappedPosition = [snapToGrid(positionValue.x), 0, snapToGrid(positionValue.z)];

  if (activeTool === "train") {
    const trainRecord = {
      id: nextId("t"),
      displayName: `Train ${scenario.trains.length + 1}`,
      color: ["#2563eb", "#059669", "#d97706", "#9333ea", "#dc2626"][scenario.trains.length % 5],
      route: snappedPosition[2] > 4 ? "branch" : "main",
      speed: 5.8 + (scenario.trains.length % 3) * 0.7,
      startOffset: (scenario.trains.length * 0.18) % 1,
      enabled: true,
    };
    scenario.trains.push(trainRecord);
    selectedTrainId = trainRecord.id;
  } else if (activeTool === "conflict") {
    scenario.conflicts.push({
      id: nextId("c"),
      type: "headway",
      severity: "medium",
      position: snappedPosition,
      affectedModuleIds: [],
      affectedTrainIds: scenario.trains.slice(0, 2).map((trainRecord) => trainRecord.id),
      label: "Headway conflict",
      active: true,
    });
  } else {
    const moduleRecord = {
      id: nextId("m"),
      type: activeTool,
      position: snappedPosition,
      rotation: toolRotation,
    };
    if (activeTool === "station") {
      moduleRecord.name = `Station ${scenario.trackModules.filter((moduleValue) => moduleValue.type === "station").length + 1}`;
    }
    if (activeTool === "turnout") {
      moduleRecord.name = `J${scenario.trackModules.filter((moduleValue) => moduleValue.type === "turnout").length + 1}`;
    }
    if (activeTool === "signal") {
      moduleRecord.name = `S${scenario.trackModules.filter((moduleValue) => moduleValue.type === "signal").length + 1}`;
    }
    scenario.trackModules.push(moduleRecord);
    selectedModuleId = moduleRecord.id;
  }

  rebuildScenario();
  scheduleUrlUpdate();
}

function createOccupancyBand(trainRecord, positionValue, tangentValue) {
  const bandMaterial = materials.occupied.clone();
  const bandMesh = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 2.3), bandMaterial);
  bandMesh.rotation.x = -Math.PI * 0.5;
  bandMesh.position.copy(positionValue);
  bandMesh.position.y = 0.12;
  bandMesh.rotation.z = Math.atan2(-tangentValue.z, tangentValue.x);
  bandMesh.visible = appState.overlays.blocks;
  overlayGroup.add(bandMesh);
  return { trainId: trainRecord.id, mesh: bandMesh };
}

const occupancyBands = [];

function rebuildOccupancyBands() {
  occupancyBands.splice(0, occupancyBands.length);
  scenario.trains.forEach((trainRecord) => {
    if (!trainRecord.enabled) {
      return;
    }
    const routeCurve = getRouteCurve(trainRecord.route);
    const positionValue = routeCurve.getPointAt(trainRecord.startOffset);
    const tangentValue = routeCurve.getTangentAt(trainRecord.startOffset).normalize();
    occupancyBands.push(createOccupancyBand(trainRecord, positionValue, tangentValue));
  });
}

function rebuildScenario() {
  moduleObjects.clear();
  trainObjects.clear();
  labelObjects.clear();
  conflictObjects.clear();
  pathCurves.clear();
  clearGroup(scenarioGroup);
  clearGroup(trainGroup);
  clearGroup(labelGroup);
  clearGroup(overlayGroup);

  scenario.trackModules.forEach((moduleRecord) => {
    const moduleObject = createTrackModuleObject(moduleRecord);
    scenarioGroup.add(moduleObject);
    moduleObjects.set(moduleRecord.id, moduleObject);
  });

  ["main", "branch"].forEach((routeName) => {
    const overlay = createPathOverlay(routeName);
    overlay.visible = appState.overlays.paths;
    overlayGroup.add(overlay);
  });

  scenario.trains.forEach((trainRecord) => {
    const trainObject = createTrainObject(trainRecord);
    trainObject.visible = trainRecord.enabled;
    trainGroup.add(trainObject);
    trainObjects.set(trainRecord.id, trainObject);
    const labelSprite = createLabelSprite(trainRecord.displayName, new THREE.Vector3(0, 2.5, 0), {
      scaleX: 3.6,
      scaleY: 0.86,
      fontSize: 42,
    });
    labelObjects.set(trainRecord.id, labelSprite);
  });

  scenario.conflicts.forEach((conflictRecord) => {
    if (!conflictRecord.active) {
      return;
    }
    const conflictObject = createConflictObject(conflictRecord);
    conflictObject.visible = appState.overlays.conflicts;
    overlayGroup.add(conflictObject);
    conflictObjects.set(conflictRecord.id, conflictObject);
  });

  rebuildOccupancyBands();
  updateTrainNameInput();
  updateReadout();
  updateOverlayVisibility();
}

function updateTrainPositions(deltaTime) {
  if (appState.running) {
    appState.time += deltaTime * appState.speed;
  }

  scenario.trains.forEach((trainRecord) => {
    const trainObject = trainObjects.get(trainRecord.id);
    const labelObject = labelObjects.get(trainRecord.id);
    if (!trainObject || !trainRecord.enabled) {
      return;
    }
    const routeCurve = getRouteCurve(trainRecord.route);
    const routeLength = routeCurve.getLength();
    const ratio = ((trainRecord.startOffset + (appState.time * trainRecord.speed) / routeLength) % 1 + 1) % 1;
    const positionValue = routeCurve.getPointAt(ratio);
    const tangentValue = routeCurve.getTangentAt(ratio).normalize();
    trainObject.position.copy(positionValue);
    scratchLookAt.copy(positionValue).add(tangentValue);
    orientationHelper.position.copy(positionValue);
    orientationHelper.lookAt(scratchLookAt);
    trainObject.quaternion.copy(orientationHelper.quaternion);

    if (labelObject) {
      labelObject.position.set(positionValue.x, positionValue.y + 2.6, positionValue.z);
      labelObject.visible = appState.overlays.labels;
    }

    const occupancyBand = occupancyBands.find((bandRecord) => bandRecord.trainId === trainRecord.id);
    if (occupancyBand) {
      occupancyBand.mesh.position.set(positionValue.x, 0.12, positionValue.z);
      occupancyBand.mesh.rotation.z = Math.atan2(-tangentValue.z, tangentValue.x);
      occupancyBand.mesh.visible = appState.overlays.blocks;
    }
  });
}

function updateConflicts(elapsedTime) {
  conflictObjects.forEach((conflictObject, conflictId) => {
    const conflictRecord = scenario.conflicts.find((itemRecord) => itemRecord.id === conflictId);
    if (!conflictRecord?.active) {
      conflictObject.visible = false;
      return;
    }
    const pulseValue = 1 + Math.sin(elapsedTime * 4.4) * 0.06;
    conflictObject.scale.setScalar(pulseValue);
    conflictObject.visible = appState.overlays.conflicts;
  });
}

function updateCamera(deltaTime) {
  if (followingTrain && selectedTrainId) {
    const trainObject = trainObjects.get(selectedTrainId);
    if (trainObject) {
      const forwardVector = new THREE.Vector3(0, 0, 1).applyQuaternion(trainObject.quaternion).normalize();
      const rightVector = new THREE.Vector3(forwardVector.z, 0, -forwardVector.x).normalize();
      const targetPosition = trainObject.position
        .clone()
        .add(forwardVector.clone().multiplyScalar(-14))
        .add(rightVector.multiplyScalar(5))
        .add(new THREE.Vector3(0, 9, 0));
      const targetLook = trainObject.position.clone().add(forwardVector.multiplyScalar(6)).add(new THREE.Vector3(0, 1.5, 0));
      camera.position.lerp(targetPosition, 1 - Math.exp(-deltaTime * 4.2));
      orbitControls.target.lerp(targetLook, 1 - Math.exp(-deltaTime * 4.6));
      orbitControls.update();
      return;
    }
  }

  if (cameraPresetActive) {
    camera.position.lerp(desiredCameraPosition, 1 - Math.exp(-deltaTime * 4.2));
    orbitControls.target.lerp(desiredCameraTarget, 1 - Math.exp(-deltaTime * 4.2));
    orbitControls.update();
    if (camera.position.distanceTo(desiredCameraPosition) < 0.08 && orbitControls.target.distanceTo(desiredCameraTarget) < 0.08) {
      cameraPresetActive = false;
    }
    return;
  }

  orbitControls.update();
}

function syncControls() {
  if (speedValue) {
    speedValue.textContent = `${appState.speed.toFixed(2)}x`;
  }
  if (speedInput) {
    speedInput.value = String(appState.speed);
  }
  if (runStatus) {
    runStatus.textContent = appState.running ? "Running" : "Paused";
  }
  if (playPauseButton) {
    playPauseButton.textContent = appState.running ? "Pause" : "Play";
  }
}

function selectTool(toolName) {
  activeTool = toolName;
  toolButtons.forEach((buttonElement) => {
    buttonElement.classList.toggle("is-active", buttonElement.dataset.tool === toolName);
  });
}

function wireInterface() {
  toolButtons.forEach((buttonElement) => {
    buttonElement.addEventListener("click", () => selectTool(buttonElement.dataset.tool));
  });

  rotateToolButton?.addEventListener("click", () => {
    toolRotation = (toolRotation + Math.PI * 0.5) % (Math.PI * 2);
  });

  clearSelectionButton?.addEventListener("click", () => {
    selectedModuleId = null;
    followingTrain = false;
    followTrainButton?.classList.remove("is-active");
    rebuildScenario();
  });

  playPauseButton?.addEventListener("click", () => {
    appState.running = !appState.running;
    syncControls();
    scheduleUrlUpdate();
  });

  resetTimeButton?.addEventListener("click", () => {
    appState.time = 0;
    scheduleUrlUpdate();
  });

  followTrainButton?.addEventListener("click", () => {
    followingTrain = !followingTrain;
    cameraPresetActive = false;
    followTrainButton.classList.toggle("is-active", followingTrain);
  });

  speedInput?.addEventListener("input", () => {
    appState.speed = Number(speedInput.value);
    scenario.view.speed = appState.speed;
    syncControls();
    scheduleUrlUpdate();
  });

  renameTrainButton?.addEventListener("click", () => {
    const selectedTrain = scenario.trains.find((trainRecord) => trainRecord.id === selectedTrainId);
    if (!selectedTrain || !trainNameInput.value.trim()) {
      return;
    }
    selectedTrain.displayName = trainNameInput.value.trim();
    rebuildScenario();
    scheduleUrlUpdate();
  });

  nextTrainButton?.addEventListener("click", () => {
    if (scenario.trains.length === 0) {
      return;
    }
    const currentIndex = Math.max(0, scenario.trains.findIndex((trainRecord) => trainRecord.id === selectedTrainId));
    selectedTrainId = scenario.trains[(currentIndex + 1) % scenario.trains.length].id;
    updateSelectedTrain();
  });

  [
    [labelsToggle, "labels"],
    [conflictsToggle, "conflicts"],
    [blocksToggle, "blocks"],
    [pathsToggle, "paths"],
  ].forEach(([toggleElement, overlayName]) => {
    toggleElement?.addEventListener("change", () => {
      appState.overlays[overlayName] = toggleElement.checked;
      scenario.view.overlays = { ...appState.overlays };
      updateOverlayVisibility();
      scheduleUrlUpdate();
    });
  });

  presetButtons.forEach((buttonElement) => {
    buttonElement.addEventListener("click", () => setCameraPreset(buttonElement.dataset.preset));
  });

  shareButton?.addEventListener("click", async () => {
    commitScenarioToUrl();
    try {
      await navigator.clipboard.writeText(window.location.href);
      shareButton.textContent = "Share URL copied";
      window.setTimeout(() => {
        shareButton.textContent = "Copy share URL";
      }, 1600);
    } catch {
      shareButton.textContent = "URL updated";
      window.setTimeout(() => {
        shareButton.textContent = "Copy share URL";
      }, 1600);
    }
  });

  renderer.domElement.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || event.target !== renderer.domElement) {
      return;
    }
    if (event.ctrlKey || event.metaKey || event.shiftKey) {
      return;
    }
    const groundPoint = pointerToGround(event);
    addScenarioObject(groundPoint);
  });

  orbitControls.addEventListener("start", () => {
    cameraPresetActive = false;
  });
}

function hydrateViewState() {
  appState.speed = scenario.view?.speed ?? appState.speed;
  appState.overlays = {
    ...appState.overlays,
    ...(scenario.view?.overlays ?? {}),
  };
  if (labelsToggle) labelsToggle.checked = appState.overlays.labels;
  if (conflictsToggle) conflictsToggle.checked = appState.overlays.conflicts;
  if (blocksToggle) blocksToggle.checked = appState.overlays.blocks;
  if (pathsToggle) pathsToggle.checked = appState.overlays.paths;
  syncControls();
}

function animate() {
  const deltaTime = Math.min(clock.getDelta(), 0.05);
  const elapsedTime = clock.elapsedTime;
  updateTrainPositions(deltaTime);
  updateConflicts(elapsedTime);
  updateCamera(deltaTime);
  if (urlUpdateTimer > 0) {
    urlUpdateTimer -= deltaTime;
    if (urlUpdateTimer <= 0) {
      commitScenarioToUrl();
    }
  }
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.fov = window.innerWidth <= 760 ? 50 : 42;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
});

createGround();
hydrateViewState();
wireInterface();
rebuildScenario();
setCameraPreset(scenario.view?.preset ?? "overview");
syncControls();
animate();
