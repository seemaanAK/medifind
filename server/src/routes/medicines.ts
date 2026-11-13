import { Router } from 'express';
import { z } from 'zod';
import { getMedicineDataProvider } from '../providers/medicine.provider.js';

export const medicinesRouter = Router();

const searchQuerySchema = z.object({
  query: z.string().trim().min(1, 'Search query cannot be empty.').max(200),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

medicinesRouter.get('/medicines', async (req, res, next) => {
  try {
    const { query, page, limit } = searchQuerySchema.parse(req.query);

    const provider = getMedicineDataProvider();
    const result = await provider.search(query, page, limit);

    res.json({
      data: result.data,
      meta: {
        total: result.total,
        page,
        limit,
        provider: result.provider,
        source: result.source,
      },
    });
  } catch (err) {
    next(err);
  }
});

medicinesRouter.get('/medicines/:medicineId', async (req, res, next) => {
  try {
    const { medicineId } = req.params;
    const provider = getMedicineDataProvider();
    const medicine = await provider.getById(medicineId);

    if (!medicine) {
      res.status(404).json({
        error: {
          code: 'MEDICINE_NOT_FOUND',
          message: 'No verified medicine record found for this identifier.',
        },
      });
      return;
    }

    res.json({ data: medicine });
  } catch (err) {
    next(err);
  }
});
