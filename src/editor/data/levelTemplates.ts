import type {
  CheckpointData,
  CollectibleData,
  EnemyData,
  FinishGateData,
  HazardData,
  LevelData,
  PlatformData,
  PlayerSpawnData,
  TerrainRect
} from '../../game/data/LevelData';
import { createStableId } from '../utils/idFactory';
import { getCatalogItem } from './objectCatalog';

export type LevelTemplateId =
  | 'emptyIsland'
  | 'starterPlains'
  | 'floatingChallenge'
  | 'enemyPractice'
  | 'speedRunStrip';

export interface LevelTemplateOptions {
  name?: string;
  description?: string;
  widthTiles?: number;
  heightTiles?: number;
}

export function createLevelFromTemplate(
  templateId: LevelTemplateId,
  options: LevelTemplateOptions = {}
): LevelData {
  const tileSize = 32;
  const now = new Date().toISOString();
  const widthTiles = options.widthTiles ?? 120;
  const heightTiles = options.heightTiles ?? 24;
  const base: LevelData = {
    schemaVersion: 1,
    id: `level-${cryptoSafeId()}`,
    name: options.name ?? 'Untitled Sky Forge Level',
    description: options.description ?? 'A custom cloud-island route built in Sky Forge Editor.',
    createdAt: now,
    updatedAt: now,
    world: {
      widthTiles,
      heightTiles,
      tileSize,
      theme: templateId === 'floatingChallenge' ? 'cloudDawn' : 'windIsland',
      backgroundVariant: 'clear-breeze'
    },
    playerSpawn: null,
    terrain: [],
    platforms: [],
    collectibles: [],
    powerUps: [],
    enemies: [],
    hazards: [],
    checkpoints: [],
    finishGate: null,
    decorations: [],
    metadata: {
      difficulty: templateId === 'enemyPractice' ? 'hard' : 'normal',
      tags: [],
      estimatedTimeSeconds: templateId === 'speedRunStrip' ? 90 : 180
    }
  };

  const groundY = (heightTiles - 2) * tileSize;
  const spawn = getCatalogItem('playerSpawn')!.createObject(
    tileSize * 3,
    groundY - tileSize,
    tileSize
  ) as PlayerSpawnData;
  const finish = getCatalogItem('windGateFinish')!.createObject(
    (widthTiles - 5) * tileSize,
    groundY - tileSize * 1.5,
    tileSize
  ) as FinishGateData;
  base.playerSpawn = { ...spawn, id: 'player-spawn-01' };
  base.finishGate = { ...finish, id: 'wind-gate-01' };

  if (templateId === 'emptyIsland') {
    return base;
  }

  base.terrain.push(
    {
      ...(getCatalogItem('skyGrassBlock')!.createObject(
        widthTiles * tileSize * 0.18,
        groundY,
        tileSize
      ) as TerrainRect),
      id: createStableId('grass', 1),
      width: tileSize * 18,
      height: tileSize * 2,
      widthTiles: 18,
      heightTiles: 2
    },
    {
      ...(getCatalogItem('skyGrassBlock')!.createObject(
        widthTiles * tileSize * 0.48,
        groundY,
        tileSize
      ) as TerrainRect),
      id: createStableId('grass', 2),
      width: tileSize * 22,
      height: tileSize * 2,
      widthTiles: 22,
      heightTiles: 2
    },
    {
      ...(getCatalogItem('skyGrassBlock')!.createObject(
        (widthTiles - 8) * tileSize,
        groundY,
        tileSize
      ) as TerrainRect),
      id: createStableId('grass', 3),
      width: tileSize * 14,
      height: tileSize * 2,
      widthTiles: 14,
      heightTiles: 2
    },
    {
      ...(getCatalogItem('softCloudBlock')!.createObject(
        tileSize * 27,
        groundY - tileSize * 4,
        tileSize
      ) as TerrainRect),
      id: createStableId('cloud-step', 1),
      width: tileSize * 5,
      height: tileSize,
      widthTiles: 5,
      heightTiles: 1
    },
    {
      ...(getCatalogItem('stoneRootBlock')!.createObject(
        tileSize * 41,
        groundY - tileSize * 6,
        tileSize
      ) as TerrainRect),
      id: createStableId('stone-step', 1),
      width: tileSize * 6,
      height: tileSize,
      widthTiles: 6,
      heightTiles: 1
    }
  );

  base.collectibles.push(
    {
      ...(getCatalogItem('lightSeedShard')!.createObject(
        tileSize * 12,
        groundY - tileSize * 3,
        tileSize
      ) as CollectibleData),
      id: 'light-seed-01'
    },
    {
      ...(getCatalogItem('lightSeedShard')!.createObject(
        tileSize * 27,
        groundY - tileSize * 6,
        tileSize
      ) as CollectibleData),
      id: 'light-seed-02'
    }
  );
  base.checkpoints.push({
    ...(getCatalogItem('glowLanternCheckpoint')!.createObject(
      tileSize * 55,
      groundY - tileSize * 2,
      tileSize
    ) as CheckpointData),
    id: 'glow-lantern-01'
  });

  if (templateId === 'floatingChallenge') {
    base.platforms.push({
      ...(getCatalogItem('movingBreezePlatform')!.createObject(
        tileSize * 62,
        groundY - tileSize * 6,
        tileSize
      ) as PlatformData),
      id: 'moving-breeze-01'
    });
  }

  if (templateId === 'speedRunStrip') {
    base.name = options.name ?? 'Speed Run Strip';
    base.description = options.description ?? 'A lean route for quick timer challenges.';
    base.metadata.tags = ['speedrun'];
    base.metadata.difficulty = 'normal';
    base.terrain = base.terrain.slice(0, 3);
    base.collectibles = [];
    base.checkpoints = [];
    base.hazards.push({
      ...(getCatalogItem('gustVent')!.createObject(tileSize * 36, groundY - tileSize, tileSize) as HazardData),
      id: 'gust-vent-01'
    });
  }

  if (templateId === 'enemyPractice') {
    base.enemies.push({
      ...(getCatalogItem('driftBug')!.createObject(
        tileSize * 45,
        groundY - tileSize * 2,
        tileSize
      ) as EnemyData),
      id: 'drift-bug-01'
    });
    base.hazards.push({
      ...(getCatalogItem('thornCrystal')!.createObject(
        tileSize * 67,
        groundY - tileSize,
        tileSize
      ) as HazardData),
      id: 'thorn-crystal-01'
    });
  } else {
    base.enemies.push({
      ...(getCatalogItem('driftBug')!.createObject(
        tileSize * 46,
        groundY - tileSize * 2,
        tileSize
      ) as EnemyData),
      id: 'drift-bug-01'
    });
  }

  return base;
}

function cryptoSafeId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
