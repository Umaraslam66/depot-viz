function isEditableTarget(target) {
  return ["INPUT", "SELECT", "TEXTAREA"].includes(target?.tagName) || target?.isContentEditable;
}

function isSpaceKey(event) {
  return event.key === " " || event.key === "Spacebar" || event.code === "Space";
}

export function createSpacePanController({
  bodyClassList,
  orbitControls,
  mousePanValue,
  mouseRotateValue,
  onChange = () => {},
}) {
  let active = false;

  function setActive(nextActive) {
    if (active === nextActive) {
      return;
    }
    active = nextActive;
    orbitControls.mouseButtons.LEFT = active ? mousePanValue : mouseRotateValue;
    bodyClassList?.toggle("is-space-panning", active);
    onChange(active);
  }

  return {
    handleKeyDown(event) {
      if (!isSpaceKey(event) || isEditableTarget(event.target) || event.repeat) {
        return;
      }
      event.preventDefault();
      setActive(true);
    },
    handleKeyUp(event) {
      if (!isSpaceKey(event)) {
        return;
      }
      event.preventDefault();
      setActive(false);
    },
    isActive() {
      return active;
    },
    reset() {
      setActive(false);
    },
  };
}
