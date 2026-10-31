import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, getApiErrorMessage } from '../services/api.js';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setError('');
    try {
      const response = await api.post('/auth/forgot-password', { email });
      setMessage(response.data.data.message);
    } catch (submissionError) {
      setError(getApiErrorMessage(submissionError));
    }
  }

  return (
    <main className="auth-card">
      <p className="eyebrow">Account recovery</p>
      <h1>Reset password</h1>
      <form onSubmit={submit}>
        <label>Email<input type="email" required value={email} onChange={event => setEmail(event.target.value)} /></label>
        {message && <p role="status">{message}</p>}
        {error && <p className="form-error" role="alert">{error}</p>}
        <button>Send reset link</button>
      </form>
      <Link to="/login">Back to sign in</Link>
    </main>
  );
}
