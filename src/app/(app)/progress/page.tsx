import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/duo';
import { Empty, Stat } from '@/components/ui';
import Line from '@/components/Chart';

export const dynamic = 'force-dynamic';

const LABELS: Record<string, string> = {
  weight: 'Weight, kg', body_fat: 'Body fat, %', waist: 'Waist, cm', steps: 'Steps',
  sleep: 'Sleep, hours', calories: 'Calories', protein: 'Protein, g', workout_volume: 'Workout volume, kg'
};

export default async function Progress() {
  const { duo, members, me } = await requireSession();
  const supabase = createClient();
  const [{ data: scores }, { data: shared }, { data: mineBody }, { data: prefs }] = await Promise.all([
    supabase.from('daily_scores').select('*').eq('duo_id', duo.id).order('score_date'),
    supabase.from('shared_metrics').select('*').eq('duo_id', duo.id).order('metric_date'),
    supabase.from('body_measurements').select('*').eq('user_id', me.user_id).order('taken_on'),
    supabase.from('sharing_prefs').select('*').eq('duo_id', duo.id)
  ]);

  const day = (d: string) => Math.round(new Date(d + 'T12:00:00').getTime() / 86400000);
  const colour = (mascot: string) => (mascot === 'fox' ? '#e0705a' : '#d9548f');

  const metricKeys = Array.from(new Set((shared ?? []).map((r) => r.metric_key)));
  const anyShared = metricKeys.length > 0;
  const partner = members.find((m) => m.user_id !== me.user_id);
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
            series={[{ name: 'you', colour: colour(me.mascot), points: (mineBody ?? []).filter((b) => b.weight_kg).map((b) => ({ x: day(b.taken_on), y: Number(b.weight_kg) })) }]}
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
