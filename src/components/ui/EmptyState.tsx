export function EmptyState({
  title,
  subtitle,
  icon = '🎧',
}: {
  title: string;
  subtitle?: string;
  icon?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-16 text-center">
      <div className="mb-3 text-4xl">{icon}</div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      {subtitle && <p className="mt-1 max-w-sm text-sm text-white/50">{subtitle}</p>}
    </div>
  );
}
