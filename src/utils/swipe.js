import { clamp } from './math.js';

const MAX_SWIPE_PX = 200;

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
