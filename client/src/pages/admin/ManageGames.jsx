import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../api.js';
import GameForm from '../../components/admin/GameForm.jsx';
import InlineEdit from '../../components/admin/InlineEdit.jsx';
import GameImage from '../../components/GameImage.jsx';
import { ErrorBox, Loading } from '../../components/Loading.jsx';
import { useConfirm } from '../../context/ConfirmContext.jsx';
import { useLiveEvent } from '../../context/LiveContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useApi } from '../../hooks/useApi.js';
import { useDocumentTitle } from '../../hooks/useBrowser.js';
import { useMeta } from '../../hooks/useMeta.js';
import { downloadCsv } from '../../utils/csv.js';
import { formatMoney } from '../../utils/format.js';

export default function ManageGames() {
  useDocumentTitle('Products');
  const meta = useMeta();
  const toast = useToast();
  const confirm = useConfirm();
  const [params, setParams] = useSearchParams();
  const { data, error, loading, reload, setData } = useApi('/admin/games');
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('all');
  const [type, setType] = useState('all');
  const [selected, setSelected] = useState([]);
  const [percent, setPercent] = useState('-10');
  const [editing, setEditing] = useState(null); // null, 'new' or a game

  useLiveEvent((event) => {
    if (['game-updated', 'catalog-changed', 'orders-changed'].includes(event.type)) reload({ quiet: true });
  });

  const games = data?.games ?? [];

  // /admin/games?edit=5 opens the edit form
  useEffect(() => {
    const id = Number(params.get('edit'));
    if (!id || games.length === 0) return;
    const game = games.find((g) => g.id === id);
    if (game) setEditing(game);
    setParams({}, { replace: true });
  }, [params, games, setParams]);

  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox error={error} onRetry={reload} />;

  const shown = games
    .filter((g) => g.title.toLowerCase().includes(search.toLowerCase()))
    .filter((g) => genre === 'all' || g.genre === genre)
    .filter((g) => type === 'all' || g.type === type);

  const patch = async (game, changes, message) => {
    try {
      const result = await api.patch(`/admin/games/${game.id}`, changes);
      setData((d) => ({ games: d.games.map((g) => (g.id === game.id ? { ...g, ...result.game } : g)) }));
      toast.success(message ?? result.message);
      return true;
    } catch (err) {
      toast.error(err.message);
      return false;
    }
  };

  const toggleVisible = async (game) => {
    if (game.isActive && !(await confirm({ title: 'Hide product?', message: `${game.title} will not be visible in the store.`, confirmLabel: 'Hide', tone: 'warning' }))) return;
    patch(game, { isActive: !game.isActive }, game.isActive ? `${game.title} is hidden.` : `${game.title} is visible again.`);
  };

  const remove = async (game) => {
    if (!(await confirm({ title: 'Delete product?', message: `Delete ${game.title}?`, confirmLabel: 'Delete', tone: 'danger', requireText: 'DELETE' }))) return;
    try {
      const result = await api.del(`/admin/games/${game.id}`);
      setData((d) => ({ games: d.games.filter((g) => g.id !== game.id) }));
      toast.success(result.message);
    } catch (err) {
      if (err.code === 'HAS_SALES' && game.isActive) {
        const hide = await confirm({ title: 'Cannot delete', message: err.message, confirmLabel: 'Hide it instead', tone: 'warning' });
        if (hide) patch(game, { isActive: false }, `${game.title} is hidden.`);
      } else {
        toast.error(err.message);
      }
    }
  };

  const toggleSelect = (id) => setSelected(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  const applyBulk = async () => {
    const p = Number(percent);
    if (!Number.isInteger(p) || p === 0 || p < -90 || p > 200) {
      toast.warning('Enter a whole number between -90 and 200 (not 0).');
      return;
    }
    if (!(await confirm({ title: 'Change prices', message: `Change the price of ${selected.length} products by ${p}%?`, confirmLabel: 'Change' }))) return;
    try {
      const result = await api.post('/admin/games/bulk-price', { ids: selected, percent: p });
      toast.success(result.message);
      setSelected([]);
      reload({ quiet: true });
    } catch (err) {
      toast.error(err.message);
    }
  };

  const exportCsv = () =>
    downloadCsv('products.csv', shown, [
      { label: 'ID', value: (g) => g.id },
      { label: 'Title', value: (g) => g.title },
      { label: 'Type', value: (g) => g.type },
      { label: 'Category', value: (g) => g.genre },
      { label: 'Price', value: (g) => (g.priceCents / 100).toFixed(2) },
      { label: 'Stock', value: (g) => g.stock },
      { label: 'Sold', value: (g) => g.sales },
      { label: 'Revenue', value: (g) => (g.revenueCents / 100).toFixed(2) },
    ]);

  const priceError = (t) => (t === '' || Number(t) < 0 || Number(t) > 999.99 ? 'Price must be 0 - 999.99' : '');
  const stockError = (t) => (!Number.isInteger(Number(t)) || Number(t) < 0 ? 'Whole number, 0 or more' : '');

  return (
    <div>
      <div className="page-head">
        <h1>Products ({games.length})</h1>
        <div className="buttons">
          <button type="button" className="btn btn-outline" onClick={exportCsv}>
            Export CSV
          </button>
          <button type="button" className="btn btn-primary" onClick={() => setEditing('new')}>
            + Add product
          </button>
        </div>
      </div>
      <p className="muted small">Tip: click a price or stock value to change it.</p>

      <div className="toolbar">
        <input className="search" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="all">All types</option>
          <option value="game">Games</option>
          <option value="epin">Codes</option>
        </select>
        <select value={genre} onChange={(e) => setGenre(e.target.value)}>
          <option value="all">All categories</option>
          {meta.genres.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </select>
      </div>

      {selected.length > 0 && (
        <div className="bulk-bar">
          {selected.length} selected. Change price by <input type="number" value={percent} onChange={(e) => setPercent(e.target.value)} /> %{' '}
          <button type="button" className="btn btn-sm btn-primary" onClick={applyBulk}>
            Apply
          </button>{' '}
          <button type="button" className="btn-link" onClick={() => setSelected([])}>
            Clear selection
          </button>
        </div>
      )}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th />
              <th />
              <th>Title</th>
              <th>Type</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Sold</th>
              <th>Revenue</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {shown.map((game) => (
              <tr key={game.id} className={game.isActive ? '' : 'muted-row'}>
                <td>
                  <input type="checkbox" checked={selected.includes(game.id)} onChange={() => toggleSelect(game.id)} />
                </td>
                <td style={{ width: 90 }}>
                  <GameImage game={game} className="thumb" />
                </td>
                <td>
                  <Link to={`/games/${game.id}`}>{game.title}</Link>
                  {game.featured && <span className="badge badge-blue"> featured</span>}
                </td>
                <td>{game.type === 'game' ? 'Game' : 'Code'}</td>
                <td>{game.genre}</td>
                <td>
                  <InlineEdit
                    value={(game.priceCents / 100).toFixed(2)}
                    display={formatMoney(game.priceCents)}
                    step="0.01"
                    validate={priceError}
                    onSave={(t) => patch(game, { price: t })}
                  />
                  {game.discountPercent > 0 && <span className="badge badge-red">-{game.discountPercent}%</span>}
                </td>
                <td className={game.stock === 0 ? 'error-text' : game.lowStock ? 'warning-text' : ''}>
                  <InlineEdit value={game.stock} display={game.stock} validate={stockError} onSave={(t) => patch(game, { stock: Number(t) })} />
                </td>
                <td>{game.sales}</td>
                <td>{formatMoney(game.revenueCents)}</td>
                <td>
                  <button type="button" className={`btn btn-sm ${game.isActive ? 'btn-success' : 'btn-secondary'}`} onClick={() => toggleVisible(game)}>
                    {game.isActive ? 'Visible' : 'Hidden'}
                  </button>
                </td>
                <td>
                  <button type="button" className="btn-link" onClick={() => setEditing(game)}>
                    Edit
                  </button>
                  <button type="button" className="btn-link danger" onClick={() => remove(game)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <GameForm
          game={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload({ quiet: true });
          }}
        />
      )}
    </div>
  );
}
