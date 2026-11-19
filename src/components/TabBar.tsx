'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

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

export default function TabBar() {
  const pathname = usePathname();
  const activeFor = (href: string) => pathname === href || (UNDER[href] ?? []).includes(pathname);

  return (
    <nav className="tabbar" aria-label="Sections">
      {TABS.map(([href, label]) => {
        const active = activeFor(href);
        return (
          <Link key={href} href={href} data-active={active} aria-current={active ? 'page' : undefined}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
