import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(form);
      navigate('/dashboard');
    } catch (submissionError) {
      setError(submissionError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-card">
      <p className="eyebrow">Brightloop Software</p>
      <h1>Sign in</h1>
      <form onSubmit={submit}>
        <label>Email<input type="email" required value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} /></label>
        <label>Password<input type="password" required value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button disabled={submitting}>{submitting ? 'Signing in...' : 'Sign in'}</button>
      </form>
      <Link to="/forgot-password">Forgot password?</Link>
      <Link to="/register">Create a customer account</Link>
    </main>
  );
}
