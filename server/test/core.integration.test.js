import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { Customer, Invoice, Subscription } from '../src/models/index.js';

const app = createApp();
const password = 'SecurePassword!9';

async function adminToken() {
  const response = await request(app).post('/api/v1/auth/login').send({ email: 'admin@example.com', password });
  return response.body.data.accessToken;
}

describe('core business workflow integration', () => {
  beforeAll(async () => { await connectDatabase(process.env.MONGO_TEST_URI); });
  beforeEach(async () => {
    await mongoose.connection.db.dropDatabase();
    await Promise.all(Object.values(mongoose.models).map(model => model.createIndexes()));
    await request(app).post('/api/v1/auth/register').send({ email: 'admin@example.com', password, name: 'Admin' });
    await Customer.deleteMany({});
    await mongoose.connection.models.User.updateOne({ email: 'admin@example.com' }, { $set: { role: 'ADMIN' } });
  });
  afterAll(async () => { await mongoose.connection.db.dropDatabase(); await disconnectDatabase(); });

  it('completes quotation conversion, lifecycle, billing idempotency, and payment flow', async () => {
    const token = await adminToken();
    const auth = { Authorization: 'Bearer ' + token };
    const customer = await request(app).post('/api/v1/customers').set(auth).send({ name: 'Acme', primaryEmail: 'acme@example.com' });
    const plan = await request(app).post('/api/v1/plans').set(auth).send({
      name: 'Core', billingInterval: 'MONTHLY', basePriceMinor: 1000, currency: 'USD',
      minimumQuantity: 1, availableFrom: '2020-01-01T00:00:00.000Z'
    });
    expect(customer.status).toBe(201);
    expect(plan.status).toBe(201);
    const quotation = await request(app).post('/api/v1/quotations').set(auth).send({
      customerId: customer.body.data._id, status: 'SENT', validUntil: '2099-01-01T00:00:00.000Z',
      lines: [{ planId: plan.body.data._id, name: 'Core', quantity: 1, unitPriceMinor: 1000, currency: 'USD' }]
    });
    expect(quotation.status).toBe(201);
    const accepted = await request(app).post(`/api/v1/quotations/${quotation.body.data._id}/accept`).set(auth);
    const converted = await request(app).post(`/api/v1/quotations/${quotation.body.data._id}/convert`).set(auth);
    expect(accepted.body.data.status).toBe('ACCEPTED');
    expect(converted.body.data.status).toBe('CONFIRMED');
    const active = await request(app).post(`/api/v1/subscriptions/${converted.body.data._id}/activate`).set(auth);
    expect(active.body.data.status).toBe('ACTIVE');

    await Subscription.updateOne({ _id: converted.body.data._id }, { $set: { nextBillingDate: new Date('2020-01-01T00:00:00.000Z') } });
    const billing = await request(app).post('/api/v1/billing/run').set(auth);
    expect(billing.status).toBe(200);
    expect(billing.body.data.count).toBe(1);
    expect(await Invoice.countDocuments()).toBe(1);
    await Subscription.updateOne({ _id: converted.body.data._id }, { $set: { nextBillingDate: new Date('2099-01-01T00:00:00.000Z') } });
    const secondBilling = await request(app).post('/api/v1/billing/run').set(auth);
    expect(secondBilling.body.data.count).toBe(0);
    expect(await Invoice.countDocuments()).toBe(1);

    const invoice = await Invoice.findOne();
    const payment = await request(app).post(`/api/v1/invoices/${invoice._id}/payments`).set(auth)
      .send({ amountMinor: 1000, method: 'CARD', paymentDate: '2026-10-31T00:00:00.000Z' });
    expect(payment.status).toBe(201);
    expect((await Invoice.findById(invoice._id)).status).toBe('PAID');
    const overpayment = await request(app).post(`/api/v1/invoices/${invoice._id}/payments`).set(auth)
      .send({ amountMinor: 1, method: 'CARD', paymentDate: '2026-10-31T00:00:00.000Z' });
    expect(overpayment.status).toBe(422);
  });
});
