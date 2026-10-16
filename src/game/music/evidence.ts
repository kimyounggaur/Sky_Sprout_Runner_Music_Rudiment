import { MUSIC_EXERCISES, getExercise } from './curriculum';
import type { Exercise } from './domain';
import type { AttemptRecord, SkipReason } from './session';

export const SKIP_REASONS: Record<SkipReason, string> = {
  already_familiar: '이미 익숙해서 다른 활동 먼저',
  explore_first: '다른 내용을 먼저 탐색',
  teacher_choice: '교사가 선택한 활동으로 이동',
  need_different_input: '다른 입력 방식이나 활동이 필요함'
};

const domains: Record<string, string> = {
  theory: '이론 구성', symbolic_theory: '기호와 이론', pitch_relation_visual: '시각 음높이 관계',
  notation_reading: '기보 읽기', rhythm_construction: '리듬 배치', expression_symbol: '표현 기호 이해',
  representation_transfer: '도수 관계의 이조', constrained_composition: '공개 제약 창작',
  form_structure: '형식 구성', arrangement_structure: '파트 배치', tuning_configuration: '조율 설정',
  listening: '청음 응답', transfer_pitch_order: '위치 변경 지정 순서'
};

export function summarizeAttempt(attempt: AttemptRecord) {
  const supports = [
    attempt.supportsUsed.includes('next_target_visible') && '안내 목표 표시',
    attempt.supportsUsed.includes('answer_display_visible') && '답 표시 설정',
    attempt.supportsUsed.includes('answer_hint') && '힌트·해설 사용',
    attempt.supportsUsed.includes('demonstration') && '시범 재생 사용',
    attempt.supportsUsed.includes('safe_selection') && '안전 선택 사용'
  ].filter((item): item is string => !!item);
  const listeningValid = attempt.assessmentDomain === 'listening' && attempt.environmentValidity.audioAvailable && !attempt.environmentValidity.muted && !attempt.environmentValidity.interrupted && !attempt.environmentValidity.answerExposed;
  const unmeasured = [...(!listeningValid ? ['청음'] : []), '정밀 실시간 리듬', '실제 악기 연주', '내청', '장기 숙달'];
  const aided = attempt.environmentValidity.answerExposed || attempt.supportsUsed.includes('demonstration');
  const transfer = attempt.assessmentDomain === 'transfer_pitch_order';
  const result = attempt.completed ? transfer ? `위치 변경 조건 충족${aided ? ' · 도움 사용' : ' · 답 미노출'}` : `활동 조건 충족${aided ? ' · 도움 사용' : ''}`
    : attempt.navigationDecision ? '직접 건너뛰기 · 진단 없음'
      : attempt.outcome === 'unmeasured' ? '미측정' : attempt.outcome === 'review_required' ? '검토 필요' : '연습 중';
  const motorObservation = attempt.motorEvents > 0 && attempt.completed
    ? `낙하 ${attempt.motorEvents}회가 있었지만 음악 조건은 충족했습니다. 이동 연습과 음악 이해를 따로 봅니다.`
    : attempt.motorEvents > 0 ? `낙하 ${attempt.motorEvents}회는 이동 사건이며 음악 오답에 합산하지 않습니다.` : '기록한 낙하가 없습니다.';
  return { domain: domains[attempt.assessmentDomain] ?? attempt.assessmentDomain, result,
    supports, unmeasured, motorObservation, aided, transfer, listeningValid,
    input: attempt.inputMode === 'safe' ? '안전 선택 경로' : attempt.inputMode === 'platform' ? '점프 경로' : '점프 + 안전 선택 경로' };
}

/** Recommendations are optional routes, never unlock requirements or diagnoses. */
const prerequisites: Record<string, readonly string[]> = {
  F01: [], F02: [], F03: ['F02'], F04: ['F02'], F05: [], F06: ['F05'], F07: ['F05', 'F06'],
  F08: ['F04'], F09: ['F08'], F10: ['F03', 'F08'], F11: ['F08', 'F10'], F12: ['F10', 'F11'],
  F13: ['F02', 'F09'], F14: ['F09', 'F13'], F15: ['F13'], F16: ['F10', 'F13'], F17: ['F09', 'F13', 'F16'],
  F18: ['F15', 'F17'], F19: ['F16', 'F18'], F20: ['F12', 'F17', 'F19'], F21: ['F05', 'F06', 'F07'],
  F22: ['F06', 'F21'], F23: ['F05', 'F07'], F24: ['F10', 'F11'],
  J01: ['F09', 'F17'], J02: ['F17', 'F19'], J03: ['J01', 'J02'], J04: ['F15', 'J02'], J05: ['F15', 'F17'],
  J06: ['J01', 'J03'], J07: ['F09', 'J04'], J08: ['F18', 'F19'], J09: ['J02', 'J08'], J10: ['J11', 'F18'],
  J11: ['F12', 'F16'], J12: ['F17', 'J04'], J13: ['F14', 'J01'], J14: ['F18', 'J04'], J15: ['F15', 'J06'],
  J16: ['F10', 'F12'], J17: ['F09', 'F10'], J18: ['J17', 'F17'], J19: ['F18', 'J18'], J20: ['J19', 'J21'],
  J21: ['F19', 'J08'], J22: ['F12', 'J16'], J23: ['F12', 'F20'], J24: ['J01', 'J22'], J25: ['F09', 'J12'],
  J26: ['J01', 'J16'], J27: ['J08', 'J11'], J28: ['J04', 'J26'],
  A01: ['F09', 'F17'], A02: ['A01'], A03: ['F07', 'A01'], A04: ['F21', 'J16'], A05: ['F05', 'F10'],
  A06: ['F05', 'A05'], A07: ['A01', 'A05', 'F19'], A08: ['J02', 'F21'], A09: ['F17', 'A01'],
  A10: ['F06', 'F21'], A11: ['F06', 'A10'], A12: ['F13', 'J06'], A13: ['J04', 'J16'], A14: ['A05', 'A07'],
  A15: ['J03', 'A08'], A16: ['F19', 'A05', 'A07'],
  X01: ['F09', 'A05'], X02: ['J15', 'A15'], X03: ['F01', 'F08'], X04: ['J28', 'A16'],
  X05: ['F09', 'J04'], X06: ['X01', 'A05'], X07: ['F06'], X08: []
};

export function recommendedExercises(moduleId: string): Exercise[] {
  return (prerequisites[moduleId] ?? []).flatMap(id => {
    const found = MUSIC_EXERCISES.find(item => item.moduleId === id && item.kind !== 'listen_identify');
    return found ? [found] : [];
  });
}

export function shouldOfferSupport(attempt: AttemptRecord): boolean {
  return !attempt.completed && (attempt.conditionMismatches >= 2 || (attempt.submissionCount ?? 0) >= 2 || attempt.motorEvents >= 2);
}

export function exerciseForAttempt(attempt: AttemptRecord): Exercise | undefined { return getExercise(attempt.contentId); }
