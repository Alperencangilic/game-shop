import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Alert } from '../components/Loading.jsx';
import PasswordInput from '../components/PasswordInput.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useDocumentTitle } from '../hooks/useBrowser.js';
import { validateEmail } from '../utils/validators.js';

const DEMO = [
  ['Customer', 'customer@gameshop.local', 'customer123'],
  ['Store manager', 'manager@gameshop.local', 'manager123'],
  ['Administrator', 'admin@gameshop.local', 'admin123'],
  ['Suspended user', 'suspended@gameshop.local', 'customer123'],
];

export default function Login() {
  useDocumentTitle('Login');
  const { user, login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user && !busy) return <Navigate to="/" replace />;

  const emailError = submitted ? validateEmail(form.email) : '';
  const passwordError = submitted && !form.password ? 'Enter your password.' : '';

  const submit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (validateEmail(form.email) || !form.password) return;
    setBusy(true);
    try {
      const u = await login(form.email.trim(), form.password);
      toast.success(`Welcome back, ${u.name}!`);
      navigate(location.state?.from ?? (u.permissions.includes('backoffice.access') ? '/admin' : '/'), { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="card auth-box">
      <h1>Login</h1>
      {location.state?.needLogin && <Alert type="info">You need to log in to open that page.</Alert>}
      <form onSubmit={submit} noValidate>
        <div className="form-group">
          <label>Email</label>
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" />
          {emailError && <span className="error-text">{emailError}</span>}
        </div>
        <div className="form-group">
          <label>Password</label>
          <PasswordInput value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="current-password" />
          {passwordError && <span className="error-text">{passwordError}</span>}
        </div>
        {error && <Alert type="error">{error}</Alert>}
        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p className="center">
        No account? <Link to="/register">Register here</Link>
      </p>

      <h4>Demo accounts</h4>
      <table className="table small">
        <tbody>
          {DEMO.map(([role, email, password]) => (
            <tr key={email}>
              <td>{role}</td>
              <td>{email}</td>
              <td>
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={() => {
                    setForm({ email, password });
                    setError('');
                  }}
                >
                  Use
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
