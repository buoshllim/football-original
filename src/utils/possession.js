const POSSESSION_RANGE = 1.8;

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
