import { describe, expect, it } from 'vitest';
import { actualBass, addRational, equalRational, evaluateAnswer, frequencyForPitch, intervalBetween, matchRhythmInputs, pitchName, rational, samePitch, solfegeName, spelledPitchToMidi, voiceLeadingDistance, type Exercise, type Pitch } from '../../src/game/music/domain';
import { createRewardLedger, MusicSession } from '../../src/game/music/session';
import { MUSIC_PROGRESS_KEY, MusicProgressStore, validateProgressEnvelope, type LockPort, type StoragePort } from '../../src/game/music/persistence';

const pitch = (id: string, letter: Pitch['letter'], octave: number, accidental = 0): Pitch => ({ id, letter, octave, accidental, midi: spelledPitchToMidi({ letter, octave, accidental }) });
const c4 = pitch('c4', 'C', 4), e4 = pitch('e4', 'E', 4), g4 = pitch('g4', 'G', 4), c5 = pitch('c5', 'C', 5), f4 = pitch('f4', 'F', 4), a4 = pitch('a4', 'A', 4);
const lesson = (overrides: Partial<Exercise> = {}): Exercise => ({ id: 'c-triad', moduleId: 'F02', title: 'C 구성음', stage: 2, objective: '도 미 솔 순서', explanation: '음높이와 순서를 확인합니다.', kind: 'ordered_pitch', notes: [c4, e4, g4, c5], target: ['c4', 'e4', 'g4'], contentVersion: '1.0.0', rewardEpoch: 'initial', ...overrides });
const completeC = (session: MusicSession) => { session.select('c4'); session.select('e4'); session.select('g4'); };

describe('music pitch and theory contracts', () => {
  it.each([['C', 4, 0, 60], ['F', 4, 0, 65], ['A', 4, 0, 69], ['C', 5, 0, 72], ['B', 3, 1, 60], ['C', 4, -1, 59], ['B', 3, -2, 57]] as const)('keeps written octave for %s%d accidental %d', (letter, octave, accidental, midi) => {
    expect(spelledPitchToMidi({ letter, octave, accidental })).toBe(midi);
  });
  it('keeps frequency, tuning and spelling separate', () => {
    expect(frequencyForPitch(a4)).toBe(440);
    expect(frequencyForPitch({ ...a4, tuningA4Hz: 442 })).toBe(442);
    expect(frequencyForPitch({ ...a4, centsOffset: 1200 })).toBe(880);
    expect(samePitch(a4, { ...a4, tuningA4Hz: 442 })).toBe(false);
    const bs3 = pitch('bs3', 'B', 3, 1);
    expect(pitchName(bs3)).toBe('B♯3');
    expect(samePitch(bs3, c4, 'exact')).toBe(true);
    expect(samePitch(bs3, c4, 'spelling')).toBe(false);
    expect(samePitch(c4, c5)).toBe(false);
    expect(samePitch(c4, c5, 'pitch_class')).toBe(true);
  });
  it('does not mix fixed-do with relative movable-do accidentals', () => {
    expect(solfegeName(f4)).toBe('파');
    expect(solfegeName(f4, { solfege: 'movable_do', tonalCenter: f4 })).toBe('도');
    const fs4 = pitch('fs4', 'F', 4, 1);
    expect(solfegeName(fs4, { solfege: 'movable_do', tonalCenter: g4 })).toBe('시');
    expect(solfegeName(f4, { solfege: 'movable_do', tonalCenter: g4 })).toBe('시♭');
    expect(solfegeName(a4, { solfege: 'movable_do', tonalCenter: a4, minorConvention: 'la_based' })).toBe('라');
  });
  it('distinguishes compound intervals, direction and letter distance', () => {
    expect(intervalBetween(c4, pitch('d5', 'D', 5))).toEqual({ semitones: 14, diatonicNumber: 9, direction: 'up' });
    expect(intervalBetween(c5, e4)).toEqual({ semitones: -8, diatonicNumber: 6, direction: 'down' });
    expect(intervalBetween(c4, pitch('ds4', 'D', 4, 1)).diatonicNumber).toBe(2);
    expect(intervalBetween(c4, pitch('ef4', 'E', 4, -1)).diatonicNumber).toBe(3);
  });
  it('accepts reordered collections but requires the declared octave and spelling policy', () => {
    const collection = lesson({ kind: 'pitch_collection' });
    expect(evaluateAnswer(collection, ['g4', 'c4', 'e4']).outcome).toBe('equivalent');
    expect(evaluateAnswer(collection, ['c5', 'e4', 'g4']).completed).toBe(false);
    expect(evaluateAnswer({ ...collection, equality: 'pitch_class' }, ['c5', 'e4', 'g4']).completed).toBe(true);
    const cs4 = pitch('cs4', 'C', 4, 1), df4 = pitch('df4', 'D', 4, -1);
    expect(evaluateAnswer(lesson({ kind: 'notated_pitch', notes: [cs4, df4], target: ['cs4'], equality: 'spelling' }), ['df4']).completed).toBe(false);
  });
  it('takes actual lowest sounding note as bass regardless of click order', () => {
    const collection = lesson({ kind: 'pitch_collection', bassPitchClass: 0 });
    expect(actualBass([e4, c4, g4])?.id).toBe('c4');
    expect(evaluateAnswer(collection, ['e4', 'c4', 'g4']).completed).toBe(true);
    expect(evaluateAnswer({ ...collection, bassPitchClass: 4 }, ['e4', 'c4', 'g4']).code).toBe('actual_bass_mismatch');
  });
  it('measures stable voice identities instead of sorting notes', () => {
    const f3 = pitch('f3', 'F', 3), b3 = pitch('b3', 'B', 3), e3 = pitch('e3', 'E', 3);
    expect(voiceLeadingDistance({ low: f3, high: c4 }, { low: f3, high: b3 })).toBe(1);
    expect(voiceLeadingDistance({ low: f3, high: b3 }, { low: e3, high: b3 })).toBe(1);
    expect(voiceLeadingDistance({ low: f3, high: c4 }, { low: c4, high: f3 })).toBe(14);
    expect(voiceLeadingDistance({ low: f3 }, { other: f3 })).toBeNull();
  });
});

describe('music duration, creative and environment contracts', () => {
  it('sums tuplets exactly and rejects invalid durations', () => {
    const triplet = rational(1, 3);
    expect(equalRational(addRational(addRational(triplet, triplet), triplet), rational(1))).toBe(true);
    expect(rational(6, 4)).toEqual({ numerator: 3, denominator: 2 });
    expect(() => rational(-1)).toThrow();
    expect(() => rational(1, 0)).toThrow();
  });
  it('allows different rhythm constructions with total duration and rests', () => {
    const rhythm = lesson({ kind: 'rhythm_grid', options: [
      { id: 'q', label: '4분음표', noteIds: ['c4'], beats: rational(1) },
      { id: 'h', label: '2분음표', noteIds: ['c4'], beats: rational(2) },
      { id: 'r', label: '4분쉼표', rest: true, beats: rational(1) },
    ], target: ['q', 'q', 'q', 'r'], constraints: { totalBeats: rational(4), minRests: 1 } });
    expect(evaluateAnswer(rhythm, ['h', 'q', 'r']).completed).toBe(true);
    expect(evaluateAnswer(rhythm, ['r', 'r', 'h']).completed).toBe(true);
    expect(evaluateAnswer(rhythm, ['h', 'h']).completed).toBe(false);
    expect(evaluateAnswer({ ...rhythm, constraints: undefined, target: ['q'] }, ['h']).completed).toBe(false);
  });
  it('accepts multiple creative phrases by constraints, never a single model answer', () => {
    const creative = lesson({ kind: 'creative_phrase', target: ['c4', 'e4', 'g4'], constraints: { length: 3, allowedPitchClasses: [0, 4, 7], endPitchClasses: [0] } });
    for (const answer of [['c4', 'e4', 'c4'], ['g4', 'g4', 'c4'], ['e4', 'g4', 'c5']]) expect(evaluateAnswer(creative, answer).completed).toBe(true);
    expect(evaluateAnswer({ ...creative, constraints: undefined }, ['c4', 'e4', 'g4']).outcome).toBe('review_required');
  });
  it('allows a declared chromatic approach resolving by semitone', () => {
    const fs4 = pitch('fs4', 'F', 4, 1);
    const creative = lesson({ kind: 'creative_phrase', notes: [c4, e4, g4, fs4], constraints: { allowedPitchClasses: [0, 4, 7], allowChromaticApproach: true } });
    expect(evaluateAnswer(creative, ['fs4', 'g4']).completed).toBe(true);
    expect(evaluateAnswer(creative, ['g4', 'fs4']).completed).toBe(false);
  });
  it('leaves silent listening and untrusted rhythm unmeasured', () => {
    expect(evaluateAnswer(lesson({ kind: 'listen_identify' }), ['c4', 'e4', 'g4'], { audioAvailable: true, muted: true }).outcome).toBe('unmeasured');
    expect(evaluateAnswer(lesson({ kind: 'listen_identify' }), ['c4', 'e4', 'g4'], { audioAvailable: true, answerExposed: true }).outcome).toBe('unmeasured');
    expect(evaluateAnswer(lesson({ kind: 'rhythm_perform' }), ['c4']).outcome).toBe('unmeasured');
    expect(evaluateAnswer(lesson(), ['c4', 'e4', 'g4'], { muted: true }).completed).toBe(true);
  });
  it.each([-100, -101, 100, 101])('uses inclusive timing window at %ims with one coordinate system', delta => {
    const matched = matchRhythmInputs([1000 + delta], [1000], 100);
    expect(matched.matches.length).toBe(Math.abs(delta) <= 100 ? 1 : 0);
    if (matched.matches[0]) expect(matched.matches[0].rawErrorMs).toBe(delta);
  });
  it('matches inputs and targets one-to-one and keeps raw response offset data', () => {
    expect(matchRhythmInputs([1000], [950, 1050], 100).matches).toHaveLength(1);
    expect(matchRhythmInputs([990, 1000, 1010], [1000], 100).extraInputs).toHaveLength(2);
    expect(matchRhythmInputs([1080], [1000], 10, 80).matches[0]).toMatchObject({ rawErrorMs: 80, correctedErrorMs: 0 });
    expect(matchRhythmInputs([90, 170], [0, 100], 100).matches).toHaveLength(2);
  });
});

describe('music session lifecycle and reward ledger', () => {
  it('preserves C progress through G mismatch, falls and invalid contacts', () => {
    const session = new MusicSession(lesson());
    session.select('c4'); session.select('g4'); session.recordInteraction('fall'); session.recordInteraction('invalid_contact'); session.select('e4');
    expect(session.getSnapshot()).toMatchObject({ accepted: ['c4', 'e4'], motorEvents: 1, invalidEvents: 1, conditionMismatches: 1 });
    session.select('g4');
    expect(session.getSnapshot()).toMatchObject({ state: 'completed', musicRewardBalance: 1 });
    expect(session.getRecord().assessmentDomain).toBe('symbolic_theory');
    expect(session.getRecord().supportsUsed).toContain('next_target_visible');
  });
  it('rejects C4 in the exact F4 A4 C5 exercise', () => {
    const session = new MusicSession(lesson({ id: 'f-triad', notes: [f4, a4, c4, c5], target: ['f4', 'a4', 'c5'] }));
    session.select('f4'); session.select('a4'); session.select('c4');
    expect(session.getSnapshot().accepted).toEqual(['f4', 'a4']);
    session.select('c5'); expect(session.getSnapshot().state).toBe('completed');
  });
  it('deduplicates event IDs, 60 contact frames and cross-source actions', () => {
    const session = new MusicSession(lesson());
    for (let index = 0; index < 60; index++) session.select('c4', { source: 'head_contact', contactEpisodeId: 'contact-1', eventId: `frame-${index}`, actionId: 'one-action' });
    session.select('e4', { source: 'safe_selection', actionId: 'one-action' });
    expect(session.getSnapshot().rawResponses).toHaveLength(1);
    session.select('e4', { eventId: 'second' }); session.select('g4', { eventId: 'second' });
    expect(session.getSnapshot().accepted).toEqual(['c4', 'e4']);
    session.select('g4', { source: 'head_contact', contactEpisodeId: 'new-contact' });
    for (let i = 0; i < 100; i++) session.submit({ eventId: `complete-${i}` });
    expect(session.getLedger().balance).toBe(1);
  });
  it('ignores held keys, stale attempts and paused input; preserves completion when paused', () => {
    const session = new MusicSession(lesson());
    const stale = session.getSnapshot().attemptId;
    session.retry(); session.select('c4', { attemptId: stale }); session.select('c4', { repeat: true }); session.pause(); session.select('c4');
    expect(session.getSnapshot().accepted).toEqual([]);
    session.resume(); completeC(session); session.pause();
    expect(session.getRecord().completed).toBe(true);
    session.resume(); expect(session.getSnapshot().state).toBe('completed');
  });
  it('fixes content and notation snapshots for the entire attempt', () => {
    const content = lesson(), settings = { solfege: 'fixed_do' as const };
    const session = new MusicSession(content, createRewardLedger(), settings);
    content.contentVersion = 'edited'; content.target = ['g4'];
    const before = session.getSnapshot(); session.select('c4');
    expect(before.accepted).toEqual([]);
    expect(session.getSnapshot().contentVersion).toBe('1.0.0');
    expect(session.getSnapshot().exercise.target).toEqual(['c4', 'e4', 'g4']);
    expect(Object.isFrozen(session.getSnapshot().exercise.target)).toBe(true);
    expect(session.getSnapshot().notationProfile.solfege).toBe('fixed_do');
  });
  it('keeps one reward across replay, content updates, C/F interleaving and new sessions', () => {
    const cSession = new MusicSession(lesson(), createRewardLedger('stable-profile'));
    completeC(cSession);
    const fSession = new MusicSession(lesson({ id: 'f-triad', notes: [f4, a4, c5], target: ['f4', 'a4', 'c5'] }), cSession.getLedger());
    fSession.select('f4'); fSession.select('a4'); fSession.select('c5');
    cSession.syncLedger(fSession.getLedger()); cSession.retry(); completeC(cSession);
    expect(cSession.getLedger().balance).toBe(2);
    const updated = new MusicSession(lesson({ contentVersion: '2.0.0' }), cSession.getLedger()); completeC(updated);
    expect(updated.getLedger().balance).toBe(2);
    expect(updated.getSnapshot().rewardEarned).toBe(0);
  });
  it('safe selection and platform selection share the exact knowledge contract', () => {
    const safe = new MusicSession(lesson(), createRewardLedger(), { safeSelection: true });
    for (const id of ['c4', 'e4', 'g4']) safe.select(id, { source: 'safe_selection' });
    expect(safe.getRecord()).toMatchObject({ completed: true, inputMode: 'safe', motorEvents: 0 });
    expect(safe.getRecord().supportsUsed).toContain('safe_selection');
  });
  it('does not label available supports as actually used', () => {
    const session = new MusicSession(lesson({ supports: ['safe_selection', 'silent', 'touch'] }), createRewardLedger(), { mode: 'practice' });
    expect(session.getRecord().supportsUsed).toEqual([]);
    session.select('c4', { source: 'safe_selection' });
    expect(session.getRecord().supportsUsed).toEqual(['safe_selection']);
  });
  it('rejects hidden accompaniment notes outside the selectable options', () => {
    const content = lesson({ kind: 'pitch_collection', options: [{ id: 'upper-c', label: '선율 C4', noteIds: ['c4'] }], target: ['upper-c'] });
    const session = new MusicSession(content);
    session.select('e4', { source: 'safe_selection' });
    expect(session.getSnapshot()).toMatchObject({ selected: [], rawResponses: [], invalidEvents: 1, conditionMismatches: 0 });
    expect(evaluateAnswer(content, ['e4']).outcome).toBe('review_required');
    session.select('upper-c'); session.submit();
    expect(session.getSnapshot().state).toBe('completed');
  });
});

class MemoryStorage implements StoragePort {
  values = new Map<string, string>();
  fail = false;
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { if (this.fail) throw new Error('quota'); this.values.set(key, value); }
}
const locks: LockPort = { request: async <T>(_name: string, callback: () => T | Promise<T>) => callback() };
const storedPayload = (store: MusicProgressStore) => {
  const loaded = store.load(); const session = new MusicSession(lesson(), loaded.envelope.ledger); completeC(session);
  return { ledger: session.getLedger(), attempts: [session.getRecord()], settings: { ...session.getSnapshot().settings } };
};

describe('music-only local progress persistence', () => {
  it('round trips one envelope and preserves existing bestscore bytes', async () => {
    const storage = new MemoryStorage(); storage.setItem('bestscore', '{"score":1234}');
    const store = new MusicProgressStore(storage, locks), payload = storedPayload(store);
    expect((await store.save(payload)).status).toBe('saved');
    const loaded = new MusicProgressStore(storage, locks).load();
    expect(loaded.status).toBe('ready');
    expect(loaded.envelope.ledger.balance).toBe(1);
    expect(loaded.envelope.attempts[0].supportsUsed).toContain('next_target_visible');
    expect(storage.getItem('bestscore')).toBe('{"score":1234}');
    const retry = new MusicSession(lesson(), loaded.envelope.ledger); completeC(retry);
    expect(retry.getLedger().balance).toBe(1);
  });
  it('does not overwrite corrupt JSON or unsupported versions', async () => {
    const storage = new MemoryStorage(); storage.setItem(MUSIC_PROGRESS_KEY, '{bad');
    const store = new MusicProgressStore(storage, locks), payload = storedPayload(store);
    expect(store.load().status).toBe('corrupt');
    expect((await store.save(payload)).status).toBe('corrupt');
    expect(storage.getItem(MUSIC_PROGRESS_KEY)).toBe('{bad');
    expect(validateProgressEnvelope({ schemaVersion: 99 })).toBe(false);
  });
  it('retains in-memory answers and ledger if quota is exceeded', async () => {
    const storage = new MemoryStorage(), store = new MusicProgressStore(storage, locks), payload = storedPayload(store);
    storage.fail = true;
    const failed = await store.save(payload);
    expect(failed.status).toBe('unavailable');
    expect(failed.envelope.ledger.balance).toBe(1);
    expect(failed.envelope.attempts[0].completed).toBe(true);
    storage.fail = false; expect((await store.save(payload)).status).toBe('saved');
  });
  it('makes a competing writer read-only without overwriting the other tab', async () => {
    const storage = new MemoryStorage(), first = new MusicProgressStore(storage, locks), second = new MusicProgressStore(storage, locks);
    const firstPayload = storedPayload(first), secondPayload = storedPayload(second);
    expect((await first.save(firstPayload)).status).toBe('saved');
    const original = storage.getItem(MUSIC_PROGRESS_KEY);
    expect((await second.save(secondPayload)).status).toBe('readonly');
    expect(storage.getItem(MUSIC_PROGRESS_KEY)).toBe(original);
  });
  it('retains session only when atomic locking is unavailable', async () => {
    const storage = new MemoryStorage(), store = new MusicProgressStore(storage, null), payload = storedPayload(store);
    expect((await store.save(payload)).status).toBe('unavailable');
    expect(storage.getItem(MUSIC_PROGRESS_KEY)).toBeNull();
  });
});
