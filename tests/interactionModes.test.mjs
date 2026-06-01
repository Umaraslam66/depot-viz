import assert from "node:assert/strict";
import { createSpacePanController } from "../src/utils/interactionModes.js";

function keyEvent(key, target = {}) {
  let prevented = false;
  return {
    key,
    target,
    preventDefault() {
      prevented = true;
    },
    get prevented() {
      return prevented;
    },
  };
}

const bodyClassList = {
  values: new Set(),
  toggle(name, enabled) {
    if (enabled) {
      this.values.add(name);
      return;
    }
    this.values.delete(name);
  },
};

const orbitControls = {
  mouseButtons: { LEFT: "ROTATE", MIDDLE: "DOLLY", RIGHT: "PAN" },
};

const controller = createSpacePanController({
  bodyClassList,
  orbitControls,
  mousePanValue: "PAN",
  mouseRotateValue: "ROTATE",
});

const downEvent = keyEvent(" ");
controller.handleKeyDown(downEvent);
assert.equal(controller.isActive(), true, "Space should enable pan mode");
assert.equal(downEvent.prevented, true, "Space pan should prevent page scroll");
assert.equal(orbitControls.mouseButtons.LEFT, "PAN", "Left mouse should pan while Space is held");
assert.equal(bodyClassList.values.has("is-space-panning"), true, "Body class should expose pan state");

controller.handleKeyUp(keyEvent(" "));
assert.equal(controller.isActive(), false, "Space release should disable pan mode");
assert.equal(orbitControls.mouseButtons.LEFT, "ROTATE", "Left mouse should return to rotate after Space");
assert.equal(bodyClassList.values.has("is-space-panning"), false, "Body class should clear pan state");

const inputController = createSpacePanController({
  bodyClassList,
  orbitControls,
  mousePanValue: "PAN",
  mouseRotateValue: "ROTATE",
});
inputController.handleKeyDown(keyEvent(" ", { tagName: "INPUT" }));
assert.equal(inputController.isActive(), false, "Typing Space inside inputs should not enable pan mode");
