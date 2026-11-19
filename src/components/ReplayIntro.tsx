'use client';

export default function ReplayIntro() {
  return (
    <button
      className="btn block"
      onClick={() => {
        try {
          sessionStorage.removeItem('intro:v2');
          localStorage.removeItem('intro:v1');
        } catch {
          /* nothing stored means it plays anyway */
        }
        window.location.href = '/today';
      }}
    >
      Play the opening again
    </button>
  );
}
