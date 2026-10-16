import { evaluateAnswer, spelledPitchToMidi, type MusicExercise, type Pitch } from './domain';

export interface ValidationIssue { severity: 'error' | 'warning'; path: string; message: string }
const kinds = new Set(['ordered_pitch', 'pitch_collection', 'notated_pitch', 'interval_route', 'rhythm_grid', 'rhythm_perform', 'harmony_route', 'voice_assignment', 'contextual_choice', 'creative_phrase', 'listen_identify']);
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const isText = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const positiveInt = (value: unknown): value is number => Number.isSafeInteger(value) && Number(value) > 0;
const stringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every(isText);
const validModule = (value: unknown): boolean => typeof value === 'string' && /^(F(0[1-9]|1\d|2[0-4])|J(0[1-9]|1\d|2[0-8])|A(0[1-9]|1[0-6])|X0[1-8])$/.test(value);

/** Validates untrusted teacher JSON before it enters the game or save schema.
 * Returns locations and repair guidance; never silently strips unsupported data.
 */
export function validateExercise(value: unknown): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const error = (path: string, message: string) => issues.push({ severity: 'error', path, message });
  const warning = (path: string, message: string) => issues.push({ severity: 'warning', path, message });
  if (!isRecord(value)) { error('$', '과제는 JSON 객체여야 합니다.'); return issues; }
  const supportedFields = new Set(['id', 'moduleId', 'title', 'stage', 'objective', 'explanation', 'kind', 'notes', 'target', 'options', 'equality', 'contentVersion', 'rewardEpoch', 'assessmentDomain', 'worldMetaphor', 'prompt', 'reviewStatus', 'supports', 'tonalCenter', 'alternatives', 'bassPitchClass', 'minNotes', 'maxNotes', 'maxSelections', 'allowDuplicates', 'constraints', 'voiceSource', 'notation', 'lockedMelody', 'harmony', 'meter', 'beatUnit', 'supported', 'interval', 'reproducePattern', 'listeningSequence', 'listeningSeconds', 'listeningGapSeconds']);
  supportedFields.add('learningPurpose'); supportedFields.add('answerDisplay');
  for (const key of Object.keys(value)) if (!supportedFields.has(key)) error(key, '현재 스키마가 해석하지 않는 필드입니다. 이 조건을 조용히 무시하지 않습니다. 지원 규칙으로 바꾸거나 별도 원본을 보존하세요.');
  for (const key of ['id', 'moduleId', 'title', 'objective', 'explanation', 'kind']) if (!isText(value[key])) error(key, '빈 값이 아닌 문자열을 입력하세요.');
  if (isText(value.id) && (value.id.length > 120 || !/^[\w-]+$/.test(value.id))) error('id', 'ID는 영문·숫자·밑줄·하이픈으로 120자 이내여야 합니다.');
  if (!validModule(value.moduleId)) error('moduleId', 'F01–F24, J01–J28, A01–A16, X01–X08 중 연결할 개념 ID를 입력하세요.');
  if (!Number.isInteger(value.stage) || Number(value.stage) < 0 || Number(value.stage) > 24) error('stage', '단계는 S00–S24에 해당하는 0–24 정수입니다.');
  if (!kinds.has(String(value.kind))) error('kind', '지원하지 않는 판정 종류입니다. 지원되는 종류로 바꾸거나 검토 필요 활동으로 별도 보존하세요.');
  if (value.learningPurpose !== undefined && !['follow_pattern', 'create_phrase', 'listen', 'theory_demo'].includes(String(value.learningPurpose))) error('learningPurpose', '따라 만들기, 자유 구절 창작, 듣기, 기호 이해·시범 중 목적을 지정하세요.');
  if (value.answerDisplay !== undefined && !['hidden', 'visible'].includes(String(value.answerDisplay))) error('answerDisplay', '정답 예시 표시는 hidden 또는 visible입니다.');
  if (value.learningPurpose === 'create_phrase' && value.kind !== 'creative_phrase') error('kind', '자유 창작을 지정 순서 일치로 판정할 수 없습니다. creative_phrase와 공개 constraints를 사용하거나 목적을 따라 만들기로 바꾸세요.');
  if (value.learningPurpose === 'listen' && value.kind !== 'listen_identify') error('kind', '듣기 목적에는 listen_identify와 실제 listeningSequence가 필요합니다.');
  if (value.kind === 'listen_identify' && value.answerDisplay === 'visible') error('answerDisplay', '청음 과제의 답 이름이 노출됩니다. 정답 예시를 숨기거나 기호 이해·시범 활동으로 바꾼 뒤 목표·명칭을 검토하세요.');
  if (value.kind === 'listen_identify' && value.learningPurpose === 'theory_demo') error('kind', '시범 활동은 청음 평가로 저장하지 않습니다. contextual_choice로 바꾸고 assessmentDomain을 기호 이해로 지정하세요.');
  if (value.equality !== undefined && !['exact', 'pitch_class', 'spelling'].includes(String(value.equality))) error('equality', 'exact, pitch_class, spelling 중 하나를 지정하세요.');
  for (const key of ['prompt', 'worldMetaphor', 'assessmentDomain', 'contentVersion', 'rewardEpoch']) if (value[key] !== undefined && !isText(value[key])) error(key, '문자열을 입력하세요.');
  if (value.reviewStatus !== undefined && !['fixture_checked', 'expert_review_required', 'experimental'].includes(String(value.reviewStatus))) error('reviewStatus', '검수 상태를 fixture_checked, expert_review_required, experimental 중에서 고르세요.');
  for (const key of ['allowDuplicates', 'supported', 'reproducePattern']) if (value[key] !== undefined && typeof value[key] !== 'boolean') error(key, '참 또는 거짓이어야 합니다.');
  if (value.supports !== undefined && !stringArray(value.supports)) error('supports', '지원 방식 이름의 배열이어야 합니다.');

  const noteIds = new Set<string>();
  const noteMap = new Map<string, Record<string, unknown>>();
  const validatePitch = (note: unknown, path: string) => {
    if (!isRecord(note)) { error(path, '음은 id, letter, accidental, octave, midi를 가진 객체여야 합니다.'); return; }
    if (!isText(note.id)) error(`${path}.id`, '음 ID가 필요합니다.');
    if (typeof note.letter !== 'string' || !/^[A-G]$/.test(note.letter)) error(`${path}.letter`, '문자 음명은 A–G 중 하나입니다.');
    if (!Number.isInteger(note.accidental) || Number(note.accidental) < -2 || Number(note.accidental) > 2) error(`${path}.accidental`, '변화표는 −2부터 +2까지 정수로 저장하세요.');
    if (!Number.isInteger(note.octave) || Number(note.octave) < -2 || Number(note.octave) > 10) error(`${path}.octave`, '옥타브는 −2부터 10까지 정수여야 합니다.');
    if (!Number.isInteger(note.midi) || Number(note.midi) < 0 || Number(note.midi) > 127) error(`${path}.midi`, 'MIDI 음높이는 0–127 정수여야 합니다.');
    if (note.centsOffset !== undefined && (!finite(note.centsOffset) || Math.abs(note.centsOffset) > 1200)) error(`${path}.centsOffset`, '센트 편차는 −1200부터 +1200의 유한수여야 합니다.');
    if (note.tuningA4Hz !== undefined && (!finite(note.tuningA4Hz) || note.tuningA4Hz < 300 || note.tuningA4Hz > 500)) error(`${path}.tuningA4Hz`, '기준 A4 주파수는 300–500Hz의 유한수여야 합니다.');
    if (note.temperament !== undefined && note.temperament !== '12-TET') error(`${path}.temperament`, '현재 런타임은 12-TET와 명시적 센트 편차를 지원합니다. 다른 조율 체계는 검토가 필요합니다.');
    if (typeof note.letter === 'string' && /^[A-G]$/.test(note.letter) && Number.isInteger(note.accidental) && Number.isInteger(note.octave)) {
      const expected = spelledPitchToMidi(note as unknown as Pitch);
      if (note.midi !== expected) error(`${path}.midi`, `철자·옥타브에 따른 MIDI는 ${expected}입니다. B♯3=C4, C♭4=B3의 옥타브 경계를 확인하세요.`);
    }
  };
  if (!Array.isArray(value.notes)) error('notes', '음 데이터 배열이 필요합니다. 표찰만 있는 활동은 빈 배열을 사용하세요.');
  else {
    if (value.notes.length > 256) error('notes', '한 활동의 음 후보는 256개 이내로 나누세요.');
    value.notes.forEach((note, index) => {
      validatePitch(note, `notes[${index}]`);
      if (isRecord(note) && isText(note.id)) {
        if (noteIds.has(note.id)) error(`notes[${index}].id`, '음 ID가 중복됐습니다. 같은 음을 재사용하려면 하나의 ID를 참조하세요.');
        noteIds.add(note.id); noteMap.set(note.id, note);
      }
    });
  }
  const rational = (data: unknown, path: string, allowZero = false) => {
    if (!isRecord(data) || !Number.isSafeInteger(data.numerator) || (allowZero ? Number(data.numerator) < 0 : Number(data.numerator) <= 0) || !positiveInt(data.denominator) || data.denominator > 1000000) {
      error(path, '길이는 양의 정수 분자·분모를 가진 유리수로 입력하세요. 분모는 1000000 이하입니다.');
    }
  };
  const optionIds = new Set<string>();
  if (value.options !== undefined) {
    if (!Array.isArray(value.options)) error('options', '선택 블록은 배열이어야 합니다.');
    else {
      if (value.options.length === 0 || value.options.length > 256) error('options', '선택 블록은 1–256개여야 합니다. 음 전용 활동에서는 options 필드를 생략하세요.');
      value.options.forEach((option, index) => {
        const path = `options[${index}]`;
        if (!isRecord(option)) { error(path, '선택 블록은 객체여야 합니다.'); return; }
        if (!isText(option.id)) error(`${path}.id`, '선택 블록 ID가 필요합니다.');
        else { if (optionIds.has(option.id)) error(`${path}.id`, '선택 블록 ID가 중복됐습니다.'); optionIds.add(option.id); }
        if (!isText(option.label)) error(`${path}.label`, '색과 별개로 읽을 수 있는 표찰 이름이 필요합니다.');
        for (const key of ['accessibleLabel', 'value', 'voice']) if (option[key] !== undefined && !isText(option[key])) error(`${path}.${key}`, '빈 값이 아닌 문자열이어야 합니다.');
        if (option.rest !== undefined && typeof option.rest !== 'boolean') error(`${path}.rest`, '쉼표 여부는 참 또는 거짓입니다.');
        if (option.noteIds !== undefined) {
          if (!stringArray(option.noteIds)) error(`${path}.noteIds`, '음 ID 배열이어야 합니다.');
          else option.noteIds.forEach((id, noteIndex) => { if (!noteIds.has(id)) error(`${path}.noteIds[${noteIndex}]`, 'notes에 없는 음입니다. 음 데이터를 먼저 추가하세요.'); });
        }
        if (option.rest === true && Array.isArray(option.noteIds) && option.noteIds.length) error(path, '쉼표에 음높이를 붙일 수 없습니다. noteIds를 비우세요.');
        if (option.beats !== undefined) rational(option.beats, `${path}.beats`);
        if (isText(option.id) && noteIds.has(option.id) && (!Array.isArray(option.noteIds) || option.noteIds.length !== 1 || option.noteIds[0] !== option.id)) error(`${path}.id`, '같은 ID의 음과 선택 블록이 서로 다른 의미입니다. ID를 분리하거나 동일 음 하나를 참조하세요.');
      });
    }
  }
  const selectableIds = optionIds.size ? optionIds : noteIds;
  const selectedRefs = (list: unknown, path: string, allowEmpty = false) => {
    if (!stringArray(list) || (!allowEmpty && list.length === 0)) { error(path, '선택 가능한 ID를 하나 이상 배열에 넣으세요.'); return; }
    list.forEach((id, index) => { if (!selectableIds.has(id)) error(`${path}[${index}]`, '화면 후보에 없는 목표입니다. 선택 가능한 후보를 추가하거나 목표를 바꾸세요.'); });
  };
  selectedRefs(value.target, 'target', value.kind === 'creative_phrase');
  if (value.alternatives !== undefined) {
    if (!Array.isArray(value.alternatives)) error('alternatives', '대안 답은 ID 배열들의 배열이어야 합니다.');
    else value.alternatives.forEach((list, index) => selectedRefs(list, `alternatives[${index}]`));
  }
  for (const key of ['minNotes', 'maxNotes', 'maxSelections']) if (value[key] !== undefined && (!positiveInt(value[key]) || value[key] > 256)) error(key, '1–256 정수로 지정하세요.');
  if (finite(value.minNotes) && finite(value.maxNotes) && value.minNotes > value.maxNotes) error('minNotes', '최소 음 수가 최대 음 수보다 큽니다.');
  if (finite(value.maxSelections) && Array.isArray(value.target) && value.target.length > value.maxSelections) error('maxSelections', '목표보다 선택 상한이 작아 완료할 수 없습니다.');
  if (value.bassPitchClass !== undefined && (!Number.isInteger(value.bassPitchClass) || Number(value.bassPitchClass) < 0 || Number(value.bassPitchClass) > 11)) error('bassPitchClass', '베이스 음급은 0–11 정수입니다.');
  if (value.bassPitchClass !== undefined && value.kind !== 'pitch_collection') error('bassPitchClass', '현재 베이스 판정은 pitch_collection에서만 지원합니다.');
  if (value.beatUnit !== undefined) rational(value.beatUnit, 'beatUnit');
  if (value.tonalCenter !== undefined) validatePitch(value.tonalCenter, 'tonalCenter');
  if (value.meter !== undefined) {
    if (!isRecord(value.meter) || !positiveInt(value.meter.numerator) || ![1, 2, 4, 8, 16, 32].includes(Number(value.meter.denominator))) error('meter', '박자표는 양의 분자와 1·2·4·8·16·32 중 하나의 분모를 사용하세요.');
    else if (value.meter.groups !== undefined && (!Array.isArray(value.meter.groups) || !value.meter.groups.every(positiveInt) || value.meter.groups.reduce((sum: number, group: number) => sum + group, 0) !== value.meter.numerator)) error('meter.groups', '큰박 묶음의 합계는 박자표 분자와 같아야 합니다.');
  }
  if (value.notation !== undefined) {
    if (!isRecord(value.notation) || !['treble', 'bass'].includes(String(value.notation.clef)) || !isText(value.notation.noteId) || !noteIds.has(value.notation.noteId)) error('notation', '지원 음자리표 treble/bass와 notes에 있는 음 ID가 필요합니다.');
  }
  if (value.lockedMelody !== undefined) {
    if (!stringArray(value.lockedMelody)) error('lockedMelody', '고정 선율의 음 ID 배열이어야 합니다.');
    else value.lockedMelody.forEach((id, index) => { if (!noteIds.has(id)) error(`lockedMelody[${index}]`, '고정 선율 음 데이터가 notes에 없습니다.'); });
  }
  if (value.listeningSequence !== undefined) {
    if (!stringArray(value.listeningSequence) || value.listeningSequence.length < 2) error('listeningSequence', '청음 문제의 실제 음 ID를 두 개 이상 순서대로 지정하세요.');
    else value.listeningSequence.forEach((id, index) => { if (!noteIds.has(id)) error(`listeningSequence[${index}]`, '재생할 청음 자극 음이 notes에 없습니다.'); });
  }
  for (const key of ['listeningSeconds', 'listeningGapSeconds']) if (value[key] !== undefined && (!finite(value[key]) || value[key] < (key === 'listeningSeconds' ? 0.1 : 0) || value[key] > 10)) error(key, '청음 길이·간격은 0–10초의 유한수이며 소리 길이는 0.1초 이상이어야 합니다.');
  if (value.kind === 'listen_identify' && !value.listeningSequence) error('listeningSequence', '청음 판정에는 답과 분리된 재생 자극이 필요합니다.');
  if (value.harmony !== undefined) {
    if (!Array.isArray(value.harmony)) error('harmony', '화성 이벤트 배열이어야 합니다.');
    else value.harmony.forEach((event, index) => {
      const path = `harmony[${index}]`;
      if (!isRecord(event) || !finite(event.atBeat) || event.atBeat < 0 || !finite(event.beats) || event.beats <= 0 || !isText(event.symbol) || !stringArray(event.noteIds)) { error(path, '시작 박, 양의 길이, 화음명, 음 ID 배열이 필요합니다.'); return; }
      event.noteIds.forEach((id, noteIndex) => { if (!noteIds.has(id)) error(`${path}.noteIds[${noteIndex}]`, '화음 구성음이 notes에 없습니다.'); });
    });
  }
  if (value.interval !== undefined) {
    if (!isRecord(value.interval) || !isText(value.interval.fromNoteId) || !noteIds.has(value.interval.fromNoteId) || !positiveInt(value.interval.diatonicNumber) || !Number.isInteger(value.interval.semitones) || Number(value.interval.semitones) < 0 || !['up', 'down'].includes(String(value.interval.direction))) error('interval', '기준음, 양의 문자 도수, 0 이상의 반음 수, up/down 방향이 필요합니다.');
  }
  if (value.interval !== undefined && value.kind !== 'interval_route') error('interval', '음정 경성 조건은 interval_route에서만 지원합니다. 다른 종류에서는 이 조건이 판정되지 않습니다.');
  if (value.voiceSource !== undefined) {
    if (!isRecord(value.voiceSource) || !Object.keys(value.voiceSource).length) error('voiceSource', '성부 이름별 출발 음 ID가 필요합니다.');
    else for (const [voice, id] of Object.entries(value.voiceSource)) if (!isText(voice) || !isText(id) || !noteIds.has(id)) error(`voiceSource.${voice}`, '성부의 출발음을 notes에 있는 ID로 지정하세요.');
  }
  if (value.kind === 'voice_assignment' && !isRecord(value.voiceSource)) error('voiceSource', '성부 연결에는 고정된 성부 ID별 출발음이 필요합니다.');
  if (value.voiceSource !== undefined && value.kind !== 'voice_assignment') error('voiceSource', '성부별 이동 조건은 voice_assignment에서만 판정합니다.');
  if (value.constraints !== undefined && value.kind !== 'creative_phrase' && value.kind !== 'rhythm_grid') error('constraints', '제약 판정은 creative_phrase와 rhythm_grid에서만 지원합니다. 다른 종류에 추가하면 해당 조건을 평가할 수 없습니다.');
  if (value.reproducePattern !== undefined && value.kind !== 'rhythm_grid') error('reproducePattern', '정확한 패턴 재현 플래그는 rhythm_grid에만 적용합니다.');
  if (value.constraints !== undefined) {
    if (!isRecord(value.constraints)) error('constraints', '창작 조건은 객체여야 합니다.');
    else {
      const rules = value.constraints;
      const supportedRules = new Set(['length', 'allowedPitchClasses', 'requiredPitchClasses', 'targetPositions', 'endPitchClasses', 'minRests', 'totalBeats', 'maxLeapSemitones', 'allowChromaticApproach']);
      for (const key of Object.keys(rules)) if (!supportedRules.has(key)) error(`constraints.${key}`, '지원하지 않는 창작 조건입니다. 이 조건을 무시하고 통과시키지 않습니다.');
      for (const key of ['length', 'minRests', 'maxLeapSemitones']) if (rules[key] !== undefined && (!Number.isInteger(rules[key]) || Number(rules[key]) < (key === 'length' ? 1 : 0) || Number(rules[key]) > 256)) error(`constraints.${key}`, '범위에 맞는 정수를 입력하세요. 길이는 1–256, 그 외는 0–256입니다.');
      for (const key of ['allowedPitchClasses', 'requiredPitchClasses', 'endPitchClasses']) if (rules[key] !== undefined && (!Array.isArray(rules[key]) || rules[key].length === 0 || !rules[key].every(pc => Number.isInteger(pc) && pc >= 0 && pc <= 11) || new Set(rules[key]).size !== rules[key].length)) error(`constraints.${key}`, '중복 없는 0–11 음급 배열을 입력하세요.');
      if (rules.totalBeats !== undefined) rational(rules.totalBeats, 'constraints.totalBeats');
      if (rules.allowChromaticApproach !== undefined && typeof rules.allowChromaticApproach !== 'boolean') error('constraints.allowChromaticApproach', '참 또는 거짓이어야 합니다.');
      if (rules.targetPositions !== undefined) {
        if (!isRecord(rules.targetPositions)) error('constraints.targetPositions', '0부터 시작하는 칸 번호별 허용 후보 ID 배열이 필요합니다.');
        else for (const [position, ids] of Object.entries(rules.targetPositions)) {
          if (!/^\d+$/.test(position) || (finite(rules.length) && Number(position) >= rules.length)) error(`constraints.targetPositions.${position}`, '칸 번호가 구절 길이 밖입니다.');
          selectedRefs(ids, `constraints.targetPositions.${position}`);
        }
      }
      if (finite(rules.length) && finite(value.maxSelections) && rules.length > value.maxSelections) error('maxSelections', '창작 길이보다 선택 상한이 작아 완료할 수 없습니다.');
      if (finite(rules.length) && finite(rules.minRests) && rules.minRests > rules.length) error('constraints.minRests', '필수 쉼 개수가 전체 칸보다 큽니다.');
      if (rules.totalBeats && Array.isArray(value.options) && value.options.some(option => !isRecord(option) || option.beats === undefined)) error('options', '총길이 과제의 모든 선택 블록에는 명시적인 beats가 필요합니다.');
      if (rules.totalBeats && !Array.isArray(value.options)) error('options', '총길이 판정에는 음·쉼마다 beats를 가진 선택 블록이 필요합니다.');
    }
  }
  if (value.kind === 'creative_phrase' && (!isRecord(value.constraints) || Object.keys(value.constraints).length === 0)) error('constraints', '자유 창작을 예시의 정확한 음순서로 판정할 수 없습니다. 공개 제약을 추가하거나 별도 따라 만들기 활동으로 바꾸세요.');
  if (value.kind === 'listen_identify' && Array.isArray(value.supports) && value.supports.includes('silent')) warning('supports', '무음으로 진행할 수 있지만 청음 성취는 미측정으로 기록해야 합니다.');
  if (value.kind === 'rhythm_perform') warning('kind', '블록 충돌 시각으로 정밀 리듬을 평가하지 않습니다. 신뢰할 수 있는 별도 입력 시간축이 필요합니다.');
  if (!value.reviewStatus) warning('reviewStatus', '전문가 검수 여부를 표시하세요. 자동 검사 통과는 전문가 검수를 뜻하지 않습니다.');

  // A declared example is a witness that all hard constraints can be reached.
  // This also catches root-position/bass contradictions and impossible duration rules.
  if (!issues.some(issue => issue.severity === 'error') && value.supported !== false && value.kind !== 'listen_identify' && value.kind !== 'rhythm_perform') {
    const exercise = value as unknown as MusicExercise;
    try {
      const sample = evaluateAnswer(exercise, exercise.target);
      if (!sample.completed) error('target', `제시한 예시가 자신의 조건을 만족하지 않아 완료 경로가 확인되지 않습니다: ${sample.message}`);
      for (const [index, alternative] of (exercise.alternatives ?? []).entries()) if (!evaluateAnswer(exercise, alternative).completed) error(`alternatives[${index}]`, '허용 대안이 현재 조건으로 통과하지 않습니다. 조건 또는 대안을 수정하세요.');
    } catch { error('$', '판정 중 읽을 수 없는 조건이 발견됐습니다. 원본을 보존하고 스키마를 수정하세요.'); }
  }
  return issues;
}

export function isMusicExercise(value: unknown): value is MusicExercise {
  return !validateExercise(value).some(issue => issue.severity === 'error');
}

export function parseExercise(value: unknown): { exercise?: MusicExercise; issues: ValidationIssue[] } {
  const issues = validateExercise(value);
  return issues.some(issue => issue.severity === 'error') ? { issues } : { exercise: structuredClone(value as MusicExercise), issues };
}

export function validateCurriculum(exercises: readonly unknown[]): ValidationIssue[] {
  const ids = new Set<string>();
  return exercises.flatMap((exercise, index) => {
    const issues = validateExercise(exercise).map(issue => ({ ...issue, path: `[${index}].${issue.path}` }));
    if (isRecord(exercise) && isText(exercise.id)) {
      if (ids.has(exercise.id)) issues.push({ severity: 'error', path: `[${index}].id`, message: '전체 콘텐츠에서 과제 ID가 중복됐습니다.' });
      ids.add(exercise.id);
    }
    return issues;
  });
}
