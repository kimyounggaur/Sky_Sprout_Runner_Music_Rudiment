import { matchRhythmInputs } from './domain';
/** Music-only Web Audio. Never shares the story game's SFX or score system. */
export interface SoundNote { midi: number; centsOffset?: number; tuningA4Hz?: number }
export interface ScheduledSound { notes: SoundNote[]; onsetBeats: number; durationBeats: number; velocity?: number }
export interface AudioSchedule { contextStart: number; outputStartMs: number | null; durationMs: number }

export function validateSoundSchedule(events: ScheduledSound[]): void {
  if (events.length > 256 || events.some(e => e.notes.length > 12 || !Number.isFinite(e.onsetBeats) || e.onsetBeats < 0 || !Number.isFinite(e.durationBeats) || e.durationBeats <= 0 || e.onsetBeats + e.durationBeats > 256 || (e.velocity !== undefined && !Number.isFinite(e.velocity)))) throw new Error('재생 가능한 구절 범위를 벗어났습니다.');
  events.forEach(e => e.notes.forEach(frequencyFor));
  const edges = events.flatMap(e => [{ at: e.onsetBeats, voices: e.notes.length }, { at: e.onsetBeats + e.durationBeats, voices: -e.notes.length }]).sort((a, b) => a.at - b.at || a.voices - b.voices);
  let simultaneous = 0;
  if (events.reduce((sum, event) => sum + event.notes.length, 0) > 1024 || edges.some(edge => { simultaneous += edge.voices; return simultaneous > 32; })) throw new Error('동시에 32음, 전체 1024음까지 재생할 수 있습니다.');
}

export function frequencyFor(note: SoundNote): number {
  const tuning = note.tuningA4Hz ?? 440;
  if (!Number.isFinite(note.midi) || note.midi < 0 || note.midi > 127 || !Number.isFinite(tuning) || tuning <= 0 || !Number.isFinite(note.centsOffset ?? 0)) {
    throw new Error('유효하지 않은 음높이입니다.');
  }
  return tuning * 2 ** ((note.midi - 69) / 12 + (note.centsOffset ?? 0) / 1200);
}

/** beatUnitQuarter=1 for a quarter beat, 1.5 for a dotted quarter beat. */
export function quarterMs(bpm: number, beatUnitQuarter = 1): number {
  if (!Number.isFinite(bpm) || bpm < 20 || bpm > 300 || !Number.isFinite(beatUnitQuarter) || beatUnitQuarter <= 0) throw new Error('박 단위와 템포를 확인하세요.');
  return 60_000 / bpm / beatUnitQuarter;
}

export interface TapMatch { targetMs: number; inputMs: number | null; rawErrorMs: number | null; correctedErrorMs: number | null }
/** Deterministic one-to-one nearest matching; original times are never quantized. */
export function matchTaps(targets: number[], inputs: number[], windowMs: number, responseOffsetMs = 0): { matches: TapMatch[]; extraInputs: number[] } {
  if (![...targets, ...inputs, windowMs, responseOffsetMs].every(Number.isFinite) || windowMs < 0) throw new Error('유효하지 않은 시각입니다.');
  const matching = matchRhythmInputs(inputs, targets, windowMs, responseOffsetMs);
  const assignments = new Map(matching.matches.map(m => [m.targetIndex, m.inputIndex]));
  return { matches: targets.map((targetMs, t) => {
    const i = assignments.get(t);
    const inputMs = i === undefined ? null : inputs[i];
    const rawErrorMs = inputMs === null ? null : inputMs - targetMs;
    return { targetMs, inputMs, rawErrorMs, correctedErrorMs: rawErrorMs === null ? null : rawErrorMs - responseOffsetMs };
  }), extraInputs: matching.extraInputs.map(i => inputs[i]) };
}

export class MusicAudio {
  private context: AudioContext | null = null;
  private nodes = new Set<OscillatorNode>();
  private generation = 0;
  private volume = 0.16;
  onInterrupted?: () => void;
  onOutputDeviceChanged?: () => void;
  private readonly outputDeviceChanged = () => { this.stop(); this.onOutputDeviceChanged?.(); };

  setVolume(value: number): void { this.volume = Math.max(0, Math.min(0.3, value)); }
  get activeNodes(): number { return this.nodes.size; }
  get state(): string { return this.context?.state ?? 'off'; }

  async enable(): Promise<boolean> {
    try {
      if (!this.context || this.context.state === 'closed') {
        this.context = new AudioContext({ latencyHint: 'interactive' });
        this.context.addEventListener('sinkchange', this.outputDeviceChanged);
        this.context.onstatechange = () => {
          if (this.context?.state === 'suspended') { this.stop(); this.onInterrupted?.(); }
        };
      }
      await this.context.resume();
      return this.context.state === 'running';
    } catch { return false; }
  }

  async play(events: ScheduledSound[], bpm = 90, beatUnitQuarter = 1): Promise<AudioSchedule | null> {
    this.stop();
    validateSoundSchedule(events);
    const token = this.generation;
    if (!(await this.enable()) || token !== this.generation || !this.context || this.volume === 0) return null;
    const context = this.context;
    const secondsPerQuarter = quarterMs(bpm, beatUnitQuarter) / 1000;
    const contextStart = context.currentTime + 0.12;
    const timestamp = typeof context.getOutputTimestamp === 'function' ? context.getOutputTimestamp() : null;
    const outputStartMs = timestamp && typeof timestamp.contextTime === 'number' && typeof timestamp.performanceTime === 'number' && timestamp.contextTime > 0 && timestamp.performanceTime > 0 && Number.isFinite(timestamp.performanceTime)
      ? timestamp.performanceTime + (contextStart - timestamp.contextTime) * 1000 : null;
    for (const event of events) {
      const start = contextStart + event.onsetBeats * secondsPerQuarter;
      const duration = event.durationBeats * secondsPerQuarter;
      for (const note of event.notes) {
        const osc = context.createOscillator();
        const gain = context.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(frequencyFor(note), start);
        gain.gain.setValueAtTime(0, start);
        const peak = this.volume * Math.max(0.05, Math.min(1, event.velocity ?? 0.7)) / Math.max(1, event.notes.length);
        gain.gain.linearRampToValueAtTime(peak, start + Math.min(0.012, duration / 4));
        gain.gain.setValueAtTime(peak * 0.75, start + Math.max(0.015, duration * 0.65));
        gain.gain.linearRampToValueAtTime(0, start + duration);
        osc.connect(gain); gain.connect(context.destination); this.nodes.add(osc);
        osc.onended = () => { osc.disconnect(); gain.disconnect(); this.nodes.delete(osc); };
        osc.start(start); osc.stop(start + duration + 0.015);
      }
    }
    return { contextStart, outputStartMs, durationMs: Math.max(0, ...events.map(e => e.onsetBeats + e.durationBeats)) * secondsPerQuarter * 1000 };
  }

  stop(): void {
    this.generation++;
    for (const node of this.nodes) { try { node.stop(); } catch { /* already ended */ } node.disconnect(); }
    this.nodes.clear();
  }

  dispose(): void {
    this.stop();
    if (this.context) { this.context.onstatechange = null; this.context.removeEventListener('sinkchange', this.outputDeviceChanged); void this.context.close().catch(() => undefined); this.context = null; }
  }
}
