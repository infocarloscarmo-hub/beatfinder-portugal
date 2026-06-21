import Link from 'next/link';
import Image from 'next/image';

export default function Logo({ className = '' }: { className?: string }) {
  return (
    <Link href="/" className={`group inline-flex items-center gap-2 ${className}`}>
      <span className="relative h-9 w-9 overflow-hidden rounded-xl shadow-neon ring-1 ring-white/10">
        <Image
          src="/logo-mark.png"
          alt="Beatfinder Portugal"
          fill
          sizes="36px"
          className="object-cover"
          priority
        />
      </span>
      <span className="font-display text-lg font-bold tracking-tight text-white">
        Beat<span className="brand-text">finder</span>
      </span>
    </Link>
  );
}
