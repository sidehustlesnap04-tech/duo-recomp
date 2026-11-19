import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type Member = {
  user_id: string;
  role: string;
  display_name: string;
  mascot: string;
};

export type Duo = {
  id: string;
  name: string;
  starts_on: string;
  length_days: number;
  created_by: string;
  created_at: string;
};

type Session = {
  user: Awaited<ReturnType<ReturnType<typeof createClient>['auth']['getUser']>>['data']['user'];
  duo: Duo | null;
  members: Member[];
  me: Member | null;
};

const EMPTY: Omit<Session, 'user'> = { duo: null, members: [], me: null };

/**
 * The signed-in person, their duo, and both members.
 *
 * Wrapped in React `cache()` so the layout and the page it renders share one
 * result instead of each paying for the round trips. The duo and members come
 * from a single `session_bootstrap()` RPC rather than two chained selects, so a
 * cold screen costs two calls (auth, then bootstrap) instead of six.
 *
 * Null duo means the person still needs onboarding.
 */
export const loadSession = cache(async function loadSession(): Promise<Session> {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { user: null, ...EMPTY };

  const { data, error } = await supabase.rpc('session_bootstrap');
  if (error || !data || !(data as any).duo) return { user, ...EMPTY };

  const duo = (data as any).duo as Duo;
  const members = ((data as any).members ?? []) as Member[];

  return {
    user,
    duo,
    members,
    me: members.find((m) => m.user_id === user.id) ?? null
  };
});

/**
 * Same as loadSession, but for screens that cannot render without a duo.
 * Sends the person to sign-in or onboarding instead of returning nulls, so
 * every caller downstream gets non-null `duo` and `me`.
 */
export async function requireSession() {
  const s = await loadSession();
  if (!s.user) redirect('/sign-in');
  if (!s.duo || !s.me) redirect('/onboarding');
  return { user: s.user, duo: s.duo, members: s.members, me: s.me };
}
