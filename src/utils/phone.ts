import { parsePhoneNumberFromString } from 'libphonenumber-js';

export function validateIndianPhone(value: string): boolean {
  if (!value) return false;
  try {
    const parsed = parsePhoneNumberFromString(value, 'IN');
    return Boolean(
      parsed &&
      parsed.isValid() &&
      parsed.country === 'IN' &&
      /^[6-9]\d{9}$/.test(parsed.nationalNumber)
    );
  } catch {
    return false;
  }
}

export function normalizeIndianPhone(value: string): string | null {
  if (!value) return null;
  try {
    const parsed = parsePhoneNumberFromString(value, 'IN');
    if (
      parsed &&
      parsed.isValid() &&
      parsed.country === 'IN' &&
      /^[6-9]\d{9}$/.test(parsed.nationalNumber)
    ) {
      return parsed.format('E.164');
    }
    return null;
  } catch {
    return null;
  }
}
