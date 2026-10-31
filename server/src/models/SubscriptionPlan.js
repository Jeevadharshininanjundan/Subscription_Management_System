import mongoose from 'mongoose';
import { nonNegativeInteger, normalizeName, positiveInteger, validateDateOrder } from '../utils/validation.js';
import { timestampOptions } from './common.js';

const subscriptionPlanSchema = new mongoose.Schema({
  name: { type: String, required: true, set: normalizeName, trim: true },
  billingInterval: { type: String, required: true, enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY'] },
  basePriceMinor: { ...nonNegativeInteger, required: true },
  currency: { type: String, required: true, uppercase: true, match: /^[A-Z]{3}$/ },
  minimumQuantity: { ...positiveInteger, required: true },
  trialDays: { ...nonNegativeInteger, default: 0 },
  availableFrom: { type: Date, required: true },
  availableUntil: { type: Date, validate: validateDateOrder('availableFrom', 'availableUntil') },
  status: { type: String, required: true, enum: ['ACTIVE', 'ARCHIVED'], default: 'ACTIVE' },
  autoClose: { type: Boolean, default: false },
  allowEarlyClose: { type: Boolean, default: false },
  allowPause: { type: Boolean, default: false },
  allowRenewal: { type: Boolean, default: false },
  description: { type: String, trim: true }
}, timestampOptions);

subscriptionPlanSchema.index({ status: 1, availableFrom: 1, availableUntil: 1 });
subscriptionPlanSchema.index({ name: 1, status: 1 });
export const SubscriptionPlan = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
