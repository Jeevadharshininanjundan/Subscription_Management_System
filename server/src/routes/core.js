import { Router } from 'express';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { products, variants, plans, customers, configuration, quotations, subscriptions, invoices } from '../controllers/core.js';
import { run as runBilling } from '../controllers/billing.js';
import { validateBody } from '../middleware/validate.js';
import { cancelInvoiceSchema, customerSchema, paymentSchema, planSchema, productSchema, quotationSchema } from '../validators/core.js';

export const coreRouter = Router();
coreRouter.use(requireAuth);
const staff = requireRoles('ADMIN', 'STAFF');
const admin = requireRoles('ADMIN');

coreRouter.get('/products', staff, products.list);
coreRouter.post('/products', staff, validateBody(productSchema), products.create);
coreRouter.get('/products/:id', staff, products.get);
coreRouter.patch('/products/:id', staff, products.update);
coreRouter.delete('/products/:id', staff, products.remove);
coreRouter.post('/products/:id/variants', staff, products.variants);
coreRouter.get('/products/:id/variants', staff, products.variantsList);
coreRouter.patch('/variants/:id', staff, variants.update);
coreRouter.delete('/variants/:id', staff, variants.remove);

coreRouter.get('/plans', staff, plans.list);
coreRouter.post('/plans', staff, validateBody(planSchema), plans.create);
coreRouter.get('/plans/:id', staff, plans.get);
coreRouter.patch('/plans/:id', staff, plans.update);
coreRouter.delete('/plans/:id', staff, plans.remove);

coreRouter.get('/customers', customers.list);
coreRouter.post('/customers', staff, validateBody(customerSchema), customers.create);
coreRouter.get('/customers/:id', customers.get);
coreRouter.patch('/customers/:id', staff, customers.update);
coreRouter.delete('/customers/:id', staff, customers.remove);

coreRouter.get('/taxes', configuration.taxes.list);
coreRouter.post('/taxes', admin, configuration.taxes.create);
coreRouter.patch('/taxes/:id', admin, configuration.taxes.update);
coreRouter.get('/discounts', configuration.discounts.list);
coreRouter.post('/discounts', staff, configuration.discounts.create);
coreRouter.patch('/discounts/:id', staff, configuration.discounts.update);

coreRouter.get('/quotations', quotations.list);
coreRouter.post('/quotations', staff, validateBody(quotationSchema), quotations.create);
coreRouter.get('/quotations/:id', quotations.get);
coreRouter.post('/quotations/:id/accept', quotations.accept);
coreRouter.post('/quotations/:id/convert', staff, quotations.convert);

coreRouter.get('/subscriptions', subscriptions.list);
coreRouter.post('/subscriptions', staff, subscriptions.create);
coreRouter.get('/subscriptions/:id', subscriptions.get);
for (const [path, target] of [['activate', 'ACTIVE'], ['pause', 'PAUSED'], ['resume', 'ACTIVE'], ['cancel', 'CANCELLED'], ['close', 'CLOSED']]) {
  coreRouter.post(`/subscriptions/:id/${path}`, staff, subscriptions.transition(target));
}
coreRouter.route('/invoices').get(invoices.list);
coreRouter.get('/invoices/:id', invoices.get);
coreRouter.get('/invoices/:id/payments', invoices.payments);
coreRouter.post('/invoices/:id/payments', staff, validateBody(paymentSchema), invoices.pay);
coreRouter.post('/invoices/:id/confirm', staff, invoices.confirm);
coreRouter.post('/invoices/:id/cancel', staff, validateBody(cancelInvoiceSchema), invoices.cancel);
coreRouter.post('/billing/run', staff, runBilling);
