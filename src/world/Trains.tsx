import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { CatmullRomCurve3, Group, Vector3 } from "three";
import { findRoutes, resolveTrainRoute, routeWaypoints } from "../sim/routes";
import type { Train } from "../sim/types";
import { useUiStore } from "../state/uiStore";
import { useWorldStore } from "../state/worldStore";
import { simClock } from "./simClock";
import { ModuleLabel } from "./trackMeshes";

function TrainMesh({ train, curve }: { train: Train; curve: CatmullRomCurve3 | null }) {
  const group = useRef<Group>(null);
  const selected = useUiStore((s) => s.selection?.type === "train" && s.selection.id === train.id);
  const length = useMemo(() => curve?.getLength() ?? 0, [curve]);

  useFrame(() => {
    if (!group.current || !curve || length === 0) return;
    const distance = train.startOffset * length + (train.enabled ? simClock.time * train.speed : 0);
    const u = (((distance % length) + length) % length) / length;
    const position = curve.getPointAt(u);
    const tangent = curve.getTangentAt(u);
    group.current.position.copy(position);
    group.current.lookAt(position.clone().add(new Vector3(tangent.x, 0, tangent.z)));
  });

  return (
    <group
      ref={group}
      onClick={(event) => {
        if (useUiStore.getState().tool !== "select") return;
        event.stopPropagation();
        useUiStore.getState().setSelection({ type: "train", id: train.id });
      }}
    >
      <RoundedBox args={[1.5, 1.1, 3.6]} radius={0.42} position={[0, 0.55, 0]} castShadow>
        <meshStandardMaterial color={train.enabled ? train.color : "#9aa3ab"} roughness={0.35} />
      </RoundedBox>
      <RoundedBox args={[1.2, 0.5, 1.6]} radius={0.2} position={[0, 1.25, -0.4]} castShadow>
        <meshStandardMaterial color="#28323b" roughness={0.2} />
      </RoundedBox>
      <ModuleLabel text={train.name} position={[0, 2.4, 0]} scale={0.85} />
      {selected ? (
        <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.4, 2.8, 32]} />
          <meshBasicMaterial color="#e85d3d" transparent opacity={0.85} />
        </mesh>
      ) : null}
    </group>
  );
}

export function Trains() {
  const trains = useWorldStore((s) => s.trains);
  const trackModules = useWorldStore((s) => s.trackModules);
  const connections = useWorldStore((s) => s.connections);

  const { routes, curves } = useMemo(() => {
    const world = { trackModules, connections, trains: [], conflicts: [] };
    const routes = findRoutes(world);
    const curves = new Map<string, CatmullRomCurve3>();
    routes.forEach((route) => {
      const points = routeWaypoints(world, route).map(([x, y, z]) => new Vector3(x, y, z));
      if (points.length >= 2) {
        curves.set(route.id, new CatmullRomCurve3(points, false, "catmullrom", 0.4));
      }
    });
    return { routes, curves };
  }, [trackModules, connections]);

  return (
    <>
      {trains.map((train) => {
        const route = resolveTrainRoute(
          { trackModules, connections, trains: [], conflicts: [] },
          train.routeId,
          routes,
        );
        return <TrainMesh key={train.id} train={train} curve={route ? curves.get(route.id) ?? null : null} />;
      })}
    </>
  );
}
