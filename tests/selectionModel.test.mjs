import assert from "node:assert/strict";
import {
  createSelectionState,
  getDeleteTarget,
  getSelectedObject,
} from "../src/utils/selectionModel.js";

const state = createSelectionState({ activeTrainId: "t1" });

assert.equal(getSelectedObject(state), null, "active train should not count as visible selection");
assert.equal(getDeleteTarget(state), null, "Delete should do nothing without visible selection");

state.selectedTrainId = "t2";
state.activeTrainId = "t2";
assert.deepEqual(
  getSelectedObject(state),
  { type: "train", id: "t2" },
  "selected train should be a visible selected object",
);
assert.deepEqual(
  getDeleteTarget(state),
  { type: "train", id: "t2" },
  "Delete should target visibly selected train",
);

state.selectedTrainId = null;
state.selectedModuleId = "m4";
assert.deepEqual(
  getSelectedObject(state),
  { type: "module", id: "m4" },
  "module selection should take precedence over active train",
);

state.selectedModuleId = null;
state.selectedConflictId = "c3";
assert.deepEqual(
  getDeleteTarget(state),
  { type: "conflict", id: "c3" },
  "Delete should target selected conflict",
);
