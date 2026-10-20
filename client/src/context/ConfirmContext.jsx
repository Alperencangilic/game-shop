import { createContext, useCallback, useContext, useState } from 'react';
import ConfirmDialog from '../components/ConfirmDialog.jsx';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [request, setRequest] = useState(null);

  const confirm = useCallback((options) => new Promise((resolve) => setRequest({ options, resolve })), []);

  const finish = (answer) => {
    request.resolve(answer);
    setRequest(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {request && <ConfirmDialog {...request.options} onConfirm={() => finish(true)} onCancel={() => finish(false)} />}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  return useContext(ConfirmContext);
}
