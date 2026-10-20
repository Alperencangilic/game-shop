import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { DENIED_MESSAGES } from '../../utils/permissions.js';

const MENU = [
  ['/admin', 'Dashboard', 'backoffice.access'],
  ['/admin/games', 'Products', 'games.manage'],
  ['/admin/promotions', 'Promotions', 'promotions.manage'],
  ['/admin/orders', 'Orders', 'orders.view'],
  ['/admin/reports', 'Reports', 'reports.view'],
  ['/admin/users', 'Users', 'users.manage'],
  ['/admin/activity', 'Logs', 'logs.view'],
];

export default function AdminLayout() {
  const { user, can } = useAuth();
  return (
    <div className="admin-layout">
      <div className="card admin-menu">
        <b>Admin Panel</b>
        <p className="muted small">{user.roleLabel}</p>
        {MENU.map(([to, label, permission]) =>
          can(permission) ? (
            <NavLink key={to} to={to} end={to === '/admin'}>
              {label}
            </NavLink>
          ) : (
            // still shown, but locked with the reason as tooltip
            <NavLink key={to} to={to} className="locked" title={DENIED_MESSAGES[permission]}>
              {label} (locked)
            </NavLink>
          )
        )}
      </div>
      <div>
        <Outlet />
      </div>
    </div>
  );
}
