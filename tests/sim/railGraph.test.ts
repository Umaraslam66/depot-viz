import { describe, expect, it } from "vitest";
import { buildConnectedRouteModuleIds } from "../../src/sim/railGraph";
import type { Connection, TrackModule } from "../../src/sim/types";

function mod(id: string): TrackModule {
  return { id, type: "straight", position: [0, 0, 0], rotation: 0 };
}
function conn(a: string, b: string): Connection {
  return { fromModuleId: a, fromPortId: "B", toModuleId: b, toPortId: "A" };
}

describe("buildConnectedRouteModuleIds", () => {
  it("returns the longest chain in order", () => {
    const route = buildConnectedRouteModuleIds(
      [mod("a"), mod("b"), mod("c"), mod("d")],
      [conn("a", "b"), conn("b", "c"), conn("c", "d")],
    );
    expect(route).toEqual(["a", "b", "c", "d"]);
  });

  it("returns null when fewer than two modules are connected", () => {
    expect(buildConnectedRouteModuleIds([mod("a"), mod("b")], [])).toBeNull();
  });

  it("ignores connections to unknown modules", () => {
    expect(buildConnectedRouteModuleIds([mod("a")], [conn("a", "ghost")])).toBeNull();
  });

  it("prefers paths through earlier-placed modules on ties", () => {
    const route = buildConnectedRouteModuleIds(
      [mod("a"), mod("b"), mod("c")],
      [conn("a", "b"), conn("a", "c")],
    );
    expect(route).toHaveLength(3);
    expect(route).toContain("a");
  });
});
