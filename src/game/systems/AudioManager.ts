type SoundKey =
  | 'jump'
  | 'land'
  | 'collect'
  | 'hit'
  | 'enemy'
  | 'power'
  | 'checkpoint'
  | 'clear'
  | 'button';

export class AudioManager {
  private static instance: AudioManager | null = null;
  private context: AudioContext | null = null;

  static get(): AudioManager {
    AudioManager.instance ??= new AudioManager();
    return AudioManager.instance;
  }

  play(key: SoundKey): void {
    const context = this.getContext();

    if (!context) {
      return;
    }

    if (context.state === 'suspended') {
      void context.resume();
    }

    switch (key) {
      case 'jump':
        this.tone(context, 340, 0.08, 'triangle', 0.035);
        this.tone(context, 510, 0.08, 'sine', 0.025, 0.04);
        break;
      case 'land':
        this.noise(context, 0.06, 0.045, 550);
        break;
      case 'collect':
        this.tone(context, 660, 0.07, 'sine', 0.028);
        this.tone(context, 880, 0.08, 'sine', 0.026, 0.06);
        break;
      case 'hit':
        this.tone(context, 150, 0.14, 'sawtooth', 0.032);
        this.tone(context, 95, 0.16, 'square', 0.018, 0.05);
        break;
      case 'enemy':
        this.tone(context, 260, 0.07, 'square', 0.026);
        this.tone(context, 520, 0.06, 'triangle', 0.028, 0.05);
        break;
      case 'power':
        this.tone(context, 420, 0.12, 'triangle', 0.03);
        this.tone(context, 720, 0.16, 'sine', 0.032, 0.09);
        this.tone(context, 980, 0.12, 'sine', 0.025, 0.19);
        break;
      case 'checkpoint':
        this.tone(context, 520, 0.12, 'sine', 0.03);
        this.tone(context, 780, 0.16, 'triangle', 0.028, 0.1);
        break;
      case 'clear':
        this.tone(context, 520, 0.12, 'triangle', 0.035);
        this.tone(context, 700, 0.12, 'triangle', 0.035, 0.13);
        this.tone(context, 930, 0.2, 'sine', 0.035, 0.27);
        break;
      case 'button':
        this.tone(context, 420, 0.05, 'sine', 0.02);
        break;
    }
  }

  private getContext(): AudioContext | null {
    if (this.context) {
      return this.context;
    }

    if (typeof window === 'undefined' || typeof window.AudioContext === 'undefined') {
      return null;
    }

    this.context = new window.AudioContext();
    return this.context;
  }

  private tone(
    context: AudioContext,
    frequency: number,
    durationSeconds: number,
    type: OscillatorType,
    volume: number,
    offsetSeconds = 0
  ): void {
    const start = context.currentTime + offsetSeconds;
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + durationSeconds);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + durationSeconds + 0.02);
  }

  private noise(
    context: AudioContext,
    durationSeconds: number,
    volume: number,
    filterFrequency: number
  ): void {
    const sampleCount = Math.max(1, Math.floor(context.sampleRate * durationSeconds));
    const buffer = context.createBuffer(1, sampleCount, context.sampleRate);
    const channel = buffer.getChannelData(0);

    for (let index = 0; index < sampleCount; index += 1) {
      channel[index] = (Math.random() * 2 - 1) * (1 - index / sampleCount);
    }

    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    source.buffer = buffer;
    filter.type = 'lowpass';
    filter.frequency.value = filterFrequency;
    gain.gain.value = volume;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);
    source.start();
  }
}
