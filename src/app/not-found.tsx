import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="font-display text-6xl font-black text-neon-purple neon-text">404</p>
      <h1 className="mt-3 text-xl font-bold text-white">Página não encontrada</h1>
      <p className="mt-1 text-white/50">O evento pode ter terminado ou o link estar errado.</p>
      <Link href="/" className="btn-primary mt-6">Voltar ao início</Link>
    </div>
  );
}
