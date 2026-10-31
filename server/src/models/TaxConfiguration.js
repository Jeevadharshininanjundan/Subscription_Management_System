import mongoose from 'mongoose';
import { nonNegativeInteger, normalizeName, validateDateOrder } from '../utils/validation.js';
import { timestampOptions } from './common.js';

const taxConfigurationSchema = new mongoose.Schema({
  name: { type: String, required: true, set: normalizeName, trim: true },
  rateBasisPoints: { ...nonNegativeInteger, required: true },
  currencyScope: { type: String, uppercase: true, match: /^[A-Z]{3}$/ },
  jurisdiction: { type: String, trim: true },
  productTypeFilters: [{ type: String, trim: true }],
  startsAt: { type: Date, required: true },
  endsAt: { type: Date, validate: validateDateOrder('startsAt', 'endsAt') },
  status: { type: String, required: true, enum: ['ACTIVE', 'ARCHIVED'], default: 'ACTIVE' }
}, timestampOptions);

taxConfigurationSchema.index({ status: 1, startsAt: 1, endsAt: 1 });
export const TaxConfiguration = mongoose.model('TaxConfiguration', taxConfigurationSchema);
