import mongoose from 'mongoose';
import { normalizeEmail, normalizeName } from '../utils/validation.js';
import { timestampOptions } from './common.js';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, set: normalizeEmail },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, required: true, enum: ['ADMIN', 'STAFF', 'CUSTOMER'] },
  status: { type: String, required: true, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  name: { type: String, required: true, set: normalizeName, trim: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  lastLoginAt: Date,
  tokenVersion: { type: Number, required: true, default: 0 },
  resetTokenHash: { type: String, select: false },
  resetTokenExpiresAt: { type: Date, select: false }
}, timestampOptions);

userSchema.index({ role: 1, status: 1 });
export const User = mongoose.model('User', userSchema);
