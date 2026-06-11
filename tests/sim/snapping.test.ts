import { describe, expect, it } from "vitest";
import {
  GRID_SIZE,
  findNearestOpenPort,
  isPortConnected,
  moduleOverlaps,
  planModulePlacement,
  planModuleMove,
  snapToGrid,
} from "../../src/sim/snapping";
import type { WorldState } from "../../src/sim/types";

function world(partial: Partial<WorldState> = {}): WorldState {
  return { trackModules: [], connections: [], trains: [], conflicts: [], ...partial };
}

const single = world({
  trackModules: [{ id: "m1", type: "straight", position: [0, 0, 0], rotation: 0 }],
});

describe("snapping", () => {
  it("snaps values to the grid", () => {
    expect(snapToGrid(5.6)).toBe(GRID_SIZE);
    expect(snapToGrid(6.1)).toBe(8);
  });

  it("detects connected ports", () => {
    const w = world({
      trackModules: single.trackModules,
      connections: [{ fromModuleId: "m1", fromPortId: "B", toModuleId: "m2", toPortId: "A" }],
    });
    expect(isPortConnected(w.connections, "m1", "B")).toBe(true);
    expect(isPortConnected(w.connections, "m1", "A")).toBe(false);
  });

  it("finds the nearest open port within tolerance", () => {
    const port = findNearestOpenPort(single, { x: 5, y: 0, z: 0 });
    expect(port?.moduleId).toBe("m1");
    expect(port?.id).toBe("B");
    expect(findNearestOpenPort(single, { x: 50, y: 0, z: 0 })).toBeNull();
  });

  it("detects overlap inside tolerance", () => {
    const candidate = { id: "x", type: "straight" as const, position: [1, 0, 1] as [number, number, number], rotation: 0 };
    expect(moduleOverlaps(single.trackModules, candidate)).toBe(true);
    expect(moduleOverlaps(single.trackModules, { ...candidate, position: [20, 0, 0] })).toBe(false);
  });

  it("plans snapped placement that aligns and connects to the open port", () => {
    // (6, 0.5) is 2.06 from m1's open port B at (4, 0) — inside SNAP_TOLERANCE.
    const plan = planModulePlacement(single, "straight", { x: 6, y: 0, z: 0.5 }, true);
    expect(plan.kind).toBe("place");
    if (plan.kind !== "place") return;
    expect(plan.module.position[0]).toBeCloseTo(8);
    expect(plan.module.position[2]).toBeCloseTo(0);
    expect(plan.connection).toEqual({
      fromModuleId: "m1",
      fromPortId: "B",
      toModuleId: plan.module.id,
      toPortId: "A",
    });
  });

  it("falls back to grid placement away from ports", () => {
    const plan = planModulePlacement(single, "straight", { x: 25.8, y: 0, z: 13.2 }, true);
    expect(plan.kind).toBe("place");
    if (plan.kind !== "place") return;
    expect(plan.module.position).toEqual([24, 0, 12]);
    expect(plan.connection).toBeNull();
  });

  it("rejects placement that overlaps an existing module", () => {
    const blocked = world({
      trackModules: [
        ...single.trackModules,
        { id: "m2", type: "straight", position: [24, 0, 12], rotation: 0 },
      ],
    });
    const plan = planModulePlacement(blocked, "straight", { x: 24.5, y: 0, z: 12.4 }, true);
    expect(plan.kind).toBe("rejected");
  });

  it("plans grid move for an existing module", () => {
    const plan = planModuleMove(single, "m1", { x: 13.4, y: 0, z: -2.2 }, true);
    expect(plan.kind).toBe("move");
    if (plan.kind !== "move") return;
    expect(plan.position).toEqual([12, 0, -4]);
  });
});
