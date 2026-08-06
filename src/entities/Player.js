import * as THREE from 'three';

const PLAYER_SPEED = 8;
const PLAYER_HEIGHT = 1.8;
const PLAYER_RADIUS = 0.4;

export class Player {
  constructor(scene, { x, z, color, id, team }) {
    this.id = id;
    this.team = team;
    this.position = { x, z };
    this.target = { x, z };
    this.hasBall = false;
    this.isGK = false;

    const geo = new THREE.CylinderGeometry(PLAYER_RADIUS, PLAYER_RADIUS, PLAYER_HEIGHT, 16);
    const mat = new THREE.MeshLambertMaterial({ color });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.castShadow = true;
    this.mesh.position.set(x, PLAYER_HEIGHT / 2, z);
    scene.add(this.mesh);

    const ringGeo = new THREE.RingGeometry(PLAYER_RADIUS + 0.1, PLAYER_RADIUS + 0.35, 16);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffff00, side: THREE.DoubleSide });
    this.ring = new THREE.Mesh(ringGeo, ringMat);
    this.ring.rotation.x = -Math.PI / 2;
    this.ring.position.y = -PLAYER_HEIGHT / 2 + 0.05;
    this.ring.visible = false;
    this.mesh.add(this.ring);
  }

  moveTo(x, z) {
    this.target = { x, z };
  }

  showBallIndicator(visible) {
    this.ring.visible = visible;
    if (visible) this.ring.material.color.setHex(0xffff00);
  }

  update(dt, frozen) {
    if (frozen) return;

    const dx = this.target.x - this.position.x;
    const dz = this.target.z - this.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist > 0.1) {
      const speed = Math.min(PLAYER_SPEED * dt, dist);
      this.position.x += (dx / dist) * speed;
      this.position.z += (dz / dist) * speed;
    }

    this.mesh.position.x = this.position.x;
    this.mesh.position.z = this.position.z;

    if (dist > 0.5) {
      this.mesh.rotation.y = Math.atan2(dx, dz);
    }
  }
}
