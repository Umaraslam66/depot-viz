import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const sceneCanvas = document.querySelector(".scene-canvas");
const runStatus = document.querySelector("#run-status");
const toolButtons = [...document.querySelectorAll("[data-tool]")];
const presetButtons = [...document.querySelectorAll("[data-preset]")];
const rotateToolButton = document.querySelector("#rotate-tool");
const clearSelectionButton = document.querySelector("#clear-selection");
const snapEnabledInput = document.querySelector("#snap-enabled");
const deleteSelectedButton = document.querySelector("#delete-selected");
const duplicateSelectedButton = document.querySelector("#duplicate-selected");
const undoButton = document.querySelector("#undo-action");
const redoButton = document.querySelector("#redo-action");
const rebuildRoutesButton = document.querySelector("#rebuild-routes");
const resetDemoButton = document.querySelector("#reset-demo");
const playPauseButton = document.querySelector("#play-pause");
const resetTimeButton = document.querySelector("#reset-time");
const followTrainButton = document.querySelector("#follow-train");
const speedInput = document.querySelector("#scenario-speed");
const speedValue = document.querySelector("#scenario-speed-value");
const trainNameInput = document.querySelector("#train-name");
const trainRouteSelect = document.querySelector("#train-route");
const selectedTrainSpeedInput = document.querySelector("#train-speed");
const selectedTrainSpeedValue = document.querySelector("#train-speed-value");
const trainEnabledInput = document.querySelector("#train-enabled");
const renameTrainButton = document.querySelector("#rename-train");
const nextTrainButton = document.querySelector("#next-train");
const labelsToggle = document.querySelector("#overlay-labels");
const conflictsToggle = document.querySelector("#overlay-conflicts");
const blocksToggle = document.querySelector("#overlay-blocks");
const pathsToggle = document.querySelector("#overlay-paths");
const connectionsToggle = document.querySelector("#overlay-connections");
const validationToggle = document.querySelector("#overlay-validation");
const readoutList = document.querySelector("#scenario-readout");
const shareButton = document.querySelector("#share-scenario");
const presentationModeButton = document.querySelector("#presentation-mode");
const exportScreenshotButton = document.querySelector("#export-screenshot");
const kpiTrains = document.querySelector("#kpi-trains");
const kpiConflicts = document.querySelector("#kpi-conflicts");
const kpiWarnings = document.querySelector("#kpi-warnings");
const propertiesEmpty = document.querySelector("#properties-empty");
const moduleProperties = document.querySelector("#module-properties");
const trainProperties = document.querySelector("#train-properties");
const conflictProperties = document.querySelector("#conflict-properties");
const moduleNameInput = document.querySelector("#module-name");
const moduleTypeReadout = document.querySelector("#module-type");
const moduleRotationInput = document.querySelector("#module-rotation");
const moduleRotationValue = document.querySelector("#module-rotation-value");
const reconnectModuleButton = document.querySelector("#reconnect-module");
const trainColorInput = document.querySelector("#train-color");
const conflictLabelInput = document.querySelector("#conflict-label");
const conflictTypeSelect = document.querySelector("#conflict-type");
const conflictSeveritySelect = document.querySelector("#conflict-severity");
const conflictActiveInput = document.querySelector("#conflict-active");
const validationList = document.querySelector("#validation-list");

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
  connection: 0x10b981,
  validation: 0xef4444,
  snapGrid: 0xf59e0b,
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
  connection: new THREE.MeshBasicMaterial({
    color: colors.connection,
    transparent: true,
    opacity: 0.82,
    depthWrite: false,
  }),
  validation: new THREE.MeshBasicMaterial({
    color: colors.validation,
    transparent: true,
    opacity: 0.78,
    depthWrite: false,
  }),
  previewValid: new THREE.MeshBasicMaterial({
    color: colors.connection,
    transparent: true,
    opacity: 0.32,
    depthWrite: false,
    side: THREE.DoubleSide,
  }),
  previewGrid: new THREE.MeshBasicMaterial({
    color: colors.snapGrid,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
    side: THREE.DoubleSide,
  }),
  previewBlocked: new THREE.MeshBasicMaterial({
    color: colors.validation,
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
    side: THREE.DoubleSide,
  }),
};

const scenarioGroup = new THREE.Group();
const labelGroup = new THREE.Group();
const overlayGroup = new THREE.Group();
const trainGroup = new THREE.Group();
const previewGroup = new THREE.Group();
scene.add(scenarioGroup, overlayGroup, trainGroup, labelGroup, previewGroup);

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
const connectedRoutes = new Map();
const clock = new THREE.Clock();
const scratchVector = new THREE.Vector3();
const scratchLookAt = new THREE.Vector3();
const orientationHelper = new THREE.Object3D();

let cameraPresetActive = false;
let desiredCameraPosition = camera.position.clone();
let desiredCameraTarget = orbitControls.target.clone();
let selectedTrainId = null;
let selectedModuleId = null;
let selectedConflictId = null;
let activeTool = "straight";
let toolRotation = 0;
let followingTrain = false;
let urlUpdateTimer = 0;
let currentPlacementPreview = null;
let dragState = null;
const undoStack = [];
const redoStack = [];
const maxHistoryEntries = 40;
const snapTolerance = 3.1;
const placementOverlapTolerance = 2.8;

const appState = {
  running: true,
  time: 0,
  speed: Number(speedInput?.value ?? 1),
  snapEnabled: true,
  presentationMode: false,
  overlays: {
    labels: true,
    conflicts: true,
    blocks: true,
    paths: true,
    connections: true,
    validation: true,
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
  connections: [
    { fromModuleId: "m1", fromPortId: "B", toModuleId: "m2", toPortId: "A" },
    { fromModuleId: "m2", fromPortId: "B", toModuleId: "m3", toPortId: "A" },
    { fromModuleId: "m3", fromPortId: "B", toModuleId: "m4", toPortId: "A" },
    { fromModuleId: "m4", fromPortId: "B", toModuleId: "m5", toPortId: "A" },
    { fromModuleId: "m5", fromPortId: "B", toModuleId: "m6", toPortId: "A" },
    { fromModuleId: "m6", fromPortId: "B", toModuleId: "m7", toPortId: "A" },
    { fromModuleId: "m7", fromPortId: "B", toModuleId: "m8", toPortId: "A" },
    { fromModuleId: "m9", fromPortId: "B", toModuleId: "m10", toPortId: "A" },
    { fromModuleId: "m10", fromPortId: "B", toModuleId: "m11", toPortId: "A" },
  ],
  trains: [
    {
      id: "t1",
      displayName: "IC-214",
      color: "#2563eb",
      route: "main",
      selectedRouteId: "main",
      speed: 7.2,
      startOffset: 0,
      enabled: true,
    },
    {
      id: "t2",
      displayName: "RE-08",
      color: "#059669",
      route: "main",
      selectedRouteId: "main",
      speed: 6.1,
      startOffset: 0.34,
      enabled: true,
    },
    {
      id: "t3",
      displayName: "FR-772",
      color: "#9333ea",
      route: "branch",
      selectedRouteId: "branch",
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
    snapEnabled: true,
    presentationMode: false,
    overlays: {
      labels: true,
      conflicts: true,
      blocks: true,
      paths: true,
      connections: true,
      validation: true,
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
      snapEnabled: appState.snapEnabled,
      presentationMode: appState.presentationMode,
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

function captureEditorState() {
  return {
    scenario: structuredClone(scenario),
    selectedTrainId,
    selectedModuleId,
    selectedConflictId,
    appState: {
      running: appState.running,
      time: appState.time,
      speed: appState.speed,
      snapEnabled: appState.snapEnabled,
      presentationMode: appState.presentationMode,
      overlays: { ...appState.overlays },
    },
    activeTool,
    toolRotation,
  };
}

function restoreEditorState(editorState) {
  scenario = structuredClone(editorState.scenario);
  selectedTrainId = editorState.selectedTrainId;
  selectedModuleId = editorState.selectedModuleId;
  selectedConflictId = editorState.selectedConflictId;
  appState.running = editorState.appState.running;
  appState.time = editorState.appState.time;
  appState.speed = editorState.appState.speed;
  appState.snapEnabled = editorState.appState.snapEnabled;
  appState.presentationMode = editorState.appState.presentationMode;
  appState.overlays = { ...editorState.appState.overlays };
  activeTool = editorState.activeTool;
  toolRotation = editorState.toolRotation;
  hydrateViewState();
  selectTool(activeTool);
  rebuildScenario();
  updateSelectedTrain();
  scheduleUrlUpdate();
}

function pushHistory() {
  undoStack.push(captureEditorState());
  if (undoStack.length > maxHistoryEntries) {
    undoStack.shift();
  }
  redoStack.splice(0, redoStack.length);
  syncHistoryControls();
}

function undoAction() {
  if (undoStack.length === 0) {
    return;
  }
  redoStack.push(captureEditorState());
  restoreEditorState(undoStack.pop());
  syncHistoryControls();
}

function redoAction() {
  if (redoStack.length === 0) {
    return;
  }
  undoStack.push(captureEditorState());
  restoreEditorState(redoStack.pop());
  syncHistoryControls();
}

function syncHistoryControls() {
  if (undoButton) {
    undoButton.disabled = undoStack.length === 0;
  }
  if (redoButton) {
    redoButton.disabled = redoStack.length === 0;
  }
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

  createLabelSprite("N", new THREE.Vector3(34, 1.5, -21), { scaleX: 1.1, scaleY: 0.72, fontSize: 48 });
  createLabelSprite("100 m", new THREE.Vector3(30, 1.2, 24), { scaleX: 2.1, scaleY: 0.68, fontSize: 38 });
  createLabelSprite("SECTION A", new THREE.Vector3(-26, 1.1, -18), { scaleX: 3.0, scaleY: 0.7, fontSize: 34 });
  createLabelSprite("SECTION B", new THREE.Vector3(18, 1.1, 18), { scaleX: 3.0, scaleY: 0.7, fontSize: 34 });

  const scaleMaterial = new THREE.MeshBasicMaterial({ color: 0x334155 });
  const scaleBar = new THREE.Mesh(new THREE.BoxGeometry(7.5, 0.05, 0.16), scaleMaterial);
  scaleBar.position.set(30, 0.12, 22.5);
  scene.add(scaleBar);
  const northStem = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 4.4), scaleMaterial);
  northStem.position.set(34, 0.12, -18.5);
  scene.add(northStem);
  const northHead = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.2, 3), scaleMaterial);
  northHead.position.set(34, 0.2, -21.0);
  northHead.rotation.x = Math.PI * 0.5;
  scene.add(northHead);
}

function createMapAnnotations() {
  createLabelSprite("N", new THREE.Vector3(34, 1.5, -21), { scaleX: 1.1, scaleY: 0.72, fontSize: 48 });
  createLabelSprite("100 m", new THREE.Vector3(30, 1.2, 24), { scaleX: 2.1, scaleY: 0.68, fontSize: 38 });
  createLabelSprite("SECTION A", new THREE.Vector3(-26, 1.1, -18), { scaleX: 3.0, scaleY: 0.7, fontSize: 34 });
  createLabelSprite("SECTION B", new THREE.Vector3(18, 1.1, 18), { scaleX: 3.0, scaleY: 0.7, fontSize: 34 });
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
    addBox(moduleGroup, [1.9, 0.1, 0.12], [1.8, 1.16, 1.34], materials.signalMast);
    addBox(moduleGroup, [0.12, 1.16, 0.12], [0.9, 0.68, 1.34], materials.signalMast);
    addBox(moduleGroup, [0.12, 1.16, 0.12], [2.7, 0.68, 1.34], materials.signalMast);
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

  addBufferStopsForOpenPorts(moduleRecord, moduleGroup);
  setObjectUserData(moduleGroup, "module", moduleRecord.id);
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

function localDirectionToWorld(moduleRecord, localX, localZ) {
  const rotationValue = moduleRecord.rotation ?? 0;
  const cosValue = Math.cos(rotationValue);
  const sinValue = Math.sin(rotationValue);
  return new THREE.Vector3(
    localX * cosValue + localZ * sinValue,
    0,
    -localX * sinValue + localZ * cosValue,
  ).normalize();
}

function getModulePortDefinitions(moduleType) {
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

function moduleHasPorts(moduleType) {
  return getModulePortDefinitions(moduleType).length > 0;
}

function getWorldPorts(moduleRecord) {
  return getModulePortDefinitions(moduleRecord.type).map((portDefinition) => ({
    id: portDefinition.id,
    moduleId: moduleRecord.id,
    position: worldPosition(moduleRecord, portDefinition.local[0], 0.18, portDefinition.local[1]),
    direction: localDirectionToWorld(moduleRecord, portDefinition.direction[0], portDefinition.direction[1]),
    local: portDefinition.local,
    localDirection: portDefinition.direction,
  }));
}

function isPortConnected(moduleId, portId) {
  return scenario.connections.some(
    (connectionRecord) =>
      (connectionRecord.fromModuleId === moduleId && connectionRecord.fromPortId === portId) ||
      (connectionRecord.toModuleId === moduleId && connectionRecord.toPortId === portId),
  );
}

function findNearestOpenPort(worldPoint, excludeModuleId = null) {
  let nearestPort = null;
  scenario.trackModules.forEach((moduleRecord) => {
    if (moduleRecord.id === excludeModuleId || !moduleHasPorts(moduleRecord.type)) {
      return;
    }
    getWorldPorts(moduleRecord).forEach((portRecord) => {
      if (isPortConnected(moduleRecord.id, portRecord.id)) {
        return;
      }
      const portDistance = portRecord.position.distanceTo(worldPoint);
      if (portDistance <= snapTolerance && (!nearestPort || portDistance < nearestPort.distance)) {
        nearestPort = {
          ...portRecord,
          distance: portDistance,
        };
      }
    });
  });
  return nearestPort;
}

function getPreferredSourcePort(moduleType, targetPort) {
  const sourcePorts = getModulePortDefinitions(moduleType);
  if (sourcePorts.length === 0) {
    return null;
  }
  if (sourcePorts.some((portRecord) => portRecord.id === "A")) {
    return "A";
  }
  return sourcePorts[0].id;
}

function alignModulePortToTarget(moduleRecord, sourcePortId, targetPort) {
  const sourcePort = getModulePortDefinitions(moduleRecord.type).find((portRecord) => portRecord.id === sourcePortId);
  if (!sourcePort) {
    return moduleRecord;
  }
  const localDirectionAngle = Math.atan2(sourcePort.direction[1], sourcePort.direction[0]);
  const desiredDirection = targetPort.direction.clone().multiplyScalar(-1);
  const desiredDirectionAngle = Math.atan2(desiredDirection.z, desiredDirection.x);
  const nextRotation = localDirectionAngle - desiredDirectionAngle;
  const alignedRecord = {
    ...moduleRecord,
    rotation: normalizeRotation(nextRotation),
  };
  const sourceWorldAtOrigin = worldPosition(
    { ...alignedRecord, position: [0, 0, 0] },
    sourcePort.local[0],
    0.18,
    sourcePort.local[1],
  );
  alignedRecord.position = [
    targetPort.position.x - sourceWorldAtOrigin.x,
    0,
    targetPort.position.z - sourceWorldAtOrigin.z,
  ];
  return alignedRecord;
}

function normalizeRotation(rotationValue) {
  const fullTurn = Math.PI * 2;
  return ((rotationValue % fullTurn) + fullTurn) % fullTurn;
}

function getNearestTrackPoint(worldPoint) {
  let nearestPoint = null;
  scenario.trackModules.forEach((moduleRecord) => {
    const modulePosition = new THREE.Vector3(moduleRecord.position[0], 0, moduleRecord.position[2]);
    const distanceValue = modulePosition.distanceTo(worldPoint);
    if (distanceValue <= 5.5 && (!nearestPoint || distanceValue < nearestPoint.distance)) {
      nearestPoint = {
        position: modulePosition,
        moduleId: moduleRecord.id,
        distance: distanceValue,
      };
    }
  });
  return nearestPoint;
}

function moduleOverlaps(moduleRecord, excludeModuleId = null) {
  return scenario.trackModules.some((existingModule) => {
    if (existingModule.id === excludeModuleId) {
      return false;
    }
    const existingPosition = new THREE.Vector3(existingModule.position[0], 0, existingModule.position[2]);
    const modulePosition = new THREE.Vector3(moduleRecord.position[0], 0, moduleRecord.position[2]);
    return existingPosition.distanceTo(modulePosition) < placementOverlapTolerance;
  });
}

function addBufferStopsForOpenPorts(moduleRecord, moduleGroup) {
  getWorldPorts(moduleRecord).forEach((portRecord) => {
    if (isPortConnected(moduleRecord.id, portRecord.id)) {
      return;
    }
    const localPort = getModulePortDefinitions(moduleRecord.type).find((definitionRecord) => definitionRecord.id === portRecord.id);
    if (!localPort) {
      return;
    }
    const bufferGroup = new THREE.Group();
    bufferGroup.position.set(localPort.local[0], 0.42, localPort.local[1]);
    bufferGroup.rotation.y = Math.atan2(localPort.direction[1], localPort.direction[0]);
    addBox(bufferGroup, [0.22, 0.5, 1.72], [0, 0, 0], materials.signalMast);
    addBox(bufferGroup, [0.34, 0.18, 1.95], [-0.25, 0.36, 0], materials.platformEdge);
    moduleGroup.add(bufferGroup);
  });
}

function createConflictObject(conflictRecord) {
  const conflictGroup = new THREE.Group();
  conflictGroup.userData.overlayType = "conflicts";
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
  if (selectedConflictId === conflictRecord.id) {
    const selectionMesh = new THREE.Mesh(new THREE.RingGeometry(2.15, 2.55, 42), materials.selection);
    selectionMesh.rotation.x = -Math.PI * 0.5;
    selectionMesh.position.y = 0.18;
    conflictGroup.add(selectionMesh);
  }
  createLabelSprite(conflictRecord.label, new THREE.Vector3(conflictRecord.position[0], 3.15, conflictRecord.position[2]), {
    background: isHighSeverity ? "rgba(254, 242, 242, 0.96)" : "rgba(255, 251, 235, 0.96)",
    border: isHighSeverity ? "rgba(220, 38, 38, 0.85)" : "rgba(217, 119, 6, 0.85)",
    color: isHighSeverity ? "#991b1b" : "#92400e",
    scaleX: 6.1,
    scaleY: 1.05,
    fontSize: 36,
  });
  setObjectUserData(conflictGroup, "conflict", conflictRecord.id);
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

function getModuleById(moduleId) {
  return scenario.trackModules.find((moduleRecord) => moduleRecord.id === moduleId);
}

function getConnectionNeighbors(moduleId) {
  return scenario.connections
    .map((connectionRecord) => {
      if (connectionRecord.fromModuleId === moduleId) {
        return connectionRecord.toModuleId;
      }
      if (connectionRecord.toModuleId === moduleId) {
        return connectionRecord.fromModuleId;
      }
      return null;
    })
    .filter(Boolean);
}

function rebuildRoutesFromConnections() {
  connectedRoutes.clear();
  if (scenario.connections.length === 0) {
    return;
  }

  const connectedModuleIds = [...new Set(scenario.connections.flatMap((connectionRecord) => [
    connectionRecord.fromModuleId,
    connectionRecord.toModuleId,
  ]))].filter((moduleId) => getModuleById(moduleId));
  if (connectedModuleIds.length < 2) {
    return;
  }

  const endpointModuleId =
    connectedModuleIds.find((moduleId) => getConnectionNeighbors(moduleId).length === 1) ?? connectedModuleIds[0];
  const orderedModuleIds = [];
  const visitedModuleIds = new Set();
  let currentModuleId = endpointModuleId;
  let previousModuleId = null;

  while (currentModuleId && !visitedModuleIds.has(currentModuleId)) {
    orderedModuleIds.push(currentModuleId);
    visitedModuleIds.add(currentModuleId);
    const nextModuleId = getConnectionNeighbors(currentModuleId).find((moduleId) => moduleId !== previousModuleId);
    previousModuleId = currentModuleId;
    currentModuleId = nextModuleId;
  }

  const routePoints = orderedModuleIds
    .map((moduleId) => getModuleById(moduleId))
    .filter(Boolean)
    .map((moduleRecord) => new THREE.Vector3(moduleRecord.position[0], 0.45, moduleRecord.position[2]));

  if (routePoints.length >= 2) {
    connectedRoutes.set("connected", new THREE.CatmullRomCurve3(routePoints, false, "centripetal", 0.08));
  }
}

function getRouteCurve(routeName) {
  if (pathCurves.has(routeName)) {
    return pathCurves.get(routeName);
  }
  if (routeName === "connected") {
    rebuildRoutesFromConnections();
    const connectedRoute = connectedRoutes.get("connected");
    if (connectedRoute) {
      pathCurves.set(routeName, connectedRoute);
      return connectedRoute;
    }
    return null;
  }
  const routePoints = routeName === "branch" ? getBranchRoutePoints() : getMainRoutePoints();
  const routeCurve = new THREE.CatmullRomCurve3(routePoints, routeName !== "branch", "centripetal", 0.08);
  pathCurves.set(routeName, routeCurve);
  return routeCurve;
}

function createPathOverlay(routeName) {
  const routeCurve = getRouteCurve(routeName);
  if (!routeCurve) {
    return null;
  }
  const points = routeCurve.getSpacedPoints(routeName === "branch" ? 90 : 180);
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  return new THREE.Line(geometry, materials.path);
}

function findClosestRouteRatio(routeName, worldPoint) {
  const routeCurve = getRouteCurve(routeName);
  if (!routeCurve) {
    return 0;
  }
  let bestRatio = 0;
  let bestDistance = Infinity;
  for (let sampleIndex = 0; sampleIndex <= 120; sampleIndex += 1) {
    const ratioValue = sampleIndex / 120;
    const samplePoint = routeCurve.getPointAt(ratioValue);
    const distanceValue = samplePoint.distanceTo(worldPoint);
    if (distanceValue < bestDistance) {
      bestDistance = distanceValue;
      bestRatio = ratioValue;
    }
  }
  return bestRatio;
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
  addBox(group, [0.28, 0.5, 0.84], [1.25, 0.72, 0], roofMaterial);
  addBox(group, [0.12, 0.18, 0.18], [1.42, 0.78, -0.26], materials.signalGreen);
  addBox(group, [0.12, 0.18, 0.18], [1.42, 0.78, 0.26], materials.signalGreen);
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

  setObjectUserData(group, "train", trainRecord.id);
  return group;
}

function updateOverlayVisibility() {
  labelGroup.visible = appState.overlays.labels;
  overlayGroup.children.forEach((childObject) => {
    const overlayType = childObject.userData.overlayType;
    if (overlayType && Object.hasOwn(appState.overlays, overlayType)) {
      childObject.visible = appState.overlays[overlayType];
      return;
    }
    childObject.visible = true;
  });
  conflictObjects.forEach((conflictObject) => {
    conflictObject.visible = appState.overlays.conflicts;
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
  if (trainRouteSelect && selectedTrain) {
    trainRouteSelect.value = selectedTrain.selectedRouteId ?? selectedTrain.route ?? "main";
  }
  if (selectedTrainSpeedInput && selectedTrain) {
    selectedTrainSpeedInput.value = String(selectedTrain.speed);
  }
  if (selectedTrainSpeedValue && selectedTrain) {
    selectedTrainSpeedValue.textContent = selectedTrain.speed.toFixed(1);
  }
  if (trainEnabledInput && selectedTrain) {
    trainEnabledInput.checked = selectedTrain.enabled;
  }
  if (trainColorInput && selectedTrain) {
    trainColorInput.value = selectedTrain.color;
  }
  updatePropertiesPanel();
}

function updatePropertiesPanel() {
  const selectedObject = getSelectedObject();
  const selectedModule = selectedObject?.type === "module" ? getModuleById(selectedObject.id) : null;
  const selectedTrain = selectedObject?.type === "train"
    ? scenario.trains.find((trainRecord) => trainRecord.id === selectedObject.id)
    : null;
  const selectedConflict = selectedObject?.type === "conflict"
    ? scenario.conflicts.find((conflictRecord) => conflictRecord.id === selectedObject.id)
    : null;

  if (propertiesEmpty) {
    propertiesEmpty.hidden = Boolean(selectedModule || selectedTrain || selectedConflict);
  }
  if (moduleProperties) {
    moduleProperties.hidden = !selectedModule;
  }
  if (trainProperties) {
    trainProperties.hidden = !selectedTrain;
  }
  if (conflictProperties) {
    conflictProperties.hidden = !selectedConflict;
  }

  if (selectedModule) {
    if (moduleNameInput) {
      moduleNameInput.value = selectedModule.name ?? "";
    }
    if (moduleTypeReadout) {
      moduleTypeReadout.textContent = selectedModule.type;
    }
    const rotationDegrees = Math.round(((selectedModule.rotation ?? 0) * 180) / Math.PI) % 360;
    if (moduleRotationInput) {
      moduleRotationInput.value = String(rotationDegrees < 0 ? rotationDegrees + 360 : rotationDegrees);
    }
    if (moduleRotationValue) {
      moduleRotationValue.textContent = `${rotationDegrees < 0 ? rotationDegrees + 360 : rotationDegrees} deg`;
    }
  }

  if (selectedConflict) {
    if (conflictLabelInput) {
      conflictLabelInput.value = selectedConflict.label;
    }
    if (conflictTypeSelect) {
      conflictTypeSelect.value = selectedConflict.type;
    }
    if (conflictSeveritySelect) {
      conflictSeveritySelect.value = selectedConflict.severity;
    }
    if (conflictActiveInput) {
      conflictActiveInput.checked = selectedConflict.active;
    }
  }
}

function updateReadout() {
  const activeConflicts = scenario.conflicts.filter((conflictRecord) => conflictRecord.active);
  const enabledTrains = scenario.trains.filter((trainRecord) => trainRecord.enabled);
  const validationWarnings = validateScenario();
  if (kpiTrains) {
    kpiTrains.textContent = String(enabledTrains.length);
  }
  if (kpiConflicts) {
    kpiConflicts.textContent = String(activeConflicts.length);
  }
  if (kpiWarnings) {
    kpiWarnings.textContent = String(validationWarnings.length);
  }
  renderValidationList(validationWarnings);
  const items = [
    `${enabledTrains.length} trains active across ${scenario.trackModules.length} planning objects.`,
    `${scenario.connections.length} endpoint connections, ${validationWarnings.length} validation warnings.`,
    "Block occupancy shown as blue section bands.",
  ];

  activeConflicts.forEach((conflictRecord) => {
    const trainNames = (conflictRecord.affectedTrainIds ?? [])
      .map((trainId) => scenario.trains.find((trainRecord) => trainRecord.id === trainId)?.displayName)
      .filter(Boolean)
      .join(", ");
    items.push(`${conflictRecord.label}${trainNames ? `: ${trainNames}` : ""}`);
  });

  validationWarnings.slice(0, 4).forEach((warningRecord) => {
    items.push(warningRecord.message);
  });

  readoutList.replaceChildren(
    ...items.map((itemText, itemIndex) => {
      const listItem = document.createElement("li");
      listItem.textContent = itemText;
      if (itemIndex >= 3) {
        listItem.className = itemText.toLowerCase().includes("overlap") ? "is-danger" : "is-warning";
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

function updatePointerFromEvent(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
}

function getPickedObject(event) {
  updatePointerFromEvent(event);
  const intersections = raycaster.intersectObjects([scenarioGroup, trainGroup, overlayGroup], true);
  const pickedIntersection = intersections.find(
    (intersectionRecord) => intersectionRecord.object.userData.objectType && intersectionRecord.object.visible,
  );
  if (!pickedIntersection) {
    return null;
  }
  return {
    type: pickedIntersection.object.userData.objectType,
    id: pickedIntersection.object.userData.objectId,
  };
}

function nextId(prefix) {
  const idValue = `${prefix}${scenario.nextId}`;
  scenario.nextId += 1;
  return idValue;
}

function getSelectedObject() {
  if (selectedModuleId) {
    return { type: "module", id: selectedModuleId };
  }
  if (selectedConflictId) {
    return { type: "conflict", id: selectedConflictId };
  }
  if (selectedTrainId) {
    return { type: "train", id: selectedTrainId };
  }
  return null;
}

function setSelectedObject(selectionValue) {
  selectedModuleId = selectionValue?.type === "module" ? selectionValue.id : null;
  selectedConflictId = selectionValue?.type === "conflict" ? selectionValue.id : null;
  if (selectionValue?.type === "train") {
    selectedTrainId = selectionValue.id;
  }
  rebuildScenario();
}

function setObjectUserData(objectValue, objectType, objectId) {
  objectValue.userData.objectType = objectType;
  objectValue.userData.objectId = objectId;
  objectValue.traverse((childObject) => {
    childObject.userData.objectType = objectType;
    childObject.userData.objectId = objectId;
  });
}

function addScenarioObject(positionValue) {
  const placementPlan = getPlacementPlan(positionValue);
  if (placementPlan.blocked) {
    return;
  }
  pushHistory();

  if (activeTool === "train") {
    const selectedRouteValue = trainRouteSelect?.value ?? (placementPlan.position[2] > 4 ? "branch" : "main");
    const trainStartPoint = new THREE.Vector3(placementPlan.position[0], 0.45, placementPlan.position[2]);
    const trainRecord = {
      id: nextId("t"),
      displayName: `Train ${scenario.trains.length + 1}`,
      color: ["#2563eb", "#059669", "#d97706", "#9333ea", "#dc2626"][scenario.trains.length % 5],
      route: selectedRouteValue,
      selectedRouteId: selectedRouteValue,
      speed: 5.8 + (scenario.trains.length % 3) * 0.7,
      startOffset: findClosestRouteRatio(selectedRouteValue, trainStartPoint),
      enabled: true,
    };
    scenario.trains.push(trainRecord);
    selectedTrainId = trainRecord.id;
    selectedModuleId = null;
    selectedConflictId = null;
  } else if (activeTool === "conflict") {
    const conflictRecord = {
      id: nextId("c"),
      type: "headway",
      severity: "medium",
      position: placementPlan.position,
      affectedModuleIds: [],
      affectedTrainIds: scenario.trains.slice(0, 2).map((trainRecord) => trainRecord.id),
      label: "Headway conflict",
      active: true,
    };
    scenario.conflicts.push(conflictRecord);
    selectedConflictId = conflictRecord.id;
    selectedModuleId = null;
  } else {
    const moduleRecord = {
      id: nextId("m"),
      type: activeTool,
      position: placementPlan.position,
      rotation: toolRotation,
    };
    if (placementPlan.alignedModule) {
      moduleRecord.position = placementPlan.alignedModule.position;
      moduleRecord.rotation = placementPlan.alignedModule.rotation;
    }
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
    if (placementPlan.connection) {
      scenario.connections.push({
        fromModuleId: placementPlan.connection.target.moduleId,
        fromPortId: placementPlan.connection.target.id,
        toModuleId: moduleRecord.id,
        toPortId: placementPlan.connection.sourcePortId,
      });
    }
    selectedModuleId = moduleRecord.id;
    selectedConflictId = null;
  }

  rebuildScenario();
  scheduleUrlUpdate();
}

function getPlacementPlan(positionValue) {
  if (activeTool === "train" || activeTool === "conflict" || activeTool === "signal") {
    const nearestTrackPoint = getNearestTrackPoint(positionValue);
    const basePosition = nearestTrackPoint
      ? [nearestTrackPoint.position.x, 0, nearestTrackPoint.position.z]
      : [snapToGrid(positionValue.x), 0, snapToGrid(positionValue.z)];
    return {
      position: basePosition,
      mode: nearestTrackPoint ? "track" : "grid",
      blocked: false,
    };
  }

  let moduleRecord = {
    id: "__preview",
    type: activeTool,
    position: [snapToGrid(positionValue.x), 0, snapToGrid(positionValue.z)],
    rotation: toolRotation,
  };
  const targetPort = appState.snapEnabled && moduleHasPorts(activeTool) ? findNearestOpenPort(positionValue) : null;
  let connection = null;

  if (targetPort) {
    const sourcePortId = getPreferredSourcePort(activeTool, targetPort);
    moduleRecord = alignModulePortToTarget(moduleRecord, sourcePortId, targetPort);
    connection = { target: targetPort, sourcePortId };
  }

  const blocked = moduleOverlaps(moduleRecord) && !connection;
  return {
    position: moduleRecord.position,
    alignedModule: moduleRecord,
    connection,
    mode: connection ? "connection" : "grid",
    blocked,
  };
}

function getModuleMovePlan(moduleRecord, positionValue) {
  let movedModule = {
    ...moduleRecord,
    position: [snapToGrid(positionValue.x), 0, snapToGrid(positionValue.z)],
  };
  const targetPort = appState.snapEnabled && moduleHasPorts(moduleRecord.type)
    ? findNearestOpenPort(positionValue, moduleRecord.id)
    : null;
  let connection = null;
  if (targetPort) {
    const sourcePortId = getPreferredSourcePort(moduleRecord.type, targetPort);
    movedModule = alignModulePortToTarget(movedModule, sourcePortId, targetPort);
    connection = { target: targetPort, sourcePortId };
  }
  return { moduleRecord: movedModule, connection };
}

function moveSelectedObjectToGround(positionValue) {
  if (!dragState) {
    return;
  }
  if (!dragState.historyCaptured) {
    pushHistory();
    dragState.historyCaptured = true;
  }

  if (dragState.type === "module") {
    const moduleIndex = scenario.trackModules.findIndex((moduleRecord) => moduleRecord.id === dragState.id);
    if (moduleIndex < 0) {
      return;
    }
    removeConnectionsForModule(dragState.id);
    const movePlan = getModuleMovePlan(scenario.trackModules[moduleIndex], positionValue);
    scenario.trackModules[moduleIndex] = movePlan.moduleRecord;
    if (movePlan.connection) {
      scenario.connections.push({
        fromModuleId: movePlan.connection.target.moduleId,
        fromPortId: movePlan.connection.target.id,
        toModuleId: dragState.id,
        toPortId: movePlan.connection.sourcePortId,
      });
    }
    rebuildScenario();
    return;
  }

  if (dragState.type === "conflict") {
    const conflictRecord = scenario.conflicts.find((itemRecord) => itemRecord.id === dragState.id);
    if (!conflictRecord) {
      return;
    }
    const nearestTrackPoint = getNearestTrackPoint(positionValue);
    conflictRecord.position = nearestTrackPoint
      ? [nearestTrackPoint.position.x, 0, nearestTrackPoint.position.z]
      : [snapToGrid(positionValue.x), 0, snapToGrid(positionValue.z)];
    rebuildScenario();
  }
}

function updatePlacementPreview(positionValue) {
  currentPlacementPreview = getPlacementPlan(positionValue);
  clearGroup(previewGroup);
  const previewMaterial = currentPlacementPreview.blocked
    ? materials.previewBlocked
    : currentPlacementPreview.mode === "connection"
      ? materials.previewValid
      : materials.previewGrid;
  const previewPosition = currentPlacementPreview.alignedModule?.position ?? currentPlacementPreview.position;
  const previewRing = new THREE.Mesh(new THREE.RingGeometry(1.7, 2.25, 48), previewMaterial);
  previewRing.rotation.x = -Math.PI * 0.5;
  previewRing.position.set(previewPosition[0], 0.24, previewPosition[2]);
  previewGroup.add(previewRing);

  if (currentPlacementPreview.connection) {
    const targetMarker = new THREE.Mesh(new THREE.SphereGeometry(0.36, 18, 12), materials.connection);
    targetMarker.position.copy(currentPlacementPreview.connection.target.position);
    targetMarker.position.y += 0.25;
    previewGroup.add(targetMarker);
  }
}

function clearPlacementPreview() {
  currentPlacementPreview = null;
  clearGroup(previewGroup);
}

function removeConnectionsForModule(moduleId) {
  scenario.connections = scenario.connections.filter(
    (connectionRecord) => connectionRecord.fromModuleId !== moduleId && connectionRecord.toModuleId !== moduleId,
  );
}

function renderValidationList(validationWarnings) {
  if (!validationList) {
    return;
  }
  if (validationWarnings.length === 0) {
    const emptyItem = document.createElement("li");
    const emptyButton = document.createElement("button");
    emptyButton.type = "button";
    emptyButton.textContent = "No validation issues";
    emptyButton.disabled = true;
    emptyItem.append(emptyButton);
    validationList.replaceChildren(emptyItem);
    return;
  }

  validationList.replaceChildren(
    ...validationWarnings.slice(0, 9).map((warningRecord, warningIndex) => {
      const listItem = document.createElement("li");
      const buttonElement = document.createElement("button");
      buttonElement.type = "button";
      buttonElement.textContent = warningRecord.message;
      buttonElement.className = warningRecord.type === "overlap" ? "is-danger" : "";
      buttonElement.addEventListener("click", () => zoomToValidationIssue(warningRecord));
      listItem.append(buttonElement);
      listItem.dataset.issueIndex = String(warningIndex);
      return listItem;
    }),
  );
}

function zoomToValidationIssue(warningRecord) {
  if (warningRecord.objectType && warningRecord.objectId) {
    setSelectedObject({ type: warningRecord.objectType, id: warningRecord.objectId });
  }
  const targetPosition = warningRecord.position.clone ? warningRecord.position : new THREE.Vector3(...warningRecord.position);
  desiredCameraPosition.set(targetPosition.x + 13, 14, targetPosition.z + 13);
  desiredCameraTarget.set(targetPosition.x, 0.8, targetPosition.z);
  cameraPresetActive = true;
  followingTrain = false;
}

function deleteSelected() {
  if (selectedConflictId) {
    pushHistory();
    scenario.conflicts = scenario.conflicts.filter((conflictRecord) => conflictRecord.id !== selectedConflictId);
    selectedConflictId = null;
    rebuildScenario();
    scheduleUrlUpdate();
    return;
  }

  if (selectedModuleId) {
    pushHistory();
    scenario.trackModules = scenario.trackModules.filter((moduleRecord) => moduleRecord.id !== selectedModuleId);
    removeConnectionsForModule(selectedModuleId);
    scenario.conflicts.forEach((conflictRecord) => {
      conflictRecord.affectedModuleIds = (conflictRecord.affectedModuleIds ?? []).filter((moduleId) => moduleId !== selectedModuleId);
    });
    selectedModuleId = null;
    rebuildScenario();
    scheduleUrlUpdate();
    return;
  }

  if (selectedTrainId) {
    pushHistory();
    scenario.trains = scenario.trains.filter((trainRecord) => trainRecord.id !== selectedTrainId);
    scenario.conflicts.forEach((conflictRecord) => {
      conflictRecord.affectedTrainIds = (conflictRecord.affectedTrainIds ?? []).filter((trainId) => trainId !== selectedTrainId);
    });
    selectedTrainId = scenario.trains[0]?.id ?? null;
    rebuildScenario();
    scheduleUrlUpdate();
  }
}

function duplicateSelected() {
  if (selectedConflictId) {
    const sourceConflict = scenario.conflicts.find((conflictRecord) => conflictRecord.id === selectedConflictId);
    if (!sourceConflict) {
      return;
    }
    pushHistory();
    const duplicateConflict = {
      ...structuredClone(sourceConflict),
      id: nextId("c"),
      position: [sourceConflict.position[0] + gridSize, 0, sourceConflict.position[2] + gridSize],
      label: `${sourceConflict.label} copy`,
    };
    scenario.conflicts.push(duplicateConflict);
    selectedConflictId = duplicateConflict.id;
    rebuildScenario();
    scheduleUrlUpdate();
    return;
  }

  if (selectedModuleId) {
    const sourceModule = getModuleById(selectedModuleId);
    if (!sourceModule) {
      return;
    }
    pushHistory();
    const duplicateModule = {
      ...structuredClone(sourceModule),
      id: nextId("m"),
      position: [sourceModule.position[0] + gridSize, 0, sourceModule.position[2] + gridSize],
      name: sourceModule.name ? `${sourceModule.name} copy` : undefined,
    };
    scenario.trackModules.push(duplicateModule);
    selectedModuleId = duplicateModule.id;
    rebuildScenario();
    scheduleUrlUpdate();
    return;
  }

  const selectedTrain = scenario.trains.find((trainRecord) => trainRecord.id === selectedTrainId);
  if (selectedTrain) {
    pushHistory();
    const duplicateTrain = {
      ...structuredClone(selectedTrain),
      id: nextId("t"),
      displayName: `${selectedTrain.displayName} copy`,
      startOffset: (selectedTrain.startOffset + 0.12) % 1,
    };
    scenario.trains.push(duplicateTrain);
    selectedTrainId = duplicateTrain.id;
    rebuildScenario();
    scheduleUrlUpdate();
  }
}

function resetDemo() {
  pushHistory();
  scenario = structuredClone(defaultScenario);
  selectedTrainId = scenario.trains[0]?.id ?? null;
  selectedModuleId = null;
  selectedConflictId = null;
  appState.time = 0;
  hydrateViewState();
  rebuildScenario();
  setCameraPreset("overview");
  scheduleUrlUpdate();
}

function selectNearestModule(worldPoint) {
  let nearestModule = null;
  scenario.trackModules.forEach((moduleRecord) => {
    const modulePosition = new THREE.Vector3(moduleRecord.position[0], 0, moduleRecord.position[2]);
    const distanceValue = modulePosition.distanceTo(worldPoint);
    if (distanceValue <= 5 && (!nearestModule || distanceValue < nearestModule.distance)) {
      nearestModule = { moduleRecord, distance: distanceValue };
    }
  });
  let nearestConflict = null;
  scenario.conflicts.forEach((conflictRecord) => {
    const conflictPosition = new THREE.Vector3(conflictRecord.position[0], 0, conflictRecord.position[2]);
    const distanceValue = conflictPosition.distanceTo(worldPoint);
    if (distanceValue <= 5 && (!nearestConflict || distanceValue < nearestConflict.distance)) {
      nearestConflict = { conflictRecord, distance: distanceValue };
    }
  });

  if (nearestConflict && (!nearestModule || nearestConflict.distance < nearestModule.distance)) {
    selectedConflictId = nearestConflict.conflictRecord.id;
    selectedModuleId = null;
  } else {
    selectedModuleId = nearestModule?.moduleRecord.id ?? null;
    selectedConflictId = null;
  }
  rebuildScenario();
}

function createOccupancyBand(trainRecord, positionValue, tangentValue) {
  const bandMaterial = materials.occupied.clone();
  const bandMesh = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 2.3), bandMaterial);
  bandMesh.rotation.x = -Math.PI * 0.5;
  bandMesh.position.copy(positionValue);
  bandMesh.position.y = 0.12;
  bandMesh.rotation.z = Math.atan2(-tangentValue.z, tangentValue.x);
  bandMesh.userData.overlayType = "blocks";
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
    const routeCurve = getRouteCurve(trainRecord.selectedRouteId ?? trainRecord.route);
    if (!routeCurve) {
      return;
    }
    const positionValue = routeCurve.getPointAt(trainRecord.startOffset);
    const tangentValue = routeCurve.getTangentAt(trainRecord.startOffset).normalize();
    occupancyBands.push(createOccupancyBand(trainRecord, positionValue, tangentValue));
  });
}

function createConnectionOverlays() {
  scenario.trackModules.forEach((moduleRecord) => {
    getWorldPorts(moduleRecord).forEach((portRecord) => {
      const portMaterial = isPortConnected(moduleRecord.id, portRecord.id)
        ? materials.connection
        : materials.connection.clone();
      if (!isPortConnected(moduleRecord.id, portRecord.id)) {
        portMaterial.opacity = 0.34;
      }
      const portMesh = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), portMaterial);
      portMesh.position.copy(portRecord.position);
      portMesh.userData.overlayType = "connections";
      overlayGroup.add(portMesh);
    });
  });

  scenario.connections.forEach((connectionRecord) => {
    const fromModule = getModuleById(connectionRecord.fromModuleId);
    const toModule = getModuleById(connectionRecord.toModuleId);
    if (!fromModule || !toModule) {
      return;
    }
    const fromPort = getWorldPorts(fromModule).find((portRecord) => portRecord.id === connectionRecord.fromPortId);
    const toPort = getWorldPorts(toModule).find((portRecord) => portRecord.id === connectionRecord.toPortId);
    if (!fromPort || !toPort) {
      return;
    }
    const lineGeometry = new THREE.BufferGeometry().setFromPoints([fromPort.position, toPort.position]);
    const lineMesh = new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({
      color: colors.connection,
      transparent: true,
      opacity: 0.66,
    }));
    lineMesh.userData.overlayType = "connections";
    overlayGroup.add(lineMesh);
  });
}

function validateScenario() {
  const warnings = [];
  scenario.trackModules.forEach((moduleRecord) => {
    getWorldPorts(moduleRecord).forEach((portRecord) => {
      if (!isPortConnected(moduleRecord.id, portRecord.id)) {
        warnings.push({
          type: "disconnected-port",
          message: `${moduleRecord.name ?? moduleRecord.type} has open port ${portRecord.id}.`,
          position: portRecord.position,
          objectType: "module",
          objectId: moduleRecord.id,
        });
      }
    });
  });

  scenario.trackModules.forEach((moduleRecord, moduleIndex) => {
    const modulePosition = new THREE.Vector3(moduleRecord.position[0], 0, moduleRecord.position[2]);
    scenario.trackModules.slice(moduleIndex + 1).forEach((otherModule) => {
      const otherPosition = new THREE.Vector3(otherModule.position[0], 0, otherModule.position[2]);
      if (modulePosition.distanceTo(otherPosition) < placementOverlapTolerance) {
        warnings.push({
          type: "overlap",
          message: `${moduleRecord.name ?? moduleRecord.type} overlaps ${otherModule.name ?? otherModule.type}.`,
          position: modulePosition.clone().lerp(otherPosition, 0.5),
          objectType: "module",
          objectId: moduleRecord.id,
        });
      }
    });
  });

  scenario.trains.forEach((trainRecord) => {
    if ((trainRecord.selectedRouteId ?? trainRecord.route) === "connected" && !connectedRoutes.has("connected")) {
      warnings.push({
        type: "route",
        message: `${trainRecord.displayName} has no complete connected route.`,
        position: new THREE.Vector3(0, 0.1, 0),
        objectType: "train",
        objectId: trainRecord.id,
      });
    }
    if (!trainRecord.enabled) {
      warnings.push({
        type: "disabled-train",
        message: `${trainRecord.displayName} is disabled.`,
        position: new THREE.Vector3(0, 0.1, 0),
        objectType: "train",
        objectId: trainRecord.id,
      });
    }
  });

  scenario.conflicts.forEach((conflictRecord) => {
    const affectedModuleIds = conflictRecord.affectedModuleIds ?? [];
    const affectedTrainIds = conflictRecord.affectedTrainIds ?? [];
    if (conflictRecord.active && affectedModuleIds.length === 0 && affectedTrainIds.length === 0) {
      warnings.push({
        type: "conflict-scope",
        message: `${conflictRecord.label} has no affected objects.`,
        position: new THREE.Vector3(conflictRecord.position[0], 0.1, conflictRecord.position[2]),
        objectType: "conflict",
        objectId: conflictRecord.id,
      });
    }
  });

  return warnings;
}

function createValidationOverlays(validationWarnings) {
  validationWarnings.forEach((warningRecord) => {
    const markerMesh = new THREE.Mesh(new THREE.RingGeometry(0.58, 0.78, 24), materials.validation);
    markerMesh.rotation.x = -Math.PI * 0.5;
    markerMesh.position.copy(warningRecord.position);
    markerMesh.position.y = 0.22;
    markerMesh.userData.overlayType = "validation";
    overlayGroup.add(markerMesh);
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
  createMapAnnotations();

  scenario.trackModules.forEach((moduleRecord) => {
    const moduleObject = createTrackModuleObject(moduleRecord);
    scenarioGroup.add(moduleObject);
    moduleObjects.set(moduleRecord.id, moduleObject);
  });

  rebuildRoutesFromConnections();
  ["main", "branch", "connected"].forEach((routeName) => {
    const overlay = createPathOverlay(routeName);
    if (!overlay) {
      return;
    }
    overlay.userData.overlayType = "paths";
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

  createConnectionOverlays();
  createValidationOverlays(validateScenario());
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
    const routeCurve = getRouteCurve(trainRecord.selectedRouteId ?? trainRecord.route);
    if (!routeCurve) {
      trainObject.visible = true;
      return;
    }
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
  if (snapEnabledInput) {
    snapEnabledInput.checked = appState.snapEnabled;
  }
  document.body.classList.toggle("is-presenting", appState.presentationMode);
  if (presentationModeButton) {
    presentationModeButton.textContent = appState.presentationMode ? "Exit presentation" : "Presentation mode";
    presentationModeButton.classList.toggle("is-active", appState.presentationMode);
  }
  syncHistoryControls();
  updateTrainNameInput();
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

  snapEnabledInput?.addEventListener("change", () => {
    pushHistory();
    appState.snapEnabled = snapEnabledInput.checked;
    scenario.view.snapEnabled = appState.snapEnabled;
    syncControls();
    scheduleUrlUpdate();
  });

  clearSelectionButton?.addEventListener("click", () => {
    selectedModuleId = null;
    selectedConflictId = null;
    followingTrain = false;
    followTrainButton?.classList.remove("is-active");
    rebuildScenario();
  });

  deleteSelectedButton?.addEventListener("click", deleteSelected);
  duplicateSelectedButton?.addEventListener("click", duplicateSelected);
  undoButton?.addEventListener("click", undoAction);
  redoButton?.addEventListener("click", redoAction);
  rebuildRoutesButton?.addEventListener("click", () => {
    rebuildRoutesFromConnections();
    rebuildScenario();
  });
  resetDemoButton?.addEventListener("click", resetDemo);

  presentationModeButton?.addEventListener("click", () => {
    pushHistory();
    appState.presentationMode = !appState.presentationMode;
    scenario.view.presentationMode = appState.presentationMode;
    syncControls();
    scheduleUrlUpdate();
  });

  exportScreenshotButton?.addEventListener("click", () => {
    renderer.render(scene, camera);
    const screenshotLink = document.createElement("a");
    screenshotLink.href = renderer.domElement.toDataURL("image/png");
    screenshotLink.download = "rail-scenario-planner.png";
    screenshotLink.click();
  });

  moduleNameInput?.addEventListener("change", () => {
    const selectedModule = selectedModuleId ? getModuleById(selectedModuleId) : null;
    if (!selectedModule) {
      return;
    }
    pushHistory();
    selectedModule.name = moduleNameInput.value.trim() || undefined;
    rebuildScenario();
    scheduleUrlUpdate();
  });

  moduleRotationInput?.addEventListener("input", () => {
    const selectedModule = selectedModuleId ? getModuleById(selectedModuleId) : null;
    if (!selectedModule) {
      return;
    }
    selectedModule.rotation = (Number(moduleRotationInput.value) * Math.PI) / 180;
    if (moduleRotationValue) {
      moduleRotationValue.textContent = `${moduleRotationInput.value} deg`;
    }
    removeConnectionsForModule(selectedModule.id);
    rebuildScenario();
  });

  moduleRotationInput?.addEventListener("pointerdown", pushHistory);
  moduleRotationInput?.addEventListener("change", scheduleUrlUpdate);

  reconnectModuleButton?.addEventListener("click", () => {
    const selectedModule = selectedModuleId ? getModuleById(selectedModuleId) : null;
    if (!selectedModule) {
      return;
    }
    const openPort = getWorldPorts(selectedModule).find((portRecord) => !isPortConnected(selectedModule.id, portRecord.id));
    if (!openPort) {
      return;
    }
    const targetPort = findNearestOpenPort(openPort.position, selectedModule.id);
    if (!targetPort) {
      return;
    }
    pushHistory();
    scenario.connections.push({
      fromModuleId: targetPort.moduleId,
      fromPortId: targetPort.id,
      toModuleId: selectedModule.id,
      toPortId: openPort.id,
    });
    rebuildScenario();
    scheduleUrlUpdate();
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
    pushHistory();
    selectedTrain.displayName = trainNameInput.value.trim();
    rebuildScenario();
    scheduleUrlUpdate();
  });

  trainRouteSelect?.addEventListener("change", () => {
    const selectedTrain = scenario.trains.find((trainRecord) => trainRecord.id === selectedTrainId);
    if (!selectedTrain) {
      return;
    }
    pushHistory();
    selectedTrain.selectedRouteId = trainRouteSelect.value;
    selectedTrain.route = trainRouteSelect.value;
    rebuildScenario();
    scheduleUrlUpdate();
  });

  selectedTrainSpeedInput?.addEventListener("input", () => {
    const selectedTrain = scenario.trains.find((trainRecord) => trainRecord.id === selectedTrainId);
    if (!selectedTrain) {
      return;
    }
    selectedTrain.speed = Number(selectedTrainSpeedInput.value);
    if (selectedTrainSpeedValue) {
      selectedTrainSpeedValue.textContent = selectedTrain.speed.toFixed(1);
    }
  });

  selectedTrainSpeedInput?.addEventListener("pointerdown", pushHistory);
  selectedTrainSpeedInput?.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight" || event.key === "ArrowUp" || event.key === "ArrowDown") {
      pushHistory();
    }
  });

  selectedTrainSpeedInput?.addEventListener("change", () => {
    scheduleUrlUpdate();
  });

  trainEnabledInput?.addEventListener("change", () => {
    const selectedTrain = scenario.trains.find((trainRecord) => trainRecord.id === selectedTrainId);
    if (!selectedTrain) {
      return;
    }
    pushHistory();
    selectedTrain.enabled = trainEnabledInput.checked;
    rebuildScenario();
    scheduleUrlUpdate();
  });

  trainColorInput?.addEventListener("change", () => {
    const selectedTrain = scenario.trains.find((trainRecord) => trainRecord.id === selectedTrainId);
    if (!selectedTrain) {
      return;
    }
    pushHistory();
    selectedTrain.color = trainColorInput.value;
    rebuildScenario();
    scheduleUrlUpdate();
  });

  conflictLabelInput?.addEventListener("change", () => {
    const selectedConflict = scenario.conflicts.find((conflictRecord) => conflictRecord.id === selectedConflictId);
    if (!selectedConflict) {
      return;
    }
    pushHistory();
    selectedConflict.label = conflictLabelInput.value.trim() || "Conflict";
    rebuildScenario();
    scheduleUrlUpdate();
  });

  conflictTypeSelect?.addEventListener("change", () => {
    const selectedConflict = scenario.conflicts.find((conflictRecord) => conflictRecord.id === selectedConflictId);
    if (!selectedConflict) {
      return;
    }
    pushHistory();
    selectedConflict.type = conflictTypeSelect.value;
    rebuildScenario();
    scheduleUrlUpdate();
  });

  conflictSeveritySelect?.addEventListener("change", () => {
    const selectedConflict = scenario.conflicts.find((conflictRecord) => conflictRecord.id === selectedConflictId);
    if (!selectedConflict) {
      return;
    }
    pushHistory();
    selectedConflict.severity = conflictSeveritySelect.value;
    rebuildScenario();
    scheduleUrlUpdate();
  });

  conflictActiveInput?.addEventListener("change", () => {
    const selectedConflict = scenario.conflicts.find((conflictRecord) => conflictRecord.id === selectedConflictId);
    if (!selectedConflict) {
      return;
    }
    pushHistory();
    selectedConflict.active = conflictActiveInput.checked;
    rebuildScenario();
    scheduleUrlUpdate();
  });

  nextTrainButton?.addEventListener("click", () => {
    if (scenario.trains.length === 0) {
      return;
    }
    const currentIndex = Math.max(0, scenario.trains.findIndex((trainRecord) => trainRecord.id === selectedTrainId));
    selectedTrainId = scenario.trains[(currentIndex + 1) % scenario.trains.length].id;
    selectedModuleId = null;
    selectedConflictId = null;
    rebuildScenario();
  });

  [
    [labelsToggle, "labels"],
    [conflictsToggle, "conflicts"],
    [blocksToggle, "blocks"],
    [pathsToggle, "paths"],
    [connectionsToggle, "connections"],
    [validationToggle, "validation"],
  ].forEach(([toggleElement, overlayName]) => {
    toggleElement?.addEventListener("change", () => {
      pushHistory();
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
    if (event.ctrlKey || event.metaKey) {
      return;
    }
    const pickedObject = getPickedObject(event);
    if (pickedObject) {
      setSelectedObject(pickedObject);
      if (pickedObject.type === "module" || pickedObject.type === "conflict") {
        dragState = {
          type: pickedObject.type,
          id: pickedObject.id,
          historyCaptured: false,
        };
        orbitControls.enabled = false;
        renderer.domElement.setPointerCapture(event.pointerId);
      }
      return;
    }
    const groundPoint = pointerToGround(event);
    if (event.shiftKey) {
      selectNearestModule(groundPoint);
      return;
    }
    addScenarioObject(groundPoint);
  });

  renderer.domElement.addEventListener("pointermove", (event) => {
    const groundPoint = pointerToGround(event);
    if (dragState) {
      moveSelectedObjectToGround(groundPoint);
      return;
    }
    updatePlacementPreview(groundPoint);
  });

  renderer.domElement.addEventListener("pointerup", (event) => {
    if (!dragState) {
      return;
    }
    dragState = null;
    orbitControls.enabled = true;
    try {
      renderer.domElement.releasePointerCapture(event.pointerId);
    } catch {
      // Pointer capture may already be released if the browser cancels the gesture.
    }
    scheduleUrlUpdate();
  });

  renderer.domElement.addEventListener("pointerleave", clearPlacementPreview);

  window.addEventListener("keydown", (event) => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) {
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
      event.preventDefault();
      undoAction();
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") {
      event.preventDefault();
      redoAction();
      return;
    }
    if (event.key.toLowerCase() === "r") {
      toolRotation = (toolRotation + Math.PI * 0.5) % (Math.PI * 2);
      return;
    }
    if (event.key === "Delete") {
      deleteSelected();
      return;
    }
    if (event.key === "Escape") {
      selectedModuleId = null;
      selectedConflictId = null;
      followingTrain = false;
      followTrainButton?.classList.remove("is-active");
      rebuildScenario();
    }
  });

  orbitControls.addEventListener("start", () => {
    cameraPresetActive = false;
  });
}

function hydrateViewState() {
  appState.speed = scenario.view?.speed ?? appState.speed;
  appState.snapEnabled = scenario.view?.snapEnabled ?? appState.snapEnabled;
  appState.presentationMode = scenario.view?.presentationMode ?? appState.presentationMode;
  appState.overlays = {
    ...appState.overlays,
    ...(scenario.view?.overlays ?? {}),
  };
  scenario.trains.forEach((trainRecord) => {
    trainRecord.selectedRouteId = trainRecord.selectedRouteId ?? trainRecord.route ?? "main";
  });
  if (snapEnabledInput) snapEnabledInput.checked = appState.snapEnabled;
  if (labelsToggle) labelsToggle.checked = appState.overlays.labels;
  if (conflictsToggle) conflictsToggle.checked = appState.overlays.conflicts;
  if (blocksToggle) blocksToggle.checked = appState.overlays.blocks;
  if (pathsToggle) pathsToggle.checked = appState.overlays.paths;
  if (connectionsToggle) connectionsToggle.checked = appState.overlays.connections;
  if (validationToggle) validationToggle.checked = appState.overlays.validation;
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
