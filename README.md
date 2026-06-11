# Rail Story Studio

Rail Story Studio is a browser-based 3D studio for explaining railway planning, operations, and conflicts to stakeholders. A planner builds a stylized miniature rail world, and (in upcoming releases) frames a storyboard of camera shots and exports a stakeholder-ready video.

This is the foundation release: a full editor for the miniature world with build-tool parity to the previous Rail Scenario Planner, rebuilt on a modern stack.

## Stack

- Vite + React + TypeScript
- three.js via @react-three/fiber and @react-three/drei
- zustand state (zundo undo/redo)
- Vitest

## Develop

```bash
npm install
npm run dev      # local dev server
npm test         # unit + smoke tests
npm run build    # production build to dist/
```

## Features

- Stylized miniature world: daylight lighting, rounded base plate, toy-like track, stations, signals, trains, conflict markers.
- Build tools: straight, curve, turnout, station, signal, train, conflict placement with magnetic endpoint snapping and grid fallback.
- Direct manipulation: select, drag with snapping, rotate, duplicate, delete, undo/redo, keyboard shortcuts (R, Delete, Ctrl+Z/Y, Esc).
- Trains follow routes derived from track connections; per-train name, color, speed, route, enabled state.
- Live validation: open ports, overlaps, route availability, disabled trains, conflict scope.
- Persistence: localStorage autosave, JSON v2 export/import, built-in demo scenario.

## Roadmap

- **Director & Environments** — environment mood presets (Daylight, Golden Hour, Night Ops, Overcast), storyboard of camera shots, annotations, present mode.
- **Video Export** — deterministic frame-by-frame rendering to MP4 (WebCodecs) with WEBM fallback.

See `docs/superpowers/specs/2026-06-11-frontend-revamp-design.md` for the full design.

## Project Structure

```text
index.html              Vite entry
src/main.tsx            Bootstrap: load scenario, start autosave, mount React
src/App.tsx             Layout: canvas + floating panels
src/sim/                Pure domain logic (no React/Three): geometry, graph,
                        routes, snapping, validation, serialization, demo
src/state/              zustand stores (world undoable, ui transient), persistence
src/world/              R3F scene: canvas, lighting, ground, track, trains, conflicts
src/ui/                 Floating panels: top bar, toolbar, inspector, project, validation
src/export/             Download helpers (video export arrives with Plan 3)
tests/                  Vitest suites mirroring src/sim and src/state
docs/                   Architecture, scenario format, deployment notes
```

## Data

Scenarios are saved as JSON v2 (see `docs/scenario-format.md`). This is a clean break from the v1 Rail Scenario Planner format — v1 files and share URLs are not importable.

## Browser Support

Modern Chromium, Edge, or Firefox with WebGL.

## Provenance

See [NOTICE.md](NOTICE.md) for the provenance and licensing note.
