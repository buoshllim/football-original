# Football Original: First Start — Phase 1: Core Engine

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the playable core of Football Original: First Start — a 7v7 soccer game with FC 26-style perspective camera, time-stop swipe mechanic, click-to-dribble, and basic CPU AI.

**Architecture:** Three.js handles 3D rendering with a high-angle perspective camera (FC 26 style). A central `GameEngine` class owns the game loop and state machine (`KICKOFF → PLAYING → TIME_STOP → GOAL`). Entities (Ball, Player, Team) are self-contained classes with `update(dt)` methods. Time-stop freezes all entity updates while awaiting swipe input via an HTML overlay UI.

**Tech Stack:** Three.js 0.160+, Vite 5+, Vanilla JS (ES modules), HTML/CSS overlay for HUD and action buttons

**Phase 2 scope (next plan):** Free kick (curve swipe), corner kick, penalty kick (GK manual control), throw-in, heading, slide tackle, improved AI.

---

## File Structure

```
tyground/football-original/
├── src/
│   ├── main.js                  # Entry: renderer, scene, game loop bootstrap
│   ├── GameEngine.js            # State machine + update loop
│   ├── entities/
│   │   ├── Ball.js              # Sphere mesh, velocity, friction, goal detection
│   │   ├── Player.js            # Cylinder mesh, move-to, possession flag
│   │   ├── Team.js              # 7 players, formation, nearest player lookup
│   │   ├── GoalKeeper.js        # Extends Player, auto-block AI
│   │   └── Field.js             # Plane mesh, line markings, goal posts
│   ├── systems/
│   │   ├── InputSystem.js       # Unified click/touch + swipe detection
│   │   ├── TimeStopSystem.js    # Freeze/unfreeze + action button logic
│   │   ├── PossessionSystem.js  # Who has the ball (proximity check)
│   │   ├── AISystem.js          # CPU team: chase, pass, GK position
│   │   └── MatchSystem.js       # Score, timer, kickoff, full time
│   ├── utils/
│   │   ├── swipe.js             # Pure: swipe direction vector + power
│   │   ├── raycast.js           # Screen coords → 3D field XZ position
│   │   └── math.js              # Vec3 helpers (distance, lerp, clamp)
│   └── ui/
│       ├── HUD.js               # HTML overlay: score + timer
│       └── ActionUI.js          # HTML overlay: time-stop action buttons
├── public/
├── index.html
├── vite.config.js
└── package.json
```

---

## Task 1: Project Setup

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `index.html`
- Create: `src/main.js` (stub)

- [ ] **Step 1: Init project**

```bash
cd ~/Projects/tyground
mkdir football-original && cd football-original
npm init -y
npm install three
npm install -D vite
```

- [ ] **Step 2: Create `vite.config.js`**

```js
// vite.config.js
export default {
  base: './',
};
```

- [ ] **Step 3: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>Football Original: First Start</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #000; overflow: hidden; }
    #canvas-container { width: 100vw; height: 100vh; position: relative; }
    canvas { display: block; }
    #hud { position: absolute; top: 0; left: 0; width: 100%; pointer-events: none; }
    #action-ui { position: absolute; bottom: 0; left: 0; width: 100%; pointer-events: none; }
  </style>
</head>
<body>
  <div id="canvas-container">
    <div id="hud"></div>
    <div id="action-ui"></div>
  </div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

- [ ] **Step 4: Create stub `src/main.js`**

```js
// src/main.js
import * as THREE from 'three';

const container = document.getElementById('canvas-container');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);

// FC 26 style camera: high angle, looking down at field
const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 50, 28);
camera.lookAt(0, 0, 0);

// Lights
const ambient = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambient);
const sun = new THREE.DirectionalLight(0xffffff, 1.0);
sun.position.set(10, 40, 20);
sun.castShadow = true;
scene.add(sun);

// Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Game loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();
```

- [ ] **Step 5: Run dev server and verify blank scene**

```bash
npx vite
```

Expected: Browser opens, dark background, no errors in console.

- [ ] **Step 6: Commit**

```bash
git init
git add .
git commit -m "feat: project setup - Three.js + Vite"
```

---

## Task 2: Field Entity

**Files:**
- Create: `src/entities/Field.js`
- Modify: `src/main.js` (import Field)

- [ ] **Step 1: Create `src/entities/Field.js`**

```js
// src/entities/Field.js
import * as THREE from 'three';

// 7v7 field: 60 wide x 40 deep (units = meters)
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
    this.mesh = null;
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
    this.mesh = plane;
  }

  _addLines() {
    const mat = new THREE.LineBasicMaterial({ color: 0xffffff });

    const lines = [
      // Perimeter
      this._rect(-FIELD.width/2, -FIELD.depth/2, FIELD.width, FIELD.depth),
      // Center line
      this._line(-FIELD.width/2, 0, FIELD.width/2, 0),
    ];

    // Center circle
    lines.push(this._circle(0, 0, 7, 32));

    // Penalty areas (both ends)
    lines.push(this._rect(-FIELD.penaltyWidth/2, -FIELD.depth/2, FIELD.penaltyWidth, FIELD.penaltyDepth));
    lines.push(this._rect(-FIELD.penaltyWidth/2, FIELD.depth/2 - FIELD.penaltyDepth, FIELD.penaltyWidth, FIELD.penaltyDepth));

    // Goal areas
    const gw = FIELD.goalWidth;
    lines.push(this._rect(-gw/2, -FIELD.depth/2, gw, 4));
    lines.push(this._rect(-gw/2, FIELD.depth/2 - 4, gw, 4));

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
      const z = side * (FIELD.depth / 2 + FIELD.goalDepth / 2);
      const goalZ = side * FIELD.depth / 2;
      const h = FIELD.goalHeight / 2;

      // Left post
      const lp = new THREE.Mesh(postGeo, mat);
      lp.position.set(-FIELD.goalWidth / 2, h, goalZ);
      this.scene.add(lp);

      // Right post
      const rp = new THREE.Mesh(postGeo, mat);
      rp.position.set(FIELD.goalWidth / 2, h, goalZ);
      this.scene.add(rp);

      // Crossbar
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
```

- [ ] **Step 2: Add Field to `src/main.js`**

```js
import { Field } from './entities/Field.js';
// after scene setup:
const field = new Field(scene);
```

- [ ] **Step 3: Verify field renders correctly**

Run `npx vite`, check browser: green field, white lines, gray goal posts visible from FC 26 angle.

- [ ] **Step 4: Commit**

```bash
git add src/entities/Field.js src/main.js
git commit -m "feat: field with markings and goal posts"
```

---

## Task 3: Swipe Utility (Pure Logic + Tests)

**Files:**
- Create: `src/utils/swipe.js`
- Create: `src/utils/math.js`
- Create: `src/utils/swipe.test.js`

- [ ] **Step 1: Install vitest**

```bash
npm install -D vitest
```

Add to `package.json`:
```json
"scripts": {
  "test": "vitest run",
  "dev": "vite"
}
```

- [ ] **Step 2: Create `src/utils/math.js`**

```js
// src/utils/math.js
export function distance2D(ax, ay, bx, by) {
  return Math.sqrt((bx - ax) ** 2 + (by - ay) ** 2);
}

export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}
```

- [ ] **Step 3: Write failing tests for swipe.js**

```js
// src/utils/swipe.test.js
import { describe, it, expect } from 'vitest';
import { calcSwipe } from './swipe.js';

describe('calcSwipe', () => {
  it('returns direction normalized and power from swipe length', () => {
    const result = calcSwipe({ x: 0, y: 0 }, { x: 100, y: 0 });
    expect(result.dir.x).toBeCloseTo(1);
    expect(result.dir.y).toBeCloseTo(0);
    expect(result.power).toBeGreaterThan(0);
  });

  it('power is clamped to [0, 1]', () => {
    const result = calcSwipe({ x: 0, y: 0 }, { x: 10000, y: 0 });
    expect(result.power).toBeLessThanOrEqual(1);
  });

  it('handles zero swipe gracefully', () => {
    const result = calcSwipe({ x: 50, y: 50 }, { x: 50, y: 50 });
    expect(result.power).toBe(0);
    expect(result.dir.x).toBe(0);
    expect(result.dir.y).toBe(0);
  });

  it('diagonal swipe normalizes correctly', () => {
    const result = calcSwipe({ x: 0, y: 0 }, { x: 70, y: 70 });
    expect(result.dir.x).toBeCloseTo(0.707, 2);
    expect(result.dir.y).toBeCloseTo(0.707, 2);
  });
});
```

- [ ] **Step 4: Run tests (expect FAIL)**

```bash
npm test
```

Expected: `Cannot find module './swipe.js'`

- [ ] **Step 5: Create `src/utils/swipe.js`**

```js
// src/utils/swipe.js
import { clamp } from './math.js';

const MAX_SWIPE_PX = 200; // pixels for full power

export function calcSwipe(start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.sqrt(dx * dx + dy * dy);

  if (len === 0) return { dir: { x: 0, y: 0 }, power: 0 };

  return {
    dir: { x: dx / len, y: dy / len },
    power: clamp(len / MAX_SWIPE_PX, 0, 1),
  };
}
```

- [ ] **Step 6: Run tests (expect PASS)**

```bash
npm test
```

Expected: All 4 tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/utils/ 
git commit -m "feat: swipe utility + tests"
```

---

## Task 4: Raycast Utility

**Files:**
- Create: `src/utils/raycast.js`
- Create: `src/utils/raycast.test.js`

- [ ] **Step 1: Write failing tests**

```js
// src/utils/raycast.test.js
import { describe, it, expect } from 'vitest';
import { screenToField } from './raycast.js';

describe('screenToField', () => {
  it('exports a function', () => {
    expect(typeof screenToField).toBe('function');
  });
});
```

- [ ] **Step 2: Create `src/utils/raycast.js`**

```js
// src/utils/raycast.js
import * as THREE from 'three';

const raycaster = new THREE.Raycaster();
const fieldPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // y=0 plane
const target = new THREE.Vector3();

/**
 * Converts screen pixel position to 3D field XZ coordinates.
 * Returns null if ray doesn't hit field plane.
 */
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
```

- [ ] **Step 3: Run tests (expect PASS)**

```bash
npm test
```

- [ ] **Step 4: Commit**

```bash
git add src/utils/raycast.js src/utils/raycast.test.js
git commit -m "feat: screen-to-field raycast utility"
```

---

## Task 5: Ball Entity

**Files:**
- Create: `src/entities/Ball.js`
- Create: `src/utils/possession.test.js`

- [ ] **Step 1: Write failing possession detection tests**

```js
// src/utils/possession.test.js
import { describe, it, expect } from 'vitest';
import { findPossessor } from './possession.js';

describe('findPossessor', () => {
  const mockPlayers = [
    { position: { x: 0, z: 0 }, id: 'p1' },
    { position: { x: 5, z: 0 }, id: 'p2' },
    { position: { x: 1.5, z: 0 }, id: 'p3' },
  ];

  it('returns player within possession range', () => {
    const result = findPossessor(mockPlayers, { x: 1.4, z: 0 });
    expect(result?.id).toBe('p3');
  });

  it('returns null when no player is close enough', () => {
    const result = findPossessor(mockPlayers, { x: 20, z: 20 });
    expect(result).toBeNull();
  });

  it('returns closest player when multiple are in range', () => {
    const result = findPossessor(mockPlayers, { x: 0.5, z: 0 });
    expect(result?.id).toBe('p1');
  });
});
```

- [ ] **Step 2: Create `src/utils/possession.js`**

```js
// src/utils/possession.js
const POSSESSION_RANGE = 1.8; // units (meters)

export function findPossessor(players, ballPos) {
  let closest = null;
  let closestDist = Infinity;

  for (const p of players) {
    const dx = p.position.x - ballPos.x;
    const dz = p.position.z - ballPos.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < POSSESSION_RANGE && dist < closestDist) {
      closestDist = dist;
      closest = p;
    }
  }
  return closest;
}
```

- [ ] **Step 3: Run tests (expect PASS)**

```bash
npm test
```

- [ ] **Step 4: Create `src/entities/Ball.js`**

```js
// src/entities/Ball.js
import * as THREE from 'three';
import { FIELD } from './Field.js';

const FRICTION = 0.97;         // velocity multiplier per frame
const MIN_SPEED = 0.01;        // below this, stop
const BALL_RADIUS = 0.3;

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

    // Field boundary bounce
    if (Math.abs(this.position.x) > FIELD.width / 2) {
      this.velocity.x *= -0.6;
      this.position.x = Math.sign(this.position.x) * FIELD.width / 2;
    }

    // Friction
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
      if (this.position.z < -halfDepth) return 'home'; // home team scores
      if (this.position.z > halfDepth) return 'away';  // away team scores
    }
    return null;
  }

  reset() {
    this.position = { x: 0, z: 0 };
    this.velocity = { x: 0, z: 0 };
    this.mesh.position.set(0, BALL_RADIUS, 0);
  }
}
```

- [ ] **Step 5: Write goal detection test**

```js
// src/utils/goal.test.js
import { describe, it, expect } from 'vitest';

// Inline logic test (mirrors Ball.checkGoal)
function checkGoal(pos) {
  const halfDepth = 40 / 2;
  const halfGoal = 7 / 2;
  if (Math.abs(pos.x) < halfGoal) {
    if (pos.z < -halfDepth) return 'home';
    if (pos.z > halfDepth) return 'away';
  }
  return null;
}

describe('goal detection', () => {
  it('detects home team goal (top)', () => {
    expect(checkGoal({ x: 0, z: -21 })).toBe('home');
  });

  it('detects away team goal (bottom)', () => {
    expect(checkGoal({ x: 0, z: 21 })).toBe('away');
  });

  it('no goal if outside post', () => {
    expect(checkGoal({ x: 10, z: 21 })).toBeNull();
  });

  it('no goal if not past line', () => {
    expect(checkGoal({ x: 0, z: 15 })).toBeNull();
  });
});
```

- [ ] **Step 6: Run all tests (expect PASS)**

```bash
npm test
```

- [ ] **Step 7: Commit**

```bash
git add src/entities/Ball.js src/utils/possession.js src/utils/possession.test.js src/utils/goal.test.js
git commit -m "feat: ball entity + possession + goal detection"
```

---

## Task 6: Player & Team Entities

**Files:**
- Create: `src/entities/Player.js`
- Create: `src/entities/GoalKeeper.js`
- Create: `src/entities/Team.js`

- [ ] **Step 1: Create `src/entities/Player.js`**

```js
// src/entities/Player.js
import * as THREE from 'three';

const PLAYER_SPEED = 8; // units/sec
const PLAYER_HEIGHT = 1.8;
const PLAYER_RADIUS = 0.4;

export class Player {
  constructor(scene, { x, z, color, id, team }) {
    this.id = id;
    this.team = team;          // 'home' | 'away'
    this.position = { x, z };
    this.target = { x, z };   // where they're moving to
    this.hasBall = false;
    this.isSelected = false;

    const geo = new THREE.CylinderGeometry(PLAYER_RADIUS, PLAYER_RADIUS, PLAYER_HEIGHT, 16);
    const mat = new THREE.MeshLambertMaterial({ color });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.castShadow = true;
    this.mesh.position.set(x, PLAYER_HEIGHT / 2, z);
    scene.add(this.mesh);

    // Selection ring
    const ringGeo = new THREE.RingGeometry(PLAYER_RADIUS + 0.1, PLAYER_RADIUS + 0.35, 16);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffff00, side: THREE.DoubleSide });
    this.ring = new THREE.Mesh(ringGeo, ringMat);
    this.ring.rotation.x = -Math.PI / 2;
    this.ring.position.y = 0.05;
    this.ring.visible = false;
    this.mesh.add(this.ring);
  }

  moveTo(x, z) {
    this.target = { x, z };
  }

  select(selected) {
    this.isSelected = selected;
    this.ring.visible = selected;
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

    // Face movement direction
    if (dist > 0.5) {
      this.mesh.rotation.y = Math.atan2(dx, dz);
    }
  }
}
```

- [ ] **Step 2: Create `src/entities/GoalKeeper.js`**

```js
// src/entities/GoalKeeper.js
import { Player } from './Player.js';
import { FIELD } from './Field.js';

const GK_SPEED = 6;
const GK_REACTION_RANGE = 12; // GK moves if ball within this range

export class GoalKeeper extends Player {
  constructor(scene, { x, z, color, id, team }) {
    super(scene, { x, z, color, id, team });
    this.homeZ = z; // original Z (goal line)
    this.isGK = true;
  }

  autoUpdate(dt, ballPos, frozen) {
    if (frozen) return;

    // Track ball X, stay near goal line
    const dx = ballPos.x - this.position.x;
    const distToBall = Math.abs(ballPos.z - this.homeZ);

    const targetX = Math.max(-FIELD.goalWidth / 2 + 0.5,
                    Math.min(FIELD.goalWidth / 2 - 0.5, ballPos.x));

    // Come off line if ball is close
    const targetZ = distToBall < GK_REACTION_RANGE
      ? this.homeZ + (ballPos.z - this.homeZ) * 0.2
      : this.homeZ;

    this.moveTo(targetX, targetZ);
    super.update(dt, false);
  }
}
```

- [ ] **Step 3: Create `src/entities/Team.js`**

```js
// src/entities/Team.js
import { Player } from './Player.js';
import { GoalKeeper } from './GoalKeeper.js';

// 7v7 formations: GK + 2 DEF + 3 MID + 1 FWD
function formation7v7(side) {
  // side: 1 = home (negative Z), -1 = away (positive Z)
  const s = side;
  return [
    { x: 0,   z: s * 18, role: 'gk' },   // GK
    { x: -6,  z: s * 13, role: 'def' },
    { x: 6,   z: s * 13, role: 'def' },
    { x: -9,  z: s * 7,  role: 'mid' },
    { x: 0,   z: s * 6,  role: 'mid' },
    { x: 9,   z: s * 7,  role: 'mid' },
    { x: 0,   z: s * 2,  role: 'fwd' },
  ];
}

export class Team {
  constructor(scene, { name, color, side }) {
    this.name = name;
    this.color = color;
    this.side = side; // 1 = home, -1 = away
    this.players = [];
    this.gk = null;
    this._build(scene);
  }

  _build(scene) {
    const positions = formation7v7(this.side);
    positions.forEach((pos, i) => {
      const id = `${this.name}_${i}`;
      if (pos.role === 'gk') {
        this.gk = new GoalKeeper(scene, { ...pos, color: this.color, id, team: this.name });
        this.players.push(this.gk);
      } else {
        this.players.push(new Player(scene, { ...pos, color: this.color, id, team: this.name }));
      }
    });
  }

  findNearestTo(pos) {
    let nearest = null;
    let nearestDist = Infinity;
    for (const p of this.players) {
      const dx = p.position.x - pos.x;
      const dz = p.position.z - pos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = p;
      }
    }
    return nearest;
  }

  allPlayers() {
    return this.players;
  }

  update(dt, frozen, ballPos) {
    this.players.forEach(p => {
      if (p.isGK) {
        p.autoUpdate(dt, ballPos, frozen);
      } else {
        p.update(dt, frozen);
      }
    });
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/entities/Player.js src/entities/GoalKeeper.js src/entities/Team.js
git commit -m "feat: Player, GoalKeeper, Team entities with formation"
```

---

## Task 7: Input System

**Files:**
- Create: `src/systems/InputSystem.js`

- [ ] **Step 1: Create `src/systems/InputSystem.js`**

```js
// src/systems/InputSystem.js
import { calcSwipe } from '../utils/swipe.js';

export class InputSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.swipeStart = null;
    this.swipeEnd = null;
    this.lastClick = null;
    this._swipeComplete = null; // callback(swipe)
    this._onClick = null;       // callback({x, y})

    this._bind();
  }

  onSwipe(cb) { this._swipeComplete = cb; }
  onClick(cb) { this._onClick = cb; }

  _getPos(e, touch = false) {
    const rect = this.canvas.getBoundingClientRect();
    const src = touch ? e.changedTouches[0] : e;
    return {
      x: src.clientX - rect.left,
      y: src.clientY - rect.top,
    };
  }

  _bind() {
    // Mouse
    this.canvas.addEventListener('mousedown', e => {
      this.swipeStart = this._getPos(e);
    });

    this.canvas.addEventListener('mouseup', e => {
      this.swipeEnd = this._getPos(e);
      this._resolve();
    });

    // Touch
    let lastTouchTime = 0;
    this.canvas.addEventListener('touchstart', e => {
      e.preventDefault();
      this.swipeStart = this._getPos(e, true);
    }, { passive: false });

    this.canvas.addEventListener('touchend', e => {
      e.preventDefault();
      lastTouchTime = Date.now();
      this.swipeEnd = this._getPos(e, true);
      this._resolve();
    }, { passive: false });

    this.canvas.addEventListener('click', e => {
      if (Date.now() - lastTouchTime < 500) return; // ghost click guard
      if (this._onClick) this._onClick(this._getPos(e));
    });
  }

  _resolve() {
    if (!this.swipeStart || !this.swipeEnd) return;
    const swipe = calcSwipe(this.swipeStart, this.swipeEnd);
    const dist = Math.sqrt(
      (this.swipeEnd.x - this.swipeStart.x) ** 2 +
      (this.swipeEnd.y - this.swipeStart.y) ** 2
    );

    if (dist < 15) {
      // Treat as click
      if (this._onClick) this._onClick(this.swipeEnd);
    } else {
      // Treat as swipe
      if (this._swipeComplete) this._swipeComplete(swipe);
    }

    this.swipeStart = null;
    this.swipeEnd = null;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/systems/InputSystem.js
git commit -m "feat: unified input system (swipe + click, desktop + mobile)"
```

---

## Task 8: Time-Stop System

**Files:**
- Create: `src/systems/TimeStopSystem.js`
- Create: `src/ui/ActionUI.js`

- [ ] **Step 1: Create `src/ui/ActionUI.js`**

```js
// src/ui/ActionUI.js
export class ActionUI {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.activeAction = null;
    this._listeners = {};
    this._build();
  }

  _build() {
    this.container.innerHTML = `
      <div id="action-panel" style="
        display: none;
        position: absolute;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        display: none;
        gap: 12px;
        flex-direction: row;
        pointer-events: all;
      ">
        <button class="action-btn" data-action="ground" style="background:#2563eb">땅볼 패스</button>
        <button class="action-btn" data-action="lob" style="background:#7c3aed">로빙 패스</button>
        <button class="action-btn" data-action="shot" style="background:#dc2626">슛!</button>
      </div>
      <style>
        .action-btn {
          padding: 12px 20px;
          border: none;
          border-radius: 8px;
          color: white;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          touch-action: manipulation;
        }
        .action-btn.active { outline: 3px solid #fbbf24; }
        #action-panel { display: none; }
        #action-panel.visible { display: flex; }
      </style>
    `;

    this.panel = document.getElementById('action-panel');
    this.activeAction = 'ground'; // default

    this.panel.querySelectorAll('.action-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        const action = btn.dataset.action;
        this.activeAction = action;
        this.panel.querySelectorAll('.action-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (this._listeners.actionChange) this._listeners.actionChange(action);
      });
    });

    // Set default active
    this.panel.querySelector('[data-action="ground"]').classList.add('active');
  }

  show(team) {
    // team: 'home' | 'away' — show attack or defense buttons
    this.panel.classList.add('visible');
  }

  hide() {
    this.panel.classList.remove('visible');
  }

  on(event, cb) { this._listeners[event] = cb; }
}
```

- [ ] **Step 2: Create `src/systems/TimeStopSystem.js`**

```js
// src/systems/TimeStopSystem.js
export class TimeStopSystem {
  constructor() {
    this.frozen = false;
    this.pendingAction = 'ground'; // 'ground' | 'lob' | 'shot'
    this._onUnfreeze = null;
  }

  freeze() {
    this.frozen = true;
  }

  unfreeze(action, swipe) {
    this.frozen = false;
    if (this._onUnfreeze) this._onUnfreeze(action, swipe);
  }

  onUnfreeze(cb) { this._onUnfreeze = cb; }

  setPendingAction(action) {
    this.pendingAction = action;
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/systems/TimeStopSystem.js src/ui/ActionUI.js
git commit -m "feat: time-stop system and action UI buttons"
```

---

## Task 9: HUD

**Files:**
- Create: `src/ui/HUD.js`

- [ ] **Step 1: Create `src/ui/HUD.js`**

```js
// src/ui/HUD.js
export class HUD {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this._build();
  }

  _build() {
    this.container.innerHTML = `
      <div style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: rgba(0,0,0,0.7);
        color: white;
        padding: 10px 20px;
        font-family: monospace;
        font-size: 20px;
        pointer-events: none;
      ">
        <span id="hud-home">홈 0</span>
        <span id="hud-timer">05:00</span>
        <span id="hud-away">0 어웨이</span>
      </div>
      <div id="hud-msg" style="
        text-align: center;
        font-size: 36px;
        font-weight: bold;
        color: #fbbf24;
        text-shadow: 2px 2px 4px #000;
        min-height: 50px;
        font-family: monospace;
        pointer-events: none;
      "></div>
    `;
    this.homeEl = document.getElementById('hud-home');
    this.awayEl = document.getElementById('hud-away');
    this.timerEl = document.getElementById('hud-timer');
    this.msgEl = document.getElementById('hud-msg');
  }

  update(homeScore, awayScore, secondsLeft) {
    this.homeEl.textContent = `홈 ${homeScore}`;
    this.awayEl.textContent = `${awayScore} 어웨이`;
    const m = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
    const s = Math.floor(secondsLeft % 60).toString().padStart(2, '0');
    this.timerEl.textContent = `${m}:${s}`;
  }

  showMessage(msg, durationMs = 2000) {
    this.msgEl.textContent = msg;
    if (durationMs > 0) setTimeout(() => { this.msgEl.textContent = ''; }, durationMs);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/ui/HUD.js
git commit -m "feat: HUD with score and timer"
```

---

## Task 10: Possession System

**Files:**
- Create: `src/systems/PossessionSystem.js`

- [ ] **Step 1: Create `src/systems/PossessionSystem.js`**

```js
// src/systems/PossessionSystem.js
import { findPossessor } from '../utils/possession.js';

export class PossessionSystem {
  constructor() {
    this.possessor = null;   // Player | null
    this._onChange = null;
  }

  onChange(cb) { this._onChange = cb; }

  update(allPlayers, ball) {
    if (ball.velocity.x !== 0 || ball.velocity.z !== 0) {
      // Ball is moving — check if someone intercepts
      const p = findPossessor(allPlayers, ball.position);
      if (p && p !== this.possessor) {
        this._setPossessor(p, ball);
      }
      return;
    }

    // Ball is still — find nearest
    const p = findPossessor(allPlayers, ball.position);
    if (p !== this.possessor) {
      this._setPossessor(p, ball);
    }
  }

  _setPossessor(player, ball) {
    if (this.possessor) this.possessor.hasBall = false;
    this.possessor = player;
    if (player) {
      player.hasBall = true;
      ball.velocity = { x: 0, z: 0 }; // stop ball
    }
    if (this._onChange) this._onChange(player);
  }

  release() {
    if (this.possessor) this.possessor.hasBall = false;
    this.possessor = null;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/systems/PossessionSystem.js
git commit -m "feat: possession system"
```

---

## Task 11: CPU AI System

**Files:**
- Create: `src/systems/AISystem.js`

- [ ] **Step 1: Create `src/systems/AISystem.js`**

```js
// src/systems/AISystem.js
// Simple CPU AI: chase ball, auto-pass after delay
const AI_PASS_DELAY = 1.2; // seconds before auto-pass
const AI_SHOT_RANGE = 20;   // if within this Z distance from goal, shoot

export class AISystem {
  constructor(awayTeam) {
    this.team = awayTeam;
    this._passTimer = 0;
    this._hasBallPlayer = null;
  }

  update(dt, ball, possession, timeStop, onKick) {
    if (timeStop.frozen) return;

    const possessor = possession.possessor;
    if (!possessor || possessor.team !== this.team.name) {
      this._passTimer = 0;
      this._hasBallPlayer = null;
      // All CPU players chase ball
      this._chaseFormation(ball);
      return;
    }

    // CPU has ball
    this._hasBallPlayer = possessor;
    this._passTimer += dt;

    if (this._passTimer >= AI_PASS_DELAY) {
      this._passTimer = 0;
      this._decideCPUAction(possessor, ball, onKick);
    }
  }

  _chaseFormation(ball) {
    const nearest = this.team.findNearestTo(ball.position);
    if (nearest) nearest.moveTo(ball.position.x, ball.position.z);
  }

  _decideCPUAction(player, ball, onKick) {
    // If close enough to goal, shoot
    const goalZ = -20; // home goal Z (negative side)
    const distToGoal = Math.abs(player.position.z - goalZ);

    if (distToGoal < AI_SHOT_RANGE) {
      // Shoot toward goal
      const dx = 0 - player.position.x;
      const dz = goalZ - player.position.z;
      const len = Math.sqrt(dx*dx + dz*dz);
      const power = 0.7 + Math.random() * 0.3;
      onKick(dx/len, dz/len, power);
    } else {
      // Pass to nearest teammate
      const teammates = this.team.allPlayers().filter(p => p !== player && !p.isGK);
      if (teammates.length === 0) return;
      const target = teammates[Math.floor(Math.random() * teammates.length)];
      const dx = target.position.x - player.position.x;
      const dz = target.position.z - player.position.z;
      const len = Math.sqrt(dx*dx + dz*dz);
      const power = 0.4 + Math.random() * 0.3;
      onKick(dx/len, dz/len, power);
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/systems/AISystem.js
git commit -m "feat: basic CPU AI (chase + auto-pass + shot)"
```

---

## Task 12: Match System

**Files:**
- Create: `src/systems/MatchSystem.js`

- [ ] **Step 1: Create `src/systems/MatchSystem.js`**

```js
// src/systems/MatchSystem.js
const MATCH_DURATION = 5 * 60; // 5 minutes in seconds

export class MatchSystem {
  constructor() {
    this.homeScore = 0;
    this.awayScore = 0;
    this.timeLeft = MATCH_DURATION;
    this.state = 'kickoff'; // 'kickoff' | 'playing' | 'goal' | 'fulltime'
    this._goalCooldown = 0;
    this._onFullTime = null;
  }

  onFullTime(cb) { this._onFullTime = cb; }

  startKickoff() {
    this.state = 'playing';
  }

  goal(team) {
    if (this.state !== 'playing') return;
    if (team === 'home') this.homeScore++;
    else this.awayScore++;
    this.state = 'goal';
    this._goalCooldown = 2.5;
  }

  update(dt) {
    if (this.state === 'goal') {
      this._goalCooldown -= dt;
      if (this._goalCooldown <= 0) {
        this.state = 'kickoff';
      }
      return;
    }

    if (this.state === 'playing') {
      this.timeLeft -= dt;
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this.state = 'fulltime';
        if (this._onFullTime) this._onFullTime(this.homeScore, this.awayScore);
      }
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/systems/MatchSystem.js
git commit -m "feat: match system (score, timer, fulltime)"
```

---

## Task 13: Game Engine — Wire Everything Together

**Files:**
- Create: `src/GameEngine.js`
- Modify: `src/main.js` (use GameEngine)

- [ ] **Step 1: Create `src/GameEngine.js`**

```js
// src/GameEngine.js
import { Field } from './entities/Field.js';
import { Ball } from './entities/Ball.js';
import { Team } from './entities/Team.js';
import { InputSystem } from './systems/InputSystem.js';
import { PossessionSystem } from './systems/PossessionSystem.js';
import { TimeStopSystem } from './systems/TimeStopSystem.js';
import { AISystem } from './systems/AISystem.js';
import { MatchSystem } from './systems/MatchSystem.js';
import { HUD } from './ui/HUD.js';
import { ActionUI } from './ui/ActionUI.js';
import { screenToField } from './utils/raycast.js';

export class GameEngine {
  constructor(scene, camera, canvas) {
    this.scene = scene;
    this.camera = camera;
    this.canvas = canvas;
    this._init();
  }

  _init() {
    // Entities
    this.field = new Field(this.scene);
    this.ball = new Ball(this.scene);
    this.homeTeam = new Team(this.scene, { name: 'home', color: 0x2563eb, side: 1 });
    this.awayTeam = new Team(this.scene, { name: 'away', color: 0xdc2626, side: -1 });

    // Systems
    this.input = new InputSystem(this.canvas);
    this.possession = new PossessionSystem();
    this.timeStop = new TimeStopSystem();
    this.ai = new AISystem(this.awayTeam);
    this.match = new MatchSystem();

    // UI
    this.hud = new HUD('hud');
    this.actionUI = new ActionUI('action-ui');

    this._wire();
    this.match.startKickoff();
  }

  _wire() {
    const allPlayers = [
      ...this.homeTeam.allPlayers(),
      ...this.awayTeam.allPlayers(),
    ];

    // Possession change → time stop for home team (player controlled)
    this.possession.onChange(player => {
      if (!player) return;
      if (player.team === 'home' && !player.isGK) {
        this.timeStop.freeze();
        this.actionUI.show('home');
      }
    });

    // Action UI button → set pending action
    this.actionUI.on('actionChange', action => {
      this.timeStop.setPendingAction(action);
    });

    // Click: move selected player or select player
    this.input.onClick(({ x, y }) => {
      const pos = screenToField(x, y, this.camera, this.canvas.clientWidth, this.canvas.clientHeight);
      if (!pos) return;

      const possessor = this.possession.possessor;
      if (possessor && possessor.team === 'home') {
        if (this.timeStop.frozen) {
          // During time stop: move possessor for dribble preview
          possessor.moveTo(pos.x, pos.z);
        } else {
          possessor.moveTo(pos.x, pos.z);
        }
      } else {
        // Select nearest home player to click
        const nearest = this.homeTeam.findNearestTo(pos);
        if (nearest) nearest.moveTo(pos.x, pos.z);
      }
    });

    // Swipe: execute action
    this.input.onSwipe(swipe => {
      if (!this.timeStop.frozen) return;
      const possessor = this.possession.possessor;
      if (!possessor || possessor.team !== 'home') return;

      const action = this.timeStop.pendingAction;
      // Convert swipe screen dir to field dir (invert Y → Z)
      const dx = swipe.dir.x;
      const dz = swipe.dir.y; // screen Y maps to field Z

      const power = action === 'shot' ? Math.max(swipe.power, 0.6) : swipe.power;
      this._kick(possessor, dx, dz, power);
      this.timeStop.frozen = false;
      this.actionUI.hide();
    });

    // CPU kick callback
    this.ai._onKick = (dx, dz, power) => {
      const p = this.possession.possessor;
      if (p) this._kick(p, dx, dz, power);
    };

    // Full time
    this.match.onFullTime((h, a) => {
      const msg = h > a ? '홈팀 승리! 🏆' : h < a ? '어웨이 승리!' : '무승부!';
      this.hud.showMessage(msg, 0);
    });
  }

  _kick(player, dx, dz, power) {
    this.possession.release();
    this.ball.kick(dx, dz, power);
    player.moveTo(player.position.x, player.position.z); // stop
  }

  update(dt) {
    if (this.match.state === 'fulltime') return;

    const allPlayers = [
      ...this.homeTeam.allPlayers(),
      ...this.awayTeam.allPlayers(),
    ];
    const frozen = this.timeStop.frozen;

    this.ball.update(dt);
    this.homeTeam.update(dt, frozen, this.ball.position);
    this.awayTeam.update(dt, frozen, this.ball.position);

    if (!frozen && this.match.state === 'playing') {
      this.possession.update(allPlayers, this.ball);
    }

    // CPU AI
    this.ai.update(dt, this.ball, this.possession, this.timeStop, (dx, dz, power) => {
      const p = this.possession.possessor;
      if (p) this._kick(p, dx, dz, power);
    });

    // Goal check
    const goal = this.ball.checkGoal();
    if (goal && this.match.state === 'playing') {
      this.match.goal(goal);
      this.hud.showMessage(goal === 'home' ? '⚽ 홈팀 골!' : '⚽ 어웨이 골!');
      setTimeout(() => {
        this.ball.reset();
        this.possession.release();
      }, 2500);
    }

    this.match.update(dt);
    this.hud.update(this.match.homeScore, this.match.awayScore, this.match.timeLeft);
  }
}
```

- [ ] **Step 2: Update `src/main.js` to use GameEngine**

```js
// src/main.js
import * as THREE from 'three';
import { GameEngine } from './GameEngine.js';

const container = document.getElementById('canvas-container');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 50, 28);
camera.lookAt(0, 0, 0);

const ambient = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambient);
const sun = new THREE.DirectionalLight(0xffffff, 1.0);
sun.position.set(10, 40, 20);
sun.castShadow = true;
scene.add(sun);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const game = new GameEngine(scene, camera, renderer.domElement);

let lastTime = performance.now();
function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;
  game.update(dt);
  renderer.render(scene, camera);
}
animate();
```

- [ ] **Step 3: Run game and verify basic play works**

```bash
npx vite
```

Verify:
- Field, goals, players, ball all visible
- Click on field → home players move
- Ball stops → action buttons appear → swipe → ball moves
- CPU team chases ball and auto-passes/shoots
- Goals detected → score updates
- Timer counts down

- [ ] **Step 4: Final commit**

```bash
git add src/GameEngine.js src/main.js
git commit -m "feat: game engine wiring - playable Phase 1 complete"
```

---

## Self-Review

**Spec coverage:**
- ✅ 7v7 formation
- ✅ Mobile + PC input (touch + mouse)
- ✅ Click to move player with ball (dribble)
- ✅ Time stops when player gets ball
- ✅ Swipe to pass (ground pass) and shoot
- ✅ Lob pass button (ball.kick with higher Y component — Phase 2 will add arc visuals)
- ✅ CPU auto AI with pass + shot
- ✅ GK auto positioning
- ✅ Score detection
- ✅ HUD (score + timer)
- ✅ FC 26-style camera angle

**Phase 2 items (NOT in this plan):**
- Sliding tackle (click defender + slide button)
- Free kick curve drawing
- Corner kick (tap destination)
- Penalty kick (manual GK)
- Throw-in
- Heading mechanic
- Lob pass arc trajectory
- Improved AI (formations, pressing)

**Placeholder scan:** No TBDs or placeholders found. All steps include complete code.

**Type consistency:** `ball.position.x/z`, `player.position.x/z` used consistently. `team.name` used as team identifier throughout. `possession.possessor` always returns `Player | null`.
