import { demoScenario } from "../sim/demoScenario";
import { parseScenario, serializeScenario } from "../sim/serialization";
import type { ScenarioV2 } from "../sim/types";
import { useUiStore } from "./uiStore";
import { buildScenarioSnapshot, useWorldStore } from "./worldStore";

export const AUTOSAVE_KEY = "rail-story-studio:autosave:v1";
const AUTOSAVE_DELAY_MS = 800;

export function loadInitialScenario(storage: Storage): ScenarioV2 {
  const raw = storage.getItem(AUTOSAVE_KEY);
  if (!raw) return demoScenario;
  const parsed = parseScenario(raw);
  return parsed ?? demoScenario;
}

export function saveToStorage(storage: Storage, scenario: ScenarioV2): boolean {
  try {
    storage.setItem(AUTOSAVE_KEY, serializeScenario(scenario));
    return true;
  } catch {
    return false;
  }
}

let autosaveTimer: ReturnType<typeof setTimeout> | null = null;

export function startAutosave(storage: Storage): () => void {
  return useWorldStore.subscribe(() => {
    useUiStore.getState().setSaveStatus("saving");
    if (autosaveTimer) clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => {
      const ok = saveToStorage(storage, buildScenarioSnapshot());
      useUiStore.getState().setSaveStatus(ok ? "saved" : "error");
    }, AUTOSAVE_DELAY_MS);
  });
}

export function exportScenarioJson(): { filename: string; json: string } {
  const scenario = buildScenarioSnapshot();
  const slug = scenario.meta.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "scenario";
  return { filename: `${slug}.json`, json: serializeScenario(scenario) };
}

export function importScenarioJson(json: string): boolean {
  const parsed = parseScenario(json);
  if (!parsed) return false;
  useWorldStore.getState().replaceScenario(parsed);
  useWorldStore.temporal.getState().clear();
  useUiStore.getState().setSelection(null);
  return true;
}
