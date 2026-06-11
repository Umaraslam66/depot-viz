import { describe, expect, it } from "vitest";
import { demoScenario } from "../../src/sim/demoScenario";

describe("demoScenario", () => {
  it("has unique ids across modules, trains, conflicts", () => {
    const ids = [
      ...demoScenario.world.trackModules.map((m) => m.id),
      ...demoScenario.world.trains.map((t) => t.id),
      ...demoScenario.world.conflicts.map((c) => c.id),
    ];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("only connects existing modules", () => {
    const moduleIds = new Set(demoScenario.world.trackModules.map((m) => m.id));
    for (const c of demoScenario.world.connections) {
      expect(moduleIds.has(c.fromModuleId)).toBe(true);
      expect(moduleIds.has(c.toModuleId)).toBe(true);
    }
  });

  it("keeps nextId above all numeric id suffixes", () => {
    const maxSuffix = Math.max(
      ...[...demoScenario.world.trackModules, ...demoScenario.world.trains, ...demoScenario.world.conflicts]
        .map((r) => Number(r.id.replace(/^[a-z]+/, ""))),
    );
    expect(demoScenario.nextId).toBeGreaterThan(maxSuffix);
  });
});
