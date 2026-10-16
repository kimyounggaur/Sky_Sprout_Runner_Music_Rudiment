import { describe, expect, it } from 'vitest';
import { hasStandingRoom, type Bounds } from '../../src/game/systems/standingRoom';

const standingBounds: Bounds = {
  left: 10,
  right: 32,
  top: 80,
  bottom: 120
};

describe('standing room', () => {
  it('blocks standing when the expanded body would overlap an overhead obstacle', () => {
    expect(
      hasStandingRoom(standingBounds, [{ left: 0, right: 44, top: 58, bottom: 92 }])
    ).toBe(false);
  });

  it('allows standing when the body only touches the obstacle edge', () => {
    expect(
      hasStandingRoom(standingBounds, [{ left: 0, right: 44, top: 48, bottom: 80 }])
    ).toBe(true);
  });

  it('allows standing when nearby obstacles are beside the player', () => {
    expect(
      hasStandingRoom(standingBounds, [{ left: 34, right: 78, top: 58, bottom: 92 }])
    ).toBe(true);
  });
});
