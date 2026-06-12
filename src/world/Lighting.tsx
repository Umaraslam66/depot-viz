export function Lighting() {
  return (
    <>
      <hemisphereLight args={["#dcefff", "#b8c9a8", 0.9]} />
      <directionalLight
        position={[26, 38, 18]}
        intensity={2.0}
        color="#fff4e0"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-45}
        shadow-camera-right={45}
        shadow-camera-top={45}
        shadow-camera-bottom={-45}
      />
    </>
  );
}
