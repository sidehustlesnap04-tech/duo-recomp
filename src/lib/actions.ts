'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { mealById, mealTotals, scaledMeal, itemMacros, ING } from '@/lib/plan';

async function me() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('not signed in');
  const { data: m } = await supabase.from('duo_members').select('duo_id').eq('user_id', user.id).limit(1).maybeSingle();
  return { supabase, userId: user.id, duoId: m?.duo_id as string | undefined };
}

async function ensureDay(supabase: any, userId: string, duoId: string, date: string) {
  const { data } = await supabase.from('day_logs').select('*').eq('user_id', userId).eq('log_date', date).maybeSingle();
  if (data) return data;
  const { data: created } = await supabase
    .from('day_logs').insert({ user_id: userId, duo_id: duoId, log_date: date }).select().single();
  return created;
}

export async function toggleMeal(date: string, slotId: string, mealId: string, logged: boolean) {
  const { supabase, userId, duoId } = await me();
  if (!duoId) return;
  await ensureDay(supabase, userId, duoId, date);

  if (logged) {
    await supabase.from('food_entries').delete().eq('user_id', userId).eq('log_date', date).eq('slot', slotId).eq('meal_key', mealId);
  } else {
    const { data: t } = await supabase.from('player_targets').select('portion_scale').eq('user_id', userId).eq('duo_id', duoId).maybeSingle();
    const meal = scaledMeal(mealById(mealId), t?.portion_scale ?? 1);
    const totals = mealTotals(meal);
    await supabase.from('food_entries').insert({
      user_id: userId, log_date: date, slot: slotId, meal_key: mealId, name: mealById(mealId)!.n,
      grams: meal.items.reduce((n: number, [, g]: [string, number]) => n + g, 0),
      kcal: totals.kcal, protein_g: totals.p, carbs_g: totals.c, fat_g: totals.f
    });
  }
  revalidatePath('/', 'layout');
}

export async function swapMeal(date: string, slotId: string, mealId: string) {
  const { supabase, userId, duoId } = await me();
  if (!duoId) return;
  const day = await ensureDay(supabase, userId, duoId, date);
  const checks = { ...(day.checks ?? {}) };
  checks.menu = { ...(checks.menu ?? {}), [slotId]: mealId };
  await supabase.from('day_logs').update({ checks }).eq('id', day.id);
  await supabase.from('food_entries').delete().eq('user_id', userId).eq('log_date', date).eq('slot', slotId);
  revalidatePath('/', 'layout');
}

export async function toggleWorkout(date: string, training: boolean, done: boolean) {
  const { supabase, userId, duoId } = await me();
  if (!duoId) return;
  const day = await ensureDay(supabase, userId, duoId, date);
  const key = training ? 't_done' : 't_rest';
  const checks = { ...(day.checks ?? {}) };
  if (done) delete checks[key];
  else checks[key] = true;
  await supabase.from('day_logs').update({ checks }).eq('id', day.id);
  revalidatePath('/', 'layout');
}

export async function setSession(date: string, session: string) {
  const { supabase, userId, duoId } = await me();
  if (!duoId) return;
  const day = await ensureDay(supabase, userId, duoId, date);
  await supabase.from('day_logs').update({ session }).eq('id', day.id);
  revalidatePath('/', 'layout');
}

export async function saveHabits(date: string, formData: FormData) {
  const { supabase, userId, duoId } = await me();
  if (!duoId) return;
  const day = await ensureDay(supabase, userId, duoId, date);
  const n = (k: string) => {
    const v = formData.get(k);
    if (v === null || String(v).trim() === '') return null;
    const x = Number(v);
    return Number.isFinite(x) ? x : null;
  };
  await supabase.from('day_logs').update({
    steps: n('steps'), sleep_h: n('sleep_h'), water_l: n('water_l'), cardio_min: n('cardio_min')
  }).eq('id', day.id);

  const weight = n('weight_kg'), waist = n('waist_cm'), bf = n('body_fat_pct');
  if (weight !== null || waist !== null || bf !== null) {
    await supabase.from('body_measurements').upsert(
      { user_id: userId, taken_on: date, weight_kg: weight, waist_cm: waist, body_fat_pct: bf },
      { onConflict: 'user_id,taken_on' }
    );
  }
  revalidatePath('/', 'layout');
}

export async function logSet(date: string, exerciseKey: string, index: number, weight: string, reps: string, rir: string) {
  const { supabase, userId, duoId } = await me();
  if (!duoId) return;
  await ensureDay(supabase, userId, duoId, date);
  const num = (v: string) => (v.trim() === '' ? null : Number(v));
  if (num(weight) === null && num(reps) === null) {
    await supabase.from('workout_sets').delete()
      .eq('user_id', userId).eq('log_date', date).eq('exercise_key', exerciseKey).eq('set_index', index);
  } else {
    await supabase.from('workout_sets').upsert(
      { user_id: userId, log_date: date, exercise_key: exerciseKey, set_index: index,
        weight_kg: num(weight), reps: num(reps), rir: num(rir) },
      { onConflict: 'user_id,log_date,exercise_key,set_index' }
    );
  }
  revalidatePath('/', 'layout');
}

export async function addFood(date: string, formData: FormData) {
  const { supabase, userId, duoId } = await me();
  if (!duoId) return;
  await ensureDay(supabase, userId, duoId, date);
  const ingredient = String(formData.get('ingredient') ?? '');
  const grams = Number(formData.get('grams') ?? 0);

  if (ingredient && grams > 0 && ING[ingredient]) {
    const x = itemMacros(ingredient, grams);
    await supabase.from('food_entries').insert({
      user_id: userId, log_date: date, slot: 'other', name: ING[ingredient].n,
      grams, kcal: Math.round(x.kcal), protein_g: Math.round(x.p * 10) / 10,
      carbs_g: Math.round(x.c * 10) / 10, fat_g: Math.round(x.f * 10) / 10
    });
  } else {
    const name = String(formData.get('name') ?? '').trim();
    const kcal = Number(formData.get('kcal') ?? 0);
    if (!name || !kcal) return;
    await supabase.from('food_entries').insert({
      user_id: userId, log_date: date, slot: 'other', name,
      kcal, protein_g: Number(formData.get('protein_g') ?? 0), carbs_g: 0, fat_g: 0
    });
  }
  revalidatePath('/', 'layout');
}

export async function removeFood(entryId: string) {
  const { supabase } = await me();
  await supabase.from('food_entries').delete().eq('id', entryId);
  revalidatePath('/', 'layout');
}

export async function setSharing(metricKey: string, enabled: boolean) {
  const { supabase, userId, duoId } = await me();
  if (!duoId) return;
  await supabase.from('sharing_prefs').upsert(
    { user_id: userId, duo_id: duoId, metric_key: metricKey, enabled, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,duo_id,metric_key' }
  );
  revalidatePath('/', 'layout');
}

export async function saveTargets(formData: FormData) {
  const { supabase, userId, duoId } = await me();
  if (!duoId) return;
  const n = (k: string, d = 0) => Number(formData.get(k) ?? d);
  await supabase.from('player_targets').upsert(
    {
      user_id: userId, duo_id: duoId, kcal: n('kcal'), protein_min: n('protein_min'),
      protein_cap: n('protein_cap'), carbs: n('carbs'), fat: n('fat'), water_l: n('water_l'),
      split: String(formData.get('split') ?? 'ul4'), portion_scale: n('portion_scale', 1),
      start_weight_kg: n('start_weight_kg') || null
    },
    { onConflict: 'user_id,duo_id' }
  );
  const mascot = String(formData.get('mascot') ?? '');
  const displayName = String(formData.get('display_name') ?? '').trim();
  const patch: Record<string, string> = {};
  if (mascot === 'fox' || mascot === 'rabbit') patch.mascot = mascot;
  if (displayName) patch.display_name = displayName;
  if (Object.keys(patch).length) await supabase.from('profiles').update(patch).eq('id', userId);
  revalidatePath('/', 'layout');
}

export async function addTask(formData: FormData) {
  const { supabase, userId, duoId } = await me();
  if (!duoId) return;
  const title = String(formData.get('title') ?? '').trim();
  if (!title) return;
  const shared = String(formData.get('owner') ?? 'me') === 'both';
  await supabase.from('tasks').insert({
    duo_id: duoId, owner_id: shared ? null : userId, created_by: userId,
    kind: String(formData.get('kind') ?? 'task'), title,
    category: String(formData.get('category') ?? 'personal'),
    priority: Number(formData.get('priority') ?? 2),
    due_date: String(formData.get('due_date') ?? new Date().toISOString().slice(0, 10)),
    due_time: String(formData.get('due_time') ?? '') || null,
    recurrence: String(formData.get('recurrence') ?? 'none')
  });
  revalidatePath('/', 'layout');
}

export async function toggleTask(taskId: string, date: string, done: boolean) {
  const { supabase, userId } = await me();
  if (done) {
    await supabase.from('task_completions').delete().eq('task_id', taskId).eq('occurrence_date', date);
  } else {
    await supabase.from('task_completions').insert({ task_id: taskId, occurrence_date: date, completed_by: userId });
  }
  revalidatePath('/', 'layout');
}

export async function deleteTask(taskId: string) {
  const { supabase } = await me();
  await supabase.from('tasks').delete().eq('id', taskId);
  revalidatePath('/', 'layout');
}

export async function addGoal(formData: FormData) {
  const { supabase, userId, duoId } = await me();
  if (!duoId) return;
  const title = String(formData.get('title') ?? '').trim();
  if (!title) return;
  await supabase.from('shared_goals').insert({
    duo_id: duoId, title, description: String(formData.get('description') ?? '') || null,
    target_date: String(formData.get('target_date') ?? '') || null, created_by: userId
  });
  revalidatePath('/', 'layout');
}

export async function setGoalStatus(goalId: string, status: string) {
  const { supabase } = await me();
  await supabase.from('shared_goals').update({ status }).eq('id', goalId);
  revalidatePath('/', 'layout');
}
