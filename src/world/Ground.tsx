import { RoundedBox } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import { useUiStore } from "../state/uiStore";
import { useWorldStore } from "../state/worldStore";

export function Ground() {
  const activeTool = useUiStore((s) => s.tool);

  function handleClick(event: ThreeEvent<MouseEvent>) {
    const { tool, snapEnabled, placementRotation, setSelection, setTool } = useUiStore.getState();
    const world = useWorldStore.getState();
    const point = { x: event.point.x, y: 0, z: event.point.z };
    if (tool === "select") {
      setSelection(null);
      return;
    }
    event.stopPropagation();
    if (tool === "train") {
      const id = world.addTrain(point);
      setSelection({ type: "train", id });
    } else if (tool === "conflict") {
      const id = world.addConflict(point);
      setSelection({ type: "conflict", id });
    } else {
      const id = world.placeModule(tool, point, snapEnabled, placementRotation);
      if (id) setSelection({ type: "module", id });
    }
    setTool("select");
  }

  return (
    <group>
      <RoundedBox
        args={[84, 1.6, 64]}
        radius={0.8}
        position={[0, -0.81, 2]}
        receiveShadow
        onClick={handleClick}
      >
        <meshStandardMaterial color={activeTool === "select" ? "#9cc98e" : "#a8d29a"} />
      </RoundedBox>
    </group>
  );
}
