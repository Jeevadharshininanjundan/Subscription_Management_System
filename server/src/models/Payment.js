import mongoose from 'mongoose';
import { nonNegativeInteger } from '../utils/validation.js';
import { timestampOptions } from './common.js';

const paymentSchema = new mongoose.Schema({
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  amountMinor: { ...nonNegativeInteger, required: true, min: 1 },
  currency: { type: String, required: true, uppercase: true, match: /^[A-Z]{3}$/ },
  method: { type: String, required: true, enum: ['BANK_TRANSFER', 'CARD', 'CASH', 'OTHER'] },
  paymentDate: { type: Date, required: true },
  status: { type: String, required: true, enum: ['RECORDED', 'VOIDED'], default: 'RECORDED' },
  note: { type: String, trim: true },
  externalReference: { type: String, trim: true },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, timestampOptions);

paymentSchema.index({ invoiceId: 1, paymentDate: 1, status: 1 });
paymentSchema.index({ customerId: 1, paymentDate: 1 });
paymentSchema.index({ invoiceId: 1, externalReference: 1 }, { unique: true, sparse: true });
export const Payment = mongoose.model('Payment', paymentSchema);
