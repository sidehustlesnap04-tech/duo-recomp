'use client';

import { useFormState, useFormStatus } from 'react-dom';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { signIn } from '../auth/actions';

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button className="btn primary block" type="submit" disabled={pending}>
      {pending ? 'One moment…' : label}
    </button>
  );
}

function Form() {
  const [error, action] = useFormState(signIn, null);
  const next = useSearchParams().get('next') ?? '/today';
  return (
    <form action={action} className="stack">
      <input type="hidden" name="next" value={next} />
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      {error ? <p className="notice bad">{error}</p> : null}
      <Submit label="Sign in" />
    </form>
  );
}

export default function SignIn() {
  return (
    <main className="centre">
      <div className="card">
        <h1>Welcome back</h1>
        <p className="muted small">Your half of the challenge is waiting.</p>
        <Suspense>
          <Form />
        </Suspense>
        <p className="small muted">
          No account yet? <Link href="/sign-up">Create one</Link>
        </p>
      </div>
    </main>
  );
}
