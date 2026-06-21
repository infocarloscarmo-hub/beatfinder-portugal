'use client';

import { useEffect, useRef } from 'react';
import { audioBus, getAudioLevel } from '@/lib/audioBus';

/**
 * Animação futurista do hero: o emblema do logótipo pulsa e emite ondas
 * sonoras neon ao ritmo da música (reage ao analisador de áudio). Quando a
 * música está desligada, faz uma animação suave.
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

    const rings: { r: number; a: number }[] = [];
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

    const draw = (now: number) => {
      const dt = Math.min(50, now - last);
      last = now;
      rot += dt * 0.0002;

      const target = getAudioLevel();
      level += (target - level) * 0.18;

      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const cx = w / 2;
      const cy = h / 2;
      const base = Math.min(w, h);
      ctx.clearRect(0, 0, w, h);

      // novas ondas ao ritmo (122 BPM quando toca, lento quando parado)
      const interval = audioBus.playing ? (60 / 138) * 1000 : 1600;
      beatAcc += dt;
      if (beatAcc >= interval) {
        beatAcc = 0;
        rings.push({ r: base * 0.22, a: 0.55 + level * 0.45 });
      }

      // ondas a expandir
      for (let i = rings.length - 1; i >= 0; i--) {
        const ring = rings[i];
        ring.r += (0.5 + level * 2.2) * (dt / 16) * (base / 360);
        ring.a -= 0.0045 * (dt / 16);
        if (ring.a <= 0 || ring.r > base * 0.62) {
          rings.splice(i, 1);
          continue;
        }
        const t = ring.r / (base * 0.6);
        const r = Math.round(45 + t * 210);
        const g = Math.round(212 - t * 90);
        const b = Math.round(191 - t * 120);
        ctx.beginPath();
        ctx.arc(cx, cy, ring.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${r},${g},${b},${Math.max(0, ring.a)})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // anel rotativo (arcos) à volta do emblema
      const ringR = base * 0.3 * (1 + level * 0.06);
      for (let k = 0; k < 3; k++) {
        const start = rot * (k % 2 === 0 ? 1 : -1) + (k * Math.PI * 2) / 3;
        ctx.beginPath();
        ctx.arc(cx, cy, ringR + k * 6, start, start + Math.PI * 0.6);
        ctx.strokeStyle =
          k === 0
            ? `rgba(34,211,238,${0.5 + level * 0.4})`
            : k === 1
            ? `rgba(45,212,191,${0.4 + level * 0.4})`
            : `rgba(255,122,60,${0.4 + level * 0.4})`;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      // emblema central, a pulsar com a batida
      const scale = 1 + level * 0.16;
      const size = base * 0.4 * scale;
      ctx.save();
      ctx.shadowColor = 'rgba(45,212,191,0.85)';
      ctx.shadowBlur = 24 + level * 50;
      ctx.beginPath();
      ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      if (img.complete && img.naturalWidth) {
        ctx.drawImage(img, cx - size / 2, cy - size / 2, size, size);
      } else {
        ctx.fillStyle = '#10101c';
        ctx.fillRect(cx - size / 2, cy - size / 2, size, size);
      }
      ctx.restore();

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
