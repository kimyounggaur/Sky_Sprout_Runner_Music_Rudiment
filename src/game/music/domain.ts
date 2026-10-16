/** Pure music contracts: never infer knowledge, timing or intention from a collision. */
export type PitchLetter = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';
export interface SoundPitch { midi: number; centsOffset?: number; temperament?: '12-TET'; tuningA4Hz?: number }
export interface SpelledPitch { letter: PitchLetter; accidental: number; octave: number }
export interface Pitch extends SoundPitch, SpelledPitch { id: string }
export interface FunctionalRole { tonalCenter?: string; scaleDegree?: number; chordRoot?: string; chordDegree?: string; analysisContext?: string }
export interface Rational { numerator: number; denominator: number }
export interface PerformedNote { noteId: string; voiceId?: string; partId?: string; onset: Rational; duration: Rational; inputTime?: number; velocitySource?: 'unmeasured' | 'device'; articulation?: string }
export interface NotationProfile { solfege: 'fixed_do' | 'movable_do'; minorConvention?: 'do_based' | 'la_based'; tonalCenter?: Pitch }
export type ExerciseKind = 'ordered_pitch' | 'pitch_collection' | 'notated_pitch' | 'interval_route' | 'rhythm_grid' | 'rhythm_perform' | 'harmony_route' | 'voice_assignment' | 'contextual_choice' | 'creative_phrase' | 'listen_identify';
export type Outcome = 'satisfied' | 'equivalent' | 'task_mismatch' | 'partial' | 'context_caution' | 'review_required' | 'unmeasured';
export interface MusicOption { id: string; label: string; accessibleLabel?: string; noteIds?: readonly string[]; value?: string; beats?: Rational; rest?: boolean; voice?: string }
export interface CreativeConstraints {
  length?: number; allowedPitchClasses?: readonly number[]; requiredPitchClasses?: readonly number[];
  targetPositions?: Readonly<Record<number, readonly string[]>>; endPitchClasses?: readonly number[];
  minRests?: number; totalBeats?: Rational; maxLeapSemitones?: number; allowChromaticApproach?: boolean;
}
export interface Exercise {
  id: string; moduleId: string; title: string; stage: number; objective: string; explanation: string;
  kind: ExerciseKind; notes: readonly Pitch[]; target: readonly string[]; options?: readonly MusicOption[];
  equality?: 'exact' | 'pitch_class' | 'spelling'; contentVersion?: string; rewardEpoch?: string;
  assessmentDomain?: string; worldMetaphor?: string; prompt?: string;
  learningPurpose?: 'follow_pattern' | 'create_phrase' | 'listen' | 'theory_demo';
  answerDisplay?: 'hidden' | 'visible';
  reviewStatus?: 'fixture_checked' | 'expert_review_required' | 'experimental'; supports?: readonly string[];
  tonalCenter?: Pitch; alternatives?: readonly (readonly string[])[]; bassPitchClass?: number;
  minNotes?: number; maxNotes?: number; maxSelections?: number; allowDuplicates?: boolean;
  reproducePattern?: boolean;
  constraints?: CreativeConstraints; voiceSource?: Readonly<Record<string, string>>;
  notation?: { clef: 'treble' | 'bass'; noteId: string };
  lockedMelody?: readonly string[]; harmony?: readonly { atBeat: number; beats: number; symbol: string; noteIds: readonly string[] }[];
  listeningSequence?: readonly string[]; listeningSeconds?: number; listeningGapSeconds?: number;
  meter?: { numerator: number; denominator: number; groups?: readonly number[] }; beatUnit?: Rational;
  supported?: boolean; interval?: { fromNoteId: string; diatonicNumber: number; semitones: number; direction: 'up' | 'down' };
}
export type MusicExercise = Exercise;
export interface EvaluationEnvironment { audioAvailable: boolean; muted: boolean; timingReliable: boolean; interrupted: boolean; answerExposed: boolean }
export interface EvaluationResult {
  outcome: Outcome; code: string; message: string; completed: boolean;
  matchedConditions: readonly string[]; remainingConditions: readonly string[];
  observations: Readonly<Record<string, number | string | boolean>>;
}

const NATURAL: Record<PitchLetter, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const LETTERS: readonly PitchLetter[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const SOLFEGE = ['도', '레', '미', '파', '솔', '라', '시'];
export const pitchClass = (midi: number): number => ((midi % 12) + 12) % 12;
export function spelledPitchToMidi(pitch: SpelledPitch): number {
  if (!Number.isInteger(pitch.octave) || !Number.isInteger(pitch.accidental) || !(pitch.letter in NATURAL)) throw new Error('잘못된 음 철자입니다.');
  return 12 * (pitch.octave + 1) + NATURAL[pitch.letter] + pitch.accidental;
}
export const pitchToMidi = spelledPitchToMidi;
export function frequencyForPitch(pitch: SoundPitch): number {
  return (pitch.tuningA4Hz ?? 440) * 2 ** ((pitch.midi - 69) / 12) * 2 ** ((pitch.centsOffset ?? 0) / 1200);
}
export const midiToFrequency = (midi: number, tuningA4Hz = 440, centsOffset = 0): number => frequencyForPitch({ midi, tuningA4Hz, centsOffset });
export function accidentalSymbol(accidental: number): string {
  return accidental === -2 ? '𝄫' : accidental === -1 ? '♭' : accidental === 1 ? '♯' : accidental === 2 ? '𝄪' : accidental === 0 ? '' : `${accidental > 0 ? '+' : ''}${accidental}`;
}
export const pitchName = (pitch: SpelledPitch): string => `${pitch.letter}${accidentalSymbol(pitch.accidental)}${pitch.octave}`;
export function solfegeName(pitch: Pitch, profile: NotationProfile = { solfege: 'fixed_do' }): string {
  if (profile.solfege !== 'movable_do' || !profile.tonalCenter) return `${SOLFEGE[LETTERS.indexOf(pitch.letter)]}${accidentalSymbol(pitch.accidental)}`;
  const degree = (LETTERS.indexOf(pitch.letter) - LETTERS.indexOf(profile.tonalCenter.letter) + 7) % 7;
  const scale = profile.minorConvention ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11];
  const alteration = ((pitchClass(pitch.midi) - pitchClass(profile.tonalCenter.midi) - scale[degree] + 18) % 12) - 6;
  const syllable = SOLFEGE[(degree + (profile.minorConvention === 'la_based' ? 5 : 0)) % 7];
  return `${syllable}${accidentalSymbol(alteration)}`;
}
export const pitchLabel = (pitch: Pitch, profile?: NotationProfile): string => `${solfegeName(pitch, profile)} · ${pitchName(pitch)}`;
export function accessiblePitchName(pitch: Pitch, profile?: NotationProfile): string {
  const accidental = pitch.accidental === 0 ? '내추럴' : pitch.accidental === 1 ? '샤프' : pitch.accidental === -1 ? '플랫' : pitch.accidental === 2 ? '더블 샤프' : '더블 플랫';
  return `${solfegeName(pitch, profile)}, ${pitch.letter} ${accidental}, ${pitch.octave}옥타브, MIDI ${pitch.midi}${pitch.centsOffset ? `, 기준보다 ${Math.abs(pitch.centsOffset)}센트 ${pitch.centsOffset > 0 ? '높음' : '낮음'}` : ''}${pitch.tuningA4Hz && pitch.tuningA4Hz !== 440 ? `, 기준 라 ${pitch.tuningA4Hz}헤르츠` : ''}`;
}
export function samePitch(a: Pitch, b: Pitch, equality: Exercise['equality'] = 'exact'): boolean {
  if (equality === 'pitch_class') return pitchClass(a.midi) === pitchClass(b.midi) && (a.centsOffset ?? 0) === (b.centsOffset ?? 0);
  if (equality === 'spelling') return a.letter === b.letter && a.accidental === b.accidental && a.octave === b.octave && a.midi === b.midi;
  return Math.abs(frequencyForPitch(a) - frequencyForPitch(b)) < 0.000001;
}
export function intervalBetween(from: Pitch, to: Pitch): { semitones: number; diatonicNumber: number; direction: 'up' | 'down' | 'same' } {
  const steps = (to.octave - from.octave) * 7 + LETTERS.indexOf(to.letter) - LETTERS.indexOf(from.letter);
  return { semitones: to.midi - from.midi, diatonicNumber: Math.abs(steps) + 1, direction: to.midi > from.midi ? 'up' : to.midi < from.midi ? 'down' : 'same' };
}
export const actualBass = (notes: readonly Pitch[]): Pitch | undefined => notes.reduce<Pitch | undefined>((lowest, note) => !lowest || note.midi < lowest.midi ? note : lowest, undefined);
export const CHORD_INTERVALS = Object.freeze({ major: [0, 4, 7], minor: [0, 3, 7], diminished: [0, 3, 6], augmented: [0, 4, 8], maj7: [0, 4, 7, 11], dominant7: [0, 4, 7, 10], minor7: [0, 3, 7, 10], halfDiminished7: [0, 3, 6, 10], diminished7: [0, 3, 6, 9], minorMajor7: [0, 3, 7, 11] });
export function voiceLeadingDistance(source: Readonly<Record<string, Pitch>>, destination: Readonly<Record<string, Pitch>>): number | null {
  if (Object.keys(source).length !== Object.keys(destination).length || Object.keys(source).some(voice => !destination[voice])) return null;
  return Object.entries(source).reduce((total, [voice, pitch]) => total + Math.abs(destination[voice].midi - pitch.midi), 0);
}
const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
export function rational(numerator: number, denominator = 1): Rational {
  if (!Number.isSafeInteger(numerator) || !Number.isSafeInteger(denominator) || numerator < 0 || denominator <= 0 || denominator > 1000000) throw new Error('음악 길이는 음수가 아닌 유리수이고 분모는 1~1000000이어야 합니다.');
  const divisor = gcd(numerator, denominator);
  return { numerator: numerator / divisor, denominator: denominator / divisor };
}
export function addRational(a: Rational, b: Rational): Rational {
  return rational(a.numerator * b.denominator + b.numerator * a.denominator, a.denominator * b.denominator);
}
export function equalRational(a: Rational, b: Rational): boolean { return a.numerator * b.denominator === b.numerator * a.denominator; }
export const rationalValue = (value: Rational): number => value.numerator / value.denominator;
export const measureBeats = (numerator: number, denominator: number): Rational => rational(numerator * 4, denominator);

export function resolvePitches(exercise: Exercise, id: string): Pitch[] {
  const note = exercise.notes.find(candidate => candidate.id === id);
  if (note) return [note];
  const option = exercise.options?.find(candidate => candidate.id === id);
  return (option?.noteIds ?? []).flatMap(noteId => { const resolved = exercise.notes.find(candidate => candidate.id === noteId); return resolved ? [resolved] : []; });
}
export function optionLabel(exercise: Exercise, id: string, profile?: NotationProfile): string {
  return exercise.options?.find(option => option.id === id)?.label ?? (exercise.notes.find(note => note.id === id) ? pitchLabel(exercise.notes.find(note => note.id === id)!, profile) : id);
}
const result = (outcome: Outcome, code: string, message: string, matchedConditions: string[] = [], remainingConditions: string[] = [], observations: Record<string, number | string | boolean> = {}): EvaluationResult => ({ outcome, code, message, completed: outcome === 'satisfied' || outcome === 'equivalent', matchedConditions, remainingConditions, observations });
export const isSelectableId = (exercise: Exercise, id: string): boolean => exercise.options?.length
  ? exercise.options.some(option => option.id === id)
  : exercise.notes.some(note => note.id === id);
function sameSelection(exercise: Exercise, actual: string, expected: string): boolean {
  if (exercise.kind === 'rhythm_grid' || exercise.kind === 'rhythm_perform' || exercise.kind === 'voice_assignment') return actual === expected;
  const actualPitches = resolvePitches(exercise, actual), expectedPitches = resolvePitches(exercise, expected);
  if (actualPitches.length === 1 && expectedPitches.length === 1) return samePitch(actualPitches[0], expectedPitches[0], exercise.equality);
  return actual === expected;
}
const matchesSequence = (exercise: Exercise, selected: readonly string[], target: readonly string[]): boolean => selected.length === target.length && selected.every((id, index) => sameSelection(exercise, id, target[index]));

export function evaluateAnswer(exercise: Exercise, selected: readonly string[], environment: Partial<EvaluationEnvironment> = {}): EvaluationResult {
  if (exercise.supported === false) return result('review_required', 'unsupported_contract', '이 활동은 자동 판정 범위 밖입니다. 답을 보존하고 검토를 기다립니다.');
  if (selected.some(id => !isSelectableId(exercise, id))) return result('review_required', 'unknown_selection', '후보에 없는 응답이 있습니다. 과제 데이터를 확인해 주세요.');
  if (exercise.kind === 'listen_identify' && (!environment.audioAvailable || environment.muted || environment.interrupted || environment.answerExposed || exercise.answerDisplay === 'visible' || exercise.learningPurpose === 'theory_demo')) return result('unmeasured', 'listening_not_measured', '소리와 환경을 확인하지 못했거나 답이 노출되어 청음은 미측정입니다.');
  if (exercise.kind === 'rhythm_perform') return result('unmeasured', 'timing_evidence_required', '정밀 리듬에는 신뢰할 수 있는 별도 패드 입력 시각이 필요합니다. 블록 선택으로 채점하지 않습니다.');
  if (selected.length === 0) return result('partial', 'empty_answer', '블록을 선택해 답을 만들어 보세요.', [], ['응답 선택']);
  if (exercise.kind === 'creative_phrase' || (exercise.kind === 'rhythm_grid' && exercise.constraints)) return evaluateConstraints(exercise, selected);
  if (exercise.kind === 'pitch_collection') {
    const pitches = selected.flatMap(id => resolvePitches(exercise, id));
    const target = exercise.target.flatMap(id => resolvePitches(exercise, id));
    if (!target.length || !pitches.length) return result('review_required', 'missing_pitch_contract', '음집합의 실제 음높이 조건을 확인해야 합니다.');
    if (exercise.minNotes !== undefined && pitches.length < exercise.minNotes) return result('partial', 'too_few_notes', `최소 ${exercise.minNotes}음이 필요합니다.`);
    if (exercise.maxNotes !== undefined && pitches.length > exercise.maxNotes) return result('task_mismatch', 'too_many_notes', `이 활동은 최대 ${exercise.maxNotes}음을 사용합니다.`);
    const unmatched = [...target];
    let extra = false;
    for (const pitch of pitches) {
      const index = unmatched.findIndex(note => samePitch(pitch, note, exercise.equality));
      if (index >= 0) unmatched.splice(index, 1);
      else if (!(exercise.allowDuplicates && target.some(note => samePitch(pitch, note, exercise.equality)))) extra = true;
    }
    if (extra) return result('task_mismatch', 'collection_extra_pitch', '다른 구성음 또는 이 활동에서 허용하지 않은 중복음이 선택됐어요. 모은 음을 수정할 수 있어요.');
    if (unmatched.length) return result('partial', 'collection_missing_pitch', '일부 구성음을 모았어요. 남은 구성음을 찾아보세요.', ['일부 구성음'], ['남은 구성음']);
    const bass = actualBass(pitches)!;
    if (exercise.bassPitchClass !== undefined && pitchClass(bass.midi) !== pitchClass(exercise.bassPitchClass)) return result('task_mismatch', 'actual_bass_mismatch', '전위는 먼저 선택한 음이 아니라 실제 가장 낮은 음으로 확인해요.', ['구성음'], ['실제 베이스'], { bass: pitchName(bass) });
    const exact = matchesSequence(exercise, selected, exercise.target);
    return result(exact ? 'satisfied' : 'equivalent', 'collection_complete', '선택한 순서와 관계없이 요구한 구성음 조건을 충족했어요.', ['구성음', ...(exercise.bassPitchClass !== undefined ? ['실제 베이스'] : [])], [], { bass: pitchName(bass) });
  }
  if (exercise.kind === 'interval_route' && exercise.interval) {
    const source = exercise.notes.find(note => note.id === exercise.interval!.fromNoteId), destination = resolvePitches(exercise, selected[0])[0];
    if (!source || !destination || selected.length !== 1) return result('review_required', 'interval_shape', '음정의 기준음과 도착음을 확인해 주세요.');
    const interval = intervalBetween(source, destination), contract = exercise.interval;
    const valid = interval.diatonicNumber === contract.diatonicNumber && Math.abs(interval.semitones) === contract.semitones && interval.direction === contract.direction;
    return result(valid ? 'satisfied' : 'task_mismatch', 'interval_comparison', valid ? '문자 간격·반음 수·방향이 모두 맞아요.' : '이번 음정의 문자 간격, 반음 수, 방향을 다시 확인해 보세요.', valid ? ['음정'] : [], valid ? [] : ['음정'], interval);
  }
  if (exercise.kind === 'voice_assignment') {
    if (!exercise.voiceSource) return result('review_required', 'voice_source_required', '성부별 출발음이 없어 자동으로 이동량을 판단할 수 없습니다.');
    const source: Record<string, Pitch> = {}, destination: Record<string, Pitch> = {};
    for (const [voice, id] of Object.entries(exercise.voiceSource)) { const pitch = resolvePitches(exercise, id)[0]; if (pitch) source[voice] = pitch; }
    for (const id of selected) { const option = exercise.options?.find(item => item.id === id), pitch = resolvePitches(exercise, id)[0]; if (!option?.voice || !pitch || destination[option.voice]) return result('task_mismatch', 'voice_identity', '각 성부에 도착음을 하나씩 연결해 주세요.'); destination[option.voice] = pitch; }
    const distance = voiceLeadingDistance(source, destination);
    if (distance === null) return result('partial', 'missing_voice', '모든 성부의 다리를 연결해 주세요.');
    const allowed = [exercise.target, ...(exercise.alternatives ?? [])];
    const accepted = allowed.some(target => target.length === selected.length && target.every(id => selected.includes(id)));
    return result(accepted ? 'satisfied' : 'review_required', accepted ? 'voice_connections' : 'voice_outside_fixture', accepted ? `성부를 유지해 연결했어요. 총 이동 ${distance}반음입니다.` : '이 연결은 준비된 예시 밖입니다. 성부를 보존한 채 검토가 필요합니다.', accepted ? ['성부별 연결'] : [], [], { semitoneMotion: distance });
  }
  const targets = [exercise.target, ...(exercise.alternatives ?? [])];
  const index = targets.findIndex(target => matchesSequence(exercise, selected, target));
  if (index >= 0) return result(index === 0 ? 'satisfied' : 'equivalent', 'declared_conditions_met', '이번 활동의 조건을 충족했어요.', ['공개된 활동 조건']);
  const prefix = selected.length < exercise.target.length && selected.every((id, slot) => sameSelection(exercise, id, exercise.target[slot]));
  if (prefix) return result('partial', 'valid_prefix', '맞힌 음을 유지했어요. 다음 블록을 선택해 보세요.', ['현재까지의 순서'], ['남은 선택']);
  if (exercise.kind === 'contextual_choice' || exercise.kind === 'harmony_route') return result('context_caution', 'context_alternative', '이 선택은 제시된 예시와 다릅니다. 화성 문맥과 해결을 비교하고 다시 선택해 보세요.');
  if (exercise.kind === 'ordered_pitch' && exercise.moduleId === 'F02') {
    const chosen = resolvePitches(exercise, selected[selected.length - 1])[0];
    const expected = resolvePitches(exercise, exercise.target[selected.length - 1])[0];
    if (chosen && expected && exercise.target.some(id => resolvePitches(exercise, id).some(note => pitchClass(note.midi) === pitchClass(chosen.midi)))) {
      return result('task_mismatch', 'chord_tone_wrong_slot', `${pitchName(chosen)}도 이 화음의 구성음이에요. 이번 차례는 ${pitchName(expected)}입니다. 앞서 맞힌 음은 그대로예요.`, ['앞서 맞힌 음 유지'], [`${pitchName(expected)} 선택`]);
    }
  }
  return result('task_mismatch', 'task_condition_mismatch', exercise.kind === 'ordered_pitch' ? '다른 블록이 선택됐어요. 앞서 맞힌 음은 그대로예요. 이번 순서의 다음 음을 찾아보세요.' : '선택한 답이 이번 활동의 조건과 달라요. 음역·철자·순서를 확인해 보세요.');
}

function evaluateConstraints(exercise: Exercise, selected: readonly string[]): EvaluationResult {
  const constraints = exercise.constraints;
  if (!constraints || !Object.keys(constraints).length) return result('review_required', 'creative_constraints_required', '창작에는 공개된 조건이 필요합니다. 예시 선율과 일치하는지만으로 채점하지 않습니다.');
  const matched: string[] = [], missing: string[] = [], pitches = selected.flatMap(id => resolvePitches(exercise, id));
  const options = selected.map(id => exercise.options?.find(option => option.id === id));
  const check = (passed: boolean, label: string) => (passed ? matched : missing).push(label);
  if (constraints.length !== undefined) check(selected.length === constraints.length, `${constraints.length}칸 구성`);
  if (constraints.allowedPitchClasses) {
    let outside = false;
    for (let index = 0; index < pitches.length; index++) {
      if (constraints.allowedPitchClasses.includes(pitchClass(pitches[index].midi))) continue;
      const next = pitches[index + 1];
      if (!(constraints.allowChromaticApproach && next && Math.abs(next.midi - pitches[index].midi) === 1 && constraints.allowedPitchClasses.includes(pitchClass(next.midi)))) outside = true;
    }
    check(!outside, '허용 음과 해결 조건');
  }
  if (constraints.requiredPitchClasses) check(constraints.requiredPitchClasses.every(pc => pitches.some(pitch => pitchClass(pitch.midi) === pitchClass(pc))), '필수 구성음');
  if (constraints.targetPositions) for (const [position, allowed] of Object.entries(constraints.targetPositions)) check(!!selected[Number(position)] && allowed.some(id => sameSelection(exercise, selected[Number(position)], id)), `${Number(position) + 1}번째 칸의 도착음`);
  if (constraints.endPitchClasses) check(!!pitches.length && constraints.endPitchClasses.includes(pitchClass(pitches[pitches.length - 1].midi)), '마지막 음의 해결');
  const rests = options.filter(option => option?.rest).length;
  if (constraints.minRests !== undefined) check(rests >= constraints.minRests, `쉼 ${constraints.minRests}개 이상`);
  if (constraints.maxLeapSemitones !== undefined) check(pitches.every((pitch, index) => index === 0 || Math.abs(pitch.midi - pitches[index - 1].midi) <= constraints.maxLeapSemitones!), '음 이동 범위');
  let beats = rational(0);
  if (constraints.totalBeats) {
    if (options.some(option => !option?.beats)) return result('review_required', 'duration_required', '시간 다리의 각 블록 길이가 필요합니다.');
    try { beats = options.reduce((sum, option) => addRational(sum, option!.beats!), beats); } catch { return result('review_required', 'invalid_duration', '음악 길이의 범위를 확인해 주세요.'); }
    check(equalRational(beats, constraints.totalBeats), `총 ${rationalValue(constraints.totalBeats)}박`);
  }
  if (exercise.kind === 'rhythm_grid' && exercise.reproducePattern && exercise.target.length) {
    const allowed = [exercise.target, ...(exercise.alternatives ?? [])];
    check(allowed.some(target => matchesSequence(exercise, selected, target)), '발음과 쉼의 위치');
  }
  return result(missing.length ? 'partial' : 'satisfied', missing.length ? 'constraints_remaining' : 'creative_constraints_met', missing.length ? `아직 확인할 조건: ${missing.join(', ')}` : '공개된 조건을 충족한 나만의 구절이에요. 다른 선율도 같은 조건을 만족할 수 있어요.', matched, missing, { notes: pitches.length, rests, selectedCount: selected.length, totalBeats: rationalValue(beats) });
}

export interface TimingMatch { inputIndex: number; targetIndex: number; rawErrorMs: number; correctedErrorMs: number; withinWindow: boolean }
/** Already output-mapped target times only: never subtract output latency a second time. */
export function matchRhythmInputs(inputs: readonly number[], targets: readonly number[], windowMs: number, responseOffsetMs = 0): { matches: TimingMatch[]; extraInputs: number[]; missedTargets: number[] } {
  if (!Number.isFinite(windowMs) || windowMs < 0 || !Number.isFinite(responseOffsetMs) || [...inputs, ...targets].some(time => !Number.isFinite(time))) throw new Error('유효한 performance 밀리초 시각이 필요합니다.');
  if (inputs.length > 1024 || targets.length > 1024) throw new Error('한 테이크의 자동 매칭은 입력·목표 각각 1024개까지 지원합니다.');
  // Maximize valid matches first, then minimize total absolute error. Nearest-first
  // greediness can consume the only target available to a later input.
  const orderedInputs = inputs.map((time, index) => ({ time, index })).sort((a, b) => a.time - b.time || a.index - b.index);
  const orderedTargets = targets.map((time, index) => ({ time, index })).sort((a, b) => a.time - b.time || a.index - b.index);
  const width = orderedTargets.length + 1, size = (orderedInputs.length + 1) * width;
  const counts = new Uint16Array(size), costs = new Float64Array(size), decisions = new Uint8Array(size);
  for (let i = 1; i <= orderedInputs.length; i++) for (let j = 1; j <= orderedTargets.length; j++) {
    const cell = i * width + j, above = (i - 1) * width + j, left = cell - 1, diagonal = above - 1;
    let count = counts[above], cost = costs[above], decision = 1;
    if (counts[left] > count || (counts[left] === count && costs[left] < cost)) { count = counts[left]; cost = costs[left]; decision = 2; }
    const error = Math.abs(orderedInputs[i - 1].time - orderedTargets[j - 1].time - responseOffsetMs);
    if (error <= windowMs && (counts[diagonal] + 1 > count || (counts[diagonal] + 1 === count && costs[diagonal] + error <= cost))) {
      count = counts[diagonal] + 1; cost = costs[diagonal] + error; decision = 3;
    }
    counts[cell] = count; costs[cell] = cost; decisions[cell] = decision;
  }
  const usedInputs = new Set<number>(), usedTargets = new Set<number>(), matches: TimingMatch[] = [];
  let i = orderedInputs.length, j = orderedTargets.length;
  while (i > 0 && j > 0) {
    const decision = decisions[i * width + j];
    if (decision === 3) {
      const inputIndex = orderedInputs[i - 1].index, targetIndex = orderedTargets[j - 1].index;
      const rawErrorMs = inputs[inputIndex] - targets[targetIndex];
      matches.push({ inputIndex, targetIndex, rawErrorMs, correctedErrorMs: rawErrorMs - responseOffsetMs, withinWindow: true });
      usedInputs.add(inputIndex); usedTargets.add(targetIndex); i--; j--;
    } else if (decision === 1) i--; else j--;
  }
  return { matches: matches.sort((a, b) => a.targetIndex - b.targetIndex), extraInputs: inputs.map((_, i) => i).filter(i => !usedInputs.has(i)), missedTargets: targets.map((_, i) => i).filter(i => !usedTargets.has(i)) };
}
