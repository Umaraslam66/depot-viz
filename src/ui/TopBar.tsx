import { useUiStore } from "../state/uiStore";
import { useWorldStore } from "../state/worldStore";

export function TopBar() {
  const title = useWorldStore((s) => s.meta.title);
  const playing = useUiStore((s) => s.playing);
  const simSpeed = useUiStore((s) => s.simSpeed);
  const saveStatus = useUiStore((s) => s.saveStatus);
  const quality = useUiStore((s) => s.quality);
  const setPlaying = useUiStore((s) => s.setPlaying);
  const setSimSpeed = useUiStore((s) => s.setSimSpeed);
  const setQuality = useUiStore((s) => s.setQuality);

  return (
    <header className="panel top-bar">
      <span className="title">{title}</span>
      <button className="primary" onClick={() => setPlaying(!playing)}>
        {playing ? "Pause" : "Play"}
      </button>
      <label className="field-row" style={{ marginBottom: 0 }}>
        Speed {simSpeed.toFixed(2)}x
        <input
          type="range"
          min={0}
          max={2.5}
          step={0.05}
          value={simSpeed}
          onChange={(e) => setSimSpeed(Number(e.target.value))}
        />
      </label>
      <label className="field-row" style={{ marginBottom: 0 }}>
        Quality
        <select value={quality} onChange={(e) => setQuality(e.target.value as "performance" | "balanced" | "high")}>
          <option value="performance">Performance</option>
          <option value="balanced">Balanced</option>
          <option value="high">High</option>
        </select>
      </label>
      <span className="status">{saveStatus === "saved" ? "Saved" : saveStatus === "saving" ? "Saving…" : "Save failed"}</span>
    </header>
  );
}
