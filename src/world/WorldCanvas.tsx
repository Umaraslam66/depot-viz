import { Canvas, useFrame } from "@react-three/fiber";
import { MapControls } from "@react-three/drei";
import { ACESFilmicToneMapping, PCFShadowMap } from "three";
import { Ground } from "./Ground";
import { Lighting } from "./Lighting";
import { TrackModules } from "./TrackModules";
import { Trains } from "./Trains";
import { Conflicts } from "./Conflicts";
import { simClock } from "./simClock";
import { useUiStore } from "../state/uiStore";

const QUALITY_DPR: Record<string, [number, number]> = {
  performance: [0.75, 1],
  balanced: [1, 1.5],
  high: [1, 2],
};

function SimDriver() {
  useFrame((_, delta) => {
    const { playing, simSpeed } = useUiStore.getState();
    if (playing) {
      simClock.time += delta * simSpeed;
    }
  });
  return null;
}

export default function WorldCanvas() {
  const quality = useUiStore((s) => s.quality);
  const dragging = useUiStore((s) => s.draggingId !== null);
  return (
    <Canvas
      shadows={{ type: PCFShadowMap }}
      dpr={QUALITY_DPR[quality]}
      camera={{ position: [0, 34, 34], fov: 42 }}
      gl={{ antialias: true, toneMapping: ACESFilmicToneMapping, preserveDrawingBuffer: true }}
      style={{ position: "absolute", inset: 0 }}
      onCreated={({ gl }) => {
        // Allow the browser to restore a lost WebGL context; three re-uploads GPU resources on restore.
        gl.domElement.addEventListener("webglcontextlost", (event) => event.preventDefault());
      }}
    >
      <color attach="background" args={["#cfe9e3"]} />
      <fog attach="fog" args={["#cfe9e3", 90, 180]} />
      <Lighting />
      <Ground />
      <TrackModules />
      <Trains />
      <Conflicts />
      <SimDriver />
      <MapControls makeDefault enabled={!dragging} maxPolarAngle={Math.PI * 0.46} minDistance={10} maxDistance={120} />
    </Canvas>
  );
}
