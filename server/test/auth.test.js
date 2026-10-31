import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { Customer, User } from '../src/models/index.js';
import { requireCustomerOwnership } from '../src/middleware/auth.js';
import { env } from '../src/config/env.js';

const app = createApp();
const password = 'SecurePassword!9';

async function login(email = 'admin@example.com') {
  const response = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password });
  return response.body.data.accessToken;
}

describe('authentication and authorization', () => {
  beforeAll(async () => {
    await connectDatabase(process.env.MONGO_TEST_URI);
  });

  beforeEach(async () => {
    await mongoose.connection.db.dropDatabase();
    await Promise.all(Object.values(mongoose.models).map(model => model.createIndexes()));
    const admin = await User.create({
      email: 'admin@example.com',
      passwordHash: await (await import('../src/utils/password.js')).hashPassword(password),
      name: 'Admin',
      role: 'ADMIN'
    });
    expect(admin.role).toBe('ADMIN');
  });

  afterAll(async () => {
    await mongoose.connection.db.dropDatabase();
    await disconnectDatabase();
  });

  it('registers customers and rejects duplicate or invalid accounts', async () => {
    const created = await request(app).post('/api/v1/auth/register').send({
      email: ' Customer@Example.com ',
      password,
      name: 'Customer'
    });
    expect(created.status).toBe(201);
    expect(created.body.data.user.role).toBe('CUSTOMER');
    expect(created.body.data.user.email).toBe('customer@example.com');
    expect(created.body.data.user).not.toHaveProperty('passwordHash');

    const duplicate = await request(app).post('/api/v1/auth/register').send({
      email: 'customer@example.com',
      password,
      name: 'Other'
    });
    expect(duplicate.status).toBe(409);

    const invalid = await request(app).post('/api/v1/auth/register').send({
      email: 'weak@example.com',
      password: 'weakpassword',
      name: 'Weak'
    });
    expect(invalid.status).toBe(400);
  });

  it('logs in, returns a safe profile, and rejects invalid credentials', async () => {
    const success = await request(app).post('/api/v1/auth/login').send({
      email: 'ADMIN@example.com',
      password
    });
    expect(success.status).toBe(200);
    expect(success.body.data.accessToken).toBeTruthy();

    const profile = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${success.body.data.accessToken}`);
    expect(profile.status).toBe(200);
    expect(profile.body.data.user.email).toBe('admin@example.com');

    const invalid = await request(app).post('/api/v1/auth/login').send({
      email: 'admin@example.com',
      password: 'WrongPassword!9'
    });
    expect(invalid.status).toBe(401);
    expect(invalid.body.error.message).not.toContain('hash');
  });

  it('revokes an access token after logout and rejects malformed or expired JWTs', async () => {
    const token = await login();
    const logout = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${token}`);
    expect(logout.status).toBe(200);

    const revoked = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(revoked.status).toBe(401);

    const malformed = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invalid.token');
    expect(malformed.status).toBe(401);

    const expired = jwt.sign(
      { sub: new mongoose.Types.ObjectId().toString(), role: 'ADMIN', tokenVersion: 0 },
      env.JWT_SECRET,
      { expiresIn: -1, issuer: env.JWT_ISSUER, audience: env.JWT_AUDIENCE }
    );
    const expiredResponse = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${expired}`);
    expect(expiredResponse.status).toBe(401);
  });

  it('creates staff only for admins and does not allow staff or customers', async () => {
    const adminToken = await login();
    const created = await request(app)
      .post('/api/v1/staff')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'staff@example.com', password, name: 'Staff' });
    expect(created.status).toBe(201);
    expect(created.body.data.user.role).toBe('STAFF');

    const staffToken = await login('staff@example.com');
    const staffDenied = await request(app)
      .get('/api/v1/staff')
      .set('Authorization', `Bearer ${staffToken}`);
    expect(staffDenied.status).toBe(403);

    const customer = await request(app).post('/api/v1/auth/register').send({
      email: 'customer@example.com',
      password,
      name: 'Customer'
    });
    const customerDenied = await request(app)
      .get('/api/v1/staff')
      .set('Authorization', `Bearer ${customer.body.data.accessToken}`);
    expect(customerDenied.status).toBe(403);
  });

  it('uses generic forgot-password responses and single-use expiring reset tokens', async () => {
    const existing = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'admin@example.com' });
    const missing = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'missing@example.com' });
    expect(existing.status).toBe(200);
    expect(missing.status).toBe(200);
    expect(existing.body.data.message).toBe(missing.body.data.message);

    const user = await User.findOne({ email: 'admin@example.com' }).select('+resetTokenHash');
    expect(user.resetTokenHash).toBeTruthy();

    const expired = await User.updateOne(
      { _id: user._id },
      { resetTokenExpiresAt: new Date(Date.now() - 1000) }
    );
    expect(expired.modifiedCount).toBe(1);
    const expiredResponse = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: 'not-the-token', password: 'NewPassword!9' });
    expect(expiredResponse.status).toBe(400);

    await request(app).post('/api/v1/auth/forgot-password').send({ email: 'admin@example.com' });
    const refreshed = await User.findOne({ email: 'admin@example.com' })
      .select('+resetTokenHash');
    const tokenHash = refreshed.resetTokenHash;
    const { createHash } = await import('node:crypto');
    const rawToken = 'test-reset-token';
    await User.updateOne({ _id: refreshed._id }, {
      resetTokenHash: createHash('sha256').update(rawToken).digest('hex'),
      resetTokenExpiresAt: new Date(Date.now() + 60_000)
    });
    const reset = await request(app).post('/api/v1/auth/reset-password').send({
      token: rawToken,
      password: 'NewPassword!9'
    });
    expect(reset.status).toBe(200);
    const reused = await request(app).post('/api/v1/auth/reset-password').send({
      token: rawToken,
      password: 'AnotherPassword!9'
    });
    expect(reused.status).toBe(400);
    expect(tokenHash).toBeTruthy();
  });

  it('rate limits repeated login attempts and isolates customer resources', async () => {
    const responses = [];
    for (let index = 0; index < 11; index += 1) {
      responses.push(await request(app).post('/api/v1/auth/login').send({
        email: 'admin@example.com',
        password: 'WrongPassword!9'
      }));
    }
    expect(responses.some(response => response.status === 429)).toBe(true);

    const customer = await Customer.create({
      name: 'Owner',
      primaryEmail: 'owner@example.com'
    });
    const requestContext = {
      user: { role: 'CUSTOMER', customerId: new mongoose.Types.ObjectId() },
      params: { customerId: customer._id.toString() },
      requestId: 'isolation-test'
    };
    let status;
    requireCustomerOwnership(requestContext, {
      status(code) {
        status = code;
        return { json() {} };
      }
    }, () => {});
    expect(status).toBe(403);
  }, 15000);
});
