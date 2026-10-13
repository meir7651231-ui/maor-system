/**
 * 📒 פרנסה׳לע — דף-העסק של המקור (עיצוב 3), הליבה הטהורה (בלי store/DOM): תגי-האמון (trustHTML), אריחי-הפרטים,
 * "איך פונים", המחיר בפורמט-המקור (fmtPrice), תאריך-המבצע, הקופה של העסק (kupaRow — מטבע לכל תשובה/תודה), שורת-
 * ההעתקה לשיתוף, שעות-הפעילות לשבוע (חלונות-הפורט: כמה חלונות ביום + מוצ״ש), ומגבלות-התמונות של דף-העסק.
 */
import type { IsoDate, PrListing, PrRequest } from '../../types/domain';
import { categoryOf, isFeatured, PR_AUD_NAMES, PR_LANG_NAMES } from './lib';
import { clockAt, hmToMin } from './zmanimBoard';

/* ═══════════════ תשלום · מחיר · מבצע ═══════════════ */

/** אמצעי-התשלום של המקור (PAYS). */
export const PR_PAYS: ReadonlyArray<readonly [string, string]> = [
  ['cash', 'מזומן'],
  ['transfer', 'העברה בנקאית'],
  ['bit', 'ביט'],
  ['credit', 'אשראי'],
  ['checks', 'צ׳קים'],
];
export const PR_PAY_NAMES: Readonly<Record<string, string>> = Object.fromEntries(PR_PAYS);

/** המחיר כמו במקור (fmtPrice): "1500" ⇒ "1,500 ₪" · "מ300" / "החל מ-300" ⇒ "מ־300 ₪" · טקסט אחר — כמות-שהוא. */
export function fmtPrice(p: unknown): string {
  const t = String(p ?? '').trim();
  if (!t) return '';
  const n = t.replace(/[₪,\s]/g, '');
  if (/^\d+(\.\d+)?$/.test(n)) return Number(n).toLocaleString('en-US') + ' ₪';
  const m = /^(מ|החל מ)[־-]?\s*(\d[\d,.]*)\s*₪?$/.exec(t);
  if (m) return 'מ־' + Number(m[2].replace(/,/g, '')).toLocaleString('en-US') + ' ₪';
  return t;
}

/** "עד D.M" של המבצע (offerUntil במקור) מתאריך ISO. */
export function offerUntilText(until: IsoDate | ''): string {
  const m = /^\d{4}-(\d{2})-(\d{2})$/.exec(String(until ?? ''));
  return m ? 'עד ' + Number(m[2]) + '.' + Number(m[1]) : '';
}

/* ═══════════════ תגי-אמון · אריחים · איך פונים ═══════════════ */

export interface PnTrust {
  /** אייקון (או 'crown' לכתר). */
  i: string;
  t: string;
  k?: 'g' | 'ok' | 'em';
}

/** תגי-האמון (trustHTML): מומלץ · ותק · ממליצים · תעודה · השגחה · הנחה · גמ״ח · חירום — בסדר של המקור. */
export function trustOf(l: PrListing, todayIso: IsoDate, name: string): PnTrust[] {
  const t: PnTrust[] = [];
  if (isFeatured(l, todayIso)) t.push({ i: 'crown', t: 'מומלץ ' + name, k: 'g' });
  const y = typeof l.years === 'number' && l.years > 0 ? Math.floor(l.years) : 0;
  if (y) t.push({ i: 'medal', t: y === 1 ? 'ותק של שנה' : 'ותק ' + y + ' שנים' });
  const n = Array.isArray(l.recs) ? l.recs.length : 0;
  if (n) t.push({ i: 'heart', t: n === 1 ? 'ממליץ אחד' : n + ' ממליצים' });
  if (typeof l.cert === 'string' && l.cert.trim()) t.push({ i: 'cert', t: l.cert.trim() });
  if (l.kashrut.trim()) t.push({ i: 'shield', t: 'השגחה: ' + l.kashrut.trim() });
  if (l.disc) t.push({ i: 'tag', t: 'הנחה לקהילה' });
  if (l.free) t.push({ i: 'hand', t: 'גמ״ח', k: 'ok' });
  if (l.emergency) t.push({ i: 'siren', t: '24/7 חירום', k: 'em' });
  return t;
}

export interface PnTile {
  i: string;
  k: string;
  v: string;
  /** אמצעי-תשלום — צ'יפים, אריח רחב. */
  chips?: string[];
}

/** אריחי "פרטים / פרטי העסק": תחום · גר ב · אזור שירות · שפות · מתאים · אמצעי תשלום. */
export function tilesOf(l: PrListing): PnTile[] {
  const out: PnTile[] = [{ i: 'tab-alfon', k: 'תחום', v: categoryOf(l.category).name }];
  if (l.city.trim()) out.push({ i: 'pin', k: 'גר ב', v: l.city.trim() });
  if (l.area.trim()) out.push({ i: 'truck', k: 'אזור שירות', v: l.area.trim() });
  if (l.languages.length) out.push({ i: 'lang', k: 'שפות', v: l.languages.map((x) => PR_LANG_NAMES[x] ?? x).join(', ') });
  if (l.aud && l.aud !== 'all') out.push({ i: 'tab-card', k: 'מתאים', v: PR_AUD_NAMES[l.aud] ?? '' });
  const pay = (Array.isArray(l.pay) ? l.pay : []).filter((x) => PR_PAY_NAMES[x]);
  if (pay.length) out.push({ i: 'wallet', k: 'אמצעי תשלום', v: '', chips: pay.map((x) => PR_PAY_NAMES[x]) });
  return out;
}

/** "איך פונים" — שלושת הצעדים של המקור (כשאין תיאור, שירותים ותמונות). */
export function howtoOf(hasWa: boolean): Array<[string, string]> {
  return [
    [hasWa ? 'שולחים וואטסאפ' : 'מתקשרים למספר', hasWa ? 'בכפתור הירוק למטה. ההודעה כבר כתובה, רק לשלוח.' : 'מעתיקים את המספר בלחיצה ומחייגים.'],
    ['מתאמים מחיר ומועד', 'כדאי לשאול מראש על מחיר, זמן הגעה ואחריות.'],
    ['אחרי העבודה: מילה טובה', 'המלצה קצרה כאן עוזרת לכל הקהילה לבחור.'],
  ];
}

/** "העתקת הפרטים כטקסט" — השורה שמועתקת לשיתוף (המקור). */
export function shareLine(l: PrListing, brand: string): string {
  return l.name + ' · ' + l.title + ' · ' + l.phone + ' (מתוך ' + brand + ')';
}

/* ═══════════════ שעות-הפעילות לשבוע ═══════════════ */

/** שעה כמו במקור (tfmt): "7:30" בלי אפס מוביל; 24:00 ⇒ "חצות". */
export function tfmt(m: number): string {
  return m >= 1440 ? 'חצות' : Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0');
}

/** חלונות-השעות של יום (dow) כטקסט ("7:30–19:00, 20:00–22:00"); אין ⇒ ''. */
export function dayWindowsText(l: PrListing, dow: number): string {
  return l.hours
    .filter((h) => h.dow === dow && hmToMin(h.from) !== null && hmToMin(h.to) !== null)
    .sort((a, b) => (hmToMin(a.from) ?? 0) - (hmToMin(b.from) ?? 0))
    .map((h) => tfmt(hmToMin(h.from) ?? 0) + '–' + (h.to === '24:00' ? 'חצות' : tfmt(hmToMin(h.to) ?? 0)))
    .join(', ');
}

/** שמות-הימים של טבלת-השעות (DN במקור). */
const DN = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'] as const;

/** טבלת-השבוע (hoursTable): א׳–ו׳ — החלונות/"24 שעות"/"סגור"; שבת — "שבת קודש" (+ חלונות-מוצ״ש של הפורט). */
export function weekRows(l: PrListing, todayDow: number): Array<{ d: number; label: string; v: string; today: boolean }> {
  return [0, 1, 2, 3, 4, 5, 6].map((d) => {
    const w = dayWindowsText(l, d);
    const v = d === 6 ? 'שבת קודש' + (w ? ' · מוצ״ש ' + w : '') : l.always ? '24 שעות' : w || 'סגור';
    return { d, label: 'יום ' + DN[d] + (d === todayDow ? ' · היום' : ''), v, today: d === todayDow };
  });
}

/** יש מה להציג בסעיף-השעות (שעות · הערת-שעות · חירום). */
export function hasHours(l: PrListing): boolean {
  return l.always === true || l.hours.length > 0 || !!l.hoursNote.trim() || l.emergency === true;
}

/* ═══════════════ הקופה של העסק ═══════════════ */

export interface PnKupa {
  /** מטבעות: תשובות-העסק לבקשות + תודות (המלצות). */
  n: number;
  ans: number;
  th: number;
  /** מתוכם — מתחילת החודש העברי. */
  mo: number;
  /** תמונת-הפושקע לפי מילוי (pushke-3d-fill-XX). */
  art: string;
}

/** kpArt: ספי-המילוי של המקור ⇒ שם-הקובץ. */
export function kupaArt(n: number): string {
  const t = n <= 0 ? 0 : n <= 3 ? 2 : n <= 7 ? 5 : n <= 14 ? 10 : n <= 27 ? 20 : n <= 47 ? 35 : 60;
  return 'fill-' + String(t).padStart(2, '0');
}

/**
 * coinEv של המקור: כל תשובה של העסק לבקשה (בפורט — תגובה עם listingId שלו) וכל תודה (המלצה) = מטבע. "החודש" =
 * מתחילת החודש העברי (startIso מהשלד, בתאריך-הקהילה — כמו helpCount).
 */
export function kupaOf(l: PrListing, requests: readonly PrRequest[], startIso: IsoDate, tz: string): PnKupa {
  let ans = 0;
  let th = 0;
  let mo = 0;
  const inMonth = (iso: string): boolean => {
    const t = Date.parse(String(iso ?? ''));
    return Number.isFinite(t) && clockAt(t, tz).iso >= startIso;
  };
  for (const r of requests)
    for (const x of Array.isArray(r.responses) ? r.responses : [])
      if (x.listingId === l.id) {
        ans++;
        if (inMonth(x.at)) mo++;
      }
  for (const x of Array.isArray(l.recs) ? l.recs : []) {
    th++;
    if (inMonth(x.at)) mo++;
  }
  const n = ans + th;
  return { n, ans, th, mo, art: kupaArt(n) };
}

/* ═══════════════ תמונות ולוגו (data:URI מקומי — תקרות המקור + תקציב) ═══════════════ */

/** עד 4 תמונות לעסק (המקור). */
export const PR_PHOTO_MAX = 4;
/** צלע-מרבית לתמונה (900px במקור) ולוגו (256px). */
export const PR_PHOTO_DIM = 900;
export const PR_LOGO_DIM = 256;
/** תקרת-אורך למחרוזת (≈45KB/25KB בינארי במקור, base64 ≈ ×1.37 + כותרת). */
export const PR_PHOTO_LEN = 64_000;
export const PR_LOGO_LEN = 36_000;
/** תקציב-הארגון לכל תמונות-העסקים והלוגואים יחד (מסמך-ה-DB המקומי; מספר = פשרת-מוצר — לבעלים). */
export const PR_ORG_PHOTO_BUDGET = 3_000_000;

/** משקל-התמונות של עסק (לוגו + תמונות). */
export function listingImageLen(l: Pick<PrListing, 'logo' | 'photos'>): number {
  return (typeof l.logo === 'string' ? l.logo.length : 0) + (Array.isArray(l.photos) ? l.photos.reduce((a, p) => a + (typeof p === 'string' ? p.length : 0), 0) : 0);
}
/** משקל-התמונות של כל הארגון (בלי העסק הנערך — exceptId). */
export function orgImageLen(listings: readonly PrListing[], exceptId = ''): number {
  let n = 0;
  for (const l of listings) if (l.id !== exceptId) n += listingImageLen(l);
  return n;
}
