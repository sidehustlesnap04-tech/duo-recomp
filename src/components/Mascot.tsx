/* Original characters drawn for Duo Recomp: a fox and a rabbit of our own design.
   Flat vector, one shading step, expression carried by the eyes. Silhouettes differ
   at 24px: the fox is angular with a heavy tail, the rabbit is round with upright ears.
   Placeholders only in the sense that final artwork may replace them; nothing here is
   derived from any existing character. */
export type Pose = 'idle' | 'run' | 'victory' | 'tired';

const FOX = { fur: '#e08268', dark: '#c9654c', pale: '#f6e3da', ink: '#34343a', kit: '#f4e5b8' };
const RABBIT = { fur: '#a99ae0', dark: '#8b7bc9', pale: '#efeaff', ink: '#34343a', kit: '#c8e3d5' };

export default function Mascot({
  animal,
  pose = 'idle',
  size = 72
}: {
  animal: 'fox' | 'rabbit';
  pose?: Pose;
  size?: number;
}) {
  const c = animal === 'fox' ? FOX : RABBIT;
  const lean = pose === 'run' ? 'rotate(-6 60 70)' : pose === 'victory' ? 'translate(0,-3)' : 'none';
  const legA = pose === 'run' ? 'rotate(26 44 86)' : pose === 'tired' ? 'rotate(4 44 86)' : 'none';
  const legB = pose === 'run' ? 'rotate(-24 62 86)' : 'none';
  const armA = pose === 'victory' ? 'rotate(-148 44 56)' : pose === 'run' ? 'rotate(-34 44 56)' : 'none';
  const armB = pose === 'victory' ? 'rotate(-120 68 56)' : pose === 'run' ? 'rotate(30 68 56)' : 'none';

  const fid = `clay-${animal}`;

  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" role="img" aria-label={`${animal}, ${pose}`}>
      <defs>
        {/* Lights the figure from the upper left. The blurred alpha becomes a
            surface normal, so every shape picks up a rounded highlight and reads
            as a sculpted object rather than a flat cut-out. */}
        <filter id={fid} x="-25%" y="-25%" width="150%" height="150%" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3.2" result="surface" />
          <feSpecularLighting
            in="surface"
            surfaceScale="4.5"
            specularConstant="0.5"
            specularExponent="20"
            lightingColor="#ffffff"
            result="spec"
          >
            <fePointLight x="-30" y="-50" z="130" />
          </feSpecularLighting>
          <feComposite in="spec" in2="SourceAlpha" operator="in" result="specClipped" />
          <feComposite in="SourceGraphic" in2="specClipped" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="lit" />
          <feGaussianBlur in="SourceAlpha" stdDeviation="2.5" result="shadowBlur" />
          <feOffset in="shadowBlur" dy="4" result="shadowOffset" />
          <feFlood floodColor="#22232e" floodOpacity="0.22" result="shadowColour" />
          <feComposite in="shadowColour" in2="shadowOffset" operator="in" result="shadow" />
          <feMerge>
            <feMergeNode in="shadow" />
            <feMergeNode in="lit" />
          </feMerge>
        </filter>
      </defs>
      <ellipse cx="60" cy="112" rx="26" ry="4.5" fill={c.ink} opacity="0.16" />
      <g transform={lean} filter={`url(#${fid})`}>
        {/* tail */}
        {animal === 'fox' ? (
          <path d="M40 78 C14 76 8 52 24 40 C20 60 30 68 42 68 Z" fill={c.dark} />
        ) : (
          <circle cx="36" cy="80" r="10" fill={c.pale} />
        )}
        {/* legs */}
        <g transform={legA}>
          <rect x="39" y="80" width="12" height="26" rx="6" fill={c.dark} />
          <ellipse cx="45" cy="106" rx="9" ry="4.5" fill={c.ink} />
        </g>
        <g transform={legB}>
          <rect x="57" y="80" width="12" height="26" rx="6" fill={c.fur} />
          <ellipse cx="63" cy="106" rx="9" ry="4.5" fill={c.ink} />
        </g>
        {/* body */}
        <path d="M38 58 C38 46 48 40 56 40 C68 40 76 48 76 62 C76 78 68 86 56 86 C44 86 38 74 38 58 Z" fill={c.fur} />
        <path d="M50 58 C58 54 68 58 72 66 C72 78 64 84 56 84 C47 84 44 74 45 66 Z" fill={c.pale} />
        <rect x="40" y="54" width="34" height="9" rx="4.5" fill={c.kit} />
        {/* arms */}
        <g transform={armA}>
          <rect x="39" y="56" width="10" height="22" rx="5" fill={c.dark} />
        </g>
        <g transform={armB}>
          <rect x="63" y="56" width="10" height="22" rx="5" fill={c.fur} />
        </g>
        {/* head */}
        <g>
          {animal === 'fox' ? (
            <>
              <path d="M36 36 L30 10 L50 26 Z" fill={c.dark} />
              <path d="M37 34 L34 18 L46 27 Z" fill={c.kit} />
              <path d="M70 32 L82 10 L82 34 Z" fill={c.dark} />
              <path d="M70 32 L79 17 L79 33 Z" fill={c.kit} />
            </>
          ) : (
            <>
              <rect x="40" y="-6" width="13" height="42" rx="6.5" fill={c.dark} transform="rotate(-10 46 15)" />
              <rect x="43" y="0" width="7" height="30" rx="3.5" fill={c.kit} transform="rotate(-10 46 15)" />
              <rect x="64" y="-8" width="13" height="42" rx="6.5" fill={c.dark} transform="rotate(8 70 13)" />
              <rect x="67" y="-2" width="7" height="30" rx="3.5" fill={c.kit} transform="rotate(8 70 13)" />
            </>
          )}
          <path d="M32 38 C32 22 46 16 58 16 C72 16 82 26 82 42 C82 58 70 66 57 66 C42 66 32 56 32 38 Z" fill={c.fur} />
          <path d="M52 40 C66 36 78 42 80 52 C76 62 66 66 57 66 C46 66 42 58 43 48 Z" fill={c.pale} />
          {animal === 'fox' ? (
            <>
              <path d="M68 48 L92 54 L68 60 Z" fill={c.pale} />
              <circle cx="90" cy="54" r="3.4" fill={c.ink} />
            </>
          ) : (
            <>
              <ellipse cx="74" cy="54" rx="12" ry="10" fill={c.pale} />
              <ellipse cx="83" cy="52" rx="3.4" ry="2.8" fill={c.dark} />
            </>
          )}
          {pose === 'tired' ? (
            <>
              <path d="M44 42 Q49 37 54 42" stroke={c.ink} strokeWidth="2.4" strokeLinecap="round" />
              <path d="M62 41 Q67 36 72 41" stroke={c.ink} strokeWidth="2.4" strokeLinecap="round" />
            </>
          ) : (
            <>
              <ellipse cx="49" cy="41" rx="4.6" ry="5.4" fill="#fff" />
              <circle cx="50.6" cy="41.8" r="2.8" fill={c.ink} />
              <circle cx="51.8" cy="40.4" r="1" fill="#fff" />
              <ellipse cx="67" cy="40" rx="4.6" ry="5.4" fill="#fff" />
              <circle cx="68.6" cy="40.8" r="2.8" fill={c.ink} />
              <circle cx="69.8" cy="39.4" r="1" fill="#fff" />
            </>
          )}
          {pose === 'victory' ? <path d="M48 56 Q57 64 66 56" stroke={c.ink} strokeWidth="2.4" strokeLinecap="round" fill="none" /> : null}
        </g>
      </g>
    </svg>
  );
}

export function poseFor(points: number, trained: boolean): Pose {
  if (points >= 90) return 'victory';
  if (points >= 30) return 'run';
  if (points === 0 && !trained) return 'tired';
  return 'idle';
}
