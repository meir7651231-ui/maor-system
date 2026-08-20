/**
 * מנוע-הדירוג — **היכן התורם ממוקם** מול כלל-התיק ומול דרגתו. משלים את ה-RFM (כמה
 * הוא שווה) בהקשר-יחסי (איפה זה מציב אותו). טהור: מיון-יחיד לפי-LTV ⇒ O(n log n).
 *
 * דטרמיניסטי — ה-LTV נגזר מ-donorScan (יום מוזרק). שוברי-שוויון יציבים (לפי id) כדי
 * שאותו קלט ייתן אותו דירוג בדיוק (ratchet-friendly).
 */
import type { Supporter } from '../../types/domain';
import { donorScan, rfmFromScan } from './intel';
import { supTier } from './lib';

export interface DonorRank {
  /** מקום לפי-LTV בכל התיק (1 = הגדול ביותר). */
  ltvRank: number;
  /** גודל-התיק (תורמים-פעילים). */
  total: number;
  /** אחוזון LTV (100 = בראש · דטרמיניסטי מהדירוג). */
  percentile: number;
  /** מקום בתוך הדרגה. */
  tierRank: number;
  /** גודל-הדרגה. */
  tierSize: number;
  /** תווית-הדרגה. */
  tier: string;
}

interface Row { id: string; ltv: number; tier: string; }

/** מפת דירוג פר-מזהה-תורם. תורמים בלי היסטוריית-נתינה אינם נכללים. */
export function donorRanks(
  supporters: readonly Supporter[],
  todayIso: string,
  rate = 3.7,
): Map<string, DonorRank> {
  const rows: Row[] = [];
  for (const sp of supporters) {
    const scan = donorScan(sp, todayIso, rate, 12);
    if (scan.count === 0) continue;
    const tier = supTier(rfmFromScan(scan, todayIso).score).label;
    rows.push({ id: sp.id, ltv: Math.round(scan.ils), tier });
  }
  // מיון LTV יורד; שובר-שוויון יציב לפי id ⇒ דירוג חוזר-על-עצמו.
  rows.sort((a, b) => (b.ltv - a.ltv) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  const total = rows.length;
  const tierSizes = new Map<string, number>();
  for (const r of rows) tierSizes.set(r.tier, (tierSizes.get(r.tier) || 0) + 1);

  const out = new Map<string, DonorRank>();
  const tierSeen = new Map<string, number>();
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const ltvRank = i + 1;
    const tierRank = (tierSeen.get(r.tier) || 0) + 1;
    tierSeen.set(r.tier, tierRank);
    out.set(r.id, {
      ltvRank,
      total,
      percentile: total > 0 ? Math.round(((total - i) / total) * 100) : 0,
      tierRank,
      tierSize: tierSizes.get(r.tier) || 1,
      tier: r.tier,
    });
  }
  return out;
}
