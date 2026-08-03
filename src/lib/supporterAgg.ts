/**
 * מצבורי-התומכת (count/ils/usd/first/last) — מקור-אמת יחיד וטהור.
 *
 * הכרעת בעלים #14 ("כל מה שיעלה בקובץ"): המצבור נגזר מ**כל** מה שבקובץ — גם
 * `donations` (קבלות R-/D-) וגם `hist` (הקובץ ההיסטורי הלגאסי). כך הכרטיס, לוח-
 * הבית, סף-הסיכון והדוחות מציגים את אותו הסכום. `ils` = ₪ (ברירת-מחדל למטבע ריק),
 * `usd` = $. `first/last` = קצות טווח-התאריכים של שני המקורות.
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
  const hist = Array.isArray(sp.hist) ? sp.hist : [];
  let ils = 0;
  let usd = 0;
  const dates: string[] = [];
  for (const d of dons) {
    const amt = Number.isFinite(d.amount) ? d.amount : 0;
    if (d.cur === '$') usd += amt;
    else ils += amt; // ריק/₪/מיובא = שקל (עקבי עם addDonation והבית)
    if (d.date) dates.push(d.date);
  }
  for (const h of hist) {
    const amt = Number.isFinite(h.a) ? h.a : 0;
    if (h.c === '$') usd += amt;
    else ils += amt;
    if (h.d) dates.push(h.d);
  }
  dates.sort();
  return { count: dons.length + hist.length, ils, usd, first: dates[0] ?? '', last: dates[dates.length - 1] ?? '' };
}
