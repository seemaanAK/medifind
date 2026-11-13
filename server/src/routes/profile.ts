import { Router } from 'express';
import { z } from 'zod';
import { store } from '../data/store.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

export const profileRouter = Router();

const indianPhoneUpdateSchema = z.string().trim().refine(
  (val) => {
    if (!val) return true;
    try {
      const parsed = parsePhoneNumberFromString(val, 'IN');
      return Boolean(parsed && parsed.country === 'IN' && parsed.isValid());
    } catch {
      return false;
    }
  },
  { message: 'Enter a valid Indian mobile number.' }
);

const profileUpdateSchema = z.object({
  display_name: z.string().trim().max(100).optional(),
  phone_e164: indianPhoneUpdateSchema.optional(),
  preferred_state: z.string().trim().max(100).optional(),
  preferred_city: z.string().trim().max(100).optional(),
  preferred_language: z.string().default('en'),
  notification_preferences: z.record(z.string(), z.unknown()).default({}),
});

profileRouter.get('/profile', requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  let profile = store.profiles.get(userId);

  if (!profile) {
    const now = new Date().toISOString();
    profile = {
      id: userId,
      country_code: '+91',
      country: 'IN',
      preferred_language: 'en',
      notification_preferences: {},
      created_at: now,
      updated_at: now,
    };
    store.profiles.set(userId, profile);
  }

  res.json({ data: profile });
});

profileRouter.patch('/profile', requireAuth, (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const body = profileUpdateSchema.parse(req.body);

    let phoneE164 = body.phone_e164;
    if (phoneE164) {
      const parsed = parsePhoneNumberFromString(phoneE164, 'IN');
      if (parsed && parsed.isValid()) {
        phoneE164 = parsed.format('E.164');
      }
    }

    const existing = store.profiles.get(userId);
    const now = new Date().toISOString();

    const updated = {
      id: userId,
      country_code: '+91',
      country: 'IN',
      preferred_language: body.preferred_language || existing?.preferred_language || 'en',
      display_name: body.display_name !== undefined ? body.display_name : existing?.display_name,
      phone_e164: phoneE164 !== undefined ? phoneE164 : existing?.phone_e164,
      preferred_state: body.preferred_state !== undefined ? body.preferred_state : existing?.preferred_state,
      preferred_city: body.preferred_city !== undefined ? body.preferred_city : existing?.preferred_city,
      notification_preferences: body.notification_preferences || existing?.notification_preferences || {},
      created_at: existing?.created_at || now,
      updated_at: now,
    };

    store.profiles.set(userId, updated);
    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});
