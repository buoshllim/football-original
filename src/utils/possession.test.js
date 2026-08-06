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
