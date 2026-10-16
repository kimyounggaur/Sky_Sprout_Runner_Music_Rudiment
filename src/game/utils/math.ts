export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function approach(value: number, target: number, amount: number): number {
  if (value < target) {
    return Math.min(value + amount, target);
  }

  if (value > target) {
    return Math.max(value - amount, target);
  }

  return target;
}

export function signNonZero(value: number): -1 | 1 {
  return value < 0 ? -1 : 1;
}

export function overlapsRange(aMin: number, aMax: number, bMin: number, bMax: number): boolean {
  return aMin <= bMax && bMin <= aMax;
}
