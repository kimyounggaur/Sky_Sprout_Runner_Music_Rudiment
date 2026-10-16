import type {
  CollectibleDef,
  EnemyDef,
  HazardDef,
  LevelData as RuntimeLevelData,
  MovingPlatformDef,
  TerrainDef
} from '../types';

export type LevelTheme = 'windIsland' | 'cloudDawn' | 'starCavern';
export type Difficulty = 'easy' | 'normal' | 'hard' | 'experimental';
export type EditorLayer =
  | 'terrain'
  | 'platforms'
  | 'items'
  | 'enemies'
  | 'hazards'
  | 'utilities'
  | 'decorations';

export interface LevelObjectBase {
  id: string;
  type: string;
  layer: EditorLayer;
  x: number;
  y: number;
  width: number;
  height: number;
  locked: boolean;
  visible: boolean;
  notes: string;
}

export type TerrainObjectType =
  | 'skyGrassBlock'
  | 'softCloudBlock'
  | 'stoneRootBlock'
  | 'oneWayCloudPlatform';

export interface TerrainRect extends LevelObjectBase {
  type: TerrainObjectType;
  layer: 'terrain';
  variant: string;
  widthTiles: number;
  heightTiles: number;
  collision: 'solid' | 'oneWay' | 'none';
}

export type PlatformObjectType =
  | 'staticFloatingPlatform'
  | 'movingBreezePlatform'
  | 'fallingCloudPlatform';

export interface PlatformData extends LevelObjectBase {
  type: PlatformObjectType;
  layer: 'platforms';
  waypoints: Array<{ x: number; y: number }>;
  speed: number;
  mode: 'loop' | 'pingPong';
  startDelay: number;
  carryPlayer: boolean;
}

export interface CollectibleData extends LevelObjectBase {
  type: 'lightSeedShard' | 'bigLightSeed';
  layer: 'items';
  scoreValue: number;
  respawnOnDeath: boolean;
}

export interface PowerUpData extends LevelObjectBase {
  type: 'breezeOrb';
  layer: 'items';
  durationMs: number;
  effectType: 'jumpBoost' | 'airControl' | 'glide';
  strength: number;
}

export interface EnemyData extends LevelObjectBase {
  type: 'driftBug' | 'puffHopper' | 'windWisp';
  layer: 'enemies';
  speed: number;
  patrolDistance: number;
  direction: -1 | 1;
  jumpInterval: number;
  jumpPower: number;
  amplitude: number;
  frequency: number;
}

export interface HazardData extends LevelObjectBase {
  type: 'thornCrystal' | 'gustVent' | 'voidZone';
  layer: 'hazards';
  damage: number;
  knockbackX: number;
  knockbackY: number;
  respawnPlayer: boolean;
}

export interface PlayerSpawnData extends LevelObjectBase {
  type: 'playerSpawn';
  layer: 'utilities';
}

export interface CheckpointData extends LevelObjectBase {
  type: 'glowLanternCheckpoint';
  layer: 'utilities';
  order: number;
  activeRadius: number;
}

export interface FinishGateData extends LevelObjectBase {
  type: 'windGateFinish';
  layer: 'utilities';
  requiredShardCount: number;
  showCompletionBanner: boolean;
}

export interface DecorationData extends LevelObjectBase {
  type: 'cloudTuft' | 'tinySprout' | 'windRibbon' | 'distantStar' | 'floatingPebble';
  layer: 'decorations';
}

export type LevelObject =
  | TerrainRect
  | PlatformData
  | CollectibleData
  | PowerUpData
  | EnemyData
  | HazardData
  | PlayerSpawnData
  | CheckpointData
  | FinishGateData
  | DecorationData;

export interface LevelData {
  schemaVersion: 1;
  music?: import('../music/lessonPackage').LessonPackage;
  id: string;
  name: string;
  description: string;
  author?: string;
  createdAt: string;
  updatedAt: string;
  world: {
    widthTiles: number;
    heightTiles: number;
    tileSize: number;
    theme: LevelTheme;
    backgroundVariant: string;
  };
  playerSpawn: PlayerSpawnData | null;
  terrain: TerrainRect[];
  platforms: PlatformData[];
  collectibles: CollectibleData[];
  powerUps: PowerUpData[];
  enemies: EnemyData[];
  hazards: HazardData[];
  checkpoints: CheckpointData[];
  finishGate: FinishGateData | null;
  decorations: DecorationData[];
  metadata: {
    difficulty: Difficulty;
    tags: string[];
    estimatedTimeSeconds?: number;
  };
}

export function isEditorLevelData(value: unknown): value is LevelData {
  return (
    typeof value === 'object' &&
    value !== null &&
    'schemaVersion' in value &&
    (value as { schemaVersion?: unknown }).schemaVersion === 1 &&
    'playerSpawn' in value &&
    'world' in value
  );
}

export function getLevelObjects(level: LevelData): LevelObject[] {
  return [
    ...level.terrain,
    ...level.platforms,
    ...level.collectibles,
    ...level.powerUps,
    ...level.enemies,
    ...level.hazards,
    ...(level.playerSpawn ? [level.playerSpawn] : []),
    ...level.checkpoints,
    ...(level.finishGate ? [level.finishGate] : []),
    ...level.decorations
  ];
}

export function toRuntimeLevelData(level: LevelData): RuntimeLevelData {
  const tileSize = level.world.tileSize;
  const worldWidth = level.world.widthTiles * tileSize;
  const worldHeight = level.world.heightTiles * tileSize;
  const terrain: TerrainDef[] = [
    ...level.terrain.map((rect) => ({
      id: rect.id,
      kind: terrainKindFor(rect),
      x: rect.x,
      y: rect.y,
      width: Math.max(tileSize, rect.width),
      height: Math.max(tileSize, rect.height)
    })),
    ...level.platforms
      .filter((platform) => platform.type !== 'movingBreezePlatform')
      .map((platform) => ({
        id: platform.id,
        kind: 'cloud' as const,
        x: platform.x,
        y: platform.y,
        width: Math.max(tileSize, platform.width),
        height: Math.max(18, platform.height)
      }))
  ];

  const movingPlatforms: MovingPlatformDef[] = level.platforms
    .filter((platform) => platform.type === 'movingBreezePlatform')
    .map((platform) => ({
      id: platform.id,
      x: platform.x,
      y: platform.y,
      width: platform.width,
      height: platform.height,
      from: platform.waypoints[0] ?? { x: platform.x, y: platform.y },
      to: platform.waypoints[1] ?? { x: platform.x + tileSize * 4, y: platform.y },
      waypoints: platform.waypoints.length >= 2 ? platform.waypoints : undefined,
      mode: platform.mode,
      speed: platform.speed
    }));

  const collectibles: CollectibleDef[] = level.collectibles.map((item) => ({
    id: item.id,
    x: item.x,
    y: item.y
  }));

  const powerUps = level.powerUps.map((item) => ({
    id: item.id,
    x: item.x,
    y: item.y,
    durationMs: item.durationMs
  }));

  const enemies: EnemyDef[] = level.enemies.map((enemy) => ({
    id: enemy.id,
    kind: enemy.type,
    x: enemy.x,
    y: enemy.y,
    patrolDistance: enemy.patrolDistance,
    speed: enemy.speed
  }));

  const hazards: HazardDef[] = level.hazards.map((hazard) => ({
    id: hazard.id,
    kind: 'thornCrystal',
    x: hazard.x,
    y: hazard.y,
    width: hazard.width,
    height: hazard.height
  }));

  return {
    id: level.id,
    name: level.name,
    ...(level.music ? { music: JSON.parse(JSON.stringify(level.music)) as import('../music/lessonPackage').LessonPackage } : {}),
    world: {
      width: worldWidth,
      height: worldHeight,
      fallY: worldHeight + tileSize,
      timeLimitSeconds: level.metadata.estimatedTimeSeconds ?? 240
    },
    start: level.playerSpawn
      ? { x: level.playerSpawn.x, y: level.playerSpawn.y }
      : { x: tileSize * 3, y: worldHeight - tileSize * 4 },
    terrain,
    movingPlatforms,
    collectibles,
    powerUps,
    enemies,
    hazards,
    checkpoints: level.checkpoints.map((checkpoint) => ({
      id: checkpoint.id,
      label: 'Glow Lantern',
      x: checkpoint.x,
      y: checkpoint.y
    })),
    finishGate: level.finishGate
      ? { id: level.finishGate.id, x: level.finishGate.x, y: level.finishGate.y }
      : { id: `${level.id}-wind-gate`, x: worldWidth - tileSize * 4, y: worldHeight - tileSize * 4 }
  };
}

function terrainKindFor(rect: TerrainRect): TerrainDef['kind'] {
  switch (rect.type) {
    case 'skyGrassBlock':
      return 'grass';
    case 'stoneRootBlock':
      return 'stone';
    case 'softCloudBlock':
    case 'oneWayCloudPlatform':
      return 'cloud';
  }
}
