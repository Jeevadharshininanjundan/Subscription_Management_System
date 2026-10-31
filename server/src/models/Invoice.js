import mongoose from 'mongoose';
import { nonNegativeInteger, validateDateOrder } from '../utils/validation.js';
import { addMonetaryTotals, calculationSnapshotSchema, snapshotLineSchema, timestampOptions } from './common.js';

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true, trim: true },
  subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  status: { type: String, required: true, enum: ['DRAFT', 'ISSUED', 'CONFIRMED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'], default: 'DRAFT' },
  billingPeriodStart: { type: Date, required: true },
  billingPeriodEnd: { type: Date, required: true, validate: validateDateOrder('billingPeriodStart', 'billingPeriodEnd') },
  billingPeriodKey: { type: String, required: true, trim: true },
  issueDate: { type: Date, required: true },
  dueDate: { type: Date, required: true },
  lines: { type: [snapshotLineSchema], required: true, validate: value => value.length > 0 },
  paidAmountMinor: { ...nonNegativeInteger, required: true, default: 0 },
  balanceDueMinor: { ...nonNegativeInteger, required: true, default: 0 },
  confirmedAt: Date,
  sentAt: Date,
  cancelledAt: Date,
  cancellationReason: { type: String, trim: true },
  calculationSnapshot: calculationSnapshotSchema,
  discountUsageAccountedAt: Date
}, timestampOptions);

addMonetaryTotals(invoiceSchema);
invoiceSchema.path('dueDate').validate(function validateDueDate(value) {
  return !this.issueDate || value >= this.issueDate;
}, 'dueDate must be on or after issueDate');
invoiceSchema.pre('validate', function validateBalance(next) {
  if (this.paidAmountMinor + this.balanceDueMinor !== this.totalMinor) {
    this.invalidate('balanceDueMinor', 'paidAmountMinor plus balanceDueMinor must equal totalMinor');
  }
  next();
});
invoiceSchema.index({ subscriptionId: 1, billingPeriodKey: 1 }, { unique: true });
invoiceSchema.index({ customerId: 1, status: 1, dueDate: 1 });
invoiceSchema.index({ subscriptionId: 1, status: 1 });
export const Invoice = mongoose.model('Invoice', invoiceSchema);
