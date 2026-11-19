import { redirect } from 'next/navigation';
import TabBar from '@/components/TabBar';
import { requireSession } from '@/lib/duo';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, duo, me } = await requireSession();
  if (!user) redirect('/sign-in');
  if (!duo) redirect('/onboarding');

  return (
    <div data-player={me?.mascot ?? 'fox'}>
      <div className="shell">
        <header className="row" style={{ gap: 9, padding: '14px 0 6px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.svg" alt="" width={26} height={26} />
          <strong style={{ fontFamily: 'var(--font-display)', fontSize: 17, letterSpacing: '-0.02em' }}>
            Duo Recomp
          </strong>
        </header>
        <main className="stack">{children}</main>
      </div>
      <TabBar />
    </div>
  );
}
