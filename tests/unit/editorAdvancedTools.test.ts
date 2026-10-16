import { describe, expect, test } from 'vitest';
import { createLevelFromTemplate } from '../../src/editor/data/levelTemplates';
import { toRuntimeLevelData } from '../../src/game/data/LevelData';
import {
  addWaypoint,
  alignObjects,
  distributeObjects,
  estimateDifficulty,
  getDefaultLayerStates,
  moveWaypoint,
  removeWaypoint,
  updateLayerState,
  updateManyObjects
} from '../../src/editor/systems/EditorAdvancedTools';
import { findLevelObject } from '../../src/editor/utils/levelObjects';
import type { PlatformData } from '../../src/game/data/LevelData';

describe('advanced editor tools', () => {
  test('creates editable layer state and preserves an active unlocked layer', () => {
    const layers = getDefaultLayerStates();
    const hidden = updateLayerState(layers, 'enemies', { visible: false });
    const lockedActive = updateLayerState(hidden, 'enemies', { active: true });

    expect(hidden.enemies.visible).toBe(false);
    expect(lockedActive.enemies.active).toBe(true);
    expect(Object.values(lockedActive).filter((layer) => layer.active)).toHaveLength(1);
  });

  test('edits moving platform waypoints without mutating the source platform', () => {
    const level = createLevelFromTemplate('floatingChallenge');
    const platform = level.platforms.find(
      (item) => item.type === 'movingBreezePlatform'
    ) as PlatformData;

    const added = addWaypoint(platform, { x: platform.x + 96, y: platform.y - 64 });
    const moved = moveWaypoint(added, 1, { x: platform.x + 64, y: platform.y - 32 });
    const removed = removeWaypoint(moved, 0);

    expect(platform.waypoints).toHaveLength(2);
    expect(added.waypoints).toHaveLength(3);
    expect(moved.waypoints[1]).toEqual({ x: platform.x + 64, y: platform.y - 32 });
    expect(removed.waypoints).toHaveLength(2);
  });

  test('runtime level data preserves moving platform waypoint paths', () => {
    const level = createLevelFromTemplate('floatingChallenge');
    const platform = level.platforms.find(
      (item) => item.type === 'movingBreezePlatform'
    ) as PlatformData;
    platform.waypoints = [...platform.waypoints, { x: platform.x + 180, y: platform.y - 80 }];
    platform.mode = 'loop';

    const runtime = toRuntimeLevelData(level);

    expect(runtime.movingPlatforms[0].waypoints).toEqual(platform.waypoints);
    expect(runtime.movingPlatforms[0].mode).toBe('loop');
  });

  test('applies common multi-select changes, alignment, and distribution', () => {
    const level = createLevelFromTemplate('starterPlains');
    const ids = level.terrain.slice(0, 3).map((object) => object.id);
    const changed = updateManyObjects(level, ids, { visible: false });
    const aligned = alignObjects(changed, ids, 'top');
    const distributed = distributeObjects(aligned, ids, 'horizontal');

    const objects = ids.map((id) => findLevelObject(distributed, id)!);
    expect(objects.every((object) => object.visible === false)).toBe(true);
    expect(new Set(objects.map((object) => object.y - object.height / 2)).size).toBe(1);
    expect(objects[1].x - objects[0].x).toBe(objects[2].x - objects[1].x);
  });

  test('estimates difficulty from level content and spacing signals', () => {
    const easy = estimateDifficulty(createLevelFromTemplate('emptyIsland'));
    const hard = estimateDifficulty(createLevelFromTemplate('enemyPractice'));

    expect(easy.rating).toBe('easy');
    expect(hard.enemyCount).toBeGreaterThanOrEqual(1);
    expect(hard.hazardCount).toBeGreaterThanOrEqual(1);
    expect(['normal', 'hard', 'experimental']).toContain(hard.rating);
  });
});
