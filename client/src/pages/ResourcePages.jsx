import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { api, getApiErrorMessage } from '../services/api.js';
import { EmptyState, ErrorState, LoadingState, StatusPill } from '../components/ResourceState.jsx';

const money = (minor, currency = 'USD') => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format((minor || 0) / 100);
const empty = { name: '', type: '', salesPriceMinor: 0, costPriceMinor: 0, currency: 'USD', notes: '' };

function useResource(path) {
  const [state, setState] = useState({ loading: true, error: '', items: [] });
  const load = useCallback(async () => {
    setState(current => ({ ...current, loading: true, error: '' }));
    try { const response = await api.get(path); setState({ loading: false, error: '', items: response.data.data || [] }); }
    catch (error) { setState({ loading: false, error: getApiErrorMessage(error), items: [] }); }
  }, [path]);
  useEffect(() => { if (path) load(); }, [load, path]);
  return { ...state, load };
}

export function ProductsPage() {
  const resource = useResource('/products');
  const [form, setForm] = useState(empty);
  const [message, setMessage] = useState('');
  const submit = async event => { event.preventDefault(); setMessage(''); try { await api.post('/products', { ...form, salesPriceMinor: Number(form.salesPriceMinor), costPriceMinor: Number(form.costPriceMinor) }); setForm(empty); setMessage('Product created.'); resource.load(); } catch (error) { setMessage(getApiErrorMessage(error)); } };
  const archive = async item => { try { await api.delete(`/products/${item._id}`); resource.load(); } catch (error) { setMessage(getApiErrorMessage(error)); } };
  const update = async item => { const name = window.prompt('Product name', item.name); if (!name || name === item.name) return; try { await api.patch(`/products/${item._id}`, { name }); resource.load(); } catch (error) { setMessage(getApiErrorMessage(error)); } };
  return <ResourcePage title="Products" description="Manage the catalog used in quotations and subscriptions." loading={resource.loading} error={resource.error} retry={resource.load} items={resource.items} columns={['name', 'type', 'salesPriceMinor', 'status']} format={{ salesPriceMinor: item => money(item.salesPriceMinor, item.currency) }} actions={item => <><button className="table-action" onClick={() => update(item)}>Edit</button>{item.status === 'ACTIVE' && <button className="table-action danger-action" onClick={() => archive(item)}>Archive</button>}<a className="table-action link-action" href={`/products/${item._id}`}>Details</a></>}><FormCard title="Add product" onSubmit={submit} message={message}><Field label="Name" value={form.name} onChange={value => setForm({ ...form, name: value })} required /><Field label="Type" value={form.type} onChange={value => setForm({ ...form, type: value })} required /><Field label="Sales price (minor units)" type="number" value={form.salesPriceMinor} onChange={value => setForm({ ...form, salesPriceMinor: value })} required /><Field label="Cost price (minor units)" type="number" value={form.costPriceMinor} onChange={value => setForm({ ...form, costPriceMinor: value })} /><button type="submit">Create product</button></FormCard></ResourcePage>;
}

const planEmpty = { name: '', billingInterval: 'MONTHLY', basePriceMinor: 0, currency: 'USD', minimumQuantity: 1, availableFrom: new Date().toISOString().slice(0, 10), description: '' };
export function PlansPage() {
  const resource = useResource('/plans'); const [form, setForm] = useState(planEmpty); const [message, setMessage] = useState('');
  const submit = async event => { event.preventDefault(); try { await api.post('/plans', { ...form, basePriceMinor: Number(form.basePriceMinor), minimumQuantity: Number(form.minimumQuantity), availableFrom: new Date(form.availableFrom).toISOString() }); setMessage('Plan created.'); setForm(planEmpty); resource.load(); } catch (error) { setMessage(getApiErrorMessage(error)); } };
  return <ResourcePage title="Subscription plans" description="Configure billing intervals, availability and pricing." loading={resource.loading} error={resource.error} retry={resource.load} items={resource.items} columns={['name', 'billingInterval', 'basePriceMinor', 'status']} format={{ basePriceMinor: item => money(item.basePriceMinor, item.currency) }}><FormCard title="Create plan" onSubmit={submit} message={message}><Field label="Name" value={form.name} onChange={value => setForm({ ...form, name: value })} required /><label>Billing interval<select value={form.billingInterval} onChange={event => setForm({ ...form, billingInterval: event.target.value })}>{['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY'].map(value => <option key={value}>{value}</option>)}</select></label><Field label="Base price (minor units)" type="number" value={form.basePriceMinor} onChange={value => setForm({ ...form, basePriceMinor: value })} required /><Field label="Minimum quantity" type="number" value={form.minimumQuantity} onChange={value => setForm({ ...form, minimumQuantity: value })} required /><button type="submit">Create plan</button></FormCard></ResourcePage>;
}

const customerEmpty = { name: '', primaryEmail: '', phone: '' };
export function CustomersPage() {
  const resource = useResource('/customers'); const [form, setForm] = useState(customerEmpty); const [message, setMessage] = useState('');
  const submit = async event => { event.preventDefault(); try { await api.post('/customers', form); setMessage('Customer created.'); setForm(customerEmpty); resource.load(); } catch (error) { setMessage(getApiErrorMessage(error)); } };
  return <ResourcePage title="Customers" description="Maintain customer accounts and operational contacts." loading={resource.loading} error={resource.error} retry={resource.load} items={resource.items} columns={['name', 'primaryEmail', 'phone', 'status']} actions={item => <a className="table-action link-action" href={`/customers/${item._id}`}>Details</a>}><FormCard title="Add customer" onSubmit={submit} message={message}><Field label="Name" value={form.name} onChange={value => setForm({ ...form, name: value })} required /><Field label="Email" type="email" value={form.primaryEmail} onChange={value => setForm({ ...form, primaryEmail: value })} required /><Field label="Phone" value={form.phone} onChange={value => setForm({ ...form, phone: value })} /><button type="submit">Create customer</button></FormCard></ResourcePage>;
}

export function QuotationCreatePage() {
  const [customers, setCustomers] = useState([]); const [plans, setPlans] = useState([]); const [form, setForm] = useState({ customerId: '', planId: '', quantity: 1, validUntil: '' }); const [message, setMessage] = useState('');
  useEffect(() => { Promise.all([api.get('/customers'), api.get('/plans')]).then(([customerResponse, planResponse]) => { setCustomers(customerResponse.data.data || []); setPlans(planResponse.data.data || []); }).catch(error => setMessage(getApiErrorMessage(error))); }, []);
  const plan = plans.find(item => item._id === form.planId);
  const submit = async event => { event.preventDefault(); if (!plan) return; try { await api.post('/quotations', { customerId: form.customerId, status: 'SENT', validUntil: new Date(form.validUntil).toISOString(), lines: [{ planId: plan._id, name: plan.name, quantity: Number(form.quantity), unitPriceMinor: plan.basePriceMinor, currency: plan.currency, taxRateBasisPoints: 0, taxAmountMinor: 0, discountAmountMinor: 0, subtotalMinor: 0, totalMinor: 0 }] }); setMessage('Quotation created and sent.'); } catch (error) { setMessage(getApiErrorMessage(error)); } };
  return <section><div className="page-heading"><div><p className="eyebrow">Sales</p><h2>Create quotation</h2><p className="muted">The backend calculates all quotation totals.</p></div><Link className="status-link" to="/quotations">Back to quotations</Link></div><div className="form-panel"><FormCard title="Quotation details" onSubmit={submit} message={message}><label>Customer<select required value={form.customerId} onChange={event => setForm({ ...form, customerId: event.target.value })}><option value="">Select customer</option>{customers.map(item => <option key={item._id} value={item._id}>{item.name}</option>)}</select></label><label>Plan<select required value={form.planId} onChange={event => setForm({ ...form, planId: event.target.value })}><option value="">Select plan</option>{plans.map(item => <option key={item._id} value={item._id}>{item.name} — {money(item.basePriceMinor, item.currency)}</option>)}</select></label><Field label="Quantity" type="number" value={form.quantity} onChange={value => setForm({ ...form, quantity: value })} required /><Field label="Valid until" type="date" value={form.validUntil} onChange={value => setForm({ ...form, validUntil: value })} required /><button type="submit">Create quotation</button></FormCard></div></section>;
}

export function DetailPage({ resource, title, fields }) {
  const { id: resourceId } = useParams(); const [state, setState] = useState({ loading: true, error: '', item: null });
  useEffect(() => { api.get(`/${resource}/${resourceId}`).then(response => setState({ loading: false, error: '', item: response.data.data })).catch(error => setState({ loading: false, error: getApiErrorMessage(error), item: null })); }, [resource, resourceId]);
  if (state.loading) return <LoadingState />; if (state.error) return <ErrorState message={state.error} />; if (!state.item) return <EmptyState />;
  return <section><div className="page-heading"><div><p className="eyebrow">Details</p><h2>{title}</h2></div></div><div className="detail-grid">{fields.map(field => <div className="detail-item" key={field}><span>{field}</span><strong>{String(state.item[field] ?? '—')}</strong></div>)}</div></section>;
}

export function ProductDetailPage() {
  const { id } = useParams(); const [product, setProduct] = useState(null); const [variants, setVariants] = useState([]); const [form, setForm] = useState({ name: '', priceAdjustmentMinor: 0, currency: 'USD' }); const [message, setMessage] = useState('');
  const load = useCallback(() => Promise.all([api.get(`/products/${id}`), api.get(`/products/${id}/variants`)]).then(([productResponse, variantResponse]) => { setProduct(productResponse.data.data); setVariants(variantResponse.data.data || []); }).catch(error => setMessage(getApiErrorMessage(error))), [id]);
  useEffect(() => { load(); }, [load]);
  const submit = async event => { event.preventDefault(); try { await api.post(`/products/${id}/variants`, { ...form, priceAdjustmentMinor: Number(form.priceAdjustmentMinor) }); setForm({ name: '', priceAdjustmentMinor: 0, currency: 'USD' }); setMessage('Variant created.'); load(); } catch (error) { setMessage(getApiErrorMessage(error)); } };
  if (!product) return message ? <ErrorState message={message} /> : <LoadingState />;
  return <section><div className="page-heading"><div><p className="eyebrow">Catalog</p><h2>{product.name}</h2><p className="muted">{product.type} · {money(product.salesPriceMinor, product.currency)}</p></div></div><div className="panel"><div className="panel-heading"><h3>Variants</h3><span>{variants.length} total</span></div>{variants.length ? <DataList items={variants} primary="name" secondary="status" /> : <EmptyState title="No variants" />}<FormCard title="Add variant" onSubmit={submit} message={message}><Field label="Name" value={form.name} onChange={value => setForm({ ...form, name: value })} required /><Field label="Price adjustment (minor units)" type="number" value={form.priceAdjustmentMinor} onChange={value => setForm({ ...form, priceAdjustmentMinor: value })} /><button type="submit">Add variant</button></FormCard></div></section>;
}

export function InvoiceDetailPage() {
  const { id } = useParams(); const [state, setState] = useState({ loading: true, error: '', item: null, payments: [] });
  const load = useCallback(() => Promise.all([api.get(`/invoices/${id}`), api.get(`/invoices/${id}/payments`)]).then(([invoice, payments]) => setState({ loading: false, error: '', item: invoice.data.data, payments: payments.data.data || [] })).catch(error => setState({ loading: false, error: getApiErrorMessage(error), item: null, payments: [] })), [id]);
  useEffect(() => { load(); }, [load]);
  if (state.loading) return <LoadingState />; if (state.error) return <ErrorState message={state.error} />; const invoice = state.item;
  return <section className="printable-invoice"><div className="page-heading"><div><p className="eyebrow">Invoice</p><h2>{invoice.invoiceNumber}</h2><p className="muted">Due {new Date(invoice.dueDate).toLocaleDateString()}</p></div><button onClick={() => window.print()}>Print invoice</button></div><div className="detail-grid"><div className="detail-item"><span>Status</span><strong>{invoice.status}</strong></div><div className="detail-item"><span>Total</span><strong>{money(invoice.totalMinor, invoice.currency)}</strong></div><div className="detail-item"><span>Paid</span><strong>{money(invoice.paidAmountMinor, invoice.currency)}</strong></div><div className="detail-item"><span>Outstanding</span><strong>{money(invoice.balanceDueMinor, invoice.currency)}</strong></div></div><div className="panel"><h3>Payments</h3>{state.payments.length ? <DataList items={state.payments} primary="amountMinor" secondary="method" format={item => money(item.amountMinor, item.currency)} /> : <EmptyState title="No payments recorded" />}</div></section>;
}

export function QuotationsPage() {
  const resource = useResource('/quotations');
  const action = async (item, path) => { try { await api.post(`/quotations/${item._id}/${path}`); resource.load(); } catch { /* the list remains authoritative */ } };
  return <ReadOnlyList title="Quotations" description="Review quotations and convert accepted work into subscriptions." resource={resource} columns={['quotationNumber', 'customerId', 'status', 'totalMinor']} moneyColumn="totalMinor" actions={item => <>{item.status === 'SENT' && <button className="table-action" onClick={() => action(item, 'accept')}>Accept</button>}{item.status === 'ACCEPTED' && <button className="table-action" onClick={() => action(item, 'convert')}>Convert</button>}</>} />;
}
export function SubscriptionsPage() {
  const resource = useResource('/subscriptions');
  const action = async (item, path) => { try { await api.post(`/subscriptions/${item._id}/${path}`); resource.load(); } catch { /* the list remains authoritative */ } };
  return <ReadOnlyList title="Subscriptions" description="Monitor lifecycle state and upcoming billing dates." resource={resource} columns={['subscriptionNumber', 'customerId', 'status', 'nextBillingDate']} actions={item => <>{item.status === 'CONFIRMED' && <button className="table-action" onClick={() => action(item, 'activate')}>Activate</button>}{item.status === 'ACTIVE' && <button className="table-action" onClick={() => action(item, 'pause')}>Pause</button>}{item.status === 'PAUSED' && <button className="table-action" onClick={() => action(item, 'resume')}>Resume</button>}</>} />;
}
export function InvoicesPage() {
  const resource = useResource('/invoices');
  const [amount, setAmount] = useState('');
  const pay = async item => { if (!amount) return; try { await api.post(`/invoices/${item._id}/payments`, { amountMinor: Number(amount), method: 'OTHER', paymentDate: new Date().toISOString() }); setAmount(''); resource.load(); } catch { /* the list remains authoritative */ } };
  const action = async (item, path, body) => { try { await api.post(`/invoices/${item._id}/${path}`, body); resource.load(); } catch (error) { window.alert(getApiErrorMessage(error)); } };
  return <ReadOnlyList title="Invoices" description="Track invoice status, due dates and balances." resource={resource} columns={['invoiceNumber', 'customerId', 'status', 'balanceDueMinor']} moneyColumn="balanceDueMinor" actions={item => <>{item.status === 'DRAFT' && <button className="table-action" onClick={() => action(item, 'confirm')}>Confirm</button>}{item.status !== 'PAID' && item.status !== 'CANCELLED' && <span className="inline-action"><input aria-label={`Payment for ${item.invoiceNumber}`} type="number" value={amount} onChange={event => setAmount(event.target.value)} placeholder="Minor units" /><button className="table-action" onClick={() => pay(item)}>Record payment</button></span>}{item.paidAmountMinor === 0 && item.status !== 'CANCELLED' && <button className="table-action danger-action" onClick={() => action(item, 'cancel', { reason: 'Cancelled by operator' })}>Cancel</button>}<Link className="table-action link-action" to={`/invoices/${item._id}`}>Details</Link></>} />;
}
export function PaymentsPage() { return <ReadOnlyList title="Payment balances" description="Payment balances exposed by the invoice API. Individual payment history requires a backend payments listing endpoint." path="/invoices" columns={['invoiceNumber', 'paidAmountMinor', 'balanceDueMinor', 'status']} moneyColumn="paidAmountMinor" />; }
export function ConfigurationPage() { return <div className="split-list"><ReadOnlyList title="Tax configurations" description="Configured tax rules." path="/taxes" columns={['name', 'rateBasisPoints', 'status']} /><ReadOnlyList title="Discounts" description="Configured discount rules." path="/discounts" columns={['name', 'kind', 'value', 'status']} /></div>; }

function ReadOnlyList({ title, description, path, resource: suppliedResource, columns, moneyColumn, actions }) {
  const fetchedResource = useResource(suppliedResource ? null : path);
  const resource = suppliedResource || fetchedResource;
  return <ResourcePage title={title} description={description} loading={resource.loading} error={resource.error} retry={resource.load} items={resource.items} columns={columns} actions={actions} format={moneyColumn ? { [moneyColumn]: item => money(item[moneyColumn], item.currency) } : {}} />;
}
function ResourcePage({ title, description, loading, error, retry, items, columns, format, actions, children }) {
  return <section><div className="page-heading"><div><p className="eyebrow">Workspace</p><h2>{title}</h2><p className="muted">{description}</p></div></div>{children && <div className="form-panel">{children}</div>}{loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={retry} /> : items.length ? <div className="table-wrap"><table><thead><tr>{columns.map(column => <th key={column}>{column.replaceAll(/([A-Z])/g, ' $1')}</th>)}{actions && <th>Actions</th>}</tr></thead><tbody>{items.map(item => <tr key={item._id}>{columns.map(column => <td key={column}>{column === 'status' ? <StatusPill value={item[column]} /> : format?.[column] ? format[column](item) : String(item[column] ?? '—')}</td>)}{actions && <td>{actions(item)}</td>}</tr>)}</tbody></table></div> : <EmptyState title={`No ${title.toLowerCase()} found`} />}</section>;
}
function FormCard({ title, onSubmit, message, children }) { return <form className="form-card" onSubmit={onSubmit}><h3>{title}</h3>{children}{message && <p className="form-message" role="status">{message}</p>}</form>; }
function Field({ label, value, onChange, type = 'text', required = false }) { return <label>{label}<input type={type} value={value} required={required} onChange={event => onChange(event.target.value)} /></label>; }
function DataList({ items, primary, secondary, format }) {
  return <ul className="data-list">{items.map(item => <li key={item._id}><strong>{format ? format(item) : item[primary]}</strong><span>{item[secondary]}</span></li>)}</ul>;
}
