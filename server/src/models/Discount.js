import mongoose from 'mongoose';
import { nonNegativeInteger, normalizeName, positiveInteger, validateDateOrder } from '../utils/validation.js';
import { timestampOptions } from './common.js';

const discountSchema = new mongoose.Schema({
  name: { type: String, required: true, set: normalizeName, trim: true },
  kind: { type: String, required: true, enum: ['FIXED', 'PERCENTAGE'] },
  value: { type: Number, required: true, min: 0 },
  currency: { type: String, uppercase: true, match: /^[A-Z]{3}$/ },
  scope: { type: String, required: true, enum: ['PRODUCT', 'SUBSCRIPTION'] },
  eligibleProductIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  minimumPurchaseMinor: { ...nonNegativeInteger, default: 0 },
  minimumQuantity: { ...positiveInteger },
  startsAt: { type: Date, required: true },
  endsAt: { type: Date, validate: validateDateOrder('startsAt', 'endsAt') },
  usageLimit: { ...positiveInteger },
  usageCount: { ...nonNegativeInteger, default: 0 },
  status: { type: String, required: true, enum: ['ACTIVE', 'ARCHIVED'], default: 'ACTIVE' }
}, timestampOptions);

discountSchema.path('value').validate(function validateValue(value) {
  if (this.kind === 'PERCENTAGE') return value <= 100;
  return Number.isSafeInteger(value);
}, 'Discount value is invalid for its kind');
discountSchema.path('currency').validate(function validateCurrency(value) {
  return this.kind !== 'FIXED' || Boolean(value);
}, 'Fixed discounts require a currency');
discountSchema.path('usageCount').validate(function validateUsageCount(value) {
  return this.usageLimit === undefined || value <= this.usageLimit;
}, 'usageCount cannot exceed usageLimit');
discountSchema.index({ status: 1, startsAt: 1, endsAt: 1 });
export const Discount = mongoose.model('Discount', discountSchema);
