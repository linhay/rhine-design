export function paperMorphAmount(time: number) {
  const phase = ((time % 42) + 42) % 42;
  return phase < 4 ? 0 : phase < 18 ? (phase - 4) / 14 : phase < 24 ? 1 : phase < 38 ? (38 - phase) / 14 : 0;
}

export function paperEase(start: number, end: number, value: number) {
  const t = Math.max(0, Math.min(1, (value - start) / (end - start)));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/** Every flight pose is derived from the host's paused, visible-time clock. */
export function paperBirdFlight(time: number) {
  const morph = paperMorphAmount(time);
  const folding = paperEase(0, .12, morph) * (1 - paperEase(.88, 1, morph));
  const turn = time * Math.PI * 2 / 14;
  const stroke = time * Math.PI * 2 / 2.4;
  const effort = .55 + .45 * Math.sin(turn - .4) ** 2;
  return {
    x: Math.sin(turn) * .37,
    y: -.14 + Math.sin(turn * 2) * .16 + Math.sin(stroke - .5) * .035 * effort,
    z: Math.cos(turn) * .2,
    pitch: Math.cos(turn * 2) * .07 + Math.cos(stroke) * .025 * effort - folding * .09,
    yaw: Math.cos(turn) * .24,
    bank: -Math.sin(turn) * .12,
    wing: ((-.03 + Math.sin(stroke) * .29 * effort) * (1 - morph) + (.2 + Math.sin(time * Math.PI * 2 / .8) * .43) * morph) * (1 - folding),
  };
}

export function rotatePaperPoint(x: number, y: number, z: number, pitch: number, yaw: number, bank: number) {
  // Match Three.js XYZ Euler order: local Z, then Y, then X.
  const bx = x * Math.cos(bank) - y * Math.sin(bank), by = x * Math.sin(bank) + y * Math.cos(bank);
  const yx = bx * Math.cos(yaw) + z * Math.sin(yaw), yz = -bx * Math.sin(yaw) + z * Math.cos(yaw);
  return [yx, by * Math.cos(pitch) - yz * Math.sin(pitch), by * Math.sin(pitch) + yz * Math.cos(pitch)] as const;
}
