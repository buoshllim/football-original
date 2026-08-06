import { Player } from './Player.js';
import { FIELD } from './Field.js';

const GK_REACTION_RANGE = 12;

export class GoalKeeper extends Player {
  constructor(scene, { x, z, color, id, team }) {
    super(scene, { x, z, color, id, team });
    this.homeZ = z;
    this.isGK = true;
  }

  autoUpdate(dt, ballPos, frozen) {
    if (frozen) return;

    const distToBall = Math.abs(ballPos.z - this.homeZ);

    const targetX = Math.max(
      -FIELD.goalWidth / 2 + 0.5,
      Math.min(FIELD.goalWidth / 2 - 0.5, ballPos.x)
    );

    const targetZ = distToBall < GK_REACTION_RANGE
      ? this.homeZ + (ballPos.z - this.homeZ) * 0.2
      : this.homeZ;

    this.moveTo(targetX, targetZ);
    super.update(dt, false);
  }
}
