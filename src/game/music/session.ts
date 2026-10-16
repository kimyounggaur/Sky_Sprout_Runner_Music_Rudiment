import { evaluateAnswer, isSelectableId, type EvaluationEnvironment, type EvaluationResult, type Exercise, type NotationProfile } from './domain';

export interface MusicSettings { solfege: 'fixed_do' | 'movable_do'; mode: 'guided' | 'practice'; mute: boolean; reducedMotion: boolean; safeSelection: boolean }
export const DEFAULT_MUSIC_SETTINGS: Readonly<MusicSettings> = Object.freeze({ solfege: 'fixed_do', mode: 'guided', mute: true, reducedMotion: false, safeSelection: false });
export interface RewardLedger { scope: string; keys: readonly string[]; balance: number }
export const createRewardLedger = (scope = 'local-default'): RewardLedger => ({ scope, keys: [], balance: 0 });
export const rewardKey = (scope: string, exercise: Pick<Exercise, 'id' | 'rewardEpoch'>): string => JSON.stringify([scope, exercise.id, exercise.rewardEpoch ?? 'music-v1']);
export type SessionState = 'preparing' | 'explaining' | 'active' | 'evaluating' | 'feedback' | 'completed' | 'transitioning' | 'paused' | 'review_required';
interface InputBase { eventId?: string; actionId?: string; sessionId?: string; attemptId?: string; inputTimestamp?: number; repeat?: boolean }
export type InputMeta = InputBase & ({ source: 'head_contact'; contactEpisodeId: string; blockId?: string } | { source?: 'safe_selection' | 'ui'; contactEpisodeId?: never });
export interface RawResponse { eventId: string; actionId?: string; source: 'head_contact' | 'safe_selection' | 'ui'; inputTimestamp: number; selection: string | null; action: 'select' | 'submit'; contactEpisodeId?: string }
export interface InteractionRecord { kind: 'fall' | 'invalid_contact' | 'ambiguous_contact'; inputTimestamp: number }
export interface SelfReflection { text: string; updatedAt: number }
export type SkipReason = 'already_familiar' | 'explore_first' | 'teacher_choice' | 'need_different_input';
export interface NavigationDecision { kind: 'direct_skip'; reason: SkipReason; targetContentId?: string; diagnosisPerformed: false; timestamp: number }
export interface AttemptRecord {
  attemptId: string; sessionId: string; contentId: string; contentVersion: string; moduleId: string;
  assessmentDomain: string; answerSnapshot: readonly string[]; supportsUsed: readonly string[];
  inputMode: 'platform' | 'safe' | 'mixed'; environmentValidity: Readonly<EvaluationEnvironment>;
  notationProfile: Readonly<NotationProfile>; outcome: EvaluationResult['outcome']; completed: boolean;
  motorEvents: number; invalidEvents: number; conditionMismatches: number; timestamp: number;
  submissionCount?: number; reflection?: SelfReflection; navigationDecision?: NavigationDecision;
}
export interface SessionSnapshot {
  sessionId: string; attemptId: string; contentId: string; contentVersion: string; exercise: Readonly<Exercise>;
  state: SessionState; accepted: readonly string[]; acceptedSlots: readonly string[]; selected: readonly string[];
  rawResponses: readonly RawResponse[]; interactions: readonly InteractionRecord[]; supportsUsed: readonly string[];
  settings: Readonly<MusicSettings>; notationProfile: Readonly<NotationProfile>; environmentValidity: Readonly<EvaluationEnvironment>;
  inputMode: 'platform' | 'safe' | 'mixed'; lastResult: EvaluationResult | null;
  motorEvents: number; invalidEvents: number; conditionMismatches: number; musicRewardBalance: number; rewardEarned: number;
  reflection?: SelfReflection; navigationDecision?: NavigationDecision;
}
let identifier = 0;
const newId = (prefix: string): string => `${prefix}-${Date.now().toString(36)}-${(++identifier).toString(36)}`;
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
function freeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null && !Object.isFrozen(value)) { Object.freeze(value); Object.values(value).forEach(child => freeze(child)); }
  return value;
}
const sealed = <T>(value: T): T => freeze(clone(value));

/** Single authoritative response port for both Phaser contacts and DOM selections. */
export class MusicSession {
  private snapshot: SessionSnapshot;
  private ledger: RewardLedger;
  private eventIds = new Set<string>();
  private actionIds = new Set<string>();
  private episodes = new Set<string>();
  private previousState: SessionState = 'active';

  constructor(exercise: Exercise, ledger: RewardLedger = createRewardLedger(), settings: Partial<MusicSettings> = {}) {
    this.ledger = sealed(ledger);
    const isTransferProbe = exercise.assessmentDomain === 'transfer_pitch_order';
    const effectiveSettings: MusicSettings = { ...DEFAULT_MUSIC_SETTINGS, ...settings, ...(isTransferProbe ? { mode: 'practice' as const } : {}) };
    this.snapshot = sealed({
      sessionId: newId('session'), attemptId: newId('attempt'), contentId: exercise.id, contentVersion: exercise.contentVersion ?? '1.0.0', exercise,
      state: 'active', accepted: [], acceptedSlots: [], selected: [], rawResponses: [], interactions: [],
      supportsUsed: [...(effectiveSettings.mode === 'guided' ? ['next_target_visible'] : []), ...(exercise.answerDisplay === 'visible' ? ['answer_display_visible'] : []), ...(effectiveSettings.safeSelection ? ['safe_selection'] : []), ...(isTransferProbe ? ['layout_transfer_probe'] : [])],
      settings: effectiveSettings, notationProfile: { solfege: effectiveSettings.solfege, tonalCenter: exercise.tonalCenter },
      environmentValidity: { audioAvailable: false, muted: effectiveSettings.mute, timingReliable: false, interrupted: false, answerExposed: effectiveSettings.mode === 'guided' || exercise.answerDisplay === 'visible' },
      inputMode: effectiveSettings.safeSelection ? 'safe' : 'platform', lastResult: null, motorEvents: 0, invalidEvents: 0,
      conditionMismatches: 0, musicRewardBalance: ledger.balance, rewardEarned: 0,
    });
  }

  getSnapshot(): SessionSnapshot { return this.snapshot; }
  getLedger(): RewardLedger { return this.ledger; }
  syncLedger(latest: RewardLedger): SessionSnapshot {
    if (latest.scope !== this.ledger.scope) throw new Error('서로 다른 로컬 프로필의 보상 원장은 합칠 수 없습니다.');
    const keys = [...new Set([...latest.keys, ...this.ledger.keys])];
    this.ledger = sealed({ scope: latest.scope, keys, balance: keys.length });
    return this.update({ musicRewardBalance: this.ledger.balance });
  }
  getRecord(): AttemptRecord {
    const state = this.snapshot;
    return sealed({ attemptId: state.attemptId, sessionId: state.sessionId, contentId: state.contentId, contentVersion: state.contentVersion, moduleId: state.exercise.moduleId,
      assessmentDomain: state.exercise.assessmentDomain ?? 'symbolic_theory', answerSnapshot: state.exercise.kind === 'ordered_pitch' ? state.accepted : state.selected,
      supportsUsed: state.supportsUsed, inputMode: state.inputMode, environmentValidity: state.environmentValidity, notationProfile: state.notationProfile,
      outcome: state.lastResult?.outcome ?? 'unmeasured', completed: state.lastResult?.completed ?? false, motorEvents: state.motorEvents, invalidEvents: state.invalidEvents,
      conditionMismatches: state.conditionMismatches, timestamp: Date.now(), submissionCount: state.rawResponses.filter(response => response.action === 'submit').length,
      ...(state.reflection ? { reflection: state.reflection } : {}), ...(state.navigationDecision ? { navigationDecision: state.navigationDecision } : {}) });
  }

  select(id: string, meta: InputMeta = {}): SessionSnapshot {
    if (!this.acceptEvent(meta)) return this.snapshot;
    const exercise = this.snapshot.exercise;
    if (!isSelectableId(exercise, id)) return this.recordInteraction('invalid_contact');
    const response = this.response('select', id, meta);
    const sourceMode = response.source === 'head_contact' ? 'platform' : 'safe';
    const inputMode = this.snapshot.rawResponses.length === 0 ? sourceMode : this.snapshot.inputMode === sourceMode ? sourceMode : 'mixed';
    this.update({ rawResponses: [...this.snapshot.rawResponses, response], inputMode,
      supportsUsed: response.source === 'safe_selection' ? [...new Set([...this.snapshot.supportsUsed, 'safe_selection'])] : this.snapshot.supportsUsed });
    if (exercise.kind === 'ordered_pitch') {
      const candidate = [...this.snapshot.accepted, id];
      const evaluation = evaluateAnswer(exercise, candidate, this.snapshot.environmentValidity);
      if (evaluation.outcome === 'partial' || evaluation.completed) this.update({ accepted: candidate, acceptedSlots: candidate, selected: candidate });
      this.applyEvaluation(evaluation);
    } else {
      if (this.snapshot.selected.length >= (exercise.maxSelections ?? 64)) return this.update({ lastResult: { outcome: 'context_caution', code: 'selection_capacity', message: '현재 답의 선택 한도에 도달했어요. 되돌리기로 수정할 수 있어요.', completed: false, matchedConditions: [], remainingConditions: [], observations: {} } });
      this.update({ selected: [...this.snapshot.selected, id], lastResult: null });
    }
    return this.snapshot;
  }

  submit(meta: InputMeta = {}): SessionSnapshot {
    if (!this.acceptEvent(meta)) return this.snapshot;
    const answer = [...this.snapshot.selected];
    this.update({ state: 'evaluating', rawResponses: [...this.snapshot.rawResponses, this.response('submit', null, meta)] });
    this.applyEvaluation(evaluateAnswer(this.snapshot.exercise, answer, this.snapshot.environmentValidity));
    return this.snapshot;
  }
  undo(): SessionSnapshot {
    if (this.snapshot.state !== 'active' && this.snapshot.state !== 'review_required') return this.snapshot;
    const selected = this.snapshot.selected.slice(0, -1);
    return this.update({ state: 'active', selected, ...(this.snapshot.exercise.kind === 'ordered_pitch' ? { accepted: selected, acceptedSlots: selected } : {}), lastResult: null });
  }
  clear(): SessionSnapshot {
    if (this.snapshot.state !== 'active' && this.snapshot.state !== 'review_required') return this.snapshot;
    return this.update({ state: 'active', selected: [], accepted: [], acceptedSlots: [], lastResult: null });
  }
  pause(): SessionSnapshot {
    if (this.snapshot.state === 'paused' || this.snapshot.state === 'transitioning') return this.snapshot;
    this.previousState = this.snapshot.state;
    return this.update({ state: 'paused', environmentValidity: { ...this.snapshot.environmentValidity, interrupted: true } });
  }
  resume(): SessionSnapshot { return this.snapshot.state === 'paused' ? this.update({ state: this.previousState, environmentValidity: { ...this.snapshot.environmentValidity, interrupted: false, timingReliable: false } }) : this.snapshot; }
  transition(): SessionSnapshot { return this.update({ state: 'transitioning' }); }
  retry(): SessionSnapshot {
    this.eventIds.clear(); this.actionIds.clear(); this.episodes.clear();
    return this.update({ state: 'active', attemptId: newId('attempt'), accepted: [], acceptedSlots: [], selected: [], rawResponses: [], interactions: [], lastResult: null, motorEvents: 0, invalidEvents: 0, conditionMismatches: 0, rewardEarned: 0, reflection: undefined, navigationDecision: undefined, environmentValidity: { ...this.snapshot.environmentValidity, interrupted: false, timingReliable: false } });
  }
  useHint(): SessionSnapshot { return this.update({ supportsUsed: [...new Set([...this.snapshot.supportsUsed, 'answer_hint'])], environmentValidity: { ...this.snapshot.environmentValidity, answerExposed: true } }); }
  useDemonstration(): SessionSnapshot { return this.update({ supportsUsed: [...new Set([...this.snapshot.supportsUsed, 'demonstration'])], environmentValidity: { ...this.snapshot.environmentValidity, answerExposed: true } }); }
  setReflection(text: string): SessionSnapshot {
    return this.update({ reflection: { text: text.trim().slice(0, 1000), updatedAt: Date.now() } });
  }
  recordSkip(reason: SkipReason, targetContentId?: string): SessionSnapshot {
    if (!['already_familiar', 'explore_first', 'teacher_choice', 'need_different_input'].includes(reason) || this.snapshot.state === 'completed') return this.snapshot;
    return this.update({ navigationDecision: { kind: 'direct_skip', reason, ...(targetContentId ? { targetContentId } : {}), diagnosisPerformed: false, timestamp: Date.now() } });
  }
  setEnvironment(environment: Partial<EvaluationEnvironment>): SessionSnapshot { return this.update({ environmentValidity: { ...this.snapshot.environmentValidity, ...environment } }); }
  recordInteraction(kind: InteractionRecord['kind']): SessionSnapshot {
    if (this.snapshot.state !== 'active') return this.snapshot;
    return this.update({ interactions: [...this.snapshot.interactions, { kind, inputTimestamp: Date.now() }], motorEvents: this.snapshot.motorEvents + (kind === 'fall' ? 1 : 0), invalidEvents: this.snapshot.invalidEvents + (kind === 'fall' ? 0 : 1) });
  }

  private update(change: Partial<SessionSnapshot>): SessionSnapshot { this.snapshot = sealed({ ...this.snapshot, ...change }); return this.snapshot; }
  private acceptEvent(meta: InputMeta): boolean {
    if (this.snapshot.state !== 'active' || meta.repeat || (meta.sessionId && meta.sessionId !== this.snapshot.sessionId) || (meta.attemptId && meta.attemptId !== this.snapshot.attemptId) || (meta.inputTimestamp !== undefined && !Number.isFinite(meta.inputTimestamp))) return false;
    if (meta.source === 'head_contact' && (!meta.contactEpisodeId || this.episodes.has(meta.contactEpisodeId))) return false;
    if ((meta.eventId && this.eventIds.has(meta.eventId)) || (meta.actionId && this.actionIds.has(meta.actionId))) return false;
    if (meta.eventId) this.eventIds.add(meta.eventId);
    if (meta.actionId) this.actionIds.add(meta.actionId);
    if (meta.source === 'head_contact') this.episodes.add(meta.contactEpisodeId);
    return true;
  }
  private response(action: RawResponse['action'], selection: string | null, meta: InputMeta): RawResponse {
    return { action, selection, eventId: meta.eventId ?? newId('event'), actionId: meta.actionId, source: meta.source ?? 'ui', inputTimestamp: meta.inputTimestamp ?? Date.now(), ...(meta.source === 'head_contact' ? { contactEpisodeId: meta.contactEpisodeId } : {}) };
  }
  private applyEvaluation(evaluation: EvaluationResult): void {
    let rewardEarned = this.snapshot.rewardEarned;
    if (evaluation.completed) {
      const key = rewardKey(this.ledger.scope, this.snapshot.exercise);
      if (!this.ledger.keys.includes(key)) { this.ledger = sealed({ ...this.ledger, keys: [...this.ledger.keys, key], balance: this.ledger.balance + 1 }); rewardEarned = 1; }
    }
    this.update({ lastResult: evaluation, state: evaluation.completed ? 'completed' : evaluation.outcome === 'review_required' ? 'review_required' : 'active',
      conditionMismatches: this.snapshot.conditionMismatches + (evaluation.outcome === 'task_mismatch' ? 1 : 0), musicRewardBalance: this.ledger.balance, rewardEarned });
  }
}
