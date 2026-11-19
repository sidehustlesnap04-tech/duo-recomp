'use client';

import { useEffect, useState } from 'react';

const COLOURS = ['#e0705a', '#d9548f', '#f4c84a', '#7f6fd6', '#58a7e8', '#f6c9bd'];

/**
 * Throws confetti once per key. The key is the day, so finishing Tuesday
 * celebrates on Tuesday and not again every time the screen is opened.
 */
export default function Celebrate({ fire, once }: { fire: boolean; once: string }) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!fire) return;
    const seen = `cheered:${once}`;
    try {
      if (localStorage.getItem(seen)) return;
      localStorage.setItem(seen, '1');
    } catch {
      // Private browsing: celebrate anyway rather than failing.
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setShown(true);
    const t = setTimeout(() => setShown(false), 3200);
    return () => clearTimeout(t);
  }, [fire, once]);

  if (!shown) return null;

  const bits = Array.from({ length: 54 }, (_, i) => {
    const left = Math.random() * 100;
    return (
      <i
        key={i}
        style={
          {
            left: `${left}%`,
            background: COLOURS[i % COLOURS.length],
            animationDelay: `${Math.random() * 0.5}s`,
            '--dx': `${(Math.random() - 0.5) * 220}px`,
            '--dr': `${540 + Math.random() * 540}deg`
          } as React.CSSProperties
        }
      />
    );
  });

  return (
    <div className="confetti" aria-hidden>
      {bits}
    </div>
  );
}
