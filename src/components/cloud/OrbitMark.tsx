/**
 * 🪐 הסמל של אורביט (22.10 — "תביא משהו מפלצתי") — SVG חי במקום האימוג'י, נאמן
 * ללוגו המקורי: כדור-מוח מוזהב עם מעגלים-מודפסים, טבעת-מסלול עבה שעוברת מאחוריו
 * ומלפניו, וקרני-אור. הטבעת בגוון `--o-accent` ⇒ מתחלפת לפי התחום. ארגון
 * white-label עם `config.emoji` ממשיך לקבל את האימוג'י שלו.
 */
import { useId } from 'react';

export function OrbitMark({ size = 40 }: { size?: number }) {
  const u = useId().replace(/[^a-zA-Z0-9]/g, '');
  const id = (k: string) => `om${u}${k}`;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="אורביט" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <radialGradient id={id('c')} cx="0.38" cy="0.3" r="0.75">
          <stop offset="0" stopColor="#ffe9b0" />
          <stop offset="0.45" stopColor="#f0b45a" />
          <stop offset="1" stopColor="#7a3e10" />
        </radialGradient>
        <linearGradient id={id('r')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="var(--o-accent, #6ea8fe)" />
          <stop offset="0.55" stopColor="#ffffff" />
          <stop offset="1" stopColor="var(--o-accent2, #8fa8ff)" />
        </linearGradient>
        <clipPath id={id('b')}>
          <rect width="64" height="32" />
        </clipPath>
        <clipPath id={id('f')}>
          <rect y="32" width="64" height="32" />
        </clipPath>
        <filter id={id('g')} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* קרני-אור */}
      <g stroke="#fff" strokeWidth="2.4" strokeLinecap="round" opacity="0.9">
        <path d="M8 14l5 4M4 26l6 1M14 5l3 6M26 2l1 6" />
      </g>
      {/* חצי-הטבעת שמאחור */}
      <g transform="rotate(-22 32 32)">
        <ellipse cx="32" cy="32" rx="30" ry="10" fill="none" stroke={`url(#${id('r')})`} strokeWidth="4" clipPath={`url(#${id('b')})`} opacity="0.6" />
      </g>
      {/* כדור-המוח */}
      <g filter={`url(#${id('g')})`}>
        <circle cx="32" cy="32" r="17" fill={`url(#${id('c')})`} />
        <path d="M32 16v32" stroke="#5a2a08" strokeWidth="1.6" />
        <g stroke="#5a2a08" strokeWidth="1.5" fill="none" strokeLinecap="round">
          <path d="M32 22h-6v5h-5M32 30h-8M32 37h-5v5M32 25h7v-4M32 33h9M32 40h5v4" />
        </g>
        <g fill="#5a2a08">
          <circle cx="21" cy="27" r="1.7" />
          <circle cx="24" cy="30" r="1.7" />
          <circle cx="27" cy="42" r="1.7" />
          <circle cx="39" cy="21" r="1.7" />
          <circle cx="41" cy="33" r="1.7" />
          <circle cx="37" cy="44" r="1.7" />
        </g>
      </g>
      {/* חצי-הטבעת שלפנים */}
      <g transform="rotate(-22 32 32)">
        <ellipse cx="32" cy="32" rx="30" ry="10" fill="none" stroke={`url(#${id('r')})`} strokeWidth="4.6" clipPath={`url(#${id('f')})`} />
      </g>
    </svg>
  );
}
