import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import './styles.css';

function FoundationHome() {
  return (
    <main className="shell">
      <p className="eyebrow">Brightloop Software</p>
      <h1>Subscription Management</h1>
      <p className="lede">
        The application foundation is ready. Subscription workflows will be
        introduced in later phases.
      </p>
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
      <Routes>
        <Route path="/" element={<FoundationHome />} />
        <Route path="/status" element={<Status />} />
      </Routes>
    </BrowserRouter>
  );
}
