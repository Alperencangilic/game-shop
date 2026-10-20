import { useState } from 'react';
import { api } from '../../api.js';
import { useConfirm } from '../../context/ConfirmContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useUnsavedChangesWarning } from '../../hooks/useBrowser.js';
import { useMeta } from '../../hooks/useMeta.js';
import { toDayString } from '../../utils/format.js';
import GameImage from '../GameImage.jsx';
import Modal from '../Modal.jsx';

function toForm(game) {
  const r = game?.requirements;
  return {
    title: game?.title ?? '',
    type: game?.type ?? 'game',
    developer: game?.developer ?? '',
    publisher: game?.publisher ?? '',
    genre: game?.genre ?? 'Action',
    description: game?.description ?? '',
    imageUrl: game?.imageUrl ?? '',
    platforms: game?.platforms ?? ['Windows'],
    releaseDate: game?.releaseDate ?? toDayString(new Date()),
    ageRating: game?.ageRating ?? 12,
    price: game ? (game.priceCents / 100).toFixed(2) : '',
    stock: game?.stock ?? 10,
    featured: game?.featured ?? false,
    isActive: game?.isActive ?? true,
    storageGb: r?.storageGb ?? 10,
    minOs: r?.minimum.os ?? 'Windows 10',
    minCpu: r?.minimum.cpu ?? '',
    minGpu: r?.minimum.gpu ?? '',
    minRam: r?.minimum.ramGb ?? 8,
    minVram: r?.minimum.vramGb ?? 2,
    recOs: r?.recommended.os ?? 'Windows 11',
    recCpu: r?.recommended.cpu ?? '',
    recGpu: r?.recommended.gpu ?? '',
    recRam: r?.recommended.ramGb ?? 16,
    recVram: r?.recommended.vramGb ?? 4,
  };
}

function toPayload(f) {
  const payload = {
    title: f.title,
    type: f.type,
    developer: f.developer,
    publisher: f.publisher,
    genre: f.genre,
    description: f.description,
    imageUrl: f.imageUrl,
    platforms: f.platforms,
    releaseDate: f.releaseDate,
    ageRating: Number(f.ageRating),
    price: f.price,
    stock: Number(f.stock),
    featured: f.featured,
    isActive: f.isActive,
  };
  if (f.type === 'game') {
    payload.requirements = {
      storageGb: Number(f.storageGb),
      minimum: { os: f.minOs, cpu: f.minCpu, gpu: f.minGpu, ramGb: Number(f.minRam), vramGb: Number(f.minVram) },
      recommended: { os: f.recOs, cpu: f.recCpu, gpu: f.recGpu, ramGb: Number(f.recRam), vramGb: Number(f.recVram) },
    };
  }
  return payload;
}

function validate(f) {
  const e = {};
  const isInt = (v) => String(v).trim() !== '' && Number.isInteger(Number(v));
  if (f.title.trim().length < 2) e.title = 'Title must be at least 2 characters.';
  if (!f.developer.trim()) e.developer = 'Developer is required.';
  if (!f.publisher.trim()) e.publisher = 'Publisher is required.';
  if (f.platforms.length === 0) e.platforms = 'Choose at least one platform.';
  if (f.imageUrl && !/^https?:\/\//.test(f.imageUrl)) e.imageUrl = 'Image URL must start with http:// or https://';
  const price = Number(f.price);
  if (f.price === '' || !Number.isFinite(price) || price < 0 || price > 999.99) e.price = 'Price must be between 0 and 999.99.';
  if (!isInt(f.stock) || f.stock < 0) e.stock = 'Stock must be a whole number (0 or more).';
  if (f.type === 'game') {
    if (!isInt(f.storageGb) || f.storageGb < 1) e.storageGb = 'Storage must be at least 1 GB.';
    if (!isInt(f.minRam) || !isInt(f.recRam) || Number(f.recRam) < Number(f.minRam)) e.ram = 'Recommended RAM cannot be lower than minimum.';
    if (!isInt(f.minVram) || !isInt(f.recVram) || Number(f.recVram) < Number(f.minVram)) e.vram = 'Recommended VRAM cannot be lower than minimum.';
  }
  return e;
}

export default function GameForm({ game, onClose, onSaved }) {
  const meta = useMeta();
  const toast = useToast();
  const confirm = useConfirm();
  const [initial] = useState(() => toForm(game));
  const [form, setForm] = useState(initial);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  const errors = validate(form);
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  useUnsavedChangesWarning(dirty);
  const err = (key) => submitted && errors[key] && <span className="error-text">{errors[key]}</span>;

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [key]: value });
    setServerError('');
  };
  const togglePlatform = (p) => setForm({ ...form, platforms: form.platforms.includes(p) ? form.platforms.filter((x) => x !== p) : [...form.platforms, p] });

  const requestClose = async () => {
    if (dirty) {
      const ok = await confirm({ title: 'Discard changes?', message: 'You have unsaved changes. Close without saving?', confirmLabel: 'Discard', tone: 'warning' });
      if (!ok) return;
    }
    onClose();
  };

  const submit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length > 0) {
      toast.warning('Please fix the errors in the form.');
      return;
    }
    setSaving(true);
    try {
      const data = game ? await api.put(`/admin/games/${game.id}`, toPayload(form)) : await api.post('/admin/games', toPayload(form));
      toast.success(data.message);
      onSaved();
    } catch (error) {
      setServerError(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={game ? `Edit: ${game.title}` : 'Add product'}
      onClose={requestClose}
      wide
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={requestClose}>
            Cancel
          </button>
          <button type="submit" form="game-form" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </>
      }
    >
      <form id="game-form" onSubmit={submit} noValidate>
        <div className="form-grid">
          <div className="form-group">
            <label>Type</label>
            <select value={form.type} onChange={set('type')}>
              <option value="game">Game</option>
              <option value="epin">Game code / gift card (e-pin)</option>
            </select>
          </div>
          <div className="form-group">
            <label>Title</label>
            <input value={form.title} onChange={set('title')} maxLength={120} />
            {err('title')}
          </div>
          <div className="form-group">
            <label>Developer</label>
            <input value={form.developer} onChange={set('developer')} />
            {err('developer')}
          </div>
          <div className="form-group">
            <label>Publisher</label>
            <input value={form.publisher} onChange={set('publisher')} />
            {err('publisher')}
          </div>
          <div className="form-group">
            <label>Category</label>
            <select value={form.genre} onChange={set('genre')}>
              {meta.genres.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Release date</label>
            <input type="date" value={form.releaseDate} onChange={set('releaseDate')} />
          </div>
          <div className="form-group">
            <label>Age rating (PEGI)</label>
            <select value={form.ageRating} onChange={set('ageRating')}>
              {meta.ageRatings.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Price (USD)</label>
            <input type="number" step="0.01" min="0" value={form.price} onChange={set('price')} />
            {err('price')}
          </div>
          <div className="form-group">
            <label>Stock (keys)</label>
            <input type="number" min="0" value={form.stock} onChange={set('stock')} />
            {err('stock')}
          </div>
          <div className="form-group">
            <label>Platforms</label>
            <div>
              {meta.platforms.map((p) => (
                <label key={p} className="check inline">
                  <input type="checkbox" checked={form.platforms.includes(p)} onChange={() => togglePlatform(p)} /> {p}
                </label>
              ))}
            </div>
            {err('platforms')}
          </div>
        </div>

        <div className="form-group">
          <label>Image URL</label>
          <input value={form.imageUrl} onChange={set('imageUrl')} placeholder="https://..." />
          {err('imageUrl')}
          {form.imageUrl && <GameImage game={{ ...form, title: form.title || 'Preview' }} className="preview" />}
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea rows={3} value={form.description} onChange={set('description')} maxLength={2000} />
        </div>
        <label className="check">
          <input type="checkbox" checked={form.isActive} onChange={set('isActive')} /> Visible in the store
        </label>
        <label className="check">
          <input type="checkbox" checked={form.featured} onChange={set('featured')} /> Featured on the home page
        </label>
        {!form.isActive && <p className="alert alert-warning">Hidden products cannot be bought. Customers who own it keep it.</p>}

        {form.type === 'game' && (
          <>
            <h4>System requirements</h4>
            <table className="table">
              <thead>
                <tr>
                  <th />
                  <th>Minimum</th>
                  <th>Recommended</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>OS</td>
                  <td><input value={form.minOs} onChange={set('minOs')} /></td>
                  <td><input value={form.recOs} onChange={set('recOs')} /></td>
                </tr>
                <tr>
                  <td>Processor</td>
                  <td><input value={form.minCpu} onChange={set('minCpu')} /></td>
                  <td><input value={form.recCpu} onChange={set('recCpu')} /></td>
                </tr>
                <tr>
                  <td>Graphics</td>
                  <td><input value={form.minGpu} onChange={set('minGpu')} /></td>
                  <td><input value={form.recGpu} onChange={set('recGpu')} /></td>
                </tr>
                <tr>
                  <td>RAM (GB)</td>
                  <td><input type="number" value={form.minRam} onChange={set('minRam')} /></td>
                  <td><input type="number" value={form.recRam} onChange={set('recRam')} /></td>
                </tr>
                <tr>
                  <td>VRAM (GB)</td>
                  <td><input type="number" value={form.minVram} onChange={set('minVram')} /></td>
                  <td><input type="number" value={form.recVram} onChange={set('recVram')} /></td>
                </tr>
                <tr>
                  <td>Storage (GB)</td>
                  <td colSpan={2}><input type="number" value={form.storageGb} onChange={set('storageGb')} /></td>
                </tr>
              </tbody>
            </table>
            {err('ram')}
            {err('vram')}
            {err('storageGb')}
          </>
        )}
        {serverError && <p className="alert alert-error">{serverError}</p>}
      </form>
    </Modal>
  );
}
