import mongoose from 'mongoose';
import { timestampOptions } from './common.js';

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['QUOTATION_SENT', 'INVOICE_SENT', 'PAYMENT_RECEIPT', 'OVERDUE_REMINDER', 'RENEWAL_REMINDER']
  },
  notificationKey: { type: String, required: true, unique: true, trim: true },
  reference: { type: String, required: true, trim: true },
  recipient: { type: String, required: true, lowercase: true, trim: true },
  status: { type: String, required: true, enum: ['PENDING', 'SENT', 'FAILED'], default: 'PENDING' },
  attempts: { type: Number, required: true, default: 0, min: 0 },
  attemptedAt: Date,
  sentAt: Date,
  nextRetryAt: Date,
  errorCode: { type: String, trim: true },
  errorMessage: { type: String, trim: true, maxlength: 500 }
}, timestampOptions);

notificationSchema.index({ status: 1, nextRetryAt: 1 });
notificationSchema.index({ type: 1, reference: 1 });

export const Notification = mongoose.model('Notification', notificationSchema);
