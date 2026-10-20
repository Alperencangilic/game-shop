import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { Alert, Loading } from '../components/Loading.jsx';
import PasswordInput from '../components/PasswordInput.jsx';
import ReasonButton from '../components/ReasonButton.jsx';
import Tabs from '../components/Tabs.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useConfirm } from '../context/ConfirmContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { useDocumentTitle, useUnsavedChangesWarning } from '../hooks/useBrowser.js';
import { useMeta } from '../hooks/useMeta.js';
import { formatDate, formatDateTime, formatMoney } from '../utils/format.js';
import { ROLE_DESCRIPTIONS } from '../utils/permissions.js';
import { validateEmail, validateName, validatePassword } from '../utils/validators.js';

function Profile() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ name: user.name, email: user.email });
  const dirty = form.name !== user.name || form.email !== user.email;
  useUnsavedChangesWarning(dirty);
  const errors = { name: validateName(form.name), email: validateEmail(form.email) };

  const save = async (e) => {
    e.preventDefault();
    if (errors.name || errors.email) return;
    try {
      const data = await api.patch('/account', form);
      setUser(data.user);
      toast.success(data.message);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <form className="card" onSubmit={save} style={{ maxWidth: 500 }}>
      <p>
        <b>Role:</b> {user.roleLabel} - <span className="muted">{ROLE_DESCRIPTIONS[user.role]}</span>
      </p>
      <p className="muted small">Member since {formatDate(user.createdAt)}</p>
      <div className="form-group">
        <label>Name</label>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        {dirty && errors.name && <span className="error-text">{errors.name}</span>}
      </div>
      <div className="form-group">
        <label>Email</label>
        <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        {dirty && errors.email && <span className="error-text">{errors.email}</span>}
      </div>
      {dirty && <p className="warning-text small">You have unsaved changes.</p>}
      <button type="submit" className="btn btn-primary" disabled={!dirty}>
        Save
      </button>
    </form>
  );
}

function ChangePassword() {
  const toast = useToast();
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [submitted, setSubmitted] = useState(false);
  const errors = {
    current: form.current ? '' : 'Enter your current password.',
    next: validatePassword(form.next),
    confirm: form.confirm === form.next ? '' : 'Passwords do not match.',
  };
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.values(errors).some(Boolean)) return;
    try {
      const data = await api.post('/account/password', { currentPassword: form.current, newPassword: form.next });
      toast.success(data.message);
      setForm({ current: '', next: '', confirm: '' });
      setSubmitted(false);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const show = (key) => submitted && errors[key] && <span className="error-text">{errors[key]}</span>;
  return (
    <form className="card" onSubmit={save} style={{ maxWidth: 500 }} noValidate>
      <div className="form-group">
        <label>Current password</label>
        <PasswordInput value={form.current} onChange={set('current')} autoComplete="current-password" />
        {show('current')}
      </div>
      <div className="form-group">
        <label>New password</label>
        <PasswordInput value={form.next} onChange={set('next')} autoComplete="new-password" showStrength />
        {show('next')}
      </div>
      <div className="form-group">
        <label>Repeat new password</label>
        <PasswordInput value={form.confirm} onChange={set('confirm')} autoComplete="new-password" />
        {show('confirm')}
      </div>
      <button type="submit" className="btn btn-primary">
        Change password
      </button>
    </form>
  );
}

function Wallet() {
  const { user, setUser } = useAuth();
  const meta = useMeta();
  const toast = useToast();
  const confirm = useConfirm();
  const { data, loading, reload } = useApi('/account/wallet');
  const room = meta.maxBalanceCents - user.balanceCents;

  const topUp = async (amount) => {
    const ok = await confirm({ title: 'Add money', message: `Add ${formatMoney(amount)} to your wallet? (Demo - no real payment)`, confirmLabel: 'Add' });
    if (!ok) return;
    try {
      const result = await api.post('/account/wallet/top-up', { amountCents: amount });
      setUser(result.user);
      toast.success(result.message);
      reload({ quiet: true });
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <div className="card" style={{ maxWidth: 500 }}>
        <p>
          Current balance: <b style={{ fontSize: 22 }}>{formatMoney(user.balanceCents)}</b>
        </p>
        <p className="muted small">Maximum balance: {formatMoney(meta.maxBalanceCents)}</p>
        <div className="buttons">
          {meta.topUpAmounts.map((amount) => (
            <ReasonButton
              key={amount}
              className="btn btn-success"
              onClick={() => topUp(amount)}
              reason={amount > room ? `Your wallet can hold max ${formatMoney(meta.maxBalanceCents)}.` : null}
            >
              + {formatMoney(amount)}
            </ReasonButton>
          ))}
        </div>
      </div>
      <h3>Transactions</h3>
      {loading && !data ? (
        <Loading />
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Type</th>
              <th className="right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {(data?.transactions ?? []).map((t) => (
              <tr key={t.id}>
                <td>{formatDateTime(t.createdAt)}</td>
                <td>{t.note}</td>
                <td>{t.type}</td>
                <td className={`right ${t.amountCents < 0 ? 'error-text' : 'success-text'}`}>
                  {t.amountCents > 0 ? '+' : '-'}
                  {formatMoney(Math.abs(t.amountCents))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function DeleteAccount() {
  const { isCustomer, setUser } = useAuth();
  const confirm = useConfirm();
  const toast = useToast();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isCustomer) return <Alert type="info">Staff accounts can only be deleted by another administrator.</Alert>;

  const remove = async (e) => {
    e.preventDefault();
    if (!password) return setError('Enter your password.');
    const ok = await confirm({ title: 'Delete account', message: 'Your account, library and wishlist will be deleted.', confirmLabel: 'Delete my account', tone: 'danger', requireText: 'DELETE' });
    if (!ok) return;
    try {
      const data = await api.del('/account', { password });
      setUser(null);
      toast.info(data.message);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form className="card" onSubmit={remove} style={{ maxWidth: 500 }}>
      <Alert type="warning">Accounts with orders cannot be deleted because orders are kept for reports.</Alert>
      <div className="form-group">
        <label>Password</label>
        <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        {error && <span className="error-text">{error}</span>}
      </div>
      <button type="submit" className="btn btn-danger">
        Delete my account
      </button>
    </form>
  );
}

export default function Account() {
  useDocumentTitle('My account');
  const { isCustomer } = useAuth();
  const [params, setParams] = useSearchParams();
  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'password', label: 'Password' },
    ...(isCustomer ? [{ id: 'wallet', label: 'Wallet' }] : []),
    { id: 'delete', label: 'Delete account' },
  ];
  const active = tabs.some((t) => t.id === params.get('tab')) ? params.get('tab') : 'profile';

  return (
    <div>
      <h1>My account</h1>
      <Tabs tabs={tabs} active={active} onChange={(id) => setParams({ tab: id }, { replace: true })} />
      {active === 'profile' && <Profile />}
      {active === 'password' && <ChangePassword />}
      {active === 'wallet' && <Wallet />}
      {active === 'delete' && <DeleteAccount />}
    </div>
  );
}
