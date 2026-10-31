import { useCallback, useEffect, useState } from 'react';
import { api, getApiErrorMessage } from '../services/api.js';
import { EmptyState, ErrorState, LoadingState, StatusPill } from '../components/ResourceState.jsx';

const emptyForm = { name: '', email: '', password: '' };

function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Full name is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = 'Enter a valid email address.';
  if (form.password.length <= 8 || !/[A-Z]/.test(form.password) || !/[a-z]/.test(form.password) || !/[^A-Za-z0-9]/.test(form.password)) {
    errors.password = 'Password must be more than eight characters and include uppercase, lowercase, and special characters.';
  }
  return errors;
}

export default function StaffAdministrationPage() {
  const [staff, setStaff] = useState([]);
  const [state, setState] = useState({ loading: true, error: '' });
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setState({ loading: true, error: '' });
    try {
      const response = await api.get('/staff');
      setStaff(response.data.data?.users || []);
      setState({ loading: false, error: '' });
    } catch (error) {
      setStaff([]);
      setState({ loading: false, error: getApiErrorMessage(error) });
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const submit = async event => {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    setMessage('');
    if (Object.keys(nextErrors).length) return;
    try {
      await api.post('/staff', {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password
      });
      setForm(emptyForm);
      setErrors({});
      setMessage('Staff member created.');
      setShowForm(false);
      await load();
    } catch (error) {
      setMessage(getApiErrorMessage(error));
    }
  };

  const updateStatus = async member => {
    const status = member.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setMessage('');
    try {
      await api.patch(`/staff/${member.id}`, { status });
      setMessage(`Staff member ${status === 'ACTIVE' ? 'activated' : 'deactivated'}.`);
      await load();
    } catch (error) {
      setMessage(getApiErrorMessage(error));
    }
  };

  return (
    <section>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Administration</p>
          <h2>Staff administration</h2>
          <p className="muted">Create and manage internal staff accounts.</p>
        </div>
        <button type="button" onClick={() => { setShowForm(value => !value); setMessage(''); }}>
          {showForm ? 'Close form' : 'Add staff member'}
        </button>
      </div>

      {message && <p className="form-message" role="status">{message}</p>}

      {showForm && (
        <form className="form-panel form-card" onSubmit={submit} noValidate>
          <h3>Add staff member</h3>
          <label>Full name<input aria-invalid={Boolean(errors.name)} value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} />{errors.name && <span className="field-error" role="alert">{errors.name}</span>}</label>
          <label>Email<input type="email" aria-invalid={Boolean(errors.email)} value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} />{errors.email && <span className="field-error" role="alert">{errors.email}</span>}</label>
          <label>Password<input type="password" aria-invalid={Boolean(errors.password)} value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} />{errors.password && <span className="field-error" role="alert">{errors.password}</span>}</label>
          <button type="submit">Create staff member</button>
        </form>
      )}

      {state.loading ? <LoadingState /> : state.error ? <ErrorState message={state.error} onRetry={load} /> : staff.length === 0 ? <EmptyState title="No staff accounts" message="Add a staff member to begin managing internal access." /> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
            <tbody>{staff.map(member => <tr key={member.id}>
              <td>{member.name}</td>
              <td>{member.email}</td>
              <td>{member.role}</td>
              <td><StatusPill value={member.status} /></td>
              <td>{member.createdAt ? new Date(member.createdAt).toLocaleDateString() : '—'}</td>
              <td><button type="button" className="table-action" onClick={() => updateStatus(member)}>{member.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}</button></td>
            </tr>)}</tbody>
          </table>
        </div>
      )}
    </section>
  );
}
