'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** Botão flutuante para instalar a PWA (Android/desktop). */
export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!deferred || hidden) return null;

  return (
    <div className="fixed inset-x-3 bottom-20 z-50 mx-auto max-w-md animate-fade-up md:bottom-6">
      <div className="flex items-center gap-3 rounded-2xl border border-neon-purple/30 bg-ink-800/90 p-3 shadow-neon backdrop-blur">
        <div className="rounded-xl bg-neon-purple/15 p-2 text-neon-purple">
          <Download size={20} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">Instalar Beatfinder</p>
          <p className="text-xs text-white/60">Adiciona à tua ecrã principal.</p>
        </div>
        <button
          onClick={async () => {
            await deferred.prompt();
            await deferred.userChoice;
            setDeferred(null);
          }}
          className="rounded-xl bg-neon-purple px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110"
        >
          Instalar
        </button>
        <button onClick={() => setHidden(true)} className="text-white/40 hover:text-white">
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
