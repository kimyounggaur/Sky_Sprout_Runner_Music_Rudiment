import { describe, expect, test } from 'vitest';
import { createLevelFromTemplate } from '../../src/editor/data/levelTemplates';
import {
  EDITOR_STORAGE_KEYS,
  EditorPersistenceSystem,
  type StorageLike
} from '../../src/editor/systems/EditorPersistenceSystem';

class MemoryStorage implements StorageLike {
  private values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

describe('advanced editor persistence', () => {
  test('stores compact summaries with records and generated thumbnails', () => {
    const storage = new MemoryStorage();
    const persistence = new EditorPersistenceSystem(storage);
    const saved = persistence.saveLevel(createLevelFromTemplate('starterPlains'));

    persistence.recordPlayResult(saved.id, { cleared: true, elapsedSeconds: 42, score: 1200 });
    persistence.saveThumbnail(saved.id, 'data:image/png;base64,' + 'a'.repeat(120));

    const summary = persistence.listLevels()[0];
    expect(summary.bestTimeSeconds).toBe(42);
    expect(summary.bestScore).toBe(1200);
    expect(summary.thumbnail).toContain('thumb://generated/');
  });

  test('survives corrupt index and failed localStorage writes', () => {
    const storage = new MemoryStorage();
    storage.setItem(EDITOR_STORAGE_KEYS.index, '{bad-json');
    const persistence = new EditorPersistenceSystem(storage);

    expect(persistence.listLevels()).toEqual([]);
    storage.setItem = () => {
      throw new DOMException('quota', 'QuotaExceededError');
    };

    expect(() => persistence.saveLevel(createLevelFromTemplate('emptyIsland'))).not.toThrow();
  });
});
