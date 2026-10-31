import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { hashPassword } from '../src/utils/password.js';
import { Customer, Invoice, Payment, Quotation, Subscription, User } from '../src/models/index.js';

const app = createApp();
const password = 'SecurePassword!9';
const line = {
  name: 'Protected plan',
  quantity: 1,
  unitPriceMinor: 1000,
  currency: 'USD',
  taxRateBasisPoints: 0,
  taxAmountMinor: 0,
  discountAmountMinor: 0,
  subtotalMinor: 1000,
  totalMinor: 1000
};

async function login(email) {
  const response = await request(app).post('/api/v1/auth/login').send({ email, password });
  return response.body.data.accessToken;
}

describe('authorization and ownership boundaries', () => {
  beforeAll(async () => { await connectDatabase(process.env.MONGO_TEST_URI); });
  beforeEach(async () => {
    await mongoose.connection.db.dropDatabase();
    await Promise.all(Object.values(mongoose.models).map(model => model.createIndexes()));
    await User.create({
      email: 'admin@example.com',
      passwordHash: await hashPassword(password),
      name: 'Admin',
      role: 'ADMIN'
    });
    await User.create({
      email: 'staff@example.com',
      passwordHash: await hashPassword(password),
      name: 'Staff',
      role: 'STAFF'
    });
  });
  afterAll(async () => {
    await mongoose.connection.db.dropDatabase();
    await disconnectDatabase();
  });

  async function createCustomer(email, name) {
    const response = await request(app).post('/api/v1/auth/register')
      .send({ email, password, name });
    return {
      user: response.body.data.user,
      token: response.body.data.accessToken,
      customer: await Customer.findOne({ primaryEmail: email })
    };
  }

  it('isolates quotations, blocks customer acceptance, and protects invoice payment history', async () => {
    const first = await createCustomer('first@example.com', 'First Customer');
    const second = await createCustomer('second@example.com', 'Second Customer');
    const quotation = await Quotation.create({
      quotationNumber: 'QUO-AUTH-1',
      customerId: first.customer._id,
      status: 'SENT',
      issuedAt: new Date(),
      validUntil: new Date(Date.now() + 86_400_000),
      lines: [line],
      currency: 'USD',
      subtotalMinor: 1000,
      taxMinor: 0,
      discountMinor: 0,
      totalMinor: 1000
    });
    const subscription = await Subscription.create({
      subscriptionNumber: 'SUB-AUTH-1',
      customerId: first.customer._id,
      planId: new mongoose.Types.ObjectId(),
      status: 'ACTIVE',
      startDate: new Date(),
      nextBillingDate: new Date(Date.now() + 86_400_000),
      paymentTerms: 'Due on receipt',
      lines: [line],
      currency: 'USD',
      subtotalMinor: 1000,
      taxMinor: 0,
      discountMinor: 0,
      totalMinor: 1000
    });
    const invoice = await Invoice.create({
      invoiceNumber: 'INV-AUTH-1',
      subscriptionId: subscription._id,
      customerId: first.customer._id,
      status: 'CONFIRMED',
      billingPeriodStart: new Date(),
      billingPeriodEnd: new Date(Date.now() + 86_400_000),
      billingPeriodKey: 'AUTH-PERIOD-1',
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 86_400_000),
      lines: [line],
      currency: 'USD',
      subtotalMinor: 1000,
      taxMinor: 0,
      discountMinor: 0,
      totalMinor: 1000,
      paidAmountMinor: 100,
      balanceDueMinor: 900
    });
    await Payment.create({
      invoiceId: invoice._id,
      customerId: first.customer._id,
      amountMinor: 100,
      currency: 'USD',
      method: 'CARD',
      paymentDate: new Date()
    });

    const secondQuotationRead = await request(app)
      .get(`/api/v1/quotations/${quotation._id}`)
      .set('Authorization', `Bearer ${second.token}`);
    expect(secondQuotationRead.status).toBe(403);
    expect(secondQuotationRead.body.error.code).toBe('FORBIDDEN');

    const customerAccept = await request(app)
      .post(`/api/v1/quotations/${quotation._id}/accept`)
      .set('Authorization', `Bearer ${first.token}`);
    expect(customerAccept.status).toBe(403);
    expect(customerAccept.body.error.code).toBe('FORBIDDEN');

    const secondPaymentRead = await request(app)
      .get(`/api/v1/invoices/${invoice._id}/payments`)
      .set('Authorization', `Bearer ${second.token}`);
    expect(secondPaymentRead.status).toBe(403);
    expect(secondPaymentRead.body.error.code).toBe('FORBIDDEN');

    const firstPaymentRead = await request(app)
      .get(`/api/v1/invoices/${invoice._id}/payments`)
      .set('Authorization', `Bearer ${first.token}`);
    expect(firstPaymentRead.status).toBe(200);
    expect(firstPaymentRead.body.data).toHaveLength(1);
  });

  it('restricts configuration and staff administration while preserving staff access', async () => {
    const adminToken = await login('admin@example.com');
    const staffToken = await login('staff@example.com');
    const customer = await createCustomer('config-customer@example.com', 'Config Customer');

    for (const path of ['/api/v1/taxes', '/api/v1/discounts']) {
      const customerResponse = await request(app).get(path).set('Authorization', `Bearer ${customer.token}`);
      expect(customerResponse.status).toBe(403);
      const staffResponse = await request(app).get(path).set('Authorization', `Bearer ${staffToken}`);
      expect(staffResponse.status).toBe(200);
    }

    const staffDenied = await request(app).get('/api/v1/staff')
      .set('Authorization', `Bearer ${staffToken}`);
    expect(staffDenied.status).toBe(403);

    const adminAllowed = await request(app).get('/api/v1/staff')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminAllowed.status).toBe(200);
  });

  it('rejects invalid and expired tokens on protected resources', async () => {
    const malformed = await request(app).get('/api/v1/taxes')
      .set('Authorization', 'Bearer invalid-token');
    expect(malformed.status).toBe(401);

    const expired = await request(app).get('/api/v1/taxes')
      .set('Authorization', 'Bearer expired-token');
    expect(expired.status).toBe(401);
  });
});
