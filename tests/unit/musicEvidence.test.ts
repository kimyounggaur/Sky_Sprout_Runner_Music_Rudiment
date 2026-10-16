import { describe, expect, it } from 'vitest';
import { getExercise } from '../../src/game/music/curriculum';
import { recommendedExercises, shouldOfferSupport, summarizeAttempt } from '../../src/game/music/evidence';
import { MusicSession, createRewardLedger } from '../../src/game/music/session';
import { MUSIC_PROGRESS_KEY, MusicProgressStore, validateProgressEnvelope, type LockPort, type StoragePort } from '../../src/game/music/persistence';

const completeC = (session: MusicSession) => { for (const id of ['C4', 'E4', 'G4']) session.select(id, { source: 'safe_selection' }); };

describe('U07 independent position transfer evidence', () => {
  it.each(['c', 'f'])('changes only candidate position and forces hidden-target practice for %s', room => {
    const original = getExercise(`f02-${room}`)!;
    const transfer = getExercise(`f02-${room}-transfer`)!;
    expect(transfer.id).not.toBe(original.id);
    expect(transfer.target).toEqual(original.target);
    expect(transfer.notes.map(note => note.id)).not.toEqual(original.notes.map(note => note.id));
    expect([...transfer.notes].sort((a, b) => a.id.localeCompare(b.id))).toEqual([...original.notes].sort((a, b) => a.id.localeCompare(b.id)));
    const session = new MusicSession(transfer, createRewardLedger(), { mode: 'guided' });
    expect(session.getSnapshot().settings.mode).toBe('practice');
    expect(session.getSnapshot().environmentValidity.answerExposed).toBe(false);
    expect(session.getSnapshot().supportsUsed).not.toContain('next_target_visible');
  });
  it('records original guided and transfer outcomes separately without claiming hearing or broad mastery', () => {
    const original = new MusicSession(getExercise('f02-c')!); completeC(original);
    const transfer = new MusicSession(getExercise('f02-c-transfer')!, original.getLedger()); completeC(transfer);
    expect(original.getRecord().contentId).not.toBe(transfer.getRecord().contentId);
    expect(summarizeAttempt(original.getRecord()).result).toContain('도움 사용');
    const evidence = summarizeAttempt(transfer.getRecord());
    expect(evidence.result).toBe('위치 변경 조건 충족 · 답 미노출');
    expect(evidence.unmeasured).toContain('청음');
    expect(evidence.unmeasured).toContain('장기 숙달');
    expect(transfer.getLedger().balance).toBe(2);
  });
  it('keeps hint and demonstration exposure even if the activity succeeds or is retried', () => {
    const session = new MusicSession(getExercise('f02-c-transfer')!);
    session.useDemonstration(); session.useHint(); completeC(session);
    expect(summarizeAttempt(session.getRecord()).supports).toEqual(expect.arrayContaining(['힌트·해설 사용', '시범 재생 사용', '안전 선택 사용']));
    expect(summarizeAttempt(session.getRecord()).result).toContain('도움 사용');
    session.retry();
    expect(session.getSnapshot().environmentValidity.answerExposed).toBe(true);
  });
  it('records explicit editor answer exposure independently of global practice mode', () => {
    const session = new MusicSession({ ...getExercise('f02-c')!, answerDisplay: 'visible' }, createRewardLedger(), { mode: 'practice' });
    expect(session.getSnapshot().environmentValidity.answerExposed).toBe(true);
    expect(summarizeAttempt(session.getRecord()).supports).toContain('답 표시 설정');
  });
});

describe('U29/U54/U55 bounded observation, support and reflection', () => {
  it('separates three falls and one invalid contact from music condition mismatches', () => {
    const session = new MusicSession(getExercise('f02-c')!);
    session.recordInteraction('fall'); session.recordInteraction('fall'); session.recordInteraction('fall');
    session.recordInteraction('invalid_contact'); completeC(session);
    const record = session.getRecord();
    expect(record).toMatchObject({ completed: true, motorEvents: 3, invalidEvents: 1, conditionMismatches: 0, inputMode: 'safe' });
    const evidence = summarizeAttempt(record);
    expect(evidence.motorObservation).toContain('음악 조건은 충족');
    expect(evidence.unmeasured).toEqual(['청음', '정밀 실시간 리듬', '실제 악기 연주', '내청', '장기 숙달']);
  });
  it('retains explicit user text without assigning an artistic score or altering the reward', () => {
    const session = new MusicSession(getExercise('a07-targets')!);
    for (const id of ['F4', 'G4', 'A4', 'C5', 'B4', 'G4', 'F4', 'D4', 'E4', 'G4', 'A4', 'C5']) session.select(id);
    session.submit();
    const before = session.getRecord();
    session.setReflection('  마지막 E가 좋아요. 다음에는 쉼을 더 넣을래요.  ');
    const after = session.getRecord();
    expect(after.reflection?.text).toBe('마지막 E가 좋아요. 다음에는 쉼을 더 넣을래요.');
    expect(after.completed).toBe(before.completed);
    expect(after.outcome).toBe(before.outcome);
    expect(after.answerSnapshot).toEqual(before.answerSnapshot);
    expect(session.getLedger().balance).toBe(1);
    session.setReflection('가'.repeat(1200)); expect(session.getRecord().reflection?.text.length).toBe(1000);
    session.retry(); expect(session.getRecord().reflection).toBeUndefined();
  });
  it('offers optional prerequisites for repeated attempts without diagnosing or forcing a lock', () => {
    const session = new MusicSession(getExercise('f13-c-major')!);
    session.select('Eb4'); session.submit(); session.submit();
    expect(shouldOfferSupport(session.getRecord())).toBe(true);
    expect(recommendedExercises('F13').map(item => item.moduleId)).toEqual(['F02', 'F09']);
    expect(recommendedExercises('F02')).toEqual([]);
    expect(session.getRecord().completed).toBe(false);
    expect(session.getLedger().balance).toBe(0);
  });
  it('records direct skip as a user navigation decision and never as a passed diagnostic', () => {
    const session = new MusicSession(getExercise('f13-c-major')!);
    session.select('C4'); session.recordSkip('already_familiar', 'f19-c-251');
    const attempt = session.getRecord();
    expect(attempt.navigationDecision).toMatchObject({ kind: 'direct_skip', reason: 'already_familiar', targetContentId: 'f19-c-251', diagnosisPerformed: false });
    expect(attempt.completed).toBe(false);
    expect(attempt.answerSnapshot).toEqual(['C4']);
    expect(summarizeAttempt(attempt).result).toBe('직접 건너뛰기 · 진단 없음');
    expect(session.getLedger().balance).toBe(0);
  });
  it('reports later completion when a learner returns to a previously skipped attempt', () => {
    const session = new MusicSession(getExercise('f02-c')!);
    expect(summarizeAttempt(session.getRecord()).input).toBe('점프 경로');
    session.recordSkip('explore_first', 'f02-f');
    session.pause(); session.resume(); completeC(session);
    const attempt = session.getRecord();
    expect(attempt.navigationDecision?.diagnosisPerformed).toBe(false);
    expect(summarizeAttempt(attempt).result).toBe('활동 조건 충족 · 도움 사용');
    expect(summarizeAttempt(attempt).input).toBe('안전 선택 경로');
    expect(session.getLedger().balance).toBe(1);
  });
});

class MemoryStorage implements StoragePort {
  data = new Map<string, string>();
  getItem(key: string) { return this.data.get(key) ?? null; }
  setItem(key: string, value: string) { this.data.set(key, value); }
}
const locks: LockPort = { request: async (_key, callback) => callback() };

describe('optional evidence fields preserve old records and survive reload', () => {
  it('round trips self reflection, skip reason and support metadata', async () => {
    const storage = new MemoryStorage(); const store = new MusicProgressStore(storage, locks);
    const loaded = store.load();
    const session = new MusicSession(getExercise('a07-targets')!, loaded.envelope.ledger);
    session.setReflection('내가 쓴 기록'); session.useDemonstration(); session.recordSkip('explore_first', 'a08-comping');
    const result = await store.save({ ledger: session.getLedger(), attempts: [session.getRecord()], settings: { ...session.getSnapshot().settings } });
    expect(result.status).toBe('saved');
    const restored = new MusicProgressStore(storage, locks).load();
    expect(restored.envelope.attempts[0]).toMatchObject({ reflection: { text: '내가 쓴 기록' }, navigationDecision: { diagnosisPerformed: false } });
    const legacy = JSON.parse(storage.getItem(MUSIC_PROGRESS_KEY)!);
    delete legacy.attempts[0].reflection; delete legacy.attempts[0].navigationDecision; delete legacy.attempts[0].submissionCount;
    expect(validateProgressEnvelope(legacy)).toBe(true);
  });
  it('rejects malformed optional evidence instead of trusting stale or tampered user text metadata', async () => {
    const storage = new MemoryStorage(); const store = new MusicProgressStore(storage, locks); const loaded = store.load();
    const session = new MusicSession(getExercise('a07-targets')!, loaded.envelope.ledger);
    session.setReflection('safe');
    await store.save({ ledger: session.getLedger(), attempts: [session.getRecord()], settings: { ...session.getSnapshot().settings } });
    const invalid = JSON.parse(storage.getItem(MUSIC_PROGRESS_KEY)!);
    invalid.attempts[0].reflection.text = { unexpected: 'object' };
    expect(validateProgressEnvelope(invalid)).toBe(false);
    invalid.attempts[0].reflection.text = 'safe';
    invalid.attempts[0].navigationDecision = { kind: 'direct_skip', reason: 'explore_first', diagnosisPerformed: true, timestamp: 1 };
    expect(validateProgressEnvelope(invalid)).toBe(false);
  });
});
