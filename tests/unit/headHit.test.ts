import { describe, expect, it } from 'vitest';
import { didHitBlockFromBelow } from '../../src/game/systems/headHit';

const playerBody = (overrides: Partial<Parameters<typeof didHitBlockFromBelow>[0]> = {}) => ({
  left: 10,
  right: 32,
  top: 100,
  blocked: { up: true },
  touching: { up: false },
  deltaY: () => -18,
  ...overrides
});

const blockBody = (overrides: Partial<Parameters<typeof didHitBlockFromBelow>[1]> = {}) => ({
  left: 0,
  right: 44,
  bottom: 104,
  ...overrides
});

describe('head hit detection', () => {
  it('opens a block only when the player head crosses the block bottom upward', () => {
    expect(didHitBlockFromBelow(playerBody(), blockBody())).toBe(true);
  });

  it('does not open a block when there is no upward head contact', () => {
    expect(
      didHitBlockFromBelow(
        playerBody({ blocked: { up: false }, touching: { up: false } }),
        blockBody()
      )
    ).toBe(false);
    expect(didHitBlockFromBelow(playerBody({ deltaY: () => 0 }), blockBody())).toBe(false);
  });

  it('does not open a block from side overlap or near misses', () => {
    expect(didHitBlockFromBelow(playerBody({ left: 45, right: 67 }), blockBody())).toBe(false);
    expect(didHitBlockFromBelow(playerBody({ top: 126, deltaY: () => -4 }), blockBody())).toBe(
      false
    );
  });
});
