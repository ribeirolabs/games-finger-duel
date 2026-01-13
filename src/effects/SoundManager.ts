import * as Tone from 'tone';

export class SoundManager {
  private isInitialized: boolean = false;
  private synth: Tone.PolySynth | null = null;
  private membrane: Tone.MembraneSynth | null = null;
  private metalSynth: Tone.MetalSynth | null = null;
  private audioContext: AudioContext | null = null;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      await Tone.start();

      this.synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sine' },
        envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.5 },
      }).toDestination();

      this.membrane = new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 4,
        oscillator: { type: 'sine' },
        envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 0.4 },
      }).toDestination();

      this.metalSynth = new Tone.MetalSynth({
        envelope: { attack: 0.001, decay: 0.1, release: 0.01 },
        harmonicity: 5.1,
        modulationIndex: 32,
        resonance: 4000,
        octaves: 1.5,
      }).toDestination();

      this.metalSynth.volume.value = -10;
      this.synth?.set({ volume: -5 });

      this.isInitialized = true;
    } catch (e) {
      console.warn('Audio initialization failed:', e);
    }
  }

  async ensureReady(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    } else if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  playAttackSound(fingers: number): void {
    if (!this.isInitialized || !this.synth) {
      this.ensureReady();
      return;
    }

    const baseFreq = 200 + fingers * 80;
    const notes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
    const note = notes[Math.min(fingers - 1, notes.length - 1)];

    this.synth.triggerAttackRelease(note, '16n', Tone.now());

    setTimeout(() => {
      this.membrane?.triggerAttackRelease(baseFreq, '32n', Tone.now());
    }, 50);
  }

  playSplitSound(): void {
    if (!this.isInitialized || !this.synth) {
      this.ensureReady();
      return;
    }

    this.synth.triggerAttackRelease(['C5', 'E5'], '32n', Tone.now());

    setTimeout(() => {
      this.metalSynth?.triggerAttackRelease('16n', Tone.now());
    }, 30);
  }

  playDeathSound(): void {
    if (!this.isInitialized || !this.synth) {
      this.ensureReady();
      return;
    }

    const descending = ['G4', 'E4', 'C4', 'A3', 'F3'];
    descending.forEach((note, i) => {
      setTimeout(() => {
        this.synth?.triggerAttackRelease(note, '8n', Tone.now());
      }, i * 80);
    });
  }

  playVictorySound(): void {
    if (!this.isInitialized || !this.synth) {
      this.ensureReady();
      return;
    }

    const fanfare = ['C4', 'E4', 'G4', 'C5', 'E5', 'G5', 'C6'];
    const durations = ['8n', '8n', '8n', '4n', '8n', '8n', '2n'];

    fanfare.forEach((note, i) => {
      this.synth?.triggerAttackRelease(note, durations[i] as Tone.Unit.Time, Tone.now() + i * 0.15);
    });
  }

  playErrorSound(): void {
    if (!this.isInitialized || !this.synth) {
      this.ensureReady();
      return;
    }

    this.synth.triggerAttackRelease(['A3', 'F3'], '32n', Tone.now());
  }

  playTurnChangeSound(): void {
    if (!this.isInitialized || !this.metalSynth) {
      this.ensureReady();
      return;
    }

    this.metalSynth.triggerAttackRelease('32n', Tone.now());
  }

  playTouchSound(): void {
    if (!this.isInitialized || !this.synth) {
      this.ensureReady();
      return;
    }

    this.synth.triggerAttackRelease('C6', '64n', Tone.now());
  }

  playHoverSound(): void {
    if (!this.isInitialized || !this.synth) {
      this.ensureReady();
      return;
    }

    this.synth.triggerAttackRelease('G5', '64n', Tone.now());
  }
}

export const soundManager = new SoundManager();
