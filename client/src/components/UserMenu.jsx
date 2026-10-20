import { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useDismiss } from '../hooks/useBrowser.js';
import { formatMoney } from '../utils/format.js';

export default function UserMenu() {
  const { user, logout, isCustomer } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useDismiss(open, close);

  const signOut = async () => {
    close();
    await logout();
    toast.info('You are logged out.');
    navigate('/');
  };

  return (
    <div className="dropdown" ref={ref}>
      <button type="button" className="nav-button" onClick={() => setOpen(!open)}>
        {user.name.split(' ')[0]} {isCustomer && `(${formatMoney(user.balanceCents)})`} ▾
      </button>
      {open && (
        <div className="dropdown-menu">
          <div className="dropdown-info">
            <b>{user.name}</b>
            <div className="muted small">{user.email}</div>
            <div className="small">Role: {user.roleLabel}</div>
          </div>
          <Link to="/account" onClick={close}>
            My account
          </Link>
          {isCustomer && (
            <>
              <Link to="/account?tab=wallet" onClick={close}>
                Wallet
              </Link>
              <Link to="/orders" onClick={close}>
                My orders
              </Link>
              <Link to="/downloads" onClick={close}>
                Download history
              </Link>
            </>
          )}
          <button type="button" onClick={signOut}>
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
