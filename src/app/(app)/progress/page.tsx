import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/duo';
import { Empty, Stat } from '@/components/ui';

export const dynamic = 'force-dynamic';

const LABELS: Record<string, string> = {
  weight: 'Weight, kg', body_fat: 'Body fat, %', waist: 'Waist, cm', steps: 'Steps',
  sleep: 'Sleep, hours', calories: 'Calories', protein: 'Protein, g', workout_volume: 'Workout volume, kg'
};

function Line({ series, label }: { series: { name: string; colour: string; points: { x: number; y: number }[] }[]; label: string }) {
  const all = series.flatMap((s) => s.points.map((p) => p.y));
  if (!all.length) return null;
  const lo = Math.min(...all), hi = Math.max(...all);
  const pad = Math.max(0.5, (hi - lo) * 0.15);
  const min = lo - pad, max = hi + pad;
  const xs = series.flatMap((s) => s.points.map((p) => p.x));
  const x0 = Math.min(...xs), x1 = Math.max(...xs, x0 + 1);
  const X = (x: number) => 44 + ((x - x0) / (x1 - x0)) * 300;
  const Y = (y: number) => 110 - ((y - min) / (max - min)) * 86;
  return (
    <svg viewBox="0 0 360 130" style={{ width: '100%', height: 'auto' }} role="img" aria-label={label}>
      {[0, 0.5, 1].map((f) => (
        <g key={f}>
          <line x1="44" x2="344" y1={Y(min + f * (max - min))} y2={Y(min + f * (max - min))} stroke="var(--line)" />
          <text x="38" y={Y(min + f * (max - min)) + 4} textAnchor="end" fontSize="9" fill="var(--ink-faint)">
            {(min + f * (max - min)).toFixed(1)}
          </text>
        </g>
      ))}
      {series.map((s) => (
        <g key={s.name}>
          {s.points.length > 1 ? (
            <path d={'M' + s.points.map((p) => `${X(p.x)},${Y(p.y)}`).join(' L')} fill="none" stroke={s.colour} strokeWidth="2.5" strokeLinejoin="round" />
          ) : null}
          {s.points.map((p, i) => <circle key={i} cx={X(p.x)} cy={Y(p.y)} r="3" fill={s.colour} />)}
        </g>
      ))}
    </svg>
  );
}

export default async function Progress() {
  const { duo, members, me } = await requireSession();
  const supabase = createClient();
  const [{ data: scores }, { data: shared }, { data: mineBody }, { data: prefs }] = await Promise.all([
    supabase.from('daily_scores').select('*').eq('duo_id', duo.id).order('score_date'),
    supabase.from('shared_metrics').select('*').eq('duo_id', duo.id).order('metric_date'),
    supabase.from('body_measurements').select('*').eq('user_id', me!.user_id).order('taken_on'),
    supabase.from('sharing_prefs').select('*').eq('duo_id', duo.id)
  ]);

  const day = (d: string) => Math.round(new Date(d + 'T12:00:00').getTime() / 86400000);
  const colour = (mascot: string) => (mascot === 'fox' ? '#e08268' : '#5fa98a');

  const metricKeys = Array.from(new Set((shared ?? []).map((r) => r.metric_key)));
  const anyShared = metricKeys.length > 0;
  const partner = members.find((m) => m.user_id !== me!.user_id);
  const partnerShares = (prefs ?? []).some((p) => partner && p.user_id === partner.user_id && p.enabled);

  return (
    <>
      <h1>Progress</h1>

      <div className="card">
        <h2>Daily scores</h2>
        <Line
          label="Daily scores for both players"
          series={members.map((m) => ({
            name: m.display_name,
            colour: colour(m.mascot),
            points: (scores ?? []).filter((s) => s.user_id === m.user_id).map((s) => ({ x: day(s.score_date), y: s.points + s.bonus }))
          }))}
        />
        <div className="row">
          {members.map((m) => (
            <Stat
              key={m.user_id}
              label={m.display_name}
              value={(scores ?? []).filter((s) => s.user_id === m.user_id).reduce((n, s) => n + s.points + s.bonus, 0).toLocaleString()}
              sub={`${(scores ?? []).filter((s) => s.user_id === m.user_id).length} days logged`}
            />
          ))}
        </div>
        {!(scores ?? []).length ? <p className="small muted">Nothing scored yet. Tick a day on Today and it appears here.</p> : null}
      </div>

      <div className="card">
        <h2>Your own measurements</h2>
        <p className="tiny muted">Private to you unless you share a metric in Together.</p>
        {(mineBody ?? []).length ? (
          <Line
            label="Your weight over time"
            series={[{ name: 'you', colour: colour(me!.mascot), points: (mineBody ?? []).filter((b) => b.weight_kg).map((b) => ({ x: day(b.taken_on), y: Number(b.weight_kg) })) }]}
          />
        ) : (
          <p className="small muted">No measurements yet. Add weight, waist or body fat on Today.</p>
        )}
      </div>

      {anyShared ? (
        metricKeys.map((key) => (
          <div key={key} className="card">
            <h2>{LABELS[key] ?? key}</h2>
            <Line
              label={`${LABELS[key] ?? key} for whoever shares it`}
              series={members
                .filter((m) => (shared ?? []).some((r) => r.user_id === m.user_id && r.metric_key === key))
                .map((m) => ({
                  name: m.display_name,
                  colour: colour(m.mascot),
                  points: (shared ?? []).filter((r) => r.user_id === m.user_id && r.metric_key === key).map((r) => ({ x: day(r.metric_date), y: Number(r.value) }))
                }))}
            />
            <div className="row">
              {members.filter((m) => (shared ?? []).some((r) => r.user_id === m.user_id && r.metric_key === key)).map((m) => (
                <span key={m.user_id} className="tiny" style={{ color: colour(m.mascot), fontWeight: 700 }}>{m.display_name}</span>
              ))}
            </div>
          </div>
        ))
      ) : (
        <Empty
          title="No trends are shared yet"
          body={partnerShares ? 'Your partner shares something, but you are not sharing anything back yet.' : 'Neither of you has switched a measurement on. Shared trends appear here the moment one of you does.'}
        />
      )}
    </>
  );
}
