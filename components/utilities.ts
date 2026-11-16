/** Small deterministic helpers; no DOM, global state, persistence or theme mutation. */
export const Util = Object.freeze({
  classNames(...parts: (string | false | null | undefined)[]) { return parts.filter(Boolean).join(' '); },
  clamp(value: number, min: number, max: number) {
    if (!Number.isFinite(min) || !Number.isFinite(max) || min > max) throw new RangeError('clamp requires finite ordered bounds.');
    return Number.isNaN(value) ? min : Math.max(min, Math.min(max, value));
  },
});
