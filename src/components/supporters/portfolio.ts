/**
 * מודיעין-תיק וקוהורטה — טהור, מעבר-יחיד על התורמים (כל תורם נסרק פעם-אחת דרך
 * donorScan ⇒ O(סה"כ-האירועים) לכל המסך, מתאים לעשרות-אלפי תרומות).
 *
 * מטריקות שדורשות מצב-היסטורי שלא נשמר (מיגרציית-דרגות אמיתית) מוחלפות בפרוקסי
 * ישר וכן — מגמת-נתינה (trend) — ומסומנות ככאלה. אין המצאת-נתונים.
 */
import type { Supporter } from '../../types/domain';
import { supTier } from './lib';
import {
  churnFromScan,
  dayDiff,
  donorScan,
  forecastFromScan,
  rfmFromScan,
  trendFromScan,
} from './intel';

/** סף סיכון-נטישה שמעליו תורם נחשב "בסכנה" (0–100). */
export const PORTFOLIO_RISK_THRESHOLD = 60;

export interface PortfolioIntel {
  count: number;
  giftCount: number;
  /** סה"כ שווי-תיק (ש"ח-שקול). */
  ltv: number;
  avgGift: number;
  /** אחוז התורמים שנתנו ב-365 הימים האחרונים (מבין מי שנתן אי-פעם). */
  retention12m: number;
  atRiskCount: number;
  atRiskMoney: number;
  /** אחוז ה-LTV שמגיע מ-topN התורמים המובילים. */
  concentrationTopN: number;
  topN: number;
  /** סכום התחזיות שמועדן ב-30/90 הימים הקרובים (ש"ח-שקול). */
  forecast30: number;
  forecast90: number;
  /** היסטוגרמת-ציון: 10 סלים של 100. */
  scoreBins: number[];
  /** מונה פר-דרגה. */
  tierCounts: Record<string, number>;
}

export function portfolioIntel(
  supporters: readonly Supporter[],
  todayIso: string,
  rate = 3.7,
  topN = 10,
): PortfolioIntel {
  const scoreBins = new Array<number>(10).fill(0);
  const tierCounts: Record<string, number> = {};
  const ltvs: number[] = [];
  let giftCount = 0, ltv = 0, gaveEver = 0, retained = 0,
    atRiskCount = 0, atRiskMoney = 0, forecast30 = 0, forecast90 = 0;

  const in30 = _shiftIso(todayIso, 30), in90 = _shiftIso(todayIso, 90);

  for (const sp of supporters) {
    const scan = donorScan(sp, todayIso, rate, 12);
    if (scan.count === 0) continue;
    gaveEver++;
    giftCount += scan.count;
    ltv += scan.ils;
    ltvs.push(scan.ils);

    if (dayDiff(scan.last, todayIso) <= 365) retained++;

    const rfm = rfmFromScan(scan, todayIso);
    scoreBins[Math.min(9, Math.floor(rfm.score / 100))]++;
    const tier = supTier(rfm.score).label;
    tierCounts[tier] = (tierCounts[tier] || 0) + 1;

    const churn = churnFromScan(scan, todayIso);
    if (churn >= PORTFOLIO_RISK_THRESHOLD) { atRiskCount++; atRiskMoney += scan.ils; }

    const fc = forecastFromScan(scan, todayIso);
    if (fc) {
      if (fc.dueIso <= in30) forecast30 += fc.amount;
      if (fc.dueIso <= in90) forecast90 += fc.amount;
    }
  }

  ltvs.sort((a, b) => b - a);
  let top = 0;
  for (let i = 0; i < Math.min(topN, ltvs.length); i++) top += ltvs[i];

  return {
    count: supporters.length,
    giftCount,
    ltv: Math.round(ltv),
    avgGift: giftCount ? Math.round(ltv / giftCount) : 0,
    retention12m: gaveEver ? Math.round((retained / gaveEver) * 100) : 0,
    atRiskCount,
    atRiskMoney: Math.round(atRiskMoney),
    concentrationTopN: ltv > 0 ? Math.round((top / ltv) * 100) : 0,
    topN,
    forecast30: Math.round(forecast30),
    forecast90: Math.round(forecast90),
    scoreBins,
    tierCounts,
  };
}

export interface TierTrend {
  tier: string;
  total: number;
  rising: number;
  falling: number;
  stable: number;
}

/**
 * פרוקסי-מיגרציה: לכל דרגה, כמה תורמים במגמת-עלייה/ירידה/יציבות (מ-trend). זו
 * **מגמה**, לא מעבר-דרגה היסטורי (שלא נשמר) — מסומן ככזה בממשק.
 */
export function tierTrendCounts(
  supporters: readonly Supporter[],
  todayIso: string,
  rate = 3.7,
): TierTrend[] {
  const order = ['זהב', 'כסף', 'ארד', 'רדומה'];
  const map = new Map<string, TierTrend>(order.map((t) => [t, { tier: t, total: 0, rising: 0, falling: 0, stable: 0 }]));
  for (const sp of supporters) {
    const scan = donorScan(sp, todayIso, rate, 12);
    if (scan.count === 0) continue;
    const tier = supTier(rfmFromScan(scan, todayIso).score).label;
    const row = map.get(tier);
    if (!row) continue;
    row.total++;
    const d = trendFromScan(scan).dir;
    if (d === 'up') row.rising++;
    else if (d === 'down') row.falling++;
    else row.stable++;
  }
  return order.map((t) => map.get(t)!);
}

/** מונה תורמים-פעילים פר-חודש (נתנו באותו חודש) — עקומת-פעילות ל-N חודשים אחרונים. */
export function activeByMonth(
  supporters: readonly Supporter[],
  todayIso: string,
  months = 12,
  rate = 3.7,
): number[] {
  const out = new Array<number>(months).fill(0);
  for (const sp of supporters) {
    const scan = donorScan(sp, todayIso, rate, months);
    for (let i = 0; i < months; i++) if (scan.monthly[i] > 0) out[i]++;
  }
  return out;
}

/** הזזת תאריך-ISO ב-N ימים (עזר פנימי, ללא Date.now). */
function _shiftIso(iso: string, days: number): string {
  const ms = Date.parse(iso.slice(0, 10) + 'T12:00:00') + days * 86_400_000;
  return new Date(ms).toISOString().slice(0, 10);
}
