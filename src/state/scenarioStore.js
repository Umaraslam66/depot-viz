import { cloneJson } from "../utils/serialization.js";

export function normalizeScenario(inputScenario, defaultScenario) {
  const sourceScenario = inputScenario ?? {};
  const mergedScenario = {
    ...cloneJson(defaultScenario),
    ...sourceScenario,
    meta: {
      ...defaultScenario.meta,
      ...(sourceScenario.meta ?? {}),
      colors: {
        ...defaultScenario.meta.colors,
        ...(sourceScenario.meta?.colors ?? {}),
      },
    },
    exports: {
      ...defaultScenario.exports,
      ...(sourceScenario.exports ?? {}),
    },
    view: {
      ...defaultScenario.view,
      ...(sourceScenario.view ?? {}),
      overlays: {
        ...defaultScenario.view.overlays,
        ...(sourceScenario.view?.overlays ?? {}),
      },
    },
  };
  mergedScenario.trains = (mergedScenario.trains ?? []).map((trainRecord) => ({
    ...trainRecord,
    selectedRouteId: trainRecord.selectedRouteId ?? trainRecord.route ?? "main",
  }));
  mergedScenario.connections = mergedScenario.connections ?? [];
  mergedScenario.conflicts = mergedScenario.conflicts ?? [];
  mergedScenario.trackModules = mergedScenario.trackModules ?? [];
  return mergedScenario;
}

export function readScenarioFromUrl(windowValue, defaultScenario) {
  const urlParams = new URLSearchParams(windowValue.location.search);
  const encodedScenario = urlParams.get("scenario");
  if (!encodedScenario) {
    return null;
  }

  try {
    const decodedJson = decodeURIComponent(escape(atob(encodedScenario)));
    const parsedScenario = JSON.parse(decodedJson);
    if (!isScenarioLike(parsedScenario)) {
      return null;
    }
    return normalizeScenario(parsedScenario, defaultScenario);
  } catch {
    return null;
  }
}

export function readScenarioFromBrowser(windowValue, saveKey, defaultScenario) {
  try {
    const savedScenario = windowValue.localStorage.getItem(saveKey);
    if (!savedScenario) {
      return null;
    }
    const parsedScenario = JSON.parse(savedScenario);
    if (!isScenarioLike(parsedScenario)) {
      return null;
    }
    return normalizeScenario(parsedScenario, defaultScenario);
  } catch {
    return null;
  }
}

export function encodeScenarioSnapshot(scenarioSnapshot) {
  const jsonValue = JSON.stringify(scenarioSnapshot);
  return btoa(unescape(encodeURIComponent(jsonValue)));
}

export function isScenarioLike(value) {
  return Boolean(value && Array.isArray(value.trackModules) && Array.isArray(value.trains));
}
