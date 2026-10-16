import { describe, expect, it } from 'vitest';
import { frequencyFor, matchTaps, quarterMs } from '../../src/game/music/audio';

describe('S10 music pitch, beat and performance clock contracts', () => {
  it('keeps tuning and cents independent', () => {
    expect(frequencyFor({ midi: 69 })).toBe(440);
    expect(frequencyFor({ midi: 60 })).toBeCloseTo(261.625565, 5);
    expect(frequencyFor({ midi: 64, centsOffset: 25, tuningA4Hz: 442 }) / frequencyFor({ midi: 64, tuningA4Hz: 442 })).toBeCloseTo(2 ** (25 / 1200));
    expect(() => frequencyFor({ midi: NaN })).toThrow();
  });
  it('distinguishes quarter=60 and dotted-quarter=60 in 6/8', () => {
    expect(quarterMs(60)).toBe(1000);
    expect(quarterMs(60, 1.5) * 3).toBe(2000);
  });
  it.each([-100, 100])('includes synthetic window boundary %i', (offset) => {
    expect(matchTaps([1000], [1000 + offset], 100).matches[0].rawErrorMs).toBe(offset);
  });
  it.each([-101, 101])('excludes synthetic window boundary %i', (offset) => {
    expect(matchTaps([1000], [1000 + offset], 100).extraInputs).toEqual([1000 + offset]);
  });
  it('matches one input only once and retains additional and missing taps', () => {
    const result = matchTaps([1000, 1050, 2000], [1025, 1026, 1027], 100);
    expect(result.matches.filter(m => m.inputMs !== null)).toHaveLength(2);
    // 1025 and 1027 yield the least total deviation, while one tap remains extra.
    expect(result.extraInputs).toEqual([1026]);
    expect(result.matches[2].inputMs).toBeNull();
  });
  it('uses output-mapped targets directly; subtracts response bias exactly once', () => {
    const result = matchTaps([1080], [1100], 100, 12);
    expect(result.matches[0]).toMatchObject({ rawErrorMs: 20, correctedErrorMs: 8 });
  });
});
