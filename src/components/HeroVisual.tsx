'use client';

import { useEffect, useRef } from 'react';
import { audioBus, getAudioLevel } from '@/lib/audioBus';

/**
 * Visual do hero ao nível "designer / 3D":
 *  - visualizador radial de espetro (reage a cada frequência da música)
 *  - anéis orbitais inclinados em perspetiva 3D a rodar
 *  - campo de partículas com profundidade + bloom
 *  - emblema do logótipo num disco luminoso a pulsar com o grave
 * Quando a música está desligada, anima de forma suave (pseudo-espetro).
 */
export default function HeroVisual() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = '/logo-mark.png';

    // partículas com profundidade (z 0..1)
    const N_PARTICLES = 70;
    const particles = Array.from({ length: N_PARTICLES }, () => ({
      a: Math.random() * Math.PI * 2,
      rad: 0.15 + Math.random() * 0.9,
      z: Math.random(),
      sp: 0.02 + Math.random() * 0.06,
      tw: Math.random() * Math.PI * 2,
    }));

    const BARS = 72; // metade do espetro (espelhado → simétrico)
    const freq = new Uint8Array(128);
    const shock: { r: number; a: number }[] = [];

    let level = 0;
    let raf = 0;
    let last = performance.now();
    let beatAcc = 0;
    let rot = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, rect.width * dpr);
      canvas.height = Math.max(1, rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const draw = (now: number) => {
      const dt = Math.min(50, now - last);
      last = now;
      rot += dt * 0.00018;

      const playing = audioBus.playing && audioBus.analyser;
      if (playing) audioBus.analyser!.getByteFrequencyData(freq);

      const target = getAudioLevel();
      level += (target - level) * 0.16;

      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const cx = w / 2;
      const cy = h / 2;
      const base = Math.min(w, h);
      const R = base * 0.28; // raio do disco do logo

      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter'; // bloom aditivo

      // brilho de fundo
      const bg = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, base * 0.7);
      bg.addColorStop(0, `rgba(45,212,191,${0.05 + level * 0.06})`);
      bg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // partículas (profundidade → tamanho/alpha)
      for (const p of particles) {
        p.a += p.sp * (dt / 16) * (0.4 + level);
        p.tw += 0.05;
        const depth = 0.4 + p.z * 0.6;
        const rr = p.rad * base * 0.5 * depth;
        const x = cx + Math.cos(p.a) * rr;
        const y = cy + Math.sin(p.a) * rr * 0.5; // achatado → perspetiva
        const size = (0.6 + p.z * 1.8) * (1 + level * 0.8);
        const alpha = (0.15 + p.z * 0.35) * (0.6 + 0.4 * Math.sin(p.tw));
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${Math.round(120 + p.z * 135)},${Math.round(
          220 - p.z * 60
        )},${Math.round(230 - p.z * 90)},${alpha})`;
        ctx.fill();
      }

      // anéis orbitais inclinados (perspetiva 3D)
      for (let k = 0; k < 3; k++) {
        const rx = R * (1.25 + k * 0.22) * (1 + level * 0.05);
        const tilt = 0.32 + k * 0.05;
        const ang = rot * (k % 2 === 0 ? 1 : -1.3) + (k * Math.PI) / 3;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(ang);
        ctx.scale(1, tilt);
        ctx.beginPath();
        ctx.arc(0, 0, rx, 0, Math.PI * 2);
        ctx.restore();
        ctx.lineWidth = 2;
        ctx.shadowBlur = 18;
        const cols = [
          `rgba(34,211,238,${0.45 + level * 0.4})`,
          `rgba(45,212,191,${0.4 + level * 0.4})`,
          `rgba(255,122,60,${0.4 + level * 0.4})`,
        ];
        ctx.strokeStyle = cols[k];
        ctx.shadowColor = cols[k];
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // visualizador radial de espetro (espelhado)
      const innerR = R * 1.05;
      for (let i = 0; i < BARS; i++) {
        let m: number;
        if (playing) {
          const bin = 2 + Math.floor((i / BARS) * 60); // graves→médios
          m = (freq[bin] ?? 0) / 255;
        } else {
          m = 0.18 + 0.16 * (Math.sin(now * 0.002 + i * 0.4) * 0.5 + 0.5);
        }
        const len = base * 0.04 + m * base * 0.42;
        const hue = lerp(168, 22, m); // teal → laranja conforme energia
        const lcol = `hsla(${hue}, 90%, ${55 + m * 10}%, ${0.5 + m * 0.5})`;
        for (const sign of [1, -1]) {
          const ang = -Math.PI / 2 + sign * (i / BARS) * Math.PI; // espelhado em cima
          const x1 = cx + Math.cos(ang) * innerR;
          const y1 = cy + Math.sin(ang) * innerR;
          const x2 = cx + Math.cos(ang) * (innerR + len);
          const y2 = cy + Math.sin(ang) * (innerR + len);
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = lcol;
          ctx.lineWidth = 2.5;
          ctx.shadowBlur = 8;
          ctx.shadowColor = lcol;
          ctx.stroke();
        }
      }
      ctx.shadowBlur = 0;

      // ondas de choque na batida
      const interval = audioBus.playing ? (60 / 122) * 1000 : 1700;
      beatAcc += dt;
      if (beatAcc >= interval) {
        beatAcc = 0;
        shock.push({ r: R, a: 0.5 + level * 0.5 });
      }
      for (let i = shock.length - 1; i >= 0; i--) {
        const s = shock[i];
        s.r += (0.8 + level * 2) * (dt / 16) * (base / 300);
        s.a -= 0.006 * (dt / 16);
        if (s.a <= 0) { shock.splice(i, 1); continue; }
        ctx.beginPath();
        ctx.arc(cx, cy, s.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(45,212,191,${Math.max(0, s.a)})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // emblema central num disco luminoso, a pulsar com o grave
      ctx.globalCompositeOperation = 'source-over';
      const bob = Math.sin(now * 0.0012) * base * 0.012;
      const scale = 1 + level * 0.14;
      const size = R * 2 * 0.78 * scale;
      const ly = cy + bob;

      const glow = ctx.createRadialGradient(cx, ly, size * 0.2, cx, ly, size * 0.75);
      glow.addColorStop(0, `rgba(45,212,191,${0.35 + level * 0.4})`);
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, ly, size * 0.75, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, ly, size / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      if (img.complete && img.naturalWidth) {
        ctx.drawImage(img, cx - size / 2, ly - size / 2, size, size);
      } else {
        ctx.fillStyle = '#10101c';
        ctx.fillRect(cx - size / 2, ly - size / 2, size, size);
      }
      ctx.restore();

      // aro do disco
      ctx.beginPath();
      ctx.arc(cx, ly, size / 2, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,255,255,${0.12 + level * 0.2})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="h-full w-full" aria-hidden="true" />;
}
