import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/duo';
import { loadDay, todayISO } from '@/lib/day';
import { dayNumber } from '@/lib/plan';
import Mascot, { poseFor } from '@/components/Mascot';
import TickButton from '@/components/TickButton';
import { Ring, Bar, Stat, Empty } from '@/components/ui';
import InviteCard from '@/components/InviteCard';
import { toggleMeal, toggleWorkout, saveHabits, toggleTask, setGoalStatus } from '@/lib/actions';
import { loadTasksForDay } from '@/lib/tasks';
import Celebrate from '@/components/Celebrate';

export const dynamic = 'force-dynamic';

export default async function Today({ searchParams }: { searchParams: { d?: string } }) {
  const { duo, members, me } = await requireSession();
  const date = searchParams.d ?? todayISO();
  const supabase = createClient();

  const [day, plan, { data: scores }, { data: allScores }, { data: goals }] = await Promise.all([
    loadDay(me.user_id, duo.id, duo.starts_on, date),
    loadTasksForDay(duo.id, date),
    supabase.from('daily_scores').select('user_id, points, bonus').eq('duo_id', duo.id).eq('score_date', date),
    supabase.from('daily_scores').select('user_id, points, bonus').eq('duo_id', duo.id),
    // Open shared goals that are due by today. A goal made for today was
    // only visible under More, which is not where anyone looks for it.
    supabase
      .from('shared_goals')
      .select('id, title, target_date, status')
      .eq('duo_id', duo.id)
      .eq('status', 'open')
      .lte('target_date', date)
      .order('target_date')
  ]);

  const scoreFor = (id: string) => {
    const r = (scores ?? []).find((s) => s.user_id === id);
    return r ? r.points + r.bonus : 0;
  };
  const totalFor = (id: string) =>
    (allScores ?? []).filter((s) => s.user_id === id).reduce((n, s) => n + s.points + s.bonus, 0);

  const n = dayNumber(duo.starts_on, date);
  const partner = members.find((m) => m.user_id !== me.user_id);
  const t = day.targets;
  const workoutDone = !!day.checks[day.training ? 't_done' : 't_rest'];
  const mealsLeft = day.menu.filter((m) => !m.logged).length;

  const myTasks = plan.onDay.filter((x) => x.owner_id === null || x.owner_id === me.user_id);
  const dueGoals = (goals ?? []) as { id: string; title: string; target_date: string; status: string }[];
  const tasksLeft = myTasks.filter((x) => !plan.doneIds.has(x.id)).length + dueGoals.length;

  // Everything the day asked for, actually done. Not a score threshold: a
  // finished day, which is what deserves the noise.
  const dayComplete = workoutDone && mealsLeft === 0 && tasksLeft === 0 && n >= 1 && n <= duo.length_days;

  const stage =
    n < 1
      ? `Starts ${new Date(duo.starts_on + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}`
      : n > duo.length_days
        ? 'Challenge complete'
        : `Day ${n} of ${duo.length_days}`;

  return (
    <>
      <section className="hero scene">
        <div className="hero-meta">{stage}</div>
        <div className="hero-main">
          <div style={{ minWidth: 0 }}>
            <h1>{day.training ? day.sessionName : 'Rest day'}</h1>
            <p className="hero-sub">
              {day.training
                ? `${day.exercises.length} exercises waiting`
                : 'Recovery scores the same as training'}
            </p>
          </div>
          <div className="scene" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div>
              <div className="float">
                <Mascot animal={me.mascot as 'fox' | 'rabbit'} pose={poseFor(scoreFor(me.user_id), workoutDone)} size={78} />
              </div>
              <span className="cast-shadow" style={{ width: 46 }} aria-hidden />
            </div>
            <div className="ring-3d">
              <Ring value={scoreFor(me.user_id)} max={110} size={82} />
            </div>
          </div>
        </div>
        <div className="hero-track" aria-hidden>
          <i style={{ width: `${Math.max(0, Math.min(100, (n / duo.length_days) * 100))}%` }} />
        </div>
      </section>

      <Celebrate fire={dayComplete} once={`${duo.id}:${date}`} />

      {dayComplete ? (
        <div className="cheer scene">
          <div>
            <div className="float">
              <Mascot animal={me.mascot as 'fox' | 'rabbit'} pose="victory" size={58} />
            </div>
            <span className="cast-shadow" style={{ width: 34 }} aria-hidden />
          </div>
          <div style={{ minWidth: 0 }}>
            <strong style={{ fontFamily: 'var(--font-display)', fontSize: 19 }}>Day {n}, finished.</strong>
            <p className="small muted">
              Every meal, the session and your tasks. {partner ? `${partner.display_name} can see it on the race.` : ''}
            </p>
          </div>
        </div>
      ) : null}

      {!partner ? <InviteCard duoId={duo.id} /> : null}

      {partner ? (
        <div className="card scene" data-player={partner.mascot}>
          <div className="row between">
            <div className="row" style={{ gap: 12 }}>
              <div>
                <div className="float lag">
                  <Mascot animal={partner.mascot as 'fox' | 'rabbit'} pose={poseFor(scoreFor(partner.user_id), true)} size={54} />
                </div>
                <span className="cast-shadow" style={{ width: 32 }} aria-hidden />
              </div>
              <div>
                <strong>{partner.display_name}</strong>
                <div className="tiny muted">{totalFor(partner.user_id).toLocaleString()} points so far</div>
              </div>
            </div>
            <div className="ring-3d">
              <Ring value={scoreFor(partner.user_id)} max={110} size={58} label="partner" />
            </div>
          </div>
          <Link href="/race" className="link-quiet">See the race</Link>
        </div>
      ) : null}

      <section className="card">
        <div className="card-head">
          <h2>Planned</h2>
          <span className="tiny faint">
            {tasksLeft ? `${tasksLeft} left` : myTasks.length ? 'All done' : null}
          </span>
        </div>

        {plan.overdue.length ? (
          <p className="notice">
            {plan.overdue.length === 1
              ? `“${plan.overdue[0].title}” was due ${plan.overdue[0].due_date} and is still open.`
              : `${plan.overdue.length} tasks from earlier days are still open.`}
          </p>
        ) : null}

        {dueGoals.map((g) => (
          <div key={g.id} className="tick-row" data-done="false">
            <form action={async () => { 'use server'; await setGoalStatus(g.id, 'done'); }}>
              <TickButton done={false} label={g.title} />
            </form>
            <div style={{ minWidth: 0 }}>
              <div className="tick-title">{g.title}</div>
              <div className="tick-meta">
                {g.target_date < date ? `Shared goal, due ${g.target_date}` : 'Shared goal, due today'}
              </div>
            </div>
            <span className="chip">Together</span>
          </div>
        ))}

        {plan.onDay.length === 0 && dueGoals.length === 0 ? (
          <p className="small muted">Nothing planned for today. Add something from the calendar, or take the quiet.</p>
        ) : null}

        {plan.onDay.length > 0 ? (
          plan.onDay.map((task) => {
            const done = plan.doneIds.has(task.id);
            const mine = task.owner_id === null || task.owner_id === me.user_id;
            const whose =
              task.owner_id === null
                ? 'Shared'
                : members.find((m) => m.user_id === task.owner_id)?.display_name ?? 'Someone';
            return (
              <div key={task.id} className="tick-row" data-done={done ? 'true' : 'false'}>
                {mine ? (
                  <form action={async () => { 'use server'; await toggleTask(task.id, date, done); }}>
                    <TickButton done={done} label={task.title} />
                  </form>
                ) : (
                  <span className="tiny faint" style={{ width: 44, textAlign: 'center' }}>—</span>
                )}
                <div style={{ minWidth: 0 }}>
                  <div className="tick-title">{task.title}</div>
                  <div className="tick-meta">
                    {task.due_time ? <span>{task.due_time.slice(0, 5)}&nbsp;&nbsp;</span> : null}
                    <span>{whose}</span>
                  </div>
                </div>
                {task.kind === 'event' ? <span className="chip">Event</span> : null}
              </div>
            );
          })
        ) : null}

        <Link href="/calendar" className="link-quiet">Open the calendar</Link>
      </section>

      {!t ? (
        <Empty
          title="Set your targets first"
          body="Nothing is scored until your calories and protein are set from your own measurements."
          action={<Link className="btn player" href="/fitness">Set them now</Link>}
        />
      ) : (
        <div className="card">
          <h2>Food</h2>
          <div>
            <div className="row between tiny"><span className="muted">Calories</span><span className="num">{Math.round(day.totals.kcal)} / {t.kcal}</span></div>
            <Bar value={day.totals.kcal} max={t.kcal} tone={day.totals.kcal > t.kcal * 1.07 ? 'bad' : undefined} />
          </div>
          <div>
            <div className="row between tiny"><span className="muted">Protein, {t.protein_min}–{t.protein_cap} g</span><span className="num">{Math.round(day.totals.p)} / {t.protein_cap} g</span></div>
            <Bar value={day.totals.p} max={t.protein_cap} tone={day.totals.p > t.protein_cap + 0.5 ? 'bad' : undefined} />
          </div>
          {day.totals.p > t.protein_cap + 0.5 ? (
            <p className="notice bad">Above your protein limit of {t.protein_cap} g. Make the next meal fruit, bread, rice or vegetables.</p>
          ) : null}

          {day.menu.map(({ slot, mealId, meal, totals, logged }) => (
            <div key={slot.id} className="tick-row" data-done={logged ? 'true' : 'false'} style={{ gridTemplateColumns: '44px 1fr' }}>
              <form action={async () => { 'use server'; await toggleMeal(date, slot.id, mealId, logged); }}>
                <TickButton done={logged} label={meal.n} />
              </form>
              <div style={{ minWidth: 0 }}>
                <div className="tiny faint">{slot.n}</div>
                <div className="tick-title">{meal.n}</div>
                <div className="tick-meta">{totals.kcal} kcal&nbsp;&nbsp;{totals.p} g protein</div>
              </div>
            </div>
          ))}
          <Link href="/fitness" className="link-quiet">Swap meals, or add something else</Link>
        </div>
      )}

      <div className="card">
        <h2>{day.training ? day.sessionName : 'Rest'}</h2>
        <form action={async () => { 'use server'; await toggleWorkout(date, day.training, workoutDone); }}>
          <button className={workoutDone ? 'btn block done' : 'btn block'} type="submit">
            {workoutDone ? (day.training ? '✓ Workout done' : '✓ Rest day taken') : day.training ? 'Mark workout done' : 'Mark rest day taken'}
          </button>
        </form>
        {day.training ? (
          <Link href="/fitness" className="link-quiet">Log your sets</Link>
        ) : (
          <p className="tiny muted">Recovery counts for the same 30 points as a workout.</p>
        )}
      </div>

      <form action={async (fd: FormData) => { 'use server'; await saveHabits(date, fd); }} className="card">
        <h2>Habits</h2>
        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr' }}>
          <div className="field"><label htmlFor="steps">Steps, goal {day.cardio.steps.toLocaleString()}</label><input id="steps" name="steps" type="number" inputMode="numeric" defaultValue={day.log?.steps ?? ''} /></div>
          <div className="field"><label htmlFor="sleep_h">Sleep, hours</label><input id="sleep_h" name="sleep_h" type="number" step="0.25" inputMode="decimal" defaultValue={day.log?.sleep_h ?? ''} /></div>
          <div className="field"><label htmlFor="water_l">Water in litres, goal {t?.water_l ?? '—'}</label><input id="water_l" name="water_l" type="number" step="0.1" inputMode="decimal" defaultValue={day.log?.water_l ?? ''} /></div>
          <div className="field"><label htmlFor="cardio_min">Cardio, minutes</label><input id="cardio_min" name="cardio_min" type="number" inputMode="numeric" defaultValue={day.log?.cardio_min ?? ''} /></div>
          <div className="field"><label htmlFor="weight_kg">Weight, kg</label><input id="weight_kg" name="weight_kg" type="number" step="0.1" inputMode="decimal" defaultValue={day.body?.weight_kg ?? ''} /></div>
          <div className="field"><label htmlFor="waist_cm">Waist, cm</label><input id="waist_cm" name="waist_cm" type="number" step="0.1" inputMode="decimal" defaultValue={day.body?.waist_cm ?? ''} /></div>
          <div className="field"><label htmlFor="body_fat_pct">Body fat, %</label><input id="body_fat_pct" name="body_fat_pct" type="number" step="0.1" inputMode="decimal" defaultValue={day.body?.body_fat_pct ?? ''} /></div>
        </div>
        <button className="btn player block" type="submit">Save</button>
        <p className="tiny muted">Weight, waist and body fat stay private unless you switch them on in Together.</p>
      </form>

      {day.score ? (
        <div className="card">
          <h2>How today scored</h2>
          <div className="row">
            <Stat label="Workout" value={`${day.score.components.workout ?? 0}/30`} />
            <Stat label="Calories" value={`${day.score.components.nutrition ?? 0}/30`} />
            <Stat label="Protein" value={`${day.score.components.protein ?? 0}/15`} />
            <Stat label="Steps" value={`${day.score.components.activity ?? 0}/15`} />
            <Stat label="Sleep" value={`${day.score.components.sleep ?? 0}/10`} />
            <Stat label="Tasks" value={`${day.score.bonus}/10`} />
          </div>
          <p className="tiny muted">Scored in the database from your own targets, not in this app.</p>
        </div>
      ) : null}
    </>
  );
}
