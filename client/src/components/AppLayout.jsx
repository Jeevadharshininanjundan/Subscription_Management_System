import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const sections = [
  ['Overview', [['/dashboard', 'Dashboard', '⌂', ['ADMIN', 'STAFF', 'CUSTOMER']]]],
  ['Sales', [['/customers', 'Customers', '♙', ['ADMIN', 'STAFF']], ['/quotations', 'Quotations', '▤', ['ADMIN', 'STAFF', 'CUSTOMER']], ['/quotations/new', 'New quotation', '+', ['ADMIN', 'STAFF']]]],
  ['Catalog', [['/products', 'Products', '▦', ['ADMIN', 'STAFF']], ['/plans', 'Plans', '◈', ['ADMIN', 'STAFF']], ['/configuration', 'Discounts & taxes', '%', ['ADMIN', 'STAFF']]]],
  ['Subscriptions', [['/subscriptions', 'Subscriptions', '↻', ['ADMIN', 'STAFF', 'CUSTOMER']]]],
  ['Finance', [['/invoices', 'Invoices', '▧', ['ADMIN', 'STAFF', 'CUSTOMER']], ['/payments', 'Payments', '▣', ['ADMIN', 'STAFF', 'CUSTOMER']]]],
  ['Administration', [['/account', 'Staff administration', '⚙', ['ADMIN']]]]
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  return (
    <div className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''} ${mobileOpen ? 'mobile-nav-open' : ''}`}>
      {mobileOpen && <button className="mobile-backdrop" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">B</span><span className="brand-name">Brightloop</span><button className="sidebar-toggle" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} onClick={() => setCollapsed(value => !value)}>{collapsed ? '→' : '←'}</button></div>
        <p className="sidebar-caption">Subscription operations</p>
        <nav className="side-nav" aria-label="Application navigation">
          {sections.map(([section, items]) => { const visible = items.filter(([, , , roles]) => roles.includes(user?.role)); return visible.length ? <div className="nav-section" key={section}><span className="nav-section-title">{section}</span>{visible.map(([to, label, icon]) => <NavLink key={to} to={to} end={to === '/dashboard'} title={collapsed ? label : undefined} onClick={() => setMobileOpen(false)} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}><span className="nav-icon" aria-hidden="true">{icon}</span><span className="nav-label">{label}</span></NavLink>)}</div> : null; })}
        </nav>
        <div className="sidebar-footer">
          <span className="avatar">{user?.name?.slice(0, 1) || user?.email?.slice(0, 1).toUpperCase()}</span>
          <div className="profile-copy"><strong>{user?.name || user?.email}</strong><small>{user?.role}</small></div>
          <button className="icon-button" aria-label="Sign out" onClick={async () => { await logout(); navigate('/login'); }}>↗</button>
        </div>
      </aside>
      <main className="main-content">
        <header className="topbar"><button className="mobile-menu-button" aria-label="Open navigation" onClick={() => setMobileOpen(true)}>☰</button><div><p className="eyebrow">Brightloop Software</p><h1>Subscription management</h1></div><div className="topbar-user">{user?.email}</div></header>
        <div className="page-content"><Outlet /></div>
      </main>
    </div>
  );
}
