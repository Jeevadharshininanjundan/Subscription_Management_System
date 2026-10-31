import { Router } from 'express';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { products, variants, plans, customers, configuration, quotations, subscriptions, invoices } from '../controllers/core.js';
import { run as runBilling } from '../controllers/billing.js';

export const coreRouter = Router();
coreRouter.use(requireAuth);
const staff = requireRoles('ADMIN', 'STAFF');
const admin = requireRoles('ADMIN');

coreRouter.get('/products', products.list);
coreRouter.post('/products', staff, products.create);
coreRouter.get('/products/:id', products.get);
coreRouter.patch('/products/:id', staff, products.update);
coreRouter.delete('/products/:id', staff, products.remove);
coreRouter.post('/products/:id/variants', staff, products.variants);
coreRouter.patch('/variants/:id', staff, variants.update);
coreRouter.delete('/variants/:id', staff, variants.remove);

coreRouter.get('/plans', plans.list);
coreRouter.post('/plans', staff, plans.create);
coreRouter.get('/plans/:id', plans.get);
coreRouter.patch('/plans/:id', staff, plans.update);
coreRouter.delete('/plans/:id', staff, plans.remove);

coreRouter.get('/customers', customers.list);
coreRouter.post('/customers', staff, customers.create);
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
coreRouter.post('/quotations', staff, quotations.create);
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
coreRouter.post('/invoices/:id/payments', staff, invoices.pay);
coreRouter.post('/billing/run', staff, runBilling);
