import { formatMoney } from '../utils/format.js';

// Left sidebar on the store page. Values are kept in the URL by the Store page.
export default function Filters({ filters, onChange, onReset, genreCounts, platforms, priceLimit, showOwnedFilter }) {
  const toggle = (key, value) => {
    const list = filters[key];
    onChange(key, list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  return (
    <aside className="card sidebar">
      <div className="sidebar-head">
        <b>Filters</b>
        <button type="button" className="btn-link" onClick={onReset}>
          Reset
        </button>
      </div>

      <h4>Show</h4>
      {[
        ['all', 'Everything'],
        ['game', 'Games'],
        ['epin', 'Game codes & gift cards'],
      ].map(([value, label]) => (
        <label key={value} className="check">
          <input type="radio" name="type" checked={filters.type === value} onChange={() => onChange('type', value)} /> {label}
        </label>
      ))}

      <h4>Category</h4>
      {genreCounts.map(({ genre, count }) => (
        <label key={genre} className="check">
          <input type="checkbox" checked={filters.genres.includes(genre)} onChange={() => toggle('genres', genre)} /> {genre}{' '}
          <span className="muted">({count})</span>
        </label>
      ))}

      <h4>Platform</h4>
      {platforms.map((p) => (
        <label key={p} className="check">
          <input type="checkbox" checked={filters.platforms.includes(p)} onChange={() => toggle('platforms', p)} /> {p}
        </label>
      ))}

      <h4>Max price: {filters.maxPrice >= priceLimit ? 'any' : formatMoney(filters.maxPrice * 100)}</h4>
      <input type="range" min="0" max={priceLimit} value={Math.min(filters.maxPrice, priceLimit)} onChange={(e) => onChange('maxPrice', Number(e.target.value))} />

      <h4>Other</h4>
      <label className="check">
        <input type="checkbox" checked={filters.onSale} onChange={(e) => onChange('onSale', e.target.checked)} /> On sale
      </label>
      <label className="check">
        <input type="checkbox" checked={filters.inStock} onChange={(e) => onChange('inStock', e.target.checked)} /> Hide sold out
      </label>
      {showOwnedFilter && (
        <label className="check">
          <input type="checkbox" checked={filters.hideOwned} onChange={(e) => onChange('hideOwned', e.target.checked)} /> Hide games I own
        </label>
      )}
    </aside>
  );
}
