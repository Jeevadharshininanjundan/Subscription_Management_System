import { z } from 'zod';

export const currencySchema = z.string().regex(/^[A-Z]{3}$/, 'Currency must be a three-letter ISO 4217 code');
export const amountMinorSchema = z.number().int().nonnegative('Amount must be non-negative');

export function assertAmountMinor(value, field = 'amountMinor') {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${field} must be a non-negative safe integer`);
  }
  return value;
}

export function assertPositiveAmountMinor(value, field = 'amountMinor') {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new RangeError(`${field} must be a positive safe integer`);
  }
  return value;
}

export function formatMoneyMinor(amountMinor, currency) {
  assertAmountMinor(amountMinor);
  if (!currencySchema.safeParse(currency).success) {
    throw new RangeError('currency must be a three-letter ISO 4217 code');
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amountMinor / 100);
}
