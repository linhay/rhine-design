export type OrbitVector = { x: number; y: number; z: number };
export const orbitCameraDistance = 3.6;
const yaw = -.72, tilt = .22, roll = .34;
const ct = Math.cos(tilt), st = Math.sin(tilt), cy = Math.cos(yaw), sy = Math.sin(yaw), cr = Math.cos(roll), sr = Math.sin(roll);

/** Keep every renderer in the original artwork's frame, including on narrow screens. */
export function orbitFraming(width: number, height: number) {
  return { scale: Math.min(width * .66, height * .39), centerX: width * .62, centerY: height * .57 };
}

/** Shared camera orientation for the original network and the strawberry ring. */
export function rotateOrbitPoint({ x, y, z }: OrbitVector): OrbitVector {
  const yy = y * ct - z * st, zz = y * st + z * ct;
  const xx = x * cy + zz * sy, depth = -x * sy + zz * cy;
  return { x: xx * cr - yy * sr, y: xx * sr + yy * cr, z: depth };
}

export function projectOrbitPoint(p: OrbitVector, scale: number, centerX: number, centerY: number) {
  const perspective = orbitCameraDistance / (orbitCameraDistance - p.z);
  return { x: centerX + p.x * scale * perspective, y: centerY + p.y * scale * perspective * 1.08, depth: p.z, perspective };
}
