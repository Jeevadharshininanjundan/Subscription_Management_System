import mongoose from 'mongoose';
import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { env } from '../src/config/env.js';
import { Customer, SubscriptionPlan } from '../src/models/index.js';
import { calculateTotals, makeLine, subscriptionCreate, transitionSubscription } from '../src/services/core.js';

describe('core domain services', () => {
  beforeAll(async () => {
    await connectDatabase(env.MONGO_TEST_URI);
  });
  beforeEach(async () => {
    await mongoose.connection.db.dropDatabase();
  });
  afterAll(async () => {
    await mongoose.connection.db.dropDatabase();
    await disconnectDatabase();
  });

  it('calculates integer minor-unit totals and rejects invalid lifecycle transitions', async () => {
    const totals = await calculateTotals([makeLine({
      name: 'Plan', quantity: 2, unitPriceMinor: 1250, currency: 'USD', taxRateBasisPoints: 1000
    })]);
    expect(totals.subtotalMinor).toBe(2500);
    expect(totals.taxMinor).toBe(250);
    expect(totals.totalMinor).toBe(2750);

    const customer = await Customer.create({ name: 'Core Customer', primaryEmail: 'core@example.com' });
    const plan = await SubscriptionPlan.create({
      name: 'Core Plan', billingInterval: 'MONTHLY', basePriceMinor: 1000, currency: 'USD',
      minimumQuantity: 1, availableFrom: new Date('2020-01-01')
    });
    const subscription = await subscriptionCreate({ customerId: customer._id, planId: plan._id });
    await expect(transitionSubscription(subscription._id, 'PAID')).rejects.toMatchObject({ code: 'INVALID_TRANSITION' });
    await expect(transitionSubscription(subscription._id, 'CONFIRMED')).resolves.toMatchObject({ status: 'CONFIRMED' });
  });
});
