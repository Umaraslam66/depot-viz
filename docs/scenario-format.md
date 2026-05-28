# Scenario Format

Scenario files are JSON exports of the active planner state. The same shape is used for URL sharing and browser autosave.

## Top-Level Fields

```json
{
  "version": 1,
  "nextId": 20,
  "meta": {},
  "exports": {},
  "trackModules": [],
  "connections": [],
  "trains": [],
  "conflicts": [],
  "view": {}
}
```

## `meta`

Presentation metadata shown in the app, PNG export, and playback export.

- `title`: scenario title.
- `subtitle`: short explanatory line.
- `author`: author, client, or project label.
- `notes`: workshop notes.
- `theme`: one of `professional`, `safety`, `night`, or `neutral`.
- `colors`: `accent`, `path`, `conflict`, and `label` hex colors.

## `exports`

Playback export defaults.

- `playbackDuration`: duration in seconds.
- `playbackFps`: requested recording frame rate.
- `playbackSpeed`: playback speed multiplier during export.
- `resetOnExport`: whether recording starts from scenario time zero.

## `trackModules`

Infrastructure records.

- `id`: stable module id, usually `m<number>`.
- `type`: `straight`, `curve`, `turnout`, `station`, or `signal`.
- `position`: `[x, y, z]` world position.
- `rotation`: Y-axis rotation in radians.
- `name`: optional display name for stations, junctions, and signals.

Rail-capable modules derive their ports from `type` and `rotation`; port world coordinates are not stored in JSON.

## `connections`

Endpoint-to-endpoint rail joins.

- `fromModuleId`, `fromPortId`: first module endpoint.
- `toModuleId`, `toPortId`: second module endpoint.

Ports are named `A` and `B` for straight/station/curve modules. Turnouts use `A`, `B`, and `C`.

## `trains`

Animated train records.

- `id`: stable train id, usually `t<number>`.
- `displayName`: visible train label.
- `color`: train body hex color.
- `route`: fallback route id.
- `selectedRouteId`: active route, usually `main`, `branch`, or `connected`.
- `speed`: movement speed along the route.
- `startOffset`: route offset from `0` to `1`.
- `enabled`: whether the train is active and visible.

## `conflicts`

Explainable operations markers.

- `id`: stable conflict id, usually `c<number>`.
- `type`: `headway`, `junction`, `platform`, `blocked`, or `delay`.
- `severity`: `medium` or `high`.
- `position`: `[x, y, z]` world position.
- `affectedModuleIds`: related infrastructure ids.
- `affectedTrainIds`: related train ids.
- `label`: stakeholder-facing issue label.
- `active`: whether the marker appears in overlays and readouts.

## `view`

Planner view and overlay state.

- `preset`: active camera preset.
- `speed`: timeline speed.
- `snapEnabled`: magnetic snapping toggle.
- `presentationMode`: presentation mode toggle.
- `overlays`: booleans for labels, conflicts, blocks, paths, connections, and validation.
