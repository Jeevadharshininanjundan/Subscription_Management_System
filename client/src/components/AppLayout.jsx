import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const links = [
  ['/', 'Dashboard', ['ADMIN', 'STAFF', 'CUSTOMER']],
  ['/products', 'Products', ['ADMIN', 'STAFF']],
  ['/plans', 'Plans', ['ADMIN', 'STAFF']],
  ['/customers', 'Customers', ['ADMIN', 'STAFF']],
  ['/quotations', 'Quotations', ['ADMIN', 'STAFF', 'CUSTOMER']],
  ['/subscriptions', 'Subscriptions', ['ADMIN', 'STAFF', 'CUSTOMER']],
  ['/invoices', 'Invoices', ['ADMIN', 'STAFF', 'CUSTOMER']],
  ['/payments', 'Payments', ['ADMIN', 'STAFF', 'CUSTOMER']],
  ['/configuration', 'Taxes & discounts', ['ADMIN', 'STAFF']]
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">B</span><span>Brightloop</span></div>
        <p className="sidebar-caption">Subscription operations</p>
        <nav className="side-nav" aria-label="Application navigation">
          {links.filter(([, , roles]) => roles.includes(user?.role)).map(([to, label]) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>{label}</NavLink>
          ))}
          {user?.role === 'ADMIN' && <NavLink to="/account" className="nav-item">Staff administration</NavLink>}
        </nav>
        <div className="sidebar-footer">
          <span className="avatar">{user?.name?.slice(0, 1) || user?.email?.slice(0, 1).toUpperCase()}</span>
          <div className="profile-copy"><strong>{user?.name || user?.email}</strong><small>{user?.role}</small></div>
          <button className="icon-button" aria-label="Sign out" onClick={async () => { await logout(); navigate('/login'); }}>↗</button>
        </div>
      </aside>
      <main className="main-content">
        <header className="topbar"><div><p className="eyebrow">Brightloop Software</p><h1>Subscription management</h1></div><div className="topbar-user">{user?.email}</div></header>
        <div className="page-content"><Outlet /></div>
      </main>
    </div>
  );
}
