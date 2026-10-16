import { pitchName, spelledPitchToMidi, type Exercise, type Pitch, type PitchLetter } from './domain';
import { isMusicExercise, validateExercise } from './contentValidation';

export interface LessonPackage { schemaVersion: 1; safeRoom: true; exercises: Exercise[] }
export type LessonPackageResult = { ok: true; value: LessonPackage } | { ok: false; error: string };

export function parseLessonPackage(input: unknown): LessonPackageResult {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { ok: false, error: 'music: 음악 패키지가 객체여야 합니다.' };
  const raw = input as Record<string, unknown>;
  if (raw.schemaVersion !== 1) return { ok: false, error: `music.schemaVersion: 지원하지 않는 음악 버전 ${String(raw.schemaVersion)}. 원본은 보존됩니다.` };
  if (raw.safeRoom !== true) return { ok: false, error: 'music.safeRoom: 음악 활동은 피해·시간 제한 없는 안전 방을 사용합니다.' };
  if (!Array.isArray(raw.exercises) || raw.exercises.length < 1 || raw.exercises.length > 100) return { ok: false, error: 'music.exercises: 1~100개의 음악 과제가 필요합니다.' };
  const exercises: Exercise[] = [];
  const ids = new Set<string>();
  for (let i = 0; i < raw.exercises.length; i++) {
    const value: unknown = raw.exercises[i];
    if (!isMusicExercise(value)) {
      const issue = validateExercise(value).find(issue => issue.severity === 'error');
      return { ok: false, error: `music.exercises[${i}].${issue?.path ?? ''}: ${issue?.message ?? '유효하지 않은 음악 과제입니다.'}` };
    }
    if (ids.has(value.id)) return { ok: false, error: `music.exercises[${i}].id: 과제 ID가 중복됐습니다.` };
    ids.add(value.id); exercises.push(JSON.parse(JSON.stringify(value)) as Exercise);
  }
  return { ok: true, value: { schemaVersion: 1, safeRoom: true, exercises } };
}

/** Local deterministic transposition of a simple pitch-block lesson; no remote AI. */
export function createMusicTemplate(seed: number, source: Exercise): Exercise {
  if (!Number.isSafeInteger(seed) || source.kind !== 'ordered_pitch' || source.options?.length) throw new Error('순서 음블록 템플릿과 정수 seed를 사용하세요.');
  const choices = [{ semitones: 0, steps: 0 }, { semitones: 2, steps: 1 }, { semitones: 3, steps: 2 }, { semitones: 5, steps: 3 }, { semitones: 7, steps: 4 }];
  const shift = choices[((seed % choices.length) + choices.length) % choices.length];
  const letters: PitchLetter[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const transpose = (note: Pitch): Pitch => {
    const diatonic = note.octave * 7 + letters.indexOf(note.letter) + shift.steps;
    const letter = letters[((diatonic % 7) + 7) % 7];
    const octave = Math.floor(diatonic / 7);
    const midi = note.midi + shift.semitones;
    const accidental = midi - spelledPitchToMidi({ letter, octave, accidental: 0 });
    return { ...note, letter, octave, midi, accidental };
  };
  const notes = source.notes.map(transpose);
  const labels = source.target.map(id => pitchName(notes.find(note => note.id === id)!));
  return { ...JSON.parse(JSON.stringify(source)) as Exercise,
    id: `teacher-transpose-${source.id}-${seed}`, moduleId: 'F11', contentVersion: '1.0.0',
    notes, tonalCenter: source.tonalCenter ? transpose(source.tonalCenter) : notes[0],
    title: `조옮김 구름길 · ${labels.join('–')}`, objective: `${labels.join(' → ')} 순서로 음블록을 선택하세요.`,
    prompt: `${labels.join(' → ')}. 문자 음명과 옥타브를 확인하세요.`,
    explanation: `같은 간격을 유지해 ${shift.semitones}반음 옮긴 음블록 연습입니다. seed ${seed}에서 같은 결과가 만들어집니다.`,
    assessmentDomain: 'symbolic_transposition', reviewStatus: 'expert_review_required'
  };
}
