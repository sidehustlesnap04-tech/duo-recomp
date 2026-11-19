import Link from 'next/link';
import { requireSession } from '@/lib/duo';
import { signOut } from '@/app/auth/actions';
import Mascot from '@/components/Mascot';
import { dayNumber } from '@/lib/plan';
import { todayISO } from '@/lib/day';

export const dynamic = 'force-dynamic';

const SECTIONS = [
  { href: '/fitness', title: 'Fitness', body: 'Your plan, meal swaps, set logging and targets.' },
  { href: '/progress', title: 'Progress', body: 'Weight, waist and body fat over the twelve weeks.' },
  { href: '/together', title: 'Together', body: 'Shared goals, and what each of you lets the other see.' }
];

export default async function More() {
  const { user, duo, me, members } = await requireSession();
  const n = dayNumber(duo.starts_on, todayISO());
  const partner = members.find((m) => m.user_id !== me.user_id);

  return (
    <>
      <h1>More</h1>

      <section className="card scene">
        <div className="row" style={{ gap: 14 }}>
          <div>
            <div className="float">
              <Mascot animal={me.mascot as 'fox' | 'rabbit'} pose="idle" size={64} />
            </div>
            <span className="cast-shadow" style={{ width: 38 }} aria-hidden />
          </div>
          <div style={{ minWidth: 0 }}>
            <h2>{me.display_name}</h2>
            <p className="small muted">{user.email}</p>
            <p className="tiny faint" style={{ marginTop: 4 }}>
              {duo.name} · day {Math.max(1, Math.min(n, duo.length_days))} of {duo.length_days}
              {partner ? ` · with ${partner.display_name}` : ''}
            </p>
          </div>
        </div>
      </section>

      {SECTIONS.map((s) => (
        <Link key={s.href} href={s.href} className="card row between" style={{ textDecoration: 'none', gap: 12 }}>
          <span style={{ minWidth: 0 }}>
            <strong style={{ fontFamily: 'var(--font-display)', fontSize: 17 }}>{s.title}</strong>
            <span className="tiny muted" style={{ display: 'block' }}>{s.body}</span>
          </span>
          <span className="faint" aria-hidden style={{ fontSize: 22 }}>›</span>
        </Link>
      ))}

      <section className="card">
        <h2>Account</h2>
        <form action={signOut}>
          <button className="btn block" type="submit">Sign out</button>
        </form>
        <p className="tiny faint">
          Signing out only affects this phone. Your partner stays signed in on theirs.
        </p>
      </section>
    </>
  );
}
