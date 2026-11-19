import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/duo';
import { loadDay, todayISO } from '@/lib/day';
import { dayNumber } from '@/lib/plan';
import Mascot, { poseFor } from '@/components/Mascot';
import TickButton from '@/components/TickButton';
import { Ring, Bar, Stat, Empty } from '@/components/ui';
import InviteCard from '@/components/InviteCard';
import { toggleMeal, toggleWorkout, saveHabits } from '@/lib/actions';

export const dynamic = 'force-dynamic';

export default async function Today({ searchParams }: { searchParams: { d?: string } }) {
  const { duo, members, me } = await requireSession();
  const date = searchParams.d ?? todayISO();
  const supabase = createClient();

  const day = await loadDay(me!.user_id, duo.id, duo.starts_on, date);
  const { data: scores } = await supabase
    .from('daily_scores').select('user_id, points, bonus').eq('duo_id', duo.id).eq('score_date', date);
  const { data: allScores } = await supabase
    .from('daily_scores').select('user_id, points, bonus').eq('duo_id', duo.id);

  const scoreFor = (id: string) => {
    const r = (scores ?? []).find((s) => s.user_id === id);
    return r ? r.points + r.bonus : 0;
  };
  const totalFor = (id: string) =>
    (allScores ?? []).filter((s) => s.user_id === id).reduce((n, s) => n + s.points + s.bonus, 0);

  const n = dayNumber(duo.starts_on, date);
  const partner = members.find((m) => m.user_id !== me!.user_id);
  const t = day.targets;
  const workoutDone = !!day.checks[day.training ? 't_done' : 't_rest'];

  return (
    <>
      <div className="card tinted">
        <span className="tiny" style={{ letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>
          {n < 1 ? `Starts ${duo.starts_on}` : n > duo.length_days ? 'Challenge complete' : `Day ${n} of ${duo.length_days}`}
        </span>
        <div className="row between">
          <h1>{day.training ? `${day.sessionName} day` : 'Rest day'}</h1>
          <Ring value={scoreFor(me!.user_id)} max={110} />
        </div>
      </div>

      {!partner ? <InviteCard duoId={duo.id} /> : null}

      {partner ? (
        <div className="card" data-player={partner.mascot}>
          <div className="row between">
            <div className="row" style={{ gap: 10 }}>
              <Mascot animal={partner.mascot as 'fox' | 'rabbit'} pose={poseFor(scoreFor(partner.user_id), true)} size={52} />
              <div>
                <strong>{partner.display_name}</strong>
                <div className="tiny muted">{totalFor(partner.user_id).toLocaleString()} points so far</div>
              </div>
            </div>
            <Ring value={scoreFor(partner.user_id)} max={110} size={56} label="partner" />
          </div>
          <Link href="/race" className="tiny muted">See the race →</Link>
        </div>
      ) : null}

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
            <div className="row between tiny"><span className="muted">Protein · {t.protein_min}–{t.protein_cap} g</span><span className="num">{Math.round(day.totals.p)} / {t.protein_cap} g</span></div>
            <Bar value={day.totals.p} max={t.protein_cap} tone={day.totals.p > t.protein_cap + 0.5 ? 'bad' : undefined} />
          </div>
          {day.totals.p > t.protein_cap + 0.5 ? (
            <p className="notice bad">Above your protein limit of {t.protein_cap} g. Make the next meal fruit, bread, rice or vegetables.</p>
          ) : null}

          {day.menu.map(({ slot, mealId, meal, totals, logged }) => (
            <div key={slot.id} style={{ display: 'grid', gridTemplateColumns: '44px 1fr', gap: 12, alignItems: 'center', paddingTop: 10, borderTop: '1px solid var(--line)' }}>
              <form action={async () => { 'use server'; await toggleMeal(date, slot.id, mealId, logged); }}>
                <TickButton done={logged} label={meal.n} />
              </form>
              <div style={{ minWidth: 0 }}>
                <div className="tiny muted">{slot.n}</div>
                <div style={{ fontWeight: 600, textDecoration: logged ? 'line-through' : 'none', color: logged ? 'var(--ink-soft)' : undefined }}>{meal.n}</div>
                <div className="tiny muted">{totals.kcal} kcal · {totals.p} g protein</div>
              </div>
            </div>
          ))}
          <Link href="/fitness" className="tiny muted">Swap meals, add anything else →</Link>
        </div>
      )}

      <div className="card">
        <h2>{day.training ? day.sessionName : 'Rest'}</h2>
        <form action={async () => { 'use server'; await toggleWorkout(date, day.training, workoutDone); }}>
          <button className="btn block" type="submit" style={workoutDone ? { background: 'var(--mint)', borderColor: 'var(--jade)' } : undefined}>
            {workoutDone ? (day.training ? '✓ Workout done' : '✓ Rest day taken') : day.training ? 'Mark workout done' : 'Mark rest day taken'}
          </button>
        </form>
        {day.training ? (
          <Link href="/fitness" className="tiny muted">{day.exercises.length} exercises · log your sets →</Link>
        ) : (
          <p className="tiny muted">Recovery counts for the same 30 points as a workout.</p>
        )}
      </div>

      <form action={async (fd: FormData) => { 'use server'; await saveHabits(date, fd); }} className="card">
        <h2>Habits</h2>
        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr' }}>
          <div className="field"><label htmlFor="steps">Steps · goal {day.cardio.steps.toLocaleString()}</label><input id="steps" name="steps" type="number" inputMode="numeric" defaultValue={day.log?.steps ?? ''} /></div>
          <div className="field"><label htmlFor="sleep_h">Sleep, hours</label><input id="sleep_h" name="sleep_h" type="number" step="0.25" inputMode="decimal" defaultValue={day.log?.sleep_h ?? ''} /></div>
          <div className="field"><label htmlFor="water_l">Water, L · goal {t?.water_l ?? '—'}</label><input id="water_l" name="water_l" type="number" step="0.1" inputMode="decimal" defaultValue={day.log?.water_l ?? ''} /></div>
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
