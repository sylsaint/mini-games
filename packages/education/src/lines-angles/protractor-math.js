/** Integer degrees on an upper semicircle; never infer a target answer. */
export function clampDegrees(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(180, Math.max(0, Math.round(number))) : 0;
}

export function pointOnRay(angle, radius, origin = { x: 220, y: 208 }) {
  const radians = clampDegrees(angle) * Math.PI / 180;
  return { x: origin.x + radius * Math.cos(radians), y: origin.y - radius * Math.sin(radians) };
}

/** Points below the baseline snap to its nearest endpoint, not reflex angles. */
export function degreesFromPoint(x, y, origin = { x: 220, y: 208 }) {
  const dx = x - origin.x;
  const dy = Math.max(0, origin.y - y);
  if (Math.hypot(dx, dy) < 2) return null; // The vertex cannot define a direction.
  return clampDegrees(Math.atan2(dy, dx) * 180 / Math.PI);
}

export function degreesFromKey(key, value, shift = false) {
  const step = shift ? 10 : 1;
  const current = clampDegrees(value);
  if (key === 'ArrowRight' || key === 'ArrowUp') return clampDegrees(current + step);
  if (key === 'ArrowLeft' || key === 'ArrowDown') return clampDegrees(current - step);
  if (key === 'PageUp') return clampDegrees(current + 10);
  if (key === 'PageDown') return clampDegrees(current - 10);
  if (key === 'Home') return 0;
  if (key === 'End') return 180;
  return null;
}
