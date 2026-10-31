import mongoose from 'mongoose';

export const nonNegativeInteger = {
  type: Number,
  min: 0,
  validate: {
    validator: Number.isSafeInteger,
    message: '{PATH} must be a safe integer'
  }
};

export const positiveInteger = {
  type: Number,
  min: 1,
  validate: {
    validator: Number.isSafeInteger,
    message: '{PATH} must be a positive safe integer'
  }
};

export const amountFields = {
  amountMinor: nonNegativeInteger,
  currency: {
    type: String,
    required: true,
    uppercase: true,
    match: /^[A-Z]{3}$/
  }
};

export function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

export function normalizeName(value) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value;
}

export function objectIdRef(required = true) {
  return {
    type: mongoose.Schema.Types.ObjectId,
    ref: undefined,
    required
  };
}

export function validateDateOrder(startPath, endPath) {
  return {
    validator() {
      const start = this[startPath];
      const end = this[endPath];
      return !start || !end || end >= start;
    },
    message: `${endPath} must be on or after ${startPath}`
  };
}
