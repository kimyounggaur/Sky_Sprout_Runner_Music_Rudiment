import type {
  CheckpointData,
  CollectibleData,
  DecorationData,
  EnemyData,
  FinishGateData,
  HazardData,
  LevelObject,
  PlatformData,
  PlayerSpawnData,
  PowerUpData,
  TerrainRect
} from '../../game/data/LevelData';
import { createId } from '../utils/idFactory';

export type CatalogCategory =
  | 'terrain'
  | 'platforms'
  | 'items'
  | 'enemies'
  | 'hazards'
  | 'utilities'
  | 'decorations';

export interface CatalogItem {
  id: string;
  label: string;
  category: CatalogCategory;
  description: string;
  createObject: (x: number, y: number, tileSize: number) => LevelObject;
}

function common(idPrefix: string, x: number, y: number, width: number, height: number) {
  return {
    id: createId(idPrefix),
    x,
    y,
    width,
    height,
    locked: false,
    visible: true,
    notes: ''
  };
}

function terrain(
  type: TerrainRect['type'],
  label: string,
  variant: string,
  collision: TerrainRect['collision']
): CatalogItem {
  return {
    id: type,
    label,
    category: 'terrain',
    description: 'Grid-aligned terrain for shaping the island route.',
    createObject: (x, y, tileSize) => ({
      ...common(type, x, y, tileSize, tileSize),
      type,
      layer: 'terrain',
      variant,
      widthTiles: 1,
      heightTiles: 1,
      collision
    })
  };
}

export const objectCatalog: CatalogItem[] = [
  terrain('skyGrassBlock', 'Sky Grass Block', 'mossy-edge', 'solid'),
  terrain('softCloudBlock', 'Soft Cloud Block', 'bright-cloud', 'solid'),
  terrain('stoneRootBlock', 'Stone Root Block', 'root-stone', 'solid'),
  terrain('oneWayCloudPlatform', 'One-way Cloud Platform', 'thin-cloud', 'oneWay'),
  {
    id: 'staticFloatingPlatform',
    label: 'Static Floating Platform',
    category: 'platforms',
    description: 'A stable floating step.',
    createObject: (x, y, tileSize): PlatformData => ({
      ...common('static-platform', x, y, tileSize * 4, tileSize * 0.75),
      type: 'staticFloatingPlatform',
      layer: 'platforms',
      waypoints: [],
      speed: 0,
      mode: 'pingPong',
      startDelay: 0,
      carryPlayer: true
    })
  },
  {
    id: 'movingBreezePlatform',
    label: 'Moving Breeze Platform',
    category: 'platforms',
    description: 'A platform carried by a looping breeze path.',
    createObject: (x, y, tileSize): PlatformData => ({
      ...common('moving-platform', x, y, tileSize * 4, tileSize * 0.75),
      type: 'movingBreezePlatform',
      layer: 'platforms',
      waypoints: [
        { x, y },
        { x: x + tileSize * 5, y }
      ],
      speed: 90,
      mode: 'pingPong',
      startDelay: 0,
      carryPlayer: true
    })
  },
  {
    id: 'fallingCloudPlatform',
    label: 'Falling Cloud Platform',
    category: 'platforms',
    description: 'A fragile platform noted for future falling behavior.',
    createObject: (x, y, tileSize): PlatformData => ({
      ...common('falling-cloud', x, y, tileSize * 3, tileSize * 0.75),
      type: 'fallingCloudPlatform',
      layer: 'platforms',
      waypoints: [],
      speed: 0,
      mode: 'pingPong',
      startDelay: 250,
      carryPlayer: true
    })
  },
  {
    id: 'lightSeedShard',
    label: 'Light Seed Shard',
    category: 'items',
    description: 'A small collectible worth 100 points.',
    createObject: (x, y, tileSize): CollectibleData => ({
      ...common('light-seed', x, y, tileSize, tileSize),
      type: 'lightSeedShard',
      layer: 'items',
      scoreValue: 100,
      respawnOnDeath: false
    })
  },
  {
    id: 'bigLightSeed',
    label: 'Big Light Seed',
    category: 'items',
    description: 'A rare collectible worth 500 points.',
    createObject: (x, y, tileSize): CollectibleData => ({
      ...common('big-light-seed', x, y, tileSize * 1.25, tileSize * 1.25),
      type: 'bigLightSeed',
      layer: 'items',
      scoreValue: 500,
      respawnOnDeath: false
    })
  },
  {
    id: 'breezeOrb',
    label: 'Breeze Orb',
    category: 'items',
    description: 'A temporary air-control power-up.',
    createObject: (x, y, tileSize): PowerUpData => ({
      ...common('breeze-orb', x, y, tileSize, tileSize),
      type: 'breezeOrb',
      layer: 'items',
      durationMs: 9000,
      effectType: 'airControl',
      strength: 1.2
    })
  },
  {
    id: 'driftBug',
    label: 'Drift Bug',
    category: 'enemies',
    description: 'A small left-right patrolling leaf bug.',
    createObject: (x, y, tileSize): EnemyData => ({
      ...common('drift-bug', x, y, tileSize, tileSize),
      type: 'driftBug',
      layer: 'enemies',
      speed: 65,
      patrolDistance: 160,
      direction: 1,
      jumpInterval: 0,
      jumpPower: 0,
      amplitude: 0,
      frequency: 0
    })
  },
  {
    id: 'puffHopper',
    label: 'Puff Hopper',
    category: 'enemies',
    description: 'A round cloud creature with a hopping rhythm.',
    createObject: (x, y, tileSize): EnemyData => ({
      ...common('puff-hopper', x, y, tileSize, tileSize),
      type: 'puffHopper',
      layer: 'enemies',
      speed: 44,
      patrolDistance: 120,
      direction: 1,
      jumpInterval: 1600,
      jumpPower: 260,
      amplitude: 0,
      frequency: 0
    })
  },
  {
    id: 'windWisp',
    label: 'Wind Wisp',
    category: 'enemies',
    description: 'A floating wind spirit.',
    createObject: (x, y, tileSize): EnemyData => ({
      ...common('wind-wisp', x, y, tileSize, tileSize),
      type: 'windWisp',
      layer: 'enemies',
      speed: 45,
      patrolDistance: 120,
      direction: 1,
      jumpInterval: 0,
      jumpPower: 0,
      amplitude: 32,
      frequency: 1.2
    })
  },
  {
    id: 'thornCrystal',
    label: 'Thorn Crystal',
    category: 'hazards',
    description: 'A sharp crystal hazard.',
    createObject: (x, y, tileSize): HazardData => ({
      ...common('thorn-crystal', x, y, tileSize, tileSize),
      type: 'thornCrystal',
      layer: 'hazards',
      damage: 1,
      knockbackX: 180,
      knockbackY: -160,
      respawnPlayer: true
    })
  },
  {
    id: 'gustVent',
    label: 'Gust Vent',
    category: 'hazards',
    description: 'An upward wind hazard marker.',
    createObject: (x, y, tileSize): HazardData => ({
      ...common('gust-vent', x, y, tileSize, tileSize),
      type: 'gustVent',
      layer: 'hazards',
      damage: 0,
      knockbackX: 0,
      knockbackY: -320,
      respawnPlayer: false
    })
  },
  {
    id: 'voidZone',
    label: 'Void Zone',
    category: 'hazards',
    description: 'A respawn danger region.',
    createObject: (x, y, tileSize): HazardData => ({
      ...common('void-zone', x, y, tileSize * 3, tileSize),
      type: 'voidZone',
      layer: 'hazards',
      damage: 3,
      knockbackX: 0,
      knockbackY: 0,
      respawnPlayer: true
    })
  },
  {
    id: 'playerSpawn',
    label: 'Player Spawn',
    category: 'utilities',
    description: 'The single starting point for the level.',
    createObject: (x, y, tileSize): PlayerSpawnData => ({
      ...common('player-spawn', x, y, tileSize, tileSize * 1.4),
      type: 'playerSpawn',
      layer: 'utilities'
    })
  },
  {
    id: 'glowLanternCheckpoint',
    label: 'Glow Lantern Checkpoint',
    category: 'utilities',
    description: 'A restart point.',
    createObject: (x, y, tileSize): CheckpointData => ({
      ...common('checkpoint', x, y, tileSize, tileSize * 1.5),
      type: 'glowLanternCheckpoint',
      layer: 'utilities',
      order: 1,
      activeRadius: 48
    })
  },
  {
    id: 'windGateFinish',
    label: 'Wind Gate Finish',
    category: 'utilities',
    description: 'The single finish gate.',
    createObject: (x, y, tileSize): FinishGateData => ({
      ...common('wind-gate', x, y, tileSize * 1.5, tileSize * 2.5),
      type: 'windGateFinish',
      layer: 'utilities',
      requiredShardCount: 0,
      showCompletionBanner: true
    })
  },
  ...(['cloudTuft', 'tinySprout', 'windRibbon', 'distantStar', 'floatingPebble'] as const).map(
    (type): CatalogItem => ({
      id: type,
      label:
        type === 'cloudTuft'
          ? 'Cloud Tuft'
          : type === 'tinySprout'
            ? 'Tiny Sprout'
            : type === 'windRibbon'
              ? 'Wind Ribbon'
              : type === 'distantStar'
                ? 'Distant Star'
                : 'Floating Pebble',
      category: 'decorations',
      description: 'A non-colliding decorative accent.',
      createObject: (x, y, tileSize): DecorationData => ({
        ...common(type, x, y, tileSize, tileSize),
        type,
        layer: 'decorations'
      })
    })
  )
];

export function getCatalogItem(id: string): CatalogItem | null {
  return objectCatalog.find((item) => item.id === id) ?? null;
}

export const catalogCategories: CatalogCategory[] = [
  'terrain',
  'platforms',
  'items',
  'enemies',
  'hazards',
  'utilities',
  'decorations'
];
