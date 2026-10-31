import mongoose from 'mongoose';
import { nonNegativeInteger, normalizeName, positiveInteger } from '../utils/validation.js';

export const timestampOptions = {
  timestamps: true,
  strict: true
};

export const snapshotLineSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  variantId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant' },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan' },
  name: { type: String, required: true, set: normalizeName, trim: true },
  quantity: { ...positiveInteger, required: true },
  unitPriceMinor: { ...nonNegativeInteger, required: true },
  currency: { type: String, required: true, uppercase: true, match: /^[A-Z]{3}$/ },
  taxRateBasisPoints: { ...nonNegativeInteger, required: true, default: 0 },
  taxAmountMinor: { ...nonNegativeInteger, required: true, default: 0 },
  discountAmountMinor: { ...nonNegativeInteger, required: true, default: 0 },
  subtotalMinor: { ...nonNegativeInteger, required: true },
  totalMinor: { ...nonNegativeInteger, required: true }
}, { _id: false });

export const addressSchema = new mongoose.Schema({
  line1: { type: String, trim: true },
  line2: { type: String, trim: true },
  city: { type: String, trim: true },
  region: { type: String, trim: true },
  postalCode: { type: String, trim: true },
  country: { type: String, uppercase: true, match: /^[A-Z]{2}$/ }
}, { _id: false });

export function addMonetaryTotals(schema) {
  schema.add({
    currency: { type: String, required: true, uppercase: true, match: /^[A-Z]{3}$/ },
    subtotalMinor: { ...nonNegativeInteger, required: true, default: 0 },
    taxMinor: { ...nonNegativeInteger, required: true, default: 0 },
    discountMinor: { ...nonNegativeInteger, required: true, default: 0 },
    totalMinor: { ...nonNegativeInteger, required: true, default: 0 }
  });
}
