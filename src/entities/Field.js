import * as THREE from 'three';

export const FIELD = {
  width: 60,
  depth: 40,
  goalWidth: 7,
  goalHeight: 2.5,
  goalDepth: 2,
  penaltyWidth: 18,
  penaltyDepth: 10,
};

export class Field {
  constructor(scene) {
    this.scene = scene;
    this._build();
  }

  _build() {
    this._addGrass();
    this._addLines();
    this._addGoals();
  }

  _addGrass() {
    const geo = new THREE.PlaneGeometry(FIELD.width, FIELD.depth);
    const mat = new THREE.MeshLambertMaterial({ color: 0x2d6a2d });
    const plane = new THREE.Mesh(geo, mat);
    plane.rotation.x = -Math.PI / 2;
    plane.receiveShadow = true;
    this.scene.add(plane);
  }

  _addLines() {
    const mat = new THREE.LineBasicMaterial({ color: 0xffffff });

    const lines = [
      this._rect(-FIELD.width / 2, -FIELD.depth / 2, FIELD.width, FIELD.depth),
      this._line(-FIELD.width / 2, 0, FIELD.width / 2, 0),
      this._circle(0, 0, 7, 32),
      this._rect(-FIELD.penaltyWidth / 2, -FIELD.depth / 2, FIELD.penaltyWidth, FIELD.penaltyDepth),
      this._rect(-FIELD.penaltyWidth / 2, FIELD.depth / 2 - FIELD.penaltyDepth, FIELD.penaltyWidth, FIELD.penaltyDepth),
      this._rect(-FIELD.goalWidth / 2, -FIELD.depth / 2, FIELD.goalWidth, 4),
      this._rect(-FIELD.goalWidth / 2, FIELD.depth / 2 - 4, FIELD.goalWidth, 4),
    ];

    lines.forEach(pts => {
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      this.scene.add(new THREE.Line(geo, mat));
    });
  }

  _addGoals() {
    const mat = new THREE.MeshLambertMaterial({ color: 0xdddddd });
    const postGeo = new THREE.CylinderGeometry(0.1, 0.1, FIELD.goalHeight);
    const crossGeo = new THREE.CylinderGeometry(0.1, 0.1, FIELD.goalWidth);

    [-1, 1].forEach(side => {
      const goalZ = side * FIELD.depth / 2;
      const h = FIELD.goalHeight / 2;

      const lp = new THREE.Mesh(postGeo, mat);
      lp.position.set(-FIELD.goalWidth / 2, h, goalZ);
      this.scene.add(lp);

      const rp = new THREE.Mesh(postGeo, mat);
      rp.position.set(FIELD.goalWidth / 2, h, goalZ);
      this.scene.add(rp);

      const cb = new THREE.Mesh(crossGeo, mat);
      cb.position.set(0, FIELD.goalHeight, goalZ);
      cb.rotation.z = Math.PI / 2;
      this.scene.add(cb);
    });
  }

  _rect(x, z, w, d) {
    return [
      new THREE.Vector3(x, 0.01, z),
      new THREE.Vector3(x + w, 0.01, z),
      new THREE.Vector3(x + w, 0.01, z + d),
      new THREE.Vector3(x, 0.01, z + d),
      new THREE.Vector3(x, 0.01, z),
    ];
  }

  _line(x1, z1, x2, z2) {
    return [new THREE.Vector3(x1, 0.01, z1), new THREE.Vector3(x2, 0.01, z2)];
  }

  _circle(cx, cz, r, segments) {
    const pts = [];
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      pts.push(new THREE.Vector3(cx + Math.cos(a) * r, 0.01, cz + Math.sin(a) * r));
    }
    return pts;
  }
}
