import type { GameStateName, HudPayload } from '../types';

export function publishGameState(state: GameStateName): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.__SKY_SPROUT_STATE = state;
  window.dispatchEvent(new CustomEvent('sky-sprout-state', { detail: state }));
}

export function publishHudState(payload: HudPayload): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.__SKY_SPROUT_HUD = payload;
}
