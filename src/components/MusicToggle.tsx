'use client';

import { useEffect, useRef, useState } from 'react';
import { Volume2 } from 'lucide-react';

const BPM = 122;
const STEP = 60 / BPM / 4; // semicolcheia
const LS_KEY = 'bf_music';

// 4 padrões de baixo (16 passos cada) — alternam ao longo do tempo
const BASS_PATTERNS: number[][] = [
  [110, 0, 0, 0, 110, 0, 0, 164.81, 0, 0, 130.81, 0, 98, 0, 0, 0],
  [110, 0, 110, 0, 0, 0, 164.81, 0, 130.81, 0, 0, 0, 98, 0, 98, 0],
  [82.41, 0, 0, 0, 110, 0, 0, 0, 130.81, 0, 0, 0, 110, 0, 0, 0],
  [110, 0, 0, 110, 0, 164.81, 0, 0, 130.81, 0, 130.81, 0, 98, 0, 0, 98],
];

// Progressão de acordes (Lá menor): Am, F, C, G — um por cada 4 compassos
const CHORDS: number[][] = [
  [220, 261.63, 329.63], // Am
  [174.61, 220, 261.63], // F
  [261.63, 329.63, 392.0], // C
  [196.0, 246.94, 293.66], // G
];

// Arpejo melódico (Lá menor pentatónica) para a segunda metade do ciclo
const ARP = [440, 523.25, 659.25, 587.33, 523.25, 440, 392.0, 329.63];

export default function MusicToggle() {
  const [on, setOn] = useState(false);
  const ctx = useRef<AudioContext | null>(null);
  const master = useRef<GainNode | null>(null);
  const noise = useRef<AudioBuffer | null>(null);
  const timer = useRef<number | null>(null);
  const step = useRef(0);
  const nextTime = useRef(0);

  function ac(): AudioContext {
    if (!ctx.current) {
      const C = new (window.AudioContext || (window as any).webkitAudioContext)();
      const m = C.createGain();
      m.gain.value = 0.0001;
      m.connect(C.destination);
      const buf = C.createBuffer(1, Math.floor(C.sampleRate * 0.3), C.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      ctx.current = C;
      master.current = m;
      noise.current = buf;
    }
    return ctx.current;
  }

  function kick(t: number) {
    const C = ac();
    const o = C.createOscillator();
    const g = C.createGain();
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(50, t + 0.12);
    g.gain.setValueAtTime(0.9, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    o.connect(g);
    g.connect(master.current!);
    o.start(t);
    o.stop(t + 0.18);
  }

  function hat(t: number, vol: number) {
    const C = ac();
    const s = C.createBufferSource();
    s.buffer = noise.current!;
    const hp = C.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 7000;
    const g = C.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    s.connect(hp);
    hp.connect(g);
    g.connect(master.current!);
    s.start(t);
    s.stop(t + 0.06);
  }

  // cutoff varia ao longo do ciclo (0..1 → abre o filtro)
  function bassNote(t: number, freq: number, openness: number) {
    if (!freq) return;
    const C = ac();
    const o = C.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = freq;
    const lp = C.createBiquadFilter();
    lp.type = 'lowpass';
    const top = 400 + openness * 900;
    lp.frequency.setValueAtTime(top, t);
    lp.frequency.exponentialRampToValueAtTime(180, t + 0.22);
    lp.Q.value = 7;
    const g = C.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.22, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    o.connect(lp);
    lp.connect(g);
    g.connect(master.current!);
    o.start(t);
    o.stop(t + 0.25);
  }

  function pad(t: number, chord: number[]) {
    const C = ac();
    chord.forEach((f) => {
      const o = C.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      const g = C.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.05, t + 0.6);
      g.gain.linearRampToValueAtTime(0.0001, t + STEP * 16 * 4);
      o.connect(g);
      g.connect(master.current!);
      o.start(t);
      o.stop(t + STEP * 16 * 4 + 0.1);
    });
  }

  function lead(t: number, freq: number) {
    const C = ac();
    const o = C.createOscillator();
    o.type = 'triangle';
    o.frequency.value = freq;
    const g = C.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.08, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    const dl = C.createDelay();
    dl.delayTime.value = STEP * 3;
    const fb = C.createGain();
    fb.gain.value = 0.3;
    o.connect(g);
    g.connect(master.current!);
    g.connect(dl);
    dl.connect(fb);
    fb.connect(dl);
    dl.connect(master.current!);
    o.start(t);
    o.stop(t + 0.32);
  }

  function scheduler() {
    const C = ac();
    while (nextTime.current < C.currentTime + 0.12) {
      const s = step.current % 16;
      const bar = Math.floor(step.current / 16);
      const cyclePos = bar % 32; // ciclo de 32 compassos (~63s)
      const t = nextTime.current;
      const openness = cyclePos / 32; // filtro abre ao longo do ciclo

      // bateria
      if (s % 4 === 0) kick(t);
      if (s % 4 === 2) hat(t, 0.15);
      else if (s % 2 === 0) hat(t, 0.05);

      // baixo (padrão muda a cada 8 compassos)
      const pattern = BASS_PATTERNS[Math.floor(bar / 8) % BASS_PATTERNS.length];
      bassNote(t, pattern[s], openness);

      // acorde no início de cada 4 compassos
      if (s === 0 && bar % 4 === 0) {
        pad(t, CHORDS[Math.floor(bar / 4) % CHORDS.length]);
      }

      // arpejo melódico só na 2ª metade do ciclo, em colcheias
      if (cyclePos >= 16 && s % 2 === 0) {
        lead(t, ARP[(step.current / 2) % ARP.length | 0]);
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
    master.current!.gain.linearRampToValueAtTime(0.26, C.currentTime + 1.2);
    step.current = 0;
    nextTime.current = C.currentTime + 0.1;
    scheduler();
    setOn(true);
    try { localStorage.setItem(LS_KEY, 'on'); } catch {}
  }

  function stop() {
    const C = ctx.current;
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    if (C && master.current) {
      master.current.gain.cancelScheduledValues(C.currentTime);
      master.current.gain.setValueAtTime(master.current.gain.value, C.currentTime);
      master.current.gain.linearRampToValueAtTime(0.0001, C.currentTime + 0.5);
    }
    setOn(false);
    try { localStorage.setItem(LS_KEY, 'off'); } catch {}
  }

  // Se já estava ligada antes, arranca no primeiro toque (autoplay permitido).
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
