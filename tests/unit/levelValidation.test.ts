import { describe, expect, it } from 'vitest';
import { level1 } from '../../src/game/data/levels/level1';
import type { LevelData } from '../../src/game/types';
import { validateLevelData } from '../../src/game/systems/levelValidation';

describe('level validation', () => {
  it('accepts the first stage data', () => {
    expect(validateLevelData(level1)).toEqual([]);
  });

  it('requires start, checkpoint, and finish to form a basic route', () => {
    expect(level1.start.x).toBeLessThan(level1.finishGate.x);
    expect(level1.checkpoints.length).toBeGreaterThan(0);
    expect(level1.terrain.length).toBeGreaterThan(0);
  });

  it('includes interactive rune boxes embedded between sky bricks', () => {
    const runeBoxes = level1.terrain.filter((terrain) => terrain.kind === 'runeBox');
    const skyBricks = level1.terrain.filter((terrain) => terrain.kind === 'skyBrick');

    expect(runeBoxes.length).toBeGreaterThanOrEqual(5);
    expect(skyBricks.length).toBeGreaterThan(runeBoxes.length);
    expect(
      runeBoxes.every((runeBox) =>
        skyBricks.some(
          (skyBrick) => skyBrick.y === runeBox.y && Math.abs(skyBrick.x - runeBox.x) === 44
        )
      )
    ).toBe(true);
  });

  it('keeps enough headroom below floating block clusters for jumping', () => {
    const floatingBlocks = level1.terrain.filter(
      (terrain) => terrain.kind === 'skyBrick' || terrain.kind === 'runeBox'
    );
    const standingSurfaces = level1.terrain.filter(
      (terrain) => terrain.kind !== 'skyBrick' && terrain.kind !== 'runeBox'
    );
    const minJumpHeadroom = 84;

    const tightSpots = floatingBlocks.flatMap((block) =>
      standingSurfaces
        .filter((surface) => {
          const horizontalOverlap =
            Math.min(block.x + block.width / 2, surface.x + surface.width / 2) -
            Math.max(block.x - block.width / 2, surface.x - surface.width / 2);

          return horizontalOverlap > 0 && surface.y > block.y;
        })
        .map((surface) => ({
          block: block.id,
          surface: surface.id,
          headroom: surface.y - surface.height / 2 - (block.y + block.height / 2)
        }))
        .filter(({ headroom }) => headroom < minJumpHeadroom)
    );

    expect(tightSpots).toEqual([]);
  });

  it('detects duplicate entity ids', () => {
    const duplicated: LevelData = {
      ...level1,
      collectibles: [
        ...level1.collectibles,
        { ...level1.collectibles[0], x: level1.collectibles[0].x + 12 }
      ]
    };

    expect(validateLevelData(duplicated)).toContain(`Duplicate id: ${level1.collectibles[0].id}`);
  });
});
