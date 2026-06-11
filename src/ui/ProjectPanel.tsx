import { useRef } from "react";
import { downloadText } from "../export/downloads";
import { demoScenario } from "../sim/demoScenario";
import { useUiStore } from "../state/uiStore";
import { useWorldStore } from "../state/worldStore";
import { exportScenarioJson, importScenarioJson } from "../state/persistence";

export function ProjectPanel() {
  const meta = useWorldStore((s) => s.meta);
  const setMeta = useWorldStore((s) => s.setMeta);
  const replaceScenario = useWorldStore((s) => s.replaceScenario);
  const fileInput = useRef<HTMLInputElement>(null);

  function onImportFile(file: File) {
    file.text().then((text) => {
      if (!importScenarioJson(text)) {
        window.alert("That file is not a valid Rail Story Studio scenario (version 2).");
      }
    });
  }

  return (
    <aside className="panel inspector">
      <h2>Project</h2>
      <label className="field">
        Title
        <input type="text" maxLength={52} value={meta.title} onChange={(e) => setMeta({ title: e.target.value })} />
      </label>
      <label className="field">
        Author
        <input type="text" maxLength={54} value={meta.author} onChange={(e) => setMeta({ author: e.target.value })} />
      </label>
      <label className="field">
        Notes
        <textarea maxLength={220} value={meta.notes} onChange={(e) => setMeta({ notes: e.target.value })} />
      </label>
      <div className="field-row">
        <button
          onClick={() => {
            const { filename, json } = exportScenarioJson();
            downloadText(filename, json);
          }}
        >
          Export JSON
        </button>
        <button onClick={() => fileInput.current?.click()}>Import JSON</button>
      </div>
      <button
        onClick={() => {
          replaceScenario(demoScenario);
          useWorldStore.temporal.getState().clear();
          useUiStore.getState().setSelection(null);
        }}
      >
        Reset demo
      </button>
      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onImportFile(file);
          e.target.value = "";
        }}
      />
    </aside>
  );
}
