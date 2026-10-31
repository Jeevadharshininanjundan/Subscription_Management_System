import { z } from 'zod';

const id = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid identifier');
const currency = z.string().regex(/^[A-Z]{3}$/, 'Currency must be a three-letter code');
const minor = z.number().int().nonnegative();
const line = z.object({
  productId: id.optional(), variantId: id.optional(), planId: id.optional(),
  name: z.string().trim().min(1), quantity: z.number().int().positive(),
  unitPriceMinor: minor, currency, taxConfigurationId: id.optional()
});

export const productSchema = z.object({
  name: z.string().trim().min(1).max(160), type: z.string().trim().min(1).max(80),
  salesPriceMinor: minor, costPriceMinor: minor, currency, notes: z.string().trim().max(2000).optional()
});
export const planSchema = z.object({
  name: z.string().trim().min(1).max(160),
  billingInterval: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY']),
  basePriceMinor: minor, currency, minimumQuantity: z.number().int().positive(),
  availableFrom: z.coerce.date(), availableUntil: z.coerce.date().optional(),
  trialDays: z.number().int().nonnegative().optional(), description: z.string().trim().max(2000).optional(),
  autoClose: z.boolean().optional(), allowEarlyClose: z.boolean().optional(),
  allowPause: z.boolean().optional(), allowRenewal: z.boolean().optional()
});
export const customerSchema = z.object({
  name: z.string().trim().min(1).max(160), primaryEmail: z.string().trim().toLowerCase().email(),
  phone: z.string().trim().max(40).optional()
});
export const quotationSchema = z.object({
  customerId: id, status: z.enum(['DRAFT', 'SENT']).default('DRAFT'),
  validUntil: z.coerce.date(), issuedAt: z.coerce.date().optional(),
  lines: z.array(line).min(1), currency: currency.optional(),
  discountId: id.optional(), notes: z.string().trim().max(2000).optional()
});
export const paymentSchema = z.object({
  amountMinor: z.number().int().positive(), currency: currency.optional(),
  method: z.enum(['BANK_TRANSFER', 'CARD', 'CASH', 'OTHER']),
  paymentDate: z.coerce.date(), note: z.string().trim().max(2000).optional(),
  externalReference: z.string().trim().max(160).optional()
});
export const cancelInvoiceSchema = z.object({ reason: z.string().trim().min(1).max(500) });
