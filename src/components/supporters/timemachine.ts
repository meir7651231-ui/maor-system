/**
 * מכונת-הזמן — סימולציית-תיק **קדימה** ("אם לא תעשה כלום"): לכל אופק (‏+30/+60/+90…)
 * מחשבת כמה תורמים יגלשו-לסכנה, כמה כסף ידעך, וכמה צפוי-להיכנס. טהור ודטרמיניסטי.
 *
 * התובנה שמאפשרת את זה בזול: סיכון-הנטישה (`churnFromScan`) תלוי רק ב**ימים-מאז
 * המתנה-האחרונה** מול קצב-הנתינה האישי. הזזת-היום קדימה ב-N ימים = הגדלת
 * daysSince ב-N — בלי לסרוק מחדש. סורקים כל תורם **פעם-אחת** ואז מקרינים על כל
 * האופקים ⇒ O(תורמים × אופקים) = O(תורמים) למסך שלם (עשרות-אלפי תרומות).
 *
 * מה שאין = לא ממציאים: אין "מה יקרה אם תתקשר" (דורש מודל-התערבות שלא קיים) —
 * רק הקרנת-הרצף הנוכחי. אין hok? אין accrual. הכל נגזר מהמצב הקיים.
 */
import type { Supporter } from '../../types/domain';
import { PORTFOLIO_RISK_THRESHOLD } from './portfolio';
import { dayDiff, donorScan, forecastFromScan, shiftIso, type DonorScan } from './intel';

/** אופקי-הסימולציה המוגדרים-מראש (ימים קדימה). */
export const DEFAULT_HORIZONS = [0, 30, 60, 90, 180, 365] as const;

/**
 * סיכון-נטישה של scan **בעוד offsetDays ימים** — אותה נוסחה כמו churnFromScan, אבל
 * daysSince מוזז קדימה. offset=0 ⇒ זהה-לחלוטין ל-churnFromScan של היום.
 */
export function churnAtOffset(scan: DonorScan, todayIso: string, offsetDays: number): number {
  if (scan.count === 0 || !scan.last) return 0;
  const daysSince = dayDiff(scan.last, todayIso) + Math.max(0, offsetDays);
  const span = scan.first && scan.first !== scan.last ? dayDiff(scan.first, scan.last) : 0;
  const cadence = scan.count >= 2 && span > 0 ? span / (scan.count - 1) : 365;
  const expected = Math.max(30, cadence * 1.5);
  return Math.max(0, Math.min(100, Math.round((daysSince / expected) * 50)));
}

/** צבירת-הו״ק צפויה בתוך חלון של offsetDays ימים (חודשים שלמים × סכום-ההוראה). */
function hokAccrual(sp: Supporter, offsetDays: number, rate: number): number {
  const hok = sp.hok;
  if (!hok || !hok.active || !hok.amount) return 0;
  const months = Math.floor(offsetDays / 30);
  if (months <= 0) return 0;
  const v = hok.cur === '$' ? hok.amount * rate : hok.amount;
  return v * months;
}

export interface HorizonState {
  /** ימים קדימה מהיום. */
  offsetDays: number;
  /** תאריך-ISO של האופק. */
  dateIso: string;
  /** תורמים שיהיו בסכנה (churn ≥ סף) באותו אופק. */
  atRiskCount: number;
  /** שווי-התיק של אותם תורמים-בסכנה (ש"ח-שקול). */
  atRiskMoney: number;
  /** תורמים שיחצו לסכנה **בין היום לאופק הזה** (לא היו בסכנה היום). */
  newlyAtRisk: number;
  /** ש"ח-שקול שצפוי-להיכנס עד האופק (תחזיות-מתנה + צבירת-הו״ק). */
  expectedIncoming: number;
  /** תורמים שעדיין "פעילים" (נתנו ב-365 יום עד האופק). */
  activeCount: number;
}

export interface TimeMachine {
  todayIso: string;
  horizons: HorizonState[];
  /** כסף שיגלוש-לסכנה מהיום ועד האופק-האחרון ("עלות-אי-הפעולה"). */
  erosionMoney: number;
  /** תורמים שיגלשו-לסכנה מהיום ועד האופק-האחרון. */
  erosionDonors: number;
  /** סה"כ צפוי-להיכנס עד האופק-האחרון (אם הרצף נמשך). */
  incomingEnd: number;
}

/* הזזת-תאריך: shiftIso המשותף מ-intel.ts (חשבון-לוח מקומי, בלי toISOString/UTC). */

/**
 * סימולציה קדימה על כל התיק. סורק כל תורם פעם-אחת ומקרין על כל האופקים.
 * @param horizons ימים-קדימה (ברירת-מחדל DEFAULT_HORIZONS). ממויין עולה בפלט.
 */
export function timeMachine(
  supporters: readonly Supporter[],
  todayIso: string,
  rate = 3.7,
  horizons: readonly number[] = DEFAULT_HORIZONS,
): TimeMachine {
  const offs = Array.from(new Set(horizons.map((h) => Math.max(0, Math.round(h))))).sort((a, b) => a - b);
  const H = offs.map((offsetDays): HorizonState => ({
    offsetDays,
    dateIso: shiftIso(todayIso, offsetDays),
    atRiskCount: 0,
    atRiskMoney: 0,
    newlyAtRisk: 0,
    expectedIncoming: 0,
    activeCount: 0,
  }));

  for (const sp of supporters) {
    const scan = donorScan(sp, todayIso, rate, 12);
    if (scan.count === 0) continue;
    const riskToday = churnAtOffset(scan, todayIso, 0) >= PORTFOLIO_RISK_THRESHOLD;
    const fc = forecastFromScan(scan, todayIso);

    for (let i = 0; i < H.length; i++) {
      const h = H[i];
      const risk = churnAtOffset(scan, todayIso, h.offsetDays) >= PORTFOLIO_RISK_THRESHOLD;
      if (risk) { h.atRiskCount++; h.atRiskMoney += scan.ils; if (!riskToday) h.newlyAtRisk++; }
      // פעיל = המתנה-האחרונה בתוך 365 יום נכון-לאופק.
      if (dayDiff(scan.last, todayIso) + h.offsetDays <= 365) h.activeCount++;
      // צפוי-להיכנס: תחזית-מתנה שמועדה עד האופק + צבירת-הו״ק בחלון.
      let inc = hokAccrual(sp, h.offsetDays, rate);
      if (fc && fc.dueIso <= h.dateIso) inc += fc.amount;
      h.expectedIncoming += inc;
    }
  }

  for (const h of H) {
    h.atRiskMoney = Math.round(h.atRiskMoney);
    h.expectedIncoming = Math.round(h.expectedIncoming);
  }

  const first = H[0], last = H[H.length - 1];
  return {
    todayIso,
    horizons: H,
    erosionMoney: Math.max(0, last.atRiskMoney - first.atRiskMoney),
    erosionDonors: Math.max(0, last.atRiskCount - first.atRiskCount),
    incomingEnd: last.expectedIncoming,
  };
}
