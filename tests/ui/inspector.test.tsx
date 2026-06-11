// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Inspector } from "../../src/ui/Inspector";
import { useUiStore } from "../../src/state/uiStore";
import { useWorldStore } from "../../src/state/worldStore";
import { demoScenario } from "../../src/sim/demoScenario";

describe("Inspector", () => {
  afterEach(cleanup);

  it("renders nothing without a selection", () => {
    useWorldStore.getState().replaceScenario(demoScenario);
    useUiStore.getState().reset();
    const { container } = render(<Inspector />);
    expect(container.firstChild).toBeNull();
  });

  it("shows train properties when a train is selected", () => {
    useWorldStore.getState().replaceScenario(demoScenario);
    useUiStore.getState().setSelection({ type: "train", id: "t1" });
    render(<Inspector />);
    expect(screen.getByDisplayValue("IC-214")).toBeTruthy();
  });
});
