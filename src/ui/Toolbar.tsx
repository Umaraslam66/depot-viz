import { useUiStore, type Tool } from "../state/uiStore";
import { useWorldStore } from "../state/worldStore";

const TOOLS: { id: Tool; label: string }[] = [
  { id: "select", label: "Select" },
  { id: "straight", label: "Straight" },
  { id: "curve", label: "Curve" },
  { id: "turnout", label: "Turnout" },
  { id: "station", label: "Station" },
  { id: "signal", label: "Signal" },
  { id: "train", label: "Train" },
  { id: "conflict", label: "Conflict" },
];

export function Toolbar() {
  const tool = useUiStore((s) => s.tool);
  const setTool = useUiStore((s) => s.setTool);
  const snapEnabled = useUiStore((s) => s.snapEnabled);
  const setSnapEnabled = useUiStore((s) => s.setSnapEnabled);
  const undo = () => useWorldStore.temporal.getState().undo();
  const redo = () => useWorldStore.temporal.getState().redo();

  return (
    <nav className="panel toolbar">
      {TOOLS.map((t) => (
        <button key={t.id} className={tool === t.id ? "is-active" : ""} onClick={() => setTool(t.id)}>
          {t.label}
        </button>
      ))}
      <hr style={{ width: "100%", border: "none", borderTop: "1px solid rgba(40,60,50,0.12)" }} />
      <button onClick={undo}>Undo</button>
      <button onClick={redo}>Redo</button>
      <label className="field-row" style={{ marginBottom: 0 }}>
        Snap
        <input type="checkbox" checked={snapEnabled} onChange={(e) => setSnapEnabled(e.target.checked)} />
      </label>
    </nav>
  );
}
