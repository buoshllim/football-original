import * as THREE from 'three';
import { FIELD } from './Field.js';

const RADIUS   = 0.55;
const FRICTION = 0.96;
const MIN_SPD  = 0.08;
const MAX_LOB  = 5;    // max height for lob

export class Ball {
  constructor(scene) {
    this.pos      = { x: 0, z: 0 };
    this.vel      = { x: 0, z: 0 };
    this.isLob    = false;
    this._lobDist = 0;   // total distance to travel (for lob arc)
    this._traveled = 0;  // distance traveled so far

    const geo = new THREE.SphereGeometry(RADIUS, 16, 16);
    const mat = new THREE.MeshLambertMaterial({ color: 0xf5f5dc });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.castShadow = true;
    this.mesh.position.set(0, RADIUS, 0);
    scene.add(this.mesh);
  }

  kick(dirX, dirZ, power, isLob = false) {
    const maxSpd = isLob ? 18 : 22;
    this.vel.x = dirX * power * maxSpd;
    this.vel.z = dirZ * power * maxSpd;
    this.isLob  = isLob;
    this._traveled = 0;
    // Estimate total travel distance for lob arc
    this._lobDist = (power * maxSpd) / (1 - FRICTION) * 0.5;
  }

  get speed() {
    return Math.sqrt(this.vel.x ** 2 + this.vel.z ** 2);
  }

  get moving() {
    return this.speed > MIN_SPD;
  }

  update(dt) {
    const spd = this.speed;
    if (spd < MIN_SPD) { this.vel.x = 0; this.vel.z = 0; }

    const dx = this.vel.x * dt;
    const dz = this.vel.z * dt;
    this.pos.x += dx;
    this.pos.z += dz;
    this._traveled += Math.sqrt(dx * dx + dz * dz);

    // Side boundary bounce
    if (Math.abs(this.pos.x) > FIELD.width / 2) {
      this.vel.x *= -0.5;
      this.pos.x = Math.sign(this.pos.x) * FIELD.width / 2;
    }

    this.vel.x *= FRICTION;
    this.vel.z *= FRICTION;

    // Lob arc: y = sin(progress * π) * MAX_LOB
    let y = RADIUS;
    if (this.isLob && this._lobDist > 0) {
      const progress = Math.min(this._traveled / this._lobDist, 1);
      y = RADIUS + Math.sin(progress * Math.PI) * MAX_LOB;
      if (progress >= 1) this.isLob = false;
    }

    this.mesh.position.set(this.pos.x, y, this.pos.z);

    // Spin
    if (spd > MIN_SPD) {
      this.mesh.rotation.x += this.vel.z * dt * 0.5;
      this.mesh.rotation.z -= this.vel.x * dt * 0.5;
    }
  }

  checkGoal() {
    const half = FIELD.depth / 2;
    const hw   = FIELD.goalWidth / 2;
    if (Math.abs(this.pos.x) < hw) {
      if (this.pos.z < -half) return 'home'; // home team scored
      if (this.pos.z >  half) return 'away';
    }
    return null;
  }

  reset() {
    this.pos = { x: 0, z: 0 };
    this.vel = { x: 0, z: 0 };
    this.isLob = false;
    this.mesh.position.set(0, RADIUS, 0);
  }

  snapTo(x, z) {
    this.pos = { x, z };
    this.vel = { x: 0, z: 0 };
    this.mesh.position.set(x, RADIUS, z);
  }
}
