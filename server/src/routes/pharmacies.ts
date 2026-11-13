import { Router } from 'express';
import { z } from 'zod';
import { getPharmacyProvider } from '../providers/pharmacy.provider.js';

export const pharmaciesRouter = Router();

const pharmacySearchSchema = z.object({
  query: z.string().trim().max(200).optional(),
  state: z.string().trim().optional(),
  city: z.string().trim().optional(),
  area: z.string().trim().optional(),
  pinCode: z.string().regex(/^[1-9][0-9]{5}$/, 'Invalid 6-digit Indian PIN code.').optional(),
  latitude: z.coerce.number().finite().min(-90).max(90).optional(),
  longitude: z.coerce.number().finite().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().positive().max(100).default(50),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

pharmaciesRouter.get('/pharmacies/search', async (req, res, next) => {
  try {
    const params = pharmacySearchSchema.parse(req.query);
    const hasCoords = typeof params.latitude === 'number' && typeof params.longitude === 'number';

    const provider = getPharmacyProvider();
    const result = await provider.search(params);

    res.json({
      data: result.data,
      meta: {
        total: result.total,
        page: params.page,
        limit: params.limit,
        search_mode: hasCoords ? 'coordinates' : 'manual',
        provider: result.provider,
        source: result.source,
      },
    });
  } catch (err) {
    next(err);
  }
});

pharmaciesRouter.get('/pharmacies/:pharmacyId', async (req, res, next) => {
  try {
    const { pharmacyId } = req.params;
    const provider = getPharmacyProvider();
    const pharmacy = await provider.getById(pharmacyId);

    if (!pharmacy) {
      res.status(404).json({
        error: {
          code: 'PHARMACY_NOT_FOUND',
          message: 'No verified pharmacy found for this identifier.',
        },
      });
      return;
    }

    res.json({
      data: pharmacy,
    });
  } catch (err) {
    next(err);
  }
});
