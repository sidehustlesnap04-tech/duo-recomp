// Typed facade over the ported engine. The JavaScript below it is the prototype's own code,
// kept as it was rather than rewritten, so the meal and training data cannot drift.
// @ts-ignore - plain JS module, intentionally not converted
import * as data from './data.js';
// @ts-ignore
import * as calc from './calc.js';

export type Ingredient = { n: string; st: string; k: number; p: number; c: number; f: number; price: number; cat: string; yf?: number; buy?: string; same?: string };
export type Meal = { id: string; cat: string; n: string; items: [string, number][]; prep: string; ahead: boolean; work: boolean };
export type Slot = { id: string; n: string; kcal: number; p: number };
export type Exercise = { id: string; n: string; eq: string; tg: string; sets: number; reps: [number, number]; rest: string; rir: string; t: string; how: string; avoid: string; alt: string; vol: Record<string, number> };
export type Totals = { kcal: number; p: number; c: number; f: number; cost: number; tier: number };
export type Suggestion = { bmr: number; maintenance: number; kcal: number; scale: number; proteinCap: number; proteinMin: number; carbs: number; fat: number; waterL: number; split: string };

export const ING = data.ING as unknown as Record<string, Ingredient>;
export const MEALS = data.MEALS as unknown as Meal[];
export const SLOTS = data.SLOTS as unknown as Slot[];
export const PROGRAM = data.PROGRAM as unknown as Record<string, Exercise[]>;
export const SPLITS = data.SPLITS as unknown as Record<string, { n: string; days: string[] }>;
export const SESSION_NAMES = data.SESSION_NAMES as unknown as Record<string, string>;
export const MODES = data.MODES as unknown as Record<string, { n: string; rows: [string, string, string?][] }>;
export const CARDIO_PLAN = data.CARDIO_PLAN as unknown as { from: number; to: number; sessions: number; min: number; steps: number }[];
export const ROADMAP = data.ROADMAP as unknown as { w: number; train: string; nut: string; check: string }[];
export const TARGETS = data.TARGETS as unknown as Record<string, number>;

export const mealById = calc.mealById as unknown as (id: string) => Meal | undefined;
export const mealTotals = calc.mealTotals as unknown as (meal: Meal) => Totals;
export const scaledMeal = calc.scaledMeal as unknown as (meal: Meal | undefined, scale: number) => Meal;
export const itemMacros = calc.itemMacros as unknown as (id: string, grams: number) => { kcal: number; p: number; c: number; f: number; cost: number };
export const suggest = calc.suggest as unknown as (o: { weightKg: number; heightCm: number; age: number; sex: 'm' | 'f'; days: number; goal: string }) => Suggestion;
export const cardioFor = calc.cardioFor as unknown as (week: number) => { from: number; to: number; sessions: number; min: number; steps: number };
export const sessionForDay = calc.sessionForDay as unknown as (splitKey: string, dayIndex: number) => string;
export const defaultMenuForDay = calc.defaultMenuForDay as unknown as (dayIndex: number) => Record<string, string>;
export const scheduleFor = calc.scheduleFor as unknown as (mode: string) => [string, string, string?][];
export const weeklyVolume = calc.weeklyVolume as unknown as (splitKey: string) => Record<string, number>;
export const dayNumber = calc.dayNumber as unknown as (startsOn: string, onDate: string) => number;
export const weekNumber = calc.weekNumber as unknown as (startsOn: string, onDate: string) => number;
export const r0 = calc.r0 as (x: number) => number;
export const r1 = calc.r1 as (x: number) => number;
