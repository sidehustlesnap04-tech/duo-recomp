import { redirect } from 'next/navigation';
import TabBar from '@/components/TabBar';
import { requireSession } from '@/lib/duo';
import { signOut } from '@/app/auth/actions';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, duo, me } = await requireSession();
  if (!user) redirect('/sign-in');
  if (!duo) redirect('/onboarding');

  return (
    <div data-player={me?.mascot ?? 'fox'}>
      <div className="shell">
        <header className="row between" style={{ padding: '16px 0 8px' }}>
          <strong style={{ fontFamily: 'var(--font-display)', fontSize: 17 }}>Duo Recomp</strong>
          <form action={signOut}>
            <button className="btn quiet tiny" type="submit">
              Sign out
            </button>
          </form>
        </header>
        <main className="stack">{children}</main>
      </div>
      <TabBar />
    </div>
  );
}
