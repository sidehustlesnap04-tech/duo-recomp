'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  ['/today', 'Today'],
  ['/race', 'Race'],
  ['/calendar', 'Calendar'],
  ['/fitness', 'Fitness'],
  ['/progress', 'Progress'],
  ['/together', 'Together']
] as const;

export default function TabBar() {
  const pathname = usePathname();
  return (
    <nav className="tabbar" aria-label="Sections">
      {TABS.map(([href, label]) => (
        <Link key={href} href={href} data-active={pathname === href} aria-current={pathname === href ? 'page' : undefined}>
          {label}
        </Link>
      ))}
    </nav>
  );
}
