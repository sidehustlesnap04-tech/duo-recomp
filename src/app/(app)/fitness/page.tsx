import { requireSession } from '@/lib/duo';
import { loadDay, todayISO } from '@/lib/day';
import { MEALS, SLOTS, SPLITS, SESSION_NAMES, ING, suggest } from '@/lib/plan';
import { swapMeal, logSet, addFood, removeFood, saveTargets, setSession } from '@/lib/actions';
import { Empty } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function Fitness({ searchParams }: { searchParams: { d?: string } }) {
  const { duo, me } = await requireSession();
  const date = searchParams.d ?? todayISO();
  const day = await loadDay(me!.user_id, duo.id, duo.starts_on, date);
  const t = day.targets;
  const setFor = (key: string, i: number) => day.sets.find((s: any) => s.exercise_key === key && s.set_index === i);

  return (
    <>
      <h1>Fitness</h1>

      {!t ? (
        <Empty title="Your targets are not set" body="Enter your real measurements and the app suggests calories, protein, carbs and fat. Every number stays editable." />
      ) : null}

      <details className="card" open={!t}>
        <summary><strong>Targets and plan</strong></summary>
        <form action={saveTargets} className="stack" style={{ marginTop: 12 }}>
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr' }}>
            <div className="field"><label htmlFor="display_name">Display name</label><input id="display_name" name="display_name" defaultValue={me!.display_name} /></div>
            <div className="field"><label htmlFor="mascot">Your character</label>
              <select id="mascot" name="mascot" defaultValue={me!.mascot}>
                <option value="fox">Fox</option><option value="rabbit">Rabbit</option>
              </select>
            </div>
            <div className="field"><label htmlFor="kcal">Calories</label><input id="kcal" name="kcal" type="number" step="50" defaultValue={t?.kcal ?? 2200} required /></div>
            <div className="field"><label htmlFor="protein_cap">Protein cap, g</label><input id="protein_cap" name="protein_cap" type="number" step="5" defaultValue={t?.protein_cap ?? 150} required /></div>
            <div className="field"><label htmlFor="protein_min">Protein minimum, g</label><input id="protein_min" name="protein_min" type="number" step="5" defaultValue={t?.protein_min ?? 130} required /></div>
            <div className="field"><label htmlFor="fat">Fat, g</label><input id="fat" name="fat" type="number" step="5" defaultValue={t?.fat ?? 60} required /></div>
            <div className="field"><label htmlFor="carbs">Carbs, g</label><input id="carbs" name="carbs" type="number" step="5" defaultValue={t?.carbs ?? 270} required /></div>
            <div className="field"><label htmlFor="water_l">Water, L</label><input id="water_l" name="water_l" type="number" step="0.1" defaultValue={t?.water_l ?? 3} required /></div>
            <div className="field"><label htmlFor="portion_scale">Portion scale</label><input id="portion_scale" name="portion_scale" type="number" step="0.01" defaultValue={t?.portion_scale ?? 1} required /></div>
            <div className="field"><label htmlFor="start_weight_kg">Starting weight, kg</label><input id="start_weight_kg" name="start_weight_kg" type="number" step="0.1" defaultValue={t?.start_weight_kg ?? ''} /></div>
          </div>
          <div className="field"><label htmlFor="split">Training split</label>
            <select id="split" name="split" defaultValue={t?.split ?? 'ul4'}>
              {Object.entries(SPLITS).map(([k, v]: any) => <option key={k} value={k}>{v.n}</option>)}
            </select>
          </div>
          <button className="btn player block" type="submit">Save targets</button>
          <p className="tiny muted">A medical limit, such as a protein cap from a doctor, goes in the cap field and the app never plans above it.</p>
        </form>
      </details>

      <div className="card">
        <div className="row between">
          <h2>{day.training ? `${day.sessionName} day` : 'Rest day'}</h2>
          <form action={async (fd: FormData) => { 'use server'; await setSession(date, String(fd.get('session'))); }}>
            <select name="session" defaultValue={day.session} onChange={undefined}>
              {Object.entries(SESSION_NAMES).map(([k, v]) => <option key={k} value={k}>{v as string}</option>)}
            </select>
            <button className="btn quiet tiny" type="submit">Change</button>
          </form>
        </div>
        <p className="tiny muted">{day.splitName}</p>

        {day.exercises.map((ex: any) => (
          <details key={ex.id} style={{ borderTop: '1px solid var(--line)', paddingTop: 10 }}>
            <summary>
              <strong>{ex.n}</strong>
              <span className="tiny muted"> · {ex.sets} × {ex.reps[0]}–{ex.reps[1]} · {ex.eq}</span>
            </summary>
            <div className="stack" style={{ marginTop: 10 }}>
              {Array.from({ length: ex.sets }).map((_, i) => {
                const s = setFor(ex.id, i + 1);
                return (
                  <form key={i} action={async (fd: FormData) => {
                    'use server';
                    await logSet(date, ex.id, i + 1, String(fd.get('w') ?? ''), String(fd.get('r') ?? ''), String(fd.get('rir') ?? ''));
                  }} style={{ display: 'grid', gridTemplateColumns: '22px 1fr 1fr 1fr auto', gap: 6, alignItems: 'center' }}>
                    <span className="tiny muted">{i + 1}</span>
                    <input name="w" type="number" step="0.5" inputMode="decimal" placeholder="kg" defaultValue={s?.weight_kg ?? ''} aria-label={`${ex.n} set ${i + 1} weight`} />
                    <input name="r" type="number" inputMode="numeric" placeholder="reps" defaultValue={s?.reps ?? ''} aria-label={`${ex.n} set ${i + 1} reps`} />
                    <input name="rir" type="number" inputMode="numeric" placeholder="left" defaultValue={s?.rir ?? ''} aria-label={`${ex.n} set ${i + 1} reps in reserve`} />
                    <button className="btn quiet tiny" type="submit">Save</button>
                  </form>
                );
              })}
              <p className="tiny muted"><strong>How:</strong> {ex.how}</p>
              <p className="tiny muted"><strong>Avoid:</strong> {ex.avoid}</p>
              <p className="tiny muted"><strong>If it is taken:</strong> {ex.alt}</p>
            </div>
          </details>
        ))}
        {!day.training ? <p className="small muted">Nothing scheduled. Recovery is worth the same 30 points as a session.</p> : null}
      </div>

      <div className="card">
        <h2>Meals for this day</h2>
        {day.menu.map(({ slot, mealId, meal, totals }) => (
          <div key={slot.id} style={{ borderTop: '1px solid var(--line)', paddingTop: 10 }}>
            <div className="tiny muted">{slot.n} · about {slot.kcal} kcal</div>
            <form action={async (fd: FormData) => { 'use server'; await swapMeal(date, slot.id, String(fd.get('meal'))); }} className="row" style={{ gap: 6 }}>
              <select name="meal" defaultValue={mealId} className="grow" aria-label={`Meal for ${slot.n}`}>
                {MEALS.filter((m) => m.cat === slot.id).map((m) => <option key={m.id} value={m.id}>{m.n}</option>)}
              </select>
              <button className="btn quiet tiny" type="submit">Swap</button>
            </form>
            <div className="tiny muted">
              {totals.kcal} kcal · {totals.p} g protein · {meal.items.map(([id, g]: [string, number]) => `${g} g ${ING[id].n.split(',')[0].toLowerCase()}`).join(', ')}
            </div>
            <p className="tiny muted">{meal.prep}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <h2>Anything else you ate</h2>
        <form action={async (fd: FormData) => { 'use server'; await addFood(date, fd); }} className="stack">
          <div className="field"><label htmlFor="ingredient">From the food list</label>
            <select id="ingredient" name="ingredient" defaultValue="">
              <option value="">—</option>
              {Object.entries(ING).map(([k, v]: any) => <option key={k} value={k}>{v.n} ({v.st})</option>)}
            </select>
          </div>
          <div className="field"><label htmlFor="grams">Grams</label><input id="grams" name="grams" type="number" inputMode="decimal" /></div>
          <p className="tiny muted">Or type it yourself:</p>
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr' }}>
            <div className="field"><label htmlFor="name">Food</label><input id="name" name="name" /></div>
            <div className="field"><label htmlFor="kcal2">Calories</label><input id="kcal2" name="kcal" type="number" inputMode="numeric" /></div>
            <div className="field"><label htmlFor="protein_g">Protein, g</label><input id="protein_g" name="protein_g" type="number" inputMode="decimal" /></div>
          </div>
          <button className="btn block" type="submit">Add</button>
        </form>
        {day.food.filter((f: any) => f.slot === 'other').map((f: any) => (
          <form key={f.id} action={async () => { 'use server'; await removeFood(f.id); }} className="row between" style={{ borderTop: '1px solid var(--line)', paddingTop: 8 }}>
            <div><div>{f.name}</div><div className="tiny muted">{f.grams ? `${f.grams} g · ` : ''}{Math.round(f.kcal)} kcal · {f.protein_g} g protein</div></div>
            <button className="btn quiet tiny" type="submit" style={{ color: 'var(--danger)' }}>Remove</button>
          </form>
        ))}
      </div>
    </>
  );
}
