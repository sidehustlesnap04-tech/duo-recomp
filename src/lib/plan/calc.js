/* Pure calculations carried over from the prototype. Day scoring now lives in Postgres
   (public.recompute_day_score) so the number a partner sees cannot be produced by a client. */
/* eslint-disable */
import { ING, MEALS, SLOTS, SPLITS, PROGRAM, CARDIO_PLAN, SESSION_NAMES, MODES, WEEK_MENU } from './data.js';

export const r0 = (x) => Math.round(x);
export const r1 = (x) => Math.round(x * 10) / 10;
export const round5 = (x) => Math.round(x / 5) * 5;
export const num = (v) => (v === '' || v == null || isNaN(+v) ? null : +v);

export function itemMacros(id, g) {
  const i = ING[id], m = g / 100;
  return { kcal: i.k * m, p: i.p * m, c: i.c * m, f: i.f * m, cost: ((g * (i.yf || 1)) / 1000) * i.price };
}

export function mealTotals(meal) {
  const t = { kcal: 0, p: 0, c: 0, f: 0, cost: 0 };
  for (const [id, g] of meal.items) {
    const x = itemMacros(id, g);
    for (const k in t) t[k] += x[k];
  }
  const per100 = t.cost / t.kcal * 100;
  return { kcal: r0(t.kcal), p: r1(t.p), c: r1(t.c), f: r1(t.f), cost: r0(t.cost), tier: per100 < 4.5 ? 1 : (per100 < 10 || t.cost < 15) ? 2 : 3 };
}

export const mealById = (id) => MEALS.find((m) => m.id === id);

/** Portions scale with a player's calories, so the same plan fits both people. */
export function scaledMeal(meal, scale) {
  if (!meal) return null;
  if (!scale || scale === 1) return meal;
  return { ...meal, items: meal.items.map(([id, g]) => [id, Math.max(5, round5(g * scale))]) };
}

export function cardioFor(week) {
  const w = Math.min(12, Math.max(1, week));
  return CARDIO_PLAN.find((c) => w >= c.from && w <= c.to);
}

export function sessionForDay(splitKey, dayIndex) {
  const days = (SPLITS[splitKey] || SPLITS.ul4).days;
  return days[((dayIndex % days.length) + days.length) % days.length];
}

export function defaultMenuForDay(dayIndex) {
  return WEEK_MENU[((dayIndex % 7) + 7) % 7];
}

export function scheduleFor(mode) {
  return (MODES[mode] || MODES.A).rows;
}

export function weeklyVolume(splitKey) {
  const days = (SPLITS[splitKey] || SPLITS.ppl5).days, v = {};
  for (const d of days) if (PROGRAM[d]) for (const e of PROGRAM[d]) for (const m in e.vol) v[m] = (v[m] || 0) + e.vol[m];
  return v;
}

/** Suggested targets from real measurements. Mifflin-St Jeor, then an activity factor.
    Nothing is invented: a player with no measurements gets no targets. */
export function suggest(o) {
  const bmr = 10 * o.weightKg + 6.25 * o.heightCm - 5 * o.age + (o.sex === 'm' ? 5 : -161);
  const af = { 3: 1.4, 4: 1.45, 5: 1.5 }[o.days] || 1.45;
  const maint = bmr * af;
  const mult = { fat: 0.85, recomp: 0.9, build: 1.05 }[o.goal] || 0.9;
  const kcal = Math.round(Math.max(maint * mult, bmr * 1.15, 1500) / 50) * 50;
  const scale = Math.round((kcal / 2200) * 100) / 100;
  const proteinCap = round5(150 * scale);
  const proteinMin = round5(130 * scale);
  const fat = round5(Math.max(0.8 * o.weightKg, 60 * scale));
  const carbs = round5((kcal - 4 * proteinCap - 9 * fat) / 4);
  return {
    bmr: Math.round(bmr), maintenance: Math.round(maint), kcal, scale,
    proteinCap, proteinMin, carbs, fat,
    waterL: Math.round(Math.max(2, o.weightKg * 0.035) * 10) / 10,
    split: { 3: 'fb3', 4: 'ul4', 5: 'ppl5' }[o.days] || 'ul4'
  };
}

export function dayNumber(startsOn, onDate) {
  const a = new Date(startsOn + 'T12:00:00').getTime();
  const b = new Date(onDate + 'T12:00:00').getTime();
  return Math.floor((b - a) / 86400000) + 1;
}

export function weekNumber(startsOn, onDate) {
  return Math.max(1, Math.ceil(dayNumber(startsOn, onDate) / 7));
}

export { SESSION_NAMES, SPLITS, PROGRAM, MEALS, SLOTS, ING, MODES };
