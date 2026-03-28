/**
 * @file audio.js — Sound effects and dynamic music for Spades.
 * @author Keith Adler
 * @copyright 2026 Keith Adler. MIT License.
 */

class SFX {
  constructor() {
    this.ctx = null;
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
  }

  _play(freq, duration, type = 'sine', vol = 0.15) {
    if (!this.ctx || (window.game && window.game._soundMuted)) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain); gain.connect(this.ctx.destination);
    osc.start(); osc.stop(this.ctx.currentTime + duration);
  }

  _noise(freq, duration, vol = 0.1) {
    if (!this.ctx || (window.game && window.game._soundMuted)) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const ctx = this.ctx;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buffer;
    const filter = ctx.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.value = freq; filter.Q.value = 1.5;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    src.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    src.start(); src.stop(ctx.currentTime + duration);
  }

  playCard() {
    const p = 0.9 + Math.random() * 0.2;
    this._noise(3000 * p, 0.03, 0.05);
    this._play(250 * p, 0.06, 'sine', 0.08);
    setTimeout(() => this._noise(5000, 0.02, 0.02), 10);
  }

  trickWin() {
    this._play(523, 0.15, 'sine', 0.1);
    setTimeout(() => this._play(659, 0.15, 'sine', 0.1), 80);
    setTimeout(() => this._play(784, 0.2, 'sine', 0.1), 160);
  }

  bid() {
    this._play(440, 0.1, 'sine', 0.08);
    setTimeout(() => this._play(550, 0.12, 'sine', 0.08), 60);
  }

  nilBid() {
    this._play(880, 0.15, 'sine', 0.12);
    setTimeout(() => this._play(1100, 0.2, 'sine', 0.1), 100);
    setTimeout(() => this._play(1320, 0.25, 'sine', 0.08), 200);
  }

  shuffle() {
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        this._noise(2000 + Math.random() * 3000, 0.03, 0.04);
        this._play(150 + Math.random() * 100, 0.04, 'sine', 0.02);
      }, i * 40 + Math.random() * 20);
    }
  }

  win() {
    const fanfare = [523, 659, 784, 1047, 1319, 1568];
    fanfare.forEach((f, i) => {
      setTimeout(() => {
        this._play(f, 0.4, 'sine', 0.1);
        this._play(f * 1.5, 0.3, 'sine', 0.03);
        if (i === fanfare.length - 1) {
          this._play(f, 0.8, 'sine', 0.08);
          this._play(f * 0.75, 0.8, 'sine', 0.05);
        }
      }, i * 110);
    });
  }

  lose() {
    [440, 392, 330, 262].forEach((f, i) =>
      setTimeout(() => { this._play(f, 0.35, 'sine', 0.08); }, i * 220)
    );
  }

  tick() { this._noise(3000, 0.02, 0.03); }
  blocked() { this._play(100, 0.15, 'sine', 0.08); this._noise(400, 0.06, 0.04); }

  bagPenalty() {
    this._play(200, 0.3, 'triangle', 0.12);
    setTimeout(() => this._play(150, 0.4, 'triangle', 0.1), 150);
  }

  nilSuccess() {
    const notes = [523, 659, 784, 1047, 1319];
    notes.forEach((f, i) => {
      setTimeout(() => {
        this._play(f, 0.3, 'sine', 0.12);
        this._play(f * 2, 0.2, 'sine', 0.04);
      }, i * 80);
    });
  }

  nilFail() {
    [660, 440, 330, 220].forEach((f, i) =>
      setTimeout(() => { this._play(f, 0.3, 'triangle', 0.1); }, i * 180)
    );
  }
}

class MusicEngine {
  constructor() {
    this.playing = false;
    this.enabled = localStorage.getItem('spades_music') === '1';
    this.intensity = 0;
    this.ctx = null;
    this._nodes = [];
  }
  init() {
    if (this.ctx) return;
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
  }
  start() {
    if (!this.enabled || this.playing) return;
    this.init(); if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.playing = true; this._loop();
  }
  stop() {
    this.playing = false;
    this._nodes.forEach(n => { try { n.disconnect(); n.stop(); } catch(e) {} });
    this._nodes = [];
  }
  setIntensity(val) { this.intensity = Math.max(0, Math.min(1, val)); }
  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('spades_music', this.enabled ? '1' : '0');
    if (this.enabled) this.start(); else this.stop();
  }
  _loop() {
    if (!this.playing || !this.ctx) return;
    const ctx = this.ctx, now = ctx.currentTime;
    const progressions = [
      [[130.81,164.81,196.00,246.94],[146.83,185.00,220.00,277.18],[164.81,207.65,246.94,311.13],[174.61,220.00,261.63,329.63]],
      [[110.00,130.81,164.81,196.00],[146.83,185.00,220.00,261.63],[98.00,123.47,146.83,185.00],[130.81,164.81,196.00,246.94]],
    ];
    const progIdx = Math.floor(now / 24) % progressions.length;
    const chords = progressions[progIdx];
    const chordIdx = Math.floor((now / 3) % chords.length);
    const chord = chords[chordIdx];
    const vol = 0.01 + this.intensity * 0.008;
    const oscType = this.intensity > 0.6 ? 'triangle' : 'sine';
    for (let i = 0; i < chord.length; i++) {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = oscType; osc.frequency.value = chord[i] * (1 + this.intensity * 0.15);
      const at = now + i * 0.05;
      gain.gain.setValueAtTime(0, at);
      gain.gain.linearRampToValueAtTime(vol, at + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, at + 2.8);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(at); osc.stop(at + 3);
      this._nodes.push(osc);
    }
    const keep = this._nodes.slice(-20);
    for (const n of this._nodes) { if (!keep.includes(n)) try { n.disconnect(); } catch(e) {} }
    this._nodes = keep;
    setTimeout(() => this._loop(), 2800 - this.intensity * 600);
  }
}
