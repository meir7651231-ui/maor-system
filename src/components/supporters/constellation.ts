/**
 * מנוע-פריסת-הגלקסיה — טהור ודטרמיניסטי. ממפה כל תורם לכוכב במרחב מופשט
 * (זווית · רדיוס · גודל), שאותו מסך-הגלקסיה / העולם-התלת-ממד מקרין למסך.
 *
 * הכל נגזרת של הנתונים הקיימים (דרך donorScan): רדיוס=טריות (מי שמתקרר נסחף
 * החוצה) · גודל=ערך-חיים (לוג-נורמלי) · צבע=דרגה · בוהק-אדום=סיכון-נטישה. הזווית
 * דטרמיניסטית ממזהה-התורם ⇒ יציבה בין רינדורים (לא Math.random). מעבר-יחיד לתורם.
 */
import type { Supporter } from '../../types/domain';
import { supTier } from './lib';
import { churnFromScan, dayDiff, donorScan, rfmFromScan } from './intel';

export type TierKey = 'gold' | 'silver' | 'bronze' | 'dormant';
const TIER_KEY: Record<string, TierKey> = { 'זהב': 'gold', 'כסף': 'silver', 'ארד': 'bronze', 'רדומה': 'dormant' };

export interface ConstellationNode {
  id: string;
  name: string;
  /** מיקום מופשט: זווית (0–1 = סיבוב מלא) · רדיוס (0=ליבה, 1=קצה). */
  angle: number;
  radius: number;
  /** גודל יחסי 0.15–1 (לוג של ערך-החיים מול המרבי בסט). */
  size: number;
  tier: TierKey;
  atRisk: boolean;
  /** ערך-חיים (ש"ח-שקול) וסיכון-נטישה 0–100 — לטוליטיפ. */
  val: number;
  churn: number;
}

/** hash דטרמיניסטי [0,1) ממחרוזת (FNV-1a) — לזווית יציבה בלי שעון/רנדום. */
function hash01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) / 4294967296;
}

/** רדיוס לפי ימי-שקט (טרי=פנימי, רדום=חיצוני) + נדנוד דטרמיניסטי קטן. */
function radiusFor(daysSince: number, jitter: number): number {
  const base = daysSince <= 30 ? 0.30 : daysSince <= 90 ? 0.45 : daysSince <= 180 ? 0.60 : daysSince <= 365 ? 0.75 : 0.9;
  return Math.max(0.18, Math.min(0.98, base + (jitter - 0.5) * 0.1));
}

export interface ConstellationOpts {
  rate?: number;
  /** סף סיכון לבוהק-אדום (ברירת-מחדל 60). */
  riskThreshold?: number;
}

/**
 * פריסת כל התורמים לכוכבים. מעבר-ראשון: scan + מדדים + max-LTV; מעבר-שני: נרמול
 * הגודל מול ה-max. O(סה"כ-האירועים) — מתאים לעשרות-אלפי תרומות.
 */
export function donorConstellation(
  supporters: readonly Supporter[],
  todayIso: string,
  opts: ConstellationOpts = {},
): ConstellationNode[] {
  const rate = opts.rate ?? 3.7;
  const riskT = opts.riskThreshold ?? 60;
  const raw: { sp: Supporter; ils: number; days: number; tier: TierKey; churn: number }[] = [];
  let maxLog = 0;

  for (const sp of supporters) {
    const scan = donorScan(sp, todayIso, rate, 12);
    if (scan.count === 0) continue; // רק תורמים-בפועל בגלקסיה
    const days = dayDiff(scan.last, todayIso);
    const tier = TIER_KEY[supTier(rfmFromScan(scan, todayIso).score).label] ?? 'dormant';
    const churn = churnFromScan(scan, todayIso);
    const lg = Math.log10(scan.ils + 1);
    if (lg > maxLog) maxLog = lg;
    raw.push({ sp, ils: scan.ils, days, tier, churn });
  }

  return raw.map((r) => ({
    id: r.sp.id,
    name: r.sp.name,
    angle: hash01(r.sp.id),
    radius: radiusFor(r.days, hash01(r.sp.id + '#r')),
    size: maxLog > 0 ? Math.max(0.15, Math.min(1, Math.log10(r.ils + 1) / maxLog)) : 0.15,
    tier: r.tier,
    atRisk: r.churn >= riskT,
    val: Math.round(r.ils),
    churn: r.churn,
  }));
}
