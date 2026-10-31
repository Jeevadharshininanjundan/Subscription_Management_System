import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

const app = createApp();

describe('health endpoints', () => {
  it('reports liveness with a request id', async () => {
    const response = await request(app)
      .get('/health/live')
      .set('x-request-id', 'test-request');

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('ok');
    expect(response.headers['x-request-id']).toBe('test-request');
    expect(response.body.meta.requestId).toBe('test-request');
  });

  it('reports readiness without exposing configuration', async () => {
    const response = await request(app).get('/api/v1/health/ready');

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('ready');
    expect(response.body).not.toHaveProperty('env');
  });

  it('returns the standard not-found error shape', async () => {
    const response = await request(app).get('/missing');

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
    expect(response.body.meta.requestId).toBeTruthy();
  });
});
