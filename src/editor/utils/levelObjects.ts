import type {
  CheckpointData,
  DecorationData,
  EnemyData,
  FinishGateData,
  HazardData,
  LevelData,
  LevelObject,
  PlatformData,
  PlayerSpawnData,
  PowerUpData,
  TerrainRect
} from '../../game/data/LevelData';
import { getLevelObjects } from '../../game/data/LevelData';
import { deepClone } from './deepClone';

export function findLevelObject(level: LevelData, id: string): LevelObject | null {
  return getLevelObjects(level).find((object) => object.id === id) ?? null;
}

export function addLevelObject(level: LevelData, object: LevelObject): LevelData {
  const next = deepClone(level);

  switch (object.layer) {
    case 'terrain':
      next.terrain.push(object as TerrainRect);
      break;
    case 'platforms':
      next.platforms.push(object as PlatformData);
      break;
    case 'items':
      if (object.type === 'breezeOrb') {
        next.powerUps.push(object as PowerUpData);
      } else {
        next.collectibles.push(object as LevelData['collectibles'][number]);
      }
      break;
    case 'enemies':
      next.enemies.push(object as EnemyData);
      break;
    case 'hazards':
      next.hazards.push(object as HazardData);
      break;
    case 'utilities':
      if (object.type === 'playerSpawn') {
        next.playerSpawn = object as PlayerSpawnData;
      } else if (object.type === 'windGateFinish') {
        next.finishGate = object as FinishGateData;
      } else {
        next.checkpoints.push(object as CheckpointData);
      }
      break;
    case 'decorations':
      next.decorations.push(object as DecorationData);
      break;
  }

  next.updatedAt = new Date().toISOString();
  return next;
}

export function removeLevelObjects(level: LevelData, ids: string[]): LevelData {
  const idSet = new Set(ids);
  const next = deepClone(level);
  next.terrain = next.terrain.filter((object) => !idSet.has(object.id));
  next.platforms = next.platforms.filter((object) => !idSet.has(object.id));
  next.collectibles = next.collectibles.filter((object) => !idSet.has(object.id));
  next.powerUps = next.powerUps.filter((object) => !idSet.has(object.id));
  next.enemies = next.enemies.filter((object) => !idSet.has(object.id));
  next.hazards = next.hazards.filter((object) => !idSet.has(object.id));
  next.checkpoints = next.checkpoints.filter((object) => !idSet.has(object.id));
  next.decorations = next.decorations.filter((object) => !idSet.has(object.id));

  if (next.playerSpawn && idSet.has(next.playerSpawn.id)) {
    next.playerSpawn = null;
  }

  if (next.finishGate && idSet.has(next.finishGate.id)) {
    next.finishGate = null;
  }

  next.updatedAt = new Date().toISOString();
  return next;
}

export function updateLevelObject(
  level: LevelData,
  id: string,
  changes: Partial<LevelObject>
): LevelData {
  const original = findLevelObject(level, id);
  if (!original) {
    return level;
  }

  const updated = { ...original, ...changes, id, layer: original.layer, type: original.type } as LevelObject;
  return addLevelObject(removeLevelObjects(level, [id]), updated);
}

export function moveLevelObjects(level: LevelData, ids: string[], delta: { x: number; y: number }): LevelData {
  return ids.reduce(
    (current, id) => {
      const object = findLevelObject(current, id);
      if (!object || object.locked) {
        return current;
      }

      return updateLevelObject(current, id, {
        x: object.x + delta.x,
        y: object.y + delta.y
      });
    },
    level
  );
}

export function cloneObjects(level: LevelData, ids: string[]): LevelObject[] {
  return ids.flatMap((id) => {
    const object = findLevelObject(level, id);
    return object ? [deepClone(object)] : [];
  });
}
