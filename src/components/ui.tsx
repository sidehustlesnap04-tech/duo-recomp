export function Ring({
  value,
  max = 100,
  size = 86,
  label = 'today'
}: {
  value: number;
  max?: number;
  size?: number;
  label?: string;
}) {
  const stroke = Math.max(6, Math.round(size / 11));
  const r = size / 2 - stroke / 2 - 1;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, max ? value / max : 0));
  return (
    <div
      style={{ position: 'relative', width: size, height: size, flex: 'none' }}
      role="img"
      aria-label={`${label} ${value} of ${max}`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(34,35,46,0.09)" strokeWidth={stroke} />
        {pct > 0 ? (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--player)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${(circ * pct).toFixed(1)} ${circ.toFixed(1)}`}
            style={{ transition: 'stroke-dasharray 0.7s cubic-bezier(.2,.8,.2,1)' }}
          />
        ) : null}
      </svg>
      <span
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: Math.round(size / 3.1),
          letterSpacing: '-0.02em'
        }}
      >
        {value}
      </span>
    </div>
  );
}

export function Bar({ value, max, tone }: { value: number; max: number; tone?: 'good' | 'bad' }) {
  const pct = Math.max(0, Math.min(100, max ? (value / max) * 100 : 0));
  const colour = tone === 'bad' ? 'var(--danger)' : tone === 'good' ? 'var(--success)' : 'var(--player)';
  return (
    <div style={{ height: 9, borderRadius: 999, background: 'rgba(34,35,46,0.07)', overflow: 'hidden' }}>
      <div
        style={{
          width: `${pct}%`,
          height: '100%',
          borderRadius: 999,
          background: colour,
          transition: 'width 0.55s cubic-bezier(.2,.8,.2,1)'
        }}
      />
    </div>
  );
}

export function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div
      style={{
        background: 'var(--paper-sunk)',
        borderRadius: 'var(--r-md)',
        padding: '12px 14px',
        minWidth: 0,
        flex: '1 1 104px'
      }}
    >
      <div className="tiny muted">{label}</div>
      <div className="num" style={{ fontSize: 21, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
        {value}
      </div>
      {sub ? <div className="tiny faint">{sub}</div> : null}
    </div>
  );
}

export function Empty({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="card" style={{ background: 'var(--lavender)', boxShadow: 'none', alignItems: 'flex-start' }}>
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
        <div
          key={i}
          style={{
            height: 14,
            borderRadius: 999,
            background: 'var(--paper-sunk)',
            width: i === lines - 1 ? '55%' : '100%'
          }}
        />
      ))}
    </div>
  );
}
