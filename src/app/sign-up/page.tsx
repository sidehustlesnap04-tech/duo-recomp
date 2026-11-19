'use client';

import { useFormState, useFormStatus } from 'react-dom';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { signUp } from '../auth/actions';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button className="btn primary block" type="submit" disabled={pending}>
      {pending ? 'Creating…' : 'Create account'}
    </button>
  );
}

function Form() {
  const [error, action] = useFormState(signUp, null);
  const next = useSearchParams().get('next') ?? '/onboarding';
  return (
    <form action={action} className="stack">
      <input type="hidden" name="next" value={next} />
      <div className="field">
        <label htmlFor="display_name">What should we call you?</label>
        <input id="display_name" name="display_name" type="text" autoComplete="nickname" required />
      </div>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
      </div>
      {error ? <p className="notice bad">{error}</p> : null}
      <Submit />
    </form>
  );
}

export default function SignUp() {
  return (
    <main className="centre">
      <div className="card">
        <h1>Start your duo</h1>
        <p className="muted small">Your name can change later. Your account cannot.</p>
        <Suspense>
          <Form />
        </Suspense>
        <p className="small muted">
          Already have one? <Link href="/sign-in">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
