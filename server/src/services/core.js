import mongoose from 'mongoose';
import {
  Customer, Discount, Invoice, Payment, Product, ProductVariant, Quotation,
  Subscription, SubscriptionPlan, TaxConfiguration
} from '../models/index.js';
import { calculateLineTotals } from '../models/common.js';
import { assertAmountMinor } from '../utils/money.js';
import { notifyInvoiceSent, notifyOverdueInvoice, notifyPaymentReceipt, notifyQuotationSent, notifySafely } from './notifications.js';

const transitions = {
  DRAFT: ['QUOTATION', 'CONFIRMED', 'CANCELLED'],
  QUOTATION: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['ACTIVE', 'CANCELLED'],
  ACTIVE: ['PAUSED', 'CLOSED', 'CANCELLED'],
  PAUSED: ['ACTIVE', 'CANCELLED'],
  CANCELLED: [],
  CLOSED: []
};

function totalLines(lines, discountMinor = 0, calculationSnapshot) {
  const calculated = lines.map(calculateLineTotals);
  const subtotalMinor = calculated.reduce((sum, line) => sum + line.subtotalMinor, 0);
  const taxMinor = calculated.reduce((sum, line) => sum + line.taxAmountMinor, 0);
  const safeDiscount = Math.min(discountMinor, subtotalMinor + taxMinor);
  return {
    lines: calculated.map(line => ({ ...line, totalMinor: line.totalMinor })),
    subtotalMinor,
    taxMinor,
    discountMinor: safeDiscount,
    totalMinor: subtotalMinor + taxMinor - safeDiscount,
    calculationSnapshot
  };
}

function assertLineCurrencies(lines, requestedCurrency) {
  const currencies = new Set(lines.map(line => line.currency));
  if (currencies.size !== 1 || (requestedCurrency && !currencies.has(requestedCurrency))) {
    throw Object.assign(new Error('All financial lines must use one matching currency.'), { code: 'CURRENCY_MISMATCH', status: 422 });
  }
}

async function selectTax(line, at = new Date()) {
  const product = line.productId ? await Product.findById(line.productId).select('type') : null;
  if (line.taxConfigurationId) {
    const selected = await TaxConfiguration.findById(line.taxConfigurationId);
    const valid = selected && selected.status === 'ACTIVE'
      && selected.startsAt <= at
      && (!selected.endsAt || selected.endsAt >= at)
      && (!selected.currencyScope || selected.currencyScope === line.currency)
      && (!selected.productTypeFilters?.length || (product && selected.productTypeFilters.includes(product.type)));
    if (!valid) throw Object.assign(new Error('Selected tax configuration is not applicable.'), { code: 'TAX_INELIGIBLE', status: 422 });
    return selected;
  }
  const query = {
    status: 'ACTIVE',
    startsAt: { $lte: at },
    $or: [{ endsAt: null }, { endsAt: { $exists: false } }, { endsAt: { $gte: at } }],
    $and: [{ $or: [{ currencyScope: line.currency }, { currencyScope: null }, { currencyScope: { $exists: false } }] }]
  };
  const configurations = await TaxConfiguration.find(query).sort({ startsAt: -1 });
  const selected = configurations.find(configuration => (
    !configuration.productTypeFilters?.length
    || (product && configuration.productTypeFilters.includes(product.type))
  ));
  if (!selected) return null;
  return selected;
}

export async function calculateTotals(lines, discountId, { serverDriven = false, at = new Date() } = {}) {
  const calculatedLines = [];
  const taxSnapshots = [];
  for (const inputLine of lines) {
    const tax = serverDriven ? await selectTax(inputLine, at) : null;
    const line = {
      ...inputLine,
      taxConfigurationId: tax?._id,
      taxConfigurationName: tax?.name,
      taxRateBasisPoints: serverDriven ? (tax?.rateBasisPoints || 0) : (inputLine.taxRateBasisPoints || 0),
      taxAmountMinor: 0,
      discountAmountMinor: 0,
      subtotalMinor: 0,
      totalMinor: 0
    };
    calculatedLines.push(line);
    if (tax) {
      taxSnapshots.push({
        taxConfigurationId: tax._id,
        name: tax.name,
        rateBasisPoints: tax.rateBasisPoints,
        currencyScope: tax.currencyScope,
        jurisdiction: tax.jurisdiction
      });
    }
  }
  let discountMinor = 0;
  let discountSnapshot;
  if (discountId) {
    const discount = await Discount.findById(discountId);
    if (!discount || discount.status !== 'ACTIVE') throw Object.assign(new Error('Discount is not active.'), { code: 'DISCOUNT_INELIGIBLE', status: 422 });
    const now = new Date();
    if (discount.startsAt > now || (discount.endsAt && discount.endsAt < now)
      || (discount.usageLimit !== undefined && discount.usageCount >= discount.usageLimit)) {
      throw Object.assign(new Error('Discount is expired or exhausted.'), { code: 'DISCOUNT_INELIGIBLE', status: 422 });
    }
    const subtotal = calculatedLines.reduce((sum, line) => sum + line.quantity * line.unitPriceMinor, 0);
    const quantity = calculatedLines.reduce((sum, line) => sum + line.quantity, 0);
    if (discount.currency && discount.currency !== (calculatedLines[0]?.currency || '')) {
      throw Object.assign(new Error('Discount currency does not match the document currency.'), { code: 'DISCOUNT_INELIGIBLE', status: 422 });
    }
    if (discount.scope === 'PRODUCT') {
      const eligible = new Set((discount.eligibleProductIds || []).map(value => value.toString()));
      if (!eligible.size || calculatedLines.some(line => !line.productId || !eligible.has(line.productId.toString()))) {
        throw Object.assign(new Error('Discount does not apply to all selected products.'), { code: 'DISCOUNT_INELIGIBLE', status: 422 });
      }
    }
    if (subtotal < discount.minimumPurchaseMinor || (discount.minimumQuantity && quantity < discount.minimumQuantity)) {
      throw Object.assign(new Error('Discount minimum requirements are not met.'), { code: 'DISCOUNT_INELIGIBLE', status: 422 });
    }
    discountMinor = discount.kind === 'PERCENTAGE'
      ? Math.floor(subtotal * discount.value / 100)
      : discount.value;
    discountMinor = Math.min(discountMinor, subtotal);
    discountSnapshot = {
      discountId: discount._id,
      name: discount.name,
      kind: discount.kind,
      value: discount.value,
      eligibleSubtotalMinor: subtotal,
      amountMinor: discountMinor
    };
  }
  return totalLines(calculatedLines, discountMinor, {
    calculatedAt: at,
    taxConfigurations: taxSnapshots,
    discount: discountSnapshot
  });
}

export function makeLine({ productId, variantId, planId, name, quantity, unitPriceMinor, currency, taxRateBasisPoints = 0 }) {
  assertAmountMinor(unitPriceMinor);
  if (!Number.isSafeInteger(quantity) || quantity < 1) throw Object.assign(new Error('Quantity must be positive.'), { code: 'VALIDATION_ERROR', status: 400 });
  return { productId, variantId, planId, name, quantity, unitPriceMinor, currency, taxRateBasisPoints, taxAmountMinor: 0, discountAmountMinor: 0, subtotalMinor: 0, totalMinor: 0 };
}

export async function productCreate(input) { return Product.create(input); }
export async function productUpdate(id, input) { return Product.findByIdAndUpdate(id, input, { new: true, runValidators: true }); }
export async function productArchive(id) { return Product.findByIdAndUpdate(id, { status: 'ARCHIVED', archivedAt: new Date() }, { new: true }); }
export async function variantCreate(productId, input) { return ProductVariant.create({ ...input, productId }); }
export async function variantList(productId) { return ProductVariant.find({ productId }).sort({ createdAt: -1 }); }
export async function variantUpdate(id, input) { return ProductVariant.findByIdAndUpdate(id, input, { new: true, runValidators: true }); }
export async function variantArchive(id) { return ProductVariant.findByIdAndUpdate(id, { status: 'ARCHIVED' }, { new: true }); }
export async function customerCreate(input) { return Customer.create(input); }
export async function customerUpdate(id, input) { return Customer.findByIdAndUpdate(id, input, { new: true, runValidators: true }); }
export async function customerArchive(id) { return Customer.findByIdAndUpdate(id, { status: 'INACTIVE' }, { new: true }); }
export async function planCreate(input) { return SubscriptionPlan.create(input); }
export async function planUpdate(id, input) { return SubscriptionPlan.findByIdAndUpdate(id, input, { new: true, runValidators: true }); }
export async function planArchive(id) { return SubscriptionPlan.findByIdAndUpdate(id, { status: 'ARCHIVED' }, { new: true }); }
export async function taxCreate(input) { return TaxConfiguration.create(input); }
export async function taxUpdate(id, input) { return TaxConfiguration.findByIdAndUpdate(id, input, { new: true, runValidators: true }); }
export async function discountCreate(input) { return Discount.create(input); }
export async function discountUpdate(id, input) { return Discount.findByIdAndUpdate(id, input, { new: true, runValidators: true }); }
export async function paymentList(invoiceId) { return Payment.find({ invoiceId }).sort({ paymentDate: -1 }); }

export async function confirmInvoice(id) {
  const session = await mongoose.startSession();
  const apply = async activeSession => {
    const invoice = await Invoice.findById(id).session(activeSession);
    if (!invoice) throw Object.assign(new Error('Invoice cannot be confirmed.'), { code: 'INVALID_TRANSITION', status: 409 });
    if (['CONFIRMED', 'PARTIALLY_PAID', 'OVERDUE', 'PAID'].includes(invoice.status)) return invoice;
    if (invoice.status === 'CANCELLED') throw Object.assign(new Error('Invoice cannot be confirmed.'), { code: 'INVALID_TRANSITION', status: 409 });
    if (invoice.calculationSnapshot?.discount?.discountId && !invoice.discountUsageAccountedAt) {
      await incrementDiscountUsage(invoice.calculationSnapshot.discount.discountId, activeSession);
      invoice.discountUsageAccountedAt = new Date();
    }
    invoice.status = invoice.balanceDueMinor === 0 ? 'PAID' : 'CONFIRMED';
    invoice.confirmedAt = new Date();
    await invoice.save(activeSession ? { session: activeSession } : undefined);
    return invoice;
  };
  try {
    let result;
    await session.withTransaction(async () => { result = await apply(session); });
    await notifySafely(() => notifyInvoiceSent(id));
    return result;
  } catch (error) {
    if (!/Transaction numbers are only allowed|replica set/i.test(error.message)) throw error;
    const result = await apply(null);
    await notifySafely(() => notifyInvoiceSent(id));
    return result;
  } finally {
    await session.endSession();
  }
}

export async function cancelInvoice(id, reason) {
  const invoice = await Invoice.findById(id);
  if (!invoice || invoice.status === 'PAID' || invoice.paidAmountMinor > 0) throw Object.assign(new Error('Paid invoices cannot be cancelled.'), { code: 'INVALID_TRANSITION', status: 409 });
  invoice.status = 'CANCELLED';
  invoice.cancelledAt = new Date();
  invoice.cancellationReason = reason;
  await invoice.save();
  return invoice;
}

async function incrementDiscountUsage(discountId, session) {
  if (!discountId) return;
  const filter = { _id: discountId, status: 'ACTIVE' };
  const update = { $inc: { usageCount: 1 } };
  if (session) {
    filter.$or = [{ usageLimit: { $exists: false } }, { $expr: { $lt: ['$usageCount', '$usageLimit'] } }];
    const result = await Discount.updateOne(filter, update).session(session);
    if (result.modifiedCount !== 1) throw Object.assign(new Error('Discount usage limit has been reached.'), { code: 'DISCOUNT_INELIGIBLE', status: 422 });
    return;
  }
  const result = await Discount.updateOne({
    ...filter,
    $or: [{ usageLimit: { $exists: false } }, { $expr: { $lt: ['$usageCount', '$usageLimit'] } }]
  }, update);
  if (result.modifiedCount !== 1) throw Object.assign(new Error('Discount usage limit has been reached.'), { code: 'DISCOUNT_INELIGIBLE', status: 422 });
}

export async function acceptQuotation(id) {
  const quotation = await Quotation.findById(id);
  if (!quotation) throw Object.assign(new Error('Quotation not found.'), { code: 'NOT_FOUND', status: 404 });
  if (['ACCEPTED', 'CONVERTED'].includes(quotation.status)) return quotation;
  if (quotation.status !== 'SENT' || quotation.validUntil < new Date()) {
    throw Object.assign(new Error('Only valid sent quotations can be accepted.'), { code: 'INVALID_TRANSITION', status: 409 });
  }
  const discountId = quotation.calculationSnapshot?.discount?.discountId;
  const session = await mongoose.startSession();
  try {
    let accepted;
    await session.withTransaction(async () => {
      await incrementDiscountUsage(discountId, session);
      accepted = await Quotation.findOneAndUpdate(
        { _id: id, status: 'SENT' },
        { $set: { status: 'ACCEPTED', discountUsageAccountedAt: discountId ? new Date() : undefined } },
        { new: true, session }
      );
      if (!accepted) throw Object.assign(new Error('Quotation has already been accepted.'), { code: 'INVALID_TRANSITION', status: 409 });
    });
    return accepted;
  } catch (error) {
    if (!/Transaction numbers are only allowed|replica set/i.test(error.message)) {
      throw error;
    }
    const accepted = await Quotation.findOneAndUpdate(
      { _id: id, status: 'SENT' },
      { $set: { status: 'ACCEPTED', discountUsageAccountedAt: discountId ? new Date() : undefined } },
      { new: true }
    );
    if (!accepted) return Quotation.findById(id);
    await incrementDiscountUsage(discountId);
    return accepted;
  } finally {
    await session.endSession();
  }
}

export async function quotationCreate(input) {
  const customer = await Customer.findById(input.customerId);
  if (!customer) throw Object.assign(new Error('Customer not found.'), { code: 'NOT_FOUND', status: 404 });
  assertLineCurrencies(input.lines, input.currency);
  const totals = await calculateTotals(input.lines, input.discountId, { serverDriven: true });
  const quotation = await Quotation.create({ ...input, quotationNumber: input.quotationNumber || `QUO-${Date.now()}`, issuedAt: input.issuedAt || new Date(), ...totals, currency: input.currency || input.lines[0].currency });
  if (quotation.status === 'SENT') await notifySafely(() => notifyQuotationSent(quotation._id));
  return quotation;
}

export async function quotationConvert(id) {
  const quotation = await Quotation.findById(id);
  if (!quotation) throw Object.assign(new Error('Quotation not found.'), { code: 'NOT_FOUND', status: 404 });
  if (quotation.convertedSubscriptionId) return Subscription.findById(quotation.convertedSubscriptionId);
  if (quotation.status !== 'ACCEPTED' || quotation.validUntil < new Date()) throw Object.assign(new Error('Only valid accepted quotations can convert.'), { code: 'INVALID_TRANSITION', status: 409 });
  const subscription = await Subscription.create({
    subscriptionNumber: `SUB-${Date.now()}`, customerId: quotation.customerId, quotationId: quotation._id,
    planId: quotation.lines.find(line => line.planId)?.planId, status: 'CONFIRMED',
    startDate: new Date(), nextBillingDate: new Date(), paymentTerms: 'Due on receipt',
    lines: quotation.lines, currency: quotation.currency, calculationSnapshot: quotation.calculationSnapshot,
    discountUsageAccountedAt: quotation.discountUsageAccountedAt, subtotalMinor: quotation.subtotalMinor,
    taxMinor: quotation.taxMinor, discountMinor: quotation.discountMinor, totalMinor: quotation.totalMinor
  });
  quotation.status = 'CONVERTED';
  quotation.convertedSubscriptionId = subscription._id;
  await quotation.save();
  return subscription;
}

export async function subscriptionCreate(input) {
  const [customer, plan] = await Promise.all([Customer.findById(input.customerId), SubscriptionPlan.findById(input.planId)]);
  if (!customer || !plan || plan.status !== 'ACTIVE') throw Object.assign(new Error('Customer or active plan not found.'), { code: 'NOT_FOUND', status: 404 });
  const startDate = new Date(input.startDate || Date.now());
  if (startDate < plan.availableFrom || (plan.availableUntil && startDate > plan.availableUntil)) throw Object.assign(new Error('Subscription is outside plan availability.'), { code: 'INVALID_CONFIGURATION', status: 422 });
  const lines = input.lines?.length ? input.lines : [makeLine({ planId: plan._id, name: plan.name, quantity: plan.minimumQuantity, unitPriceMinor: plan.basePriceMinor, currency: plan.currency })];
  assertLineCurrencies(lines, plan.currency);
  const totals = await calculateTotals(lines, input.discountId, { serverDriven: true });
  return Subscription.create({ ...input, subscriptionNumber: input.subscriptionNumber || `SUB-${Date.now()}`, planId: plan._id, customerId: customer._id, startDate, nextBillingDate: input.nextBillingDate || startDate, status: 'DRAFT', paymentTerms: input.paymentTerms || 'Due on receipt', ...totals, currency: plan.currency });
}

export async function transitionSubscription(id, target) {
  const subscription = await Subscription.findById(id);
  if (!subscription || !transitions[subscription.status]?.includes(target)) throw Object.assign(new Error('Invalid subscription transition.'), { code: 'INVALID_TRANSITION', status: 409 });
  subscription.status = target;
  if (target === 'PAUSED') subscription.pausedAt = new Date();
  if (['CLOSED', 'CANCELLED'].includes(target)) subscription.closedAt = new Date();
  await subscription.save();
  return subscription;
}

function periodEnd(start, interval) {
  const date = new Date(start);
  const months = { DAILY: 0, WEEKLY: 0, MONTHLY: 1, QUARTERLY: 3, HALF_YEARLY: 6, YEARLY: 12 }[interval];
  if (interval === 'DAILY') date.setUTCDate(date.getUTCDate() + 1);
  else if (interval === 'WEEKLY') date.setUTCDate(date.getUTCDate() + 7);
  else date.setUTCMonth(date.getUTCMonth() + months);
  return date;
}

export async function generateInvoice(subscription, now = new Date()) {
  const start = new Date(subscription.nextBillingDate);
  const end = periodEnd(start, subscription.planId?.billingInterval || 'MONTHLY');
  const billingPeriodKey = `${subscription._id}-${start.toISOString()}`;
  const existing = await Invoice.findOne({ subscriptionId: subscription._id, billingPeriodKey });
  if (existing) return existing;
  const lines = subscription.lines.map(line => ({ ...line.toObject?.() || line }));
  const invoice = await Invoice.create({
    invoiceNumber: `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    subscriptionId: subscription._id, customerId: subscription.customerId, status: 'ISSUED',
    billingPeriodStart: start, billingPeriodEnd: end, billingPeriodKey, issueDate: now, dueDate: now,
    lines, calculationSnapshot: subscription.calculationSnapshot,
    discountUsageAccountedAt: subscription.discountUsageAccountedAt,
    currency: subscription.currency, subtotalMinor: subscription.subtotalMinor, taxMinor: subscription.taxMinor,
    discountMinor: subscription.discountMinor, totalMinor: subscription.totalMinor, paidAmountMinor: 0, balanceDueMinor: subscription.totalMinor
  });
  subscription.nextBillingDate = end;
  subscription.lastBilledPeriodKey = billingPeriodKey;
  await subscription.save();
  return invoice;
}

export async function runBilling(now = new Date()) {
  const overdue = await Invoice.find(
    { status: { $in: ['ISSUED', 'CONFIRMED', 'PARTIALLY_PAID'] }, dueDate: { $lt: now }, balanceDueMinor: { $gt: 0 } },
    { _id: 1 }
  );
  await Invoice.updateMany(
    { status: { $in: ['ISSUED', 'CONFIRMED', 'PARTIALLY_PAID'] }, dueDate: { $lt: now }, balanceDueMinor: { $gt: 0 } },
    { $set: { status: 'OVERDUE' } }
  );
  await Promise.all(overdue.map(invoice => notifySafely(() => notifyOverdueInvoice(invoice._id))));
  const due = await Subscription.find({ status: 'ACTIVE', nextBillingDate: { $lte: now } }).populate('planId');
  const invoices = [];
  for (const subscription of due) {
    try { invoices.push(await generateInvoice(subscription, now)); } catch (error) { console.error(`Billing failed for ${subscription._id}: ${error.message}`); }
  }
  return invoices;
}

export async function recordPayment(invoiceId, input, actorId) {
  const session = await mongoose.startSession();
  const applyPayment = async (activeSession) => {
    const invoice = await Invoice.findById(invoiceId).session(activeSession);
    if (!invoice || invoice.status === 'CANCELLED') throw Object.assign(new Error('Invoice is not payable.'), { code: 'INVALID_PAYMENT', status: 422 });
    assertAmountMinor(input.amountMinor);
    if (input.amountMinor > invoice.balanceDueMinor) throw Object.assign(new Error('Payment exceeds invoice balance.'), { code: 'OVERPAYMENT', status: 422 });
    const [payment] = await Payment.create([{ ...input, invoiceId, customerId: invoice.customerId, currency: invoice.currency, recordedBy: actorId }], activeSession ? { session: activeSession } : undefined);
    invoice.paidAmountMinor += input.amountMinor;
    invoice.balanceDueMinor -= input.amountMinor;
    invoice.status = invoice.balanceDueMinor === 0 ? 'PAID' : 'PARTIALLY_PAID';
    await invoice.save(activeSession ? { session: activeSession } : undefined);
    return payment;
  };
  try {
    let payment;
    await session.withTransaction(async () => { payment = await applyPayment(session); });
    await notifySafely(() => notifyPaymentReceipt(payment._id));
    return payment;
  } catch (error) {
    if (!/Transaction numbers are only allowed|replica set/i.test(error.message)) throw error;
    const payment = await applyPayment(null);
    await notifySafely(() => notifyPaymentReceipt(payment._id));
    return payment;
  } finally { await session.endSession(); }
}
