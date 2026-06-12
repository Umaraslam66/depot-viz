import { beforeEach, describe, expect, it } from "vitest";
import { useWorldStore } from "../../src/state/worldStore";
import { demoScenario } from "../../src/sim/demoScenario";

describe("worldStore", () => {
  beforeEach(() => {
    useWorldStore.getState().replaceScenario(demoScenario);
    useWorldStore.temporal.getState().clear();
  });

  it("places a module from a plan and connects it", () => {
    const before = useWorldStore.getState().trackModules.length;
    useWorldStore.getState().placeModule("straight", { x: 9, y: 0, z: 0.5 }, true, 0);
    const state = useWorldStore.getState();
    expect(state.trackModules.length).toBe(before + 1);
  });

  it("allocates sequential ids with prefixes", () => {
    const a = useWorldStore.getState().allocateId("m");
    const b = useWorldStore.getState().allocateId("t");
    expect(a).toBe("m20");
    expect(b).toBe("t21");
  });

  it("removes a module together with its connections", () => {
    useWorldStore.getState().removeModule("m3");
    const state = useWorldStore.getState();
    expect(state.trackModules.some((m) => m.id === "m3")).toBe(false);
    expect(state.connections.some((c) => c.fromModuleId === "m3" || c.toModuleId === "m3")).toBe(false);
  });

  it("updates trains", () => {
    useWorldStore.getState().updateTrain("t1", { speed: 9.9, name: "X-1" });
    const train = useWorldStore.getState().trains.find((t) => t.id === "t1")!;
    expect(train.speed).toBe(9.9);
    expect(train.name).toBe("X-1");
  });

  it("undoes and redoes module removal", () => {
    useWorldStore.getState().removeModule("m4");
    expect(useWorldStore.getState().trackModules.some((m) => m.id === "m4")).toBe(false);
    useWorldStore.temporal.getState().undo();
    expect(useWorldStore.getState().trackModules.some((m) => m.id === "m4")).toBe(true);
    useWorldStore.temporal.getState().redo();
    expect(useWorldStore.getState().trackModules.some((m) => m.id === "m4")).toBe(false);
  });
});
