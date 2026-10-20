import { useMemo, useState } from 'react';
import { api } from '../../api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useMeta } from '../../hooks/useMeta.js';
import { formatMoney, toLocalInput } from '../../utils/format.js';
import Modal from '../Modal.jsx';

const DAY = 86400000;

export default function PromotionForm({ promotion, games, promotions, onClose, onSaved }) {
  const meta = useMeta();
  const toast = useToast();
  const [form, setForm] = useState(() => ({
    name: promotion?.name ?? '',
    target: promotion?.target ?? 'genre',
    genre: promotion?.genre ?? 'Action',
    gameId: promotion?.gameId ?? games[0]?.id ?? '',
    discountPercent: promotion?.discountPercent ?? 20,
    startsAt: toLocalInput(promotion?.startsAt ?? new Date()),
    endsAt: toLocalInput(promotion?.endsAt ?? new Date(Date.now() + 7 * DAY)),
  }));
  const [error, setError] = useState('');
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const start = new Date(form.startsAt);
  const end = new Date(form.endsAt);

  const affected = useMemo(() => {
    if (form.target === 'store') return games.filter((g) => g.isActive);
    if (form.target === 'genre') return games.filter((g) => g.isActive && g.genre === form.genre);
    return games.filter((g) => g.id === Number(form.gameId));
  }, [form.target, form.genre, form.gameId, games]);

  // other active promotions at the same time
  const overlaps = promotions.filter(
    (p) => p.id !== promotion?.id && p.status !== 'ended' && new Date(p.startsAt) < end && new Date(p.endsAt) > start && (p.target === 'store' || form.target === 'store' || p.genre === form.genre || affected.some((g) => g.id === p.gameId))
  );

  const submit = async (e) => {
    e.preventDefault();
    if (form.name.trim().length < 3) return setError('Name must be at least 3 characters.');
    if (!(end > start)) return setError('End date must be after the start date.');
    if (end <= new Date()) return setError('End date is in the past.');
    const payload = {
      name: form.name,
      target: form.target,
      genre: form.target === 'genre' ? form.genre : undefined,
      gameId: form.target === 'game' ? Number(form.gameId) : undefined,
      discountPercent: Number(form.discountPercent),
      startsAt: start.toISOString(),
      endsAt: end.toISOString(),
    };
    try {
      const result = promotion ? await api.put(`/admin/promotions/${promotion.id}`, payload) : await api.post('/admin/promotions', payload);
      toast.success(result.message);
      onSaved();
    } catch (err) {
      setError(err.message);
    }
  };

  const example = affected[0];
  return (
    <Modal
      title={promotion ? 'Edit promotion' : 'New promotion'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="promo-form" className="btn btn-primary">
            Save
          </button>
        </>
      }
    >
      <form id="promo-form" onSubmit={submit}>
        <div className="form-group">
          <label>Name</label>
          <input value={form.name} onChange={set('name')} placeholder="e.g. Weekend Sale" />
        </div>
        <div className="form-group">
          <label>Applies to</label>
          <select value={form.target} onChange={set('target')}>
            <option value="store">Whole store</option>
            <option value="genre">One category</option>
            <option value="game">One product</option>
          </select>
        </div>
        {form.target === 'genre' && (
          <div className="form-group">
            <label>Category</label>
            <select value={form.genre} onChange={set('genre')}>
              {meta.genres.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </div>
        )}
        {form.target === 'game' && (
          <div className="form-group">
            <label>Product</label>
            <select value={form.gameId} onChange={set('gameId')}>
              {games.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="form-group">
          <label>Discount: {form.discountPercent}%</label>
          <input type="range" min="1" max="90" value={form.discountPercent} onChange={set('discountPercent')} />
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label>Start</label>
            <input type="datetime-local" value={form.startsAt} onChange={set('startsAt')} />
          </div>
          <div className="form-group">
            <label>End</label>
            <input type="datetime-local" value={form.endsAt} onChange={set('endsAt')} />
          </div>
        </div>
        <p className="muted">
          {affected.length} products affected.
          {example && ` Example: ${example.title} ${formatMoney(example.priceCents)} → ${formatMoney(Math.round((example.priceCents * (100 - form.discountPercent)) / 100))}`}
        </p>
        {form.discountPercent > 60 && <p className="alert alert-warning">Warning: {form.discountPercent}% is a very big discount.</p>}
        {overlaps.length > 0 && (
          <p className="alert alert-info">
            Overlaps with: {overlaps.map((p) => p.name).join(', ')}. Customers only get the biggest discount.
          </p>
        )}
        {error && <p className="alert alert-error">{error}</p>}
      </form>
    </Modal>
  );
}
