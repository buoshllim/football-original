import { Player } from './Player.js';
import { dist2D } from '../utils/math.js';

// 7v7 formation: GK + 2DEF + 3MID + 1FWD
// side: 1=home(attacks toward z<0), -1=away(attacks toward z>0)
function formation(side) {
  const s = side;
  return [
    { x:  0,  z: s*18, role: 'gk'  },
    { x: -6,  z: s*13, role: 'def' },
    { x:  6,  z: s*13, role: 'def' },
    { x: -9,  z: s*7,  role: 'mid' },
    { x:  0,  z: s*6,  role: 'mid' },
    { x:  9,  z: s*7,  role: 'mid' },
    { x:  0,  z: s*2,  role: 'fwd' },
  ];
}

export class Team {
  constructor(scene, { name, color, side }) {
    this.name  = name;
    this.side  = side;
    this.players = formation(side).map((pos, i) =>
      new Player(scene, { ...pos, color, id: `${name}_${i}`, team: name })
    );
  }

  nearestTo(x, z, excludeGK = false) {
    let best = null, bestD = Infinity;
    for (const p of this.players) {
      if (excludeGK && p.id.endsWith('_0')) continue;
      const d = dist2D(p.pos.x, p.pos.z, x, z);
      if (d < bestD) { bestD = d; best = p; }
    }
    return best;
  }

  driftHome(possessor) {
    for (const p of this.players) {
      if (p !== possessor) p.driftHome();
    }
  }

  update(dt) {
    this.players.forEach(p => p.update(dt));
  }
}
