# Architecture

Rail Story Studio is a Vite + React + TypeScript application. react-three-fiber renders the 3D world; zustand stores hold all state; pure domain logic lives in `src/sim/` with no React or Three.js imports.

## Runtime Flow

1. `src/main.tsx` loads the initial scenario (localStorage autosave → built-in demo), clears undo history, starts the debounced autosave subscription, and mounts React.
2. `src/App.tsx` lays out the floating panels over the lazy-loaded `WorldCanvas`.
3. `src/world/WorldCanvas.tsx` creates the R3F `<Canvas>` (ACES tone mapping, shadow maps, quality-driven device pixel ratio), the daylight rig, the base plate, and `MapControls`.
4. World components subscribe to the stores and rebuild meshes when records change.
5. `SimDriver` advances `simClock.time` inside `useFrame` while playback is on; trains sample their route curve from that clock every frame without re-rendering React.

## State Model

Three layers:

- **`useWorldStore`** (`src/state/worldStore.ts`) — the editable document: track modules, connections, trains, conflicts, scenario meta, story (shots/annotations arrive in Plan 2), and the id counter. Wrapped in zundo's `temporal` middleware: every set produces an undo snapshot (limit 50). All mutations go through named actions (`placeModule`, `moveModule`, `updateTrain`, …) that delegate planning to `src/sim/`.
- **`useUiStore`** (`src/state/uiStore.ts`) — transient editor state: active tool, selection, placement rotation, snap toggle, playback flag, sim speed, render quality, drag state, save status. Never persisted, never undoable.
- **`simClock`** (`src/world/simClock.ts`) — a mutable `{ time }` singleton advanced in the render loop. Keeping it out of React/zustand means 60 fps train animation with zero re-renders, and a later export pipeline can drive it deterministically.

## Domain Logic (`src/sim/`)

Pure, unit-tested modules:

- `geometry.ts` — module-local→world transforms, port definitions per module type.
- `railGraph.ts` — longest-path search over the connection graph.
- `routes.ts` — connected components → named routes (`route-1`, …) and waypoint polylines.
- `snapping.ts` — magnetic endpoint snapping, grid snapping, placement/move planning with overlap rejection.
- `validation.ts` — warnings: open ports (info), overlaps, missing routes, disabled trains, empty conflict scope.
- `serialization.ts` — JSON v2 serialize/parse with structural validation.

## Rendering Model

- `TrackModules` renders each record through stylized mesh components (`trackMeshes.tsx`); selection shows a coral ring; pointer drag re-plans position through `planModuleMove`.
- `Trains` derives routes from connections (memoized), builds Catmull-Rom curves through module centers, and animates along arc length.
- `Conflicts` renders pulsing severity-colored cones with rings.
- Labels are canvas-texture sprites (`ModuleLabel`), not troika text — troika's worker-based SDF generation can drop the WebGL context on some ANGLE/Metal setups.
- WebGL context loss is tolerated: the `webglcontextlost` handler prevents default so the browser can restore the context.

## Persistence

`src/state/persistence.ts`: debounced (800 ms) autosave of the full scenario snapshot to localStorage on every world-store change, with save status surfaced in the top bar. JSON v2 export/import via file download/picker. Corrupt or wrong-version saves fall back to the demo scenario.
