/**
 * 📒 פרנסה׳לע — עורך דף-העסק של המקור (עיצוב 4), הליבה הטהורה: 8 החלקים (SECS), "הושלם" וסיכום לכל חלק
 * (secDone/secSum), אחוז-השלמות עם 3 הצעדים הבאים (completeness), לוח-הזמנים של המקור (ימים + משעה/עד) מעל
 * חלונות-הפורט (schedOf/composeHours — חלונות נוספים ומוצ״ש נשמרים), ומד-גודל-הדף (docBytes מול 240KB).
 * הגבאי עורך בשם בעל-העסק (בהסכמתו) — אותו עורך, אותה מכונת-אישור ב-store.
 */
import type { PrHours, PrListing } from '../../types/domain';
import { PR_LANG_NAMES } from './lib';
import { PR_PAY_NAMES, tfmt } from './biz';
import { PN_PALETTES } from './home';
import { hmToMin } from './zmanimBoard';
import { docBytes, PR_IMG } from './model';

export type PnSec = 'basic' | 'design' | 'svc' | 'photos' | 'hours' | 'faq' | 'pay' | 'cert';

/** SECS של המקור: מפתח · כותרת · אייקון. */
export const PN_SECS: ReadonlyArray<readonly [PnSec, string, string]> = [
  ['basic', 'פרטים בסיסיים', 'tab-card'],
  ['design', 'עיצוב: צבע ולוגו', 'palette'],
  ['svc', 'שירותים ומחירים', 'tag'],
  ['photos', 'תמונות', 'img'],
  ['hours', 'שעות פעילות', 'clock'],
  ['faq', 'שאלות נפוצות', 'q'],
  ['pay', 'תשלום ושפות', 'wallet'],
  ['cert', 'תעודות, השגחה וותק', 'shield'],
];

const DN = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'מוצ״ש'] as const;
const hasSched = (d: PrListing): boolean => d.always === true || d.hours.length > 0;
const n = (xs: unknown): number => (Array.isArray(xs) ? xs.length : 0);

/** completeness של המקור: משקלים, ו-3 הצעדים הבאים (הכבדים ראשונים). */
export function completeness(d: PrListing): { pct: number; next: Array<[number, PnSec, string]> } {
  const items: Array<[number, boolean, PnSec, string]> = [
    [20, !!(d.name.trim() && d.title.trim() && d.category && d.phone.trim()), 'basic', 'שם, מקצוע וטלפון'],
    [12, d.desc.trim().length >= 60, 'basic', 'ספרו על העסק'],
    [6, !!(d.tagline ?? '').trim(), 'basic', 'משפט מפתח'],
    [10, !!d.logo, 'design', 'העלו לוגו'],
    [4, !!d.palette, 'design', 'בחרו צבע לדף'],
    [15, d.services.length >= 2, 'svc', 'הוסיפו מחירון'],
    [12, n(d.photos) >= 1, 'photos', 'הוסיפו תמונות'],
    [8, hasSched(d), 'hours', 'הגדירו שעות'],
    [5, n(d.faq) >= 1, 'faq', 'שאלות נפוצות'],
    [4, n(d.pay) >= 1, 'pay', 'אמצעי תשלום'],
    [4, !!(d.city.trim() || d.area.trim()), 'basic', 'אזור שירות'],
  ];
  return {
    pct: items.reduce((t, x) => t + (x[1] ? x[0] : 0), 0),
    next: items
      .filter((x) => !x[1])
      .sort((a, b) => b[0] - a[0])
      .slice(0, 3)
      .map((x) => [x[0], x[2], x[3]]),
  };
}

/** secDone של המקור. */
export function secDone(d: PrListing, k: PnSec): boolean {
  switch (k) {
    case 'basic':
      return !!(d.name.trim() && d.title.trim() && d.category && d.phone.trim());
    case 'design':
      return !!(d.logo || d.palette);
    case 'svc':
      return d.services.length > 0;
    case 'photos':
      return n(d.photos) > 0;
    case 'hours':
      return hasSched(d) || !!d.hoursNote.trim();
    case 'faq':
      return n(d.faq) > 0;
    case 'pay':
      return n(d.pay) > 0;
    default:
      return !!((d.cert ?? '').trim() || d.kashrut.trim() || d.years);
  }
}

/** תקציר-השעות (secSum hours): "א׳ ב׳ ג׳ ד׳ ה׳ · 8:00–19:00" כשכל החלונות באותה שעה; אחרת "N חלונות". */
function hoursSum(d: PrListing): string {
  if (d.always) return '24/7';
  if (!d.hours.length) return d.hoursNote.trim() || 'כדי שידעו מתי להתקשר';
  const keys = new Set(d.hours.map((h) => h.from + '-' + h.to));
  if (keys.size === 1) {
    const h = d.hours[0];
    const days = [...new Set(d.hours.map((x) => x.dow))].sort((a, b) => a - b).map((x) => DN[x] ?? '');
    return days.join(' ') + ' · ' + tfmt(hmToMin(h.from) ?? 0) + '–' + (h.to === '24:00' ? 'חצות' : tfmt(hmToMin(h.to) ?? 0));
  }
  return d.hours.length + ' חלונות שעות';
}

/** secSum של המקור — שורת-המשנה בכותרת כל חלק. */
export function secSum(d: PrListing, k: PnSec): string {
  switch (k) {
    case 'basic':
      return [d.name.trim(), d.title.trim()].filter(Boolean).join(' · ') || 'שם, מקצוע, טלפון ותיאור';
    case 'design': {
      const pal = PN_PALETTES.find((p) => p[0] === d.palette);
      return [pal ? 'צבע ' + pal[1] : 'צבע ברירת מחדל', d.logo ? 'לוגו ✓' : 'בלי לוגו'].join(' · ');
    }
    case 'svc':
      return d.services.length ? (d.services.length === 1 ? 'שירות אחד' : d.services.length + ' שירותים') : 'מחירון ברור מביא פניות';
    case 'photos':
      return n(d.photos) ? n(d.photos) + ' מתוך 4' : 'עד 4 תמונות של עבודות ומוצרים';
    case 'hours':
      return hoursSum(d);
    case 'faq':
      return n(d.faq) ? (n(d.faq) === 1 ? 'שאלה אחת' : n(d.faq) + ' שאלות') : 'חוסך שיחות מיותרות';
    case 'pay':
      return (
        [(d.pay ?? []).map((x) => PR_PAY_NAMES[x] ?? '').filter(Boolean).join(', '), d.languages.map((l) => PR_LANG_NAMES[l] ?? l).join(', ')].filter(Boolean).join(' · ') ||
        'מזומן, ביט, אשראי…'
      );
    default:
      return [d.years ? 'ותק ' + d.years : '', (d.cert ?? '').trim(), d.kashrut.trim() ? 'השגחה' : ''].filter(Boolean).join(' · ') || 'תעודה מקצועית, השגחה, שנות ותק';
  }
}

/* ═══════════════ לוח-הזמנים: ימים + שעה (המקור) מעל חלונות-הפורט ═══════════════ */

export interface PnSched {
  /** ימי-העבודה (0=א׳ … 5=ו׳) של החלון הראשי. */
  days: number[];
  from: string;
  to: string;
  /** חלונות-הפורט שלא נכנסים לחלון הראשי (שעות שונות ביום מסוים, מוצ״ש). */
  extra: PrHours[];
}

/** פירוק: החלון הראשי = צמד-השעות השכיח בימי-החול; כל השאר — חלונות נוספים. ריק ⇒ ברירת-המחדל 08:00–19:00. */
export function schedOf(hours: readonly PrHours[]): PnSched {
  const wk = hours.filter((h) => h.dow >= 0 && h.dow <= 5);
  const count = new Map<string, number>();
  for (const h of wk) count.set(h.from + '|' + h.to, (count.get(h.from + '|' + h.to) ?? 0) + 1);
  let best = '';
  let n = 0;
  for (const [k, c] of count) if (c > n) [best, n] = [k, c];
  if (!best) return { days: [], from: '08:00', to: '19:00', extra: hours.map((h) => ({ ...h })) };
  const [from, to] = best.split('|');
  const days: number[] = [];
  const extra: PrHours[] = [];
  for (const h of hours) {
    if (h.dow >= 0 && h.dow <= 5 && h.from === from && h.to === to && !days.includes(h.dow)) days.push(h.dow);
    else extra.push({ ...h });
  }
  return { days: days.sort((a, b) => a - b), from, to, extra };
}

/** הרכבה בחזרה: ימי-החלון-הראשי × משעה-עד + החלונות הנוספים (ממוין לפי יום ושעה). */
export function composeHours(s: PnSched): PrHours[] {
  return [...s.days.map((dow) => ({ dow, from: s.from, to: s.to })), ...s.extra].sort((a, b) => a.dow - b.dow || (hmToMin(a.from) ?? 0) - (hmToMin(b.from) ?? 0));
}

/* ═══════════════ שמירה מול הרשומה החיה ═══════════════ */

/**
 * מיזוג-שלושה מול הרשומה החיה: הטיוטה שורדת מעבר-לשונית (במקור הטופס נשאר בדף), ובינתיים הרשומה יכולה להשתנות —
 * המלצה מהגיליון, אישור וקוד-חיוג מהגבאי, קידום מ"ניהול", מכשיר אחר. כל שדה שהעורך לא שינה מאז הטעינה/השמירה
 * האחרונה (saved) נלקח מהרשומה החיה (live); רק מה שנערך באמת — מהטיוטה. כך טיוטה ישנה לא דורסת.
 */
export function rebaseDraft(cur: PrListing, saved: PrListing, live: PrListing): PrListing {
  const c = cur as unknown as Record<string, unknown>;
  const s = saved as unknown as Record<string, unknown>;
  const out: Record<string, unknown> = { ...(live as unknown as Record<string, unknown>) };
  for (const k of new Set([...Object.keys(c), ...Object.keys(s)])) if (JSON.stringify(c[k]) !== JSON.stringify(s[k])) out[k] = c[k];
  return out as unknown as PrListing;
}

/* ═══════════════ גודל-הדף ═══════════════ */

export { docBytes };

/** "34KB" (kb במקור). */
export function kb(n: number): string {
  return Math.max(1, Math.round(n / 1024)) + 'KB';
}

/** מד-הגודל: מעל התקרה / מעל 82% / תקין. */
export function sizeState(bytes: number): 'over' | 'warn' | 'ok' {
  return bytes > PR_IMG.doc ? 'over' : bytes > PR_IMG.doc * 0.82 ? 'warn' : 'ok';
}
