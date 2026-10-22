/**
 * 🎞 רצועת-המסכים המתגלגלת מתחת למסך ההרשמה (22.10) — מסכי-מערכת אמיתיים לכל
 * תחום (מתמונות החנות, `public/orbit/store/img`). גלגול CSS אינסופי (העתק כפול),
 * עוצר בריחוף, מכבד prefers-reduced-motion (גלילה ידנית). לחיצה ⇒ פותחת את החנות.
 */
const base = import.meta.env.BASE_URL;

export const REEL_SCREENS: { img: string; label: string }[] = [
  { img: 'best-ed-chesed', label: 'עמותות חסד' },
  { img: 'best-ed-clinic', label: 'קליניקות' },
  { img: 'best-ed-shop', label: 'חנויות' },
  { img: 'best-ed-services', label: 'נותני שירות' },
  { img: 'best-ed-rooms', label: 'השכרת חללים' },
  { img: 'best-ed-fleet', label: 'ציי רכב' },
  { img: 'best-ed-garage', label: 'מוסכים' },
  { img: 'best-ed-hospitality', label: 'אירוח' },
  { img: 'best-ed-gemach', label: 'גמ"חים' },
  { img: 'best-ed-tzedakot', label: 'קופות צדקה' },
  { img: 'best-ed-digital', label: 'עסקים דיגיטליים' },
  { img: 'best-ed-build', label: 'בנייה' },
  { img: 'best-ed-edu', label: 'חינוך' },
];

export function ScreensReel({ onOpen }: { onOpen: () => void }) {
  const row = [...REEL_SCREENS, ...REEL_SCREENS];
  return (
    <section className="orbit-reel" aria-label="מסכים מהמערכת">
      <div className="orbit-reel-track">
        {row.map((s, i) => (
          <button
            key={i}
            type="button"
            className="orbit-reel-item"
            onClick={onOpen}
            aria-hidden={i >= REEL_SCREENS.length ? true : undefined}
            tabIndex={i >= REEL_SCREENS.length ? -1 : 0}
          >
            <img src={`${base}orbit/store/img/${s.img}.jpg`} alt={'המערכת ל' + s.label} loading="lazy" width={320} height={200} />
            <span>{s.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
