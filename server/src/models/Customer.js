import mongoose from 'mongoose';
import { normalizeEmail, normalizeName } from '../utils/validation.js';
import { addressSchema, timestampOptions } from './common.js';

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true, set: normalizeName, trim: true },
  primaryEmail: { type: String, required: true, lowercase: true, trim: true, set: normalizeEmail },
  status: { type: String, required: true, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  phone: { type: String, trim: true },
  billingAddress: addressSchema,
  taxIdentifier: { type: String, trim: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, sparse: true }
}, timestampOptions);

customerSchema.index({ primaryEmail: 1 }, { unique: true });
customerSchema.index({ name: 1, status: 1 });
export const Customer = mongoose.model('Customer', customerSchema);
