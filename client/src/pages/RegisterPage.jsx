import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const policy = 'More than 8 characters with uppercase, lowercase, and special character.';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (submissionError) {
      setError(submissionError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-card">
      <p className="eyebrow">Customer portal</p>
      <h1>Create account</h1>
      <form onSubmit={submit}>
        <label>Name<input required value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} /></label>
        <label>Email<input type="email" required value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} /></label>
        <label>Password<input type="password" required minLength="9" value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} /></label>
        <small>{policy}</small>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button disabled={submitting}>{submitting ? 'Creating...' : 'Create account'}</button>
      </form>
      <Link to="/login">Already have an account?</Link>
    </main>
  );
}
