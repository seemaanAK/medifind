import { format, addDays, isAfter, isBefore, parseISO } from 'date-fns';

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return 'N/A';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd/MM/yyyy');
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return 'N/A';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd/MM/yyyy, hh:mm a');
}

export function formatTime(time: string): string {
  if (!time) return '';
  const [hours, minutes] = time.split(':').map(Number);
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return format(d, 'hh:mm a');
}

export function isExpired(date: Date | string): boolean {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isBefore(d, new Date());
}

export function isExpiringSoon(date: Date | string, days = 30): boolean {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isAfter(d, new Date()) && isBefore(d, addDays(new Date(), days));
}

export function getExpiryStatus(date: string | null | undefined): 'expired' | 'expiring-soon' | 'ok' | 'unknown' {
  if (!date) return 'unknown';
  if (isExpired(date)) return 'expired';
  if (isExpiringSoon(date)) return 'expiring-soon';
  return 'ok';
}
