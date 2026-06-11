# Frontend Revamp: Rail Story Studio

**Date:** 2026-06-11
**Status:** Approved design, pending implementation plan

## Summary

Full rewrite of the Rail Scenario Planner frontend into a browser-based 3D studio where a rail planner builds a stylized miniature rail world, frames a storyboard of camera shots with environment moods and callouts, and exports a smooth stakeholder-ready video — with no 3D or video-editing skills required.

Primary user: someone explaining rail planning ideas (layouts, conflicts, operations) to non-technical stakeholders, e.g. in railway organizations, through short 3D rendered videos.

## Decisions made during brainstorming

| Topic | Decision |
|---|---|
| 3D scene look | Stylized miniature ("model railway" — saturated soft palette, rounded shapes, toy-like lighting) |
| UI layout | Floating studio panels (canvas-first, minimal chrome) |
| Story authoring model | Storyboard of shots (slide-like, not a keyframe timeline) |
| Stack | Vite + React + TypeScript + react-three-fiber |
| Video export | Deterministic in-browser frame-by-frame render, WebCodecs MP4 (WEBM fallback) |
| Backend render farm | Out of scope — later phase; format designed to support it |
| Data compatibility | Clean break — new scenario JSON v2, no migration of old saves/URLs |
| Deployment | Static SPA; GitHub Pages now, Vercel/Railway when product matures |

## 1. Architecture

### Stack

- **Vite + React + TypeScript** application, replacing the no-build static site.
- **react-three-fiber** + **drei** for the 3D scene.
- **zustand** for state, with undo/redo middleware (e.g. zundo) for world edits.
- **Vitest** for unit tests.
- Three.js installed via npm (no CDN import maps).

### Module structure

```text
src/sim/        Pure, framework-free domain logic (ported from current app):
                rail graph, endpoint snapping, route building, validation.
                No Three.js or React imports. Fully unit-tested.
src/world/      R3F components rendering the miniature world: track modules,
                turnouts, stations, signals, trains, terrain, environment.
src/director/   Shot model, camera rig (framed / orbit / follow-train),
                shot-to-shot interpolation, deterministic playback clock.
src/ui/         Floating panels: top toolbar, contextual inspector,
                storyboard strip, environment panel, export dialog.
src/export/     Deterministic frame renderer + WebCodecs MP4 encoder,
                WEBM fallback, PNG stills.
src/state/      zustand stores: world (track/trains/conflicts, undoable),
                story (shots/annotations), ui (mode, selection, panels).
```

The existing 2,900-line `src/main.js` monolith is retired. Domain logic in `src/utils/` (railGraph, selectionModel, interactionModes, gestureController) is the porting source for `src/sim/`.

### State model

Three zustand stores:

- **world** — track modules, connections, trains, conflicts. Undo/redo applies here.
- **story** — ordered shots, annotations, project metadata (title, author).
- **ui** — transient: active tool, selection, panel visibility, playback state. Not persisted, not undoable.

### Scenario JSON v2

One document with two sections:

```jsonc
{
  "version": 2,
  "meta": { "title": "...", "author": "...", "notes": "..." },
  "world": { "trackModules": [], "connections": [], "trains": [], "conflicts": [] },
  "story": { "shots": [], "annotations": [] }
}
```

Persistence: localStorage autosave (versioned key), JSON file import/export. Old format, old URLs, and old localStorage saves are not migrated.

## 2. The stylized miniature scene

Visual direction: a model railway you lean over. Friendly and approachable for non-technical stakeholders.

- Saturated-but-soft palette; rounded, beveled geometry; toy-like trains with rounded noses.
- Hemisphere + directional sun light, soft shadows (PCFSoft), ACES filmic tone mapping.
- Terrain reads as a miniature base plate: soft color zones (grass, ballast, platform paving), rounded edges.

### Environment presets

Four presets, each driving sky color/gradient, sun angle and color, fog density, and shadow softness:

1. **Daylight** (default)
2. **Golden Hour**
3. **Night Ops** — adds gentle bloom; signals and train headlights glow
4. **Overcast**

Per-preset user tweaks: sun position slider, fog amount. Environment is set per shot (see §4) and can also be set globally while building.

Render quality presets (performance / balanced / high) are kept for slower machines.

## 3. Build experience

Feature parity with the current editor, restyled:

- Place: straight track, curve, turnout, station, signal, train, conflict marker.
- Magnetic endpoint snapping with grid fallback; drag, rotate, duplicate, delete.
- Undo/redo, validation warnings (disconnected ports, overlaps, incomplete routes, disabled trains, incomplete conflict scopes).
- Train properties: name, color, speed, enabled, route assignment.
- Keyboard shortcuts as today (R rotate, Delete, Ctrl+Z/Y, Esc).

UI: slim floating top toolbar (tools + play controls), compact floating inspector that appears only when something is selected, floating storyboard strip along the bottom (§4).

## 4. Director & storyboard

The core new capability. The bottom floating strip is the **storyboard**: an ordered deck of shot cards with thumbnails.

### Shot model

Each shot stores:

- **Camera**: one of — fixed framing (captured from current view), slow orbit around a point, or follow-a-train.
- **Duration** (seconds).
- **Environment**: preset + tweaks (crossfades from the previous shot during playback).
- **Simulation speed** for the shot (including pause).
- **Title/caption overlay** (optional text card).
- **Visible callouts**: which annotations show during this shot.
- **Transition**: smooth camera fly (default) or cut.

### Annotations

3D callouts — short text labels with leader lines — pinned to trains, stations, track modules, or conflicts. Authored in Build, toggled per shot. Callouts fade in/out with shot transitions.

### Authoring flow

Frame the view → click **Add Shot** → card appears in the strip. Cards drag to reorder, click to edit, duplicate, delete. Playback flies the camera between shots while the simulation runs continuously on one deterministic clock.

### Present mode

Hides all chrome and plays the story full-screen. Esc exits.

## 5. Video export

- Renders the story **frame by frame at a fixed timestep** — output smoothness is independent of machine speed.
- Encodes in-browser to **1080p MP4 via WebCodecs**; falls back to WEBM (MediaRecorder) where WebCodecs/H.264 is unavailable; PNG still export retained.
- Export dialog: resolution, FPS, progress bar, cancel.
- Determinism requirement: simulation and camera state must be pure functions of story time, so the same scenario JSON can later be rendered by a backend worker (Railway + headless GPU + ffmpeg) with no format changes.

## 6. Testing

- **Vitest** unit tests for all of `src/sim/` (graph, snapping, route building, validation) and `src/director/` (shot interpolation, playback clock, serialization round-trips).
- Component smoke tests for key panels.
- Manual visual checks for scene/look work.

## 7. Error handling

- WebCodecs feature detection → WEBM fallback, stated in the export dialog.
- WebGL context-loss recovery (re-init renderer, restore from state).
- Versioned autosave schema; unknown/corrupt saves are ignored with a visible notice rather than crashing.

## Out of scope

- Backend render service (later phase; format is designed for it).
- Accounts, cloud sharing, collaboration.
- Asset/branding library (custom logos, client themes).
- Per-shot mini-timelines ("expandable shots") — possible later without redesign.
- Migration of v1 scenarios, shared URLs, or old localStorage saves.
