import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/duo';
import { setSharing, addGoal, setGoalStatus } from '@/lib/actions';

export const dynamic = 'force-dynamic';

const METRICS: [string, string][] = [
  ['weight', 'Weight'], ['body_fat', 'Body fat'], ['waist', 'Waist'],
  ['steps', 'Steps'], ['sleep', 'Sleep'], ['calories', 'Calories'],
  ['protein', 'Protein'], ['workout_volume', 'Workout volume']
];

export default async function Together() {
  const { duo, members, me } = await requireSession();
  const supabase = createClient();
  const [{ data: prefs }, { data: goals }] = await Promise.all([
    supabase.from('sharing_prefs').select('*').eq('duo_id', duo.id),
    supabase.from('shared_goals').select('*').eq('duo_id', duo.id).order('created_at', { ascending: false })
  ]);

  const mine = (key: string) => (prefs ?? []).find((p) => p.user_id === me!.user_id && p.metric_key === key)?.enabled ?? false;
  const partner = members.find((m) => m.user_id !== me!.user_id);
  const theirs = (key: string) =>
    partner ? ((prefs ?? []).find((p) => p.user_id === partner.user_id && p.metric_key === key)?.enabled ?? false) : false;

  return (
    <>
      <h1>Together</h1>

      <div className="card">
        <h2>What {partner ? partner.display_name : 'your partner'} can see</h2>
        <p className="small muted">
          Off by default. Switching one on shares that measurement&apos;s history; switching it off removes it again.
          Your food log, your sets and everything else stay private either way.
        </p>
        {METRICS.map(([key, label]) => (
          <form key={key} action={async () => { 'use server'; await setSharing(key, !mine(key)); }}
                className="row between" style={{ borderTop: '1px solid var(--line)', paddingTop: 10 }}>
            <div>
              <strong>{label}</strong>
              <div className="tiny muted">{theirs(key) ? `${partner?.display_name} shares theirs` : partner ? `${partner.display_name} keeps theirs private` : 'no partner yet'}</div>
            </div>
            <button className="btn" type="submit" style={mine(key) ? { background: 'var(--player-surface)', borderColor: 'var(--player)' } : undefined}>
              {mine(key) ? 'Shared' : 'Private'}
            </button>
          </form>
        ))}
      </div>

      <div className="card">
        <h2>Shared goals</h2>
        <form action={addGoal} className="stack">
          <div className="field"><label htmlFor="title">Something you both want</label><input id="title" name="title" required /></div>
          <div className="field"><label htmlFor="target_date">By when, if there is a date</label><input id="target_date" name="target_date" type="date" /></div>
          <button className="btn player block" type="submit">Add goal</button>
        </form>
        {(goals ?? []).length === 0 ? <p className="small muted">Nothing yet. A goal here belongs to both of you, and either can tick it off.</p> : null}
        {(goals ?? []).map((g) => (
          <form key={g.id} action={async () => { 'use server'; await setGoalStatus(g.id, g.status === 'done' ? 'open' : 'done'); }}
                className="row between" style={{ borderTop: '1px solid var(--line)', paddingTop: 10 }}>
            <div>
              <strong style={{ textDecoration: g.status === 'done' ? 'line-through' : 'none' }}>{g.title}</strong>
              {g.target_date ? <div className="tiny muted">by {g.target_date}</div> : null}
            </div>
            <button className="btn quiet" type="submit">{g.status === 'done' ? 'Undo' : 'Done'}</button>
          </form>
        ))}
      </div>
    </>
  );
}
