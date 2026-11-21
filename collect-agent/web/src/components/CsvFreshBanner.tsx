import { useApp } from '../store.tsx';
import { csvBannerText } from '../lib/csvFreshness.ts';

/** באנר «העלו קובץ CSV עדכני» בבית (עסק CSV, ייבוא אחרון מעל 24 שעות). צבעים ≥4.5:1 (שומר הניגודיות הסטטי). */
export function CsvFreshBanner() {
  const { csvFreshness } = useApp();
  const text = csvBannerText(csvFreshness);
  if (!text) return null;
  return (
    <div role="status" data-testid="csv-fresh-banner" className="rounded-2xl border border-amber-300 bg-amber-50 text-ink-900 p-4 flex flex-wrap items-center gap-3">
      <span aria-hidden className="text-xl">📄</span>
      <div className="flex-1 min-w-0">
        {/* התאריך כיחידה אחת (num = ltr מבודד, nowrap) — אחרת בשבירת שורה «מ-08.11.2026» מתהפך ל«08.11.2026-מ» */}
        <p className="font-extrabold text-amber-900">{text.split(/(מ-\d{2}\.\d{2}\.\d{4})/).map((part, i) => /^מ-\d/.test(part)
          ? <span key={i} className="whitespace-nowrap">מ-<span className="num">{part.slice(2)}</span></span> : part)}</p>
        <p className="text-sm">ייבוא אחרון מעל 24 שעות ⇒ תזכורות על חשבוניות מהקובץ לא יוצאות עד שתעלו קובץ טרי (כדי לא לתזכר מי שכבר שילם).</p>
      </div>
      <a href="#/settings?s=csv" data-testid="csv-fresh-import"
        className="inline-flex items-center justify-center min-h-11 rounded-xl bg-ink-900 text-white px-4 font-bold whitespace-nowrap w-full sm:w-auto">📄 ייבוא קובץ ←</a>
    </div>
  );
}
