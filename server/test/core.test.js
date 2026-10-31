import mongoose from 'mongoose';
import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { env } from '../src/config/env.js';
import { Customer, Discount, Quotation, SubscriptionPlan, TaxConfiguration } from '../src/models/index.js';
import { acceptQuotation, calculateTotals, makeLine, quotationCreate, subscriptionCreate, transitionSubscription } from '../src/services/core.js';

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

  it('selects active server tax rules, rounds down, and ignores client tax rates', async () => {
    const tax = await TaxConfiguration.create({
      name: 'US Sales Tax', rateBasisPoints: 875, currencyScope: 'USD',
      startsAt: new Date('2020-01-01'), status: 'ACTIVE'
    });
    const totals = await calculateTotals([makeLine({
      name: 'Server priced', quantity: 3, unitPriceMinor: 101, currency: 'USD', taxRateBasisPoints: 9900
    })], undefined, { serverDriven: true });
    expect(totals.taxMinor).toBe(26);
    expect(totals.lines[0].taxRateBasisPoints).toBe(875);
    expect(totals.calculationSnapshot.taxConfigurations[0].taxConfigurationId.toString()).toBe(tax._id.toString());
  });

  it('rejects ineligible discounts, caps valid discounts, and accounts usage once on acceptance', async () => {
    const customer = await Customer.create({ name: 'Discount Customer', primaryEmail: 'discount@example.com' });
    const discount = await Discount.create({
      name: 'Launch', kind: 'FIXED', value: 500, currency: 'USD', scope: 'SUBSCRIPTION',
      minimumPurchaseMinor: 1000, startsAt: new Date('2020-01-01'), usageLimit: 1
    });
    const quotation = await quotationCreate({
      customerId: customer._id, status: 'SENT', validUntil: new Date('2099-01-01'),
      discountId: discount._id,
      lines: [{ name: 'Service', quantity: 1, unitPriceMinor: 1200, currency: 'USD' }]
    });
    expect(quotation.totalMinor).toBe(700);
    await acceptQuotation(quotation._id);
    await acceptQuotation(quotation._id);
    expect((await Discount.findById(discount._id)).usageCount).toBe(1);
    expect((await Quotation.findById(quotation._id)).discountUsageAccountedAt).toBeTruthy();
  });

  it('rejects expired tax configurations selected by the client', async () => {
    const tax = await TaxConfiguration.create({
      name: 'Expired', rateBasisPoints: 1000, currencyScope: 'USD',
      startsAt: new Date('2020-01-01'), endsAt: new Date('2020-02-01'), status: 'ACTIVE'
    });
    await expect(calculateTotals([{
      name: 'Expired tax', quantity: 1, unitPriceMinor: 1000, currency: 'USD',
      taxConfigurationId: tax._id
    }], undefined, { serverDriven: true, at: new Date('2021-01-01') }))
      .rejects.toMatchObject({ code: 'TAX_INELIGIBLE' });
  });
});
