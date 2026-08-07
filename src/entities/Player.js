import * as THREE from 'three';
import { lerp, dist2D } from '../utils/math.js';

const HEIGHT = 1.8;
const RADIUS = 0.4;
const SPEED  = 7; // units/sec

export class Player {
  constructor(scene, { x, z, color, id, team }) {
    this.id   = id;
    this.team = team;
    this.pos  = { x, z };
    this.homePos = { x, z }; // formation position
    this.target  = { x, z };
    this.hasBall = false;

    const geo = new THREE.CylinderGeometry(RADIUS, RADIUS, HEIGHT, 12);
    const mat = new THREE.MeshLambertMaterial({ color });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.castShadow = true;
    this.mesh.position.set(x, HEIGHT / 2, z);
    scene.add(this.mesh);

    // Ball indicator dot above head
    const dotGeo = new THREE.SphereGeometry(0.2, 8, 8);
    const dotMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
    this.dot = new THREE.Mesh(dotGeo, dotMat);
    this.dot.position.y = HEIGHT / 2 + 0.35;
    this.dot.visible = false;
    this.mesh.add(this.dot);
  }

  setHasBall(has) {
    this.hasBall = has;
    this.dot.visible = has;
  }

  moveTo(x, z) { this.target = { x, z }; }

  driftHome() { this.target = { ...this.homePos }; }

  update(dt) {
    const dx = this.target.x - this.pos.x;
    const dz = this.target.z - this.pos.z;
    const d  = Math.sqrt(dx * dx + dz * dz);
    if (d > 0.05) {
      const step = Math.min(SPEED * dt, d);
      this.pos.x += (dx / d) * step;
      this.pos.z += (dz / d) * step;
      this.mesh.rotation.y = Math.atan2(dx, dz);
    }
    this.mesh.position.x = this.pos.x;
    this.mesh.position.z = this.pos.z;
  }
}
