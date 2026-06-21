import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function SectionHeader({
  title,
  href,
  hint,
}: {
  title: string;
  href?: string;
  hint?: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between">
      <div>
        <h2 className="font-display text-xl font-bold text-white md:text-2xl">{title}</h2>
        {hint && <p className="text-sm text-white/50">{hint}</p>}
      </div>
      {href && (
        <Link href={href} className="inline-flex items-center gap-1 text-sm font-medium text-neon-purple hover:underline">
          Ver tudo <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}
