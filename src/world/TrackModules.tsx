import { useRef } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import { Plane, Vector3 } from "three";
import { useUiStore } from "../state/uiStore";
import { useWorldStore } from "../state/worldStore";
import type { TrackModule } from "../sim/types";
import { CurveModule, SignalModule, StationModule, StraightModule, TurnoutModule } from "./trackMeshes";

const dragPlane = new Plane(new Vector3(0, 1, 0), 0);
const dragPoint = new Vector3();

function ModuleMesh({ module }: { module: TrackModule }) {
  const selected = useUiStore((s) => s.selection?.type === "module" && s.selection.id === module.id);
  const moved = useRef(false);

  function onPointerDown(event: ThreeEvent<PointerEvent>) {
    if (useUiStore.getState().tool !== "select") return;
    event.stopPropagation();
    moved.current = false;
    useUiStore.getState().setSelection({ type: "module", id: module.id });
    useUiStore.getState().setDraggingId(module.id);
    (event.target as Element).setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: ThreeEvent<PointerEvent>) {
    if (useUiStore.getState().draggingId !== module.id) return;
    event.ray.intersectPlane(dragPlane, dragPoint);
    moved.current = true;
    useWorldStore
      .getState()
      .moveModule(module.id, { x: dragPoint.x, y: 0, z: dragPoint.z }, useUiStore.getState().snapEnabled);
  }

  function onPointerUp() {
    if (useUiStore.getState().draggingId === module.id) {
      useUiStore.getState().setDraggingId(null);
    }
  }

  return (
    <group
      position={module.position}
      rotation={[0, module.rotation, 0]}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {module.type === "straight" && <StraightModule />}
      {module.type === "curve" && <CurveModule />}
      {module.type === "turnout" && <TurnoutModule />}
      {module.type === "station" && <StationModule name={module.name} />}
      {module.type === "signal" && <SignalModule />}
      {selected ? (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[4.6, 5.0, 40]} />
          <meshBasicMaterial color="#e85d3d" transparent opacity={0.85} />
        </mesh>
      ) : null}
    </group>
  );
}

export function TrackModules() {
  const modules = useWorldStore((s) => s.trackModules);
  return (
    <>
      {modules.map((m) => (
        <ModuleMesh key={m.id} module={m} />
      ))}
    </>
  );
}
