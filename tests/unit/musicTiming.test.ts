import { describe, expect, it } from 'vitest';
import { CALIBRATION_POLICY, applicableResponseOffset, createRhythmReplay, estimateResponseCalibration, invalidateResponseCalibration, observeRhythmTake, type RhythmTakeEvidence } from '../../src/game/music/timing';

const validEvidence = { outputClockValid: true, routeRevision: 4 };
const take = (overrides: Partial<RhythmTakeEvidence> = {}): RhythmTakeEvidence => ({ targets: [1000, 1750, 2500, 3250], inputs: [1080, 1830, 2580, 3330], bpm: 80, outputClockValid: true, interrupted: false, routeRevision: 4, responseOffsetMs: null, ...overrides });

describe('U21 response-bias calibration stability', () => {
  it('accepts a stable sample while keeping original errors and separating device latency', () => {
    const errors = [75, 80, 85, 78, 82, 76, 84, 80];
    const calibration = estimateResponseCalibration(errors, validEvidence);
    expect(calibration.status).toBe('stable');
    expect(calibration.responseOffsetMs).toBe(80);
    expect(calibration.rawErrorsMs).toEqual(errors);
    expect(calibration.rawErrorsMs).not.toBe(errors);
    expect(calibration.message).toContain('장치 지연만을 측정한 값은 아닙니다');
    expect(Object.isFrozen(calibration.rawErrorsMs)).toBe(true);
    errors[0] = 500;
    expect(calibration.rawErrorsMs[0]).toBe(75);
  });
  it('includes the declared dispersion boundary and defers a noisier sample', () => {
    const boundary = [-30, 30, -30, 30, -30, 30, -30, 30];
    expect(estimateResponseCalibration(boundary, validEvidence).status).toBe('stable');
    const unstable = estimateResponseCalibration(boundary.map(value => value * 1.1), validEvidence);
    expect(unstable.status).toBe('unstable');
    expect(unstable.responseOffsetMs).toBeNull();
    expect(unstable.stdDevMs).toBeGreaterThan(CALIBRATION_POLICY.maxStdDevMs);
  });
  it.each([250, -250])('accepts the declared absolute offset boundary %i ms', offset => {
    expect(estimateResponseCalibration(Array(8).fill(offset), validEvidence).status).toBe('stable');
  });
  it('defers a stable but out-of-range offset instead of silently clamping it', () => {
    const result = estimateResponseCalibration(Array(8).fill(251), validEvidence);
    expect(result.status).toBe('unstable');
    expect(result.medianMs).toBe(251);
    expect(result.responseOffsetMs).toBeNull();
  });
  it('does not certify missing samples, extra taps or an invalid clock', () => {
    expect(estimateResponseCalibration(Array(7).fill(80), validEvidence).status).toBe('insufficient');
    expect(estimateResponseCalibration(Array(8).fill(80), { ...validEvidence, extraInputs: 1 }).status).toBe('insufficient');
    expect(estimateResponseCalibration(Array(8).fill(80), { ...validEvidence, outputClockValid: false }).status).toBe('unmeasured');
    expect(estimateResponseCalibration([0, 0, 0, 0, 0, 0, 0, NaN], validEvidence).status).toBe('unmeasured');
  });
});

describe('U22 clock, device and interruption evidence', () => {
  it('invalidates calibration after output route change and preserves the samples', () => {
    const previous = estimateResponseCalibration(Array(8).fill(80), validEvidence);
    expect(applicableResponseOffset(previous, 4)).toBe(80);
    expect(applicableResponseOffset(previous, 5)).toBeNull();
    const invalidated = invalidateResponseCalibration(previous, 5);
    expect(applicableResponseOffset(invalidated, 5)).toBeNull();
    expect(invalidated.status).toBe('invalidated');
    expect(invalidated.rawErrorsMs).toEqual(previous.rawErrorsMs);
    expect(previous.status).toBe('stable');
  });
  it('subtracts a captured response bias exactly once from output-mapped targets', () => {
    const observed = observeRhythmTake(take({ responseOffsetMs: 80 }), 100);
    expect(observed.status).toBe('observed');
    expect(observed.matches).toHaveLength(4);
    for (const match of observed.matches) expect(match).toMatchObject({ rawErrorMs: 80, correctedErrorMs: 0 });
    expect(observed.rawInputs).toEqual([1080, 1830, 2580, 3330]);
  });
  it('preserves raw inputs after interruption without calling hidden beats missed answers', () => {
    const observed = observeRhythmTake(take({ inputs: [1080], interrupted: true }), 100);
    expect(observed.status).toBe('unmeasured');
    expect(observed.rawInputs).toEqual([1080]);
    expect(observed.missedTargetIndices).toEqual([]);
    expect(observed.matches).toEqual([]);
  });
  it('does not produce timing observations when output mapping is unavailable', () => {
    expect(observeRhythmTake(take({ outputClockValid: false }), 100).status).toBe('unmeasured');
    expect(observeRhythmTake(take({ responseOffsetMs: NaN }), 100).status).toBe('unmeasured');
  });
});

describe('U28 original and quantized playback copies', () => {
  it('plays original offsets and a separately labelled snapped copy without changing the take', () => {
    const evidence = take({ inputs: [1080, 1710, 2595, 3210] });
    const before = JSON.stringify(evidence), observation = observeRhythmTake(evidence, 110);
    const original = createRhythmReplay(evidence, 'raw'), quantized = createRhythmReplay(evidence, 'quantized');
    expect(original.inputOnsetsMs).toEqual([80, 710, 1595, 2210]);
    expect(quantized.inputOnsetsMs).toEqual([0, 750, 1500, 2250]);
    expect(original.label).toContain('원입력'); expect(quantized.label).toContain('양자화');
    expect(JSON.stringify(evidence)).toBe(before);
    expect(observation.matches.map(match => match.rawErrorMs)).toEqual([80, -40, 95, -40]);
    expect(original.events.filter(event => event.notes[0].midi === 60)).toHaveLength(4);
    expect(original.events.filter(event => event.notes[0].midi === 84)).toHaveLength(4);
  });
  it('retains an early first tap relative to the audible reference without negative scheduling', () => {
    const replay = createRhythmReplay(take({ inputs: [900, 1780] }), 'raw');
    expect(replay.anchorPerformanceMs).toBe(900);
    expect(replay.inputOnsetsMs).toEqual([0, 880]);
    expect(replay.referenceOnsetsMs[0]).toBe(100);
    expect(replay.events.every(event => event.onsetBeats >= 0)).toBe(true);
  });
  it('keeps repeated inputs in playback evidence and never rewrites the timing result', () => {
    const evidence = take({ inputs: [990, 1010, 1750] });
    const observed = observeRhythmTake(evidence, 100), original = [...observed.rawInputs];
    const quantized = createRhythmReplay(evidence, 'quantized');
    expect(quantized.inputOnsetsMs).toHaveLength(3);
    expect(quantized.inputOnsetsMs.slice(0, 2)).toEqual([0, 0]);
    expect(observed.rawInputs).toEqual(original);
    expect(observed.extraInputIndices).toHaveLength(1);
  });
  it('rejects missing replay evidence and out-of-bounds input', () => {
    expect(() => createRhythmReplay(take({ inputs: [] }), 'raw')).toThrow();
    expect(() => createRhythmReplay(take({ bpm: 0 }), 'quantized')).toThrow();
    expect(() => createRhythmReplay(take({ inputs: Array(129).fill(1000) }), 'raw')).toThrow();
  });
});
