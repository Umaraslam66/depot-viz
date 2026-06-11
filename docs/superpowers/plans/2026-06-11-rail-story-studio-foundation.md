# Rail Story Studio — Plan 1: Foundation & World

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the no-build vanilla app with a Vite + React + TypeScript + react-three-fiber app that reaches build-tool parity with the old editor, rendered in the stylized-miniature look, with tested framework-free sim logic and JSON-v2 persistence.

**Architecture:** Pure domain logic lives in `src/sim/` (no React/Three imports, fully unit-tested). zustand stores (`world` with zundo undo/redo, `ui` transient) drive R3F components in `src/world/` and floating panels in `src/ui/`. Persistence is localStorage autosave + JSON v2 import/export — a clean break from the v1 format.

**Tech Stack:** Vite, React 19, TypeScript, three, @react-three/fiber, @react-three/drei, zustand, zundo, Vitest, @testing-library/react.

**Spec:** `docs/superpowers/specs/2026-06-11-frontend-revamp-design.md`. This plan covers spec §1 (architecture), §2 partially (stylized scene, Daylight only — presets come in Plan 2), §3 (build experience), §7 (error handling for saves). Plan 2 (Director & Environments) and Plan 3 (Video Export) will be written after this plan lands.

**Branch:** work on `revamp/rail-story-studio` (use a worktree). The old app is deleted in Task 1; it remains in git history.

---

## File structure (end state of this plan)

```text
index.html                      Vite entry (replaces old static shell)
vite.config.ts                  Vite + Vitest config
package.json / tsconfig.json
src/main.tsx                    React bootstrap
src/App.tsx                     Layout: canvas + floating panels
src/styles/app.css              Floating-studio theme
src/sim/types.ts                Scenario v2 types (world + story)
src/sim/geometry.ts             Ports, rotation math (pure)
src/sim/railGraph.ts            Longest-path route search (ported)
src/sim/routes.ts               Connected components -> routes
src/sim/snapping.ts             Magnetic snap, placement/move plans
src/sim/validation.ts           Scenario warnings (ported, pure)
src/sim/serialization.ts        JSON v2 serialize/parse
src/sim/demoScenario.ts         Built-in demo world
src/state/worldStore.ts         zustand + zundo (undoable world)
src/state/uiStore.ts            Tool, selection, playback (transient)
src/state/persistence.ts        Autosave + load order + file io
src/world/WorldCanvas.tsx       R3F Canvas, controls, placement
src/world/Lighting.tsx          Daylight rig
src/world/Ground.tsx            Miniature base plate
src/world/TrackModules.tsx      Module rendering + drag/select
src/world/trackMeshes.tsx       Stylized meshes per module type
src/world/Trains.tsx            Train meshes + route animation
src/world/Conflicts.tsx         Conflict markers
src/world/simClock.ts           Mutable sim-time (render-loop safe)
src/ui/TopBar.tsx               Title, save status, play controls
src/ui/Toolbar.tsx              Tool buttons
src/ui/Inspector.tsx            Contextual properties panel
src/ui/ValidationPanel.tsx      Warnings list
src/ui/useShortcuts.ts          Keyboard shortcuts
src/export/downloads.ts         Blob download helper
tests/  (Vitest, mirrors src/sim and src/state)
```

---

### Task 1: Branch, clean slate, Vite scaffold

**Files:**
- Delete: `src/` (entire old tree), `index.html`, `tests/` (old node tests), `frontend.md`, `.nojekyll`
- Create: Vite scaffold (`package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/styles/app.css`)

- [ ] **Step 1: Create branch and remove the old app**

```bash
git checkout -b revamp/rail-story-studio
git rm -r src index.html tests .nojekyll
rm -f frontend.md
git commit -m "chore: remove v1 static app (clean break per spec)"
```

- [ ] **Step 2: Scaffold Vite into the repo root**

```bash
npm create vite@latest . -- --template react-ts
npm install
npm install three @react-three/fiber @react-three/drei zustand zundo
npm install -D vitest @types/three jsdom @testing-library/react @testing-library/jest-dom
```

If `npm create vite` refuses a non-empty directory, scaffold into `/tmp/rss-scaffold` and copy `package.json`, `tsconfig*.json`, `vite.config.ts`, `index.html`, `src/` over, then re-run the installs.

- [ ] **Step 3: Replace scaffold boilerplate**

Delete `src/assets/`, `src/App.css`, `src/index.css`, `public/vite.svg`.

`index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Rail Story Studio</title>
    <link rel="icon" href="data:," />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`src/main.tsx`:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/app.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

`src/App.tsx` (placeholder, replaced in Task 11):

```tsx
export default function App() {
  return <div className="app-shell" />;
}
```

`src/styles/app.css` (theme tokens; panels styled in Task 11):

```css
:root {
  --panel-bg: rgba(255, 255, 255, 0.82);
  --panel-border: rgba(255, 255, 255, 0.6);
  --panel-shadow: 0 8px 28px rgba(40, 60, 50, 0.18);
  --panel-radius: 14px;
  --ink: #28323b;
  --ink-soft: #5d6b75;
  --accent: #e85d3d;
  --accent-soft: #fbe3db;
  --ok: #4f9d69;
  --warn: #d97706;
}
* { box-sizing: border-box; }
html, body, #root { height: 100%; margin: 0; }
body {
  font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
  color: var(--ink);
  overflow: hidden;
}
.app-shell { position: relative; height: 100%; background: #cfe9e3; }
```

`vite.config.ts`:

```ts
/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./",
  plugins: [react()],
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
  },
});
```

Add a `test` script to `package.json`: `"test": "vitest run"`.

- [ ] **Step 4: Verify dev server and build**

Run: `npm run build`
Expected: `vite build` completes with no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: scaffold Vite + React + TS + R3F app shell"
```

---

### Task 2: Scenario v2 types and demo world

**Files:**
- Create: `src/sim/types.ts`, `src/sim/demoScenario.ts`
- Test: `tests/sim/demoScenario.test.ts`

- [ ] **Step 1: Write `src/sim/types.ts`**

```ts
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
```

- [ ] **Step 2: Write `src/sim/demoScenario.ts`** (same layout as the v1 demo, new schema)

```ts
import type { ScenarioV2 } from "./types";

export const demoScenario: ScenarioV2 = {
  version: 2,
  nextId: 20,
  meta: {
    title: "Rail Story Studio",
    author: "Stakeholder Operations Demo",
    notes: "Use this scenario to discuss capacity, conflicts, and operational tradeoffs.",
  },
  world: {
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
      { id: "t1", name: "IC-214", color: "#3d6ea5", speed: 7.2, startOffset: 0, enabled: true, routeId: null },
      { id: "t2", name: "RE-08", color: "#4f9d69", speed: 6.1, startOffset: 0.34, enabled: true, routeId: null },
      { id: "t3", name: "FR-772", color: "#9333ea", speed: 5.2, startOffset: 0.18, enabled: true, routeId: "route-2" },
    ],
    conflicts: [
      { id: "c1", type: "junction", severity: "high", position: [-2, 0, -4], affectedModuleIds: ["m3"], affectedTrainIds: ["t1", "t2"], label: "Junction J1 crossing move", active: true },
      { id: "c2", type: "platform", severity: "medium", position: [15, 0, -4], affectedModuleIds: ["m5"], affectedTrainIds: ["t2"], label: "Platform 2 occupied", active: true },
      { id: "c3", type: "blocked", severity: "high", position: [6, 0, -4], affectedModuleIds: ["m4"], affectedTrainIds: ["t1"], label: "Maintenance possession on block B4", active: true },
    ],
  },
  story: { shots: [], annotations: [] },
};
```

- [ ] **Step 3: Write the failing integrity test** — `tests/sim/demoScenario.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { demoScenario } from "../../src/sim/demoScenario";

describe("demoScenario", () => {
  it("has unique ids across modules, trains, conflicts", () => {
    const ids = [
      ...demoScenario.world.trackModules.map((m) => m.id),
      ...demoScenario.world.trains.map((t) => t.id),
      ...demoScenario.world.conflicts.map((c) => c.id),
    ];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("only connects existing modules", () => {
    const moduleIds = new Set(demoScenario.world.trackModules.map((m) => m.id));
    for (const c of demoScenario.world.connections) {
      expect(moduleIds.has(c.fromModuleId)).toBe(true);
      expect(moduleIds.has(c.toModuleId)).toBe(true);
    }
  });

  it("keeps nextId above all numeric id suffixes", () => {
    const maxSuffix = Math.max(
      ...[...demoScenario.world.trackModules, ...demoScenario.world.trains, ...demoScenario.world.conflicts]
        .map((r) => Number(r.id.replace(/^[a-z]+/, ""))),
    );
    expect(demoScenario.nextId).toBeGreaterThan(maxSuffix);
  });
});
```

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: 3 passing.

- [ ] **Step 5: Commit**

```bash
git add src/sim tests
git commit -m "feat: scenario v2 types and demo world"
```

---

### Task 3: Pure geometry module

**Files:**
- Create: `src/sim/geometry.ts`
- Test: `tests/sim/geometry.test.ts`

- [ ] **Step 1: Write the failing tests** — `tests/sim/geometry.test.ts`

```ts
import { describe, expect, it } from "vitest";
import {
  distance,
  getModulePortDefinitions,
  getWorldPorts,
  localDirectionToWorld,
  normalizeRotation,
  worldPosition,
} from "../../src/sim/geometry";
import type { TrackModule } from "../../src/sim/types";

const straight: TrackModule = { id: "m1", type: "straight", position: [10, 0, 5], rotation: 0 };

describe("geometry", () => {
  it("transforms local to world with rotation", () => {
    const rotated: TrackModule = { ...straight, rotation: Math.PI / 2 };
    const p = worldPosition(rotated, 4, 0.18, 0);
    expect(p.x).toBeCloseTo(10);
    expect(p.z).toBeCloseTo(5 - 4);
    expect(p.y).toBeCloseTo(0.18);
  });

  it("rotates directions and keeps them normalized", () => {
    const d = localDirectionToWorld({ ...straight, rotation: Math.PI }, 1, 0);
    expect(d.x).toBeCloseTo(-1);
    expect(d.z).toBeCloseTo(0);
  });

  it("defines ports for track types and none for signals", () => {
    expect(getModulePortDefinitions("straight").map((p) => p.id)).toEqual(["A", "B"]);
    expect(getModulePortDefinitions("turnout")).toHaveLength(3);
    expect(getModulePortDefinitions("signal")).toHaveLength(0);
  });

  it("produces world ports at module ends", () => {
    const ports = getWorldPorts(straight);
    expect(ports[0].position.x).toBeCloseTo(6);
    expect(ports[1].position.x).toBeCloseTo(14);
  });

  it("normalizes rotation into [0, 2PI)", () => {
    expect(normalizeRotation(-Math.PI / 2)).toBeCloseTo(Math.PI * 1.5);
    expect(normalizeRotation(Math.PI * 2.5)).toBeCloseTo(Math.PI * 0.5);
  });

  it("measures planar distance", () => {
    expect(distance({ x: 0, y: 0, z: 0 }, { x: 3, y: 0, z: 4 })).toBeCloseTo(5);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `Cannot find module '../../src/sim/geometry'`.

- [ ] **Step 3: Write `src/sim/geometry.ts`** (port of `src/scene/trackGeometry.js`, THREE removed)

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: all passing.

- [ ] **Step 5: Commit**

```bash
git add src/sim/geometry.ts tests/sim/geometry.test.ts
git commit -m "feat: pure geometry module with ports and rotation math"
```

---

### Task 4: Rail graph (longest path)

**Files:**
- Create: `src/sim/railGraph.ts`
- Test: `tests/sim/railGraph.test.ts`

- [ ] **Step 1: Write the failing tests** — `tests/sim/railGraph.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { buildConnectedRouteModuleIds } from "../../src/sim/railGraph";
import type { Connection, TrackModule } from "../../src/sim/types";

function mod(id: string): TrackModule {
  return { id, type: "straight", position: [0, 0, 0], rotation: 0 };
}
function conn(a: string, b: string): Connection {
  return { fromModuleId: a, fromPortId: "B", toModuleId: b, toPortId: "A" };
}

describe("buildConnectedRouteModuleIds", () => {
  it("returns the longest chain in order", () => {
    const route = buildConnectedRouteModuleIds(
      [mod("a"), mod("b"), mod("c"), mod("d")],
      [conn("a", "b"), conn("b", "c"), conn("c", "d")],
    );
    expect(route).toEqual(["a", "b", "c", "d"]);
  });

  it("returns null when fewer than two modules are connected", () => {
    expect(buildConnectedRouteModuleIds([mod("a"), mod("b")], [])).toBeNull();
  });

  it("ignores connections to unknown modules", () => {
    expect(buildConnectedRouteModuleIds([mod("a")], [conn("a", "ghost")])).toBeNull();
  });

  it("prefers paths through earlier-placed modules on ties", () => {
    const route = buildConnectedRouteModuleIds(
      [mod("a"), mod("b"), mod("c")],
      [conn("a", "b"), conn("a", "c")],
    );
    expect(route).toHaveLength(3);
    expect(route).toContain("a");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `src/sim/railGraph.ts`** — direct TypeScript port of `src/utils/railGraph.js` (same algorithm, typed):

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test` — Expected: all passing.

- [ ] **Step 5: Commit**

```bash
git add src/sim/railGraph.ts tests/sim/railGraph.test.ts
git commit -m "feat: port rail graph longest-path search to TypeScript"
```

---

### Task 5: Routes from connected components

**Files:**
- Create: `src/sim/routes.ts`
- Test: `tests/sim/routes.test.ts`

- [ ] **Step 1: Write the failing tests** — `tests/sim/routes.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { findRoutes, routeWaypoints } from "../../src/sim/routes";
import { demoScenario } from "../../src/sim/demoScenario";

describe("findRoutes", () => {
  it("finds both demo routes (main line and branch)", () => {
    const routes = findRoutes(demoScenario.world);
    expect(routes.map((r) => r.id)).toEqual(["route-1", "route-2"]);
    expect(routes[0].moduleIds).toEqual(["m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8"]);
    expect(routes[1].moduleIds).toEqual(["m9", "m10", "m11"]);
  });

  it("returns no routes for an empty world", () => {
    expect(findRoutes({ trackModules: [], connections: [], trains: [], conflicts: [] })).toEqual([]);
  });
});

describe("routeWaypoints", () => {
  it("returns one waypoint per module at track height", () => {
    const routes = findRoutes(demoScenario.world);
    const points = routeWaypoints(demoScenario.world, routes[0]);
    expect(points).toHaveLength(8);
    expect(points[0]).toEqual([-18, 0.55, -4]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test` — Expected: FAIL, module not found.

- [ ] **Step 3: Write `src/sim/routes.ts`**

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test` — Expected: all passing.

- [ ] **Step 5: Commit**

```bash
git add src/sim/routes.ts tests/sim/routes.test.ts
git commit -m "feat: derive named routes from connected components"
```

---

### Task 6: Snapping and placement planning

**Files:**
- Create: `src/sim/snapping.ts`
- Test: `tests/sim/snapping.test.ts`

- [ ] **Step 1: Write the failing tests** — `tests/sim/snapping.test.ts`

```ts
import { describe, expect, it } from "vitest";
import {
  GRID_SIZE,
  findNearestOpenPort,
  isPortConnected,
  moduleOverlaps,
  planModulePlacement,
  planModuleMove,
  snapToGrid,
} from "../../src/sim/snapping";
import type { WorldState } from "../../src/sim/types";

function world(partial: Partial<WorldState> = {}): WorldState {
  return { trackModules: [], connections: [], trains: [], conflicts: [], ...partial };
}

const single = world({
  trackModules: [{ id: "m1", type: "straight", position: [0, 0, 0], rotation: 0 }],
});

describe("snapping", () => {
  it("snaps values to the grid", () => {
    expect(snapToGrid(5.6)).toBe(GRID_SIZE);
    expect(snapToGrid(6.1)).toBe(8);
  });

  it("detects connected ports", () => {
    const w = world({
      trackModules: single.trackModules,
      connections: [{ fromModuleId: "m1", fromPortId: "B", toModuleId: "m2", toPortId: "A" }],
    });
    expect(isPortConnected(w.connections, "m1", "B")).toBe(true);
    expect(isPortConnected(w.connections, "m1", "A")).toBe(false);
  });

  it("finds the nearest open port within tolerance", () => {
    const port = findNearestOpenPort(single, { x: 5, y: 0, z: 0 });
    expect(port?.moduleId).toBe("m1");
    expect(port?.id).toBe("B");
    expect(findNearestOpenPort(single, { x: 50, y: 0, z: 0 })).toBeNull();
  });

  it("detects overlap inside tolerance", () => {
    const candidate = { id: "x", type: "straight" as const, position: [1, 0, 1] as [number, number, number], rotation: 0 };
    expect(moduleOverlaps(single.trackModules, candidate)).toBe(true);
    expect(moduleOverlaps(single.trackModules, { ...candidate, position: [20, 0, 0] })).toBe(false);
  });

  it("plans snapped placement that aligns and connects to the open port", () => {
    // (6, 0.5) is 2.06 from m1's open port B at (4, 0) — inside SNAP_TOLERANCE.
    const plan = planModulePlacement(single, "straight", { x: 6, y: 0, z: 0.5 }, true);
    expect(plan.kind).toBe("place");
    if (plan.kind !== "place") return;
    expect(plan.module.position[0]).toBeCloseTo(8);
    expect(plan.module.position[2]).toBeCloseTo(0);
    expect(plan.connection).toEqual({
      fromModuleId: "m1",
      fromPortId: "B",
      toModuleId: plan.module.id,
      toPortId: "A",
    });
  });

  it("falls back to grid placement away from ports", () => {
    const plan = planModulePlacement(single, "straight", { x: 25.8, y: 0, z: 13.2 }, true);
    expect(plan.kind).toBe("place");
    if (plan.kind !== "place") return;
    expect(plan.module.position).toEqual([24, 0, 12]);
    expect(plan.connection).toBeNull();
  });

  it("rejects placement that overlaps an existing module", () => {
    const blocked = world({
      trackModules: [
        ...single.trackModules,
        { id: "m2", type: "straight", position: [24, 0, 12], rotation: 0 },
      ],
    });
    const plan = planModulePlacement(blocked, "straight", { x: 24.5, y: 0, z: 12.4 }, true);
    expect(plan.kind).toBe("rejected");
  });

  it("plans grid move for an existing module", () => {
    const plan = planModuleMove(single, "m1", { x: 13.4, y: 0, z: -2.2 }, true);
    expect(plan.kind).toBe("move");
    if (plan.kind !== "move") return;
    expect(plan.position).toEqual([12, 0, -4]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test` — Expected: FAIL, module not found.

- [ ] **Step 3: Write `src/sim/snapping.ts`** (port of `findNearestOpenPort` / `alignModulePortToTarget` / `moduleOverlaps` / placement+move planning from `main.js:965-1060` and `main.js:1661-1723`, made pure)

```ts
import {
  distance,
  getModulePortDefinitions,
  getWorldPorts,
  moduleHasPorts,
  normalizeRotation,
  worldPosition,
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test` — Expected: all passing. If the "plans snapped placement" test fails on rotation/position, debug `alignModulePortToTarget` against the old `main.js:1006-1031` behavior before changing the test.

- [ ] **Step 5: Commit**

```bash
git add src/sim/snapping.ts tests/sim/snapping.test.ts
git commit -m "feat: pure snapping with placement and move planning"
```

---

### Task 7: Validation

**Files:**
- Create: `src/sim/validation.ts`
- Test: `tests/sim/validation.test.ts`

- [ ] **Step 1: Write the failing tests** — `tests/sim/validation.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { countActionableWarnings, validateWorld } from "../../src/sim/validation";
import { demoScenario } from "../../src/sim/demoScenario";
import type { WorldState } from "../../src/sim/types";

describe("validateWorld", () => {
  it("reports open ports as info severity", () => {
    const warnings = validateWorld(demoScenario.world);
    const openPorts = warnings.filter((w) => w.type === "disconnected-port");
    expect(openPorts.length).toBeGreaterThan(0);
    expect(openPorts.every((w) => w.severity === "info")).toBe(true);
  });

  it("reports overlapping modules", () => {
    const world: WorldState = {
      trackModules: [
        { id: "a", type: "straight", position: [0, 0, 0], rotation: 0 },
        { id: "b", type: "straight", position: [1, 0, 0], rotation: 0 },
      ],
      connections: [],
      trains: [],
      conflicts: [],
    };
    expect(validateWorld(world).some((w) => w.type === "overlap")).toBe(true);
  });

  it("reports trains with no available route and disabled trains", () => {
    const world: WorldState = {
      trackModules: [],
      connections: [],
      trains: [{ id: "t1", name: "X", color: "#fff", speed: 5, startOffset: 0, enabled: false, routeId: null }],
      conflicts: [],
    };
    const types = validateWorld(world).map((w) => w.type);
    expect(types).toContain("route");
    expect(types).toContain("disabled-train");
  });

  it("reports active conflicts with empty scope", () => {
    const world: WorldState = {
      ...demoScenario.world,
      conflicts: [{ id: "c", type: "delay", severity: "medium", position: [0, 0, 0], affectedModuleIds: [], affectedTrainIds: [], label: "Empty", active: true }],
    };
    expect(validateWorld(world).some((w) => w.type === "conflict-scope")).toBe(true);
  });

  it("counts only non-info warnings as actionable", () => {
    const warnings = validateWorld(demoScenario.world);
    expect(countActionableWarnings(warnings)).toBe(warnings.filter((w) => w.severity !== "info").length);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test` — Expected: FAIL, module not found.

- [ ] **Step 3: Write `src/sim/validation.ts`** (port of `validateScenario` at `main.js:2056-2125`, pure)

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test` — Expected: all passing.

- [ ] **Step 5: Commit**

```bash
git add src/sim/validation.ts tests/sim/validation.test.ts
git commit -m "feat: pure world validation with severity levels"
```

---

### Task 8: Serialization (JSON v2)

**Files:**
- Create: `src/sim/serialization.ts`
- Test: `tests/sim/serialization.test.ts`

- [ ] **Step 1: Write the failing tests** — `tests/sim/serialization.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { parseScenario, serializeScenario } from "../../src/sim/serialization";
import { demoScenario } from "../../src/sim/demoScenario";

describe("serialization", () => {
  it("round-trips the demo scenario", () => {
    const json = serializeScenario(demoScenario);
    const parsed = parseScenario(json);
    expect(parsed).toEqual(demoScenario);
  });

  it("rejects invalid JSON", () => {
    expect(parseScenario("not json")).toBeNull();
  });

  it("rejects wrong version", () => {
    const v1 = JSON.stringify({ version: 1, trackModules: [] });
    expect(parseScenario(v1)).toBeNull();
  });

  it("rejects structurally broken documents", () => {
    const broken = JSON.stringify({ version: 2, meta: {}, world: { trackModules: "nope" } });
    expect(parseScenario(broken)).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test` — Expected: FAIL, module not found.

- [ ] **Step 3: Write `src/sim/serialization.ts`**

```ts
import type { ScenarioV2 } from "./types";

export function serializeScenario(scenario: ScenarioV2): string {
  return JSON.stringify(scenario, null, 2);
}

export function parseScenario(json: string): ScenarioV2 | null {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return null;
  }
  if (typeof raw !== "object" || raw === null) return null;
  const doc = raw as Record<string, unknown>;
  if (doc.version !== 2) return null;
  const world = doc.world as Record<string, unknown> | undefined;
  const story = doc.story as Record<string, unknown> | undefined;
  const meta = doc.meta as Record<string, unknown> | undefined;
  if (!world || !story || !meta) return null;
  const arrays = [
    world.trackModules,
    world.connections,
    world.trains,
    world.conflicts,
    story.shots,
    story.annotations,
  ];
  if (!arrays.every(Array.isArray)) return null;
  if (typeof doc.nextId !== "number" || typeof meta.title !== "string") return null;
  return raw as ScenarioV2;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test` — Expected: all passing.

- [ ] **Step 5: Commit**

```bash
git add src/sim/serialization.ts tests/sim/serialization.test.ts
git commit -m "feat: scenario v2 serialization with structural validation"
```

---

### Task 9: World store (zustand + zundo)

**Files:**
- Create: `src/state/worldStore.ts`
- Test: `tests/state/worldStore.test.ts`

- [ ] **Step 1: Write the failing tests** — `tests/state/worldStore.test.ts`

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { useWorldStore } from "../../src/state/worldStore";
import { demoScenario } from "../../src/sim/demoScenario";

describe("worldStore", () => {
  beforeEach(() => {
    useWorldStore.getState().replaceScenario(demoScenario);
    useWorldStore.temporal.getState().clear();
  });

  it("places a module from a plan and connects it", () => {
    const before = useWorldStore.getState().trackModules.length;
    useWorldStore.getState().placeModule("straight", { x: 9, y: 0, z: 0.5 }, true, 0);
    const state = useWorldStore.getState();
    expect(state.trackModules.length).toBe(before + 1);
  });

  it("allocates sequential ids with prefixes", () => {
    const a = useWorldStore.getState().allocateId("m");
    const b = useWorldStore.getState().allocateId("t");
    expect(a).toBe("m20");
    expect(b).toBe("t21");
  });

  it("removes a module together with its connections", () => {
    useWorldStore.getState().removeModule("m3");
    const state = useWorldStore.getState();
    expect(state.trackModules.some((m) => m.id === "m3")).toBe(false);
    expect(state.connections.some((c) => c.fromModuleId === "m3" || c.toModuleId === "m3")).toBe(false);
  });

  it("updates trains", () => {
    useWorldStore.getState().updateTrain("t1", { speed: 9.9, name: "X-1" });
    const train = useWorldStore.getState().trains.find((t) => t.id === "t1")!;
    expect(train.speed).toBe(9.9);
    expect(train.name).toBe("X-1");
  });

  it("undoes and redoes module removal", () => {
    useWorldStore.getState().removeModule("m4");
    expect(useWorldStore.getState().trackModules.some((m) => m.id === "m4")).toBe(false);
    useWorldStore.temporal.getState().undo();
    expect(useWorldStore.getState().trackModules.some((m) => m.id === "m4")).toBe(true);
    useWorldStore.temporal.getState().redo();
    expect(useWorldStore.getState().trackModules.some((m) => m.id === "m4")).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test` — Expected: FAIL, module not found.

- [ ] **Step 3: Write `src/state/worldStore.ts`**

```ts
import { create } from "zustand";
import { temporal } from "zundo";
import { demoScenario } from "../sim/demoScenario";
import type { Vec3 } from "../sim/geometry";
import { planModuleMove, planModulePlacement } from "../sim/snapping";
import type {
  Conflict,
  ModuleType,
  ScenarioMeta,
  ScenarioV2,
  StoryState,
  TrackModule,
  Train,
  WorldState,
} from "../sim/types";

export interface WorldStore extends WorldState {
  nextId: number;
  meta: ScenarioMeta;
  story: StoryState;
  allocateId: (prefix: string) => string;
  replaceScenario: (scenario: ScenarioV2) => void;
  setMeta: (patch: Partial<ScenarioMeta>) => void;
  placeModule: (type: ModuleType, point: Vec3, snap: boolean, rotation: number) => string | null;
  moveModule: (moduleId: string, point: Vec3, snap: boolean) => void;
  rotateModule: (moduleId: string) => void;
  removeModule: (moduleId: string) => void;
  duplicateModule: (moduleId: string) => string | null;
  addTrain: (point: Vec3) => string;
  updateTrain: (trainId: string, patch: Partial<Train>) => void;
  removeTrain: (trainId: string) => void;
  addConflict: (point: Vec3) => string;
  updateConflict: (conflictId: string, patch: Partial<Conflict>) => void;
  moveConflict: (conflictId: string, point: Vec3) => void;
  removeConflict: (conflictId: string) => void;
}

const TRAIN_COLORS = ["#3d6ea5", "#4f9d69", "#9333ea", "#d97706", "#dc2626"];

export const useWorldStore = create<WorldStore>()(
  temporal(
    (set, get) => ({
      ...demoScenario.world,
      nextId: demoScenario.nextId,
      meta: demoScenario.meta,
      story: demoScenario.story,

      allocateId: (prefix) => {
        const id = `${prefix}${get().nextId}`;
        set({ nextId: get().nextId + 1 });
        return id;
      },

      replaceScenario: (scenario) =>
        set({
          ...scenario.world,
          nextId: scenario.nextId,
          meta: scenario.meta,
          story: scenario.story,
        }),

      setMeta: (patch) => set({ meta: { ...get().meta, ...patch } }),

      placeModule: (type, point, snap, rotation) => {
        const id = get().allocateId("m");
        const plan = planModulePlacement(get(), type, point, snap, rotation, id);
        if (plan.kind === "rejected") return null;
        set({
          trackModules: [...get().trackModules, plan.module],
          connections: plan.connection ? [...get().connections, plan.connection] : get().connections,
        });
        return id;
      },

      moveModule: (moduleId, point, snap) => {
        const plan = planModuleMove(get(), moduleId, point, snap);
        if (plan.kind !== "move") return;
        set({
          trackModules: get().trackModules.map((m) =>
            m.id === moduleId ? { ...m, position: plan.position, rotation: plan.rotation } : m,
          ),
          connections: [
            ...get().connections.filter((c) => c.fromModuleId !== moduleId && c.toModuleId !== moduleId),
            ...(plan.connection ? [plan.connection] : []),
          ],
        });
      },

      rotateModule: (moduleId) =>
        set({
          trackModules: get().trackModules.map((m) =>
            m.id === moduleId ? { ...m, rotation: (m.rotation + Math.PI / 2) % (Math.PI * 2) } : m,
          ),
          connections: get().connections.filter(
            (c) => c.fromModuleId !== moduleId && c.toModuleId !== moduleId,
          ),
        }),

      removeModule: (moduleId) =>
        set({
          trackModules: get().trackModules.filter((m) => m.id !== moduleId),
          connections: get().connections.filter(
            (c) => c.fromModuleId !== moduleId && c.toModuleId !== moduleId,
          ),
          conflicts: get().conflicts.map((c) => ({
            ...c,
            affectedModuleIds: c.affectedModuleIds.filter((id) => id !== moduleId),
          })),
        }),

      duplicateModule: (moduleId) => {
        const source = get().trackModules.find((m) => m.id === moduleId);
        if (!source) return null;
        const id = get().allocateId("m");
        const copy: TrackModule = {
          ...source,
          id,
          position: [source.position[0] + 4, 0, source.position[2] + 4],
        };
        set({ trackModules: [...get().trackModules, copy] });
        return id;
      },

      addTrain: (point) => {
        const id = get().allocateId("t");
        const train: Train = {
          id,
          name: `TR-${get().nextId}`,
          color: TRAIN_COLORS[get().trains.length % TRAIN_COLORS.length],
          speed: 6,
          startOffset: (get().trains.length * 0.21) % 1,
          enabled: true,
          routeId: null,
        };
        void point; // trains run on routes; the click point only triggers creation
        set({ trains: [...get().trains, train] });
        return id;
      },

      updateTrain: (trainId, patch) =>
        set({ trains: get().trains.map((t) => (t.id === trainId ? { ...t, ...patch } : t)) }),

      removeTrain: (trainId) =>
        set({
          trains: get().trains.filter((t) => t.id !== trainId),
          conflicts: get().conflicts.map((c) => ({
            ...c,
            affectedTrainIds: c.affectedTrainIds.filter((id) => id !== trainId),
          })),
        }),

      addConflict: (point) => {
        const id = get().allocateId("c");
        const conflict: Conflict = {
          id,
          type: "headway",
          severity: "medium",
          position: [point.x, 0, point.z],
          affectedModuleIds: [],
          affectedTrainIds: [],
          label: "New conflict",
          active: true,
        };
        set({ conflicts: [...get().conflicts, conflict] });
        return id;
      },

      updateConflict: (conflictId, patch) =>
        set({ conflicts: get().conflicts.map((c) => (c.id === conflictId ? { ...c, ...patch } : c)) }),

      moveConflict: (conflictId, point) =>
        set({
          conflicts: get().conflicts.map((c) =>
            c.id === conflictId ? { ...c, position: [point.x, 0, point.z] } : c,
          ),
        }),

      removeConflict: (conflictId) =>
        set({ conflicts: get().conflicts.filter((c) => c.id !== conflictId) }),
    }),
    {
      limit: 50,
      partialize: (state) => ({
        trackModules: state.trackModules,
        connections: state.connections,
        trains: state.trains,
        conflicts: state.conflicts,
        nextId: state.nextId,
      }),
    },
  ),
);

export function buildScenarioSnapshot(): ScenarioV2 {
  const s = useWorldStore.getState();
  return {
    version: 2,
    nextId: s.nextId,
    meta: s.meta,
    world: {
      trackModules: s.trackModules,
      connections: s.connections,
      trains: s.trains,
      conflicts: s.conflicts,
    },
    story: s.story,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test` — Expected: all passing. Note the id test asserts `m20` then `t21`: ids share one counter; that is intended (matches v1 behavior).

- [ ] **Step 5: Commit**

```bash
git add src/state/worldStore.ts tests/state/worldStore.test.ts
git commit -m "feat: undoable world store with placement, trains, conflicts"
```

---

### Task 10: UI store

**Files:**
- Create: `src/state/uiStore.ts`
- Test: `tests/state/uiStore.test.ts`

- [ ] **Step 1: Write the failing tests** — `tests/state/uiStore.test.ts`

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { useUiStore } from "../../src/state/uiStore";

describe("uiStore", () => {
  beforeEach(() => useUiStore.getState().reset());

  it("defaults to select tool, paused, snap on", () => {
    const s = useUiStore.getState();
    expect(s.tool).toBe("select");
    expect(s.playing).toBe(false);
    expect(s.snapEnabled).toBe(true);
  });

  it("clears selection when switching to a placement tool", () => {
    useUiStore.getState().setSelection({ type: "module", id: "m1" });
    useUiStore.getState().setTool("straight");
    expect(useUiStore.getState().selection).toBeNull();
  });

  it("rotates placement in quarter turns", () => {
    useUiStore.getState().rotatePlacement();
    expect(useUiStore.getState().placementRotation).toBeCloseTo(Math.PI / 2);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test` — Expected: FAIL, module not found.

- [ ] **Step 3: Write `src/state/uiStore.ts`**

```ts
import { create } from "zustand";

export type Tool = "select" | "straight" | "curve" | "turnout" | "station" | "signal" | "train" | "conflict";

export interface Selection {
  type: "module" | "train" | "conflict";
  id: string;
}

interface UiStore {
  tool: Tool;
  selection: Selection | null;
  placementRotation: number;
  snapEnabled: boolean;
  playing: boolean;
  simSpeed: number;
  quality: "performance" | "balanced" | "high";
  draggingId: string | null;
  saveStatus: "saved" | "saving" | "error";
  setTool: (tool: Tool) => void;
  setSelection: (selection: Selection | null) => void;
  rotatePlacement: () => void;
  setSnapEnabled: (on: boolean) => void;
  setPlaying: (on: boolean) => void;
  setSimSpeed: (speed: number) => void;
  setQuality: (q: UiStore["quality"]) => void;
  setDraggingId: (id: string | null) => void;
  setSaveStatus: (s: UiStore["saveStatus"]) => void;
  reset: () => void;
}

const initial = {
  tool: "select" as Tool,
  selection: null,
  placementRotation: 0,
  snapEnabled: true,
  playing: false,
  simSpeed: 1,
  quality: "balanced" as const,
  draggingId: null,
  saveStatus: "saved" as const,
};

export const useUiStore = create<UiStore>()((set, get) => ({
  ...initial,
  setTool: (tool) => set({ tool, selection: tool === "select" ? get().selection : null }),
  setSelection: (selection) => set({ selection }),
  rotatePlacement: () => set({ placementRotation: (get().placementRotation + Math.PI / 2) % (Math.PI * 2) }),
  setSnapEnabled: (snapEnabled) => set({ snapEnabled }),
  setPlaying: (playing) => set({ playing }),
  setSimSpeed: (simSpeed) => set({ simSpeed }),
  setQuality: (quality) => set({ quality }),
  setDraggingId: (draggingId) => set({ draggingId }),
  setSaveStatus: (saveStatus) => set({ saveStatus }),
  reset: () => set(initial),
}));
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test` — Expected: all passing.

- [ ] **Step 5: Commit**

```bash
git add src/state/uiStore.ts tests/state/uiStore.test.ts
git commit -m "feat: transient ui store for tool, selection, playback"
```

---

### Task 11: App shell and floating-panel CSS

**Files:**
- Modify: `src/App.tsx`, `src/styles/app.css`
- Create: `src/world/simClock.ts`

- [ ] **Step 1: Write `src/world/simClock.ts`** (mutable singleton so the render loop never re-renders React)

```ts
export const simClock = {
  time: 0,
};
```

- [ ] **Step 2: Replace `src/App.tsx`**

```tsx
import { Suspense, lazy } from "react";
import { TopBar } from "./ui/TopBar";
import { Toolbar } from "./ui/Toolbar";
import { Inspector } from "./ui/Inspector";
import { ValidationPanel } from "./ui/ValidationPanel";
import { useShortcuts } from "./ui/useShortcuts";

const WorldCanvas = lazy(() => import("./world/WorldCanvas"));

export default function App() {
  useShortcuts();
  return (
    <div className="app-shell">
      <Suspense fallback={null}>
        <WorldCanvas />
      </Suspense>
      <TopBar />
      <Toolbar />
      <Inspector />
      <ValidationPanel />
    </div>
  );
}
```

This will not compile until Tasks 12–16 create the imports. To keep every commit green, create one-line stub files now and replace each in its task — each stub renders nothing but is a real component:

`src/ui/TopBar.tsx`, `src/ui/Toolbar.tsx`, `src/ui/Inspector.tsx`, `src/ui/ValidationPanel.tsx` each as (adjust the name):

```tsx
export function TopBar() {
  return null;
}
```

`src/ui/useShortcuts.ts`:

```ts
export function useShortcuts(): void {}
```

`src/world/WorldCanvas.tsx`:

```tsx
export default function WorldCanvas() {
  return null;
}
```

- [ ] **Step 3: Append the panel system to `src/styles/app.css`**

```css
.panel {
  position: absolute;
  background: var(--panel-bg);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid var(--panel-border);
  border-radius: var(--panel-radius);
  box-shadow: var(--panel-shadow);
  padding: 10px 12px;
  z-index: 10;
}
.panel h2 {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--ink-soft);
  text-transform: uppercase;
}
.top-bar { top: 14px; left: 14px; right: 14px; display: flex; align-items: center; gap: 14px; }
.top-bar .title { font-weight: 650; font-size: 15px; margin-right: auto; }
.toolbar { top: 72px; left: 14px; display: flex; flex-direction: column; gap: 4px; width: 116px; }
.inspector { top: 72px; right: 14px; width: 240px; max-height: calc(100% - 160px); overflow-y: auto; }
.validation { bottom: 14px; left: 14px; width: 280px; max-height: 200px; overflow-y: auto; }

button {
  font: inherit;
  border: 1px solid transparent;
  background: transparent;
  color: var(--ink);
  border-radius: 9px;
  padding: 6px 10px;
  cursor: pointer;
  text-align: left;
}
button:hover { background: rgba(40, 60, 50, 0.07); }
button.is-active { background: var(--accent-soft); color: var(--accent); font-weight: 600; }
button.primary { background: var(--accent); color: #fff; text-align: center; }
button.primary:hover { background: #d44e30; }

.field { display: flex; flex-direction: column; gap: 3px; margin-bottom: 8px; font-size: 12px; color: var(--ink-soft); }
.field input[type="text"], .field textarea, .field select {
  font: inherit; color: var(--ink);
  border: 1px solid rgba(40, 60, 50, 0.18);
  border-radius: 8px; padding: 6px 8px; background: rgba(255, 255, 255, 0.7);
}
.field-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 12px; margin-bottom: 8px; }
.hint { font-size: 12px; color: var(--ink-soft); }
.issue { font-size: 12px; padding: 5px 0; border-bottom: 1px solid rgba(40, 60, 50, 0.08); }
.issue.info { color: var(--ink-soft); }
.issue.warning { color: var(--warn); }
.status { font-size: 12px; color: var(--ink-soft); }
```

- [ ] **Step 4: Verify build**

Run: `npm run build` — Expected: compiles clean.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: app shell with floating panel layout and stubs"
```

---

### Task 12: World canvas, lighting, ground

**Files:**
- Replace: `src/world/WorldCanvas.tsx`
- Create: `src/world/Lighting.tsx`, `src/world/Ground.tsx`

- [ ] **Step 1: Write `src/world/Lighting.tsx`** (Daylight rig — spec §2; presets in Plan 2)

```tsx
export function Lighting() {
  return (
    <>
      <hemisphereLight args={["#dcefff", "#b8c9a8", 0.9]} />
      <directionalLight
        position={[26, 38, 18]}
        intensity={2.0}
        color="#fff4e0"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-45}
        shadow-camera-right={45}
        shadow-camera-top={45}
        shadow-camera-bottom={-45}
      />
    </>
  );
}
```

- [ ] **Step 2: Write `src/world/Ground.tsx`** (miniature base plate; also the placement click target)

```tsx
import { RoundedBox } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import { useUiStore } from "../state/uiStore";
import { useWorldStore } from "../state/worldStore";

export function Ground() {
  const tool = useUiStore((s) => s.tool);

  function handleClick(event: ThreeEvent<MouseEvent>) {
    const { tool, snapEnabled, placementRotation, setSelection, setTool } = useUiStore.getState();
    const world = useWorldStore.getState();
    const point = { x: event.point.x, y: 0, z: event.point.z };
    if (tool === "select") {
      setSelection(null);
      return;
    }
    event.stopPropagation();
    if (tool === "train") {
      const id = world.addTrain(point);
      setSelection({ type: "train", id });
    } else if (tool === "conflict") {
      const id = world.addConflict(point);
      setSelection({ type: "conflict", id });
    } else {
      const id = world.placeModule(tool, point, snapEnabled, placementRotation);
      if (id) setSelection({ type: "module", id });
    }
    setTool("select");
  }

  return (
    <group>
      <RoundedBox
        args={[84, 1.6, 64]}
        radius={0.8}
        position={[0, -0.81, 2]}
        receiveShadow
        onClick={handleClick}
      >
        <meshStandardMaterial color={tool === "select" ? "#9cc98e" : "#a8d29a"} />
      </RoundedBox>
    </group>
  );
}
```

- [ ] **Step 3: Replace `src/world/WorldCanvas.tsx`**

```tsx
import { Canvas, useFrame } from "@react-three/fiber";
import { MapControls } from "@react-three/drei";
import { ACESFilmicToneMapping, PCFSoftShadowMap } from "three";
import { Ground } from "./Ground";
import { Lighting } from "./Lighting";
import { TrackModules } from "./TrackModules";
import { Trains } from "./Trains";
import { Conflicts } from "./Conflicts";
import { simClock } from "./simClock";
import { useUiStore } from "../state/uiStore";

const QUALITY_DPR: Record<string, [number, number]> = {
  performance: [0.75, 1],
  balanced: [1, 1.5],
  high: [1, 2],
};

function SimDriver() {
  useFrame((_, delta) => {
    const { playing, simSpeed } = useUiStore.getState();
    if (playing) {
      simClock.time += delta * simSpeed;
    }
  });
  return null;
}

export default function WorldCanvas() {
  const quality = useUiStore((s) => s.quality);
  const dragging = useUiStore((s) => s.draggingId !== null);
  return (
    <Canvas
      shadows={{ type: PCFSoftShadowMap }}
      dpr={QUALITY_DPR[quality]}
      camera={{ position: [0, 34, 34], fov: 42 }}
      gl={{ antialias: true, toneMapping: ACESFilmicToneMapping, preserveDrawingBuffer: true }}
      style={{ position: "absolute", inset: 0 }}
      onCreated={({ gl }) => {
        // Spec §7: allow the browser to restore a lost WebGL context; three re-uploads GPU resources on restore.
        gl.domElement.addEventListener("webglcontextlost", (event) => event.preventDefault());
      }}
    >
      <color attach="background" args={["#cfe9e3"]} />
      <fog attach="fog" args={["#cfe9e3", 90, 180]} />
      <Lighting />
      <Ground />
      <TrackModules />
      <Trains />
      <Conflicts />
      <SimDriver />
      <MapControls makeDefault enabled={!dragging} maxPolarAngle={Math.PI * 0.46} minDistance={10} maxDistance={120} />
    </Canvas>
  );
}
```

Add matching one-line stubs for `TrackModules`, `Trains`, `Conflicts` (replaced in Tasks 13–14):

```tsx
export function TrackModules() {
  return null;
}
```

- [ ] **Step 4: Manual verification**

Run: `npm run dev`, open the printed URL.
Expected: a soft-green rounded base plate under a calm sky color, soft shadow direction visible on the plate edge, orbit/pan/zoom works.

- [ ] **Step 5: Commit**

```bash
git add src/world
git commit -m "feat: world canvas with daylight rig and miniature base plate"
```

---

### Task 13: Stylized track module meshes

**Files:**
- Create: `src/world/trackMeshes.tsx`
- Replace: `src/world/TrackModules.tsx`

- [ ] **Step 1: Write `src/world/trackMeshes.tsx`** — stylized geometry per module type. Shared pieces first:

```tsx
import { RoundedBox, Text } from "@react-three/drei";

const BALLAST = "#c2b297";
const RAIL = "#6b7280";
const PLATFORM = "#ece4d4";
const SIGNAL_MAST = "#46505a";

function Ballast({ length, width = 2.4 }: { length: number; width?: number }) {
  return (
    <RoundedBox args={[length, 0.3, width]} radius={0.12} position={[0, 0.15, 0]} castShadow receiveShadow>
      <meshStandardMaterial color={BALLAST} />
    </RoundedBox>
  );
}

function RailPair({ length }: { length: number }) {
  return (
    <>
      {[-0.35, 0.35].map((z) => (
        <mesh key={z} position={[0, 0.39, z]} castShadow>
          <boxGeometry args={[length, 0.12, 0.14]} />
          <meshStandardMaterial color={RAIL} metalness={0.4} roughness={0.5} />
        </mesh>
      ))}
    </>
  );
}

export function StraightModule() {
  return (
    <group>
      <Ballast length={8} />
      <RailPair length={8} />
    </group>
  );
}

// Quarter arc, radius 4, centered at local (4, 4): runs from port A (4, 0) to port B (0, 4).
// Theta sweeps 180°..270° around the center; segment yaw follows the arc tangent.
export function CurveModule() {
  const segments = 7;
  const items: { x: number; z: number; yaw: number }[] = [];
  for (let i = 0; i < segments; i += 1) {
    const theta = Math.PI + ((i + 0.5) / segments) * (Math.PI / 2);
    items.push({
      x: 4 + 4 * Math.cos(theta),
      z: 4 + 4 * Math.sin(theta),
      yaw: -(theta + Math.PI / 2),
    });
  }
  const segmentLength = (4 * (Math.PI / 2)) / segments + 0.12;
  return (
    <group>
      {items.map((seg, i) => (
        <group key={i} position={[seg.x, 0, seg.z]} rotation={[0, seg.yaw, 0]}>
          <Ballast length={segmentLength} />
          <RailPair length={segmentLength} />
        </group>
      ))}
    </group>
  );
}

export function TurnoutModule() {
  return (
    <group>
      <Ballast length={8} width={3.2} />
      <RailPair length={8} />
      {/* Diverging leg toward port C at local (3.0, -1.35), direction (0.96, -0.28) */}
      <group position={[1.6, 0, -0.65]} rotation={[0, 0.284, 0]}>
        <RailPair length={3.4} />
      </group>
    </group>
  );
}

export function StationModule({ name }: { name?: string }) {
  return (
    <group>
      <Ballast length={8.8} />
      <RailPair length={8.8} />
      <RoundedBox args={[8.8, 0.5, 1.6]} radius={0.18} position={[0, 0.25, -1.7]} castShadow receiveShadow>
        <meshStandardMaterial color={PLATFORM} />
      </RoundedBox>
      <RoundedBox args={[3.6, 1.4, 1.2]} radius={0.25} position={[0, 1.2, -2.1]} castShadow>
        <meshStandardMaterial color="#f4f0e6" />
      </RoundedBox>
      <RoundedBox args={[4.2, 0.18, 1.6]} radius={0.09} position={[0, 2.0, -2.1]} castShadow>
        <meshStandardMaterial color="#c66b3d" />
      </RoundedBox>
      {name ? (
        <Text position={[0, 2.7, -2.1]} fontSize={0.8} color="#28323b" anchorX="center" anchorY="bottom">
          {name}
        </Text>
      ) : null}
    </group>
  );
}

export function SignalModule() {
  return (
    <group>
      <mesh position={[0, 1.1, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.14, 2.2, 10]} />
        <meshStandardMaterial color={SIGNAL_MAST} />
      </mesh>
      <RoundedBox args={[0.5, 0.9, 0.3]} radius={0.1} position={[0, 2.4, 0]} castShadow>
        <meshStandardMaterial color={SIGNAL_MAST} />
      </RoundedBox>
      <mesh position={[0, 2.6, 0.18]}>
        <sphereGeometry args={[0.13, 12, 12]} />
        <meshStandardMaterial color="#4f9d69" emissive="#4f9d69" emissiveIntensity={1.6} />
      </mesh>
      <mesh position={[0, 2.2, 0.18]}>
        <sphereGeometry args={[0.13, 12, 12]} />
        <meshStandardMaterial color="#7a2e22" emissive="#dc2626" emissiveIntensity={0.15} />
      </mesh>
    </group>
  );
}
```

- [ ] **Step 2: Replace `src/world/TrackModules.tsx`** — render from store, selection highlight, drag with snapping:

```tsx
import { useRef } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import { Plane, Vector3 } from "three";
import { useUiStore } from "../state/uiStore";
import { useWorldStore } from "../state/worldStore";
import type { TrackModule } from "../sim/types";
import { CurveModule, SignalModule, StationModule, StraightModule, TurnoutModule } from "./trackMeshes";

const dragPlane = new Plane(new Vector3(0, 1, 0), 0);
const dragPoint = new Vector3();

function ModuleMesh({ module }: { module: TrackModule }) {
  const selected = useUiStore((s) => s.selection?.type === "module" && s.selection.id === module.id);
  const moved = useRef(false);

  function onPointerDown(event: ThreeEvent<PointerEvent>) {
    if (useUiStore.getState().tool !== "select") return;
    event.stopPropagation();
    moved.current = false;
    useUiStore.getState().setSelection({ type: "module", id: module.id });
    useUiStore.getState().setDraggingId(module.id);
    (event.target as Element).setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: ThreeEvent<PointerEvent>) {
    if (useUiStore.getState().draggingId !== module.id) return;
    event.ray.intersectPlane(dragPlane, dragPoint);
    moved.current = true;
    useWorldStore
      .getState()
      .moveModule(module.id, { x: dragPoint.x, y: 0, z: dragPoint.z }, useUiStore.getState().snapEnabled);
  }

  function onPointerUp() {
    if (useUiStore.getState().draggingId === module.id) {
      useUiStore.getState().setDraggingId(null);
    }
  }

  return (
    <group
      position={module.position}
      rotation={[0, module.rotation, 0]}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {module.type === "straight" && <StraightModule />}
      {module.type === "curve" && <CurveModule />}
      {module.type === "turnout" && <TurnoutModule />}
      {module.type === "station" && <StationModule name={module.name} />}
      {module.type === "signal" && <SignalModule />}
      {selected ? (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[4.6, 5.0, 40]} />
          <meshBasicMaterial color="#e85d3d" transparent opacity={0.85} />
        </mesh>
      ) : null}
    </group>
  );
}

export function TrackModules() {
  const modules = useWorldStore((s) => s.trackModules);
  return (
    <>
      {modules.map((m) => (
        <ModuleMesh key={m.id} module={m} />
      ))}
    </>
  );
}
```

- [ ] **Step 3: Run `npm run build`**

Expected: compiles clean.

- [ ] **Step 4: Manual verification**

Run: `npm run dev`.
Expected: the demo layout renders — two stations with platforms and names, a turnout with a diverging leg, curves that visually connect their neighbors, green/red signal heads. Clicking a module shows the coral selection ring; dragging it moves it with snap; dragging it next to an open track end snaps it into alignment.

- [ ] **Step 5: Commit**

```bash
git add src/world
git commit -m "feat: stylized track modules with selection and magnetic drag"
```

---

### Task 14: Trains and conflict markers

**Files:**
- Replace: `src/world/Trains.tsx`, `src/world/Conflicts.tsx`

- [ ] **Step 1: Write `src/world/Trains.tsx`**

```tsx
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox, Text } from "@react-three/drei";
import { CatmullRomCurve3, Group, Vector3 } from "three";
import { findRoutes, resolveTrainRoute, routeWaypoints } from "../sim/routes";
import type { Train } from "../sim/types";
import { useUiStore } from "../state/uiStore";
import { useWorldStore } from "../state/worldStore";
import { simClock } from "./simClock";

function TrainMesh({ train, curve }: { train: Train; curve: CatmullRomCurve3 | null }) {
  const group = useRef<Group>(null);
  const selected = useUiStore((s) => s.selection?.type === "train" && s.selection.id === train.id);
  const length = useMemo(() => curve?.getLength() ?? 0, [curve]);

  useFrame(() => {
    if (!group.current || !curve || length === 0) return;
    const distance = train.startOffset * length + (train.enabled ? simClock.time * train.speed : 0);
    const u = ((distance % length) + length) % length / length;
    const position = curve.getPointAt(u);
    const tangent = curve.getTangentAt(u);
    group.current.position.copy(position);
    group.current.lookAt(position.clone().add(new Vector3(tangent.x, 0, tangent.z)));
  });

  return (
    <group
      ref={group}
      onClick={(event) => {
        if (useUiStore.getState().tool !== "select") return;
        event.stopPropagation();
        useUiStore.getState().setSelection({ type: "train", id: train.id });
      }}
    >
      <RoundedBox args={[1.5, 1.1, 3.6]} radius={0.42} position={[0, 0.55, 0]} castShadow>
        <meshStandardMaterial color={train.enabled ? train.color : "#9aa3ab"} roughness={0.35} />
      </RoundedBox>
      <RoundedBox args={[1.2, 0.5, 1.6]} radius={0.2} position={[0, 1.25, -0.4]} castShadow>
        <meshStandardMaterial color="#28323b" roughness={0.2} />
      </RoundedBox>
      <Text position={[0, 2.1, 0]} fontSize={0.7} color="#28323b" anchorX="center" anchorY="bottom">
        {train.name}
      </Text>
      {selected ? (
        <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.4, 2.8, 32]} />
          <meshBasicMaterial color="#e85d3d" transparent opacity={0.85} />
        </mesh>
      ) : null}
    </group>
  );
}

export function Trains() {
  const trains = useWorldStore((s) => s.trains);
  const trackModules = useWorldStore((s) => s.trackModules);
  const connections = useWorldStore((s) => s.connections);

  const { routes, curves } = useMemo(() => {
    const world = { trackModules, connections, trains: [], conflicts: [] };
    const routes = findRoutes(world);
    const curves = new Map<string, CatmullRomCurve3>();
    routes.forEach((route) => {
      const points = routeWaypoints(world, route).map(([x, y, z]) => new Vector3(x, y, z));
      if (points.length >= 2) {
        curves.set(route.id, new CatmullRomCurve3(points, false, "catmullrom", 0.4));
      }
    });
    return { routes, curves };
  }, [trackModules, connections]);

  return (
    <>
      {trains.map((train) => {
        const route = resolveTrainRoute(
          { trackModules, connections, trains: [], conflicts: [] },
          train.routeId,
          routes,
        );
        return <TrainMesh key={train.id} train={train} curve={route ? curves.get(route.id) ?? null : null} />;
      })}
    </>
  );
}
```

- [ ] **Step 2: Write `src/world/Conflicts.tsx`**

```tsx
import { useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { Group, Plane, Vector3 } from "three";
import type { Conflict } from "../sim/types";
import { useUiStore } from "../state/uiStore";
import { useWorldStore } from "../state/worldStore";

const dragPlane = new Plane(new Vector3(0, 1, 0), 0);
const dragPoint = new Vector3();

function ConflictMarker({ conflict }: { conflict: Conflict }) {
  const group = useRef<Group>(null);
  const selected = useUiStore((s) => s.selection?.type === "conflict" && s.selection.id === conflict.id);
  const color = conflict.severity === "high" ? "#dc2626" : "#d97706";

  useFrame(({ clock }) => {
    if (!group.current) return;
    const pulse = conflict.active ? 1 + Math.sin(clock.elapsedTime * 3) * 0.08 : 1;
    group.current.scale.setScalar(pulse);
  });

  function onPointerDown(event: ThreeEvent<PointerEvent>) {
    if (useUiStore.getState().tool !== "select") return;
    event.stopPropagation();
    useUiStore.getState().setSelection({ type: "conflict", id: conflict.id });
    useUiStore.getState().setDraggingId(conflict.id);
  }

  function onPointerMove(event: ThreeEvent<PointerEvent>) {
    if (useUiStore.getState().draggingId !== conflict.id) return;
    event.ray.intersectPlane(dragPlane, dragPoint);
    useWorldStore.getState().moveConflict(conflict.id, { x: dragPoint.x, y: 0, z: dragPoint.z });
  }

  function onPointerUp() {
    if (useUiStore.getState().draggingId === conflict.id) {
      useUiStore.getState().setDraggingId(null);
    }
  }

  return (
    <group
      ref={group}
      position={[conflict.position[0], 0, conflict.position[2]]}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.6, 2.1, 32]} />
        <meshBasicMaterial color={color} transparent opacity={conflict.active ? 0.9 : 0.35} />
      </mesh>
      <mesh position={[0, 1.4, 0]} castShadow>
        <coneGeometry args={[0.55, 1.4, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={conflict.active ? 0.4 : 0} />
      </mesh>
      <Text position={[0, 2.6, 0]} fontSize={0.62} color="#28323b" anchorX="center" anchorY="bottom">
        {conflict.label}
      </Text>
      {selected ? (
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.3, 2.6, 32]} />
          <meshBasicMaterial color="#e85d3d" transparent opacity={0.85} />
        </mesh>
      ) : null}
    </group>
  );
}

export function Conflicts() {
  const conflicts = useWorldStore((s) => s.conflicts);
  return (
    <>
      {conflicts.map((c) => (
        <ConflictMarker key={c.id} conflict={c} />
      ))}
    </>
  );
}
```

- [ ] **Step 3: Run `npm run build`** — Expected: compiles clean.

- [ ] **Step 4: Manual verification**

Run: `npm run dev`. Playback is still paused (Play button comes in Task 15); temporarily verify motion by clicking nothing — trains sit at their start offsets along both routes, named labels above them, conflict cones pulse at the junction, platform, and block. Clicking a train or cone selects it (coral ring); dragging a cone moves it.

- [ ] **Step 5: Commit**

```bash
git add src/world
git commit -m "feat: route-following trains and pulsing conflict markers"
```

---

### Task 15: Floating panels — TopBar, Toolbar, shortcuts

**Files:**
- Replace: `src/ui/TopBar.tsx`, `src/ui/Toolbar.tsx`, `src/ui/useShortcuts.ts`

- [ ] **Step 1: Write `src/ui/TopBar.tsx`**

```tsx
import { useUiStore } from "../state/uiStore";
import { useWorldStore } from "../state/worldStore";

export function TopBar() {
  const title = useWorldStore((s) => s.meta.title);
  const playing = useUiStore((s) => s.playing);
  const simSpeed = useUiStore((s) => s.simSpeed);
  const saveStatus = useUiStore((s) => s.saveStatus);
  const quality = useUiStore((s) => s.quality);
  const setPlaying = useUiStore((s) => s.setPlaying);
  const setSimSpeed = useUiStore((s) => s.setSimSpeed);
  const setQuality = useUiStore((s) => s.setQuality);

  return (
    <header className="panel top-bar">
      <span className="title">{title}</span>
      <button className="primary" onClick={() => setPlaying(!playing)}>
        {playing ? "Pause" : "Play"}
      </button>
      <label className="field-row" style={{ marginBottom: 0 }}>
        Speed {simSpeed.toFixed(2)}x
        <input
          type="range"
          min={0}
          max={2.5}
          step={0.05}
          value={simSpeed}
          onChange={(e) => setSimSpeed(Number(e.target.value))}
        />
      </label>
      <label className="field-row" style={{ marginBottom: 0 }}>
        Quality
        <select value={quality} onChange={(e) => setQuality(e.target.value as "performance" | "balanced" | "high")}>
          <option value="performance">Performance</option>
          <option value="balanced">Balanced</option>
          <option value="high">High</option>
        </select>
      </label>
      <span className="status">{saveStatus === "saved" ? "Saved" : saveStatus === "saving" ? "Saving…" : "Save failed"}</span>
    </header>
  );
}
```

- [ ] **Step 2: Write `src/ui/Toolbar.tsx`**

```tsx
import { useUiStore, type Tool } from "../state/uiStore";
import { useWorldStore } from "../state/worldStore";

const TOOLS: { id: Tool; label: string }[] = [
  { id: "select", label: "Select" },
  { id: "straight", label: "Straight" },
  { id: "curve", label: "Curve" },
  { id: "turnout", label: "Turnout" },
  { id: "station", label: "Station" },
  { id: "signal", label: "Signal" },
  { id: "train", label: "Train" },
  { id: "conflict", label: "Conflict" },
];

export function Toolbar() {
  const tool = useUiStore((s) => s.tool);
  const setTool = useUiStore((s) => s.setTool);
  const snapEnabled = useUiStore((s) => s.snapEnabled);
  const setSnapEnabled = useUiStore((s) => s.setSnapEnabled);
  const undo = () => useWorldStore.temporal.getState().undo();
  const redo = () => useWorldStore.temporal.getState().redo();

  return (
    <nav className="panel toolbar">
      {TOOLS.map((t) => (
        <button key={t.id} className={tool === t.id ? "is-active" : ""} onClick={() => setTool(t.id)}>
          {t.label}
        </button>
      ))}
      <hr style={{ width: "100%", border: "none", borderTop: "1px solid rgba(40,60,50,0.12)" }} />
      <button onClick={undo}>Undo</button>
      <button onClick={redo}>Redo</button>
      <label className="field-row" style={{ marginBottom: 0 }}>
        Snap
        <input type="checkbox" checked={snapEnabled} onChange={(e) => setSnapEnabled(e.target.checked)} />
      </label>
    </nav>
  );
}
```

- [ ] **Step 3: Write `src/ui/useShortcuts.ts`**

```ts
import { useEffect } from "react";
import { useUiStore } from "../state/uiStore";
import { useWorldStore } from "../state/worldStore";

export function useShortcuts(): void {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT") return;
      const ui = useUiStore.getState();
      const world = useWorldStore.getState();

      if (event.key === "Escape") {
        ui.setSelection(null);
        ui.setTool("select");
      } else if (event.key.toLowerCase() === "r") {
        if (ui.selection?.type === "module") {
          world.rotateModule(ui.selection.id);
        } else {
          ui.rotatePlacement();
        }
      } else if (event.key === "Delete" || event.key === "Backspace") {
        if (!ui.selection) return;
        if (ui.selection.type === "module") world.removeModule(ui.selection.id);
        if (ui.selection.type === "train") world.removeTrain(ui.selection.id);
        if (ui.selection.type === "conflict") world.removeConflict(ui.selection.id);
        ui.setSelection(null);
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z" && !event.shiftKey) {
        event.preventDefault();
        useWorldStore.temporal.getState().undo();
      } else if (
        ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") ||
        ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "z")
      ) {
        event.preventDefault();
        useWorldStore.temporal.getState().redo();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
```

- [ ] **Step 4: Manual verification**

Run: `npm run dev`.
Expected: Play animates trains along both loops at slider speed; Pause stops them. Placing each tool type works (tool auto-returns to Select); R rotates a selected module (and detaches its connections); Delete removes; Ctrl+Z/Ctrl+Y undo/redo; Esc clears.

- [ ] **Step 5: Commit**

```bash
git add src/ui
git commit -m "feat: floating top bar, toolbar, and keyboard shortcuts"
```

---

### Task 16: Inspector and validation panels

**Files:**
- Replace: `src/ui/Inspector.tsx`, `src/ui/ValidationPanel.tsx`
- Test: `tests/ui/inspector.test.tsx`

- [ ] **Step 1: Write `src/ui/Inspector.tsx`**

```tsx
import { findRoutes } from "../sim/routes";
import type { ConflictType } from "../sim/types";
import { useUiStore } from "../state/uiStore";
import { useWorldStore } from "../state/worldStore";

const CONFLICT_TYPES: ConflictType[] = ["headway", "junction", "platform", "blocked", "delay"];

function ModuleSection({ id }: { id: string }) {
  const module = useWorldStore((s) => s.trackModules.find((m) => m.id === id));
  const { rotateModule, duplicateModule, removeModule, updateModuleName } = useWorldStoreActions();
  if (!module) return null;
  return (
    <>
      <h2>Module · {module.type}</h2>
      <label className="field">
        Name
        <input type="text" maxLength={28} value={module.name ?? ""} onChange={(e) => updateModuleName(id, e.target.value)} />
      </label>
      <div className="field-row">
        Rotation {Math.round((module.rotation * 180) / Math.PI)}°
        <button onClick={() => rotateModule(id)}>Rotate 90°</button>
      </div>
      <div className="field-row">
        <button onClick={() => duplicateModule(id)}>Duplicate</button>
        <button onClick={() => removeModule(id)}>Delete</button>
      </div>
    </>
  );
}

function TrainSection({ id }: { id: string }) {
  const train = useWorldStore((s) => s.trains.find((t) => t.id === id));
  const trackModules = useWorldStore((s) => s.trackModules);
  const connections = useWorldStore((s) => s.connections);
  const updateTrain = useWorldStore((s) => s.updateTrain);
  const removeTrain = useWorldStore((s) => s.removeTrain);
  if (!train) return null;
  const routes = findRoutes({ trackModules, connections, trains: [], conflicts: [] });
  return (
    <>
      <h2>Train</h2>
      <label className="field">
        Name
        <input type="text" maxLength={24} value={train.name} onChange={(e) => updateTrain(id, { name: e.target.value })} />
      </label>
      <label className="field">
        Route
        <select value={train.routeId ?? ""} onChange={(e) => updateTrain(id, { routeId: e.target.value || null })}>
          <option value="">Auto (first route)</option>
          {routes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.id} ({r.moduleIds.length} modules)
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        Speed {train.speed.toFixed(1)}
        <input type="range" min={1} max={12} step={0.1} value={train.speed} onChange={(e) => updateTrain(id, { speed: Number(e.target.value) })} />
      </label>
      <label className="field">
        Color
        <input type="color" value={train.color} onChange={(e) => updateTrain(id, { color: e.target.value })} />
      </label>
      <div className="field-row">
        Enabled
        <input type="checkbox" checked={train.enabled} onChange={(e) => updateTrain(id, { enabled: e.target.checked })} />
      </div>
      <button onClick={() => removeTrain(id)}>Delete train</button>
    </>
  );
}

function ConflictSection({ id }: { id: string }) {
  const conflict = useWorldStore((s) => s.conflicts.find((c) => c.id === id));
  const updateConflict = useWorldStore((s) => s.updateConflict);
  const removeConflict = useWorldStore((s) => s.removeConflict);
  if (!conflict) return null;
  return (
    <>
      <h2>Conflict</h2>
      <label className="field">
        Label
        <input type="text" maxLength={42} value={conflict.label} onChange={(e) => updateConflict(id, { label: e.target.value })} />
      </label>
      <label className="field">
        Type
        <select value={conflict.type} onChange={(e) => updateConflict(id, { type: e.target.value as ConflictType })}>
          {CONFLICT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        Severity
        <select value={conflict.severity} onChange={(e) => updateConflict(id, { severity: e.target.value as "medium" | "high" })}>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </label>
      <div className="field-row">
        Active
        <input type="checkbox" checked={conflict.active} onChange={(e) => updateConflict(id, { active: e.target.checked })} />
      </div>
      <button onClick={() => removeConflict(id)}>Delete conflict</button>
    </>
  );
}

// Small helper to keep ModuleSection readable; name updates flow through the undoable store.
function useWorldStoreActions() {
  const rotateModule = useWorldStore((s) => s.rotateModule);
  const duplicateModule = useWorldStore((s) => s.duplicateModule);
  const removeModule = useWorldStore((s) => s.removeModule);
  const updateModuleName = (id: string, name: string) =>
    useWorldStore.setState({
      trackModules: useWorldStore.getState().trackModules.map((m) => (m.id === id ? { ...m, name } : m)),
    });
  return { rotateModule, duplicateModule, removeModule, updateModuleName };
}

export function Inspector() {
  const selection = useUiStore((s) => s.selection);
  if (!selection) return null;
  return (
    <aside className="panel inspector">
      {selection.type === "module" && <ModuleSection id={selection.id} />}
      {selection.type === "train" && <TrainSection id={selection.id} />}
      {selection.type === "conflict" && <ConflictSection id={selection.id} />}
    </aside>
  );
}
```

- [ ] **Step 2: Write `src/ui/ValidationPanel.tsx`**

```tsx
import { useMemo } from "react";
import { countActionableWarnings, validateWorld } from "../sim/validation";
import { useWorldStore } from "../state/worldStore";

export function ValidationPanel() {
  const trackModules = useWorldStore((s) => s.trackModules);
  const connections = useWorldStore((s) => s.connections);
  const trains = useWorldStore((s) => s.trains);
  const conflicts = useWorldStore((s) => s.conflicts);

  const warnings = useMemo(
    () => validateWorld({ trackModules, connections, trains, conflicts }),
    [trackModules, connections, trains, conflicts],
  );
  const actionable = countActionableWarnings(warnings);
  if (warnings.length === 0) return null;

  return (
    <aside className="panel validation">
      <h2>
        Validation · {actionable} issue{actionable === 1 ? "" : "s"}
      </h2>
      <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
        {warnings.map((w, i) => (
          <li key={i} className={`issue ${w.severity}`}>
            {w.message}
          </li>
        ))}
      </ul>
    </aside>
  );
}
```

- [ ] **Step 3: Write the smoke test** — `tests/ui/inspector.test.tsx`

```tsx
// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Inspector } from "../../src/ui/Inspector";
import { useUiStore } from "../../src/state/uiStore";
import { useWorldStore } from "../../src/state/worldStore";
import { demoScenario } from "../../src/sim/demoScenario";

describe("Inspector", () => {
  afterEach(cleanup);

  it("renders nothing without a selection", () => {
    useWorldStore.getState().replaceScenario(demoScenario);
    useUiStore.getState().reset();
    const { container } = render(<Inspector />);
    expect(container.firstChild).toBeNull();
  });

  it("shows train properties when a train is selected", () => {
    useWorldStore.getState().replaceScenario(demoScenario);
    useUiStore.getState().setSelection({ type: "train", id: "t1" });
    render(<Inspector />);
    expect(screen.getByDisplayValue("IC-214")).toBeTruthy();
  });
});
```

- [ ] **Step 4: Run tests and manual verification**

Run: `npm test` — Expected: all passing.
Run: `npm run dev` — Expected: selecting a module/train/conflict shows its floating inspector on the right with working edits (train color change recolors the mesh immediately); validation panel bottom-left lists open-port info lines and any warnings.

- [ ] **Step 5: Commit**

```bash
git add src/ui tests/ui
git commit -m "feat: contextual inspector and validation panel"
```

---

### Task 17: Persistence — autosave, JSON import/export

**Files:**
- Create: `src/state/persistence.ts`, `src/export/downloads.ts`, `src/ui/ProjectPanel.tsx`
- Modify: `src/App.tsx`, `src/main.tsx`
- Test: `tests/state/persistence.test.ts`

- [ ] **Step 1: Write the failing tests** — `tests/state/persistence.test.ts`

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { AUTOSAVE_KEY, loadInitialScenario, saveToStorage } from "../../src/state/persistence";
import { demoScenario } from "../../src/sim/demoScenario";
import { serializeScenario } from "../../src/sim/serialization";

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
    clear: () => map.clear(),
    key: () => null,
    get length() {
      return map.size;
    },
  } as Storage;
}

describe("persistence", () => {
  let storage: Storage;
  beforeEach(() => {
    storage = memoryStorage();
  });

  it("falls back to the demo when storage is empty", () => {
    expect(loadInitialScenario(storage)).toEqual(demoScenario);
  });

  it("loads a saved scenario", () => {
    const saved = { ...demoScenario, meta: { ...demoScenario.meta, title: "My Depot" } };
    storage.setItem(AUTOSAVE_KEY, serializeScenario(saved));
    expect(loadInitialScenario(storage).meta.title).toBe("My Depot");
  });

  it("ignores corrupt saves and reports it", () => {
    storage.setItem(AUTOSAVE_KEY, "{broken");
    const result = loadInitialScenario(storage);
    expect(result).toEqual(demoScenario);
  });

  it("saveToStorage round-trips", () => {
    saveToStorage(storage, demoScenario);
    expect(loadInitialScenario(storage)).toEqual(demoScenario);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test` — Expected: FAIL, module not found.

- [ ] **Step 3: Write `src/state/persistence.ts`**

```ts
import { demoScenario } from "../sim/demoScenario";
import { parseScenario, serializeScenario } from "../sim/serialization";
import type { ScenarioV2 } from "../sim/types";
import { useUiStore } from "./uiStore";
import { buildScenarioSnapshot, useWorldStore } from "./worldStore";

export const AUTOSAVE_KEY = "rail-story-studio:autosave:v1";
const AUTOSAVE_DELAY_MS = 800;

export function loadInitialScenario(storage: Storage): ScenarioV2 {
  const raw = storage.getItem(AUTOSAVE_KEY);
  if (!raw) return demoScenario;
  const parsed = parseScenario(raw);
  return parsed ?? demoScenario;
}

export function saveToStorage(storage: Storage, scenario: ScenarioV2): boolean {
  try {
    storage.setItem(AUTOSAVE_KEY, serializeScenario(scenario));
    return true;
  } catch {
    return false;
  }
}

let autosaveTimer: ReturnType<typeof setTimeout> | null = null;

export function startAutosave(storage: Storage): () => void {
  return useWorldStore.subscribe(() => {
    useUiStore.getState().setSaveStatus("saving");
    if (autosaveTimer) clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => {
      const ok = saveToStorage(storage, buildScenarioSnapshot());
      useUiStore.getState().setSaveStatus(ok ? "saved" : "error");
    }, AUTOSAVE_DELAY_MS);
  });
}

export function exportScenarioJson(): { filename: string; json: string } {
  const scenario = buildScenarioSnapshot();
  const slug = scenario.meta.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "scenario";
  return { filename: `${slug}.json`, json: serializeScenario(scenario) };
}

export function importScenarioJson(json: string): boolean {
  const parsed = parseScenario(json);
  if (!parsed) return false;
  useWorldStore.getState().replaceScenario(parsed);
  useWorldStore.temporal.getState().clear();
  useUiStore.getState().setSelection(null);
  return true;
}
```

- [ ] **Step 4: Write `src/export/downloads.ts`** (port of the v1 helper)

```ts
export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function downloadText(filename: string, text: string, mime = "application/json"): void {
  downloadBlob(filename, new Blob([text], { type: mime }));
}
```

- [ ] **Step 5: Write `src/ui/ProjectPanel.tsx`** (project metadata + save/load actions, lives inside the Inspector area when nothing is selected)

```tsx
import { useRef } from "react";
import { downloadText } from "../export/downloads";
import { demoScenario } from "../sim/demoScenario";
import { useUiStore } from "../state/uiStore";
import { useWorldStore } from "../state/worldStore";
import { exportScenarioJson, importScenarioJson } from "../state/persistence";

export function ProjectPanel() {
  const meta = useWorldStore((s) => s.meta);
  const setMeta = useWorldStore((s) => s.setMeta);
  const replaceScenario = useWorldStore((s) => s.replaceScenario);
  const fileInput = useRef<HTMLInputElement>(null);

  function onImportFile(file: File) {
    file.text().then((text) => {
      if (!importScenarioJson(text)) {
        window.alert("That file is not a valid Rail Story Studio scenario (version 2).");
      }
    });
  }

  return (
    <aside className="panel inspector">
      <h2>Project</h2>
      <label className="field">
        Title
        <input type="text" maxLength={52} value={meta.title} onChange={(e) => setMeta({ title: e.target.value })} />
      </label>
      <label className="field">
        Author
        <input type="text" maxLength={54} value={meta.author} onChange={(e) => setMeta({ author: e.target.value })} />
      </label>
      <label className="field">
        Notes
        <textarea maxLength={220} value={meta.notes} onChange={(e) => setMeta({ notes: e.target.value })} />
      </label>
      <div className="field-row">
        <button
          onClick={() => {
            const { filename, json } = exportScenarioJson();
            downloadText(filename, json);
          }}
        >
          Export JSON
        </button>
        <button onClick={() => fileInput.current?.click()}>Import JSON</button>
      </div>
      <button
        onClick={() => {
          replaceScenario(demoScenario);
          useWorldStore.temporal.getState().clear();
          useUiStore.getState().setSelection(null);
        }}
      >
        Reset demo
      </button>
      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onImportFile(file);
          e.target.value = "";
        }}
      />
    </aside>
  );
}
```

- [ ] **Step 6: Wire startup load + autosave + panel swap**

In `src/main.tsx`, before `createRoot`:

```tsx
import { loadInitialScenario, startAutosave } from "./state/persistence";
import { useWorldStore } from "./state/worldStore";

useWorldStore.getState().replaceScenario(loadInitialScenario(window.localStorage));
useWorldStore.temporal.getState().clear();
startAutosave(window.localStorage);
```

In `src/App.tsx`, show `ProjectPanel` when nothing is selected and `Inspector` otherwise:

```tsx
import { useUiStore } from "./state/uiStore";
import { ProjectPanel } from "./ui/ProjectPanel";
// inside the JSX, replace `<Inspector />` with:
```

```tsx
{useUiStore((s) => s.selection) ? <Inspector /> : <ProjectPanel />}
```

(Extract that into the component body as `const hasSelection = useUiStore((s) => s.selection !== null);` and render `{hasSelection ? <Inspector /> : <ProjectPanel />}` — hooks must not be called inline in JSX.)

- [ ] **Step 7: Run tests and manual verification**

Run: `npm test` — Expected: all passing.
Run: `npm run dev` — Expected: edit something, see "Saving…" then "Saved"; reload the page and the edit persists; Export JSON downloads a file; importing it restores the world; importing garbage shows the alert; Reset demo restores the built-in layout.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: autosave, JSON v2 import/export, project panel"
```

---

### Task 18: Docs, README, final verification

**Files:**
- Modify: `README.md`, `docs/architecture.md`
- Delete: `docs/deployment.md` references to Pages-only flow (keep the file, update it)

- [ ] **Step 1: Update `README.md`** — replace Features/Structure/Local-use sections to describe: Vite app (`npm install`, `npm run dev`, `npm run build`, `npm test`), the new module layout from this plan's file-structure block, JSON v2 persistence, and note that Director/Export features arrive in Plans 2–3. Remove the import-map/CDN and `python -m http.server` instructions.

- [ ] **Step 2: Update `docs/architecture.md`** — replace the runtime-flow and state-model sections with: zustand stores (`worldStore` undoable via zundo, `uiStore` transient), pure `src/sim/` modules, R3F component tree (`WorldCanvas` → Lighting/Ground/TrackModules/Trains/Conflicts), `simClock` singleton for render-loop time, persistence flow (localStorage → demo fallback).

- [ ] **Step 3: Update `docs/scenario-format.md`** — document JSON v2: top-level shape, `world` arrays with field tables, `story` (shots/annotations defined, populated from Plan 2), clean-break note (v1 not importable).

- [ ] **Step 4: Full verification**

```bash
npm test          # all sim/state/ui tests pass
npm run build     # clean production build
npm run dev       # manual sweep
```

Manual sweep against spec §3 parity checklist: place all 7 tool types, magnetic snap on drag, rotate, duplicate, delete, undo/redo, train name/color/speed/route/enabled edits, conflict label/type/severity/active edits, validation list updates live, autosave + reload, JSON export/import, Play/Pause/speed, quality dropdown changes render resolution.

- [ ] **Step 5: Commit and merge prep**

```bash
git add -A
git commit -m "docs: update README and architecture for Rail Story Studio foundation"
```

Then use superpowers:finishing-a-development-branch to merge `revamp/rail-story-studio` or open a PR.

---

## Roadmap after this plan

These are separate plans, written once this one lands (against the real code):

- **Plan 2 — Director & Environments:** environment preset system (Daylight/Golden Hour/Night Ops/Overcast driving sky, sun, fog, bloom), shot model + storyboard strip UI, camera rig (framed/orbit/follow) with fly transitions, annotations/callouts, present mode. Implements spec §2 (presets), §4.
- **Plan 3 — Video Export:** deterministic fixed-timestep frame stepping driven through `simClock`, WebCodecs MP4 encoder with WEBM/MediaRecorder fallback, export dialog with resolution/FPS/progress/cancel, PNG stills. Implements spec §5.
