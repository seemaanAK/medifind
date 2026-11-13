import { Router } from 'express';
import { z } from 'zod';
import { store } from '../data/store.js';

export const emergencyRouter = Router();

const emergencyQuerySchema = z.object({
  state: z.string().trim().optional(),
});

emergencyRouter.get('/emergency-contacts', (req, res, next) => {
  try {
    const { state } = emergencyQuerySchema.parse(req.query);

    // Filter verified and active contacts
    let contacts = store.emergencyContacts.filter((c) => c.is_active && c.verification_status === 'verified');

    if (state) {
      const st = state.toLowerCase();
      // Include nationwide contacts + matching state contacts
      contacts = contacts.filter((c) =>
        c.coverage_type === 'nationwide' ||
        (c.coverage_type === 'state' && c.state_code?.toLowerCase() === st) ||
        (c.region_name && c.region_name.toLowerCase().includes(st))
      );
    } else {
      // If no state selected, return nationwide contacts
      contacts = contacts.filter((c) => c.coverage_type === 'nationwide');
    }

    // Always sort nationwide 112 first
    contacts.sort((a, b) => {
      if (a.phone_number === '112') return -1;
      if (b.phone_number === '112') return 1;
      return 0;
    });

    res.json({
      data: contacts,
      meta: {
        total: contacts.length,
        selected_state: state || null,
        nationwide_number: '112',
      },
    });
  } catch (err) {
    next(err);
  }
});
