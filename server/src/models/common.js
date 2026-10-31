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
  taxConfigurationId: { type: mongoose.Schema.Types.ObjectId, ref: 'TaxConfiguration' },
  taxConfigurationName: { type: String, trim: true },
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

export const calculationSnapshotSchema = new mongoose.Schema({
  calculatedAt: { type: Date, required: true },
  taxConfigurations: [{
    taxConfigurationId: { type: mongoose.Schema.Types.ObjectId, ref: 'TaxConfiguration' },
    name: String,
    rateBasisPoints: { ...nonNegativeInteger, required: true },
    currencyScope: String,
    jurisdiction: String
  }],
  discount: {
    discountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Discount' },
    name: String,
    kind: { type: String, enum: ['FIXED', 'PERCENTAGE'] },
    value: Number,
    eligibleSubtotalMinor: { ...nonNegativeInteger, default: 0 },
    amountMinor: { ...nonNegativeInteger, default: 0 }
  }
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

export function calculateLineTotals(line) {
  const subtotalMinor = line.quantity * line.unitPriceMinor;
  const taxAmountMinor = Math.floor((subtotalMinor * line.taxRateBasisPoints) / 10000);
  return {
    ...line,
    subtotalMinor,
    taxAmountMinor,
    discountAmountMinor: line.discountAmountMinor || 0,
    totalMinor: subtotalMinor + taxAmountMinor - (line.discountAmountMinor || 0)
  };
}
