'use client';

import { useFormStatus } from 'react-dom';

export default function TickButton({ done, label }: { done: boolean; label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      aria-pressed={done}
      aria-label={(done ? 'Mark not done: ' : 'Mark done: ') + label}
      disabled={pending}
      style={{
        width: 44, height: 44, borderRadius: '50%', flex: 'none', cursor: 'pointer',
        border: done ? '2px solid var(--success)' : '1.5px solid var(--line)',
        background: done ? 'var(--success)' : 'var(--paper)',
        color: done ? '#fff' : 'transparent', fontSize: 18, lineHeight: 1,
        opacity: pending ? 0.5 : 1, transition: 'background 0.2s, border-color 0.2s'
      }}
    >
      ✓
    </button>
  );
}
