# Architecture

Rail Scenario Planner is a static Three.js application. The browser loads `index.html`, the import map resolves Three.js from jsDelivr, and `src/main.js` wires the scenario state, UI events, Three.js scene, and animation loop together.

## Runtime Flow

1. `src/ui/dom.js` collects DOM references from `index.html`.
2. `src/config/scenario.js` provides the built-in demo scenario and version constants.
3. `src/state/scenarioStore.js` restores a scenario from the URL first, then browser autosave, then the built-in demo.
4. `src/main.js` creates the WebGL renderer, scene, camera, controls, groups, app state, and event handlers.
5. Scene rebuilds convert scenario records into Three.js objects with stable `userData.objectType` and `userData.objectId` values for raycast selection.
6. The render loop runs on demand, staying active during playback, recording, camera moves, dragging, URL updates, and autosave.

## State Model

The editable scenario is stored in one object with:

- `meta`: title, subtitle, author, notes, theme, and colors.
- `exports`: playback export defaults.
- `trackModules`: placed infrastructure modules.
- `connections`: endpoint-to-endpoint rail joins.
- `trains`: named moving train records.
- `conflicts`: explainable operational issue markers.
- `view`: overlays, speed, snap, presentation mode, and camera preset.

Transient runtime state lives in `appState` and local module variables inside `src/main.js`. Undo/redo snapshots capture both scenario state and relevant editor state.

## Rendering Model

The scene is organized into groups:

- `scenarioGroup`: infrastructure modules.
- `trainGroup`: animated train objects.
- `overlayGroup`: paths, connections, occupancy, validation, and conflict objects.
- `labelGroup`: sprite labels.
- `previewGroup`: placement feedback.

Track modules are rebuilt from records whenever the scenario changes. Trains are animated along either built-in fallback curves or a connected route generated from module connections. When playback is stopped, the canvas renders only after an interaction or state change.

## Interaction Model

Pointer raycasting selects modules, trains, and conflicts. Blank canvas clicks place the active prefab. Dragging selected modules or conflicts updates their position with magnetic endpoint snapping where possible and grid snapping otherwise.

Keyboard shortcuts are handled in `src/main.js`:

- `R`: rotate active tool.
- `Delete`: delete selected item.
- `Ctrl+Z`: undo.
- `Ctrl+Y`: redo.
- `Esc`: clear editing selection.

## Persistence And Export

URL sharing and browser autosave use the same serializable scenario snapshot. JSON export is the durable project format. PNG and WEBM exports use the active canvas; playback export temporarily enables presentation mode, records the requested duration, then restores the prior playback state.
