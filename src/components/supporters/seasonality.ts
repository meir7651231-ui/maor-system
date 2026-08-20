/**
 * מנוע-העונתיות — **מתי** נכנס הכסף. אגרגציה פר-חודש-לועזי (1–12) חוצת-שנים על כל
 * אירועי-הנתינה: חושף מקצב-עונתי (חגי-תשרי · פורים · סוף-שנת-מס) שקריטי לתזמון-קמפיין.
 *
 * טהור ודטרמיניסטי — בלי Date.now, בלי פרסור-תאריך (רק חיתוך YYYY-MM-DD). מעבר-יחיד
 * על כל התיק ⇒ O(סה"כ-האירועים), מתאים לעשרות-אלפי תרומות. המרת-מטבע דרך rate.
 */
import type { Supporter } from '../../types/domain';

export interface MonthSeason {
  /** חודש-לועזי 1–12. */
  month: number;
  /** סה"כ ש"ח-שקול שנכנס בחודש-הזה (חוצה-שנים). */
  ils: number;
  /** מספר אירועי-נתינה בחודש-הזה. */
  gifts: number;
  /** מספר תורמים-שונים שנתנו אי-פעם בחודש-הזה. */
  donors: number;
}

export interface Seasonality {
  /** 12 רשומות, ממויין חודש 1→12. */
  byMonth: MonthSeason[];
  /** החודש עם הכי-הרבה ש"ח (1–12); 0 כשאין נתונים. */
  peakMonth: number;
  /** החודש עם הכי-מעט ש"ח מבין חודשים-פעילים (1–12); 0 כשאין. */
  troughMonth: number;
  /** סה"כ ש"ח-שקול בכל התיק. */
  totalIls: number;
  /** אחוז הכסף-השנתי שמגיע בחודש-השיא (ריכוזיות-עונתית). */
  peakShare: number;
}

const M = (iso: string): number => {
  // YYYY-MM-DD → חודש. זול, בלי Date.
  const m = +iso.slice(5, 7);
  return m >= 1 && m <= 12 ? m : 0;
};

/** אגרגציית-עונתיות על כל התיק — מעבר-יחיד. */
export function seasonality(supporters: readonly Supporter[], rate = 3.7): Seasonality {
  const ils = new Array<number>(13).fill(0); // אינדקס 1–12
  const gifts = new Array<number>(13).fill(0);
  const donorHits = new Array<number>(13).fill(0);

  for (const sp of supporters) {
    const seen = new Array<boolean>(13).fill(false);
    const take = (date: string, amount: number, cur?: string) => {
      const m = M(date);
      if (!m) return;
      ils[m] += (cur || '₪') === '$' ? amount * rate : amount;
      gifts[m]++;
      seen[m] = true;
    };
    const dons = sp.donations;
    for (let i = 0; i < dons.length; i++) take(dons[i].date, dons[i].amount, dons[i].cur);
    const hist = sp.hist;
    if (hist) for (let i = 0; i < hist.length; i++) take(hist[i].d, hist[i].a, hist[i].c);
    for (let m = 1; m <= 12; m++) if (seen[m]) donorHits[m]++;
  }

  const byMonth: MonthSeason[] = [];
  let totalIls = 0, peakMonth = 0, peakIls = -1, troughMonth = 0, troughIls = Infinity;
  for (let m = 1; m <= 12; m++) {
    const v = Math.round(ils[m]);
    byMonth.push({ month: m, ils: v, gifts: gifts[m], donors: donorHits[m] });
    totalIls += v;
    if (v > peakIls) { peakIls = v; peakMonth = m; }
    if (gifts[m] > 0 && v < troughIls) { troughIls = v; troughMonth = m; }
  }
  if (peakIls <= 0) peakMonth = 0;

  return {
    byMonth,
    peakMonth,
    troughMonth,
    totalIls,
    peakShare: totalIls > 0 && peakMonth ? Math.round((peakIls / totalIls) * 100) : 0,
  };
}

export interface DonorRhythm {
  /** החודש-הדומיננטי של התורם (1–12); 0 כשאין נתינה. */
  topMonth: number;
  /** אחוז נתינתו שמגיע בחודש-הדומיננטי (ריכוזיות אישית). */
  concentration: number;
  /** האם התורם "עונתי" (ריכוזיות ≥ 60% ולפחות 2 מתנות). */
  seasonal: boolean;
}

/** קצב-הנתינה של תורם-יחיד — החודש-הדומיננטי והאם הוא עונתי. */
export function donorRhythm(sp: Supporter, rate = 3.7): DonorRhythm {
  const ils = new Array<number>(13).fill(0);
  let total = 0, count = 0;
  const take = (date: string, amount: number, cur?: string) => {
    const m = M(date);
    if (!m) return;
    const v = (cur || '₪') === '$' ? amount * rate : amount;
    ils[m] += v; total += v; count++;
  };
  const dons = sp.donations;
  for (let i = 0; i < dons.length; i++) take(dons[i].date, dons[i].amount, dons[i].cur);
  const hist = sp.hist;
  if (hist) for (let i = 0; i < hist.length; i++) take(hist[i].d, hist[i].a, hist[i].c);

  let topMonth = 0, topIls = -1;
  for (let m = 1; m <= 12; m++) if (ils[m] > topIls) { topIls = ils[m]; topMonth = m; }
  if (topIls <= 0) return { topMonth: 0, concentration: 0, seasonal: false };
  const concentration = total > 0 ? Math.round((topIls / total) * 100) : 0;
  return { topMonth, concentration, seasonal: concentration >= 60 && count >= 2 };
}
