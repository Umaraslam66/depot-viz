import { beforeEach, describe, expect, it } from "vitest";
import { useUiStore } from "../../src/state/uiStore";

describe("uiStore", () => {
  beforeEach(() => useUiStore.getState().reset());

  it("defaults to select tool, paused, snap on", () => {
    const s = useUiStore.getState();
    expect(s.tool).toBe("select");
    expect(s.playing).toBe(false);
    expect(s.snapEnabled).toBe(true);
  });

  it("clears selection when switching to a placement tool", () => {
    useUiStore.getState().setSelection({ type: "module", id: "m1" });
    useUiStore.getState().setTool("straight");
    expect(useUiStore.getState().selection).toBeNull();
  });

  it("rotates placement in quarter turns", () => {
    useUiStore.getState().rotatePlacement();
    expect(useUiStore.getState().placementRotation).toBeCloseTo(Math.PI / 2);
  });
});
