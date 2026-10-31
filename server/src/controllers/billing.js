import { executeBillingJob } from '../jobs/billing.js';

export async function run(request, response, next) {
  try {
    const invoices = await executeBillingJob();
    response.status(200).json({
      data: { invoices, count: invoices.length },
      meta: { requestId: request.requestId },
      error: null
    });
  } catch (error) {
    next(error);
  }
}
