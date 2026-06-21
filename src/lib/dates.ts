import { format, isToday, isTomorrow } from 'date-fns';
import { pt } from 'date-fns/locale';

const TZ = 'Europe/Lisbon';

/** Intervalo [início, fim] do dia de hoje em ISO (hora de Lisboa, aprox). */
export function todayRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now); start.setHours(0, 0, 0, 0);
  const end = new Date(now); end.setHours(23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

/** Intervalo do próximo fim de semana (sexta 18h → domingo 23h59). */
export function weekendRange(): { start: string; end: string } {
  const now = new Date();
  const day = now.getDay(); // 0=dom ... 6=sáb
  const friday = new Date(now);
  const daysUntilFriday = (5 - day + 7) % 7;
  friday.setDate(now.getDate() + daysUntilFriday);
  friday.setHours(18, 0, 0, 0);
  // se já é fim de semana, começa agora
  const start = day === 5 || day === 6 || day === 0 ? now : friday;
  const sunday = new Date(friday);
  sunday.setDate(friday.getDate() + (day === 0 ? 0 : 2));
  sunday.setHours(23, 59, 59, 999);
  return { start: start.toISOString(), end: sunday.toISOString() };
}

export function formatEventDate(iso: string): string {
  const d = new Date(iso);
  if (isToday(d)) return `Hoje · ${format(d, 'HH:mm', { locale: pt })}`;
  if (isTomorrow(d)) return `Amanhã · ${format(d, 'HH:mm', { locale: pt })}`;
  return format(d, "EEE, d 'de' MMM · HH:mm", { locale: pt });
}

export function formatEventDateLong(iso: string): string {
  return format(new Date(iso), "EEEE, d 'de' MMMM 'de' yyyy 'às' HH:mm", {
    locale: pt,
  });
}

export { TZ };
