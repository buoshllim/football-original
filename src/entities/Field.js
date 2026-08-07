import * as THREE from 'three';

export const FIELD = {
  width: 60,
  depth: 40,
  goalWidth: 7,
  goalHeight: 2.5,
};

export class Field {
  constructor(scene) {
    this._buildGrass(scene);
    this._buildLines(scene);
    this._buildGoals(scene);
  }

  _buildGrass(scene) {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(FIELD.width, FIELD.depth),
      new THREE.MeshLambertMaterial({ color: 0x2d6a2d })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.receiveShadow = true;
    scene.add(mesh);
  }

  _buildLines(scene) {
    const mat = new THREE.LineBasicMaterial({ color: 0xffffff });
    const add = pts => scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat));
    const W = FIELD.width, D = FIELD.depth;

    // Perimeter + center line
    add(this._rect(-W/2, -D/2, W, D));
    add([new THREE.Vector3(-W/2, 0.01, 0), new THREE.Vector3(W/2, 0.01, 0)]);
    // Center circle
    add(this._circle(0, 0, 7, 32));
    // Penalty areas
    add(this._rect(-18/2, -D/2, 18, 10));
    add(this._rect(-18/2, D/2 - 10, 18, 10));
    // Goal areas
    add(this._rect(-FIELD.goalWidth/2, -D/2, FIELD.goalWidth, 4));
    add(this._rect(-FIELD.goalWidth/2, D/2 - 4, FIELD.goalWidth, 4));
  }

  _buildGoals(scene) {
    const mat = new THREE.MeshLambertMaterial({ color: 0xdddddd });
    const post = () => new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, FIELD.goalHeight), mat);
    const cross = () => new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, FIELD.goalWidth), mat);

    [-1, 1].forEach(side => {
      const z = side * FIELD.depth / 2;
      const h = FIELD.goalHeight / 2;
      const lp = post(); lp.position.set(-FIELD.goalWidth/2, h, z); scene.add(lp);
      const rp = post(); rp.position.set( FIELD.goalWidth/2, h, z); scene.add(rp);
      const cb = cross(); cb.position.set(0, FIELD.goalHeight, z); cb.rotation.z = Math.PI/2; scene.add(cb);
    });
  }

  _rect(x, z, w, d) {
    return [
      new THREE.Vector3(x,   0.01, z),
      new THREE.Vector3(x+w, 0.01, z),
      new THREE.Vector3(x+w, 0.01, z+d),
      new THREE.Vector3(x,   0.01, z+d),
      new THREE.Vector3(x,   0.01, z),
    ];
  }

  _circle(cx, cz, r, seg) {
    return Array.from({ length: seg + 1 }, (_, i) => {
      const a = (i / seg) * Math.PI * 2;
      return new THREE.Vector3(cx + Math.cos(a) * r, 0.01, cz + Math.sin(a) * r);
    });
  }
}
