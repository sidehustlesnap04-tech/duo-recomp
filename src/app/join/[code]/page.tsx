import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { loadSession } from '@/lib/duo';

export default async function Join({ params }: { params: { code: string } }) {
  const { user, duo } = await loadSession();

  if (!user) {
    // Keep the code in the URL so it survives sign-up and sign-in.
    redirect(`/sign-up?next=${encodeURIComponent(`/join/${params.code}`)}`);
  }
  if (duo) redirect('/today');

  const supabase = createClient();
  const { error } = await supabase.rpc('accept_invite', { invite_code: params.code });

  if (error) {
    return (
      <main className="centre">
        <div className="card">
          <h1>That invitation did not work</h1>
          <p className="muted small">
            It may have expired, been used already, or belong to a challenge that is full. Ask your partner to send a fresh one.
          </p>
          <Link className="btn block" href="/onboarding" style={{ textAlign: 'center', textDecoration: 'none' }}>
            Start your own instead
          </Link>
        </div>
      </main>
    );
  }

  redirect('/today');
}
