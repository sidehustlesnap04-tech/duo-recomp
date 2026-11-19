import Link from 'next/link';
import { requireSession } from '@/lib/duo';
import { signOut } from '@/app/auth/actions';
import Mascot from '@/components/Mascot';
import { dayNumber } from '@/lib/plan';
import { todayISO } from '@/lib/day';
import { createClient } from '@/lib/supabase/server';
import PushToggle from '@/components/PushToggle';
import ReplayIntro from '@/components/ReplayIntro';
import { setNotificationPref } from '@/lib/actions';

export const dynamic = 'force-dynamic';

const CATEGORIES = [
  { key: 'chat', title: 'Messages', body: 'When your partner sends you something.' },
  { key: 'partner_activity', title: 'Their progress', body: 'When they finish a day or overtake you.' },
  { key: 'daily_reminder', title: 'Daily reminder', body: 'A nudge if the day is still unlogged by evening.' }
];

const SECTIONS = [
  { href: '/fitness', title: 'Fitness', body: 'Your plan, meal swaps, set logging and targets.' },
  { href: '/progress', title: 'Progress', body: 'Weight, waist and body fat over the twelve weeks.' },
  { href: '/together', title: 'Together', body: 'Shared goals, and what each of you lets the other see.' }
];

export default async function More() {
  const { user, duo, me, members } = await requireSession();
  const n = dayNumber(duo.starts_on, todayISO());
  const partner = members.find((m) => m.user_id !== me.user_id);

  const supabase = createClient();
  const { data } = await supabase.from('notification_prefs').select('category, enabled').eq('user_id', user.id);
  const prefs = (data ?? []) as { category: string; enabled: boolean }[];

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
              {duo.name}, day {Math.max(1, Math.min(n, duo.length_days))} of {duo.length_days}
              {partner ? `, with ${partner.display_name}` : ''}
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
        <h2>Notifications</h2>
        <p className="small muted">
          Each phone asks separately, so turning this on here does not turn it on for{' '}
          {partner ? partner.display_name : 'your partner'}.
        </p>
        <PushToggle vapidPublicKey={process.env.VAPID_PUBLIC_KEY ?? process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''} />

        <div style={{ borderTop: '1px solid var(--line)', paddingTop: 12, marginTop: 4 }}>
          {CATEGORIES.map((c) => {
            const on = prefs.find((p) => p.category === c.key)?.enabled ?? true;
            return (
              <form
                key={c.key}
                className="row between"
                style={{ padding: '8px 0' }}
                action={async () => {
                  'use server';
                  await setNotificationPref(c.key, !on);
                }}
              >
                <span style={{ minWidth: 0 }}>
                  <strong style={{ fontSize: 14 }}>{c.title}</strong>
                  <span className="tiny muted" style={{ display: 'block' }}>{c.body}</span>
                </span>
                <button className={on ? 'btn tiny done' : 'btn tiny'} type="submit">
                  {on ? 'On' : 'Off'}
                </button>
              </form>
            );
          })}
        </div>
      </section>

      <section className="card">
        <h2>Opening</h2>
        <p className="small muted">
          The opening plays once each time you launch the app. Replay it now if you want to show someone.
        </p>
        <ReplayIntro />
      </section>

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
