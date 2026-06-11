import { useMemo } from "react";
import { RoundedBox } from "@react-three/drei";
import { CanvasTexture, SRGBColorSpace } from "three";

const BALLAST = "#c2b297";
const RAIL = "#6b7280";
const PLATFORM = "#ece4d4";
const SIGNAL_MAST = "#46505a";

// Canvas-texture sprite labels: avoids troika-three-text, whose worker-based SDF
// generation can drop the main WebGL context on some ANGLE/Metal setups.
const labelTextureCache = new Map<string, CanvasTexture>();

function getLabelTexture(text: string): CanvasTexture {
  const cached = labelTextureCache.get(text);
  if (cached) return cached;
  const font = "600 48px system-ui, sans-serif";
  const measure = document.createElement("canvas").getContext("2d")!;
  measure.font = font;
  const width = Math.ceil(measure.measureText(text).width) + 48;
  const height = 80;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.font = font;
  ctx.fillStyle = "rgba(255, 255, 255, 0.88)";
  ctx.beginPath();
  ctx.roundRect(2, 2, width - 4, height - 4, 24);
  ctx.fill();
  ctx.fillStyle = "#28323b";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, width / 2, height / 2 + 2);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  labelTextureCache.set(text, texture);
  return texture;
}

export function ModuleLabel({
  text,
  position,
  scale = 1,
}: {
  text: string;
  position: [number, number, number];
  scale?: number;
}) {
  const texture = useMemo(() => getLabelTexture(text), [text]);
  const image = texture.image as HTMLCanvasElement;
  const labelHeight = 1.3 * scale;
  return (
    <sprite position={position} scale={[(labelHeight * image.width) / image.height, labelHeight, 1]}>
      <spriteMaterial map={texture} transparent depthWrite={false} />
    </sprite>
  );
}

function Ballast({ length, width = 2.4 }: { length: number; width?: number }) {
  return (
    <RoundedBox args={[length, 0.3, width]} radius={0.12} position={[0, 0.15, 0]} castShadow receiveShadow>
      <meshStandardMaterial color={BALLAST} />
    </RoundedBox>
  );
}

function RailPair({ length }: { length: number }) {
  return (
    <>
      {[-0.35, 0.35].map((z) => (
        <mesh key={z} position={[0, 0.39, z]} castShadow>
          <boxGeometry args={[length, 0.12, 0.14]} />
          <meshStandardMaterial color={RAIL} metalness={0.4} roughness={0.5} />
        </mesh>
      ))}
    </>
  );
}

export function StraightModule() {
  return (
    <group>
      <Ballast length={8} />
      <RailPair length={8} />
    </group>
  );
}

// Quarter arc, radius 4, centered at local (4, 4): runs from port A (4, 0) to port B (0, 4).
// Theta sweeps 180°..270° around the center; segment yaw follows the arc tangent.
export function CurveModule() {
  const segments = 7;
  const items: { x: number; z: number; yaw: number }[] = [];
  for (let i = 0; i < segments; i += 1) {
    const theta = Math.PI + ((i + 0.5) / segments) * (Math.PI / 2);
    items.push({
      x: 4 + 4 * Math.cos(theta),
      z: 4 + 4 * Math.sin(theta),
      yaw: -(theta + Math.PI / 2),
    });
  }
  const segmentLength = (4 * (Math.PI / 2)) / segments + 0.12;
  return (
    <group>
      {items.map((seg, i) => (
        <group key={i} position={[seg.x, 0, seg.z]} rotation={[0, seg.yaw, 0]}>
          <Ballast length={segmentLength} />
          <RailPair length={segmentLength} />
        </group>
      ))}
    </group>
  );
}

export function TurnoutModule() {
  return (
    <group>
      <Ballast length={8} width={3.2} />
      <RailPair length={8} />
      {/* Diverging leg toward port C at local (3.0, -1.35), direction (0.96, -0.28) */}
      <group position={[1.6, 0, -0.65]} rotation={[0, 0.284, 0]}>
        <RailPair length={3.4} />
      </group>
    </group>
  );
}

export function StationModule({ name }: { name?: string }) {
  return (
    <group>
      <Ballast length={8.8} />
      <RailPair length={8.8} />
      <RoundedBox args={[8.8, 0.5, 1.6]} radius={0.18} position={[0, 0.25, -1.7]} castShadow receiveShadow>
        <meshStandardMaterial color={PLATFORM} />
      </RoundedBox>
      <RoundedBox args={[3.6, 1.4, 1.2]} radius={0.25} position={[0, 1.2, -2.1]} castShadow>
        <meshStandardMaterial color="#f4f0e6" />
      </RoundedBox>
      <RoundedBox args={[4.2, 0.18, 1.6]} radius={0.09} position={[0, 2.0, -2.1]} castShadow>
        <meshStandardMaterial color="#c66b3d" />
      </RoundedBox>
      {name ? <ModuleLabel text={name} position={[0, 2.7, -2.1]} /> : null}
    </group>
  );
}

export function SignalModule() {
  return (
    <group>
      <mesh position={[0, 1.1, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.14, 2.2, 10]} />
        <meshStandardMaterial color={SIGNAL_MAST} />
      </mesh>
      <RoundedBox args={[0.5, 0.9, 0.3]} radius={0.1} position={[0, 2.4, 0]} castShadow>
        <meshStandardMaterial color={SIGNAL_MAST} />
      </RoundedBox>
      <mesh position={[0, 2.6, 0.18]}>
        <sphereGeometry args={[0.13, 12, 12]} />
        <meshStandardMaterial color="#4f9d69" emissive="#4f9d69" emissiveIntensity={1.6} />
      </mesh>
      <mesh position={[0, 2.2, 0.18]}>
        <sphereGeometry args={[0.13, 12, 12]} />
        <meshStandardMaterial color="#7a2e22" emissive="#dc2626" emissiveIntensity={0.15} />
      </mesh>
    </group>
  );
}
