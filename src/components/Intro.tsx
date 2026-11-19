'use client';

import { useEffect, useState } from 'react';
import Mascot, { type Pose } from '@/components/Mascot';

const SEEN = 'intro:v1';

/* The beats, in milliseconds. Kept in one place so the CSS timeline and the
   expression changes cannot drift apart. */
const T = {
  collide: 1150,
  laugh: 1500,
  bump: 2750,
  reveal: 3500,
  exit: 5200,
  done: 6000
} as const;

type Beat = 'run' | 'collide' | 'laugh' | 'bump' | 'reveal' | 'exit';

export default function Intro({ force = false }: { force?: boolean }) {
  const [beat, setBeat] = useState<Beat | null>(null);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    // Never on a repeat visit, and never when the device asks for stillness —
    // an opening animation is the most skippable motion in any app.
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let seen = false;
    try {
      seen = localStorage.getItem(SEEN) === '1';
    } catch {
      seen = false;
    }
    if (!force && (seen || calm)) return;

    setBeat('run');
    const timers = [
      setTimeout(() => setBeat('collide'), T.collide),
      setTimeout(() => setBeat('laugh'), T.laugh),
      setTimeout(() => setBeat('bump'), T.bump),
      setTimeout(() => setBeat('reveal'), T.reveal),
      setTimeout(() => setBeat('exit'), T.exit),
      setTimeout(() => finish(), T.done)
    ];
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [force]);

  function finish() {
    try {
      localStorage.setItem(SEEN, '1');
    } catch {
      /* private browsing: it simply plays again next time */
    }
    setLeaving(true);
    setTimeout(() => setBeat(null), 420);
  }

  if (!beat) return null;

  // Expression follows the beat: running, then startled, then delighted.
  const foxPose: Pose = beat === 'run' ? 'run' : beat === 'collide' ? 'tired' : beat === 'exit' ? 'run' : 'victory';
  const rabbitPose: Pose = foxPose;

  return (
    <div className={`intro${leaving ? ' leaving' : ''}`} data-beat={beat} role="dialog" aria-label="Duo Recomp intro">
      <button className="intro-skip" onClick={finish}>
        Skip
      </button>

      <div className="intro-stage">
        <div className="intro-actor fox">
          <Mascot animal="fox" pose={foxPose} size={144} />
        </div>

        <div className="intro-actor rabbit">
          <Mascot animal="rabbit" pose={rabbitPose} size={144} />
        </div>

        {/* The hit: a ring and a few sparks, only at the moment of contact. */}
        <span className="intro-impact" aria-hidden />
        {Array.from({ length: 7 }).map((_, i) => (
          <span key={i} className="intro-spark" style={{ ['--a' as string]: `${(360 / 7) * i}deg` }} aria-hidden />
        ))}

        {/* The fist bump lands here. */}
        <span className="intro-bump" aria-hidden />
      </div>

      <div className="intro-brand">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon.svg" alt="" width={62} height={62} className="intro-mark" />
        <h1 className="intro-word">Duo Recomp</h1>
        <p className="intro-tag">Better together. Stronger every day.</p>
      </div>
    </div>
  );
}
