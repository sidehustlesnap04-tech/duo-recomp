/* A small time series: filled area, one line per person, and only the
   latest reading marked. Its own module so a preview renders the same
   component the page does, rather than a copy of it. */

export default function Line({ series, label }: { series: { name: string; colour: string; points: { x: number; y: number }[] }[]; label: string }) {
  const all = series.flatMap((s) => s.points.map((p) => p.y));
  if (!all.length) return null;

  const lo = Math.min(...all), hi = Math.max(...all);
  const pad = Math.max(0.5, (hi - lo) * 0.18);
  const min = lo - pad, max = hi + pad;
  const xs = series.flatMap((s) => s.points.map((p) => p.x));
  const x0 = Math.min(...xs), x1 = Math.max(...xs, x0 + 1);

  const L = 40, R = 352, T = 12, B = 104;
  const X = (x: number) => L + ((x - x0) / (x1 - x0)) * (R - L);
  const Y = (y: number) => B - ((y - min) / (max - min)) * (B - T);
  const uid = label.replace(/[^a-zA-Z0-9]+/g, '');
  // Two filled areas overlap and the overlap reads as a third value, so the
  // fill is for a single series only. More than one gets lines and a legend.
  const many = series.length > 1;

  const chart = (
    <svg viewBox="0 0 360 126" style={{ width: '100%', height: 'auto', display: 'block' }} role="img" aria-label={label}>
      <defs>
        {series.map((s, i) => (
          <linearGradient key={i} id={uid + '-' + i} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={s.colour} stopOpacity="0.26" />
            <stop offset="100%" stopColor={s.colour} stopOpacity="0" />
          </linearGradient>
        ))}
      </defs>

      {/* Three reference lines, labelled, and nothing else behind the data. */}
      {[0, 0.5, 1].map((f) => {
        const v = min + f * (max - min);
        return (
          <g key={f}>
            <line x1={L} x2={R} y1={Y(v)} y2={Y(v)} stroke="var(--line)" strokeWidth="1" />
            <text x={L - 6} y={Y(v) + 3.5} textAnchor="end" fontSize="9" fill="var(--ink-faint)">
              {Math.abs(v) >= 100 ? Math.round(v) : v.toFixed(1)}
            </text>
          </g>
        );
      })}

      {series.map((s, i) => {
        if (!s.points.length) return null;
        const path = s.points.map((p) => X(p.x).toFixed(1) + ',' + Y(p.y).toFixed(1)).join(' L');
        const last = s.points[s.points.length - 1];
        return (
          <g key={s.name}>
            {/* The filled area is what gives a short line any presence. */}
            {!many && s.points.length > 1 ? (
              <path
                d={'M' + path + ' L' + X(last.x).toFixed(1) + ',' + B + ' L' + X(s.points[0].x).toFixed(1) + ',' + B + ' Z'}
                fill={'url(#' + uid + '-' + i + ')'}
              />
            ) : null}
            {s.points.length > 1 ? (
              <path d={'M' + path} fill="none" stroke={s.colour} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            ) : null}
            {/* Only the latest reading is marked: a dot on every point turns
                the line into a bead necklace and hides its shape. */}
            <circle cx={X(last.x)} cy={Y(last.y)} r="4.5" fill={s.colour} stroke="var(--paper)" strokeWidth="2.5" />
          </g>
        );
      })}
    </svg>
  );

  if (!many) return chart;

  return (
    <div>
      {chart}
      <div className="row" style={{ gap: 14, marginTop: 6 }}>
        {series.map((s) => (
          <span key={s.name} className="row" style={{ gap: 6 }}>
            <span
              aria-hidden
              style={{ width: 9, height: 9, borderRadius: 999, background: s.colour, display: 'inline-block' }}
            />
            <span className="tiny muted">{s.name}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
