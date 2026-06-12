import { findRoutes } from "../sim/routes";
import type { ConflictType } from "../sim/types";
import { useUiStore } from "../state/uiStore";
import { useWorldStore } from "../state/worldStore";

const CONFLICT_TYPES: ConflictType[] = ["headway", "junction", "platform", "blocked", "delay"];

// Small helper to keep ModuleSection readable; name updates flow through the undoable store.
function useWorldStoreActions() {
  const rotateModule = useWorldStore((s) => s.rotateModule);
  const duplicateModule = useWorldStore((s) => s.duplicateModule);
  const removeModule = useWorldStore((s) => s.removeModule);
  const updateModuleName = (id: string, name: string) =>
    useWorldStore.setState({
      trackModules: useWorldStore.getState().trackModules.map((m) => (m.id === id ? { ...m, name } : m)),
    });
  return { rotateModule, duplicateModule, removeModule, updateModuleName };
}

function ModuleSection({ id }: { id: string }) {
  const module = useWorldStore((s) => s.trackModules.find((m) => m.id === id));
  const { rotateModule, duplicateModule, removeModule, updateModuleName } = useWorldStoreActions();
  if (!module) return null;
  return (
    <>
      <h2>Module · {module.type}</h2>
      <label className="field">
        Name
        <input type="text" maxLength={28} value={module.name ?? ""} onChange={(e) => updateModuleName(id, e.target.value)} />
      </label>
      <div className="field-row">
        Rotation {Math.round((module.rotation * 180) / Math.PI)}°
        <button onClick={() => rotateModule(id)}>Rotate 90°</button>
      </div>
      <div className="field-row">
        <button onClick={() => duplicateModule(id)}>Duplicate</button>
        <button onClick={() => removeModule(id)}>Delete</button>
      </div>
    </>
  );
}

function TrainSection({ id }: { id: string }) {
  const train = useWorldStore((s) => s.trains.find((t) => t.id === id));
  const trackModules = useWorldStore((s) => s.trackModules);
  const connections = useWorldStore((s) => s.connections);
  const updateTrain = useWorldStore((s) => s.updateTrain);
  const removeTrain = useWorldStore((s) => s.removeTrain);
  if (!train) return null;
  const routes = findRoutes({ trackModules, connections, trains: [], conflicts: [] });
  return (
    <>
      <h2>Train</h2>
      <label className="field">
        Name
        <input type="text" maxLength={24} value={train.name} onChange={(e) => updateTrain(id, { name: e.target.value })} />
      </label>
      <label className="field">
        Route
        <select value={train.routeId ?? ""} onChange={(e) => updateTrain(id, { routeId: e.target.value || null })}>
          <option value="">Auto (first route)</option>
          {routes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.id} ({r.moduleIds.length} modules)
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        Speed {train.speed.toFixed(1)}
        <input type="range" min={1} max={12} step={0.1} value={train.speed} onChange={(e) => updateTrain(id, { speed: Number(e.target.value) })} />
      </label>
      <label className="field">
        Color
        <input type="color" value={train.color} onChange={(e) => updateTrain(id, { color: e.target.value })} />
      </label>
      <div className="field-row">
        Enabled
        <input type="checkbox" checked={train.enabled} onChange={(e) => updateTrain(id, { enabled: e.target.checked })} />
      </div>
      <button onClick={() => removeTrain(id)}>Delete train</button>
    </>
  );
}

function ConflictSection({ id }: { id: string }) {
  const conflict = useWorldStore((s) => s.conflicts.find((c) => c.id === id));
  const updateConflict = useWorldStore((s) => s.updateConflict);
  const removeConflict = useWorldStore((s) => s.removeConflict);
  if (!conflict) return null;
  return (
    <>
      <h2>Conflict</h2>
      <label className="field">
        Label
        <input type="text" maxLength={42} value={conflict.label} onChange={(e) => updateConflict(id, { label: e.target.value })} />
      </label>
      <label className="field">
        Type
        <select value={conflict.type} onChange={(e) => updateConflict(id, { type: e.target.value as ConflictType })}>
          {CONFLICT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        Severity
        <select value={conflict.severity} onChange={(e) => updateConflict(id, { severity: e.target.value as "medium" | "high" })}>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </label>
      <div className="field-row">
        Active
        <input type="checkbox" checked={conflict.active} onChange={(e) => updateConflict(id, { active: e.target.checked })} />
      </div>
      <button onClick={() => removeConflict(id)}>Delete conflict</button>
    </>
  );
}

export function Inspector() {
  const selection = useUiStore((s) => s.selection);
  if (!selection) return null;
  return (
    <aside className="panel inspector">
      {selection.type === "module" && <ModuleSection id={selection.id} />}
      {selection.type === "train" && <TrainSection id={selection.id} />}
      {selection.type === "conflict" && <ConflictSection id={selection.id} />}
    </aside>
  );
}
