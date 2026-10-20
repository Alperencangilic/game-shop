import { useState } from 'react';
import { passwordStrength } from '../utils/validators.js';

// Password field with Show/Hide, Caps Lock warning and optional strength text
export default function PasswordInput({ value, onChange, onBlur, showStrength = false, ...rest }) {
  const [visible, setVisible] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const strength = showStrength ? passwordStrength(value) : null;
  const checkCaps = (e) => setCapsLock(e.getModifierState?.('CapsLock') ?? false);

  return (
    <div>
      <div className="password-row">
        <input
          {...rest}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          onKeyDown={checkCaps}
          onKeyUp={checkCaps}
          onBlur={(e) => {
            setCapsLock(false);
            onBlur?.(e);
          }}
        />
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setVisible(!visible)}>
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
      {capsLock && <small className="warning-text">Caps Lock is on!</small>}
      {strength && value && (
        <small className={`strength strength-${strength.score}`}>Password strength: {strength.label}</small>
      )}
    </div>
  );
}
