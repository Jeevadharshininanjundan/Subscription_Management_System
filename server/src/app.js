import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { requestId } from './middleware/requestId.js';
import { healthRouter } from './routes/health.js';
import { authRouter } from './routes/auth.js';
import { staffRouter } from './routes/staff.js';
import { coreRouter } from './routes/core.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_ORIGIN }));
  app.use(express.json({ limit: '100kb' }));
  app.use(requestId);

  app.use('/health', healthRouter);
  app.use('/api/v1/health', healthRouter);
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/staff', staffRouter);
  app.use('/api/v1', coreRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
