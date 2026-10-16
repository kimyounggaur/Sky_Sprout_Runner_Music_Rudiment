import { describe, expect, it } from 'vitest';
import { createLevelFromTemplate } from '../../src/editor/data/levelTemplates';
import { migrateLevelData } from '../../src/editor/schemas/levelMigrations';
import { importLevelFromJson, serializeLevel } from '../../src/editor/systems/EditorSerializationSystem';
import { toRuntimeLevelData } from '../../src/game/data/LevelData';
import { getExercise } from '../../src/game/music/curriculum';
import { evaluateAnswer, spelledPitchToMidi, type Exercise } from '../../src/game/music/domain';
import { validateExercise } from '../../src/game/music/contentValidation';
import { createMusicTemplate, parseLessonPackage, type LessonPackage } from '../../src/game/music/lessonPackage';

const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const exercise = (id: string): Exercise => {
  const found = getExercise(id);
  if (!found) throw new Error(`Missing curriculum fixture: ${id}`);
  return copy(found);
};
const packageFixture = (): LessonPackage => ({ schemaVersion: 1, safeRoom: true, exercises: [
  exercise('f02-c'), exercise('f02-f'), exercise('f17-dim'), exercise('j09-substitution'),
  exercise('j02-guide-d-g'), exercise('a07-targets'), exercise('a16-eight-bars'), exercise('x03-cents'),
] });

describe('music extension editor, migration and runtime integration', () => {
  it('keeps old schema-v1 levels valid and adds no implicit music extension', () => {
    const oldLevel = createLevelFromTemplate('starterPlains', { name: '기존 일반 레벨' });
    const original = serializeLevel(oldLevel);
    const imported = importLevelFromJson(original);
    expect(imported.ok).toBe(true);
    if (!imported.ok) return;
    expect(imported.level.schemaVersion).toBe(1);
    expect(imported.level).not.toHaveProperty('music');
    expect(toRuntimeLevelData(imported.level)).not.toHaveProperty('music');
    expect(imported.level.terrain).toEqual(oldLevel.terrain);
    expect(imported.level.collectibles).toEqual(oldLevel.collectibles);
    expect(imported.level.playerSpawn).toEqual(oldLevel.playerSpawn);
    expect(serializeLevel(oldLevel)).toBe(original);
  });

  it('preserves music targets, alternatives, voices, constraints and spelling through JSON and runtime conversion', () => {
    const level = createLevelFromTemplate('emptyIsland', { name: '음악 안전 섬' });
    level.music = packageFixture();
    const before = copy(level.music);
    const imported = importLevelFromJson(serializeLevel(level));
    expect(imported.ok).toBe(true);
    if (!imported.ok) return;
    expect(imported.level.music).toEqual(before);
    const runtime = toRuntimeLevelData(imported.level);
    expect(runtime.music).toEqual(before);
    expect(runtime.music).not.toBe(imported.level.music);
    expect(runtime.music?.exercises[0]).not.toBe(imported.level.music?.exercises[0]);
    expect(runtime.music?.exercises[1].target).toEqual(['F4', 'A4', 'C5']);
    expect(runtime.music?.exercises[3].alternatives).toEqual([['dm', 'g', 'c']]);
    expect(runtime.music?.exercises[4].voiceSource).toEqual({ lower: 'F3', upper: 'C4' });
    expect(runtime.music?.exercises[5].constraints?.targetPositions?.[8]).toEqual(['E4']);
    expect(runtime.music?.exercises[6].harmony).toHaveLength(11);
    expect(runtime.music?.exercises[7].notes.map(note => note.centsOffset ?? 0)).toEqual([-25, 0, 25]);
    expect(level.music).toEqual(before);
  });

  it('parses a defensive copy so teacher edits cannot mutate previous package snapshots', () => {
    const original = packageFixture();
    const parsed = parseLessonPackage(original);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    parsed.value.exercises[0].title = '편집된 활동';
    expect(original.exercises[0].title).not.toBe('편집된 활동');
    expect(parsed.value.exercises[0].target).not.toBe(original.exercises[0].target);
  });

  it.each([2, 99, '1', undefined])('rejects unsupported music version %s without stripping or mutating it', version => {
    const level = createLevelFromTemplate('emptyIsland');
    const input = { ...level, music: { ...packageFixture(), schemaVersion: version } };
    const before = JSON.stringify(input);
    const migrated = migrateLevelData(input);
    expect(migrated.ok).toBe(false);
    if (!migrated.ok) expect(migrated.error).toContain('music.schemaVersion');
    expect(JSON.stringify(input)).toBe(before);
    expect(importLevelFromJson(before).ok).toBe(false);
  });

  it.each([
    { schemaVersion: 1, safeRoom: false, exercises: [exercise('f02-c')] },
    { schemaVersion: 1, safeRoom: true, exercises: [] },
    { schemaVersion: 1, safeRoom: true, exercises: [exercise('f02-c'), exercise('f02-c')] },
    { schemaVersion: 1, safeRoom: true, exercises: [{ ...exercise('f02-c'), target: ['not-on-screen'] }] },
    { schemaVersion: 1, safeRoom: true, exercises: [{ ...exercise('f02-c'), notes: [{ id: 'C4', letter: 'C', accidental: 0, octave: 4, midi: 72 }] }] },
  ])('blocks invalid music package and retains the original teacher data', music => {
    const input = { ...createLevelFromTemplate('emptyIsland'), music };
    const before = JSON.stringify(input);
    expect(parseLessonPackage(music).ok).toBe(false);
    expect(migrateLevelData(input).ok).toBe(false);
    expect(JSON.stringify(input)).toBe(before);
  });

  it('distinguishes the level schema version from the optional music version', () => {
    const input = { ...createLevelFromTemplate('emptyIsland'), schemaVersion: 2, music: packageFixture() };
    const migrated = migrateLevelData(input);
    expect(migrated).toEqual({ ok: false, error: 'Sky Forge Editor cannot open schema version 2.' });
  });

  it('accepts 100 distinct lessons and blocks a 101st before saving the package', () => {
    const lessons = Array.from({ length: 100 }, (_, index) => ({ ...exercise('f02-c'), id: `teacher-limit-${index}` }));
    const original = { schemaVersion: 1, safeRoom: true, exercises: lessons };
    expect(parseLessonPackage(original).ok).toBe(true);
    const overLimit = { ...original, exercises: [...lessons, { ...exercise('f02-f'), id: 'teacher-limit-100' }] };
    expect(parseLessonPackage(overLimit).ok).toBe(false);
    expect(original.exercises).toHaveLength(100);
  });
});

describe('deterministic local music template generation', () => {
  it.each(['f02-c', 'f02-f'])('preserves exact pitch intervals, spelling and source data for %s', id => {
    const source = exercise(id), before = copy(source);
    for (const seed of [-11, -1, 0, 1, 2, 3, 4, 5, 17, 101]) {
      const generated = createMusicTemplate(seed, source);
      expect(generated).toEqual(createMusicTemplate(seed, source));
      expect(generated.notes.map(note => note.midi - spelledPitchToMidi(note))).toEqual(generated.notes.map(() => 0));
      const shift = generated.notes[0].midi - source.notes[0].midi;
      expect(generated.notes.every((note, index) => note.midi - source.notes[index].midi === shift)).toBe(true);
      expect(generated.target).toEqual(source.target);
      expect(generated.id).not.toBe(source.id);
      expect(generated.notes).not.toBe(source.notes);
      expect(evaluateAnswer(generated, generated.target).completed).toBe(true);
      expect(validateExercise(generated).filter(issue => issue.severity === 'error')).toEqual([]);
      expect(parseLessonPackage({ schemaVersion: 1, safeRoom: true, exercises: [generated] }).ok).toBe(true);
    }
    expect(source).toEqual(before);
  });

  it('creates different transpositions for different template seed classes', () => {
    const source = exercise('f02-c');
    expect(createMusicTemplate(1, source).notes.map(note => note.midi)).toEqual([62, 66, 69]);
    expect(createMusicTemplate(2, source).notes.map(note => note.midi)).toEqual([63, 67, 70]);
    expect(createMusicTemplate(3, source).notes.map(note => note.midi)).toEqual([65, 69, 72]);
    expect(createMusicTemplate(4, source).notes.map(note => note.midi)).toEqual([67, 71, 74]);
  });

  it('rejects unsupported template contracts and non-integer seeds', () => {
    expect(() => createMusicTemplate(1.5, exercise('f02-c'))).toThrow();
    expect(() => createMusicTemplate(Infinity, exercise('f02-c'))).toThrow();
    expect(() => createMusicTemplate(1, exercise('j02-guide-d-g'))).toThrow();
    expect(() => createMusicTemplate(1, exercise('a16-eight-bars'))).toThrow();
  });
});
