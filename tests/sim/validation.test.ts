import { describe, expect, it } from "vitest";
import { countActionableWarnings, validateWorld } from "../../src/sim/validation";
import { demoScenario } from "../../src/sim/demoScenario";
import type { WorldState } from "../../src/sim/types";

describe("validateWorld", () => {
  it("reports open ports as info severity", () => {
    const warnings = validateWorld(demoScenario.world);
    const openPorts = warnings.filter((w) => w.type === "disconnected-port");
    expect(openPorts.length).toBeGreaterThan(0);
    expect(openPorts.every((w) => w.severity === "info")).toBe(true);
  });

  it("reports overlapping modules", () => {
    const world: WorldState = {
      trackModules: [
        { id: "a", type: "straight", position: [0, 0, 0], rotation: 0 },
        { id: "b", type: "straight", position: [1, 0, 0], rotation: 0 },
      ],
      connections: [],
      trains: [],
      conflicts: [],
    };
    expect(validateWorld(world).some((w) => w.type === "overlap")).toBe(true);
  });

  it("reports trains with no available route and disabled trains", () => {
    const world: WorldState = {
      trackModules: [],
      connections: [],
      trains: [{ id: "t1", name: "X", color: "#fff", speed: 5, startOffset: 0, enabled: false, routeId: null }],
      conflicts: [],
    };
    const types = validateWorld(world).map((w) => w.type);
    expect(types).toContain("route");
    expect(types).toContain("disabled-train");
  });

  it("reports active conflicts with empty scope", () => {
    const world: WorldState = {
      ...demoScenario.world,
      conflicts: [{ id: "c", type: "delay", severity: "medium", position: [0, 0, 0], affectedModuleIds: [], affectedTrainIds: [], label: "Empty", active: true }],
    };
    expect(validateWorld(world).some((w) => w.type === "conflict-scope")).toBe(true);
  });

  it("counts only non-info warnings as actionable", () => {
    const warnings = validateWorld(demoScenario.world);
    expect(countActionableWarnings(warnings)).toBe(warnings.filter((w) => w.severity !== "info").length);
  });
});
