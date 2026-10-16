import { describe, expect, it } from 'vitest';
import { MUSIC_EXERCISES, MUSIC_MODULES, curriculumPitch, getExercise } from '../../src/game/music/curriculum';
import { isMusicExercise, parseExercise, validateCurriculum, validateExercise } from '../../src/game/music/contentValidation';
import { evaluateAnswer, frequencyForPitch, intervalBetween, resolvePitches, type MusicExercise } from '../../src/game/music/domain';

const exercise = (id: string): MusicExercise => {
  const item = getExercise(id);
  if (!item) throw new Error(`Missing fixture ${id}`);
  return item;
};
const errors = (value: unknown) => validateExercise(value).filter(issue => issue.severity === 'error');

describe('76-module curriculum traceability and executable witnesses', () => {
  it('tracks exactly F01–F24, J01–J28, A01–A16 and X01–X08 without silently marking expert completion', () => {
    const expected = [['F', 24], ['J', 28], ['A', 16], ['X', 8]].flatMap(([prefix, count]) => Array.from({ length: Number(count) }, (_, i) => `${prefix}${String(i + 1).padStart(2, '0')}`));
    expect(MUSIC_MODULES.map(module => module.id)).toEqual(expected);
    expect(MUSIC_MODULES).toHaveLength(76);
    for (const module of MUSIC_MODULES) {
      expect(module.scopeNote.length).toBeGreaterThan(15);
      if (module.status === 'scoped_example') {
        expect(module.exerciseIds.length).toBeGreaterThan(0);
        expect(module.exerciseIds.every(id => exercise(id).moduleId === module.id)).toBe(true);
      } else expect(module.exerciseIds).toEqual([]);
      if (module.id.startsWith('J') || module.id.startsWith('A')) expect(module.reviewStatus).toBe('expert_review_required');
    }
    expect(MUSIC_MODULES.filter(module => module.status === 'deferred').map(module => module.id)).toEqual(['X07', 'X08']);
  });

  it('has no invalid pitch, missing target, contradictory or unreachable declared fixture', () => {
    expect(validateCurriculum(MUSIC_EXERCISES).filter(issue => issue.severity === 'error')).toEqual([]);
  });

  for (const item of MUSIC_EXERCISES) {
    it(`MT-${item.moduleId} / ${item.id}: declared example reaches the objective`, () => {
      expect(evaluateAnswer(item, item.target, item.kind === 'listen_identify' ? { audioAvailable: true, muted: false, interrupted: false, answerExposed: false } : {}).completed).toBe(true);
      for (const alternative of item.alternatives ?? []) expect(evaluateAnswer(item, alternative).completed).toBe(true);
      expect(item.objective).toBeTruthy();
      expect(item.explanation).toBeTruthy();
      expect(item.worldMetaphor).toBeTruthy();
      expect(item.assessmentDomain).toBeTruthy();
      expect(item.supports).toContain(item.kind === 'listen_identify' ? 'silent_unmeasured' : 'silent');
    });
  }

  it('uses pitch collection, route, voice, rhythm and genuinely constrained composition loops', () => {
    expect(new Set(MUSIC_EXERCISES.map(item => item.kind))).toEqual(new Set(['ordered_pitch', 'pitch_collection', 'notated_pitch', 'interval_route', 'rhythm_grid', 'harmony_route', 'voice_assignment', 'contextual_choice', 'creative_phrase', 'listen_identify']));
    expect(MUSIC_EXERCISES.filter(item => item.kind === 'contextual_choice').length).toBeLessThan(MUSIC_EXERCISES.length / 4);
  });
});

describe('music correctness fixtures from the supplied design', () => {
  it('MT-F01/F24 requires confirmed audio and hidden answers before recording listening success', () => {
    for (const item of MUSIC_EXERCISES.filter(candidate => candidate.kind === 'listen_identify')) {
      expect(evaluateAnswer(item, item.target).outcome).toBe('unmeasured');
      expect(evaluateAnswer(item, item.target, { audioAvailable: true, muted: true }).outcome).toBe('unmeasured');
      expect(evaluateAnswer(item, item.target, { audioAvailable: true, answerExposed: true }).outcome).toBe('unmeasured');
      expect(evaluateAnswer(item, item.target, { audioAvailable: true, interrupted: true }).outcome).toBe('unmeasured');
      expect(evaluateAnswer(item, item.target, { audioAvailable: true, muted: false, answerExposed: false, interrupted: false }).completed).toBe(true);
      expect(item.listeningSequence!.length).toBeGreaterThanOrEqual(2);
    }
  });
  it('MT-F02 keeps C4=60 and the F room final C5=72', () => {
    expect(exercise('f02-c').target.map(id => resolvePitches(exercise('f02-c'), id)[0].midi)).toEqual([60, 64, 67]);
    expect(exercise('f02-f').target.map(id => resolvePitches(exercise('f02-f'), id)[0].midi)).toEqual([65, 69, 72]);
    expect(evaluateAnswer(exercise('f02-f'), ['F4', 'A4', 'C4']).completed).toBe(false);
  });
  it('MT-F08 handles enharmonic octave boundaries without losing spelling', () => {
    expect(curriculumPitch('B#3').midi).toBe(60);
    expect(curriculumPitch('Cb4').midi).toBe(59);
    expect(curriculumPitch('Bbb4').midi).toBe(69);
    expect(evaluateAnswer(exercise('f08-enharmonic'), ['C4']).completed).toBe(true);
    expect(evaluateAnswer(exercise('f08-enharmonic'), ['C5']).completed).toBe(false);
    expect(evaluateAnswer(exercise('f08-spelling'), ['Gb4']).completed).toBe(false);
  });
  it('MT-F09 distinguishes actual compound intervals and enharmonic letter distances', () => {
    expect(intervalBetween(curriculumPitch('C4'), curriculumPitch('E5'))).toEqual({ semitones: 16, diatonicNumber: 10, direction: 'up' });
    expect(intervalBetween(curriculumPitch('C4'), curriculumPitch('F#4')).diatonicNumber).toBe(4);
    expect(intervalBetween(curriculumPitch('C4'), curriculumPitch('Gb4')).diatonicNumber).toBe(5);
  });
  it('MT-F13/F15 accepts collection permutations and two actual E-bass voicings', () => {
    expect(evaluateAnswer(exercise('f13-c-major'), ['G4', 'C4', 'E4']).completed).toBe(true);
    expect(evaluateAnswer(exercise('f13-c-major'), ['E4', 'G4', 'C5']).completed).toBe(true);
    expect(evaluateAnswer(exercise('f15-first-inversion'), ['C4', 'E3', 'G4']).completed).toBe(true);
    expect(evaluateAnswer(exercise('f15-first-inversion'), ['G3', 'C4', 'E3']).completed).toBe(true);
    expect(evaluateAnswer(exercise('f15-first-inversion'), ['E4', 'G4', 'C3']).completed).toBe(false);
  });
  it('MT-F17 preserves diminished seventh spelling instead of replacing B-double-flat by A', () => {
    expect(exercise('f17-dim').notes.find(note => note.id === 'Bbb4')?.midi).toBe(69);
    expect(evaluateAnswer(exercise('f17-dim'), ['C4', 'Eb4', 'Gb4', 'A4']).completed).toBe(false);
    expect(evaluateAnswer(exercise('f17-half-dim'), ['C4', 'Eb4', 'Gb4', 'Bb4']).completed).toBe(true);
  });
  it('MT-J02/J04 calculates fixed-voice movement and does not minimize by swapping voice identities', () => {
    expect(evaluateAnswer(exercise('j02-guide-d-g'), ['top-b', 'low-f']).observations.semitoneMotion).toBe(1);
    expect(evaluateAnswer(exercise('j02-guide-g-c'), ['top-b', 'low-e']).observations.semitoneMotion).toBe(1);
    expect(evaluateAnswer(exercise('j04-motion'), ['b', 'f', 'g']).observations.semitoneMotion).toBe(3);
    const jump = evaluateAnswer(exercise('j04-motion'), ['b', 'f', 'jump']);
    expect(jump.observations.semitoneMotion).toBe(11);
    expect(jump.outcome).toBe('review_required');
  });
  it('MT-J05 checks drop transformations in actual MIDI register', () => {
    const midi = (id: string) => exercise(id).target.map(note => resolvePitches(exercise(id), note)[0].midi).sort((a, b) => a - b);
    expect(midi('j05-drop2')).toEqual([55, 60, 64, 71]);
    expect(midi('j05-drop3')).toEqual([52, 60, 67, 71]);
  });
  it('MT-J09/J21/J28 accepts explicitly declared different harmonic routes', () => {
    expect(evaluateAnswer(exercise('j09-substitution'), ['dm', 'g', 'c']).completed).toBe(true);
    expect(evaluateAnswer(exercise('j09-substitution'), ['dm', 'db', 'c']).completed).toBe(true);
    expect(curriculumPitch('Cb4').midi).toBe(curriculumPitch('B3').midi);
    expect(evaluateAnswer(exercise('j21-turnaround'), ['c', 'a7', 'dm', 'g', 'c']).completed).toBe(true);
    expect(evaluateAnswer(exercise('j28-reharm'), ['am', 'd9', 'dm2', 'g2', 'c']).completed).toBe(true);
  });
  it('MT-J24 keeps G altered and G Lydian dominant distinct', () => {
    expect(exercise('j24-altered').target).toEqual(['G4', 'Ab4', 'A#4', 'B4', 'Db5', 'Eb5', 'F5']);
    expect(exercise('j24-lydian-dominant').target).toContain('D5');
    expect(exercise('j24-lydian-dominant').target).toContain('E5');
    expect(exercise('j24-altered').target).not.toContain('D5');
    expect(exercise('j24-altered').target).not.toContain('E5');
  });
  it('MT-J25 validates six/eight-tone interval structure, including the octave closure', () => {
    const intervals = (id: string) => {
      const notes = exercise(id).target.map(note => resolvePitches(exercise(id), note)[0].midi);
      return notes.map((midi, i) => (notes[i + 1] ?? notes[0] + 12) - midi);
    };
    expect(intervals('j25-whole-tone')).toEqual([2, 2, 2, 2, 2, 2]);
    expect(intervals('j25-half-whole')).toEqual([1, 2, 1, 2, 1, 2, 1, 2]);
  });
  it('MT-J19/J20 preserves bar durations and the final A cadence instead of treating time-separated chords as slash chords', () => {
    const total = (id: string) => {
      const item = exercise(id);
      return item.target.reduce((sum, selected) => { const beats = item.options!.find(option => option.id === selected)!.beats!; return sum + beats.numerator / beats.denominator; }, 0);
    };
    expect(total('j19-blues12')).toBe(48);
    expect(total('j19-jazz-blues12')).toBe(48);
    expect(total('j20-rhythm-changes32')).toBe(128);
    expect(exercise('j20-rhythm-changes32').target).toHaveLength(55);
    expect(exercise('j20-rhythm-changes32').target.at(-1)).toBe('bb6-4');
    expect(exercise('j20-rhythm-changes32').target.slice(32, 40)).toEqual(['d7-4', 'd7-4', 'g7-4', 'g7-4', 'c7-4', 'c7-4', 'f7-4', 'f7-4']);
    expect(exercise('j19-jazz-blues12').target.slice(3, 6)).toEqual(['cm2', 'f2', 'bb4']);
  });
  it('MT-F05/F07/F21 separates flexible length, exact pattern, and rearticulation', () => {
    expect(evaluateAnswer(exercise('f05-four-beats'), ['h', 'rq', 'q']).completed).toBe(true);
    expect(evaluateAnswer(exercise('f05-four-beats'), ['rq', 'q', 'q', 'q']).completed).toBe(true);
    expect(evaluateAnswer(exercise('f05-four-beats'), ['h', 'rq']).completed).toBe(false);
    expect(evaluateAnswer(exercise('f07-tie'), ['tie']).completed).toBe(true);
    expect(evaluateAnswer(exercise('f07-tie'), ['slur']).completed).toBe(false);
    expect(evaluateAnswer(exercise('f21-syncopation'), ['re', 'q', 'e', 'q', 'q']).completed).toBe(false);
  });
  it('MT-A01/A02/A07 admits multiple phrases with fixed goals, not only the example sequence', () => {
    for (const approach of ['D4', 'D#4', 'F4']) expect(evaluateAnswer(exercise('a01-approach'), [approach, 'E4']).completed).toBe(true);
    expect(evaluateAnswer(exercise('a01-approach'), ['E4', 'E4']).completed).toBe(false);
    expect(evaluateAnswer(exercise('a02-enclosure'), ['D#4', 'F4', 'E4']).completed).toBe(true);
    expect(evaluateAnswer(exercise('a02-enclosure'), ['F4', 'F4', 'E4']).completed).toBe(false);
    for (const phrase of [
      ['F4', 'G4', 'A4', 'C5', 'B4', 'G4', 'F4', 'D4', 'E4', 'G4', 'A4', 'C5'],
      ['F4', 'F4', 'F4', 'F4', 'B4', 'B4', 'B4', 'D#4', 'E4', 'E4', 'E4', 'E4'],
      ['F4', 'C4', 'D4', 'E4', 'B4', 'A4', 'G4', 'F4', 'E4', 'D4', 'C4', 'C4']
    ]) expect(evaluateAnswer(exercise('a07-targets'), phrase).completed).toBe(true);
  });
  it('MT-A16 accepts different eight-bar melodies and preserves two harmony events in split bars', () => {
    expect(evaluateAnswer(exercise('a16-eight-bars'), [...Array<string>(31).fill('G4'), 'C4']).completed).toBe(true);
    expect(evaluateAnswer(exercise('a16-eight-bars'), [...Array<string>(31).fill('E4'), 'C4']).completed).toBe(true);
    expect(exercise('a16-eight-bars').harmony?.filter(event => event.atBeat >= 16 && event.atBeat < 20).map(event => [event.symbol, event.beats])).toEqual([['Em7', 2], ['A7', 2]]);
  });
  it('MT-X03 preserves cents and tuning separately and never labels the configuration as listening', () => {
    const plus = curriculumPitch('E4', 25);
    expect(frequencyForPitch(plus) / frequencyForPitch(curriculumPitch('E4'))).toBeCloseTo(2 ** (25 / 1200));
    expect(frequencyForPitch({ ...plus, tuningA4Hz: 442 }) / frequencyForPitch(plus)).toBeCloseTo(442 / 440);
    expect(exercise('x03-cents').assessmentDomain).toBe('tuning_configuration');
    expect(JSON.parse(JSON.stringify(plus))).toEqual(plus);
  });
});

describe('teacher content validation rejects broken contracts before play or save', () => {
  it('rejects missing candidates, duplicate IDs, invalid MIDI and conflicting bass conditions', () => {
    const valid = exercise('f02-c');
    expect(errors({ ...valid, target: ['C5'] }).some(issue => issue.path === 'target[0]')).toBe(true);
    expect(errors({ ...valid, notes: [valid.notes[0], valid.notes[0]] }).some(issue => issue.message.includes('중복'))).toBe(true);
    expect(errors({ ...valid, notes: [{ ...valid.notes[0], midi: 72 }, ...valid.notes.slice(1)] }).some(issue => issue.path === 'notes[0].midi')).toBe(true);
    expect(errors({ ...exercise('f13-c-major'), equality: 'exact', bassPitchClass: 4 }).some(issue => issue.path === 'target')).toBe(true);
  });
  it('rejects targets hidden behind option palettes, absent durations and impossible creative goals', () => {
    const valid = exercise('a07-targets');
    expect(errors({ ...valid, target: ['D3'] }).some(issue => issue.path === 'target[0]')).toBe(true);
    expect(errors({ ...valid, constraints: {} }).some(issue => issue.path === 'constraints')).toBe(true);
    expect(errors({ ...valid, maxSelections: 4 }).some(issue => issue.path === 'maxSelections')).toBe(true);
    expect(errors({ ...valid, constraints: { length: 12, targetPositions: { 12: ['E4'] } } }).some(issue => issue.path.includes('targetPositions.12'))).toBe(true);
    expect(errors({ ...valid, options: valid.options?.map(option => ({ ...option, beats: undefined })) }).some(issue => issue.path === 'options')).toBe(true);
  });
  it('rejects unknown hard conditions and conditions silently ignored by a different evaluator', () => {
    expect(errors({ ...exercise('a07-targets'), constraints: { length: 12, forbiddenPitchClasses: [5] } }).some(issue => issue.path === 'constraints.forbiddenPitchClasses')).toBe(true);
    expect(errors({ ...exercise('f02-c'), constraints: { length: 6 } }).some(issue => issue.path === 'constraints')).toBe(true);
    expect(errors({ ...exercise('f02-c'), requiresSecretPerfectPitch: true }).some(issue => issue.path === 'requiresSecretPerfectPitch')).toBe(true);
    expect(errors({ ...exercise('f01-listen-1'), listeningSequence: ['C4', 'missing'] }).some(issue => issue.path === 'listeningSequence[1]')).toBe(true);
  });
  it('rejects non-object, hostile numeric values, rests with pitches and incorrect meter grouping', () => {
    for (const input of [null, true, [], '', { ...exercise('f02-c'), stage: NaN }]) expect(isMusicExercise(input)).toBe(false);
    expect(errors({ ...exercise('f05-four-beats'), options: [{ id: 'rest', label: '쉼', rest: true, noteIds: ['C4'], beats: { numerator: 1, denominator: 0 } }] }).length).toBeGreaterThan(0);
    expect(errors({ ...exercise('f06-compound'), meter: { numerator: 6, denominator: 8, groups: [2, 2, 3] } }).some(issue => issue.path === 'meter.groups')).toBe(true);
  });
  it('preserves all valid fields during a teacher JSON round trip and isolates the parsed copy', () => {
    const original = exercise('a16-eight-bars');
    const parsed = parseExercise(JSON.parse(JSON.stringify(original)));
    expect(parsed.issues.filter(issue => issue.severity === 'error')).toEqual([]);
    expect(parsed.exercise).toEqual(original);
    expect(parsed.exercise).not.toBe(original);
    expect(validateCurriculum([original, original]).some(issue => issue.path === '[1].id')).toBe(true);
  });
});
