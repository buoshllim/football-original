import * as THREE from 'three';

const raycaster = new THREE.Raycaster();
const fieldPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const target = new THREE.Vector3();

export function screenToField(screenX, screenY, camera, canvasW, canvasH) {
  const ndc = new THREE.Vector2(
    (screenX / canvasW) * 2 - 1,
    -(screenY / canvasH) * 2 + 1
  );
  raycaster.setFromCamera(ndc, camera);
  const hit = raycaster.ray.intersectPlane(fieldPlane, target);
  return hit ? { x: target.x, z: target.z } : null;
}
