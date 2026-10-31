import { Customer, Invoice, Notification, Payment, Quotation, Subscription } from '../models/index.js';
import { env } from '../config/env.js';
import { createMailTransport } from './mail.js';

const escapeHtml = value => String(value ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
const dateText = value => new Date(value).toLocaleDateString('en-US', { timeZone: 'UTC' });
const money = (minor, currency) => new Intl.NumberFormat('en-US', {
  style: 'currency', currency
}).format(minor / 100) + ` (${currency})`;
const link = path => `${env.CLIENT_ORIGIN}${path}`;
const safeErrorMessage = error => (error.message || 'Mail delivery failed')
  .replace(/(password|token|secret|authorization)\s*[=:]\s*\S+/gi, '$1=[redacted]')
  .slice(0, 500);

function template({ type, reference, title, intro, rows, actionPath }) {
  const safeRows = rows.map(([label, value]) => `<tr><td style="padding:6px 12px;color:#64748b">${escapeHtml(label)}</td><td style="padding:6px 12px;font-weight:600">${escapeHtml(value)}</td></tr>`).join('');
  const textRows = rows.map(([label, value]) => `${label}: ${value}`).join('\n');
  const action = actionPath ? `\nView details: ${link(actionPath)}` : '';
  return {
    subject: `${type.replaceAll('_', ' ')} - ${reference}`,
    text: `${title}\n\n${intro}\n\n${textRows}${action}\n\nBrightloop Software`,
    html: `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#0f172a"><h2 style="color:#2563eb">Brightloop Software</h2><p style="font-size:12px;color:#64748b">${escapeHtml(type)}</p><h1>${escapeHtml(title)}</h1><p>${escapeHtml(intro)}</p><table style="border-collapse:collapse;width:100%;margin:20px 0">${safeRows}</table>${actionPath ? `<p><a href="${escapeHtml(link(actionPath))}" style="color:#2563eb">View details</a></p>` : ''}<p style="color:#64748b">Brightloop Software</p></div>`
  };
}

export function quotationTemplate(quotation, customer) {
  return template({
    type: 'QUOTATION_SENT',
    reference: quotation.quotationNumber,
    title: 'Your quotation is ready',
    intro: `Hello ${customer.name}, your quotation is available for review.`,
    rows: [
      ['Quotation', quotation.quotationNumber],
      ['Valid until', dateText(quotation.validUntil)],
      ['Total', money(quotation.totalMinor, quotation.currency)]
    ],
    actionPath: `/quotations/${quotation._id}`
  });
}

export function invoiceTemplate(invoice, customer, type = 'INVOICE_SENT') {
  return template({
    type,
    reference: invoice.invoiceNumber,
    title: type === 'OVERDUE_REMINDER' ? 'Invoice payment reminder' : 'Your invoice is ready',
    intro: `Hello ${customer.name}, here are the current details for your invoice.`,
    rows: [
      ['Invoice', invoice.invoiceNumber],
      ['Due date', dateText(invoice.dueDate)],
      ['Amount due', money(invoice.balanceDueMinor, invoice.currency)]
    ],
    actionPath: `/invoices/${invoice._id}`
  });
}

export function paymentTemplate(payment, invoice, customer) {
  return template({
    type: 'PAYMENT_RECEIPT',
    reference: invoice.invoiceNumber,
    title: 'Payment receipt',
    intro: `Hello ${customer.name}, your payment has been recorded successfully.`,
    rows: [
      ['Invoice', invoice.invoiceNumber],
      ['Payment amount', money(payment.amountMinor, payment.currency)],
      ['Payment date', dateText(payment.paymentDate)],
      ['Remaining balance', money(invoice.balanceDueMinor, invoice.currency)]
    ],
    actionPath: `/invoices/${invoice._id}`
  });
}

export function renewalTemplate(subscription, customer) {
  return template({
    type: 'RENEWAL_REMINDER',
    reference: subscription.subscriptionNumber,
    title: 'Subscription renewal reminder',
    intro: `Hello ${customer.name}, your subscription is approaching its next billing date.`,
    rows: [
      ['Subscription', subscription.subscriptionNumber],
      ['Renewal date', dateText(subscription.nextBillingDate)],
      ['Amount', money(subscription.totalMinor, subscription.currency)]
    ],
    actionPath: `/subscriptions/${subscription._id}`
  });
}

export async function deliverNotification({ type, key, reference, recipient, message, transport = createMailTransport() }) {
  let record = await Notification.findOne({ notificationKey: key });
  if (record?.status === 'SENT') return record;
  if (!record) {
    try {
      record = await Notification.create({ type, notificationKey: key, reference, recipient });
    } catch (error) {
      if (error.code !== 11000) throw error;
      record = await Notification.findOne({ notificationKey: key });
    }
  }
  if (record.status === 'SENT') return record;
  const attemptedAt = new Date();
  await Notification.updateOne({ _id: record._id }, { $set: { status: 'PENDING', attemptedAt }, $inc: { attempts: 1 } });
  try {
    await transport.sendMail({ from: env.MAIL_FROM, to: recipient, ...message });
    return Notification.findOneAndUpdate({ _id: record._id }, {
      $set: { status: 'SENT', sentAt: new Date(), errorCode: undefined, errorMessage: undefined, nextRetryAt: undefined }
    }, { new: true });
  } catch (error) {
    await Notification.findOneAndUpdate({ _id: record._id }, {
      $set: {
        status: 'FAILED',
        nextRetryAt: new Date(Date.now() + 15 * 60 * 1000),
        errorCode: typeof error.code === 'string' ? error.code.slice(0, 80) : 'MAIL_DELIVERY_FAILED',
        errorMessage: safeErrorMessage(error)
      }
    });
    console.error(`Notification delivery failed: ${type} ${reference}`);
    return null;
  }
}

export async function notifyQuotationSent(id) {
  const quotation = await Quotation.findById(id);
  if (!quotation) return null;
  const customer = await Customer.findById(quotation.customerId);
  if (!customer) return null;
  return deliverNotification({ type: 'QUOTATION_SENT', key: `QUOTATION_SENT:${quotation._id}`, reference: quotation.quotationNumber, recipient: customer.primaryEmail, message: quotationTemplate(quotation, customer) });
}

export async function notifyInvoiceSent(id) {
  const invoice = await Invoice.findById(id);
  if (!invoice) return null;
  const customer = await Customer.findById(invoice.customerId);
  if (!customer) return null;
  return deliverNotification({ type: 'INVOICE_SENT', key: `INVOICE_SENT:${invoice._id}`, reference: invoice.invoiceNumber, recipient: customer.primaryEmail, message: invoiceTemplate(invoice, customer) });
}

export async function notifyPaymentReceipt(id) {
  const payment = await Payment.findById(id);
  if (!payment) return null;
  const [invoice, customer] = await Promise.all([Invoice.findById(payment.invoiceId), Customer.findById(payment.customerId)]);
  if (!invoice || !customer) return null;
  return deliverNotification({ type: 'PAYMENT_RECEIPT', key: `PAYMENT_RECEIPT:${payment._id}`, reference: invoice.invoiceNumber, recipient: customer.primaryEmail, message: paymentTemplate(payment, invoice, customer) });
}

export async function notifyOverdueInvoice(id) {
  const invoice = await Invoice.findById(id);
  if (!invoice) return null;
  const customer = await Customer.findById(invoice.customerId);
  if (!customer) return null;
  return deliverNotification({ type: 'OVERDUE_REMINDER', key: `OVERDUE_REMINDER:${invoice._id}:${invoice.dueDate.toISOString().slice(0, 10)}`, reference: invoice.invoiceNumber, recipient: customer.primaryEmail, message: invoiceTemplate(invoice, customer, 'OVERDUE_REMINDER') });
}

export async function notifyRenewalReminder(id) {
  const subscription = await Subscription.findById(id);
  if (!subscription) return null;
  const customer = await Customer.findById(subscription.customerId);
  if (!customer) return null;
  return deliverNotification({ type: 'RENEWAL_REMINDER', key: `RENEWAL_REMINDER:${subscription._id}:${subscription.nextBillingDate.toISOString()}`, reference: subscription.subscriptionNumber, recipient: customer.primaryEmail, message: renewalTemplate(subscription, customer) });
}

export async function notifySafely(task) {
  try {
    return await task();
  } catch (error) {
    console.error(`Notification processing failed: ${error.code || 'NOTIFICATION_ERROR'}`);
    return null;
  }
}
