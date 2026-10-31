import mongoose from 'mongoose';
import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { env } from '../src/config/env.js';
import { Customer, Notification } from '../src/models/index.js';
import { createMailTransport } from '../src/services/mail.js';
import {
  invoiceTemplate, notifyQuotationSent, paymentTemplate, quotationTemplate, renewalTemplate
} from '../src/services/notifications.js';
import { deliverNotification } from '../src/services/notifications.js';

describe('notification service', () => {
  beforeAll(async () => { await connectDatabase(env.MONGO_TEST_URI); });
  beforeEach(async () => { await mongoose.connection.db.dropDatabase(); });
  afterAll(async () => { await mongoose.connection.db.dropDatabase(); await disconnectDatabase(); });

  it('renders all notification templates with trusted amounts, dates, and text alternatives', () => {
    const customer = { name: 'Acme <safe>', primaryEmail: 'acme@example.com' };
    const quotation = {
      _id: new mongoose.Types.ObjectId(), quotationNumber: 'QUO-100',
      validUntil: new Date('2026-12-01T00:00:00Z'), totalMinor: 1250, currency: 'USD'
    };
    const invoice = {
      _id: new mongoose.Types.ObjectId(), invoiceNumber: 'INV-100',
      dueDate: new Date('2026-12-01T00:00:00Z'), balanceDueMinor: 800, currency: 'USD'
    };
    const payment = {
      _id: new mongoose.Types.ObjectId(), amountMinor: 450, currency: 'USD',
      paymentDate: new Date('2026-10-31T00:00:00Z')
    };
    const subscription = {
      _id: new mongoose.Types.ObjectId(), subscriptionNumber: 'SUB-100',
      nextBillingDate: new Date('2026-12-01T00:00:00Z'), totalMinor: 1250, currency: 'USD'
    };
    for (const message of [
      quotationTemplate(quotation, customer),
      invoiceTemplate(invoice, customer),
      paymentTemplate(payment, invoice, customer),
      renewalTemplate(subscription, customer)
    ]) {
      expect(message.html).toContain('Brightloop Software');
      expect(message.text).toContain('USD');
      expect(message.html).not.toContain('password');
      expect(message.html).not.toContain('token');
    }
  });

  it('uses the JSON test transport and records duplicate-safe quotation delivery', async () => {
    expect(createMailTransport().options.jsonTransport).toBe(true);
    const customer = await Customer.create({ name: 'Acme', primaryEmail: 'acme@example.com' });
    const quotation = {
      _id: new mongoose.Types.ObjectId(), quotationNumber: `QUO-${Date.now()}`,
      customerId: customer._id, validUntil: new Date('2026-12-01'), totalMinor: 990, currency: 'USD'
    };
    const { Quotation } = await import('../src/models/index.js');
    await Quotation.create({ ...quotation, status: 'SENT', issuedAt: new Date('2026-10-31'), lines: [{
      name: 'Service', quantity: 1, unitPriceMinor: 990, currency: 'USD',
      subtotalMinor: 990, totalMinor: 990
    }] });
    const first = await notifyQuotationSent(quotation._id);
    const second = await notifyQuotationSent(quotation._id);
    expect(first.status).toBe('SENT');
    expect(second._id.toString()).toBe(first._id.toString());
    expect(await Notification.countDocuments({ notificationKey: `QUOTATION_SENT:${quotation._id}` })).toBe(1);
    expect((await Notification.findOne()).attempts).toBe(1);
  });

  it('records delivery failures without throwing or storing sensitive error details', async () => {
    const result = await deliverNotification({
      type: 'INVOICE_SENT',
      key: 'INVOICE_SENT:failed',
      reference: 'INV-FAILED',
      recipient: 'acme@example.com',
      message: { subject: 'Invoice', text: 'Invoice text', html: '<p>Invoice</p>' },
      transport: { sendMail: async () => { throw Object.assign(new Error('SMTP password=secret'), { code: 'SMTP_FAILURE' }); } }
    });
    expect(result).toBeNull();
    const record = await Notification.findOne({ notificationKey: 'INVOICE_SENT:failed' });
    expect(record.status).toBe('FAILED');
    expect(record.errorCode).toBe('SMTP_FAILURE');
    expect(record.errorMessage).not.toContain('secret');
  });
});
