import type { EditorLayer, LevelData, LevelObject, PlatformData } from '../../game/data/LevelData';
import { findLevelObject, updateLevelObject } from '../utils/levelObjects';

export interface LayerState {
  id: EditorLayer;
  label: string;
  visible: boolean;
  locked: boolean;
  active: boolean;
}

export type LayerStateMap = Record<EditorLayer, LayerState>;
export type Alignment = 'left' | 'right' | 'top' | 'bottom';
export type DistributionAxis = 'horizontal' | 'vertical';

export interface DifficultyEstimate {
  rating: LevelData['metadata']['difficulty'];
  enemyCount: number;
  hazardCount: number;
  jumpGapEstimate: number;
  checkpointSpacing: number;
  levelLengthTiles: number;
  score: number;
}

const layerLabels: Record<EditorLayer, string> = {
  terrain: 'Terrain',
  platforms: 'Platforms',
  items: 'Items',
  enemies: 'Enemies',
  hazards: 'Hazards',
  utilities: 'Utilities',
  decorations: 'Decorations'
};

export const editorLayerOrder = Object.keys(layerLabels) as EditorLayer[];

export function getDefaultLayerStates(): LayerStateMap {
  return editorLayerOrder.reduce((layers, id, index) => {
    layers[id] = {
      id,
      label: layerLabels[id],
      visible: true,
      locked: false,
      active: index === 0
    };
    return layers;
  }, {} as LayerStateMap);
}

export function updateLayerState(
  layers: LayerStateMap,
  layerId: EditorLayer,
  changes: Partial<Pick<LayerState, 'visible' | 'locked' | 'active'>>
): LayerStateMap {
  const next = cloneLayers(layers);
  next[layerId] = { ...next[layerId], ...changes };

  if (changes.active) {
    for (const id of editorLayerOrder) {
      next[id] = { ...next[id], active: id === layerId };
    }
  }

  if (changes.locked && next[layerId].active) {
    const fallback = editorLayerOrder.find((id) => !next[id].locked) ?? 'terrain';
    for (const id of editorLayerOrder) {
      next[id] = { ...next[id], active: id === fallback };
    }
  }

  return next;
}

export function getActiveLayer(layers: LayerStateMap): EditorLayer {
  return editorLayerOrder.find((id) => layers[id].active) ?? 'terrain';
}

export function isObjectEditable(object: LevelObject, layers: LayerStateMap): boolean {
  const layer = layers[object.layer];
  return Boolean(object.visible && !object.locked && layer.visible && !layer.locked);
}

export function addWaypoint(platform: PlatformData, waypoint: { x: number; y: number }): PlatformData {
  return {
    ...platform,
    waypoints: [...platform.waypoints, waypoint]
  };
}

export function moveWaypoint(
  platform: PlatformData,
  index: number,
  waypoint: { x: number; y: number }
): PlatformData {
  if (index < 0 || index >= platform.waypoints.length) {
    return platform;
  }

  return {
    ...platform,
    waypoints: platform.waypoints.map((current, currentIndex) =>
      currentIndex === index ? waypoint : current
    )
  };
}

export function removeWaypoint(platform: PlatformData, index: number): PlatformData {
  if (platform.waypoints.length <= 2 || index < 0 || index >= platform.waypoints.length) {
    return platform;
  }

  return {
    ...platform,
    waypoints: platform.waypoints.filter((_, currentIndex) => currentIndex !== index)
  };
}

export function updateManyObjects(
  level: LevelData,
  ids: string[],
  changes: Partial<LevelObject>
): LevelData {
  return ids.reduce((current, id) => updateLevelObject(current, id, changes), level);
}

export function alignObjects(level: LevelData, ids: string[], alignment: Alignment): LevelData {
  const objects = ids.map((id) => findLevelObject(level, id)).filter(Boolean) as LevelObject[];
  if (objects.length < 2) {
    return level;
  }

  const target =
    alignment === 'left'
      ? Math.min(...objects.map((object) => object.x - object.width / 2))
      : alignment === 'right'
        ? Math.max(...objects.map((object) => object.x + object.width / 2))
        : alignment === 'top'
          ? Math.min(...objects.map((object) => object.y - object.height / 2))
          : Math.max(...objects.map((object) => object.y + object.height / 2));

  return objects.reduce((current, object) => {
    const changes =
      alignment === 'left'
        ? { x: target + object.width / 2 }
        : alignment === 'right'
          ? { x: target - object.width / 2 }
          : alignment === 'top'
            ? { y: target + object.height / 2 }
            : { y: target - object.height / 2 };
    return updateLevelObject(current, object.id, changes);
  }, level);
}

export function distributeObjects(
  level: LevelData,
  ids: string[],
  axis: DistributionAxis
): LevelData {
  const objects = ids
    .map((id) => findLevelObject(level, id))
    .filter(Boolean)
    .sort((a, b) => (axis === 'horizontal' ? a!.x - b!.x : a!.y - b!.y)) as LevelObject[];
  if (objects.length < 3) {
    return level;
  }

  const first = axis === 'horizontal' ? objects[0].x : objects[0].y;
  const last = axis === 'horizontal' ? objects[objects.length - 1].x : objects[objects.length - 1].y;
  const step = (last - first) / (objects.length - 1);
  return objects.reduce((current, object, index) => {
    const value = first + step * index;
    return updateLevelObject(current, object.id, axis === 'horizontal' ? { x: value } : { y: value });
  }, level);
}

export function estimateDifficulty(level: LevelData): DifficultyEstimate {
  const enemyCount = level.enemies.length;
  const hazardCount = level.hazards.length;
  const jumpGapEstimate = estimateJumpGaps(level);
  const checkpointSpacing = estimateCheckpointSpacing(level);
  const levelLengthTiles = level.world.widthTiles;
  const hasChallengeContent = enemyCount + hazardCount + level.terrain.length + level.platforms.length > 0;
  const score =
    enemyCount * 2 +
    hazardCount * 3 +
    jumpGapEstimate * 2 +
    (hasChallengeContent && checkpointSpacing > 40 ? 2 : hasChallengeContent && checkpointSpacing > 24 ? 1 : 0) +
    (hasChallengeContent && levelLengthTiles > 140 ? 2 : hasChallengeContent && levelLengthTiles > 90 ? 1 : 0);

  return {
    rating: score <= 2 ? 'easy' : score <= 6 ? 'normal' : score <= 11 ? 'hard' : 'experimental',
    enemyCount,
    hazardCount,
    jumpGapEstimate,
    checkpointSpacing,
    levelLengthTiles,
    score
  };
}

function estimateJumpGaps(level: LevelData): number {
  const solids = [...level.terrain, ...level.platforms]
    .filter((object) => object.layer === 'platforms' || object.collision !== 'none')
    .sort((a, b) => a.x - b.x);
  let gaps = 0;
  for (let i = 1; i < solids.length; i += 1) {
    const previousRight = solids[i - 1].x + solids[i - 1].width / 2;
    const currentLeft = solids[i].x - solids[i].width / 2;
    if (currentLeft - previousRight > level.world.tileSize * 3) {
      gaps += 1;
    }
  }
  return gaps;
}

function estimateCheckpointSpacing(level: LevelData): number {
  const markers = [
    level.playerSpawn?.x ?? 0,
    ...level.checkpoints.map((checkpoint) => checkpoint.x),
    level.finishGate?.x ?? level.world.widthTiles * level.world.tileSize
  ].sort((a, b) => a - b);
  let widest = 0;
  for (let i = 1; i < markers.length; i += 1) {
    widest = Math.max(widest, markers[i] - markers[i - 1]);
  }
  return Math.round(widest / level.world.tileSize);
}

function cloneLayers(layers: LayerStateMap): LayerStateMap {
  return editorLayerOrder.reduce((next, id) => {
    next[id] = { ...layers[id] };
    return next;
  }, {} as LayerStateMap);
}
