import mongoose from 'mongoose';
import { nonNegativeInteger, normalizeName } from '../utils/validation.js';
import { timestampOptions } from './common.js';

const productVariantSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true, set: normalizeName, trim: true },
  priceAdjustmentMinor: { ...nonNegativeInteger, required: true, default: 0 },
  currency: { type: String, required: true, uppercase: true, match: /^[A-Z]{3}$/ },
  status: { type: String, required: true, enum: ['ACTIVE', 'ARCHIVED'], default: 'ACTIVE' }
}, timestampOptions);

productVariantSchema.index({ productId: 1, name: 1 }, { unique: true });
productVariantSchema.index({ productId: 1, status: 1 });
export const ProductVariant = mongoose.model('ProductVariant', productVariantSchema);
