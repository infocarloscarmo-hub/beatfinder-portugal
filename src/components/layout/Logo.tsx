import Link from 'next/link';

export default function Logo({ className = '' }: { className?: string }) {
  return (
    <Link href="/" className={`group inline-flex items-center gap-2 ${className}`}>
      <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-neon-purple to-neon-pink shadow-neon">
        <span className="text-sm font-black text-white">B</span>
      </span>
      <span className="font-display text-lg font-bold tracking-tight text-white">
        Beat<span className="text-neon-purple neon-text">finder</span>
      </span>
    </Link>
  );
}
