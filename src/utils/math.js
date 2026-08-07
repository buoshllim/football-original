export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function dist2D(ax, az, bx, bz) {
  return Math.sqrt((bx - ax) ** 2 + (bz - az) ** 2);
}
