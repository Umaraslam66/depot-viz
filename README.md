# Rail Scenario Planner

Rail Scenario Planner is a professional 3D stakeholder demo for explaining railway planning and operations. It provides a clean planning canvas where users can place track modules, stations, signals, trains, and conflict markers, then animate operations with simple visual overlays.

The tool is intentionally explainable rather than CAD-grade. It focuses on scenarios planners and engineers often need to communicate: headway pressure, junction conflicts, platform occupation, delay propagation, and blocked sections.

## Try It Locally

Serve this folder with a simple local web server, then open the page in a browser:

```bash
python -m http.server 5173
```

Then visit:

```text
http://localhost:5173/
```

## Current Features

- Generic rail planning canvas with snapped prefab placement.
- Track, station, turnout, signal, train, and conflict tools.
- Animated named trains with editable labels.
- Overlay toggles for labels, conflicts, block occupancy, and train paths.
- Operational camera presets and follow-train view.
- URL-based scenario sharing without a backend.

## Publication Note

This repository should be published as a clean project, without the original cloned repository history. See `NOTICE.md` for the provenance and licensing note.
