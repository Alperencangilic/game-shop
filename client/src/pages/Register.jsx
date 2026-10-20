import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Alert } from '../components/Loading.jsx';
import PasswordInput from '../components/PasswordInput.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useDocumentTitle } from '../hooks/useBrowser.js';
import { validateEmail, validateName, validatePassword } from '../utils/validators.js';

export default function Register() {
  useDocumentTitle('Register');
  const { user, register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [touched, setTouched] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user && !busy) return <Navigate to="/" replace />;

  const errors = {
    name: validateName(form.name),
    email: validateEmail(form.email),
    password: validatePassword(form.password),
    confirm: form.confirm !== form.password || !form.confirm ? 'Passwords do not match.' : '',
  };
  // show an error only after the user left the field
  const show = (key) => touched[key] && errors[key] && <span className="error-text">{errors[key]}</span>;
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const blur = (key) => () => setTouched({ ...touched, [key]: true });

  const submit = async (e) => {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true, confirm: true });
    if (Object.values(errors).some(Boolean)) {
      toast.warning('Please fix the errors in the form.');
      return;
    }
    setBusy(true);
    try {
      await register({ name: form.name.trim(), email: form.email.trim(), password: form.password });
      toast.success('Your account was created. You got $50 demo credit!');
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="card auth-box">
      <h1>Register</h1>
      <form onSubmit={submit} noValidate>
        <div className="form-group">
          <label>Full name</label>
          <input value={form.name} onChange={set('name')} onBlur={blur('name')} />
          {show('name')}
        </div>
        <div className="form-group">
          <label>Email</label>
          <input type="email" value={form.email} onChange={set('email')} onBlur={blur('email')} />
          {show('email')}
        </div>
        <div className="form-group">
          <label>Password</label>
          <PasswordInput value={form.password} onChange={set('password')} onBlur={blur('password')} autoComplete="new-password" showStrength />
          <small className="muted">At least 8 characters with a letter and a number.</small>
          {show('password')}
        </div>
        <div className="form-group">
          <label>Repeat password</label>
          <PasswordInput value={form.confirm} onChange={set('confirm')} onBlur={blur('confirm')} autoComplete="new-password" />
          {show('confirm')}
        </div>
        {error && <Alert type="error">{error}</Alert>}
        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Creating...' : 'Create account'}
        </button>
      </form>
      <p className="center">
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}
