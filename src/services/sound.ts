// Web Audio API Procedural Sound Engine for Super Tennis Roguelite

class SoundEngine {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private isMuted: boolean = false;
  private musicPlaying: boolean = false;
  private musicInterval: number | null = null;
  private tempo: number = 130;
  private step: number = 0;

  constructor() {
    // Initialized lazily on first user gesture
  }

  private init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.18;
      this.musicGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.35;
      this.sfxGain.connect(this.ctx.destination);
    } catch {
      console.warn('Web Audio API not supported');
    }
  }

  public unlock() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.musicGain && this.sfxGain && this.ctx) {
      const targetGain = this.isMuted ? 0 : 1;
      this.musicGain.gain.setValueAtTime(this.isMuted ? 0 : 0.18, this.ctx.currentTime);
      this.sfxGain.gain.setValueAtTime(this.isMuted ? 0 : 0.35, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // --- SOUND EFFECTS ---

  public playHit(isPerfect = false, isSmash = false, isFire = false) {
    if (this.isMuted) return;
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (isFire || isSmash) {
      // Deep explosive punch + noise
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.18);

      gain.gain.setValueAtTime(0.7, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.2);

      // Add sub thump
      this.playThump(60, 0.15);
    } else {
      // Snappy wood/graphite thwack
      osc.type = 'sine';
      osc.frequency.setValueAtTime(isPerfect ? 600 : 420, t);
      osc.frequency.exponentialRampToValueAtTime(110, t + 0.08);

      gain.gain.setValueAtTime(0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.09);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.09);
    }

    if (isPerfect) {
      // High bright chime for perfect hit!
      this.playChime([880, 1174, 1760]);
    }
  }

  public playBounce(z = 0) {
    if (this.isMuted) return;
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const pitch = 220 + Math.min(z * 4, 80);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(pitch, t);
    osc.frequency.exponentialRampToValueAtTime(90, t + 0.05);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.06);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.06);
  }

  public playDash() {
    if (this.isMuted) return;
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(800, t + 0.08);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  public playSlowMo(enter: boolean) {
    if (this.isMuted) return;
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    if (enter) {
      osc.frequency.setValueAtTime(500, t);
      osc.frequency.exponentialRampToValueAtTime(120, t + 0.25);
    } else {
      osc.frequency.setValueAtTime(120, t);
      osc.frequency.exponentialRampToValueAtTime(600, t + 0.15);
    }

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + (enter ? 0.25 : 0.15));

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + (enter ? 0.25 : 0.15));
  }

  public playLaser() {
    if (this.isMuted) return;
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1400, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.15);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  public playTeleport() {
    if (this.isMuted) return;
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.12);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.14);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.14);
  }

  public playIceSkid() {
    if (this.isMuted) return;
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(900, t);
    osc.frequency.setValueAtTime(950, t + 0.04);
    osc.frequency.setValueAtTime(850, t + 0.08);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.12);
  }

  public playLob() {
    if (this.isMuted) return;
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.16);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.18);
  }

  public playSplit() {
    if (this.isMuted) return;
    this.unlock();
    this.playChime([523, 659, 784, 1046], 0.04);
  }

  public playPointWon() {
    if (this.isMuted) return;
    this.unlock();
    this.playChime([523.25, 659.25, 783.99, 1046.5], 0.07);
    this.playCheer();
  }

  public playPointLost() {
    if (this.isMuted) return;
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.linearRampToValueAtTime(160, t + 0.25);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.25);
  }

  public playMatchWon() {
    if (this.isMuted) return;
    this.unlock();
    // Victory fanfare!
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playSingleNote(freq, 'triangle', 0.25, 0.4), i * 110);
    });
    this.playCheer(1.2);
  }

  public playUpgradeSelect() {
    if (this.isMuted) return;
    this.unlock();
    this.playChime([440, 554, 659, 880], 0.05);
  }

  private playSingleNote(freq: number, type: OscillatorType = 'sine', duration = 0.2, volume = 0.3) {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + duration);
  }

  private playChime(frequencies: number[], interval = 0.05) {
    frequencies.forEach((freq, idx) => {
      setTimeout(() => {
        this.playSingleNote(freq, 'sine', 0.2, 0.25);
      }, idx * interval * 1000);
    });
  }

  private playThump(freq = 60, duration = 0.2) {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(20, t + duration);
    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + duration);
  }

  public playCheer(duration = 0.8) {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    // Multi-frequency applause / roar simulation
    for (let i = 0; i < 4; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200 + Math.random() * 400, t);
      osc.frequency.linearRampToValueAtTime(300 + Math.random() * 300, t + duration);
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + duration);
    }
  }

  // --- RETRO CHIPTUNE / ARCADE MUSIC LOOP ---

  public startMusic() {
    if (this.musicPlaying) return;
    this.unlock();
    this.musicPlaying = true;

    // Bassline and arpeggio notes in A-minor / D-minor
    const bassline = [
      110, 110, 164.8, 110,  130.8, 130.8, 196, 130.8,
      146.8, 146.8, 220, 146.8, 123.5, 123.5, 164.8, 123.5
    ];

    const leadNotes = [
      440, 0, 523.25, 659.25, 0, 587.33, 523.25, 0,
      440, 523.25, 659.25, 783.99, 659.25, 0, 523.25, 440
    ];

    const intervalMs = (60 / this.tempo) * 250; // 16th notes

    this.musicInterval = window.setInterval(() => {
      if (this.isMuted || !this.ctx || !this.musicGain) return;

      const t = this.ctx.currentTime;
      const bFreq = bassline[this.step % bassline.length];
      const lFreq = leadNotes[this.step % leadNotes.length];

      // Bass synth
      if (bFreq > 0) {
        const bOsc = this.ctx.createOscillator();
        const bGain = this.ctx.createGain();
        bOsc.type = 'sawtooth';
        bOsc.frequency.setValueAtTime(bFreq, t);
        bGain.gain.setValueAtTime(0.12, t);
        bGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        bOsc.connect(bGain);
        bGain.connect(this.musicGain);
        bOsc.start(t);
        bOsc.stop(t + 0.13);
      }

      // Arp Lead synth
      if (lFreq > 0 && this.step % 2 === 0) {
        const lOsc = this.ctx.createOscillator();
        const lGain = this.ctx.createGain();
        lOsc.type = 'square';
        lOsc.frequency.setValueAtTime(lFreq, t);
        lGain.gain.setValueAtTime(0.06, t);
        lGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        lOsc.connect(lGain);
        lGain.connect(this.musicGain);
        lOsc.start(t);
        lOsc.stop(t + 0.16);
      }

      // Hi-hat noise on off-beats
      if (this.step % 4 === 2) {
        const hatOsc = this.ctx.createOscillator();
        const hatGain = this.ctx.createGain();
        hatOsc.type = 'square';
        hatOsc.frequency.setValueAtTime(12000, t);
        hatGain.gain.setValueAtTime(0.03, t);
        hatGain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
        hatOsc.connect(hatGain);
        hatGain.connect(this.musicGain);
        hatOsc.start(t);
        hatOsc.stop(t + 0.03);
      }

      this.step++;
    }, intervalMs);
  }

  public stopMusic() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    this.musicPlaying = false;
  }
}

export const sound = new SoundEngine();
