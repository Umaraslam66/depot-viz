import { describe, expect, it } from "vitest";
import {
  distance,
  getModulePortDefinitions,
  getWorldPorts,
  localDirectionToWorld,
  normalizeRotation,
  worldPosition,
} from "../../src/sim/geometry";
import type { TrackModule } from "../../src/sim/types";

const straight: TrackModule = { id: "m1", type: "straight", position: [10, 0, 5], rotation: 0 };

describe("geometry", () => {
  it("transforms local to world with rotation", () => {
    const rotated: TrackModule = { ...straight, rotation: Math.PI / 2 };
    const p = worldPosition(rotated, 4, 0.18, 0);
    expect(p.x).toBeCloseTo(10);
    expect(p.z).toBeCloseTo(5 - 4);
    expect(p.y).toBeCloseTo(0.18);
  });

  it("rotates directions and keeps them normalized", () => {
    const d = localDirectionToWorld({ ...straight, rotation: Math.PI }, 1, 0);
    expect(d.x).toBeCloseTo(-1);
    expect(d.z).toBeCloseTo(0);
  });

  it("defines ports for track types and none for signals", () => {
    expect(getModulePortDefinitions("straight").map((p) => p.id)).toEqual(["A", "B"]);
    expect(getModulePortDefinitions("turnout")).toHaveLength(3);
    expect(getModulePortDefinitions("signal")).toHaveLength(0);
  });

  it("produces world ports at module ends", () => {
    const ports = getWorldPorts(straight);
    expect(ports[0].position.x).toBeCloseTo(6);
    expect(ports[1].position.x).toBeCloseTo(14);
  });

  it("normalizes rotation into [0, 2PI)", () => {
    expect(normalizeRotation(-Math.PI / 2)).toBeCloseTo(Math.PI * 1.5);
    expect(normalizeRotation(Math.PI * 2.5)).toBeCloseTo(Math.PI * 0.5);
  });

  it("measures planar distance", () => {
    expect(distance({ x: 0, y: 0, z: 0 }, { x: 3, y: 0, z: 4 })).toBeCloseTo(5);
  });
});
