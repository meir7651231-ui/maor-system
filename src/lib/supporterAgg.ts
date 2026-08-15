/**
 * מצבורי-התומכת השמורים (count/ils/usd/first/last) — מקור-אמת יחיד וטהור.
 *
 * הכרעת בעלים #14 ("לכולל", 9.8): הצבירה **המוצגת** (מסך/כרטיס/מיון/ציון/CSV)
 * כוללת גם קבלות (`donations`) וגם הקובץ-ההיסטורי (`hist`) — אך התוספת של hist
 * נעשית **בשכבת-התצוגה** (supIls/supUsd/supCount/supLast ב-supporters/lib, שכולם
 * `sp.* + hist`). המונים ה**שמורים** נשארים **קבלות-בלבד** (אינווריאנט-הענן
 * "מונים רק עולים"). לכן פונקציה זו סוכמת **donations בלבד** — אחרת hist נספר
 * פעמיים (שמור=קבלות+hist ואז התצוגה מוסיפה hist שוב ⇒ ₪ כפול-היסטוריה).
 *
 * 🐛 באג שנתפס ע"י נחיל-9×9 (13.8): הגרסה הקודמת סכמה גם hist, וכל תורם עם
 * קובץ-היסטורי הוצג עם ₪ = קבלות + 2×hist (כרטיס/רשימה/RFM/CSV). הנעילה: כאן
 * donations-בלבד; התצוגה מוסיפה hist פעם אחת ויחידה.
 *
 * טהור — נקרא ב-migrate (ריפוי-עצמי), ב-addDonation (עקביות) וב-runAudit (השוואה).
 */
import type { Supporter } from '../types/domain';

export interface SupAgg {
  count: number;
  ils: number;
  usd: number;
  first: string;
  last: string;
}

export function supporterAggregates(sp: Pick<Supporter, 'donations' | 'hist'>): SupAgg {
  const dons = Array.isArray(sp.donations) ? sp.donations : [];
  let ils = 0;
  let usd = 0;
  const dates: string[] = [];
  for (const d of dons) {
    const amt = Number.isFinite(d.amount) ? d.amount : 0;
    if (d.cur === '$') usd += amt;
    else ils += amt; // ריק/₪/מיובא = שקל (עקבי עם addDonation והבית)
    if (d.date) dates.push(d.date);
  }
  dates.sort();
  // count/ils/usd = קבלות בלבד; hist מתווסף בתצוגה (supporters/lib) פעם אחת.
  return { count: dons.length, ils, usd, first: dates[0] ?? '', last: dates[dates.length - 1] ?? '' };
}
