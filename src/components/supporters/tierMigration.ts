/**
 * מנוע-מעברי-הדרגה **האמיתי** — לא פרוקסי-מגמה. מחשב את דרגת-התורם **as-of תאריך**
 * (סריקת-נתינות עד אותו יום בלבד, טריות יחסית-לאותו יום) ⇒ מטריצת-מעברים from→to
 * מול היום. אין שינוי-סכמה: הכל נגזר מהיסטוריית-הנתינה הקיימת.
 *
 * טהור ודטרמיניסטי. מעבר פר-תורם O(אירועיו) × 2 נקודות-זמן ⇒ O(סה"כ).
 */
import type { Supporter } from '../../types/domain';
import { supTier } from './lib';

const MS_DAY = 86_400_000;
export type TierLabel = 'זהב' | 'כסף' | 'ארד' | 'רדומה';
/** דירוג-דרגה להשוואת עלייה/ירידה (גבוה=טוב יותר). */
const TIER_RANK: Record<TierLabel, number> = { 'זהב': 4, 'כסף': 3, 'ארד': 2, 'רדומה': 1 };
const TIER_ORDER: TierLabel[] = ['זהב', 'כסף', 'ארד', 'רדומה'];

/* ספי-RFM — verbatim מ-supScore (עקביות עם הדרגה החיה). */
function rScore(days: number): number { return days <= 30 ? 350 : days <= 90 ? 280 : days <= 180 ? 200 : days <= 365 ? 120 : 40; }
function fScore(c: number): number { return c >= 10 ? 300 : c >= 5 ? 230 : c >= 3 ? 160 : c >= 2 ? 100 : 50; }
function mScore(t: number): number { return t >= 5000 ? 350 : t >= 2000 ? 280 : t >= 1000 ? 210 : t >= 500 ? 140 : t >= 100 ? 80 : 40; }

/**
 * דרגת-התורם נכון-ל-asOfIso — סופר רק נתינות עד אותו יום, וטריות יחסית-אליו.
 * null = לא-היה-תורם עדיין (אין נתינה עד אותו יום).
 */
export function tierAsOf(sp: Supporter, asOfIso: string, rate = 3.7): TierLabel | null {
  const cut = asOfIso.slice(0, 10);
  const asMs = Date.parse(cut + 'T12:00:00');
  let count = 0, ils = 0, last = '';
  const take = (date: string, amount: number, cur?: string) => {
    if (!date) return;
    const d = date.slice(0, 10);
    if (d > cut) return; // אחרי נקודת-הזמן — לא קיים עדיין
    count++;
    ils += (cur || '₪') === '$' ? amount * rate : amount;
    if (!last || d > last) last = d;
  };
  const dons = sp.donations;
  for (let i = 0; i < dons.length; i++) take(dons[i].date, dons[i].amount, dons[i].cur);
  const hist = sp.hist;
  if (hist) for (let i = 0; i < hist.length; i++) take(hist[i].d, hist[i].a, hist[i].c);
  if (count === 0) return null;
  const days = last ? Math.floor((asMs - Date.parse(last + 'T12:00:00')) / MS_DAY) : 99999;
  const score = rScore(days) + fScore(count) + mScore(ils);
  return supTier(score).label as TierLabel;
}

export interface TierFlow { from: TierLabel; to: TierLabel; count: number; }

export interface TierMigration {
  /** תורמים שעלו דרגה מאז נקודת-הבסיס. */
  promoted: number;
  /** ירדו דרגה. */
  demoted: number;
  /** נשארו באותה דרגה. */
  stable: number;
  /** גויסו מאז (לא-היו-תורמים בבסיס, תורמים היום). */
  newDonors: number;
  /** כל המעברים ששינו-דרגה (from≠to), ממויין לפי כמות יורד. */
  flows: TierFlow[];
  /** נקודת-הבסיס (ISO). */
  fromIso: string;
}

/** הזזת-תאריך אחורה ב-N חודשים (ללא Date.now). */
function shiftMonths(iso: string, monthsBack: number): string {
  const y = +iso.slice(0, 4), m = +iso.slice(5, 7), d = iso.slice(8, 10);
  const tot = y * 12 + (m - 1) - monthsBack;
  const ny = Math.floor(tot / 12), nm = (tot % 12) + 1;
  return ny + '-' + String(nm).padStart(2, '0') + '-' + d;
}

/**
 * מטריצת-מעברי-דרגה אמיתית: דרגה לפני monthsBack חודשים מול היום.
 */
export function tierMigration(
  supporters: readonly Supporter[],
  todayIso: string,
  monthsBack = 12,
  rate = 3.7,
): TierMigration {
  const fromIso = shiftMonths(todayIso.slice(0, 10), monthsBack);
  const flowMap = new Map<string, TierFlow>();
  let promoted = 0, demoted = 0, stable = 0, newDonors = 0;

  for (const sp of supporters) {
    const to = tierAsOf(sp, todayIso, rate);
    if (!to) continue; // לא-תורם היום ⇒ לא רלוונטי
    const from = tierAsOf(sp, fromIso, rate);
    if (!from) { newDonors++; continue; }
    const diff = TIER_RANK[to] - TIER_RANK[from];
    if (diff > 0) promoted++;
    else if (diff < 0) demoted++;
    else stable++;
    if (from !== to) {
      const key = from + '→' + to;
      const row = flowMap.get(key);
      if (row) row.count++;
      else flowMap.set(key, { from, to, count: 1 });
    }
  }

  const flows = [...flowMap.values()].sort((a, b) => b.count - a.count);
  return { promoted, demoted, stable, newDonors, flows, fromIso };
}

export { TIER_ORDER };
