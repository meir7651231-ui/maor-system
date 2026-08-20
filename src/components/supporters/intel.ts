/**
 * מנוע-המודיעין של התורמים — טהור, דטרמיניסטי, ומתוכנן-לביצועים.
 *
 * כל שדות-המודיעין של תורם (‏RFM מפורק · LTV · מגמה · סיכון-נטישה · תחזית-מתנה ·
 * ציר-זמן-חודשי) מחושבים ב**מעבר יחיד** על אירועי-הנתינה שלו — `donorScan`. עבור
 * מסך שלם עם עשרות-אלפי תרומות זה O(סה״כ-האירועים), בלי כפל-פרסור ובלי Date.now.
 *
 * הערכים תואמים ל-supScore הקיים (אותם ספי R/F/M), אבל היום מוזרק ⇒ ניתן-לשחזור
 * ולבדיקה (בניגוד ל-supScore שנשען על השעון).
 */
import type { Supporter } from '../../types/domain';

const MS_DAY = 86_400_000;

/** הפרש-ימים בין תאריך-ISO ליום המוזרק (חיובי = בעבר). Infinity לריק/לא-תקין. */
export function dayDiff(iso: string, todayIso: string): number {
  if (!iso) return Infinity;
  const a = Date.parse(iso.slice(0, 10) + 'T12:00:00');
  const b = Date.parse(todayIso.slice(0, 10) + 'T12:00:00');
  if (Number.isNaN(a) || Number.isNaN(b)) return Infinity;
  return Math.floor((b - a) / MS_DAY);
}

/** אינדקס-חודש: כמה חודשים לפני חודש-היום (0 = החודש הנוכחי). ללא Date. */
function monthsBefore(iso: string, todayIso: string): number {
  // YYYY-MM → שנה*12+חודש, הפרש שלם — זול ומדויק בלי פרסור-תאריך.
  const y = +iso.slice(0, 4), m = +iso.slice(5, 7);
  const ty = +todayIso.slice(0, 4), tm = +todayIso.slice(5, 7);
  if (!y || !m || !ty || !tm) return -1;
  return ty * 12 + tm - (y * 12 + m);
}

export interface DonorScan {
  /** מספר אירועי-נתינה (קבלות + hist). */
  count: number;
  /** סה"כ ש"ח-שקול (₪ + $×rate). */
  ils: number;
  /** תאריך התרומה הראשונה / האחרונה ('' כשאין). */
  first: string;
  last: string;
  /** סדרת ₪-שקול פר-חודש, מהישן (index 0) לחדש (index months-1 = החודש). */
  monthly: number[];
}

/**
 * מעבר יחיד על כל אירועי-הנתינה של תורם. הבסיס לכל שאר הפונקציות — קוראים אותו
 * פעם-אחת ומחשבים ממנו, כדי לא לסרוק את ההיסטוריה חמש פעמים לכל תורם.
 */
export function donorScan(sp: Supporter, todayIso: string, rate = 3.7, months = 12): DonorScan {
  const monthly = new Array<number>(months).fill(0);
  let count = 0, ils = 0, first = '', last = '';

  const take = (date: string, amount: number, cur?: string) => {
    if (!date) return;
    count++;
    const v = (cur || '₪') === '$' ? amount * rate : amount;
    ils += v;
    if (!first || date < first) first = date;
    if (!last || date > last) last = date;
    const mb = monthsBefore(date, todayIso);
    if (mb >= 0 && mb < months) monthly[months - 1 - mb] += v;
  };

  const dons = sp.donations;
  for (let i = 0; i < dons.length; i++) take(dons[i].date, dons[i].amount, dons[i].cur);
  const hist = sp.hist;
  if (hist) for (let i = 0; i < hist.length; i++) take(hist[i].d, hist[i].a, hist[i].c);

  return { count, ils, first, last, monthly };
}

/* ---------- ספי ה-RFM — verbatim מ-supScore (עקביות עם הדרגה הקיימת) ---------- */
function rScore(days: number): number {
  return days <= 30 ? 350 : days <= 90 ? 280 : days <= 180 ? 200 : days <= 365 ? 120 : 40;
}
function fScore(cnt: number): number {
  return cnt >= 10 ? 300 : cnt >= 5 ? 230 : cnt >= 3 ? 160 : cnt >= 2 ? 100 : 50;
}
function mScore(tot: number): number {
  return tot >= 5000 ? 350 : tot >= 2000 ? 280 : tot >= 1000 ? 210 : tot >= 500 ? 140 : tot >= 100 ? 80 : 40;
}

export interface Rfm {
  r: number;
  f: number;
  m: number;
  score: number;
  /** אחוז-מיצוי פר-רכיב (0–100) — לפסי-המדד בכרטיס-הצלילה. */
  rPct: number;
  fPct: number;
  mPct: number;
}

/** פירוק ה-RFM מתוך scan מוכן (בלי לסרוק שוב). */
export function rfmFromScan(scan: DonorScan, todayIso: string): Rfm {
  const days = scan.last ? dayDiff(scan.last, todayIso) : 99999;
  const r = rScore(days), f = fScore(scan.count), m = mScore(scan.ils);
  return {
    r, f, m, score: r + f + m,
    rPct: Math.round((r / 350) * 100),
    fPct: Math.round((f / 300) * 100),
    mPct: Math.round((m / 350) * 100),
  };
}

/**
 * סיכון-נטישה 0–100 (דטרמיניסטי). מבוסס טריות מול קצב-הנתינה האישי: מי שנותן כל
 * חודש ושתק חודשיים = סיכון גבוה; מי שנותן פעם-בשנה ושתק חודשיים = נמוך. אפס
 * אירועים ⇒ 0 (לא-תורם, לא "בסיכון").
 */
export function churnFromScan(scan: DonorScan, todayIso: string): number {
  if (scan.count === 0 || !scan.last) return 0;
  const daysSince = dayDiff(scan.last, todayIso);
  const span = scan.first && scan.first !== scan.last ? dayDiff(scan.first, scan.last) : 0;
  const cadence = scan.count >= 2 && span > 0 ? span / (scan.count - 1) : 365;
  const expected = Math.max(30, cadence * 1.5); // חלון-חסד
  const ratio = daysSince / expected; // 1 = הגיע-הזמן · 2 = איחר-פי-2
  return Math.max(0, Math.min(100, Math.round(ratio * 50)));
}

export interface GiftForecast {
  /** סכום צפוי (ש"ח-שקול, מעוגל). */
  amount: number;
  /** תאריך-ISO צפוי למתנה הבאה. */
  dueIso: string;
  /** רמת-ביטחון 0–100. */
  confidence: number;
}

/** תחזית-המתנה-הבאה מתוך scan מוכן. null כשאין מספיק היסטוריה (0 אירועים). */
export function forecastFromScan(scan: DonorScan, todayIso: string): GiftForecast | null {
  if (scan.count === 0 || !scan.last) return null;
  const avg = Math.round(scan.ils / scan.count);
  const span = scan.first && scan.first !== scan.last ? dayDiff(scan.first, scan.last) : 0;
  const cadence = scan.count >= 2 && span > 0 ? span / (scan.count - 1) : 365;
  const lastMs = Date.parse(scan.last.slice(0, 10) + 'T12:00:00');
  const dueMs = lastMs + cadence * MS_DAY;
  const dueIso = new Date(dueMs).toISOString().slice(0, 10);
  // ביטחון: עולה עם מספר-המתנות, יורד כשכבר איחרו הרבה מעבר לקצב.
  const daysSince = dayDiff(scan.last, todayIso);
  const overdue = cadence > 0 ? Math.max(0, daysSince / cadence - 1) : 0;
  const confidence = Math.max(15, Math.min(92, Math.round(30 + scan.count * 7 - overdue * 25)));
  return { amount: avg, dueIso, confidence };
}

export type TrendDir = 'up' | 'down' | 'flat';
export interface DonorTrend {
  dir: TrendDir;
  /** שינוי באחוזים בין המחצית-הישנה למחצית-החדשה של החלון. */
  pct: number;
}

/** מגמת-נתינה: מחצית-חדשה מול מחצית-ישנה של הסדרה-החודשית. */
export function trendFromScan(scan: DonorScan): DonorTrend {
  const mo = scan.monthly, n = mo.length, h = Math.floor(n / 2);
  let older = 0, newer = 0;
  for (let i = 0; i < h; i++) older += mo[i];
  for (let i = n - h; i < n; i++) newer += mo[i];
  if (older === 0 && newer === 0) return { dir: 'flat', pct: 0 };
  const pct = older === 0 ? 100 : Math.round(((newer - older) / older) * 100);
  const dir: TrendDir = pct > 8 ? 'up' : pct < -8 ? 'down' : 'flat';
  return { dir, pct };
}

export interface DonorIntel {
  scan: DonorScan;
  rfm: Rfm;
  churn: number;
  forecast: GiftForecast | null;
  trend: DonorTrend;
  ltv: number;
  avgGift: number;
}

/**
 * כל המודיעין של תורם — **מעבר יחיד** ואז נגזרות זולות. זו נקודת-הכניסה שה-UI קורא
 * פר-תורם (במקום 5 פונקציות שכל אחת סורקת מחדש).
 */
export function donorIntel(sp: Supporter, todayIso: string, rate = 3.7, months = 12): DonorIntel {
  const scan = donorScan(sp, todayIso, rate, months);
  return {
    scan,
    rfm: rfmFromScan(scan, todayIso),
    churn: churnFromScan(scan, todayIso),
    forecast: forecastFromScan(scan, todayIso),
    trend: trendFromScan(scan),
    ltv: Math.round(scan.ils),
    avgGift: scan.count ? Math.round(scan.ils / scan.count) : 0,
  };
}
