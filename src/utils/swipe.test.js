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
