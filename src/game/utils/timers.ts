export function isWithin(nowMs: number, timestampMs: number, windowMs: number): boolean {
  return nowMs - timestampMs <= windowMs;
}

export function secondsFromMs(ms: number): number {
  return Math.max(0, Math.floor(ms / 1000));
}
