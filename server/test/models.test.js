import mongoose from 'mongoose';
import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import { env } from '../src/config/env.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import {
  Customer,
  Invoice,
  Payment,
  Product,
  ProductVariant,
  Subscription,
  SubscriptionPlan,
  User
} from '../src/models/index.js';

const line = {
  name: 'Business plan',
  quantity: 2,
  unitPriceMinor: 5000,
  currency: 'USD',
  taxRateBasisPoints: 0,
  taxAmountMinor: 0,
  discountAmountMinor: 0,
  subtotalMinor: 10000,
  totalMinor: 10000
};

async function createBaseRecords() {
  const customer = await Customer.create({
    name: '  Brightloop   Customer ',
    primaryEmail: 'Customer@Example.COM'
  });
  const plan = await SubscriptionPlan.create({
    name: 'Monthly business',
    billingInterval: 'MONTHLY',
    basePriceMinor: 5000,
    currency: 'USD',
    minimumQuantity: 1,
    availableFrom: new Date('2026-01-01T00:00:00.000Z'),
    allowRenewal: true
  });
  const subscription = await Subscription.create({
    subscriptionNumber: 'SUB-0001',
    customerId: customer._id,
    planId: plan._id,
    status: 'ACTIVE',
    startDate: new Date('2026-01-01T00:00:00.000Z'),
    nextBillingDate: new Date('2026-02-01T00:00:00.000Z'),
    paymentTerms: 'Due on receipt',
    lines: [line],
    currency: 'USD',
    subtotalMinor: 10000,
    taxMinor: 0,
    discountMinor: 0,
    totalMinor: 10000
  });
  return { customer, subscription };
}

describe('Mongoose data contracts and persistence', () => {
  beforeAll(async () => {
    await connectDatabase(env.MONGO_TEST_URI);
    await mongoose.connection.db.dropDatabase();
    await Promise.all(Object.values(mongoose.models).map(model => model.createIndexes()));
  });

  beforeEach(async () => {
    await mongoose.connection.db.dropDatabase();
    await Promise.all(Object.values(mongoose.models).map(model => model.createIndexes()));
  });

  afterAll(async () => {
    await mongoose.connection.db.dropDatabase();
    await disconnectDatabase();
  });

  it('persists normalized fields, timestamps, references, and immutable line snapshots', async () => {
    const { customer, subscription } = await createBaseRecords();
    const storedCustomer = await Customer.findById(customer._id);
    const storedSubscription = await Subscription.findById(subscription._id);

    expect(storedCustomer.name).toBe('Brightloop Customer');
    expect(storedCustomer.primaryEmail).toBe('customer@example.com');
    expect(storedCustomer.createdAt).toBeInstanceOf(Date);
    expect(storedSubscription.planId.toString()).toBe(subscription.planId.toString());
    expect(storedSubscription.lines[0].name).toBe('Business plan');
    expect(storedSubscription.lines[0].unitPriceMinor).toBe(5000);
  });

  it('rejects invalid enums, monetary values, and date ranges before persistence', async () => {
    const invalidUser = new User({
      email: 'invalid@example.com',
      passwordHash: 'hash',
      name: 'Invalid',
      role: 'OWNER'
    });
    const invalidPlan = new SubscriptionPlan({
      name: 'Invalid plan',
      billingInterval: 'MONTHLY',
      basePriceMinor: -1,
      currency: 'US',
      minimumQuantity: 1,
      availableFrom: new Date('2026-02-01T00:00:00.000Z'),
      availableUntil: new Date('2026-01-01T00:00:00.000Z')
    });

    await expect(invalidUser.validate()).rejects.toThrow();
    await expect(invalidPlan.validate()).rejects.toThrow();
  });

  it('enforces unique user email and product variant names with database indexes', async () => {
    await User.create({
      email: 'duplicate@example.com',
      passwordHash: 'hash',
      name: 'First',
      role: 'STAFF'
    });
    await expect(User.create({
      email: 'DUPLICATE@example.com',
      passwordHash: 'hash',
      name: 'Second',
      role: 'STAFF'
    })).rejects.toMatchObject({ code: 11000 });

    const product = await Product.create({
      name: 'Product',
      type: 'SOFTWARE',
      salesPriceMinor: 1000,
      costPriceMinor: 500,
      currency: 'USD'
    });
    await ProductVariant.create({
      productId: product._id,
      name: 'Standard',
      priceAdjustmentMinor: 0,
      currency: 'USD'
    });
    await expect(ProductVariant.create({
      productId: product._id,
      name: 'Standard',
      priceAdjustmentMinor: 500,
      currency: 'USD'
    })).rejects.toMatchObject({ code: 11000 });
  });

  it('prevents duplicate invoice generation for one subscription billing period', async () => {
    const { customer, subscription } = await createBaseRecords();
    const invoice = {
      subscriptionId: subscription._id,
      customerId: customer._id,
      status: 'CONFIRMED',
      billingPeriodStart: new Date('2026-02-01T00:00:00.000Z'),
      billingPeriodEnd: new Date('2026-03-01T00:00:00.000Z'),
      billingPeriodKey: '2026-02',
      issueDate: new Date('2026-02-01T00:00:00.000Z'),
      dueDate: new Date('2026-02-15T00:00:00.000Z'),
      lines: [line],
      currency: 'USD',
      subtotalMinor: 10000,
      taxMinor: 0,
      discountMinor: 0,
      totalMinor: 10000,
      paidAmountMinor: 0,
      balanceDueMinor: 10000
    };

    await Invoice.create({ ...invoice, invoiceNumber: 'INV-0001' });
    await expect(Invoice.create({ ...invoice, invoiceNumber: 'INV-0002' }))
      .rejects.toMatchObject({ code: 11000 });
  });

  it('allows multiple payments without external references but enforces supplied reference uniqueness per invoice', async () => {
    const { customer, subscription } = await createBaseRecords();
    const invoice = await Invoice.create({
      invoiceNumber: 'INV-PAY-1',
      subscriptionId: subscription._id,
      customerId: customer._id,
      status: 'ISSUED',
      billingPeriodStart: new Date('2026-02-01T00:00:00.000Z'),
      billingPeriodEnd: new Date('2026-03-01T00:00:00.000Z'),
      billingPeriodKey: '2026-02-payments',
      issueDate: new Date('2026-02-01T00:00:00.000Z'),
      dueDate: new Date('2026-02-15T00:00:00.000Z'),
      lines: [line],
      currency: 'USD',
      subtotalMinor: 10000,
      taxMinor: 0,
      discountMinor: 0,
      totalMinor: 10000,
      paidAmountMinor: 0,
      balanceDueMinor: 10000
    });
    const basePayment = {
      invoiceId: invoice._id,
      customerId: customer._id,
      currency: 'USD',
      method: 'CARD',
      paymentDate: new Date('2026-02-02T00:00:00.000Z'),
      amountMinor: 1000
    };
    await Payment.create(basePayment);
    await Payment.create({ ...basePayment, amountMinor: 2000, paymentDate: new Date('2026-02-03T00:00:00.000Z'), externalReference: null });
    await Payment.create({ ...basePayment, amountMinor: 3000, externalReference: 'txn-1' });
    await expect(Payment.create({ ...basePayment, amountMinor: 4000, externalReference: 'txn-1' }))
      .rejects.toMatchObject({ code: 11000 });
  });
});
