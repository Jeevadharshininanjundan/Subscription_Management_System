import { useCallback, useEffect, useState } from 'react';
import { api, getApiErrorMessage } from '../services/api.js';
import { ErrorState, LoadingState, EmptyState } from '../components/ResourceState.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const money = (minor, currency = 'USD') => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format((minor || 0) / 100);

export default function DashboardPage() {
  const { user } = useAuth();
  const [state, setState] = useState({ loading: true, error: '', data: {} });
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
  if (state.loading) return <LoadingState />;
  if (state.error) return <ErrorState message={state.error} onRetry={load} />;
  const { customers, products, subscriptions, invoices, quotations } = state.data;
  const active = subscriptions.filter(item => item.status === 'ACTIVE').length;
  const pendingInvoices = invoices.filter(item => ['DRAFT', 'ISSUED', 'CONFIRMED', 'PARTIALLY_PAID'].includes(item.status));
  const overdue = invoices.filter(item => item.status === 'OVERDUE');
  const collected = invoices.reduce((sum, item) => sum + (item.paidAmountMinor || 0), 0);
  return <section>
    <div className="page-heading"><div><p className="eyebrow">Overview</p><h2>Good to see you</h2><p className="muted">Live operational data from your subscription workspace.</p></div><button onClick={load}>Refresh</button></div>
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
      <div className="panel"><div className="panel-heading"><h3>Recent invoices</h3><span>{invoices.length} total</span></div>{invoices.length ? <DataList items={invoices.slice(0, 5)} primary="invoiceNumber" secondary="status" /> : <EmptyState title="No invoices" />}</div>
    </div>
  </section>;
}

function Metric({ label, value, accent = '' }) {
  return <div className={`metric-card ${accent}`}><span>{label}</span><strong>{value}</strong></div>;
}
function DataList({ items, primary, secondary, format }) {
  return <ul className="data-list">{items.map(item => <li key={item._id}><strong>{format ? format(item) : item[primary]}</strong><span>{item[secondary]}</span></li>)}</ul>;
}
