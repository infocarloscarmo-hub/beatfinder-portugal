'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-3 text-5xl">🎚️</div>
      <h1 className="text-xl font-bold text-white">Algo correu mal</h1>
      <p className="mt-1 max-w-sm text-sm text-white/50">
        Não foi possível carregar este conteúdo. Tenta novamente.
      </p>
      <button onClick={reset} className="btn-primary mt-6">
        Tentar de novo
      </button>
    </div>
  );
}
