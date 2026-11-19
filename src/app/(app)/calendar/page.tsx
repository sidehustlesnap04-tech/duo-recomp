import { createClient } from '@/lib/supabase/server';
import { loadSession } from '@/lib/duo';
import { todayISO } from '@/lib/day';
import { addTask, toggleTask, deleteTask } from '@/lib/actions';
import TickButton from '@/components/TickButton';

export const dynamic = 'force-dynamic';

const CATEGORIES = ['gym', 'meal', 'health', 'work', 'shopping', 'personal', 'couple', 'other'];

function occursOn(t: any, date: string) {
  if (date < t.due_date) return false;
  if (t.repeat_until && date > t.repeat_until) return false;
  const days = Math.round((new Date(date + 'T12:00:00').getTime() - new Date(t.due_date + 'T12:00:00').getTime()) / 86400000);
  switch (t.recurrence) {
    case 'daily': return true;
    case 'weekly': return days % 7 === 0;
    case 'monthly': return new Date(date + 'T12:00:00').getDate() === new Date(t.due_date + 'T12:00:00').getDate();
    case 'custom': return days % Math.max(1, t.repeat_every ?? 1) === 0;
    default: return days === 0;
  }
}

export default async function Calendar({ searchParams }: { searchParams: { d?: string } }) {
  const { duo, members, me } = await loadSession();
  const date = searchParams.d ?? todayISO();
  const supabase = createClient();

  const [{ data: tasks }, { data: completions }] = await Promise.all([
    supabase.from('tasks').select('*').eq('duo_id', duo.id).order('due_time', { nullsFirst: false }),
    supabase.from('task_completions').select('*').eq('occurrence_date', date)
  ]);

  const nameOf = (id: string | null) => (id === null ? 'Shared' : members.find((m) => m.user_id === id)?.display_name ?? 'Someone');
  const onDay = (tasks ?? []).filter((t) => occursOn(t, date));
  const doneIds = new Set((completions ?? []).map((c) => c.task_id));
  const overdue = (tasks ?? []).filter(
    (t) => t.kind === 'task' && t.recurrence === 'none' && t.due_date < date && !doneIds.has(t.id)
  );
  const week = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(new Date(date + 'T12:00:00').getTime() + (i - 3) * 86400000).toISOString().slice(0, 10);
    return { d, count: (tasks ?? []).filter((t) => occursOn(t, d)).length };
  });

  return (
    <>
      <h1>Calendar</h1>

      <div className="card">
        <div className="row between">
          {week.map((w) => (
            <a key={w.d} href={`/calendar?d=${w.d}`} style={{
              textDecoration: 'none', textAlign: 'center', flex: 1, padding: '8px 2px', borderRadius: 12,
              background: w.d === date ? 'var(--player-surface)' : 'transparent'
            }}>
              <div className="tiny muted">{new Date(w.d + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short' })}</div>
              <div className="num">{new Date(w.d + 'T12:00:00').getDate()}</div>
              <div className="tiny muted">{w.count || ''}</div>
            </a>
          ))}
        </div>
      </div>

      {overdue.length ? (
        <div className="card">
          <h2 style={{ color: 'var(--warning)' }}>Overdue</h2>
          {overdue.map((t) => (
            <div key={t.id} className="row between" style={{ borderTop: '1px solid var(--line)', paddingTop: 8 }}>
              <div><strong>{t.title}</strong><div className="tiny muted">was due {t.due_date} · {nameOf(t.owner_id)}</div></div>
              <form action={async () => { 'use server'; await toggleTask(t.id, t.due_date, false); }}>
                <button className="btn quiet tiny" type="submit">Done</button>
              </form>
            </div>
          ))}
        </div>
      ) : null}

      <div className="card">
        <h2>{new Date(date + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
        {onDay.length === 0 ? <p className="small muted">Nothing planned. Add something below, or enjoy the quiet.</p> : null}
        {onDay.map((t) => {
          const done = doneIds.has(t.id);
          const mineOrShared = t.owner_id === null || t.owner_id === me!.user_id;
          return (
            <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '44px 1fr auto', gap: 12, alignItems: 'center', borderTop: '1px solid var(--line)', paddingTop: 10 }}>
              {mineOrShared ? (
                <form action={async () => { 'use server'; await toggleTask(t.id, date, done); }}><TickButton done={done} label={t.title} /></form>
              ) : <span style={{ width: 44, textAlign: 'center' }} className="tiny muted">—</span>}
              <div style={{ minWidth: 0 }}>
                <strong style={{ textDecoration: done ? 'line-through' : 'none' }}>{t.title}</strong>
                <div className="tiny muted">
                  {[t.due_time?.slice(0, 5), t.category, nameOf(t.owner_id), t.recurrence !== 'none' ? `repeats ${t.recurrence}` : null]
                    .filter(Boolean).join(' · ')}
                </div>
              </div>
              {mineOrShared ? (
                <form action={async () => { 'use server'; await deleteTask(t.id); }}>
                  <button className="btn quiet tiny" type="submit" style={{ color: 'var(--danger)' }}>Delete</button>
                </form>
              ) : null}
            </div>
          );
        })}
      </div>

      <form action={addTask} className="card">
        <h2>Add to this day</h2>
        <input type="hidden" name="due_date" value={date} />
        <div className="field"><label htmlFor="title">What</label><input id="title" name="title" required /></div>
        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr' }}>
          <div className="field"><label htmlFor="owner">Whose</label>
            <select id="owner" name="owner"><option value="me">Mine</option><option value="both">Shared</option></select>
          </div>
          <div className="field"><label htmlFor="kind">Kind</label>
            <select id="kind" name="kind"><option value="task">Task</option><option value="event">Event</option></select>
          </div>
          <div className="field"><label htmlFor="due_time">Time</label><input id="due_time" name="due_time" type="time" /></div>
          <div className="field"><label htmlFor="category">Category</label>
            <select id="category" name="category">{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select>
          </div>
          <div className="field"><label htmlFor="priority">Priority</label>
            <select id="priority" name="priority" defaultValue="2"><option value="3">High</option><option value="2">Medium</option><option value="1">Low</option></select>
          </div>
          <div className="field"><label htmlFor="recurrence">Repeats</label>
            <select id="recurrence" name="recurrence">
              <option value="none">Once</option><option value="daily">Daily</option>
              <option value="weekly">Weekly</option><option value="monthly">Monthly</option>
            </select>
          </div>
        </div>
        <button className="btn player block" type="submit">Add</button>
        <p className="tiny muted">Finishing all your own tasks for a day is worth 5 points; a shared task finished is worth 5 to both of you.</p>
      </form>
    </>
  );
}
