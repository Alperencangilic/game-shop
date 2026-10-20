import { useState } from 'react';
import { useToast } from '../context/ToastContext.jsx';

// Hidden key with Show and Copy buttons
export default function LicenseKey({ value }) {
  const [visible, setVisible] = useState(false);
  const toast = useToast();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success('Key copied.');
    } catch {
      toast.warning('Could not copy. Show the key and copy it by hand.');
    }
  };

  return (
    <span className="license-key">
      <code>{visible ? value : 'GS-*****-*****-' + value.slice(-5)}</code>
      <button type="button" className="btn-link" onClick={() => setVisible(!visible)}>
        {visible ? 'Hide' : 'Show'}
      </button>
      <button type="button" className="btn-link" onClick={copy}>
        Copy
      </button>
    </span>
  );
}
