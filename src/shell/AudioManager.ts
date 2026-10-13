export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private isMuted: boolean = false;
  private ambientInterval: number | null = null;
  private activeSprayNode: { osc: AudioNode; gain: GainNode } | null = null;

  constructor() {
    // Listen for first user interaction to unlock and resume AudioContext seamlessly
    const unlock = () => {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      window.removeEventListener('click', unlock);
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };
    window.addEventListener('click', unlock, { passive: true });
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
    window.addEventListener('touchstart', unlock, { passive: true });
  }

  private initCtx() {
    try {
      if (!this.ctx) {
        const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtxClass) return;
        this.ctx = new AudioCtxClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        this.ambientGain = this.ctx.createGain();
        this.ambientGain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        this.ambientGain.connect(this.masterGain);
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    } catch {
      // Graceful fallback for strict autoplay policies
    }
  }

  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  getMuted(): boolean {
    return this.isMuted;
  }

  // --- TITLE AMBIENCE & PROCEDURAL SFX ---
  startTitleAmbience(sessionCount: number = 0) {
    this.initCtx();
    this.stopAmbience();
    if (!this.ctx || !this.ambientGain) return;

    // Deep quiet room tone (resonant wooden room + subtle 60Hz electrical hum of the lamp)
    const hum = this.ctx.createOscillator();
    const humFilter = this.ctx.createBiquadFilter();
    const humGain = this.ctx.createGain();

    hum.type = 'triangle';
    hum.frequency.setValueAtTime(60, this.ctx.currentTime); // 60Hz lamp hum
    humFilter.type = 'lowpass';
    humFilter.frequency.setValueAtTime(140, this.ctx.currentTime);
    humGain.gain.setValueAtTime(0.025, this.ctx.currentTime);

    hum.connect(humFilter);
    humFilter.connect(humGain);
    humGain.connect(this.ambientGain);
    hum.start();

    // Wind / breath in the room
    const breathOsc = this.ctx.createOscillator();
    const breathGain = this.ctx.createGain();
    breathOsc.type = 'sine';
    breathOsc.frequency.setValueAtTime(38, this.ctx.currentTime);
    breathGain.gain.setValueAtTime(0.02, this.ctx.currentTime);
    breathOsc.connect(breathGain);
    breathGain.connect(this.ambientGain);
    breathOsc.start();

    // Periodic irregular metronome ticks and wood creaks
    let nextTickDelay = 3800 + Math.random() * 2000;
    const scheduleNextTick = () => {
      this.ambientInterval = window.setTimeout(() => {
        // Ticks become slightly more prominent or irregular with higher sessions
        const intensity = Math.min(0.7, 0.35 + sessionCount * 0.08);
        this.playMetronomeTick(intensity);

        if (Math.random() < 0.25) {
          setTimeout(() => this.playWoodCreak(), 600);
        }

        nextTickDelay = 3200 + Math.random() * 2600 + (Math.random() > 0.5 ? 800 : -500);
        scheduleNextTick();
      }, nextTickDelay);
    };

    scheduleNextTick();
  }

  playMetronomeTick(intensity: number = 0.5) {
    this.initCtx();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const t = this.ctx.currentTime;

    // Organic wooden pendulum tick: resonant click with subtle hollow decay
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(680, t);
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.045);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(450, t);
    filter.Q.setValueAtTime(3.0, t);

    const vol = Math.min(0.28, Math.max(0.04, intensity * 0.18));
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.05);

    // Subtle wooden body impact knock
    const knockOsc = this.ctx.createOscillator();
    const knockGain = this.ctx.createGain();
    knockOsc.type = 'triangle';
    knockOsc.frequency.setValueAtTime(120, t);
    knockOsc.frequency.exponentialRampToValueAtTime(40, t + 0.06);
    knockGain.gain.setValueAtTime(vol * 0.6, t);
    knockGain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    knockOsc.connect(knockGain);
    knockGain.connect(this.masterGain);
    knockOsc.start(t);
    knockOsc.stop(t + 0.065);
  }

  playWoodCreak() {
    this.initCtx();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(95, t);
    osc.frequency.linearRampToValueAtTime(140, t + 0.15);
    osc.frequency.linearRampToValueAtTime(80, t + 0.35);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(280, t);
    filter.Q.setValueAtTime(4.0, t);

    gain.gain.setValueAtTime(0.02, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.36);
  }

  playPencilTouch() {
    this.initCtx();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const t = this.ctx.currentTime;

    // Tactile graphite scratching paper
    const bufferSize = this.ctx.sampleRate * 0.12;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(950, t);
    filter.Q.setValueAtTime(2.2, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.09, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(t);
  }

  // --- ATELIER ATMOSPHERE ---
  startAtelierAmbience() {
    this.initCtx();
    this.stopAmbience();
    if (!this.ctx || !this.ambientGain) return;

    // Room tone drone (Warm quiet prepared piano/analog low tone)
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(55, this.ctx.currentTime); // A1

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(110, this.ctx.currentTime); // A2

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(220, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.04, this.ctx.currentTime);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.ambientGain);

    osc1.start();
    osc2.start();

    // Periodic vinyl/wood dust pop
    this.ambientInterval = window.setInterval(() => {
      if (Math.random() > 0.4) {
        this.playTapeCrack();
      }
    }, 4000);
  }

  startArenaAmbience(intensity: number = 1) {
    this.initCtx();
    this.stopAmbience();
    if (!this.ctx || !this.ambientGain) return;

    const osc = this.ctx.createOscillator();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(45 + intensity * 5, this.ctx.currentTime);

    // Subtle pulsing
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(1.2 + intensity * 0.4, this.ctx.currentTime);
    lfoGain.gain.setValueAtTime(10, this.ctx.currentTime);

    lfo.connect(osc.frequency);
    lfo.start();

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(160 + intensity * 80, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ambientGain);

    osc.start();
  }

  stopAmbience() {
    if (this.ambientInterval) {
      clearInterval(this.ambientInterval);
      this.ambientInterval = null;
    }
  }

  private playTapeCrack() {
    if (!this.ctx || !this.ambientGain || this.isMuted) return;
    const bufferSize = this.ctx.sampleRate * 0.05;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1200 + Math.random() * 800;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.015, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ambientGain);
    noise.start();
  }

  // --- DRAWING TOOL SFX ---
  playToolSound(toolId: string) {
    this.initCtx();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;

    switch (toolId) {
      case 'brush': {
        // Friction brush scratch
        const bufferSize = this.ctx.sampleRate * 0.08;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(600 + Math.random() * 300, t);
        filter.Q.setValueAtTime(1.8, t);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.06, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        noise.start();
        break;
      }

      case 'eraser': {
        // Granular rubber wipe
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, t);
        osc.frequency.linearRampToValueAtTime(90, t + 0.12);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(320, t);
        gain.gain.setValueAtTime(0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(t + 0.12);
        break;
      }

      case 'fill': {
        // Ink drop / liquid resonance
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(380, t);
        osc.frequency.exponentialRampToValueAtTime(90, t + 0.25);
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(t + 0.25);
        break;
      }

      case 'line': {
        // Tense snap
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(520, t);
        osc.frequency.exponentialRampToValueAtTime(140, t + 0.06);
        gain.gain.setValueAtTime(0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(t + 0.06);
        break;
      }

      case 'stamp': {
        // Heavy wooden stamp thud
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(130, t);
        osc.frequency.exponentialRampToValueAtTime(30, t + 0.18);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(t + 0.18);
        break;
      }

      case 'smudge': {
        // Felt friction
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(240, t);
        osc.frequency.linearRampToValueAtTime(160, t + 0.14);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, t);
        gain.gain.setValueAtTime(0.07, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(t + 0.14);
        break;
      }

      case 'spray': {
        // Short spray puff
        const bufferSize = this.ctx.sampleRate * 0.1;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(2400, t);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.05, t);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        noise.start();
        break;
      }
    }
  }

  // --- COMBAT & ARENA SFX ---
  playPlayerAttack() {
    this.initCtx();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.12);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(t + 0.12);
  }

  playPlayerDash() {
    this.initCtx();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.exponentialRampToValueAtTime(200, t + 0.15);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, t);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start();
  }

  playHitEnemy() {
    this.initCtx();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(280, t);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.08);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(t + 0.08);
  }

  playPlayerDamage() {
    this.initCtx();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.25);
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(t + 0.25);
  }

  playBossPhaseChange() {
    this.initCtx();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const t = this.ctx.currentTime;

    // Dissonant minor second chord swell
    [110, 116.54, 220, 233.08].forEach(freq => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start();
      osc.stop(t + 1.2);
    });
  }

  playResolutionChime() {
    this.initCtx();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const t = this.ctx.currentTime;

    // Ethereal chord
    [440, 554.37, 659.25, 880].forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.1);
      gain.gain.setValueAtTime(0.1, t + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 2.5 + i * 0.1);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(t + i * 0.1);
      osc.stop(t + 3.0);
    });
  }
}

export const audio = new AudioManager();
