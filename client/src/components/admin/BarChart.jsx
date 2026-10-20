// Simple horizontal bars made with divs. data = [{ label, value }]
export default function BarChart({ data, format = String }) {
  if (data.length === 0) return <p className="muted">No data.</p>;
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="bar-chart">
      {data.map((d) => (
        <div key={d.label} className="bar-row">
          <span className="bar-label" title={d.label}>
            {d.label}
          </span>
          <span className="bar-track">
            <span className="bar-fill" style={{ width: `${(d.value / max) * 100}%` }} />
          </span>
          <span className="bar-value">{format(d.value)}</span>
        </div>
      ))}
    </div>
  );
}
