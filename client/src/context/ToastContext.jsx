import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import Toasts from '../components/Toasts.jsx';

// Small messages in the top right corner: toast.success('Saved'), toast.error(...)
const ToastContext = createContext(null);
let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const show = useCallback(
    (message, type = 'info', { action } = {}) => {
      const id = nextId++;
      setToasts((list) => [...list.slice(-3), { id, message, type, action }]);
      setTimeout(() => dismiss(id), type === 'error' || type === 'warning' ? 6000 : 4000);
    },
    [dismiss]
  );

  const value = useMemo(
    () => ({
      show,
      success: (msg, opt) => show(msg, 'success', opt),
      error: (msg, opt) => show(msg, 'error', opt),
      warning: (msg, opt) => show(msg, 'warning', opt),
      info: (msg, opt) => show(msg, 'info', opt),
    }),
    [show]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toasts toasts={toasts} onClose={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
