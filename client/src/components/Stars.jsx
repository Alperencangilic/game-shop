export function Stars({ value, count }) {
  if (value === null || value === undefined) return <span className="muted small">No reviews yet</span>;
  const full = Math.round(value);
  return (
    <span className="stars" title={`${value} out of 5`}>
      {'★'.repeat(full)}
      {'☆'.repeat(5 - full)} <span className="muted">{Number(value).toFixed(1)}{count !== undefined && ` (${count})`}</span>
    </span>
  );
}

export function StarInput({ value, onChange }) {
  return (
    <div className="star-input">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" className={n <= value ? 'on' : ''} onClick={() => onChange(n)} aria-label={`${n} stars`}>
          ★
        </button>
      ))}
      <span className="muted small">{value ? `${value}/5` : 'Choose a rating'}</span>
    </div>
  );
}
