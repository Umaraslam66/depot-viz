import { useMemo } from "react";
import { countActionableWarnings, validateWorld } from "../sim/validation";
import { useWorldStore } from "../state/worldStore";

export function ValidationPanel() {
  const trackModules = useWorldStore((s) => s.trackModules);
  const connections = useWorldStore((s) => s.connections);
  const trains = useWorldStore((s) => s.trains);
  const conflicts = useWorldStore((s) => s.conflicts);

  const warnings = useMemo(
    () => validateWorld({ trackModules, connections, trains, conflicts }),
    [trackModules, connections, trains, conflicts],
  );
  const actionable = countActionableWarnings(warnings);
  if (warnings.length === 0) return null;

  return (
    <aside className="panel validation">
      <h2>
        Validation · {actionable} issue{actionable === 1 ? "" : "s"}
      </h2>
      <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
        {warnings.map((w, i) => (
          <li key={i} className={`issue ${w.severity}`}>
            {w.message}
          </li>
        ))}
      </ul>
    </aside>
  );
}
