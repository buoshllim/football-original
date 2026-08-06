import { findPossessor } from '../utils/possession.js';

export class PossessionSystem {
  constructor() {
    this.possessor = null;
    this._onChange = null;
  }

  onChange(cb) { this._onChange = cb; }

  update(allPlayers, ball) {
    const ballMoving = ball.velocity.x !== 0 || ball.velocity.z !== 0;
    const p = findPossessor(allPlayers, ball.position);

    if (p && p !== this.possessor) {
      this._setPossessor(p, ball);
    } else if (!ballMoving && !p && this.possessor) {
      // Ball stopped with no one near — keep current possessor
    }
  }

  _setPossessor(player, ball) {
    if (this.possessor) this.possessor.hasBall = false;
    this.possessor = player;
    if (player) {
      player.hasBall = true;
      ball.velocity = { x: 0, z: 0 };
    }
    if (this._onChange) this._onChange(player);
  }

  release() {
    if (this.possessor) this.possessor.hasBall = false;
    this.possessor = null;
  }
}
