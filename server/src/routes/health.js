import { Router } from 'express';
import { isDatabaseReady } from '../config/database.js';

export const healthRouter = Router();

healthRouter.get('/live', (_request, response) => {
  response.json({
    data: {
      status: 'ok',
      service: 'brightloop-subscription-server'
    },
    meta: { requestId: response.getHeader('x-request-id') },
    error: null
  });
});

healthRouter.get('/ready', (_request, response) => {
  const databaseReady = isDatabaseReady();
  response.status(databaseReady ? 200 : 503).json({
    data: {
      status: databaseReady ? 'ready' : 'not-ready',
      checks: {
        application: 'ok',
        database: databaseReady ? 'ok' : 'unavailable'
      }
    },
    meta: { requestId: response.getHeader('x-request-id') },
    error: null
  });
});
