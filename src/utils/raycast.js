import * as THREE from 'three';

const raycaster = new THREE.Raycaster();
const fieldPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const target = new THREE.Vector3();

export function screenToField(screenX, screenY, camera, canvasWidth, canvasHeight) {
  const ndc = new THREE.Vector2(
    (screenX / canvasWidth) * 2 - 1,
    -(screenY / canvasHeight) * 2 + 1
  );
  raycaster.setFromCamera(ndc, camera);
  const hit = raycaster.ray.intersectPlane(fieldPlane, target);
  if (!hit) return null;
  return { x: target.x, z: target.z };
}
