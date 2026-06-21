'use client';

import { useEffect, useRef, useState } from 'react';
import { Volume2 } from 'lucide-react';
import { audioBus } from '@/lib/audioBus';

// ── Melodic Techno @ 122 BPM ──────────────────────────────────────
const BPM = 122;
const STEP = 60 / BPM / 4; // semicolcheia
const BAR = STEP * 16;
const LS_KEY = 'bf_music';

// Progressão emotiva em Lá menor: Am – F – C – G (1 acorde por compasso)
const CHORDS: number[][] = [
  [220.0, 261.63, 329.63], // Am
  [174.61, 220.0, 261.63], // F
  [261.63, 329.63, 392.0], // C
  [196.0, 246.94, 293.66], // G
];
// Raiz do baixo por acorde (sub)
const BASS_ROOTS = [55.0, 43.65, 65.41, 49.0]; // A1, F1, C2, G1

export default function MusicToggle() {
  const [on, setOn] = useState(false);
  const ctx = useRef<AudioContext | null>(null);
  const master = useRef<GainNode | null>(null);
  const duck = useRef<GainNode | null>(null); // bus com sidechain (baixo + pads)
  const reverb = useRef<ConvolverNode | null>(null);
  const noise = useRef<AudioBuffer | null>(null);
  const timer = useRef<number | null>(null);
  const step = useRef(0);
  const nextTime = useRef(0);

  function ac(): AudioContext {
    if (!ctx.current) {
      const C = new (window.AudioContext || (window as any).webkitAudioContext)();

      const m = C.createGain();
      m.gain.value = 0.0001;
      const an = C.createAnalyser();
      an.fftSize = 256;
      an.smoothingTimeConstant = 0.8;
      m.connect(an);
      an.connect(C.destination);
      audioBus.analyser = an;

      // Reverb (impulso sintetizado)
      const conv = C.createConvolver();
      const secs = 2.6;
      const len = Math.floor(C.sampleRate * secs);
      const ir = C.createBuffer(2, len, C.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = ir.getChannelData(ch);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
      }
      conv.buffer = ir;
      const revGain = C.createGain();
      revGain.gain.value = 0.5;
      conv.connect(revGain);
      revGain.connect(m);

      // bus com sidechain
      const dk = C.createGain();
      dk.gain.value = 1;
      dk.connect(m);

      // ruído (hats/clap)
      const buf = C.createBuffer(1, Math.floor(C.sampleRate * 0.4), C.sampleRate);
      const nd = buf.getChannelData(0);
      for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;

      ctx.current = C;
      master.current = m;
      reverb.current = conv;
      duck.current = dk;
      noise.current = buf;
    }
    return ctx.current;
  }

  // sidechain: baixa o duck bus a cada kick e recupera (pump)
  function sidechain(t: number) {
    const dk = duck.current!;
    dk.gain.cancelScheduledValues(t);
    dk.gain.setValueAtTime(0.28, t);
    dk.gain.linearRampToValueAtTime(1, t + 0.38);
  }

  function kick(t: number) {
    const C = ac();
    const o = C.createOscillator();
    const g = C.createGain();
    o.frequency.setValueAtTime(130, t);
    o.frequency.exponentialRampToValueAtTime(48, t + 0.11);
    g.gain.setValueAtTime(0.95, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    o.connect(g);
    g.connect(master.current!);
    o.start(t);
    o.stop(t + 0.32);
    sidechain(t);
  }

  function clap(t: number) {
    const C = ac();
    const s = C.createBufferSource();
    s.buffer = noise.current!;
    const bp = C.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1600;
    bp.Q.value = 1.2;
    const g = C.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.35, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    s.connect(bp);
    bp.connect(g);
    g.connect(master.current!);
    g.connect(reverb.current!); // com cauda de reverb
    s.start(t);
    s.stop(t + 0.18);
  }

  function hat(t: number, vol: number, open = false) {
    const C = ac();
    const s = C.createBufferSource();
    s.buffer = noise.current!;
    const hp = C.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 8500;
    const g = C.createGain();
    const dur = open ? 0.13 : 0.04;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(hp);
    hp.connect(g);
    g.connect(master.current!);
    s.start(t);
    s.stop(t + dur + 0.02);
  }

  // Baixo offbeat suave (sub + saw filtrado) → bus com sidechain
  function bass(t: number, freq: number) {
    const C = ac();
    const dur = STEP * 1.8;
    const g = C.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.5, t + 0.02);
    g.gain.setValueAtTime(0.5, t + dur * 0.6);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    g.connect(duck.current!);

    const sub = C.createOscillator();
    sub.type = 'sine';
    sub.frequency.value = freq;
    sub.connect(g);
    sub.start(t);
    sub.stop(t + dur + 0.02);

    const saw = C.createOscillator();
    saw.type = 'sawtooth';
    saw.frequency.value = freq;
    const lp = C.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 220;
    lp.Q.value = 4;
    const sg = C.createGain();
    sg.gain.value = 0.35;
    saw.connect(lp);
    lp.connect(sg);
    sg.connect(g);
    saw.start(t);
    saw.stop(t + dur + 0.02);
  }

  // Pad supersaw (3 vozes detuned por nota) → duck + reverb
  function padChord(t: number, chord: number[], openness: number) {
    const C = ac();
    const lp = C.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(500 + openness * 1800, t);
    lp.Q.value = 0.8;
    const g = C.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.07, t + 0.5);
    g.gain.setValueAtTime(0.07, t + BAR * 0.7);
    g.gain.linearRampToValueAtTime(0.0001, t + BAR * 1.05);
    lp.connect(g);
    g.connect(duck.current!);
    g.connect(reverb.current!);

    chord.forEach((f) => {
      [-0.18, 0, 0.18].forEach((det) => {
        const o = C.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = f;
        o.detune.value = det * 100;
        o.connect(lp);
        o.start(t);
        o.stop(t + BAR * 1.1);
      });
    });
  }

  // Lead melódico (arpejo) com delay + reverb
  function lead(t: number, freq: number) {
    const C = ac();
    const o = C.createOscillator();
    o.type = 'triangle';
    o.frequency.value = freq;
    const g = C.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.11, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    const dl = C.createDelay();
    dl.delayTime.value = STEP * 3;
    const fb = C.createGain();
    fb.gain.value = 0.38;
    o.connect(g);
    g.connect(master.current!);
    g.connect(reverb.current!);
    g.connect(dl);
    dl.connect(fb);
    fb.connect(dl);
    dl.connect(master.current!);
    o.start(t);
    o.stop(t + 0.42);
  }

  function scheduler() {
    const C = ac();
    while (nextTime.current < C.currentTime + 0.12) {
      const s = step.current % 16;
      const bar = Math.floor(step.current / 16);
      const t = nextTime.current;
      const phase = bar % 32; // arranjo de 32 compassos

      const drums = phase >= 4; // kick entra ao 5º compasso
      const full = phase >= 8 && phase < 24; // secção cheia
      const breakdown = phase >= 24 && phase < 28; // breakdown
      const openness = ((phase % 16) / 16) * (breakdown ? 1.3 : 1);

      const chord = CHORDS[bar % CHORDS.length];
      const root = BASS_ROOTS[bar % BASS_ROOTS.length];

      // acorde por compasso
      if (s === 0) padChord(t, chord, Math.min(1, openness));

      // bateria
      if (drums && !breakdown && s % 4 === 0) kick(t);
      if (full && (s === 4 || s === 12)) clap(t);
      if (drums && s % 4 === 2) hat(t, 0.18, true);
      if (drums && s % 2 === 1) hat(t, 0.07);

      // baixo offbeat (na secção cheia)
      if (full && (s === 2 || s === 6 || s === 10 || s === 14)) bass(t, root);

      // arpejo melódico (sempre, mais presente fora do breakdown)
      if (s % 2 === 0) {
        const arp = [chord[0] * 2, chord[2] * 2, chord[1] * 2, chord[2] * 2];
        const note = arp[(s / 2) % 4];
        if (breakdown || phase >= 12 || phase < 4) lead(t, note);
      }

      nextTime.current += STEP;
      step.current++;
    }
    timer.current = window.setTimeout(scheduler, 25);
  }

  async function start() {
    const C = ac();
    if (C.state === 'suspended') await C.resume();
    master.current!.gain.cancelScheduledValues(C.currentTime);
    master.current!.gain.setValueAtTime(0.0001, C.currentTime);
    master.current!.gain.linearRampToValueAtTime(0.32, C.currentTime + 1.5);
    step.current = 0;
    nextTime.current = C.currentTime + 0.1;
    scheduler();
    audioBus.playing = true;
    setOn(true);
    try { localStorage.setItem(LS_KEY, 'on'); } catch {}
  }

  function stop() {
    const C = ctx.current;
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    if (C && master.current) {
      master.current.gain.cancelScheduledValues(C.currentTime);
      master.current.gain.setValueAtTime(master.current.gain.value, C.currentTime);
      master.current.gain.linearRampToValueAtTime(0.0001, C.currentTime + 0.6);
    }
    audioBus.playing = false;
    setOn(false);
    try { localStorage.setItem(LS_KEY, 'off'); } catch {}
  }

  useEffect(() => {
    let pref: string | null = null;
    try { pref = localStorage.getItem(LS_KEY); } catch {}
    if (pref !== 'on') return;
    const kickstart = () => {
      start();
      window.removeEventListener('pointerdown', kickstart);
    };
    window.addEventListener('pointerdown', kickstart, { once: true });
    return () => window.removeEventListener('pointerdown', kickstart);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      ctx.current?.close?.();
    },
    []
  );

  return (
    <button
      onClick={() => (on ? stop() : start())}
      aria-label={on ? 'Desligar música' : 'Ligar música'}
      className="fixed bottom-24 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-neon-purple/30 bg-ink-800/90 text-white shadow-neon backdrop-blur transition hover:scale-105 md:bottom-6"
    >
      {on ? (
        <span className="flex items-end gap-[2px]">
          <span className="h-4 w-[3px] origin-bottom animate-[eq_0.6s_ease-in-out_infinite] rounded-full bg-neon-cyan" />
          <span className="h-4 w-[3px] origin-bottom animate-[eq_0.6s_ease-in-out_infinite_0.15s] rounded-full bg-neon-purple" />
          <span className="h-4 w-[3px] origin-bottom animate-[eq_0.6s_ease-in-out_infinite_0.3s] rounded-full bg-neon-pink" />
        </span>
      ) : (
        <Volume2 size={20} className="text-neon-purple" />
      )}
      <span className="sr-only">{on ? 'A tocar' : 'Música'}</span>
    </button>
  );
}
