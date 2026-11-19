'use client';

import { useEffect, useState } from 'react';

type Choice = 'light' | 'dark' | 'system';

const resolve = (c: Choice): 'light' | 'dark' =>
  c === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : c;

export default function ThemeToggle() {
  const [choice, setChoice] = useState<Choice>('system');

  useEffect(() => {
    try {
      setChoice((localStorage.getItem('theme') as Choice) ?? 'system');
    } catch {
      setChoice('system');
    }
  }, []);

  function pick(c: Choice) {
    setChoice(c);
    try {
      if (c === 'system') localStorage.removeItem('theme');
      else localStorage.setItem('theme', c);
    } catch {
      /* private browsing: it holds for this session only */
    }
    const mode = resolve(c);
    document.documentElement.dataset.theme = mode;
    // Keep the status bar and app chrome in step with the page.
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', mode === 'dark' ? '#15161b' : '#eef0f6');
  }

  const OPTIONS: [Choice, string][] = [
    ['light', 'Light'],
    ['dark', 'Dark'],
    ['system', 'Automatic']
  ];

  return (
    <div className="row" style={{ gap: 8 }}>
      {OPTIONS.map(([value, label]) => (
        <button
          key={value}
          type="button"
          className={choice === value ? 'btn tiny done' : 'btn tiny'}
          aria-pressed={choice === value}
          onClick={() => pick(value)}
          style={{ flex: '1 1 0' }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
