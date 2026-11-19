'use client';

import { useEffect, useRef, useState } from 'react';
import Mascot, { type Pose } from '@/components/Mascot';

const SEEN = 'intro:v2';

/** The rendered opening. Served from the generator's CDN rather than the
 *  repo: the build machine has no route to that host, so it cannot be
 *  vendored in. If it fails to load, the drawn version below plays instead. */
const FILM = 'https://cdn.creativeclaw.co/u/9040351e/videos/759f7331-45bc-476e-b582-9db15f30c0bb.mp4';

/* Beats for the drawn fallback, in milliseconds. */
const T = { collide: 1150, laugh: 1500, bump: 2750, reveal: 3500, exit: 5200, done: 6000 } as const;
type Beat = 'run' | 'collide' | 'laugh' | 'bump' | 'reveal' | 'exit';

export default function Intro({ force = false }: { force?: boolean }) {
  const [mode, setMode] = useState<'off' | 'film' | 'drawn'>('off');
  const [beat, setBeat] = useState<Beat>('run');
  const [branded, setBranded] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let seen = false;
    try {
      seen = localStorage.getItem(SEEN) === '1';
    } catch {
      seen = false;
    }
    if (!force && (seen || calm)) return;

    setMode('film');

    // If the film has not started within three seconds — a cold cache on
    // mobile data — play the drawn version rather than hold a blank screen.
    timers.current.push(
      setTimeout(() => {
        if (!video.current || video.current.currentTime === 0) runDrawn();
      }, 3000)
    );

    const running = timers.current;
    return () => running.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [force]);

  function runDrawn() {
    setMode('drawn');
    timers.current.push(
      setTimeout(() => setBeat('collide'), T.collide),
      setTimeout(() => setBeat('laugh'), T.laugh),
      setTimeout(() => setBeat('bump'), T.bump),
      setTimeout(() => setBeat('reveal'), T.reveal),
      setTimeout(() => setBeat('exit'), T.exit),
      setTimeout(finish, T.done)
    );
  }

  function finish() {
    try {
      localStorage.setItem(SEEN, '1');
    } catch {
      /* private browsing: it simply plays again next time */
    }
    setLeaving(true);
    setTimeout(() => setMode('off'), 420);
  }

  if (mode === 'off') return null;

  const pose: Pose = beat === 'run' ? 'run' : beat === 'collide' ? 'tired' : beat === 'exit' ? 'run' : 'victory';

  return (
    <div
      className={`intro${leaving ? ' leaving' : ''}`}
      data-beat={beat}
      data-mode={mode}
      role="dialog"
      aria-label="Duo Recomp opening"
    >
      <button className="intro-skip" onClick={finish}>
        Skip
      </button>

      {mode === 'film' ? (
        <video
          ref={video}
          className="intro-film"
          src={FILM}
          autoPlay
          muted
          playsInline
          preload="auto"
          // The brand resolves over the last beat; the film carries no text.
          onTimeUpdate={(e) => {
            if (e.currentTarget.currentTime > 4.2 && !branded) setBranded(true);
          }}
          onEnded={finish}
          onError={runDrawn}
          aria-hidden
        />
      ) : (
        <div className="intro-stage">
          <div className="intro-actor fox">
            <Mascot animal="fox" pose={pose} size={144} />
          </div>
          <div className="intro-actor rabbit">
            <Mascot animal="rabbit" pose={pose} size={144} />
          </div>
          <span className="intro-impact" aria-hidden />
          {Array.from({ length: 7 }).map((_, i) => (
            <span key={i} className="intro-spark" style={{ ['--a' as string]: `${(360 / 7) * i}deg` }} aria-hidden />
          ))}
          <span className="intro-bump" aria-hidden />
        </div>
      )}

      <div className={`intro-brand${mode === 'film' && branded ? ' shown' : ''}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon.svg" alt="" width={62} height={62} className="intro-mark" />
        <h1 className="intro-word">Duo Recomp</h1>
        <p className="intro-tag">Better together. Stronger every day.</p>
      </div>
    </div>
  );
}
