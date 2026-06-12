import { useEffect } from "react";
import { useUiStore } from "../state/uiStore";
import { useWorldStore } from "../state/worldStore";

export function useShortcuts(): void {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT") return;
      const ui = useUiStore.getState();
      const world = useWorldStore.getState();

      if (event.key === "Escape") {
        ui.setSelection(null);
        ui.setTool("select");
      } else if (event.key.toLowerCase() === "r") {
        if (ui.selection?.type === "module") {
          world.rotateModule(ui.selection.id);
        } else {
          ui.rotatePlacement();
        }
      } else if (event.key === "Delete" || event.key === "Backspace") {
        if (!ui.selection) return;
        if (ui.selection.type === "module") world.removeModule(ui.selection.id);
        if (ui.selection.type === "train") world.removeTrain(ui.selection.id);
        if (ui.selection.type === "conflict") world.removeConflict(ui.selection.id);
        ui.setSelection(null);
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z" && !event.shiftKey) {
        event.preventDefault();
        useWorldStore.temporal.getState().undo();
      } else if (
        ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") ||
        ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "z")
      ) {
        event.preventDefault();
        useWorldStore.temporal.getState().redo();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
