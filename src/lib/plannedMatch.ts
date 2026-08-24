/**
 * 🔍 שיוך תשלומים-נכנסים לחיובים-מתוכננים (בקשת-בעלים 25.8) — מנוע-טהור.
 *
 * מטרה: כשמגיע `IncomingPayment` מהגייטוויי (webhook נדרים/סולה), למצוא את
 * החיוב-המתוכנן שהוא-הוא — לפי סכום, שם, ותאריך-קרוב. אם יש התאמה-חד-משמעית ⇒
 * הקורא (store) יריץ `chargeXxxPlanned` ⇒ D-/R-/S- אמיתי בלי-קליק.
 *
 * העקרון: לא מנחשים. שיוך רק כשמתקיים סף-ביטחון גבוה — סכום זהה, שם דומה,
 * תאריך בטווח ±3 ימים. שני מועמדים באותה איכות ⇒ אמביגואי, לא-שיוך אוטומטי
 * (הכפתור-הידני יטפל).
 */
import type { Db, PlannedCharge } from '../types/domain';
import type { IncomingPayment } from './cloud';

export type PlanEntityType = 'supporter' | 'enrollment' | 'shopAssignment';

/** קלט לשיוך — פלן פתוח בכל ישות, עם קונטקסט לזיהוי-שם. */
export interface OpenPlanRef {
  entityType: PlanEntityType;
  entityId: string;
  plan: PlannedCharge;
  /** שם הישות (תומכ/ת · מתפקד/ת בשיבוץ · משפחה בשיוך-חנות) — לבדיקת-דמיון. */
  name: string;
}

/** תוצאת-שיוך יחידה — פלן שנבחר עבור IncomingPayment ספציפי. */
export interface PlannedMatch extends OpenPlanRef {
  incomingId: string;
  confidence: number; // 0..100
}

const DATE_WINDOW_DAYS = 3;

/** מרחק-ימים דטרמיניסטי בין ISO-דייטים (חיובי; לא-תלוי-סדר). */
function dayDiff(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map((n) => parseInt(n, 10));
  const [by, bm, bd] = b.split('-').map((n) => parseInt(n, 10));
  const da = new Date(ay, (am || 1) - 1, ad || 1, 12);
  const db = new Date(by, (bm || 1) - 1, bd || 1, 12);
  return Math.abs(Math.round((da.getTime() - db.getTime()) / 86400000));
}

/** נורמליזציית-שם: הסרת תווי-פיסוק, ריווח-כפול, ניקוד. לא-מגזר תלוי-סדר. */
function normName(s: string): string {
  return String(s || '')
    .replace(/[֑-ׇ]/g, '') // ניקוד עברי
    .replace(/["'.,\-()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/** האם שני שמות "אותו-אדם" — קבוצת-מילים חופפת מספקת. */
export function nameMatches(a: string, b: string): boolean {
  const na = normName(a);
  const nb = normName(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  const wa = new Set(na.split(' ').filter((w) => w.length >= 2));
  const wb = new Set(nb.split(' ').filter((w) => w.length >= 2));
  if (wa.size === 0 || wb.size === 0) return false;
  // חפיפה של-לפחות-שני-מילים (שם-פרטי+משפחה) או כל-המילים אם יש רק שם-יחיד
  let overlap = 0;
  for (const w of wa) if (wb.has(w)) overlap++;
  // דורש 2-חופפות (שם-פרטי+משפחה); רק כשלשני-הצדדים שם-יחיד ⇒ די באחת (תואם-מלא)
  const need = wa.size === 1 && wb.size === 1 ? 1 : 2;
  return overlap >= need;
}

/** אוסף כל הפלנים הפתוחים בכל הישויות של ה-DB — עם שמות לצורך שיוך. */
export function findAllOpenPlans(db: Db): OpenPlanRef[] {
  const out: OpenPlanRef[] = [];
  for (const sup of db.supporters) {
    for (const pl of sup.plannedCharges || []) {
      if (pl.chargedRid || pl.cancelledAt) continue;
      out.push({ entityType: 'supporter', entityId: sup.id, plan: pl, name: sup.name });
    }
  }
  for (const en of db.enrollments) {
    if (!en.plannedCharges?.length) continue;
    // שם: חבר-במשפחה של השיבוץ (לצורך התאמה מול name בעסקה)
    const fam = db.families.find((f) => f.members.some((m) => m.id === en.memberId));
    const mem = fam?.members.find((m) => m.id === en.memberId);
    const nm = ((mem?.first || '') + ' ' + (fam?.name || '')).trim();
    for (const pl of en.plannedCharges) {
      if (pl.chargedRid || pl.cancelledAt) continue;
      out.push({ entityType: 'enrollment', entityId: en.id, plan: pl, name: nm });
    }
  }
  for (const a of db.shopAssignments) {
    if (!a.plannedCharges?.length) continue;
    const fam = db.families.find((f) => f.id === a.famId);
    const nm = fam?.name || '';
    for (const pl of a.plannedCharges) {
      if (pl.chargedRid || pl.cancelledAt) continue;
      out.push({ entityType: 'shopAssignment', entityId: a.id, plan: pl, name: nm });
    }
  }
  return out;
}

/**
 * מוצא את הפלן-הפתוח שהתאים לתשלום-נכנס. `null` = אין התאמה או אמביגואי.
 * קריטריון: סכום זהה (לפי-אגורות), שם-דומה (2 מילים לפחות), תאריך ±3 ימים.
 * אמביגואי (יותר-מ-1 מועמד) ⇒ null (הכפתור-הידני יבחר).
 */
export function matchIncomingToPlanned(inc: IncomingPayment, allOpen: OpenPlanRef[]): PlannedMatch | null {
  const targetCents = Math.round(inc.amount * 100);
  const incDate = (inc.at || '').slice(0, 10); // ISO
  const candidates: PlannedMatch[] = [];
  for (const ref of allOpen) {
    const planCents = Math.round(ref.plan.amount * 100);
    if (planCents !== targetCents) continue;
    if (!nameMatches(ref.name, inc.name || '')) continue;
    if (incDate && ref.plan.date && dayDiff(incDate, ref.plan.date) > DATE_WINDOW_DAYS) continue;
    // ציון-דירוג לניפוי-כפולות: תאריך-קרוב + שם-ארוך = יותר-בטוח
    const dd = incDate && ref.plan.date ? dayDiff(incDate, ref.plan.date) : 0;
    const conf = Math.max(60, 100 - dd * 10);
    candidates.push({ ...ref, incomingId: inc.id, confidence: conf });
  }
  if (candidates.length !== 1) return null;
  return candidates[0];
}

/**
 * שיוך-מרובה: מריץ matchIncomingToPlanned לכל תשלום-נכנס, ומחזיר רק את
 * אלה שהתאימו חד-משמעית. פלן שכבר-נבחר לתשלום-אחד מוצא מהמאגר לתשלום-הבא
 * (אחרת אותו פלן היה יכול להיתפס פעמיים בבאלק).
 */
export function matchAll(incomings: IncomingPayment[], allOpen: OpenPlanRef[]): PlannedMatch[] {
  const out: PlannedMatch[] = [];
  const used = new Set<string>(); // planId שכבר-שויך בסבב-הזה
  const pool = [...allOpen];
  for (const inc of incomings) {
    const stillOpen = pool.filter((r) => !used.has(r.plan.id));
    const m = matchIncomingToPlanned(inc, stillOpen);
    if (m) {
      out.push(m);
      used.add(m.plan.id);
    }
  }
  return out;
}
