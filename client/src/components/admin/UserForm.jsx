import { useState } from 'react';
import { api } from '../../api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { ROLE_DESCRIPTIONS } from '../../utils/permissions.js';
import { validateEmail, validateName, validatePassword } from '../../utils/validators.js';
import Modal from '../Modal.jsx';
import PasswordInput from '../PasswordInput.jsx';

export default function UserForm({ roles, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'manager' });
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState('');
  const errors = { name: validateName(form.name), email: validateEmail(form.email), password: validatePassword(form.password) };
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.values(errors).some(Boolean)) return;
    try {
      const result = await api.post('/admin/users', form);
      toast.success(result.message);
      onSaved();
    } catch (err) {
      setServerError(err.message);
    }
  };

  return (
    <Modal
      title="Add user"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="user-form" className="btn btn-primary">
            Create
          </button>
        </>
      }
    >
      <form id="user-form" onSubmit={submit} noValidate>
        <div className="form-group">
          <label>Name</label>
          <input value={form.name} onChange={set('name')} />
          {submitted && errors.name && <span className="error-text">{errors.name}</span>}
        </div>
        <div className="form-group">
          <label>Email</label>
          <input type="email" value={form.email} onChange={set('email')} />
          {submitted && errors.email && <span className="error-text">{errors.email}</span>}
        </div>
        <div className="form-group">
          <label>Password</label>
          <PasswordInput value={form.password} onChange={set('password')} autoComplete="new-password" showStrength />
          {submitted && errors.password && <span className="error-text">{errors.password}</span>}
        </div>
        <div className="form-group">
          <label>Role</label>
          <select value={form.role} onChange={set('role')}>
            {roles.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <small className="muted">{ROLE_DESCRIPTIONS[form.role]}</small>
        </div>
        {form.role === 'admin' && <p className="alert alert-warning">Administrators have full access to the system.</p>}
        {serverError && <p className="alert alert-error">{serverError}</p>}
      </form>
    </Modal>
  );
}
