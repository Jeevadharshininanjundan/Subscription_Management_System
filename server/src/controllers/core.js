import { Customer, Discount, Invoice, Product, Quotation, Subscription, SubscriptionPlan, TaxConfiguration } from '../models/index.js';
import * as core from '../services/core.js';

const ok = (res, req, data, status = 200) => res.status(status).json({ data, meta: { requestId: req.requestId }, error: null });
const id = req => req.params.id;
const fail = (message, code = 'NOT_FOUND', status = 404) => Object.assign(new Error(message), { code, status });
const forbidden = message => Object.assign(new Error(message), { code: 'FORBIDDEN', status: 403 });
function customerFilter(req) {
  return req.user.role === 'CUSTOMER' ? { customerId: req.user.customerId } : {};
}
async function list(Model, req, res) {
  if (req.user.role === 'CUSTOMER' && Model === Customer) {
    return ok(res, req, await Model.find({ _id: req.user.customerId }).sort({ createdAt: -1 }));
  }
  return ok(res, req, await Model.find(customerFilter(req)).sort({ createdAt: -1 }));
}
async function get(Model, req, res) {
  const record = await Model.findById(Model === Customer && req.user.role === 'CUSTOMER'
    ? req.user.customerId
    : id(req));
  if (!record) throw fail('Resource not found.');
  if (req.user.role === 'CUSTOMER') {
    const ownerId = Model === Customer ? record._id : record.customerId;
    if (ownerId?.toString() !== req.user.customerId?.toString()) {
      throw forbidden('You do not have access to this customer resource.');
    }
  }
  return ok(res, req, record);
}
async function mutate(action, req, res, status = 200) {
  const record = await action();
  if (!record) throw fail('Resource not found.');
  return ok(res, req, record, status);
}

export const products = {
  list: (req, res, next) => list(Product, req, res).catch(next),
  get: (req, res, next) => get(Product, req, res).catch(next),
  create: (req, res, next) => mutate(() => core.productCreate(req.body), req, res, 201).catch(next),
  update: (req, res, next) => mutate(() => core.productUpdate(id(req), req.body), req, res).catch(next),
  remove: (req, res, next) => mutate(() => core.productArchive(id(req)), req, res).catch(next),
  variants: (req, res, next) => mutate(() => core.variantCreate(id(req), req.body), req, res, 201).catch(next),
  variantsList: (req, res, next) => core.variantList(id(req)).then(data => ok(res, req, data)).catch(next)
};
export const variants = {
  update: (req, res, next) => mutate(() => core.variantUpdate(id(req), req.body), req, res).catch(next),
  remove: (req, res, next) => mutate(() => core.variantArchive(id(req)), req, res).catch(next)
};
export const plans = {
  list: (req, res, next) => list(SubscriptionPlan, req, res).catch(next),
  get: (req, res, next) => get(SubscriptionPlan, req, res).catch(next),
  create: (req, res, next) => mutate(() => core.planCreate(req.body), req, res, 201).catch(next),
  update: (req, res, next) => mutate(() => core.planUpdate(id(req), req.body), req, res).catch(next),
  remove: (req, res, next) => mutate(() => core.planArchive(id(req)), req, res).catch(next)
};
export const customers = {
  list: (req, res, next) => list(Customer, req, res).catch(next),
  get: (req, res, next) => get(Customer, req, res).catch(next),
  create: (req, res, next) => mutate(() => core.customerCreate(req.body), req, res, 201).catch(next),
  update: (req, res, next) => mutate(() => core.customerUpdate(id(req), req.body), req, res).catch(next),
  remove: (req, res, next) => mutate(() => core.customerArchive(id(req)), req, res).catch(next)
};
export const configuration = {
  taxes: {
    list: (req, res, next) => list(TaxConfiguration, req, res).catch(next),
    create: (req, res, next) => mutate(() => core.taxCreate(req.body), req, res, 201).catch(next),
    update: (req, res, next) => mutate(() => core.taxUpdate(id(req), req.body), req, res).catch(next)
  },
  discounts: {
    list: (req, res, next) => list(Discount, req, res).catch(next),
    create: (req, res, next) => mutate(() => core.discountCreate(req.body), req, res, 201).catch(next),
    update: (req, res, next) => mutate(() => core.discountUpdate(id(req), req.body), req, res).catch(next)
  }
};
export const quotations = {
  list: (req, res, next) => list(Quotation, req, res).catch(next),
  get: (req, res, next) => get(Quotation, req, res).catch(next),
  create: (req, res, next) => mutate(() => core.quotationCreate(req.body), req, res, 201).catch(next),
  accept: (req, res, next) => mutate(() => Quotation.findOneAndUpdate({ _id: id(req), status: 'SENT' }, { status: 'ACCEPTED' }, { new: true }), req, res).catch(next),
  convert: (req, res, next) => mutate(() => core.quotationConvert(id(req)), req, res).catch(next)
};
export const subscriptions = {
  list: (req, res, next) => list(Subscription, req, res).catch(next),
  get: (req, res, next) => get(Subscription, req, res).catch(next),
  create: (req, res, next) => mutate(() => core.subscriptionCreate(req.body), req, res, 201).catch(next),
  transition: (target) => (req, res, next) => mutate(() => core.transitionSubscription(id(req), target), req, res).catch(next)
};
export const invoices = {
  list: (req, res, next) => list(Invoice, req, res).catch(next),
  get: (req, res, next) => get(Invoice, req, res).catch(next),
  pay: (req, res, next) => mutate(() => core.recordPayment(id(req), req.body, req.user._id), req, res, 201).catch(next),
  payments: async (req, res, next) => {
    try {
      const invoice = await Invoice.findById(id(req));
      if (!invoice) throw fail('Resource not found.');
      if (req.user.role === 'CUSTOMER'
        && invoice.customerId.toString() !== req.user.customerId?.toString()) {
        throw forbidden('You do not have access to this customer resource.');
      }
      return ok(res, req, await core.paymentList(id(req)));
    } catch (error) {
      return next(error);
    }
  },
  confirm: (req, res, next) => mutate(() => core.confirmInvoice(id(req)), req, res).catch(next),
  cancel: (req, res, next) => mutate(() => core.cancelInvoice(id(req), req.body.reason), req, res).catch(next)
};
