import { describe, it, expect } from 'vitest';
import { validateIndianPhone, normalizeIndianPhone } from '../../src/utils/phone';
import { pinCodeSchema } from '../../src/schemas';
import { formatINR, formatNumber } from '../../src/utils/currency';
import { validateCoordinates, haversineDistanceKm, formatDistance } from '../../src/utils/location';
import { getExpiryStatus, isExpired, isExpiringSoon } from '../../src/utils/dates';

describe('Indian Phone Validation & Normalization', () => {
  it('validates authentic 10-digit Indian mobile numbers', () => {
    expect(validateIndianPhone('+919876543210')).toBe(true);
    expect(validateIndianPhone('9876543210')).toBe(true);
    expect(validateIndianPhone('+91 98765 43210')).toBe(true);
    expect(validateIndianPhone('8123456789')).toBe(true);
    expect(validateIndianPhone('7012345678')).toBe(true);
    expect(validateIndianPhone('6234567890')).toBe(true);
  });

  it('rejects invalid or non-Indian phone numbers', () => {
    expect(validateIndianPhone('')).toBe(false);
    expect(validateIndianPhone('12345')).toBe(false);
    expect(validateIndianPhone('1234567890')).toBe(false); // Does not start with 6-9
    expect(validateIndianPhone('abcdefghij')).toBe(false);
  });

  it('normalizes valid Indian mobile numbers to E.164 (+91...) format', () => {
    expect(normalizeIndianPhone('9876543210')).toBe('+919876543210');
    expect(normalizeIndianPhone('+91 98765 43210')).toBe('+919876543210');
    expect(normalizeIndianPhone('+91-98765-43210')).toBe('+919876543210');
  });

  it('returns null when normalizing invalid numbers', () => {
    expect(normalizeIndianPhone('12345')).toBe(null);
    expect(normalizeIndianPhone('')).toBe(null);
  });
});

describe('Indian PIN Code Validation', () => {
  it('validates 6-digit Indian PIN codes', () => {
    expect(pinCodeSchema.safeParse('110001').success).toBe(true);
    expect(pinCodeSchema.safeParse('400050').success).toBe(true);
    expect(pinCodeSchema.safeParse('560038').success).toBe(true);
    expect(pinCodeSchema.safeParse('600017').success).toBe(true);
  });

  it('rejects invalid PIN codes', () => {
    expect(pinCodeSchema.safeParse('010001').success).toBe(false); // Starts with 0
    expect(pinCodeSchema.safeParse('11000').success).toBe(false);  // 5 digits
    expect(pinCodeSchema.safeParse('1100001').success).toBe(false); // 7 digits
    expect(pinCodeSchema.safeParse('ABCDEF').success).toBe(false);
  });
});

describe('Currency & Number Formatting', () => {
  it('formats amounts in Indian Rupee (INR, ₹)', () => {
    const formatted = formatINR(150);
    expect(formatted).toContain('150');
    expect(formatted.replace(/\s+/g, '')).toMatch(/₹|INR/);
  });

  it('formats large numbers using Indian numbering system', () => {
    const formatted = formatNumber(100000);
    expect(formatted).toBe('1,00,000');
  });
});

describe('Geographic Coordinates & Haversine Distance', () => {
  it('validates valid coordinates within bounds', () => {
    expect(validateCoordinates({ latitude: 28.6139, longitude: 77.2090 })).toBe(true); // New Delhi
    expect(validateCoordinates({ latitude: 19.0760, longitude: 72.8777 })).toBe(true); // Mumbai
  });

  it('rejects out of bounds or non-finite coordinates', () => {
    expect(validateCoordinates({ latitude: 95, longitude: 77 })).toBe(false);
    expect(validateCoordinates({ latitude: 28, longitude: 185 })).toBe(false);
    expect(validateCoordinates({ latitude: NaN, longitude: 77 })).toBe(false);
  });

  it('calculates straight-line Haversine distance correctly', () => {
    const delhi = { latitude: 28.6139, longitude: 77.2090 };
    const mumbai = { latitude: 19.0760, longitude: 72.8777 };
    const distance = haversineDistanceKm(delhi, mumbai);
    // Straight-line distance Delhi to Mumbai is ~1148 km
    expect(distance).toBeGreaterThan(1100);
    expect(distance).toBeLessThan(1200);
  });

  it('labels distance clearly as straight-line', () => {
    expect(formatDistance(5.4)).toBe('5.4 km (straight-line)');
    expect(formatDistance(0.5)).toBe('500 m (straight-line)');
  });
});

describe('Expiry Status Calculation', () => {
  it('identifies expired dates', () => {
    const past = new Date('2020-01-01');
    expect(isExpired(past)).toBe(true);
    expect(getExpiryStatus('2020-01-01')).toBe('expired');
  });

  it('identifies upcoming expiry within 30 days', () => {
    const soon = new Date();
    soon.setDate(soon.getDate() + 10);
    const dateStr = soon.toISOString().split('T')[0];
    expect(isExpiringSoon(soon)).toBe(true);
    expect(getExpiryStatus(dateStr)).toBe('expiring-soon');
  });

  it('identifies safe items with far future expiry', () => {
    const farFuture = new Date();
    farFuture.setFullYear(farFuture.getFullYear() + 2);
    const dateStr = farFuture.toISOString().split('T')[0];
    expect(getExpiryStatus(dateStr)).toBe('ok');
  });

  it('returns unknown for items without expiry date', () => {
    expect(getExpiryStatus(null)).toBe('unknown');
    expect(getExpiryStatus(undefined)).toBe('unknown');
  });
});
