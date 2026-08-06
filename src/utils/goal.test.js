import { describe, it, expect } from 'vitest';

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
