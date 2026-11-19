import { requireSession } from '@/lib/duo';
import { todayISO } from '@/lib/day';
import { addTask, toggleTask, deleteTask } from '@/lib/actions';
import TickButton from '@/components/TickButton';
import { loadTasksForDay, occursOn } from '@/lib/tasks';

export const dynamic = 'force-dynamic';

const CATEGORIES = ['gym', 'meal', 'health', 'work', 'shopping', 'personal', 'couple', 'other'];

export default async function Calendar({ searchParams }: { searchParams: { d?: string } }) {
  const { duo, members, me } = await requireSession();
  const date = searchParams.d ?? todayISO();
  const plan = await loadTasksForDay(duo.id, date);
  const tasks = plan.all;

  const nameOf = (id: string | null) => (id === null ? 'Shared' : members.find((m) => m.user_id === id)?.display_name ?? 'Someone');
  const onDay = plan.onDay;
  const doneIds = plan.doneIds;
  const overdue = plan.overdue;
  // --- month grid -------------------------------------------------------
  const iso = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d, 12)).toISOString().slice(0, 10);
  const sel = new Date(date + 'T12:00:00');
  const year = sel.getFullYear();
  const month = sel.getMonth();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0, 12)).getUTCDate();
  const lead = (new Date(Date.UTC(year, month, 1, 12)).getUTCDay() + 6) % 7; // Monday first
  const today = todayISO();

  const cells: ({ d: string; day: number; count: number } | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const d = iso(year, month, i + 1);
      return { d, day: i + 1, count: tasks.filter((t) => occursOn(t, d)).length };
    })
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const monthLabel = sel.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  const prevMonth = iso(year, month - 1, 1);
  const nextMonth = iso(year, month + 1, 1);
  const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // The challenge window, so days inside it read differently from days outside.
  const endsOn = iso(
    new Date(duo.starts_on + 'T12:00:00').getUTCFullYear(),
    new Date(duo.starts_on + 'T12:00:00').getUTCMonth(),
    new Date(duo.starts_on + 'T12:00:00').getUTCDate() + duo.length_days - 1
  );

  return (
    <>
      <h1>Calendar</h1>

      <div className="card">
        <div className="row between" style={{ marginBottom: 10 }}>
          <a className="btn quiet tiny" href={`/calendar?d=${prevMonth}`} aria-label="Previous month">‹</a>
          <strong style={{ fontFamily: 'var(--font-display)', fontSize: 16 }}>{monthLabel}</strong>
          <a className="btn quiet tiny" href={`/calendar?d=${nextMonth}`} aria-label="Next month">›</a>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {WEEKDAYS.map((w) => (
            <div key={w} className="tiny muted" style={{ textAlign: 'center', paddingBottom: 4 }}>
              {w.slice(0, 1)}
            </div>
          ))}

          {cells.map((c, i) => {
            if (!c) return <div key={`pad-${i}`} />;
            const selected = c.d === date;
            const isToday = c.d === today;
            const inChallenge = c.d >= duo.starts_on && c.d <= endsOn;
            return (
              <a
                key={c.d}
                href={`/calendar?d=${c.d}`}
                aria-current={selected ? 'date' : undefined}
                style={{
                  textDecoration: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  aspectRatio: '1 / 1',
                  borderRadius: 12,
                  background: selected ? 'var(--player-surface)' : inChallenge ? 'var(--ivory)' : 'transparent',
                  border: isToday && !selected ? '1.5px solid var(--player)' : '1.5px solid transparent',
                  color: inChallenge || selected ? 'var(--ink)' : 'var(--ink-faint)',
                  fontWeight: selected || isToday ? 700 : 400
                }}
              >
                <span style={{ fontSize: 14, lineHeight: 1 }}>{c.day}</span>
                <span
                  aria-hidden
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: 999,
                    background: c.count ? 'var(--player)' : 'transparent'
                  }}
                />
                {c.count > 0 ? <span className="sr-only">{c.count} planned</span> : null}
              </a>
            );
          })}
        </div>

        {date !== today ? (
          <a className="btn quiet tiny block" href={`/calendar?d=${today}`} style={{ marginTop: 10 }}>
            Back to today
          </a>
        ) : null}
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
