import { z } from 'zod';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

export const indianPhoneSchema = z.string().trim().refine(
  (val) => {
    if (!val) return true;
    try {
      const parsed = parsePhoneNumberFromString(val, 'IN');
      return Boolean(parsed && parsed.country === 'IN' && parsed.isValid());
    } catch { return false; }
  },
  { message: 'Enter a valid Indian mobile number (10 digits, starting with 6–9).' }
);

export const pinCodeSchema = z.string().regex(/^[1-9][0-9]{5}$/, 'Enter a valid 6-digit Indian PIN code (e.g. 400001).');

export const coordinatesSchema = z.object({
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
});

export const profileSchema = z.object({
  display_name: z.string().trim().max(100).optional(),
  phone_e164: indianPhoneSchema.optional(),
  preferred_state: z.string().optional(),
  preferred_city: z.string().trim().max(100).optional(),
  preferred_language: z.string().default('en'),
  notification_preferences: z.record(z.string(), z.unknown()).default({}),
});

export const prescriptionScheduleSchema = z.object({
  medicine_name: z.string().trim().min(1, 'Medicine name is required.').max(200),
  prescribed_dosage: z.string().trim().min(1, 'Prescribed dosage is required.').max(500),
  prescribed_times: z.array(z.object({
    time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be in HH:mm format (e.g. 09:00).'),
    label: z.string().min(1).max(50),
  })).min(1, 'At least one administration time is required.').max(24),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  prescribed_duration_text: z.string().trim().max(200).optional(),
  prescription_reference: z.string().trim().max(100).optional(),
  clinician_name: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(1000).optional(),
  reminder_enabled: z.boolean().default(false),
}).refine(
  (d) => !(d.start_date && d.end_date) || new Date(d.end_date) >= new Date(d.start_date),
  { message: 'End date must be on or after the start date.', path: ['end_date'] }
);

export const firstAidItemSchema = z.object({
  item_name: z.string().trim().min(1, 'Item name is required.').max(200),
  quantity: z.number().finite().nonnegative('Quantity cannot be negative.').max(99999),
  unit: z.string().trim().min(1).max(40).default('item'),
  expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  storage_notes: z.string().trim().max(500).optional(),
});

export const medicineSearchSchema = z.object({
  query: z.string().trim().min(1, 'Search term is required.').max(200),
});

export const pharmacySearchSchema = z.object({
  query: z.string().trim().max(200).optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  area: z.string().optional(),
  pinCode: z.string().regex(/^[1-9][0-9]{5}$/).optional(),
  latitude: z.number().finite().min(-90).max(90).optional(),
  longitude: z.number().finite().min(-180).max(180).optional(),
  radiusKm: z.number().positive().max(50).optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(50).default(20),
});

export type Profile = z.infer<typeof profileSchema>;
export type PrescriptionScheduleInput = z.infer<typeof prescriptionScheduleSchema>;
export type FirstAidItemInput = z.infer<typeof firstAidItemSchema>;
