import { Router } from 'express';
import { z } from 'zod';
import { store } from '../data/store.js';
import { aiService } from '../services/ai/gemini.service.js';

export const aiRouter = Router();

const summarizeRequestSchema = z.object({
  medicineId: z.string().min(1),
});

aiRouter.post('/ai/summarize-medicine', async (req, res, next) => {
  try {
    const { medicineId } = summarizeRequestSchema.parse(req.body);
    const medicine = store.medicines.find((m) => m.id === medicineId || m.external_id === medicineId);

    if (!medicine) {
      res.status(404).json({
        error: {
          code: 'MEDICINE_NOT_FOUND',
          message: 'Cannot summarize unlisted or unknown medicine.',
        },
      });
      return;
    }

    const summary = await aiService.summarizeMedicine(medicine);
    res.json({
      data: summary,
      meta: {
        ai_enabled: aiService.isConfigured,
        source_name: medicine.source_name,
        verification_status: medicine.verification_status,
      },
    });
  } catch (err) {
    next(err);
  }
});
