import type { ScenarioV2 } from "./types";

export function serializeScenario(scenario: ScenarioV2): string {
  return JSON.stringify(scenario, null, 2);
}

export function parseScenario(json: string): ScenarioV2 | null {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return null;
  }
  if (typeof raw !== "object" || raw === null) return null;
  const doc = raw as Record<string, unknown>;
  if (doc.version !== 2) return null;
  const world = doc.world as Record<string, unknown> | undefined;
  const story = doc.story as Record<string, unknown> | undefined;
  const meta = doc.meta as Record<string, unknown> | undefined;
  if (!world || !story || !meta) return null;
  const arrays = [
    world.trackModules,
    world.connections,
    world.trains,
    world.conflicts,
    story.shots,
    story.annotations,
  ];
  if (!arrays.every(Array.isArray)) return null;
  if (typeof doc.nextId !== "number" || typeof meta.title !== "string") return null;
  return raw as ScenarioV2;
}
