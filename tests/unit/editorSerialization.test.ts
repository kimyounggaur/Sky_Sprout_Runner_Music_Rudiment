import { describe, expect, it } from 'vitest';
import { createLevelFromTemplate } from '../../src/editor/data/levelTemplates';
import {
  importLevelFromJson,
  serializeLevel
} from '../../src/editor/systems/EditorSerializationSystem';
import { validateEditorLevel } from '../../src/editor/systems/EditorValidationSystem';

describe('editor serialization', () => {
  it('round trips level data through JSON', () => {
    const level = createLevelFromTemplate('starterPlains', {
      name: 'Serialization Meadow',
      widthTiles: 90,
      heightTiles: 24
    });

    const imported = importLevelFromJson(serializeLevel(level));
    expect(imported.ok).toBe(true);
    if (imported.ok) {
      expect(imported.level.name).toBe('Serialization Meadow');
      expect(imported.level.schemaVersion).toBe(1);
      expect(validateEditorLevel(imported.level).filter((result) => result.severity === 'error')).toEqual([]);
    }
  });

  it('returns friendly errors for invalid JSON', () => {
    expect(importLevelFromJson('{not-json')).toEqual({
      ok: false,
      error: 'The selected file is not valid JSON.'
    });
  });

  it('rejects unsupported schema versions', () => {
    const level = createLevelFromTemplate('emptyIsland', { name: 'Future Island' });
    const imported = importLevelFromJson(JSON.stringify({ ...level, schemaVersion: 99 }));

    expect(imported).toEqual({
      ok: false,
      error: 'Sky Forge Editor cannot open schema version 99.'
    });
  });
});
