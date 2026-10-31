import mongoose from 'mongoose';
import { nonNegativeInteger, normalizeName } from '../utils/validation.js';
import { timestampOptions } from './common.js';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, set: normalizeName, trim: true },
  type: { type: String, required: true, trim: true },
  salesPriceMinor: { ...nonNegativeInteger, required: true },
  costPriceMinor: { ...nonNegativeInteger, required: true },
  currency: { type: String, required: true, uppercase: true, match: /^[A-Z]{3}$/ },
  notes: { type: String, trim: true },
  status: { type: String, required: true, enum: ['ACTIVE', 'ARCHIVED'], default: 'ACTIVE' },
  archivedAt: Date
}, timestampOptions);

productSchema.index({ status: 1, type: 1, name: 1 });
export const Product = mongoose.model('Product', productSchema);
