/**
 * 🪐 הסמל של אורביט (22.10 — "תעדכן את הלוגו הקטן") — SVG חי במקום האימוג'י:
 * כדור-מוח עם רשת-נוירונים וטבעת-מסלול שעוברת מאחוריו ומלפניו (אותו מוטיב כמו
 * הכדור התלת-ממדי ב-Hero). הצבע נגזר מ-`--o-accent` ⇒ מתחלף אוטומטית לפי התחום.
 * ארגון white-label עם `config.emoji` ממשיך לקבל את האימוג'י שלו.
 */
export function OrbitMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label="אורביט" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <radialGradient id="om-core" cx="38%" cy="32%" r="70%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.35" stopColor="var(--o-accent2, #8fa8ff)" />
          <stop offset="1" stopColor="var(--o-g2, #0d1120)" />
        </radialGradient>
        <linearGradient id="om-ring" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="var(--o-accent, #6ea8fe)" stopOpacity="0.15" />
          <stop offset="0.5" stopColor="#ffffff" />
          <stop offset="1" stopColor="var(--o-accent, #6ea8fe)" stopOpacity="0.9" />
        </linearGradient>
        <clipPath id="om-back">
          <rect x="0" y="0" width="48" height="24" />
        </clipPath>
        <clipPath id="om-front">
          <rect x="0" y="24" width="48" height="24" />
        </clipPath>
      </defs>
      <g transform="rotate(-24 24 24)">
        {/* חצי-הטבעת שמאחורי הכדור */}
        <ellipse cx="24" cy="24" rx="22" ry="7.5" fill="none" stroke="url(#om-ring)" strokeWidth="2.2" opacity="0.55" clipPath="url(#om-back)" />
      </g>
      {/* הכדור */}
      <circle cx="24" cy="24" r="13" fill="url(#om-core)" />
      {/* רשת-נוירונים */}
      <g stroke="#ffffff" strokeOpacity="0.75" strokeWidth="0.9" fill="none">
        <path d="M17 20 L23 16 L30 19 L27 26 L20 28 Z M23 16 L27 26 M17 20 L27 26" />
      </g>
      <g fill="#ffffff">
        <circle cx="17" cy="20" r="1.6" />
        <circle cx="23" cy="16" r="1.4" />
        <circle cx="30" cy="19" r="1.7" />
        <circle cx="27" cy="26" r="1.5" />
        <circle cx="20" cy="28" r="1.3" />
      </g>
      <g transform="rotate(-24 24 24)">
        {/* חצי-הטבעת שלפני הכדור */}
        <ellipse cx="24" cy="24" rx="22" ry="7.5" fill="none" stroke="url(#om-ring)" strokeWidth="2.6" clipPath="url(#om-front)" />
      </g>
      {/* ירח קטן על המסלול */}
      <circle cx="43.2" cy="15.6" r="2.2" fill="#ffffff" />
    </svg>
  );
}
