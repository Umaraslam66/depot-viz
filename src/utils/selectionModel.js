export function createSelectionState({
  selectedModuleId = null,
  selectedConflictId = null,
  selectedTrainId = null,
  activeTrainId = null,
} = {}) {
  return {
    selectedModuleId,
    selectedConflictId,
    selectedTrainId,
    activeTrainId,
  };
}

export function getSelectedObject(selectionState) {
  if (selectionState.selectedModuleId) {
    return { type: "module", id: selectionState.selectedModuleId };
  }
  if (selectionState.selectedConflictId) {
    return { type: "conflict", id: selectionState.selectedConflictId };
  }
  if (selectionState.selectedTrainId) {
    return { type: "train", id: selectionState.selectedTrainId };
  }
  return null;
}

export function getDeleteTarget(selectionState) {
  return getSelectedObject(selectionState);
}
