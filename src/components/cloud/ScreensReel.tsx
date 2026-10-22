/**
 * 🎞 רצועת-המסכים המתגלגלת מיד מתחת לכותרת (22.10) — מסכים אמיתיים ושונים —
 * ניהול, מוצרים ושדרוג (מתמונות החנות, `public/orbit/store/img`). גלגול CSS אינסופי (העתק כפול),
 * עוצר בריחוף, מכבד prefers-reduced-motion (גלילה ידנית). לחיצה ⇒ פותחת את החנות.
 */
const base = import.meta.env.BASE_URL;

// מסכים שונים זה מזה (22.10 — "לא מסכים דומים"): ניהול, מוצרים מוכנים ושדרוג
export const REEL_SCREENS: { img: string; label: string }[] = [
  { img: 'best-pack-reports', label: 'דוחות ותובנות' },
  { img: 'best-prod-0', label: 'אפליקציית הזמנות' },
  { img: 'best-prod-2', label: 'הדמיה בתלת־ממד' },
  { img: 'best-pack-site', label: 'אתר לעסק' },
  { img: 'best-prod-17', label: 'עוזר קולי' },
  { img: 'best-prod-24', label: 'הפצה ושילוח' },
  { img: 'best-pack-shop', label: 'קופה ומלאי' },
  { img: 'best-prod-23', label: 'קהילה וקשר' },
  { img: 'best-prod-3', label: 'שילוט דיגיטלי' },
  { img: 'best-prod-25', label: 'שירות טלפוני אוטומטי' },
  { img: 'p-community-board', label: 'לוח קהילה' },
  { img: 'best-prod-4', label: 'אפליקציה לעובדי שטח' },
  { img: 'best-pack-donors', label: 'תורמים ומנויים' },
  { img: 'best-prod-28', label: 'לימוד שפות' },
  { img: 'best-prod-9', label: 'קופה בלי מחשב' },
  { img: 'best-prod-30', label: 'אימון בתלת־ממד' },
  { img: 'best-prod-12', label: 'מנוע מסחר' },
  { img: 'up-conv', label: 'שדרוג מערכת קיימת' },
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
