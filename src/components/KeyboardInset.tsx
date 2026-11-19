'use client';

import { useEffect } from 'react';

/**
 * Tracks the on-screen keyboard.
 *
 * When iOS raises the keyboard it shrinks the visual viewport but leaves the
 * layout viewport alone, so anything positioned with `fixed` stays pinned to
 * where the bottom of the screen used to be — which is how the composer ends
 * up floating in the middle of the page with the tab bar stranded below it.
 *
 * visualViewport reports the real geometry. This publishes the covered height
 * as --kb and marks the body while the keyboard is up, so the composer can sit
 * on top of it and the tab bar can get out of the way.
 */
export default function KeyboardInset() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const root = document.documentElement;

    const apply = () => {
      const covered = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      root.style.setProperty('--kb', `${Math.round(covered)}px`);
      // A few pixels of rounding are not a keyboard.
      document.body.dataset.kb = covered > 80 ? 'open' : 'closed';
    };

    apply();
    vv.addEventListener('resize', apply);
    vv.addEventListener('scroll', apply);
    return () => {
      vv.removeEventListener('resize', apply);
      vv.removeEventListener('scroll', apply);
      root.style.removeProperty('--kb');
      delete document.body.dataset.kb;
    };
  }, []);

  return null;
}
