import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { loadInitialScenario, startAutosave } from "./state/persistence";
import { useWorldStore } from "./state/worldStore";
import "./styles/app.css";

useWorldStore.getState().replaceScenario(loadInitialScenario(window.localStorage));
useWorldStore.temporal.getState().clear();
startAutosave(window.localStorage);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
