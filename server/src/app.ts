import express from 'express';
import cors from 'cors';
import { CONFIG } from './config/index.js';
import { healthRouter } from './routes/health.js';
import { medicinesRouter } from './routes/medicines.js';
import { pharmaciesRouter } from './routes/pharmacies.js';
import { emergencyRouter } from './routes/emergency.js';
import { firstAidRouter } from './routes/firstAid.js';
import { schedulesRouter } from './routes/schedules.js';
import { profileRouter } from './routes/profile.js';
import { aiRouter } from './routes/ai.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  // Middleware
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, same-origin)
      if (!origin || CONFIG.corsOrigins.includes(origin) || CONFIG.nodeEnv !== 'production') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  }));

  app.use(express.json({ limit: '100kb' }));

  // Basic security headers
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  // Mount API routes
  app.use('/api', healthRouter);
  app.use('/api', medicinesRouter);
  app.use('/api', pharmaciesRouter);
  app.use('/api', emergencyRouter);
  app.use('/api', firstAidRouter);
  app.use('/api', schedulesRouter);
  app.use('/api', profileRouter);
  app.use('/api', aiRouter);

  // 404 handler for API routes
  app.use('/api', (_req, res) => {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'API endpoint not found.',
      },
    });
  });

  // Global error handler
  app.use(errorHandler);

  return app;
}
