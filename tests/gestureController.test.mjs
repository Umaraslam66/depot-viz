import assert from "node:assert/strict";
import { createCanvasGestureController } from "../src/utils/gestureController.js";

const controller = createCanvasGestureController({ movementThreshold: 6 });

controller.pointerDown({
  clientX: 100,
  clientY: 100,
  target: null,
  activeTool: "straight",
  shiftKey: false,
});
assert.deepEqual(
  controller.pointerUp({ clientX: 102, clientY: 101 }),
  { type: "place", tool: "straight" },
  "blank click with a placement tool should place on pointerup",
);

controller.pointerDown({
  clientX: 100,
  clientY: 100,
  target: null,
  activeTool: "straight",
  shiftKey: false,
});
assert.deepEqual(
  controller.pointerMove({ clientX: 112, clientY: 100 }),
  { type: "start-pan" },
  "blank drag should become navigation, not placement",
);
assert.deepEqual(
  controller.pointerUp({ clientX: 112, clientY: 100 }),
  { type: "end-pan" },
  "blank drag pointerup should end navigation without placing",
);

controller.pointerDown({
  clientX: 40,
  clientY: 40,
  target: { type: "module", id: "m1" },
  activeTool: "straight",
  shiftKey: false,
});
assert.deepEqual(
  controller.pointerUp({ clientX: 42, clientY: 41 }),
  { type: "select", target: { type: "module", id: "m1" } },
  "clicking a module should select without starting drag",
);

controller.pointerDown({
  clientX: 40,
  clientY: 40,
  target: { type: "module", id: "m1" },
  activeTool: "straight",
  shiftKey: false,
});
assert.deepEqual(
  controller.pointerMove({ clientX: 52, clientY: 40 }),
  { type: "start-object-drag", target: { type: "module", id: "m1" } },
  "module drag should only start after crossing the movement threshold",
);
assert.deepEqual(
  controller.pointerUp({ clientX: 52, clientY: 40 }),
  { type: "end-object-drag", target: { type: "module", id: "m1" } },
  "module drag pointerup should complete object drag",
);

controller.pointerDown({
  clientX: 80,
  clientY: 80,
  target: null,
  activeTool: "select",
  shiftKey: false,
});
assert.deepEqual(
  controller.pointerUp({ clientX: 80, clientY: 80 }),
  { type: "clear-selection" },
  "select mode blank click should clear visible selection instead of placing",
);

controller.pointerDown({
  clientX: 80,
  clientY: 80,
  target: null,
  activeTool: "select",
  shiftKey: true,
});
assert.deepEqual(
  controller.pointerUp({ clientX: 80, clientY: 80 }),
  { type: "select-nearest" },
  "shift-click on blank canvas should preserve nearest-object selection behavior",
);
