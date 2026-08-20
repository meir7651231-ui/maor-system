/**
 * מנוע-הריכוזיות (פארטו/לורנץ) — עד כמה התיק תלוי במעטים. חושף סיכון-ריכוזיות:
 * "כמה-מעט תורמים מחזיקים חצי/80% מהכסף" + מדד-ג׳יני (אי-שוויון 0–100).
 *
 * טהור ודטרמיניסטי — LTV פר-תורם מ-donorScan; מיון-יחיד O(n log n). ג׳יני בנוסחת
 * הסדרה-הממוינת (בלי O(n²)) ⇒ מתאים לעשרות-אלפי תרומות.
 */
import type { Supporter } from '../../types/domain';
import { donorScan } from './intel';

export interface ParetoPoint {
  /** אחוז-מצטבר של תורמים (מהגדול לקטן). */
  donorPct: number;
  /** אחוז-מצטבר של הכסף. */
  moneyPct: number;
}

export interface ParetoReport {
  /** עקומת-לורנץ (מהתורם-הגדול): נקודות donorPct→moneyPct, כולל (0,0) ו-(100,100). */
  curve: ParetoPoint[];
  /** אחוז-הכסף מ-20% התורמים הגדולים. */
  top20Share: number;
  /** אחוז-התורמים הקטן-ביותר שמצטבר ל-50% מהכסף. */
  halfDonorPct: number;
  /** אחוז-התורמים שמצטבר ל-80% מהכסף. */
  eightyDonorPct: number;
  /** מדד-ג׳יני 0–100 (0=שוויון מלא · 100=ריכוז מלא). */
  gini: number;
  /** תורמים-פעילים. */
  donors: number;
}

const EMPTY: ParetoReport = { curve: [{ donorPct: 0, moneyPct: 0 }, { donorPct: 100, moneyPct: 100 }], top20Share: 0, halfDonorPct: 0, eightyDonorPct: 0, gini: 0, donors: 0 };

export function paretoReport(
  supporters: readonly Supporter[],
  todayIso: string,
  rate = 3.7,
): ParetoReport {
  const vals: number[] = [];
  for (const sp of supporters) {
    const scan = donorScan(sp, todayIso, rate, 12);
    if (scan.count === 0) continue;
    if (scan.ils > 0) vals.push(scan.ils);
  }
  const n = vals.length;
  const total = vals.reduce((a, b) => a + b, 0);
  if (n === 0 || total <= 0) return { ...EMPTY, donors: n };

  // מהגדול לקטן — לעקומת-פארטו ולנקודות-הסף.
  const desc = [...vals].sort((a, b) => b - a);
  const curve: ParetoPoint[] = [{ donorPct: 0, moneyPct: 0 }];
  let cum = 0, top20Share = 0, halfDonorPct = 0, eightyDonorPct = 0;
  for (let i = 0; i < n; i++) {
    cum += desc[i];
    const donorPct = ((i + 1) / n) * 100;
    const moneyPct = (cum / total) * 100;
    curve.push({ donorPct: Math.round(donorPct * 10) / 10, moneyPct: Math.round(moneyPct * 10) / 10 });
    if (top20Share === 0 && donorPct >= 20) top20Share = Math.round(moneyPct);
    if (halfDonorPct === 0 && moneyPct >= 50) halfDonorPct = Math.round(donorPct);
    if (eightyDonorPct === 0 && moneyPct >= 80) eightyDonorPct = Math.round(donorPct);
  }
  // אם 20% נופל בדיוק על-תורם שלא חצה — ניקח את הערך שהצטבר עד שם (כבר טופל בלולאה).

  // ג׳יני מנוסחת-הסדרה-הממוינת-עולה: G = (2·Σ i·x_i)/(n·Σx) − (n+1)/n.
  const asc = [...vals].sort((a, b) => a - b);
  let weighted = 0;
  for (let i = 0; i < n; i++) weighted += (i + 1) * asc[i];
  const gini = n > 1 ? (2 * weighted) / (n * total) - (n + 1) / n : 0;

  return {
    curve,
    top20Share,
    halfDonorPct,
    eightyDonorPct: eightyDonorPct || 100,
    gini: Math.max(0, Math.min(100, Math.round(gini * 100))),
    donors: n,
  };
}
