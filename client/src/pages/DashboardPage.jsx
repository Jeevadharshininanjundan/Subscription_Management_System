import { useCallback, useEffect, useState } from 'react';
import { api, getApiErrorMessage } from '../services/api.js';
import { ErrorState, LoadingState, EmptyState } from '../components/ResourceState.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const money = (minor, currency = 'USD') => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format((minor || 0) / 100);

export default function DashboardPage() {
  const { user } = useAuth();
  const [state, setState] = useState({ loading: true, error: '', data: {} });
  const [billing, setBilling] = useState({ running: false, message: '', skipped: [], errors: [] });
  const load = useCallback(async () => {
    setState(current => ({ ...current, loading: true, error: '' }));
    try {
      const resources = user?.role === 'CUSTOMER'
        ? ['customers', 'subscriptions', 'invoices', 'quotations']
        : ['customers', 'products', 'subscriptions', 'invoices', 'quotations'];
      const responses = await Promise.all(resources.map(resource => api.get(`/${resource}`)));
      const values = responses.map(response => response.data.data || []);
      const customers = values[0]; const products = user?.role === 'CUSTOMER' ? [] : values[1];
      const offset = user?.role === 'CUSTOMER' ? 1 : 2;
      const subscriptions = values[offset]; const invoices = values[offset + 1]; const quotations = values[offset + 2];
      setState({ loading: false, error: '', data: { customers, products, subscriptions, invoices, quotations } });
    } catch (error) {
      setState({ loading: false, error: getApiErrorMessage(error), data: {} });
    }
  }, [user]);
  useEffect(() => { load(); }, [load]);
  const runBilling = async () => {
    setBilling({ running: true, message: '', skipped: [], errors: [] });
    try {
      const response = await api.post('/billing/run');
      const result = response.data.data;
      const skipped = result.skipped || [];
      const errors = result.errors || [];
      const details = [
        `${result.count} invoice(s) generated.`,
        skipped.length ? `${skipped.length} active subscription(s) were not due.` : '',
        errors.length ? `${errors.length} subscription(s) failed billing.` : ''
      ].filter(Boolean).join(' ');
      setBilling({ running: false, message: details, skipped, errors });
      await load();
    } catch (error) {
      setBilling({ running: false, message: getApiErrorMessage(error), skipped: [], errors: [] });
    }
  };
  if (state.loading) return <LoadingState />;
  if (state.error) return <ErrorState message={state.error} onRetry={load} />;
  const { customers, products, subscriptions, invoices, quotations } = state.data;
  const active = subscriptions.filter(item => item.status === 'ACTIVE').length;
  const pendingInvoices = invoices.filter(item => ['DRAFT', 'ISSUED', 'CONFIRMED', 'PARTIALLY_PAID'].includes(item.status));
  const overdue = invoices.filter(item => item.status === 'OVERDUE');
  const collected = invoices.reduce((sum, item) => sum + (item.paidAmountMinor || 0), 0);
  return <section>
    <div className="dashboard-welcome"><div><p className="eyebrow">Overview</p><h2>Good to see you</h2><p className="muted">Welcome back, {user?.name || 'there'}. Here is what is happening across your subscription workspace.</p></div><span className="page-actions"><button className="secondary-button" onClick={load}>Refresh</button>{user?.role !== 'CUSTOMER' && <button onClick={runBilling} disabled={billing.running}>{billing.running ? 'Running billing…' : 'Run billing'}</button>}</span></div>
    {billing.message && <div className="form-message" role="status"><p>{billing.message}</p>{billing.skipped.length > 0 && <ul>{billing.skipped.map(item => <li key={String(item.subscriptionId)}>{item.subscriptionNumber}: next billing {new Date(item.nextBillingDate).toLocaleDateString()}</li>)}</ul>}{billing.errors.length > 0 && <ul>{billing.errors.map(item => <li key={String(item.subscriptionId)}>{item.subscriptionNumber}: {item.message}</li>)}</ul>}</div>}
    <div className="metric-grid">
      <Metric label="Total customers" value={customers.length} />
      <Metric label="Active subscriptions" value={active} accent="green" />
      <Metric label="Collected revenue" value={money(collected)} accent="blue" />
      <Metric label="Pending invoices" value={pendingInvoices.length} accent="orange" />
      <Metric label="Overdue invoices" value={overdue.length} accent="red" />
      <Metric label="Products" value={products.length} />
    </div>
    <div className="dashboard-grid">
      <div className="panel"><div className="panel-heading"><h3>Recent quotations</h3><span>{quotations.length} total</span></div>{quotations.length ? <DataList items={quotations.slice(0, 5)} primary="quotationNumber" secondary="status" /> : <EmptyState title="No quotations" />}</div>
      <div className="panel"><div className="panel-heading"><h3>Active subscriptions</h3><span>{active} active</span></div>{subscriptions.length ? <DataList items={subscriptions.filter(item => item.status === 'ACTIVE').slice(0, 5)} primary="subscriptionNumber" secondary="status" /> : <EmptyState title="No subscriptions" />}</div>
      <div className="panel"><div className="panel-heading"><h3>Recent invoices</h3><span>{invoices.length} total</span></div>{invoices.length ? <DataList items={invoices.slice(0, 5)} primary="invoiceNumber" secondary="status" /> : <EmptyState title="No invoices" />}</div>
      {user?.role === 'CUSTOMER' && <div className="panel profile-panel"><div className="panel-heading"><h3>Your profile</h3></div>{customers[0] ? <DataList items={[customers[0]]} primary="name" secondary="primaryEmail" /> : <EmptyState title="Profile unavailable" />}</div>}
    </div>
  </section>;
}

function Metric({ label, value, accent = '' }) {
  return <div className={`metric-card ${accent}`}><span>{label}</span><strong>{value}</strong></div>;
}
function DataList({ items, primary, secondary, format }) {
  return <ul className="data-list">{items.map(item => <li key={item._id}><strong>{format ? format(item) : item[primary]}</strong><span>{item[secondary]}</span></li>)}</ul>;
}
