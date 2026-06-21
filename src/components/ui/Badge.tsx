import { cn } from '@/lib/utils';

export function Badge({
  children,
  color,
  className,
}: {
  children: React.ReactNode;
  color?: string | null;
  className?: string;
}) {
  return (
    <span
      className={cn('chip', className)}
      style={color ? { borderColor: `${color}55`, color } : undefined}
    >
      {children}
    </span>
  );
}
