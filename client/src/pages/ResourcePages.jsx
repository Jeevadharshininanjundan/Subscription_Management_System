import { useCallback, useEffect, useState } from 'react';
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
  return <ResourcePage title="Products" description="Manage the catalog used in quotations and subscriptions." loading={resource.loading} error={resource.error} retry={resource.load} items={resource.items} columns={['name', 'type', 'salesPriceMinor', 'status']} format={{ salesPriceMinor: item => money(item.salesPriceMinor, item.currency) }}><FormCard title="Add product" onSubmit={submit} message={message}><Field label="Name" value={form.name} onChange={value => setForm({ ...form, name: value })} required /><Field label="Type" value={form.type} onChange={value => setForm({ ...form, type: value })} required /><Field label="Sales price (minor units)" type="number" value={form.salesPriceMinor} onChange={value => setForm({ ...form, salesPriceMinor: value })} required /><Field label="Cost price (minor units)" type="number" value={form.costPriceMinor} onChange={value => setForm({ ...form, costPriceMinor: value })} /><button type="submit">Create product</button></FormCard></ResourcePage>;
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
  return <ResourcePage title="Customers" description="Maintain customer accounts and operational contacts." loading={resource.loading} error={resource.error} retry={resource.load} items={resource.items} columns={['name', 'primaryEmail', 'phone', 'status']}><FormCard title="Add customer" onSubmit={submit} message={message}><Field label="Name" value={form.name} onChange={value => setForm({ ...form, name: value })} required /><Field label="Email" type="email" value={form.primaryEmail} onChange={value => setForm({ ...form, primaryEmail: value })} required /><Field label="Phone" value={form.phone} onChange={value => setForm({ ...form, phone: value })} /><button type="submit">Create customer</button></FormCard></ResourcePage>;
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
  return <ReadOnlyList title="Invoices" description="Track invoice status, due dates and balances." resource={resource} columns={['invoiceNumber', 'customerId', 'status', 'balanceDueMinor']} moneyColumn="balanceDueMinor" actions={item => item.balanceDueMinor > 0 && <span className="inline-action"><input aria-label={`Payment for ${item.invoiceNumber}`} type="number" value={amount} onChange={event => setAmount(event.target.value)} placeholder="Minor units" /><button className="table-action" onClick={() => pay(item)}>Record payment</button></span>} />;
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
