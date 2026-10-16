import { describe, expect, it } from 'vitest';
import { getExercise } from '../../src/game/music/curriculum';
import { validateExercise } from '../../src/game/music/contentValidation';
import { evaluateAnswer, type Exercise } from '../../src/game/music/domain';
import { validateSoundSchedule } from '../../src/game/music/audio';
import { isMusicFeatureEnabled } from '../../src/game/music/feature';

describe('teacher purpose and audio bounds', () => {
  it('has a non-destructive flag-off fallback', () => {
    expect(isMusicFeatureEnabled()).toBe(true);
    expect(isMusicFeatureEnabled('false')).toBe(false);
    expect(isMusicFeatureEnabled(undefined, '?music=off')).toBe(false);
  });
  it('blocks a declared free creation goal evaluated by an exact pattern', () => {
    const exercise: Exercise = { ...getExercise('f02-c')!, learningPurpose: 'create_phrase' };
    expect(validateExercise(exercise)).toContainEqual(expect.objectContaining({ severity: 'error', path: 'kind' }));
    expect(validateExercise({ ...exercise, learningPurpose: 'follow_pattern' }).filter(i => i.severity === 'error')).toEqual([]);
  });
  it('does not accept visible answers as listening even when the caller claims valid audio', () => {
    const original = getExercise('f01-listen-1')!;
    expect(original).toBeDefined();
    const exercise: Exercise = { ...original, answerDisplay: 'visible' };
    expect(validateExercise(exercise)).toContainEqual(expect.objectContaining({ severity: 'error', path: 'answerDisplay' }));
    expect(evaluateAnswer(exercise, exercise.target, { audioAvailable: true, muted: false, interrupted: false, answerExposed: false, timingReliable: false }).outcome).toBe('unmeasured');
  });
  it('bounds overlapping sound nodes before audio allocations', () => {
    const chord = { notes: Array.from({ length: 12 }, () => ({ midi: 60 })), onsetBeats: 0, durationBeats: 1 };
    expect(() => validateSoundSchedule([chord, chord, chord])).toThrow('32');
    expect(() => validateSoundSchedule([chord, { ...chord, onsetBeats: 1 }, { ...chord, onsetBeats: 2 }])).not.toThrow();
    expect(() => validateSoundSchedule([{ ...chord, velocity: NaN }])).toThrow();
  });
});
