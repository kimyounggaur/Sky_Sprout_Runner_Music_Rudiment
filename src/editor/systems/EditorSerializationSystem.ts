import type { LevelData } from '../../game/data/LevelData';
import { migrateLevelData } from '../schemas/levelMigrations';

export type ImportLevelResult =
  | { ok: true; level: LevelData }
  | { ok: false; error: string };

export function serializeLevel(level: LevelData, pretty = true): string {
  return JSON.stringify(level, null, pretty ? 2 : 0);
}

export function importLevelFromJson(json: string): ImportLevelResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, error: 'The selected file is not valid JSON.' };
  }

  return migrateLevelData(parsed);
}

export function safeLevelFileName(name: string): string {
  const safeName = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/gi, '-')
    .replace(/^-+|-+$/g, '');

  return `sky-forge-level-${safeName || 'untitled'}.json`;
}
