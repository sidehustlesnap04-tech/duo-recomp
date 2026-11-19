import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/duo';
import { todayISO } from '@/lib/day';
import { dayNumber } from '@/lib/plan';
import Mascot, { poseFor } from '@/components/Mascot';
import { Stat } from '@/components/ui';
import dynamicImport from 'next/dynamic';

// Three.js only loads on this screen, and only in the browser.
const RaceTrack3D = dynamicImport(() => import('@/components/RaceTrack3D'), {
  ssr: false,
  loading: () => <div style={{ height: 215 }} aria-busy="true" />
});

export const dynamic = 'force-dynamic';

const REWARDS = [
  'Pick the Friday meal', 'Loser makes breakfast', 'Winner picks the film', 'Coffee on the other',
  'Pick next week’s treat', 'Loser does the dishes', 'Winner picks the walk route', 'Breakfast in bed',
  'Pick the weekend plan', 'Loser carries the shopping', 'Winner picks dinner out', 'Celebrate the finish'
];

export default async function Race() {
  const { duo, members, me } = await requireSession();
  const supabase = createClient();
  const today = todayISO();
  const { data: rows } = await supabase
    .from('daily_scores').select('user_id, score_date, points, bonus').eq('duo_id', duo.id).order('score_date');

  const TRACK = duo.length_days * 110;
  const stats = members.map((m) => {
    const mine = (rows ?? []).filter((r) => r.user_id === m.user_id);
    const total = mine.reduce((n, r) => n + r.points + r.bonus, 0);
    const byDate = new Map(mine.map((r) => [r.score_date, r.points + r.bonus]));
    let streak = 0;
    for (let i = 0; i < 400; i++) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      const v = byDate.get(d) ?? 0;
      if (i === 0 && v < 70) continue;
      if (v >= 70) streak++;
      else break;
    }
    const weeks = Array.from({ length: 12 }).map((_, w) =>
      mine.filter((r) => {
        const n = dayNumber(duo.starts_on, r.score_date);
        return n > w * 7 && n <= (w + 1) * 7;
      }).reduce((n, r) => n + r.points + r.bonus, 0)
    );
    return { ...m, total, pct: Math.min(100, (total / TRACK) * 100), today: byDate.get(today) ?? 0, streak, weeks };
  });

  const leader = stats.length === 2 && stats[0].total !== stats[1].total
    ? (stats[0].total > stats[1].total ? stats[0] : stats[1]) : null;
  const gap = stats.length === 2 ? Math.abs(stats[0].total - stats[1].total) : 0;
  const n = dayNumber(duo.starts_on, today);
  const daysLeft = Math.max(0, duo.length_days - Math.max(0, n));

  return (
    <>
      <div className="row between">
        <h1>The race</h1>
        <span className="tiny muted">{n < 1 ? `starts ${duo.starts_on}` : `day ${Math.min(n, duo.length_days)} of ${duo.length_days}`}</span>
      </div>

      <div
        className="card"
        style={{
          padding: 0,
          overflow: 'hidden',
          position: 'relative',
          background: 'linear-gradient(180deg, var(--powder) 0%, var(--bg) 58%)'
        }}
      >
        <RaceTrack3D
          runners={stats.map((x) => ({
            user_id: x.user_id,
            display_name: x.display_name,
            mascot: x.mascot,
            total: x.total,
            pct: x.pct
          }))}
          dayPct={Math.max(0, Math.min(100, (Math.max(0, n) / duo.length_days) * 100))}
        />
        <div className="row between" style={{ padding: '0 var(--s4) var(--s4)' }}>
          {stats.map((x) => (
            <span key={x.user_id} className="chip" style={{ background: x.mascot === 'fox' ? 'var(--peach)' : 'var(--mint)', color: 'var(--ink)' }}>
              {x.display_name} {x.total.toLocaleString()}
            </span>
          ))}
          <span className="chip warn">today, week {Math.max(1, Math.ceil(Math.max(1, n) / 7))}</span>
        </div>
      </div>

      <div className="card">
        <h2>{leader ? `${leader.display_name} leads` : 'All square'}</h2>
        <p className="small">
          {!leader && stats.every((s) => s.total === 0)
            ? 'Nobody has scored yet. The first ticked day takes the lead.'
            : leader
              ? `${leader.display_name} is ${gap} points up. There are ${daysLeft * 110} points still on the track.`
              : `Level on ${stats[0]?.total ?? 0} points.`}
        </p>
        <div className="row">
          <Stat label="Days left" value={daysLeft} />
          {stats.map((s) => <Stat key={s.user_id} label={s.display_name} value={s.total.toLocaleString()} sub={`${s.pct.toFixed(1)}% · ${s.streak}-day streak`} />)}
        </div>
      </div>

      <div className="card">
        <h2>Weekly checkpoints</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: 6 }}>Week</th>
                {stats.map((s) => <th key={s.user_id} style={{ textAlign: 'right', padding: 6 }}>{s.display_name}</th>)}
                <th style={{ textAlign: 'left', padding: 6 }}>Reward</th>
              </tr>
            </thead>
            <tbody>
              {REWARDS.map((reward, w) => (
                <tr key={w} style={{ borderTop: '1px solid var(--line)' }}>
                  <th style={{ textAlign: 'left', padding: 6, fontWeight: 600 }}>W{w + 1}</th>
                  {stats.map((s) => (
                    <td key={s.user_id} style={{ textAlign: 'right', padding: 6, fontVariantNumeric: 'tabular-nums', color: s.weeks[w] >= 490 ? 'var(--success)' : undefined }}>
                      {s.weeks[w] || '—'}
                    </td>
                  ))}
                  <td style={{ padding: 6, color: 'var(--ink-soft)' }}>{reward}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="tiny muted">A checkpoint passes at 490 points in a week, an average of 70 a day.</p>
      </div>

      <div className="card">
        <h2>How points work</h2>
        <p className="small muted">
          Workout done or a rest day respected 30 · calories within 7% of your own target 30 · protein in your own
          range 15 · your step goal 15 · seven hours of sleep 10 · all your tasks 5 · a shared task 5. Everything is
          measured against each person&apos;s own targets, so different needs still give both of you 110 a day.
        </p>
      </div>
    </>
  );
}
