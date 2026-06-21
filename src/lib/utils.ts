import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formata preço EUR; "Grátis" quando 0; intervalo quando min!=max. */
export function formatPrice(
  min: number | null,
  max: number | null,
  currency = 'EUR'
): string {
  if (min == null && max == null) return 'Preço a confirmar';
  if ((min === 0 || min == null) && (max === 0 || max == null)) return 'Grátis';
  const fmt = (n: number) =>
    new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency,
      maximumFractionDigits: n % 1 === 0 ? 0 : 2,
    }).format(n);
  if (min != null && max != null && min !== max) return `${fmt(min)}–${fmt(max)}`;
  return fmt((min ?? max)!);
}

/** Cria slug a partir de um título. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);
}
