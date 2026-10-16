import type { LevelData, LevelObject, TerrainRect } from '../../game/data/LevelData';
import { getLevelObjects } from '../../game/data/LevelData';
import type { ValidationResult } from '../schemas/levelDefaults';
import { parseLessonPackage } from '../../game/music/lessonPackage';

export function validateEditorLevel(level: LevelData): ValidationResult[] {
  const results: ValidationResult[] = [];
  const add = (severity: ValidationResult['severity'], message: string, object?: LevelObject) => {
    results.push({
      id: `${severity}-${results.length + 1}`,
      severity,
      message,
      objectId: object?.id,
      x: object?.x,
      y: object?.y
    });
  };

  if (level.music !== undefined) {
    const music = parseLessonPackage(level.music);
    if (!music.ok) add('error', music.error);
    else add('info', `음악 안전 방 ${music.value.exercises.length}개. 별도 생성된 음블록과 안전 선택으로 플레이합니다.`);
  }

  if (!level.playerSpawn) {
    add('error', 'Place exactly one Player Spawn.');
  }

  if (!level.finishGate) {
    add('error', 'Place exactly one Wind Gate Finish.');
  }

  const width = level.world.widthTiles * level.world.tileSize;
  const height = level.world.heightTiles * level.world.tileSize;
  if (level.world.widthTiles < 20 || level.world.widthTiles > 300 || level.world.heightTiles < 12 || level.world.heightTiles > 80) {
    add('error', 'Level width and height must stay within supported editor bounds.');
  }

  const ids = new Set<string>();
  for (const object of getLevelObjects(level)) {
    if (ids.has(object.id)) {
      add('error', `Duplicate object id "${object.id}".`, object);
    }
    ids.add(object.id);

    if (object.x < 0 || object.y < 0 || object.x > width || object.y > height) {
      add('error', `Object "${object.id}" is outside the level bounds.`, object);
    }
  }

  for (const rect of level.terrain) {
    if (rect.widthTiles <= 0 || rect.heightTiles <= 0 || rect.width <= 0 || rect.height <= 0) {
      add('error', `Terrain "${rect.id}" must have positive width and height.`, rect);
    }
  }

  for (const platform of level.platforms) {
    if (platform.type === 'movingBreezePlatform' && platform.waypoints.length < 2) {
      add('error', `Moving platform "${platform.id}" needs at least two waypoints.`, platform);
    }
  }

  if (level.finishGate && isInsideSolidTerrain(level.finishGate, level.terrain)) {
    add('error', 'Wind Gate Finish is buried inside solid terrain.', level.finishGate);
  }

  if (level.playerSpawn && isInsideSolidTerrain(level.playerSpawn, level.terrain)) {
    add('error', 'Player Spawn is inside solid terrain.', level.playerSpawn);
  }

  if (level.checkpoints.length === 0 && !level.music) {
    add('warning', 'Add at least one Glow Lantern Checkpoint for longer routes.');
  }

  if (level.collectibles.length === 0 && !level.music) {
    add('warning', 'Add at least one Light Seed Shard to reward exploration.');
  }

  if (level.enemies.length === 0 && !level.music) {
    add('warning', 'No enemies are placed yet.');
  }

  if (level.playerSpawn) {
    const nearSpawn = level.hazards.some(
      (hazard) => Math.hypot(hazard.x - level.playerSpawn!.x, hazard.y - level.playerSpawn!.y) < level.world.tileSize * 3
    );
    if (nearSpawn) {
      add('warning', 'A hazard is very close to the Player Spawn.', level.playerSpawn);
    }
  }

  if (level.world.widthTiles > 180) {
    add('warning', 'Very wide levels can be slower on mobile devices.');
  }

  if (level.playerSpawn && level.finishGate) {
    const dx = Math.abs(level.finishGate.x - level.playerSpawn.x);
    const dy = level.playerSpawn.y - level.finishGate.y;
    if (dx > level.world.tileSize * 80 && level.platforms.length + level.terrain.length < 4) {
      add('warning', 'The route to the Wind Gate is not clear. Add more platforms or test play it.');
    }
    if (dy > level.world.tileSize * 8) {
      add('warning', 'The Wind Gate may be too high to reach without intermediate platforms.');
    }
  }

  add('info', `Estimated shards: ${level.collectibles.length}.`);
  add('info', `Enemies: ${level.enemies.length}.`);
  add('info', `Hazards: ${level.hazards.length}.`);

  return results;
}

function isInsideSolidTerrain(object: LevelObject, terrain: TerrainRect[]): boolean {
  return terrain.some((rect) => {
    if (rect.collision !== 'solid') {
      return false;
    }

    return (
      object.x >= rect.x - rect.width / 2 &&
      object.x <= rect.x + rect.width / 2 &&
      object.y >= rect.y - rect.height / 2 &&
      object.y <= rect.y + rect.height / 2
    );
  });
}
