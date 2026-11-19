'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { createDuo, acceptInvite } from './actions';

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button className="btn primary block" type="submit" disabled={pending}>
      {pending ? 'One moment…' : label}
    </button>
  );
}

export default function Onboarding() {
  const [createError, createAction] = useFormState(createDuo, null);
  const [joinError, joinAction] = useFormState(acceptInvite, null);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className="centre">
      <div className="stack" style={{ width: '100%', maxWidth: 440 }}>
        <div className="card">
          <h1>Start a challenge</h1>
          <p className="muted small">Twelve weeks, two people, one track. You can invite your partner straight after.</p>
          <form action={createAction} className="stack">
            <div className="field">
              <label htmlFor="name">Name it</label>
              <input id="name" name="name" type="text" placeholder="Our twelve weeks" />
            </div>
            <div className="field">
              <label htmlFor="starts_on">Day one</label>
              <input id="starts_on" name="starts_on" type="date" defaultValue={today} />
            </div>
            {createError ? <p className="notice bad">{createError}</p> : null}
            <Submit label="Create the challenge" />
          </form>
        </div>

        <div className="card">
          <h2>Or join one</h2>
          <p className="muted small">Paste the code your partner sent you.</p>
          <form action={joinAction} className="stack">
            <div className="field">
              <label htmlFor="code">Invitation code</label>
              <input id="code" name="code" type="text" autoComplete="off" spellCheck={false} />
            </div>
            {joinError ? <p className="notice bad">{joinError}</p> : null}
            <Submit label="Join" />
          </form>
        </div>
      </div>
    </main>
  );
}
