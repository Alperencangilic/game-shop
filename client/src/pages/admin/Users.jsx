import { useState } from 'react';
import { api } from '../../api.js';
import UserForm from '../../components/admin/UserForm.jsx';
import { ErrorBox, Loading } from '../../components/Loading.jsx';
import ReasonButton from '../../components/ReasonButton.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useConfirm } from '../../context/ConfirmContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useApi } from '../../hooks/useApi.js';
import { useDocumentTitle } from '../../hooks/useBrowser.js';
import { useMeta } from '../../hooks/useMeta.js';
import { formatMoney, formatRelative } from '../../utils/format.js';

export default function Users() {
  useDocumentTitle('Users');
  const { user: me } = useAuth();
  const meta = useMeta();
  const confirm = useConfirm();
  const toast = useToast();
  const { data, error, loading, reload } = useApi('/admin/users');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('all');
  const [adding, setAdding] = useState(false);

  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox error={error} onRetry={reload} />;

  const all = data.users;
  const users = all
    .filter((u) => role === 'all' || u.role === role)
    .filter((u) => (u.name + u.email).toLowerCase().includes(search.toLowerCase()));
  const activeAdmins = all.filter((u) => u.role === 'admin' && u.status === 'active').length;
  const lastAdmin = (u) => u.role === 'admin' && u.status === 'active' && activeAdmins <= 1;

  const update = async (u, changes, message) => {
    try {
      await api.patch(`/admin/users/${u.id}`, changes);
      toast.success(message);
      reload({ quiet: true });
    } catch (err) {
      toast.error(err.message);
    }
  };

  const changeRole = async (u, newRole) => {
    const label = meta.roles.find((r) => r.value === newRole)?.label;
    const ok = await confirm({ title: 'Change role', message: `Make ${u.name} ${label}?`, confirmLabel: 'Change', tone: newRole === 'admin' ? 'warning' : undefined });
    if (ok) update(u, { role: newRole }, `${u.name} is now ${label}.`);
  };

  const toggleSuspend = async (u) => {
    const suspend = u.status === 'active';
    if (suspend && !(await confirm({ title: 'Suspend user', message: `${u.name} will not be able to log in.`, confirmLabel: 'Suspend', tone: 'warning' }))) return;
    update(u, { status: suspend ? 'suspended' : 'active' }, suspend ? `${u.name} is suspended.` : `${u.name} is active again.`);
  };

  const remove = async (u) => {
    if (!(await confirm({ title: 'Delete user', message: `Delete ${u.name}?`, confirmLabel: 'Delete', tone: 'danger', requireText: 'DELETE' }))) return;
    try {
      toast.success((await api.del(`/admin/users/${u.id}`)).message);
      reload({ quiet: true });
    } catch (err) {
      toast.error(err.message);
    }
  };

  // why an action is not possible (null = possible)
  const suspendReason = (u) => (u.id === me.id ? 'You cannot suspend yourself.' : lastAdmin(u) ? 'This is the last active admin.' : null);
  const deleteReason = (u) => {
    if (u.id === me.id) return 'You cannot delete yourself.';
    if (lastAdmin(u)) return 'This is the last active admin.';
    if (u.orderCount > 0) return `${u.name} has ${u.orderCount} orders. Suspend the account instead.`;
    return null;
  };

  return (
    <div>
      <div className="page-head">
        <h1>Users ({all.length})</h1>
        <button type="button" className="btn btn-primary" onClick={() => setAdding(true)}>
          + Add user
        </button>
      </div>
      <div className="toolbar">
        <input className="search" placeholder="Search name or email" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="all">All roles</option>
          {meta.roles.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Status</th>
              <th>Orders</th>
              <th>Spent</th>
              <th>Wallet</th>
              <th>Last login</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className={u.status === 'suspended' ? 'muted-row' : ''}>
                <td>
                  {u.name} {u.id === me.id && <span className="badge badge-blue">you</span>}
                  <div className="muted small">{u.email}</div>
                </td>
                <td>
                  {u.id === me.id || lastAdmin(u) ? (
                    <span title="This role cannot be changed">{u.roleLabel}</span>
                  ) : (
                    <select value={u.role} onChange={(e) => changeRole(u, e.target.value)}>
                      {meta.roles.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  )}
                </td>
                <td>
                  <span className={`badge ${u.status === 'active' ? 'badge-green' : 'badge-red'}`}>{u.status}</span>
                </td>
                <td>{u.orderCount}</td>
                <td>{formatMoney(u.spentCents)}</td>
                <td>{u.role === 'customer' ? formatMoney(u.balanceCents) : '-'}</td>
                <td>{u.lastLoginAt ? formatRelative(u.lastLoginAt) : 'never'}</td>
                <td>
                  <div className="buttons">
                    <ReasonButton reason={suspendReason(u)} className="btn btn-sm btn-outline" onClick={() => toggleSuspend(u)}>
                      {u.status === 'active' ? 'Suspend' : 'Activate'}
                    </ReasonButton>
                    <ReasonButton reason={deleteReason(u)} className="btn btn-sm btn-danger" onClick={() => remove(u)}>
                      Delete
                    </ReasonButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {adding && (
        <UserForm
          roles={meta.roles}
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            reload({ quiet: true });
          }}
        />
      )}
    </div>
  );
}
