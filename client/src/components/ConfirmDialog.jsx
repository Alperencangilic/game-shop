import { useState } from 'react';
import Modal from './Modal.jsx';

// requireText: user must type this word (e.g. DELETE) to confirm
export default function ConfirmDialog({ title = 'Are you sure?', message, details = [], confirmLabel = 'OK', cancelLabel = 'Cancel', tone, requireText, onConfirm, onCancel }) {
  const [typed, setTyped] = useState('');
  const locked = Boolean(requireText) && typed.trim().toUpperCase() !== requireText;

  return (
    <Modal
      title={title}
      onClose={onCancel}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onCancel} data-autofocus={requireText ? undefined : true}>
            {cancelLabel}
          </button>
          <button type="button" className={`btn ${tone === 'danger' ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm} disabled={locked}>
            {confirmLabel}
          </button>
        </>
      }
    >
      {tone === 'danger' && <p className="alert alert-error">This action cannot be undone.</p>}
      {tone === 'warning' && <p className="alert alert-warning">Please check before you continue.</p>}
      {message && <p>{message}</p>}
      {details.length > 0 && (
        <ul>
          {details.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      )}
      {requireText && (
        <div className="form-group">
          <label>
            Type <b>{requireText}</b> to confirm:
          </label>
          <input value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
        </div>
      )}
    </Modal>
  );
}
