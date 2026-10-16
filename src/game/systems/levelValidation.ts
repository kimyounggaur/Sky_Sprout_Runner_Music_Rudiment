import type { LevelData } from '../types';

export function validateLevelData(level: LevelData): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const register = (id: string) => {
    if (ids.has(id)) {
      errors.push(`Duplicate id: ${id}`);
    }
    ids.add(id);
  };

  if (level.start.x >= level.finishGate.x) {
    errors.push('Start must be left of finish gate.');
  }

  if (level.world.width <= level.finishGate.x || level.world.height <= 0) {
    errors.push('World bounds must contain the finish gate.');
  }

  for (const collection of [
    level.terrain,
    level.movingPlatforms,
    level.collectibles,
    level.powerUps,
    level.enemies,
    level.hazards,
    level.checkpoints,
    [level.finishGate]
  ]) {
    for (const item of collection) {
      register(item.id);
    }
  }

  if (level.checkpoints.length < 1) {
    errors.push('At least one checkpoint is required.');
  }

  const hasStartGround = level.terrain.some(
    (terrain) =>
      Math.abs(terrain.x - level.start.x) < terrain.width / 2 &&
      terrain.y > level.start.y &&
      terrain.y - terrain.height / 2 - level.start.y < 140
  );

  if (!hasStartGround) {
    errors.push('No reasonable landing surface under the start point.');
  }

  const hasFinishGround = level.terrain.some(
    (terrain) =>
      Math.abs(terrain.x - level.finishGate.x) < terrain.width / 2 &&
      terrain.y > level.finishGate.y
  );

  if (!hasFinishGround) {
    errors.push('No ground near the finish gate.');
  }

  return errors;
}
