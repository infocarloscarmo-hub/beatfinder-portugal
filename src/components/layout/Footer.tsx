import Link from 'next/link';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-ink-950">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 md:flex-row md:items-center md:justify-between">
        <div>
          <Logo />
          <p className="mt-2 max-w-xs text-sm text-white/50">
            Radar automático de festas e festivais de música eletrónica em Portugal.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/60">
          <Link href="/eventos" className="hover:text-white">Eventos</Link>
          <Link href="/festivais" className="hover:text-white">Festivais</Link>
          <Link href="/mapa" className="hover:text-white">Mapa</Link>
          <Link href="/submeter" className="hover:text-white">Submeter evento</Link>
          <Link href="/admin/login" className="hover:text-white">Admin</Link>
        </div>
      </div>
      <div className="border-t border-white/5 py-4 text-center text-xs text-white/30">
        © {new Date().getFullYear()} Beatfinder Portugal
      </div>
    </footer>
  );
}
