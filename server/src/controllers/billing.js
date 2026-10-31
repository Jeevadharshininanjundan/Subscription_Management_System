import { executeBillingJob } from '../jobs/billing.js';

export async function run(request, response, next) {
  try {
    const result = await executeBillingJob();
    response.status(200).json({
      data: { ...result, count: result.invoices.length },
      meta: { requestId: request.requestId },
      error: null
    });
  } catch (error) {
    next(error);
  }
}
