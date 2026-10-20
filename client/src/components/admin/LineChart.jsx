import { useState } from 'react';

const W = 700;
const H = 220;
const PAD = 40;

// Simple SVG line chart. data = [{ label, value }]
export default function LineChart({ data, format = String }) {
  const [hover, setHover] = useState(null);
  if (data.length === 0) return <p className="muted">No data.</p>;

  const max = Math.max(...data.map((d) => d.value), 1);
  const x = (i) => PAD + (data.length === 1 ? 0 : (i / (data.length - 1)) * (W - PAD * 2));
  const y = (v) => H - PAD - (v / max) * (H - PAD * 2);
  const points = data.map((d, i) => `${x(i)},${y(d.value)}`).join(' ');
  const every = Math.ceil(data.length / 7);

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="line-chart">
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="#999" />
        <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="#999" />
        <text x={PAD - 5} y={PAD + 4} textAnchor="end" fontSize="11">
          {format(max)}
        </text>
        <text x={PAD - 5} y={H - PAD} textAnchor="end" fontSize="11">
          0
        </text>
        <polyline points={points} fill="none" stroke="#2563eb" strokeWidth="2" />
        {data.map((d, i) => (
          <g key={d.label}>
            <circle cx={x(i)} cy={y(d.value)} r={hover === i ? 5 : 3} fill="#2563eb" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />
            {i % every === 0 && (
              <text x={x(i)} y={H - PAD + 16} textAnchor="middle" fontSize="11">
                {d.label.slice(5)}
              </text>
            )}
          </g>
        ))}
      </svg>
      <p className="small muted">{hover !== null ? `${data[hover].label}: ${format(data[hover].value)}` : 'Move the mouse over a point to see the value.'}</p>
    </div>
  );
}
