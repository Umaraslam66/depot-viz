export function createCameraPresets(THREE) {
  return {
    overview: {
      position: new THREE.Vector3(36, 38, 42),
      target: new THREE.Vector3(0, 0, 0),
    },
    station: {
      position: new THREE.Vector3(7, 17, 24),
      target: new THREE.Vector3(15, 1, -4),
    },
    junction: {
      position: new THREE.Vector3(-14, 18, 18),
      target: new THREE.Vector3(-2, 1, -4),
    },
    blocks: {
      position: new THREE.Vector3(2, 30, 18),
      target: new THREE.Vector3(2, 0, 1),
    },
  };
}
