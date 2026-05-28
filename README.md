# Rail Scenario Planner

Rail Scenario Planner is a browser-based 3D workbench for explaining railway planning, operations, and conflicts to stakeholders. It is intentionally lightweight: a static Three.js app with no backend, no accounts, and no build step.

The planner is not a CAD or signalling simulator. It is a visual scenario demonstrator for discussions around track layouts, train movements, platform occupation, junction pressure, blocked sections, headway, and delay propagation.

## Live Deployment

This repository is designed for GitHub Pages. After pushing to `main`, enable Pages from the repository settings and serve from the root of the `main` branch.

Expected project URL format:

```text
https://umaraslam66.github.io/depot-viz/
```

## Local Use

Serve the repository with any static web server:

```bash
python -m http.server 5173
```

Open:

```text
http://localhost:5173/
```

Opening `index.html` directly is not recommended because ES modules and browser security rules work best through a local server.

## Features

- Professional rail planning canvas with a neutral grid, labels, legend, KPI readouts, and operational camera presets.
- Prefab placement for straight track, curves, turnouts, stations, signals, trains, and conflict markers.
- Magnetic endpoint snapping for track modules, plus grid fallback placement.
- Direct selection, dragging, rotation, delete, duplicate, undo, redo, reset, and route rebuild controls.
- Editable train names, train colors, train speed, enabled state, and route assignment.
- Conflict overlays for headway, junction, platform, blocked section, and delay scenarios.
- Validation panel for disconnected ports, overlaps, incomplete connected routes, disabled trains, and incomplete conflict scopes.
- Presentation mode with title/subtitle/author metadata, configurable themes, PNG export, and WEBM playback export when supported by the browser.
- URL sharing, JSON import/export, and local browser autosave.

## Project Structure

```text
index.html              Static application shell
src/main.js             Runtime orchestration and render loop
src/config/             Default scenario and visual theme presets
src/state/              Scenario normalization, URL load, browser restore
src/scene/              Three.js scene helpers, materials, camera presets
src/ui/                 DOM reference collection
src/export/             Download/export helpers
src/utils/              Small shared utilities
src/styles/app.css      Workbench styling
docs/                   Architecture, scenario format, deployment notes
NOTICE.md               Provenance and licensing note
```

## Persistence And Sharing

- Browser autosave uses `localStorage`.
- URL sharing serializes the active scenario into the `?scenario=` query parameter.
- JSON export is the recommended long-form workshop/project format.
- WEBM export uses `canvas.captureStream()` and `MediaRecorder`; unsupported browsers fall back to PNG export.

## Browser Support

Use a modern Chromium, Edge, or Firefox browser with WebGL enabled. WEBM recording depends on `MediaRecorder` support and may vary by browser, platform, and graphics settings.

## Provenance

This repository should be published as a clean project history. See [NOTICE.md](NOTICE.md) for the provenance and licensing note.
