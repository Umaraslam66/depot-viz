function distanceFromStart(candidate, clientX, clientY) {
  return Math.hypot(clientX - candidate.startX, clientY - candidate.startY);
}

export function createCanvasGestureController({ movementThreshold = 6 } = {}) {
  let candidate = null;
  let dragging = false;

  return {
    pointerDown({ clientX, clientY, target, activeTool, shiftKey }) {
      candidate = {
        startX: clientX,
        startY: clientY,
        target,
        activeTool,
        shiftKey: Boolean(shiftKey),
      };
      dragging = false;
      return { type: "pending" };
    },

    pointerMove({ clientX, clientY }) {
      if (!candidate) {
        return { type: "idle" };
      }
      if (!dragging && distanceFromStart(candidate, clientX, clientY) < movementThreshold) {
        return { type: "pending" };
      }
      if (!dragging) {
        dragging = true;
        return candidate.target
          ? { type: "start-object-drag", target: candidate.target }
          : { type: "start-pan" };
      }
      return candidate.target
        ? { type: "continue-object-drag", target: candidate.target }
        : { type: "continue-pan" };
    },

    pointerUp() {
      if (!candidate) {
        return { type: "idle" };
      }
      const completedCandidate = candidate;
      const wasDragging = dragging;
      candidate = null;
      dragging = false;

      if (wasDragging) {
        return completedCandidate.target
          ? { type: "end-object-drag", target: completedCandidate.target }
          : { type: "end-pan" };
      }
      if (completedCandidate.target) {
        return { type: "select", target: completedCandidate.target };
      }
      if (completedCandidate.shiftKey) {
        return { type: "select-nearest" };
      }
      if (completedCandidate.activeTool && completedCandidate.activeTool !== "select") {
        return { type: "place", tool: completedCandidate.activeTool };
      }
      return { type: "clear-selection" };
    },

    reset() {
      candidate = null;
      dragging = false;
    },
  };
}
