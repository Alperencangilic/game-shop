import { useState } from 'react';

// Click a value in a table to edit it. Enter = save, Escape = cancel.
export default function InlineEdit({ value, display, onSave, validate, step = '1' }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(String(value));
  const error = editing ? validate(text) : '';

  const save = async () => {
    if (error) return;
    if (String(value) === text.trim()) return setEditing(false);
    if (await onSave(text.trim())) setEditing(false);
  };

  if (!editing) {
    return (
      <button
        type="button"
        className="inline-edit"
        title="Click to edit"
        onClick={() => {
          setText(String(value));
          setEditing(true);
        }}
      >
        {display} ✎
      </button>
    );
  }
  return (
    <span className="inline-edit-form">
      <input
        type="number"
        step={step}
        value={text}
        autoFocus
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') save();
          if (e.key === 'Escape') setEditing(false);
        }}
      />
      <button type="button" className="btn btn-sm btn-success" onClick={save} disabled={Boolean(error)}>
        ✓
      </button>
      <button type="button" className="btn btn-sm btn-secondary" onClick={() => setEditing(false)}>
        ×
      </button>
      {error && <div className="error-text small">{error}</div>}
    </span>
  );
}
