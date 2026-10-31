import mongoose from 'mongoose';
import { addMonetaryTotals, calculationSnapshotSchema, snapshotLineSchema, timestampOptions } from './common.js';

const quotationSchema = new mongoose.Schema({
  quotationNumber: { type: String, required: true, unique: true, trim: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'QuotationTemplate' },
  status: { type: String, required: true, enum: ['DRAFT', 'SENT', 'ACCEPTED', 'EXPIRED', 'CONVERTED', 'CANCELLED'], default: 'DRAFT' },
  issuedAt: { type: Date, required: true },
  validUntil: { type: Date, required: true },
  lines: { type: [snapshotLineSchema], required: true, validate: value => value.length > 0 },
  notes: { type: String, trim: true },
  calculationSnapshot: calculationSnapshotSchema,
  discountUsageAccountedAt: Date,
  convertedSubscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription', unique: true, sparse: true }
}, timestampOptions);

addMonetaryTotals(quotationSchema);
quotationSchema.path('validUntil').validate(function validateValidity(value) {
  return !this.issuedAt || value >= this.issuedAt;
}, 'validUntil must be on or after issuedAt');
quotationSchema.index({ customerId: 1, status: 1, validUntil: 1 });
export const Quotation = mongoose.model('Quotation', quotationSchema);
