import { describe, expect, it } from 'vitest';
import { createLevelFromTemplate } from '../../src/editor/data/levelTemplates';
import { validateEditorLevel } from '../../src/editor/systems/EditorValidationSystem';

function messagesFor(level = createLevelFromTemplate('starterPlains')) {
  return validateEditorLevel(level).map((result) => `${result.severity}:${result.message}`);
}

describe('editor validation', () => {
  it('accepts a valid starter template without errors', () => {
    const errors = validateEditorLevel(createLevelFromTemplate('starterPlains')).filter(
      (result) => result.severity === 'error'
    );

    expect(errors).toEqual([]);
  });

  it('requires one player spawn and one finish gate', () => {
    const level = createLevelFromTemplate('emptyIsland');
    level.playerSpawn = null;
    level.finishGate = null;

    expect(messagesFor(level)).toContain('error:Place exactly one Player Spawn.');
    expect(messagesFor(level)).toContain('error:Place exactly one Wind Gate Finish.');
  });

  it('detects duplicate object ids and objects outside bounds', () => {
    const level = createLevelFromTemplate('starterPlains');
    level.collectibles.push({ ...level.collectibles[0], x: level.world.widthTiles * level.world.tileSize + 40 });

    expect(messagesFor(level)).toContain(`error:Duplicate object id "${level.collectibles[0].id}".`);
    expect(messagesFor(level)).toContain(`error:Object "${level.collectibles[0].id}" is outside the level bounds.`);
  });

  it('detects moving platforms with too few waypoints', () => {
    const level = createLevelFromTemplate('floatingChallenge');
    level.platforms[0].waypoints = [{ x: level.platforms[0].x, y: level.platforms[0].y }];

    expect(messagesFor(level)).toContain(
      `error:Moving platform "${level.platforms[0].id}" needs at least two waypoints.`
    );
  });

  it('warns when hazards are too close to spawn', () => {
    const level = createLevelFromTemplate('starterPlains');
    level.hazards.push({
      id: 'near-spawn-thorn',
      type: 'thornCrystal',
      layer: 'hazards',
      x: level.playerSpawn!.x + 24,
      y: level.playerSpawn!.y,
      width: 32,
      height: 32,
      locked: false,
      visible: true,
      notes: '',
      damage: 1,
      knockbackX: 180,
      knockbackY: -160,
      respawnPlayer: true
    });

    expect(messagesFor(level)).toContain('warning:A hazard is very close to the Player Spawn.');
  });
});
