export function Ring({ value, max = 100, size = 76, label = 'today' }: { value: number; max?: number; size?: number; label?: string }) {
  const r = size / 2 - 6;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value / max));
  return (
    <div style={{ position: 'relative', width: size, height: size, flex: 'none' }} role="img" aria-label={`${label} ${value} of ${max}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth="7" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--player)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${(circ * pct).toFixed(1)} ${circ.toFixed(1)}`}
          style={{ transition: 'stroke-dasharray 0.6s cubic-bezier(.2,.8,.2,1)' }}
        />
      </svg>
      <b style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontFamily: 'var(--font-display)', fontSize: size / 3.4 }}>
        {value}
      </b>
    </div>
  );
}

export function Bar({ value, max, tone }: { value: number; max: number; tone?: 'good' | 'bad' }) {
  const pct = Math.max(0, Math.min(100, max ? (value / max) * 100 : 0));
  const colour = tone === 'bad' ? 'var(--danger)' : tone === 'good' ? 'var(--success)' : 'var(--player)';
  return (
    <div style={{ height: 8, borderRadius: 6, background: 'var(--ivory)', overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: colour, borderRadius: 6, transition: 'width 0.5s cubic-bezier(.2,.8,.2,1)' }} />
    </div>
  );
}

export function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{ background: 'var(--ivory)', border: '1px solid var(--line)', borderRadius: 14, padding: '10px 12px', minWidth: 0, flex: '1 1 110px' }}>
      <div className="tiny muted">{label}</div>
      <div className="num" style={{ fontSize: 22 }}>{value}</div>
      {sub ? <div className="tiny muted">{sub}</div> : null}
    </div>
  );
}

export function Empty({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="card" style={{ background: 'var(--lavender)', border: 'none', alignItems: 'flex-start' }}>
      <h3>{title}</h3>
      <p className="small">{body}</p>
      {action}
    </div>
  );
}

export function Skeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="card" aria-busy="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} style={{ height: 14, borderRadius: 7, background: 'var(--ivory)', width: i === lines - 1 ? '55%' : '100%' }} />
      ))}
    </div>
  );
}
