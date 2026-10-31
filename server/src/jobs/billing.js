import { runBilling } from '../services/core.js';

export async function executeBillingJob(now = new Date()) {
  return runBilling(now);
}
