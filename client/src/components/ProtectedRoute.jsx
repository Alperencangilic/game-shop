import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { DENIED_MESSAGES } from '../utils/permissions.js';
import { Loading } from './Loading.jsx';

export function AccessDenied({ permission }) {
  const { user } = useAuth();
  return (
    <div className="card center-box">
      <h2>Access denied</h2>
      <p>{DENIED_MESSAGES[permission] ?? 'You do not have permission to open this page.'}</p>
      <p className="muted">
        You are logged in as {user.name} ({user.roleLabel}).
      </p>
      <Link to="/" className="btn btn-primary">
        Back to store
      </Link>
    </div>
  );
}

// Guests go to the login page, users without permission see AccessDenied
export default function ProtectedRoute({ permission, children }) {
  const { user, loading, can } = useAuth();
  const location = useLocation();

  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search, needLogin: true }} />;
  if (permission && !can(permission)) return <AccessDenied permission={permission} />;
  return children;
}
