import { createClient } from '@/lib/supabase/server';
import {
  MEALS, SLOTS, PROGRAM, SPLITS, SESSION_NAMES, MODES,
  mealById, mealTotals, scaledMeal, cardioFor, sessionForDay, defaultMenuForDay,
  dayNumber, weekNumber
} from '@/lib/plan';

export const todayISO = () => new Date().toISOString().slice(0, 10);

export type Targets = {
  user_id: string; duo_id: string; kcal: number; protein_min: number; protein_cap: number;
  carbs: number; fat: number; water_l: number; split: string; portion_scale: number; start_weight_kg: number | null;
};

/** Everything one person's day needs, in one round trip each. */
export async function loadDay(userId: string, duoId: string, startsOn: string, date: string) {
  const supabase = createClient();
  const [{ data: targets }, { data: log }, { data: food }, { data: sets }, { data: body }, { data: score }] =
    await Promise.all([
      supabase.from('player_targets').select('*').eq('user_id', userId).eq('duo_id', duoId).maybeSingle(),
      supabase.from('day_logs').select('*').eq('user_id', userId).eq('log_date', date).maybeSingle(),
      supabase.from('food_entries').select('*').eq('user_id', userId).eq('log_date', date).order('created_at'),
      supabase.from('workout_sets').select('*').eq('user_id', userId).eq('log_date', date).order('set_index'),
      supabase.from('body_measurements').select('*').eq('user_id', userId).eq('taken_on', date).maybeSingle(),
      supabase.from('daily_scores').select('*').eq('user_id', userId).eq('score_date', date).maybeSingle()
    ]);

  const dayIdx = dayNumber(startsOn, date) - 1;
  const split = targets?.split ?? 'ul4';
  const scale = targets?.portion_scale ?? 1;
  const session = (log?.session as string) ?? sessionForDay(split, dayIdx);
  const checks = (log?.checks ?? {}) as Record<string, any>;
  const menuOverride = (checks.menu ?? {}) as Record<string, string>;
  const base = defaultMenuForDay(dayIdx);

  const menu = SLOTS.map((slot) => {
    const id = mealById(menuOverride[slot.id]) ? menuOverride[slot.id] : base[slot.id];
    const meal = scaledMeal(mealById(id), scale);
    const row = (food ?? []).find((f: any) => f.slot === slot.id && f.meal_key === id);
    return { slot, mealId: id, meal, totals: mealTotals(meal), logged: !!row, entryId: row?.id as string | undefined };
  });

  const totals = (food ?? []).reduce(
    (a: any, f: any) => ({
      kcal: a.kcal + Number(f.kcal), p: a.p + Number(f.protein_g),
      c: a.c + Number(f.carbs_g), f: a.f + Number(f.fat_g)
    }),
    { kcal: 0, p: 0, c: 0, f: 0 }
  );

  const week = weekNumber(startsOn, date);
  return {
    targets: targets as Targets | null,
    log, food: food ?? [], sets: sets ?? [], body, score,
    session, sessionName: SESSION_NAMES[session] ?? session,
    training: session !== 'rest',
    exercises: PROGRAM[session] ?? [],
    checks, menu, totals, week,
    cardio: cardioFor(week),
    dayIdx,
    schedule: (MODES[(checks.mode as string) ?? 'A'] ?? MODES.A).rows,
    splitName: (SPLITS[split] ?? SPLITS.ul4).n
  };
}

export { MEALS, SLOTS, SESSION_NAMES, PROGRAM, SPLITS, mealById, mealTotals, scaledMeal };
