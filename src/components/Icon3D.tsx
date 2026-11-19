/* Icons lit the same way the mascots are: the blurred alpha becomes a
   surface, so flat shapes pick up a rounded highlight and a contact shadow
   and read as small objects rather than glyphs. No bundle cost — it is the
   same SVG filter. */

export type IconName = 'fitness' | 'progress' | 'together' | 'bell' | 'play' | 'account' | 'target';

const PALETTE: Record<IconName, [string, string]> = {
  fitness: ['#e0705a', '#c9553f'],
  progress: ['#5fa0d8', '#3d7cb5'],
  together: ['#d9548f', '#b33a71'],
  bell: ['#f0c44e', '#d2a128'],
  play: ['#7f6fd6', '#6253bb'],
  account: ['#4e9e82', '#3a7f68'],
  target: ['#e8926a', '#cb6f47']
};

export default function Icon3D({ name, size = 40 }: { name: IconName; size?: number }) {
  const [light, dark] = PALETTE[name];
  const fid = `lit-${name}`;

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden focusable="false">
      <defs>
        <filter id={fid} x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceAlpha" stdDeviation="1.7" result="surface" />
          <feSpecularLighting
            in="surface"
            surfaceScale="3.4"
            specularConstant="0.5"
            specularExponent="20"
            lightingColor="#ffffff"
            result="spec"
          >
            <fePointLight x="-14" y="-24" z="64" />
          </feSpecularLighting>
          <feComposite in="spec" in2="SourceAlpha" operator="in" result="clip" />
          <feComposite in="SourceGraphic" in2="clip" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="lit" />
          <feGaussianBlur in="SourceAlpha" stdDeviation="1.4" result="sb" />
          <feOffset in="sb" dy="2.2" result="so" />
          <feFlood floodColor="#22232e" floodOpacity="0.26" result="sc" />
          <feComposite in="sc" in2="so" operator="in" result="shadow" />
          <feMerge>
            <feMergeNode in="shadow" />
            <feMergeNode in="lit" />
          </feMerge>
        </filter>
      </defs>

      <g filter={`url(#${fid})`}>
        {name === 'fitness' ? (
          <>
            <rect x="24" y="28" width="16" height="8" rx="3" fill={dark} />
            <rect x="12" y="21" width="11" height="22" rx="4.5" fill={light} />
            <rect x="41" y="21" width="11" height="22" rx="4.5" fill={light} />
            <rect x="6" y="26" width="7" height="12" rx="3" fill={dark} />
            <rect x="51" y="26" width="7" height="12" rx="3" fill={dark} />
          </>
        ) : null}

        {name === 'progress' ? (
          <>
            <rect x="11" y="38" width="10" height="14" rx="3.5" fill={dark} />
            <rect x="27" y="28" width="10" height="24" rx="3.5" fill={light} />
            <rect x="43" y="16" width="10" height="36" rx="3.5" fill={light} />
          </>
        ) : null}

        {name === 'together' ? (
          <>
            <circle cx="25" cy="32" r="13" fill="none" stroke={light} strokeWidth="7" />
            <circle cx="40" cy="32" r="13" fill="none" stroke={dark} strokeWidth="7" />
          </>
        ) : null}

        {name === 'bell' ? (
          <>
            <path d="M32 11c-8 0-13 6-13 14 0 9-3 12-5 15h36c-2-3-5-6-5-15 0-8-5-14-13-14Z" fill={light} />
            <rect x="26" y="44" width="12" height="8" rx="4" fill={dark} />
          </>
        ) : null}

        {name === 'play' ? (
          <>
            <rect x="10" y="12" width="44" height="40" rx="13" fill={light} />
            <path d="M27 23l16 9-16 9V23Z" fill="#ffffff" />
          </>
        ) : null}

        {name === 'account' ? (
          <>
            <circle cx="32" cy="23" r="10" fill={light} />
            <path d="M13 53c0-10 8-16 19-16s19 6 19 16H13Z" fill={dark} />
          </>
        ) : null}

        {name === 'target' ? (
          <>
            <circle cx="32" cy="32" r="20" fill={light} />
            <circle cx="32" cy="32" r="12" fill="#ffffff" />
            <circle cx="32" cy="32" r="5.5" fill={dark} />
          </>
        ) : null}
      </g>
    </svg>
  );
}
