import { describe, expect, it } from 'vitest';
import { PLAYER } from '../../src/game/config/constants';
import type { PlayerInput } from '../../src/game/types';
import {
  applyPlayerHit,
  createPlayerPhysicsState,
  stepPlayerPhysics
} from '../../src/game/systems/playerPhysicsModel';

const input = (overrides: Partial<PlayerInput> = {}): PlayerInput => ({
  left: false,
  right: false,
  down: false,
  jumpDown: false,
  jumpPressed: false,
  jumpReleased: false,
  run: false,
  pausePressed: false,
  restartPressed: false,
  ...overrides
});

describe('player physics model', () => {
  it('allows a jump inside coyote time', () => {
    const state = {
      ...createPlayerPhysicsState(),
      onGround: false,
      lastGroundedAt: 0,
      vy: 70
    };

    const next = stepPlayerPhysics(state, input({ jumpPressed: true, jumpDown: true }), 16, 100);

    expect(next.vy).toBe(PLAYER.jumpVelocity);
    expect(next.onGround).toBe(false);
  });

  it('fires a buffered jump when landing shortly after pressing jump', () => {
    const airborne = {
      ...createPlayerPhysicsState(),
      onGround: false,
      lastGroundedAt: Number.NEGATIVE_INFINITY,
      airJumpsRemaining: 0,
      vy: 240
    };

    const buffered = stepPlayerPhysics(airborne, input({ jumpPressed: true, jumpDown: true }), 16, 0);
    const landed = stepPlayerPhysics({ ...buffered, onGround: true, vy: 0 }, input(), 16, 95);

    expect(landed.vy).toBe(PLAYER.jumpVelocity);
    expect(landed.jumpBufferedUntil).toBe(Number.NEGATIVE_INFINITY);
  });

  it('clamps horizontal run speed', () => {
    let state = createPlayerPhysicsState();

    for (let frame = 0; frame < 120; frame += 1) {
      state = stepPlayerPhysics(state, input({ right: true, run: true }), 16, frame * 16);
    }

    expect(state.vx).toBeLessThanOrEqual(PLAYER.runSpeed);
  });

  it('allows one double jump while airborne', () => {
    const state = {
      ...createPlayerPhysicsState(),
      onGround: false,
      lastGroundedAt: Number.NEGATIVE_INFINITY,
      airJumpsRemaining: 1,
      vy: 120
    };

    const jumped = stepPlayerPhysics(state, input({ jumpPressed: true, jumpDown: true }), 16, 500);
    const denied = stepPlayerPhysics(
      { ...jumped, vy: 80 },
      input({ jumpPressed: true, jumpDown: true }),
      16,
      700
    );

    expect(jumped.vy).toBe(PLAYER.doubleJumpVelocity);
    expect(jumped.airJumpsRemaining).toBe(0);
    expect(denied.vy).toBeGreaterThan(PLAYER.doubleJumpVelocity);
  });

  it('slides on a held wall and jumps away from it', () => {
    const state = {
      ...createPlayerPhysicsState(),
      onGround: false,
      onWall: true,
      wallDirection: 1 as const,
      lastGroundedAt: Number.NEGATIVE_INFINITY,
      vy: 300
    };

    const sliding = stepPlayerPhysics(state, input({ right: true }), 16, 500);
    const wallJumped = stepPlayerPhysics(
      { ...sliding, onWall: true, wallDirection: 1 },
      input({ right: true, jumpPressed: true, jumpDown: true }),
      16,
      532
    );

    expect(sliding.vy).toBe(PLAYER.wallSlideMaxFallSpeed);
    expect(wallJumped.vy).toBe(PLAYER.wallJumpVelocityY);
    expect(wallJumped.vx).toBe(-PLAYER.wallJumpVelocityX);
    expect(wallJumped.airJumpsRemaining).toBe(PLAYER.maxAirJumps);
  });

  it('reduces health once and applies invulnerability after a hit', () => {
    const state = createPlayerPhysicsState();
    const hit = applyPlayerHit(state, 500, -1);
    const ignored = applyPlayerHit(hit, 700, -1);

    expect(hit.health).toBe(PLAYER.maxHealth - 1);
    expect(hit.vx).toBe(-PLAYER.hurtKnockbackX);
    expect(ignored.health).toBe(hit.health);
  });
});
