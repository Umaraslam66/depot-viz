import { beforeEach, describe, expect, it } from "vitest";
import { AUTOSAVE_KEY, loadInitialScenario, saveToStorage } from "../../src/state/persistence";
import { demoScenario } from "../../src/sim/demoScenario";
import { serializeScenario } from "../../src/sim/serialization";

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
    key: () => null,
    get length() {
      return map.size;
    },
  } as Storage;
}

describe("persistence", () => {
  let storage: Storage;
  beforeEach(() => {
    storage = memoryStorage();
  });

  it("falls back to the demo when storage is empty", () => {
    expect(loadInitialScenario(storage)).toEqual(demoScenario);
  });

  it("loads a saved scenario", () => {
    const saved = { ...demoScenario, meta: { ...demoScenario.meta, title: "My Depot" } };
    storage.setItem(AUTOSAVE_KEY, serializeScenario(saved));
    expect(loadInitialScenario(storage).meta.title).toBe("My Depot");
  });

  it("ignores corrupt saves and reports it", () => {
    storage.setItem(AUTOSAVE_KEY, "{broken");
    const result = loadInitialScenario(storage);
    expect(result).toEqual(demoScenario);
  });

  it("saveToStorage round-trips", () => {
    saveToStorage(storage, demoScenario);
    expect(loadInitialScenario(storage)).toEqual(demoScenario);
  });
});
