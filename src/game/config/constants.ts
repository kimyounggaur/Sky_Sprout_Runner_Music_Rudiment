export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

export const DEPTHS = {
  background: -20,
  terrain: 5,
  pickups: 12,
  enemies: 14,
  player: 20,
  particles: 24,
  touch: 90,
  ui: 100,
  overlay: 200
} as const;

export const PLAYER = {
  width: 30,
  height: 42,
  walkSpeed: 190,
  runSpeed: 270,
  acceleration: 1600,
  airAcceleration: 1050,
  groundDrag: 1850,
  airDrag: 360,
  jumpVelocity: -455,
  poweredJumpVelocity: -510,
  doubleJumpVelocity: -405,
  wallJumpVelocityY: -430,
  wallJumpVelocityX: 330,
  wallSlideMaxFallSpeed: 115,
  maxAirJumps: 1,
  bounceVelocity: -300,
  maxFallSpeed: 620,
  extraFallGravity: 540,
  coyoteMs: 125,
  jumpBufferMs: 125,
  shortJumpVelocity: -175,
  hurtKnockbackX: 250,
  hurtKnockbackY: -230,
  invulnerableMs: 1000,
  maxHealth: 3,
  breezeAirControlMultiplier: 1.22
} as const;

export const SCORE_VALUES = {
  shard: 100,
  enemy: 200,
  powerUp: 300,
  clearBase: 1000,
  timeBonusPerSecond: 20
} as const;

export const EVENTS = {
  hudUpdate: 'hud:update',
  levelRestart: 'level:restart',
  levelQuit: 'level:quit',
  stateChanged: 'state:changed'
} as const;

export const SAVE_KEYS = {
  bestScore: 'sky-sprout-runner.best-score'
} as const;
