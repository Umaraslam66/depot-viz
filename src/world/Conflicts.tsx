import { useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Group, Plane, Vector3 } from "three";
import type { Conflict } from "../sim/types";
import { useUiStore } from "../state/uiStore";
import { useWorldStore } from "../state/worldStore";
import { ModuleLabel } from "./trackMeshes";

const dragPlane = new Plane(new Vector3(0, 1, 0), 0);
const dragPoint = new Vector3();

function ConflictMarker({ conflict }: { conflict: Conflict }) {
  const group = useRef<Group>(null);
  const selected = useUiStore((s) => s.selection?.type === "conflict" && s.selection.id === conflict.id);
  const color = conflict.severity === "high" ? "#dc2626" : "#d97706";

  useFrame(({ clock }) => {
    if (!group.current) return;
    const pulse = conflict.active ? 1 + Math.sin(clock.elapsedTime * 3) * 0.08 : 1;
    group.current.scale.setScalar(pulse);
  });

  function onPointerDown(event: ThreeEvent<PointerEvent>) {
    if (useUiStore.getState().tool !== "select") return;
    event.stopPropagation();
    useUiStore.getState().setSelection({ type: "conflict", id: conflict.id });
    useUiStore.getState().setDraggingId(conflict.id);
  }

  function onPointerMove(event: ThreeEvent<PointerEvent>) {
    if (useUiStore.getState().draggingId !== conflict.id) return;
    event.ray.intersectPlane(dragPlane, dragPoint);
    useWorldStore.getState().moveConflict(conflict.id, { x: dragPoint.x, y: 0, z: dragPoint.z });
  }

  function onPointerUp() {
    if (useUiStore.getState().draggingId === conflict.id) {
      useUiStore.getState().setDraggingId(null);
    }
  }

  return (
    <group
      ref={group}
      position={[conflict.position[0], 0, conflict.position[2]]}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.6, 2.1, 32]} />
        <meshBasicMaterial color={color} transparent opacity={conflict.active ? 0.9 : 0.35} />
      </mesh>
      <mesh position={[0, 1.4, 0]} castShadow>
        <coneGeometry args={[0.55, 1.4, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={conflict.active ? 0.4 : 0} />
      </mesh>
      <ModuleLabel text={conflict.label} position={[0, 2.9, 0]} scale={0.85} />
      {selected ? (
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.3, 2.6, 32]} />
          <meshBasicMaterial color="#e85d3d" transparent opacity={0.85} />
        </mesh>
      ) : null}
    </group>
  );
}

export function Conflicts() {
  const conflicts = useWorldStore((s) => s.conflicts);
  return (
    <>
      {conflicts.map((c) => (
        <ConflictMarker key={c.id} conflict={c} />
      ))}
    </>
  );
}
