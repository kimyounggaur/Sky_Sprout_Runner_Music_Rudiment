import { matchRhythmInputs, type TimingMatch } from './domain';
import type { ScheduledSound } from './audio';

/** Prototype stability gates, not clinical/device latency or musical ability norms. */
export const CALIBRATION_POLICY = Object.freeze({ sampleCount: 8, maxStdDevMs: 30, maxRangeMs: 100, maxAbsoluteOffsetMs: 250, version: 'local-response-bias-v1' });
export type CalibrationStatus = 'stable' | 'unstable' | 'insufficient' | 'unmeasured' | 'invalidated';
export interface ResponseCalibration {
  status: CalibrationStatus; responseOffsetMs: number | null; rawErrorsMs: readonly number[];
  meanMs: number | null; medianMs: number | null; stdDevMs: number | null; rangeMs: number | null;
  routeRevision: number; policyVersion: string; message: string;
}
export interface CalibrationEvidence { outputClockValid: boolean; routeRevision: number; expectedSamples?: number; extraInputs?: number }

export function estimateResponseCalibration(rawErrorsMs: readonly number[], evidence: CalibrationEvidence): ResponseCalibration {
  const samples = Object.freeze([...rawErrorsMs]);
  const base = { rawErrorsMs: samples, responseOffsetMs: null, meanMs: null, medianMs: null, stdDevMs: null, rangeMs: null, routeRevision: evidence.routeRevision, policyVersion: CALIBRATION_POLICY.version };
  if (!evidence.outputClockValid || samples.some(sample => !Number.isFinite(sample))) return Object.freeze({ ...base, status: 'unmeasured', message: '출력 시계나 입력 시각을 확인할 수 없어 반응 편향은 미측정입니다.' });
  const expected = evidence.expectedSamples ?? CALIBRATION_POLICY.sampleCount;
  if (samples.length !== expected || expected < CALIBRATION_POLICY.sampleCount || (evidence.extraInputs ?? 0) > 0) return Object.freeze({ ...base, status: 'insufficient', message: `유효한 ${expected}박에 하나씩 입력한 표본이 필요합니다. 누락·추가 입력이 있어 보정을 보류합니다.` });
  const sorted = [...samples].sort((a, b) => a - b), middle = Math.floor(samples.length / 2);
  const medianMs = samples.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
  const meanMs = samples.reduce((sum, sample) => sum + sample, 0) / samples.length;
  const stdDevMs = Math.sqrt(samples.reduce((sum, sample) => sum + (sample - meanMs) ** 2, 0) / samples.length);
  const rangeMs = sorted[sorted.length - 1] - sorted[0];
  const observations = { ...base, meanMs, medianMs, stdDevMs, rangeMs };
  if (stdDevMs > CALIBRATION_POLICY.maxStdDevMs || rangeMs > CALIBRATION_POLICY.maxRangeMs || Math.abs(medianMs) > CALIBRATION_POLICY.maxAbsoluteOffsetMs) return Object.freeze({ ...observations, status: 'unstable', message: '반응 표본의 변동 또는 편향이 시제품 기준을 넘었습니다. 보정을 적용하지 않고 다시 측정할 수 있습니다.' });
  return Object.freeze({ ...observations, status: 'stable', responseOffsetMs: medianMs, message: '이번 표본의 반응 편향을 추정했습니다. 장치 지연만을 측정한 값은 아닙니다.' });
}

export function invalidateResponseCalibration(calibration: ResponseCalibration, routeRevision: number): ResponseCalibration {
  return Object.freeze({ ...calibration, status: 'invalidated', responseOffsetMs: null, routeRevision, message: '출력 경로나 연주 환경이 바뀌어 이전 보정을 적용하지 않습니다. 새 카운트인으로 다시 확인하세요.' });
}
export function applicableResponseOffset(calibration: ResponseCalibration | null, routeRevision: number): number | null {
  return calibration?.status === 'stable' && calibration.routeRevision === routeRevision ? calibration.responseOffsetMs : null;
}

export interface RhythmTakeEvidence {
  targets: readonly number[]; inputs: readonly number[]; bpm: number; outputClockValid: boolean;
  interrupted: boolean; routeRevision: number; responseOffsetMs: number | null;
}
export interface RhythmObservation {
  status: 'observed' | 'unmeasured'; targets: readonly number[]; rawInputs: readonly number[];
  matches: readonly TimingMatch[]; extraInputIndices: readonly number[]; missedTargetIndices: readonly number[];
  responseOffsetMs: number | null; windowMs: number; message: string;
}
/** Error is always inputPerformanceMs - already mapped targetOutputPerformanceMs. */
export function observeRhythmTake(evidence: RhythmTakeEvidence, windowMs: number): RhythmObservation {
  const base = { targets: Object.freeze([...evidence.targets]), rawInputs: Object.freeze([...evidence.inputs]), responseOffsetMs: evidence.responseOffsetMs, windowMs };
  if (!evidence.outputClockValid || evidence.interrupted || !Number.isFinite(windowMs) || windowMs < 0 || (evidence.responseOffsetMs !== null && !Number.isFinite(evidence.responseOffsetMs)) || [...evidence.targets, ...evidence.inputs].some(time => !Number.isFinite(time))) {
    return Object.freeze({ ...base, status: 'unmeasured', matches: [], extraInputIndices: [], missedTargetIndices: [], message: '테이크가 중단되었거나 시계가 불확실하여 미측정입니다. 입력 원자료는 보존했습니다.' });
  }
  const matched = matchRhythmInputs(evidence.inputs, evidence.targets, windowMs, evidence.responseOffsetMs ?? 0);
  return Object.freeze({ ...base, status: 'observed', matches: Object.freeze(matched.matches.map(match => Object.freeze({ ...match }))), extraInputIndices: Object.freeze(matched.extraInputs), missedTargetIndices: Object.freeze(matched.missedTargets), message: '원래 입력 시각을 비교했습니다. 음수는 빠름, 양수는 늦음이며 능력 점수는 산출하지 않습니다.' });
}

export type ReplayMode = 'raw' | 'quantized';
export interface RhythmReplay { mode: ReplayMode; label: string; anchorPerformanceMs: number; inputOnsetsMs: readonly number[]; referenceOnsetsMs: readonly number[]; events: ScheduledSound[] }
/** A new playback copy only. Raw input evidence and previous observation never change. */
export function createRhythmReplay(evidence: Pick<RhythmTakeEvidence, 'targets' | 'inputs' | 'bpm'>, mode: ReplayMode): RhythmReplay {
  if (!Number.isFinite(evidence.bpm) || evidence.bpm < 40 || evidence.bpm > 160 || !evidence.targets.length || !evidence.inputs.length || evidence.inputs.length > 128 || [...evidence.targets, ...evidence.inputs].some(time => !Number.isFinite(time))) throw new Error('재생에는 유효한 목표 시각·1~128개의 원입력·40~160 BPM이 필요합니다.');
  const beatMs = 60000 / evidence.bpm, firstTarget = evidence.targets[0];
  const replayInputs = evidence.inputs.map(input => mode === 'raw' ? input : firstTarget + Math.round((input - firstTarget) / beatMs) * beatMs);
  const anchorPerformanceMs = Math.min(firstTarget, ...replayInputs);
  const inputOnsetsMs = replayInputs.map(input => input - anchorPerformanceMs);
  const referenceOnsetsMs = evidence.targets.map(target => target - anchorPerformanceMs);
  const events: ScheduledSound[] = [
    ...referenceOnsetsMs.map(onset => ({ notes: [{ midi: 84 }], onsetBeats: onset / beatMs, durationBeats: 0.1, velocity: 0.25 })),
    ...inputOnsetsMs.map(onset => ({ notes: [{ midi: 60 }], onsetBeats: onset / beatMs, durationBeats: 0.16, velocity: 0.75 })),
  ].sort((a, b) => a.onsetBeats - b.onsetBeats);
  return { mode, label: mode === 'raw' ? '원입력 재생 · 입력 간격 그대로' : '양자화 재생 · 가까운 박으로 옮긴 사본', anchorPerformanceMs, inputOnsetsMs: Object.freeze(inputOnsetsMs), referenceOnsetsMs: Object.freeze(referenceOnsetsMs), events };
}
