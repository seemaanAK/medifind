import { Router } from 'express';
import { z } from 'zod';
import { store } from '../data/store.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { randomUUID } from 'crypto';

export const schedulesRouter = Router();

const scheduleInputSchema = z.object({
  medicine_id: z.string().uuid().optional(),
  medicine_name: z.string().trim().min(1, 'Medicine name is required.').max(200),
  prescribed_dosage: z.string().trim().min(1, 'Prescribed dosage is required.').max(500),
  prescribed_times: z.array(z.object({
    time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be in HH:mm format (e.g. 09:00).'),
    label: z.string().min(1).max(50),
  })).min(1, 'At least one administration time is required.').max(24),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid start date format.').nullable().optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid end date format.').nullable().optional(),
  prescribed_duration_text: z.string().trim().max(200).optional(),
  prescription_reference: z.string().trim().max(100).optional(),
  clinician_name: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(1000).optional(),
  reminder_enabled: z.boolean().default(false),
  status: z.enum(['active', 'paused', 'completed', 'cancelled']).default('active'),
}).refine(
  (d) => !(d.start_date && d.end_date) || new Date(d.end_date) >= new Date(d.start_date),
  { message: 'End date must be on or after start date.', path: ['end_date'] }
);

const doseEventInputSchema = z.object({
  scheduled_at: z.string(),
  status: z.enum(['pending', 'taken', 'skipped']),
  recorded_at: z.string().optional(),
});

// GET all schedules for user
schedulesRouter.get('/schedules', requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const list = Array.from(store.prescriptionSchedules.values()).filter((s) => s.user_id === userId);
  res.json({ data: list });
});

// CREATE schedule
schedulesRouter.post('/schedules', requireAuth, (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const body = scheduleInputSchema.parse(req.body);

    const now = new Date().toISOString();
    const newSchedule = {
      id: randomUUID(),
      user_id: userId,
      medicine_id: body.medicine_id,
      medicine_name: body.medicine_name,
      prescribed_dosage: body.prescribed_dosage,
      prescribed_times: body.prescribed_times,
      start_date: body.start_date || null,
      end_date: body.end_date || null,
      prescribed_duration_text: body.prescribed_duration_text || '',
      prescription_reference: body.prescription_reference || '',
      clinician_name: body.clinician_name || '',
      notes: body.notes || '',
      reminder_enabled: body.reminder_enabled,
      status: body.status,
      created_at: now,
      updated_at: now,
    };

    store.prescriptionSchedules.set(newSchedule.id, newSchedule);
    res.status(201).json({ data: newSchedule });
  } catch (err) {
    next(err);
  }
});

// GET single schedule
schedulesRouter.get('/schedules/:scheduleId', requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { scheduleId } = req.params;
  const schedule = store.prescriptionSchedules.get(scheduleId);

  if (!schedule || schedule.user_id !== userId) {
    res.status(404).json({
      error: {
        code: 'SCHEDULE_NOT_FOUND',
        message: 'Prescription schedule not found.',
      },
    });
    return;
  }

  res.json({ data: schedule });
});

// PATCH schedule
schedulesRouter.patch('/schedules/:scheduleId', requireAuth, (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const { scheduleId } = req.params;
    const existing = store.prescriptionSchedules.get(scheduleId);

    if (!existing || existing.user_id !== userId) {
      res.status(404).json({
        error: {
          code: 'SCHEDULE_NOT_FOUND',
          message: 'Prescription schedule not found.',
        },
      });
      return;
    }

    const body = scheduleInputSchema.partial().parse(req.body);
    const updated = {
      ...existing,
      ...body,
      updated_at: new Date().toISOString(),
    };

    store.prescriptionSchedules.set(scheduleId, updated);
    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE schedule
schedulesRouter.delete('/schedules/:scheduleId', requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { scheduleId } = req.params;
  const existing = store.prescriptionSchedules.get(scheduleId);

  if (!existing || existing.user_id !== userId) {
    res.status(404).json({
      error: {
        code: 'SCHEDULE_NOT_FOUND',
        message: 'Prescription schedule not found.',
      },
    });
    return;
  }

  // Also clean up any associated dose events
  for (const [eventId, event] of store.doseEvents.entries()) {
    if (event.schedule_id === scheduleId) {
      store.doseEvents.delete(eventId);
    }
  }

  store.prescriptionSchedules.delete(scheduleId);
  res.json({ data: { success: true, message: 'Prescription schedule deleted.' } });
});

// DOSE EVENTS: GET
schedulesRouter.get('/schedules/:scheduleId/events', requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { scheduleId } = req.params;
  const schedule = store.prescriptionSchedules.get(scheduleId);

  if (!schedule || schedule.user_id !== userId) {
    res.status(404).json({
      error: {
        code: 'SCHEDULE_NOT_FOUND',
        message: 'Prescription schedule not found.',
      },
    });
    return;
  }

  const events = Array.from(store.doseEvents.values()).filter(
    (e) => e.schedule_id === scheduleId && e.user_id === userId
  );
  res.json({ data: events });
});

// DOSE EVENTS: POST
schedulesRouter.post('/schedules/:scheduleId/events', requireAuth, (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const { scheduleId } = req.params;
    const schedule = store.prescriptionSchedules.get(scheduleId);

    if (!schedule || schedule.user_id !== userId) {
      res.status(404).json({
        error: {
          code: 'SCHEDULE_NOT_FOUND',
          message: 'Prescription schedule not found.',
        },
      });
      return;
    }

    const body = doseEventInputSchema.parse(req.body);
    const newEvent = {
      id: randomUUID(),
      user_id: userId,
      schedule_id: scheduleId,
      scheduled_at: body.scheduled_at,
      status: body.status,
      recorded_at: body.status !== 'pending' ? (body.recorded_at || new Date().toISOString()) : undefined,
      created_at: new Date().toISOString(),
    };

    store.doseEvents.set(newEvent.id, newEvent);
    res.status(201).json({ data: newEvent });
  } catch (err) {
    next(err);
  }
});

// DOSE EVENTS: PATCH status
schedulesRouter.patch('/dose-events/:eventId', requireAuth, (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const { eventId } = req.params;
    const existing = store.doseEvents.get(eventId);

    if (!existing || existing.user_id !== userId) {
      res.status(404).json({
        error: {
          code: 'EVENT_NOT_FOUND',
          message: 'Dose event not found.',
        },
      });
      return;
    }

    const body = z.object({
      status: z.enum(['pending', 'taken', 'skipped']),
    }).parse(req.body);

    const updated = {
      ...existing,
      status: body.status,
      recorded_at: body.status !== 'pending' ? new Date().toISOString() : undefined,
    };

    store.doseEvents.set(eventId, updated);
    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});
