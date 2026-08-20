/**
 * מנוע-קוהורטת-הגיוס — שימור לפי **שנת-הגיוס** (המתנה-הראשונה). התובנה הקלאסית של
 * fundraising: מאיזה "מחזור" התורמים עדיין נותנים? חושף אם הגיוס-האחרון "דולף".
 *
 * טהור ודטרמיניסטי — שנת-הגיוס = שנת scan.first; "פעיל-היום" = נתן ב-365 יום עד
 * היום-המוזרק. מעבר-יחיד לתורם O(אירועיו) ⇒ O(סה"כ) למסך.
 */
import type { Supporter } from '../../types/domain';
import { dayDiff, donorScan } from './intel';

export interface CohortYear {
  /** שנת-הגיוס (לועזית). */
  year: number;
  /** תורמים שגויסו באותה שנה (מתנה-ראשונה). */
  size: number;
  /** מתוכם עדיין-פעילים היום (נתנו ב-365 יום). */
  activeNow: number;
  /** אחוז-שימור (activeNow / size). */
  retentionPct: number;
  /** סה"כ ש"ח-שקול שגויס-אי-פעם מהמחזור-הזה. */
  ltv: number;
}

export interface RetentionReport {
  /** שורה-לשנה, ממויין שנה עולה. */
  cohorts: CohortYear[];
  /** שימור-משוקלל כל-התיק (סה"כ-פעילים / סה"כ-מגויסים). */
  overallRetention: number;
}

/**
 * קוהורטות-גיוס. מגביל לשנים עם גיוס-בפועל; שנת-גיוס נלקחת מהמתנה-הראשונה של התורם.
 */
export function acquisitionCohorts(
  supporters: readonly Supporter[],
  todayIso: string,
  rate = 3.7,
): RetentionReport {
  const map = new Map<number, CohortYear>();
  for (const sp of supporters) {
    const scan = donorScan(sp, todayIso, rate, 12);
    if (scan.count === 0 || !scan.first) continue;
    const year = +scan.first.slice(0, 4);
    if (!year) continue;
    let row = map.get(year);
    if (!row) { row = { year, size: 0, activeNow: 0, retentionPct: 0, ltv: 0 }; map.set(year, row); }
    row.size++;
    row.ltv += scan.ils;
    if (scan.last && dayDiff(scan.last, todayIso) <= 365) row.activeNow++;
  }

  const cohorts = [...map.values()].sort((a, b) => a.year - b.year);
  let totSize = 0, totActive = 0;
  for (const c of cohorts) {
    c.ltv = Math.round(c.ltv);
    c.retentionPct = c.size > 0 ? Math.round((c.activeNow / c.size) * 100) : 0;
    totSize += c.size;
    totActive += c.activeNow;
  }
  return { cohorts, overallRetention: totSize > 0 ? Math.round((totActive / totSize) * 100) : 0 };
}
