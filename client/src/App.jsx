import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';
import './styles.css';

function FoundationHome() {
  const { user, logout } = useAuth();
  return (
    <main className="shell">
      <nav aria-label="Primary navigation">
        {!user && <><Link to="/login">Sign in</Link><Link to="/register">Register</Link></>}
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
          <Route element={<ProtectedRoute />}><Route path="/account" element={<Status />} /></Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
