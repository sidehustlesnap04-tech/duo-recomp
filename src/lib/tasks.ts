import { createClient } from '@/lib/supabase/server';

export type Task = {
  id: string;
  duo_id: string;
  title: string;
  kind: 'task' | 'event' | string;
  owner_id: string | null;
  due_date: string;
  due_time: string | null;
  category: string | null;
  priority: number | null;
  recurrence: 'none' | 'daily' | 'weekly' | 'monthly' | 'custom' | string;
  repeat_every: number | null;
  repeat_until: string | null;
};

const noon = (d: string) => new Date(d + 'T12:00:00');

/** Whether a task, with its recurrence rule, lands on a given date. */
export function occursOn(t: Task, date: string): boolean {
  if (date < t.due_date) return false;
  if (t.repeat_until && date > t.repeat_until) return false;
  const days = Math.round((noon(date).getTime() - noon(t.due_date).getTime()) / 86400000);
  switch (t.recurrence) {
    case 'daily':
      return true;
    case 'weekly':
      return days % 7 === 0;
    case 'monthly':
      return noon(date).getDate() === noon(t.due_date).getDate();
    case 'custom':
      return days % Math.max(1, t.repeat_every ?? 1) === 0;
    default:
      return days === 0;
  }
}

/**
 * Every task the duo has, plus which of them land on `date` and which are
 * one-off tasks left unfinished from before it. Two queries, run together.
 */
export async function loadTasksForDay(duoId: string, date: string) {
  const supabase = createClient();
  const [{ data: tasks }, { data: completions }] = await Promise.all([
    supabase.from('tasks').select('*').eq('duo_id', duoId).order('due_time', { nullsFirst: false }),
    supabase.from('task_completions').select('task_id').eq('occurrence_date', date)
  ]);

  const all = (tasks ?? []) as Task[];
  const doneIds = new Set((completions ?? []).map((c: any) => c.task_id as string));

  return {
    all,
    doneIds,
    onDay: all.filter((t) => occursOn(t, date)),
    overdue: all.filter(
      (t) => t.kind === 'task' && t.recurrence === 'none' && t.due_date < date && !doneIds.has(t.id)
    )
  };
}
