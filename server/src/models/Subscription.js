import mongoose from 'mongoose';
import { validateDateOrder } from '../utils/validation.js';
import { addMonetaryTotals, snapshotLineSchema, timestampOptions } from './common.js';

const subscriptionSchema = new mongoose.Schema({
  subscriptionNumber: { type: String, required: true, unique: true, trim: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: true },
  quotationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation', unique: true, sparse: true },
  status: { type: String, required: true, enum: ['DRAFT', 'QUOTATION', 'CONFIRMED', 'ACTIVE', 'CLOSED'], default: 'DRAFT' },
  startDate: { type: Date, required: true },
  expiryDate: { type: Date, validate: validateDateOrder('startDate', 'expiryDate') },
  nextBillingDate: { type: Date, required: true },
  paymentTerms: { type: String, required: true, trim: true },
  lines: { type: [snapshotLineSchema], required: true, validate: value => value.length > 0 },
  closedAt: Date,
  pausedAt: Date,
  lastBilledPeriodKey: { type: String, trim: true }
}, timestampOptions);

addMonetaryTotals(subscriptionSchema);
subscriptionSchema.index({ customerId: 1, status: 1 });
subscriptionSchema.index({ status: 1, nextBillingDate: 1 });
subscriptionSchema.index({ planId: 1, status: 1 });
export const Subscription = mongoose.model('Subscription', subscriptionSchema);
