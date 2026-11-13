import { APP_CONFIG } from '../lib/config';

export function formatINR(amount: number): string {
  return new Intl.NumberFormat(APP_CONFIG.locale, {
    style: 'currency',
    currency: APP_CONFIG.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat(APP_CONFIG.locale).format(value);
}
