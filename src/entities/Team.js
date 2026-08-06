import { Player } from './Player.js';
import { GoalKeeper } from './GoalKeeper.js';

function formation7v7(side) {
  const s = side;
  return [
    { x: 0,   z: s * 18, role: 'gk' },
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
    this.side = side;
    this.players = [];
    this.gk = null;
    this._build(scene);
  }

  _build(scene) {
    formation7v7(this.side).forEach((pos, i) => {
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
      if (dist < nearestDist) { nearestDist = dist; nearest = p; }
    }
    return nearest;
  }

  allPlayers() {
    return this.players;
  }

  update(dt, frozen, ballPos) {
    this.players.forEach(p => {
      if (p.isGK) p.autoUpdate(dt, ballPos, frozen);
      else p.update(dt, frozen);
    });
  }
}
