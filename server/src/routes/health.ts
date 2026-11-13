import { Router } from 'express';
import { CONFIG } from '../config/index.js';
import { getPharmacyProvider } from '../providers/pharmacy.provider.js';
import { getMedicineDataProvider } from '../providers/medicine.provider.js';

export const healthRouter = Router();

healthRouter.get('/health', (_req, res) => {
  const pharmacyProvider = getPharmacyProvider();
  const medicineProvider = getMedicineDataProvider();

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'medifind-api',
    providers: {
      pharmacy: {
        type: CONFIG.pharmacyProvider,
        configured: pharmacyProvider.isConfigured(),
      },
      medicine: {
        type: CONFIG.medicineDataProvider,
        configured: medicineProvider.isConfigured(),
      },
    },
  });
});
