import assert from "node:assert/strict";
import {
  buildConnectedRouteModuleIds,
  countActionableWarnings,
  isActionableValidationWarning,
} from "../src/utils/railGraph.js";

const modules = [
  { id: "m1", position: [0, 0, 0] },
  { id: "m2", position: [4, 0, 0] },
  { id: "m3", position: [8, 0, 0] },
  { id: "m4", position: [12, 0, 0] },
  { id: "m5", position: [8, 0, 4] },
];

const routeIds = buildConnectedRouteModuleIds(modules, [
  { fromModuleId: "m1", toModuleId: "m2" },
  { fromModuleId: "m2", toModuleId: "m3" },
  { fromModuleId: "m3", toModuleId: "m4" },
  { fromModuleId: "m3", toModuleId: "m5" },
]);

assert.deepEqual(
  routeIds,
  ["m1", "m2", "m3", "m4"],
  "connected route should choose a deterministic longest path through a branched graph",
);

assert.equal(
  buildConnectedRouteModuleIds(modules, [{ fromModuleId: "missing", toModuleId: "m2" }]),
  null,
  "connected route should be absent when fewer than two valid modules connect",
);

assert.equal(
  isActionableValidationWarning({ type: "disconnected-port", severity: "info" }),
  false,
  "open ports marked as info should not be actionable warnings",
);
assert.equal(
  isActionableValidationWarning({ type: "overlap" }),
  true,
  "overlaps should remain actionable warnings",
);
assert.equal(
  countActionableWarnings([
    { type: "disconnected-port", severity: "info" },
    { type: "overlap" },
    { type: "route" },
  ]),
  2,
  "KPI warning count should exclude info-only open ports",
);
