import mongoose from 'mongoose';
import { normalizeName, positiveInteger } from '../utils/validation.js';
import { snapshotLineSchema, timestampOptions } from './common.js';

const quotationTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true, set: normalizeName, trim: true },
  validityDays: { ...positiveInteger, required: true },
  status: { type: String, required: true, enum: ['ACTIVE', 'ARCHIVED'], default: 'ACTIVE' },
  lines: { type: [snapshotLineSchema], required: true, validate: value => value.length > 0 }
}, timestampOptions);

quotationTemplateSchema.index({ status: 1, name: 1 });
export const QuotationTemplate = mongoose.model('QuotationTemplate', quotationTemplateSchema);
