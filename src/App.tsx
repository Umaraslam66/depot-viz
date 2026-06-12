import { Suspense, lazy } from "react";
import { useUiStore } from "./state/uiStore";
import { TopBar } from "./ui/TopBar";
import { Toolbar } from "./ui/Toolbar";
import { Inspector } from "./ui/Inspector";
import { ProjectPanel } from "./ui/ProjectPanel";
import { ValidationPanel } from "./ui/ValidationPanel";
import { useShortcuts } from "./ui/useShortcuts";

const WorldCanvas = lazy(() => import("./world/WorldCanvas"));

export default function App() {
  useShortcuts();
  const hasSelection = useUiStore((s) => s.selection !== null);
  return (
    <div className="app-shell">
      <Suspense fallback={null}>
        <WorldCanvas />
      </Suspense>
      <TopBar />
      <Toolbar />
      {hasSelection ? <Inspector /> : <ProjectPanel />}
      <ValidationPanel />
    </div>
  );
}
