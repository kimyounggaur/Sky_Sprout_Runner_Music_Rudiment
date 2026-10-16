export type GameStateName = 'title' | 'playing' | 'paused' | 'gameOver' | 'levelComplete';

export type EnemyKind = 'driftBug' | 'puffHopper' | 'windWisp';

export interface Point {
  x: number;
  y: number;
}

export interface RectDef extends Point {
  id: string;
  width: number;
  height: number;
}

export interface TerrainDef extends RectDef {
  kind: 'grass' | 'stone' | 'cloud' | 'skyBrick' | 'runeBox';
}

export interface MovingPlatformDef extends RectDef {
  from: Point;
  to: Point;
  waypoints?: Point[];
  mode?: 'loop' | 'pingPong';
  speed: number;
}

export interface CollectibleDef extends Point {
  id: string;
}

export interface PowerUpDef extends Point {
  id: string;
  durationMs: number;
}

export interface EnemyDef extends Point {
  id: string;
  kind: EnemyKind;
  patrolDistance?: number;
  speed?: number;
}

export interface HazardDef extends RectDef {
  kind: 'thornCrystal';
}

export interface CheckpointDef extends Point {
  id: string;
  label: string;
}

export interface FinishGateDef extends Point {
  id: string;
}

export interface LevelData {
  id: string;
  name: string;
  music?: import('./music/lessonPackage').LessonPackage;
  world: {
    width: number;
    height: number;
    fallY: number;
    timeLimitSeconds: number;
  };
  start: Point;
  terrain: TerrainDef[];
  movingPlatforms: MovingPlatformDef[];
  collectibles: CollectibleDef[];
  powerUps: PowerUpDef[];
  enemies: EnemyDef[];
  hazards: HazardDef[];
  checkpoints: CheckpointDef[];
  finishGate: FinishGateDef;
}

export interface PlayerInput {
  left: boolean;
  right: boolean;
  down: boolean;
  jumpDown: boolean;
  jumpPressed: boolean;
  jumpReleased: boolean;
  run: boolean;
  pausePressed: boolean;
  restartPressed: boolean;
}

export interface HudPayload {
  health: number;
  shards: number;
  totalShards: number;
  score: number;
  elapsedSeconds: number;
  checkpointLabel: string;
  powerActive: boolean;
  highScore: number;
}

export interface LevelCompletePayload {
  score: number;
  shards: number;
  totalShards: number;
  elapsedSeconds: number;
  bestScore: number;
}

export interface LevelObjects {
  terrain: Phaser.Physics.Arcade.StaticGroup;
  movingPlatforms: Phaser.Physics.Arcade.Group;
  collectibles: Phaser.Physics.Arcade.Group;
  powerUps: Phaser.Physics.Arcade.Group;
  enemies: Phaser.Physics.Arcade.Group;
  hazards: Phaser.Physics.Arcade.Group;
  checkpoints: Phaser.Physics.Arcade.Group;
  finishGate: Phaser.Physics.Arcade.Group;
}

declare global {
  interface Window {
    __SKY_SPROUT_STATE?: GameStateName;
    __SKY_SPROUT_HUD?: HudPayload;
    __SKY_SPROUT_LAUNCH?: {
      level?: unknown;
      skipMenu?: boolean;
      testPlay?: boolean;
    };
  }
}
