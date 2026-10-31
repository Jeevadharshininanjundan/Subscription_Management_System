import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, getApiErrorMessage } from '../services/api.js';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setError('');
    try {
      const response = await api.post('/auth/reset-password', {
        token: params.get('token') || '',
        password
      });
      setMessage(response.data.data.message);
    } catch (submissionError) {
      setError(getApiErrorMessage(submissionError));
    }
  }

  return (
    <main className="auth-card">
      <p className="eyebrow">Account recovery</p>
      <h1>Choose a new password</h1>
      <form onSubmit={submit}>
        <label>New password<input type="password" required minLength="9" value={password} onChange={event => setPassword(event.target.value)} /></label>
        {message && <p role="status">{message}</p>}
        {error && <p className="form-error" role="alert">{error}</p>}
        <button>Reset password</button>
      </form>
      <Link to="/login">Back to sign in</Link>
    </main>
  );
}
