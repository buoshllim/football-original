import * as THREE from 'three';
import { FIELD } from './Field.js';

const FRICTION = 0.97;
const MIN_SPEED = 0.01;
const BALL_RADIUS = 0.55;

export class Ball {
  constructor(scene) {
    this.velocity = { x: 0, z: 0 };
    this.position = { x: 0, z: 0 };
    this.inPlay = true;

    const geo = new THREE.SphereGeometry(BALL_RADIUS, 16, 16);
    const mat = new THREE.MeshLambertMaterial({ color: 0xf5f5f5 });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.castShadow = true;
    this.mesh.position.y = BALL_RADIUS;
    scene.add(this.mesh);
  }

  kick(dirX, dirZ, power) {
    const maxSpeed = 25;
    this.velocity.x = dirX * power * maxSpeed;
    this.velocity.z = dirZ * power * maxSpeed;
  }

  update(dt) {
    if (!this.inPlay) return;

    this.position.x += this.velocity.x * dt;
    this.position.z += this.velocity.z * dt;

    if (Math.abs(this.position.x) > FIELD.width / 2) {
      this.velocity.x *= -0.6;
      this.position.x = Math.sign(this.position.x) * FIELD.width / 2;
    }

    this.velocity.x *= FRICTION;
    this.velocity.z *= FRICTION;

    const speed = Math.sqrt(this.velocity.x ** 2 + this.velocity.z ** 2);
    if (speed < MIN_SPEED) {
      this.velocity.x = 0;
      this.velocity.z = 0;
    }

    this.mesh.position.x = this.position.x;
    this.mesh.position.z = this.position.z;
  }

  checkGoal() {
    const halfDepth = FIELD.depth / 2;
    const halfGoal = FIELD.goalWidth / 2;

    if (Math.abs(this.position.x) < halfGoal) {
      if (this.position.z < -halfDepth) return 'home';
      if (this.position.z > halfDepth) return 'away';
    }
    return null;
  }

  reset() {
    this.position = { x: 0, z: 0 };
    this.velocity = { x: 0, z: 0 };
    this.mesh.position.set(0, BALL_RADIUS, 0);
  }
}
