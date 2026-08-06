const AI_PASS_DELAY = 1.2;
const AI_SHOT_Z_THRESHOLD = 12; // distance to home goal Z (-20) to shoot

export class AISystem {
  constructor(awayTeam) {
    this.team = awayTeam;
    this._passTimer = 0;
  }

  update(dt, ball, possession, timeStop, onKick) {
    if (timeStop.frozen) return;

    const possessor = possession.possessor;
    if (!possessor || possessor.team !== this.team.name) {
      this._passTimer = 0;
      // Chase ball with nearest non-GK player
      const outfield = this.team.allPlayers().filter(p => !p.isGK);
      let nearest = null, nearestDist = Infinity;
      for (const p of outfield) {
        const dx = p.position.x - ball.position.x;
        const dz = p.position.z - ball.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < nearestDist) { nearestDist = dist; nearest = p; }
      }
      if (nearest) nearest.moveTo(ball.position.x, ball.position.z);
      return;
    }

    this._passTimer += dt;
    if (this._passTimer < AI_PASS_DELAY) return;
    this._passTimer = 0;

    const homeGoalZ = -20;
    const distToGoal = Math.abs(possessor.position.z - homeGoalZ);

    if (distToGoal < AI_SHOT_Z_THRESHOLD) {
      const dx = 0 - possessor.position.x;
      const dz = homeGoalZ - possessor.position.z;
      const len = Math.sqrt(dx * dx + dz * dz);
      onKick(dx / len, dz / len, 0.7 + Math.random() * 0.3);
    } else {
      const teammates = this.team.allPlayers().filter(p => p !== possessor && !p.isGK);
      if (!teammates.length) return;
      const target = teammates[Math.floor(Math.random() * teammates.length)];
      const dx = target.position.x - possessor.position.x;
      const dz = target.position.z - possessor.position.z;
      const len = Math.sqrt(dx * dx + dz * dz);
      onKick(dx / len, dz / len, 0.4 + Math.random() * 0.3);
    }
  }
}
