import { DEFAULT_MUSIC_SETTINGS, createRewardLedger, type AttemptRecord, type MusicSettings, type RewardLedger } from './session';

/** Deliberately separate from the original game's bestscore and map economy. */
export const MUSIC_PROGRESS_KEY = 'sky-sprout.music.progress.v1';
export const MUSIC_PROGRESS_VERSION = 1;
export interface ProgressEnvelope {
  schemaVersion: 1; profileScope: string; revision: number; writerId: string; updatedAt: number;
  ledger: RewardLedger; attempts: readonly AttemptRecord[]; settings: MusicSettings;
}
export type SaveStatus = 'empty' | 'ready' | 'saved' | 'corrupt' | 'unavailable' | 'readonly';
export interface ProgressResult { status: SaveStatus; envelope: ProgressEnvelope; message: string }
export interface ProgressPayload { ledger: RewardLedger; attempts: readonly AttemptRecord[]; settings: MusicSettings }
export interface StoragePort { getItem(key: string): string | null; setItem(key: string, value: string): void }
export interface LockPort { request<T>(name: string, callback: () => Promise<T> | T): Promise<T> }
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const uid = (): string => typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const strings = (value: unknown): value is string[] => Array.isArray(value) && value.every(item => typeof item === 'string');
const validSettings = (value: unknown): value is MusicSettings => record(value) && ['fixed_do', 'movable_do'].includes(String(value.solfege)) && ['guided', 'practice'].includes(String(value.mode)) && typeof value.mute === 'boolean' && typeof value.reducedMotion === 'boolean' && typeof value.safeSelection === 'boolean';
const validAttempt = (value: unknown): value is AttemptRecord => {
  if (!record(value) || !['attemptId', 'sessionId', 'contentId', 'contentVersion', 'moduleId', 'assessmentDomain'].every(key => typeof value[key] === 'string') || !strings(value.answerSnapshot) || !strings(value.supportsUsed)) return false;
  if (!['platform', 'safe', 'mixed'].includes(String(value.inputMode)) || !['satisfied', 'equivalent', 'task_mismatch', 'partial', 'context_caution', 'review_required', 'unmeasured'].includes(String(value.outcome)) || typeof value.completed !== 'boolean') return false;
  if (!record(value.environmentValidity) || !['audioAvailable', 'muted', 'timingReliable', 'interrupted', 'answerExposed'].every(key => typeof (value.environmentValidity as Record<string, unknown>)[key] === 'boolean')) return false;
  if (value.submissionCount !== undefined && (!Number.isSafeInteger(value.submissionCount) || Number(value.submissionCount) < 0)) return false;
  if (value.reflection !== undefined && (!record(value.reflection) || typeof value.reflection.text !== 'string' || value.reflection.text.length > 1000 || typeof value.reflection.updatedAt !== 'number' || !Number.isFinite(value.reflection.updatedAt) || value.reflection.updatedAt < 0)) return false;
  if (value.navigationDecision !== undefined && (!record(value.navigationDecision) || value.navigationDecision.kind !== 'direct_skip' || !['already_familiar', 'explore_first', 'teacher_choice', 'need_different_input'].includes(String(value.navigationDecision.reason)) || value.navigationDecision.diagnosisPerformed !== false || typeof value.navigationDecision.timestamp !== 'number' || !Number.isFinite(value.navigationDecision.timestamp) || value.navigationDecision.timestamp < 0 || (value.navigationDecision.targetContentId !== undefined && typeof value.navigationDecision.targetContentId !== 'string'))) return false;
  return record(value.notationProfile) && ['fixed_do', 'movable_do'].includes(String(value.notationProfile.solfege)) && ['motorEvents', 'invalidEvents', 'conditionMismatches', 'timestamp'].every(key => typeof value[key] === 'number' && Number.isFinite(value[key]) && (value[key] as number) >= 0);
};
export function validateProgressEnvelope(value: unknown): value is ProgressEnvelope {
  if (!record(value) || value.schemaVersion !== MUSIC_PROGRESS_VERSION || typeof value.profileScope !== 'string' || !value.profileScope || typeof value.writerId !== 'string' || !Number.isSafeInteger(value.revision) || (value.revision as number) < 0 || !Number.isFinite(value.updatedAt) || !record(value.ledger) || !validSettings(value.settings) || !Array.isArray(value.attempts)) return false;
  const ledger = value.ledger;
  return ledger.scope === value.profileScope && strings(ledger.keys) && new Set(ledger.keys).size === ledger.keys.length && ledger.balance === ledger.keys.length && value.attempts.length <= 200 && value.attempts.every(validAttempt) && new Set(value.attempts.map(attempt => attempt.attemptId)).size === value.attempts.length;
}
function browserStorage(): StoragePort | undefined { try { return typeof localStorage === 'undefined' ? undefined : localStorage; } catch { return undefined; } }
function browserLocks(): LockPort | undefined { return typeof navigator !== 'undefined' && 'locks' in navigator ? navigator.locks : undefined; }

/** Atomic single-envelope writes serialized with Web Locks; other writers become read-only. */
export class MusicProgressStore {
  private storage?: StoragePort;
  private locks?: LockPort;
  private envelope: ProgressEnvelope;
  private baseRevision: number | null = null;
  private blocked: 'corrupt' | 'unavailable' | 'readonly' | null = null;
  private loaded = false;
  private writerId = uid();

  constructor(storage: StoragePort | undefined = browserStorage(), locks: LockPort | null | undefined = browserLocks()) {
    this.storage = storage; this.locks = locks ?? undefined;
    const scope = `local-${uid()}`;
    this.envelope = { schemaVersion: 1, profileScope: scope, revision: 0, writerId: this.writerId, updatedAt: Date.now(), ledger: createRewardLedger(scope), attempts: [], settings: { ...DEFAULT_MUSIC_SETTINGS } };
  }

  load(): ProgressResult {
    if (this.loaded) return this.response(this.blocked ?? (this.baseRevision === null ? 'empty' : 'ready'));
    this.loaded = true;
    if (!this.storage) { this.blocked = 'unavailable'; return this.response('unavailable'); }
    try {
      const raw = this.storage.getItem(MUSIC_PROGRESS_KEY);
      if (raw === null) return this.response('empty');
      const parsed: unknown = JSON.parse(raw);
      if (!validateProgressEnvelope(parsed)) { this.blocked = 'corrupt'; return this.response('corrupt'); }
      this.envelope = copy(parsed); this.baseRevision = parsed.revision;
      return this.response('ready');
    } catch (error) { this.blocked = error instanceof SyntaxError ? 'corrupt' : 'unavailable'; return this.response(this.blocked); }
  }

  async save(payload: ProgressPayload): Promise<ProgressResult> {
    if (!this.loaded) this.load();
    // Preserve the running session even when its storage write fails.
    const next: ProgressEnvelope = { ...this.envelope, profileScope: payload.ledger.scope, ledger: copy(payload.ledger), attempts: copy(payload.attempts.slice(-200)), settings: copy(payload.settings), updatedAt: Date.now(), writerId: this.writerId, revision: (this.baseRevision ?? 0) + 1 };
    if (!validateProgressEnvelope(next) || next.profileScope !== this.envelope.profileScope) return { ...this.response('unavailable'), message: '저장 데이터 검증에 실패했습니다. 현재 세션은 유지됩니다.' };
    this.envelope = next;
    if (this.blocked || !this.storage || !this.locks) return this.response(this.blocked ?? 'unavailable');
    try {
      return await this.locks.request(MUSIC_PROGRESS_KEY, () => {
        const raw = this.storage!.getItem(MUSIC_PROGRESS_KEY);
        if (raw === null ? this.baseRevision !== null : !this.currentRevisionMatches(raw)) {
          if (!this.blocked) this.blocked = 'readonly';
          return this.response(this.blocked);
        }
        next.revision = (this.baseRevision ?? 0) + 1;
        this.storage!.setItem(MUSIC_PROGRESS_KEY, JSON.stringify(next));
        this.baseRevision = next.revision;
        this.envelope = next;
        return this.response('saved');
      });
    } catch { return this.response('unavailable'); }
  }

  private currentRevisionMatches(raw: string): boolean {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!validateProgressEnvelope(parsed)) { this.blocked = 'corrupt'; return false; }
      return parsed.revision === this.baseRevision && parsed.profileScope === this.envelope.profileScope;
    } catch { this.blocked = 'corrupt'; return false; }
  }
  private response(status: SaveStatus): ProgressResult {
    const messages: Record<SaveStatus, string> = {
      empty: '이 기기의 새 학습 기록입니다.', ready: '이 기기에 저장한 학습 기록을 불러왔습니다.', saved: '이 기기에 학습 기록을 저장했습니다.',
      corrupt: '기존 저장 형식을 확인할 수 없습니다. 원본을 덮어쓰지 않고 현재 세션만 유지합니다.',
      unavailable: '로컬 저장을 사용할 수 없습니다. 현재 세션은 유지되지만 새로고침 뒤 복구는 보장되지 않습니다.',
      readonly: '다른 탭에서 학습 기록이 변경되었습니다. 이 탭의 답은 유지하며 덮어쓰지 않습니다.',
    };
    return { status, envelope: copy(this.envelope), message: messages[status] };
  }
}
