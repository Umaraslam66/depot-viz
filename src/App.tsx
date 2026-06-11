import { Suspense, lazy } from "react";
import { TopBar } from "./ui/TopBar";
import { Toolbar } from "./ui/Toolbar";
import { Inspector } from "./ui/Inspector";
import { ValidationPanel } from "./ui/ValidationPanel";
import { useShortcuts } from "./ui/useShortcuts";

const WorldCanvas = lazy(() => import("./world/WorldCanvas"));

export default function App() {
  useShortcuts();
  return (
    <div className="app-shell">
      <Suspense fallback={null}>
        <WorldCanvas />
      </Suspense>
      <TopBar />
      <Toolbar />
      <Inspector />
      <ValidationPanel />
    </div>
  );
}
