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
