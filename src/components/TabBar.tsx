'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

/** Five is the most a thumb can reach reliably. Everything else lives in More. */
const TABS = [
  ['/today', 'Today'],
  ['/race', 'Race'],
  ['/chat', 'Chat'],
  ['/calendar', 'Plan'],
  ['/more', 'More']
] as const;

const UNDER = {
  '/more': ['/fitness', '/progress', '/together'],
  '/calendar': []
} as Record<string, string[]>;

export default function TabBar({
  duoId,
  userId,
  unread = 0
}: {
  duoId: string;
  userId: string;
  unread?: number;
}) {
  const pathname = usePathname();
  const onChat = pathname === '/chat';
  const [count, setCount] = useState(onChat ? 0 : unread);

  // The server's count is the truth on every navigation; the socket only
  // moves it between them.
  useEffect(() => {
    setCount(onChat ? 0 : unread);
  }, [unread, onChat]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`unread:${duoId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `duo_id=eq.${duoId}` },
        (payload) => {
          const row = payload.new as { user_id: string };
          // Your own message is not news, and a message that arrives while
          // you are reading the thread is already read.
          if (row.user_id === userId || window.location.pathname === '/chat') return;
          setCount((c) => c + 1);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [duoId, userId]);

  // Mirrors the count onto the installed app icon where the browser allows it.
  useEffect(() => {
    const nav = navigator as Navigator & {
      setAppBadge?: (n?: number) => Promise<void>;
      clearAppBadge?: () => Promise<void>;
    };
    try {
      if (count > 0) nav.setAppBadge?.(count);
      else nav.clearAppBadge?.();
    } catch {
      // Not supported, or not installed. The in-app badge still shows.
    }
  }, [count]);

  return (
    <nav className="tabbar" aria-label="Sections">
      {TABS.map(([href, label]) => {
        const active = pathname === href || (UNDER[href] ?? []).includes(pathname);
        const badge = href === '/chat' && count > 0;
        return (
          <Link key={href} href={href} data-active={active} aria-current={active ? 'page' : undefined}>
            <span className="tab-label">
              {label}
              {badge ? (
                <span className="badge" aria-label={`${count} unread ${count === 1 ? 'message' : 'messages'}`}>
                  {count > 9 ? '9+' : count}
                </span>
              ) : null}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
