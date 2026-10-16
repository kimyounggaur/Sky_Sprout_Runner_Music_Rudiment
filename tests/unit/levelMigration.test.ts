import { describe, expect, it } from 'vitest';
import { createLevelFromTemplate } from '../../src/editor/data/levelTemplates';
import { migrateLevelData } from '../../src/editor/schemas/levelMigrations';

describe('level migration', () => {
  it('keeps schema version 1 levels unchanged except for missing optional defaults', () => {
    const level = createLevelFromTemplate('emptyIsland', { name: 'Migration Island' });
    const migrated = migrateLevelData({ ...level, metadata: undefined });

    expect(migrated.ok).toBe(true);
    if (migrated.ok) {
      expect(migrated.level.schemaVersion).toBe(1);
      expect(migrated.level.metadata.tags).toEqual([]);
      expect(migrated.level.metadata.difficulty).toBe('normal');
    }
  });

  it('rejects unknown future versions with a friendly error', () => {
    const level = createLevelFromTemplate('emptyIsland', { name: 'Too New' });
    const migrated = migrateLevelData({ ...level, schemaVersion: 2 });

    expect(migrated).toEqual({
      ok: false,
      error: 'Sky Forge Editor cannot open schema version 2.'
    });
  });
});
