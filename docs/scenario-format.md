# Scenario Format (JSON v2)

Scenario files are JSON exports of the full studio state. The same shape is used for browser autosave. Version 2 is a clean break: v1 Rail Scenario Planner files and share URLs are not importable.

## Top-Level Fields

```json
{
  "version": 2,
  "nextId": 20,
  "meta": {},
  "world": {
    "trackModules": [],
    "connections": [],
    "trains": [],
    "conflicts": []
  },
  "story": {
    "shots": [],
    "annotations": []
  }
}
```

- `version`: always `2`. Parsers reject any other value.
- `nextId`: shared counter for allocating new `m…`/`t…`/`c…` ids.

## `meta`

- `title`: project title shown in the top bar.
- `author`: author, client, or project label.
- `notes`: workshop notes.

## `world.trackModules`

- `id`: stable module id, usually `m<number>`.
- `type`: `straight`, `curve`, `turnout`, `station`, or `signal`.
- `position`: `[x, y, z]` world position.
- `rotation`: Y-axis rotation in radians, normalized to `[0, 2π)`.
- `name`: optional display name for stations, junctions, and signals.

Rail-capable modules derive their ports from `type` and `rotation`; port world coordinates are not stored.

## `world.connections`

Endpoint-to-endpoint rail joins.

- `fromModuleId`, `fromPortId`: first module endpoint.
- `toModuleId`, `toPortId`: second module endpoint.

Ports are named `A` and `B` for straight/station/curve modules. Turnouts use `A`, `B`, and `C`.

## `world.trains`

- `id`: stable train id, usually `t<number>`.
- `name`: visible train label.
- `color`: train body hex color.
- `speed`: movement speed in world units per simulated second.
- `startOffset`: route offset from `0` to `1`.
- `enabled`: whether the train moves (disabled trains park, greyed).
- `routeId`: a route id such as `route-1`, or `null` for the first available route. Routes are derived at runtime from connections (one per connected component, ordered by module placement).

## `world.conflicts`

- `id`: stable conflict id, usually `c<number>`.
- `type`: `headway`, `junction`, `platform`, `blocked`, or `delay`.
- `severity`: `medium` or `high`.
- `position`: `[x, y, z]` world position.
- `affectedModuleIds`: related infrastructure ids.
- `affectedTrainIds`: related train ids.
- `label`: stakeholder-facing issue label.
- `active`: whether the marker pulses and counts in validation.

## `story`

Defined in the format now so files stay stable; authored by the Director release (Plan 2).

- `shots`: ordered camera shots. Each shot stores a name, duration in seconds, a camera (`framed` position/target, `orbit` target/radius/height, or `follow` trainId/distance), an environment (`preset`, `sunAzimuth`, `fogAmount`), a simulation speed, an optional caption, visible annotation ids, and a transition (`fly` or `cut`).
- `annotations`: 3D callouts. Each has an id, text, and a target (`module`, `train`, or `conflict` plus the target id).
