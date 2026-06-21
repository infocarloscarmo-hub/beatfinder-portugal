'use client';

import { useEffect, useRef, useState } from 'react';
import { Volume2 } from 'lucide-react';
import { audioBus } from '@/lib/audioBus';

// ── Psytech @ 138 BPM, estilo Luis M ──────────────────────────────
const BPM = 138;
const STEP = 60 / BPM / 4; // semicolcheia
const LS_KEY = 'bf_music';

// Raízes graves do baixo (Mi menor), mudam a cada 8 compassos
const ROOTS = [41.2, 41.2, 36.71, 49.0]; // E1, E1, D1, G1
// Notas para blips ácidos (escala de Mi menor, mais agudas)
const ACID = [164.81, 196.0, 220.0, 246.94, 293.66, 246.94, 220.0, 196.0];

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
      const an = C.createAnalyser();
      an.fftSize = 256;
      an.smoothingTimeConstant = 0.8;
      m.connect(an);
      an.connect(C.destination);
      audioBus.analyser = an;
      const buf = C.createBuffer(1, Math.floor(C.sampleRate * 0.3), C.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      ctx.current = C;
      master.current = m;
      noise.current = buf;
    }
    return ctx.current;
  }

  // Kick psy: seco e com punch
  function kick(t: number) {
    const C = ac();
    const o = C.createOscillator();
    const g = C.createGain();
    o.frequency.setValueAtTime(165, t);
    o.frequency.exponentialRampToValueAtTime(46, t + 0.09);
    g.gain.setValueAtTime(1.0, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
    o.connect(g);
    g.connect(master.current!);
    o.start(t);
    o.stop(t + 0.15);
  }

  // Baixo rolante: saw + sub sine, filtro com envelope rápido (o "rolo" psy)
  function rollBass(t: number, freq: number, openness: number) {
    const C = ac();
    const dur = STEP * 0.9;
    const lp = C.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(700 + openness * 700, t);
    lp.frequency.exponentialRampToValueAtTime(110, t + dur);
    lp.Q.value = 11;
    const g = C.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.55, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    lp.connect(g);
    g.connect(master.current!);

    const saw = C.createOscillator();
    saw.type = 'sawtooth';
    saw.frequency.value = freq;
    saw.connect(lp);
    saw.start(t);
    saw.stop(t + dur + 0.02);

    const sub = C.createOscillator();
    sub.type = 'sine';
    sub.frequency.value = freq;
    const sg = C.createGain();
    sg.gain.setValueAtTime(0.0001, t);
    sg.gain.exponentialRampToValueAtTime(0.4, t + 0.006);
    sg.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    sub.connect(sg);
    sg.connect(master.current!);
    sub.start(t);
    sub.stop(t + dur + 0.02);
  }

  function hat(t: number, vol: number, open = false) {
    const C = ac();
    const s = C.createBufferSource();
    s.buffer = noise.current!;
    const hp = C.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 8000;
    const g = C.createGain();
    const dur = open ? 0.12 : 0.04;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(hp);
    hp.connect(g);
    g.connect(master.current!);
    s.start(t);
    s.stop(t + dur + 0.02);
  }

  // Blip ácido (lead resonante) com eco
  function acid(t: number, freq: number) {
    const C = ac();
    const o = C.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = freq;
    const lp = C.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(2600, t);
    lp.frequency.exponentialRampToValueAtTime(500, t + 0.18);
    lp.Q.value = 16;
    const g = C.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.12, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    const dl = C.createDelay();
    dl.delayTime.value = STEP * 3;
    const fb = C.createGain();
    fb.gain.value = 0.35;
    o.connect(lp);
    lp.connect(g);
    g.connect(master.current!);
    g.connect(dl);
    dl.connect(fb);
    fb.connect(dl);
    dl.connect(master.current!);
    o.start(t);
    o.stop(t + 0.22);
  }

  // Drone atmosférico escuro (por compasso)
  function drone(t: number, freq: number) {
    const C = ac();
    const o = C.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = freq;
    const lp = C.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 600;
    const g = C.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.04, t + 1.0);
    g.gain.linearRampToValueAtTime(0.0001, t + STEP * 16);
    o.connect(lp);
    lp.connect(g);
    g.connect(master.current!);
    o.start(t);
    o.stop(t + STEP * 16 + 0.1);
  }

  function scheduler() {
    const C = ac();
    while (nextTime.current < C.currentTime + 0.12) {
      const s = step.current % 16;
      const bar = Math.floor(step.current / 16);
      const cyclePos = bar % 32;
      const t = nextTime.current;
      const openness = (cyclePos % 16) / 16; // filtro abre/fecha em ciclos de 16 compassos

      // breakdown: 2 compassos sem kick a cada 16 (deixa respirar)
      const breakdown = cyclePos === 14 || cyclePos === 15;

      // kick four-on-the-floor (exceto no breakdown)
      if (!breakdown && s % 4 === 0) kick(t);

      // baixo rolante: 3 notas graves entre cada kick
      const root = ROOTS[Math.floor(bar / 8) % ROOTS.length];
      if (s % 4 !== 0) rollBass(t, root, openness);

      // hats
      if (s % 4 === 2) hat(t, 0.22, true); // open hat em contratempo
      else if (s % 2 === 1) hat(t, 0.08); // 16ths fechados

      // drone no início de cada compasso
      if (s === 0) drone(t, root * 2);

      // blips ácidos na 2ª metade do ciclo, sincopados
      if (cyclePos >= 16 && !breakdown && (s === 3 || s === 7 || s === 10 || s === 14)) {
        acid(t, ACID[step.current % ACID.length]);
      }
      // no breakdown, mais ácido para criar tensão
      if (breakdown && s % 2 === 0) acid(t, ACID[(step.current / 2) % ACID.length | 0]);

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
    master.current!.gain.linearRampToValueAtTime(0.3, C.currentTime + 1.2);
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
      master.current.gain.linearRampToValueAtTime(0.0001, C.currentTime + 0.5);
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
          <span className="h-4 w-[3px] origin-bottom animate-[eq_0.5s_ease-in-out_infinite] rounded-full bg-neon-cyan" />
          <span className="h-4 w-[3px] origin-bottom animate-[eq_0.5s_ease-in-out_infinite_0.12s] rounded-full bg-neon-purple" />
          <span className="h-4 w-[3px] origin-bottom animate-[eq_0.5s_ease-in-out_infinite_0.24s] rounded-full bg-neon-pink" />
        </span>
      ) : (
        <Volume2 size={20} className="text-neon-purple" />
      )}
      <span className="sr-only">{on ? 'A tocar' : 'Música'}</span>
    </button>
  );
}
