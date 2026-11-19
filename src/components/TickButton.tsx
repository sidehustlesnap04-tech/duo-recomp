'use client';

import { useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';

export default function TickButton({ done, label }: { done: boolean; label: string }) {
  const { pending } = useFormStatus();
  const was = useRef(done);
  const [justDone, setJustDone] = useState(false);

  // Turn the disc over only when this goes from undone to done, so the
  // animation reads as a response to the tap and not as page decoration.
  useEffect(() => {
    if (done && !was.current) {
      setJustDone(true);
      const t = setTimeout(() => setJustDone(false), 600);
      was.current = done;
      return () => clearTimeout(t);
    }
    was.current = done;
  }, [done]);

  return (
    <button
      type="submit"
      className="tick"
      data-just={justDone ? 'true' : undefined}
      aria-pressed={done}
      aria-label={(done ? 'Mark not done: ' : 'Mark done: ') + label}
      disabled={pending}
      style={{
        width: 44,
        height: 44,
        borderRadius: '50%',
        flex: 'none',
        cursor: 'pointer',
        display: 'grid',
        placeItems: 'center',
        border: done ? 'none' : '1.5px solid var(--line)',
        background: done ? 'var(--player)' : 'var(--paper)',
        color: done ? '#fff' : 'transparent',
        fontSize: 19,
        lineHeight: 1,
        boxShadow: done
          ? 'inset 0 -2px 4px rgba(34,35,46,0.18), 0 4px 10px -4px rgba(34,35,46,0.4)'
          : 'inset 0 1px 2px rgba(34,35,46,0.05)',
        opacity: pending ? 0.5 : 1,
        transition: 'background 0.2s, border-color 0.2s, box-shadow 0.2s'
      }}
    >
      ✓
    </button>
  );
}
