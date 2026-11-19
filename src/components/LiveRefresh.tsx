'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const POLL_MS = 10_000;

/**
 * Keeps an open screen current without reopening the app.
 *
 * Three things drive a refresh, in order of how quickly they land:
 *
 *  1. Realtime. A change to the duo's scores, day logs or task completions
 *     arrives over the socket, so the partner's tick shows up at once rather
 *     than on the next poll.
 *  2. Coming back. Returning to the tab refreshes immediately, which is the
 *     case that actually made the app feel stale — a phone that was asleep
 *     has no socket and no timer.
 *  3. A ten second poll, as a floor, while the tab is visible. Hidden tabs do
 *     nothing: a backgrounded phone should not be making requests.
 *
 * Chat is excluded: it carries its own realtime subscription, and refreshing
 * underneath someone mid-sentence is worse than useless.
 */
export default function LiveRefresh({ duoId }: { duoId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const last = useRef(0);

  // Collapses bursts — several rows changing at once is still one refresh.
  const refresh = useRef(() => {
    const now = Date.now();
    if (now - last.current < 1500) return;
    last.current = now;
    router.refresh();
  });

  useEffect(() => {
    if (pathname === '/chat') return;

    const onVisible = () => {
      if (!document.hidden) refresh.current();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);

    const timer = setInterval(() => {
      if (!document.hidden) refresh.current();
    }, POLL_MS);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
      clearInterval(timer);
    };
  }, [pathname]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`live:${duoId}`);

    for (const table of ['daily_scores', 'day_logs', 'task_completions', 'shared_goals']) {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter: table === 'task_completions' ? undefined : `duo_id=eq.${duoId}` },
        () => refresh.current()
      );
    }

    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [duoId]);

  return null;
}
