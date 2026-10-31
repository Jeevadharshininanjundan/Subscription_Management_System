import { Router } from 'express';

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
  response.json({
    data: {
      status: 'ready',
      checks: {
        application: 'ok',
        database: 'not-configured'
      }
    },
    meta: { requestId: response.getHeader('x-request-id') },
    error: null
  });
});
