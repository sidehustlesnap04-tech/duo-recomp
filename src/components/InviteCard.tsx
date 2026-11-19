'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function InviteCard({ duoId }: { duoId: string }) {
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function makeInvite() {
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { data, error } = await supabase.rpc('create_invite', { target_duo: duoId });
    setBusy(false);
    if (error || !data) {
      setError('Could not make an invitation just now. Try again in a moment.');
      return;
    }
    setLink(`${window.location.origin}/join/${data}`);
  }

  return (
    <div className="card">
      <h2>Invite your partner</h2>
      <p className="small muted">One link, good for seven days, usable once. Nobody else can join with it.</p>
      {link ? (
        <div className="stack">
          <input readOnly value={link} onFocus={(e) => e.currentTarget.select()} />
          <button
            className="btn player block"
            type="button"
            onClick={() => navigator.clipboard?.writeText(link).catch(() => undefined)}
          >
            Copy the link
          </button>
        </div>
      ) : (
        <button className="btn player block" type="button" onClick={makeInvite} disabled={busy}>
          {busy ? 'Making it…' : 'Create an invitation'}
        </button>
      )}
      {error ? <p className="notice bad">{error}</p> : null}
    </div>
  );
}
