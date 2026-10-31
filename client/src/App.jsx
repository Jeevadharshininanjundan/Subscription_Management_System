import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import AppLayout from './components/AppLayout.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';
import StaffAdministrationPage from './pages/StaffAdministrationPage.jsx';
import { ConfigurationPage, CustomersPage, DetailPage, InvoicesPage, InvoiceDetailPage, PaymentsPage, PlansPage, ProductDetailPage, ProductsPage, QuotationCreatePage, QuotationDetailPage, QuotationsPage, SubscriptionDetailPage, SubscriptionsPage } from './pages/ResourcePages.jsx';
import './styles.css';

function FoundationHome() {
  const { user, logout } = useAuth();
  return (
    <main className="shell">
      <nav aria-label="Primary navigation">
        {!user && <><Link to="/login">Sign in</Link><Link to="/register">Register</Link></>}
        {user && <Link to="/dashboard">Open workspace</Link>}
        {user?.role === 'ADMIN' && <Link to="/account">Staff administration</Link>}
        {user && <button onClick={logout}>Sign out</button>}
      </nav>
      <p className="eyebrow">Brightloop Software</p>
      <h1>Subscription Management</h1>
      {user ? <p className="lede">Signed in as {user.email} ({user.role}).</p> : <p className="lede">Authentication foundation is ready.</p>}
      <Link className="status-link" to="/status">
        View system status
      </Link>
    </main>
  );
}

function Status() {
  return (
    <main className="shell">
      <p className="eyebrow">Phase 1 foundation</p>
      <h1>System status</h1>
      <p className="status">Client shell is running.</p>
      <Link className="status-link" to="/">
        Back to home
      </Link>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<FoundationHome />} />
          <Route path="/status" element={<Status />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route element={<ProtectedRoute />}><Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/plans" element={<PlansPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/configuration" element={<ConfigurationPage />} />
            <Route path="/quotations" element={<QuotationsPage />} />
            <Route path="/quotations/new" element={<QuotationCreatePage />} />
            <Route path="/quotations/:id" element={<QuotationDetailPage />} />
            <Route path="/subscriptions" element={<SubscriptionsPage />} />
            <Route path="/invoices" element={<InvoicesPage />} />
            <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
            <Route path="/payments" element={<PaymentsPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route path="/customers/:id" element={<DetailPage resource="customers" title="Customer details" fields={['name', 'primaryEmail', 'phone', 'status']} />} />
            <Route path="/subscriptions/:id" element={<SubscriptionDetailPage />} />
            <Route element={<ProtectedRoute roles={['ADMIN']} />}><Route path="/account" element={<StaffAdministrationPage />} /></Route>
          </Route></Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
