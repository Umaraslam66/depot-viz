import { describe, expect, it } from "vitest";
import { parseScenario, serializeScenario } from "../../src/sim/serialization";
import { demoScenario } from "../../src/sim/demoScenario";

describe("serialization", () => {
  it("round-trips the demo scenario", () => {
    const json = serializeScenario(demoScenario);
    const parsed = parseScenario(json);
    expect(parsed).toEqual(demoScenario);
  });

  it("rejects invalid JSON", () => {
    expect(parseScenario("not json")).toBeNull();
  });

  it("rejects wrong version", () => {
    const v1 = JSON.stringify({ version: 1, trackModules: [] });
    expect(parseScenario(v1)).toBeNull();
  });

  it("rejects structurally broken documents", () => {
    const broken = JSON.stringify({ version: 2, meta: {}, world: { trackModules: "nope" } });
    expect(parseScenario(broken)).toBeNull();
  });
});
