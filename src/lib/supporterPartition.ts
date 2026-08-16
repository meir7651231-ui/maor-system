/**
 * אכיפת-הרשאה בשכבת-הנתונים · פאזה-1 — שכבת-פירוק תומכים (טהורה, בלי store/DOM/רשת).
 *
 * המטרה (בקשת-בעלים 15.8 "אכיפה מלאה · פירוק"): לאכוף את הייעוד-פר-תורם (`forWho`)
 * **בשרת** — כך שעובדת מוגבלת לא תוכל אפילו לקרוא את שמות-התומכים מחוץ לייעוד שלה
 * (לא רק ברמת-הממשק). מנוע-הפיצול הקיים (מסלול-B, `donationPartition.ts`) עשה זאת
 * לתרומות דרך `pkey`; כאן אותו דפוס בדיוק לתומכים דרך `skey` — מפתח plaintext על
 * מסמך-הענן (מחוץ למעטפת-ההצפנה) ש-Rules ושאילתת-`where` יכולות לבחון.
 *
 * ⚠️ המודל-המקומי לא משתנה — התומך נשמר כמו-שהוא; ה-`skey` חי רק בשכבת-הסנכרון
 * (מוזרק בדחיפה, מקולף במשיכה). האינווריאנט: כשהאכיפה כבויה — ביט-זהה להיום.
 *
 * פאזה-1 = טהור בלבד (לא מחווט לענן). החיווט (pushDiff/pullAll/subscribeAll) + Rules
 * + מיגרציה = פאזות 2–4.
 */
import type { Supporter } from '../types/domain';

/**
 * תומך ללא-ייעוד = **משותף** (כל עובד מורשה רואה). מקטע-ערך תקין ולא-ריק, מוקף
 * קווים-תחתונים כדי שלא יתנגש בייעוד-אמת. זהה בכוונה ל-SHARED_PURPOSE_KEY של
 * התרומות — אותו מרחב-שמות-ייעודים (המנהל מקצה ייעוד אחד שחל על שניהם).
 */
export const SHARED_SUP_KEY = '_shared_';

/** מפתח-הפירוק של תומך — הייעוד-פר-תורם (`forWho`) המחוטא; ריק/רווחים ⇒ משותף. */
export function supKeyOf(sp: Pick<Supporter, 'forWho'>): string {
  const f = (sp.forWho ?? '').trim();
  return f || SHARED_SUP_KEY;
}

/**
 * ערכי שאילתת-ה-`where('skey','in',…)` לעובד/ת מוגבל/ת: הייעודים המותרים (מנוקים)
 * + המפתח-המשותף. Firestore מגביל `in` ל-30 ערכים ⇒ 29 ייעודים + המשותף. ריקים
 * מסוננים (לא ערך-מפתח חוקי). דטרמיניסטי (סדר-הקלט נשמר) — נוח לבדיקה.
 */
export function supAllowedKeys(allowed: string[]): string[] {
  const clean = [...new Set(allowed.map((s) => s.trim()).filter(Boolean))].slice(0, 29);
  return [...clean, SHARED_SUP_KEY];
}

/**
 * הסרת שדה-המפתח `skey` מגוף-מסמך-הענן שנמשך — הוא plaintext מחוץ למעטפה ואינו
 * שדה של התומך המקומי. מחזיר עותק בלי `skey` (שאר השדות ביט-זהים).
 */
export function stripSupKey<T extends Record<string, unknown>>(data: T): Omit<T, 'skey'> {
  if (!('skey' in data)) return data;
  const { skey: _s, ...rest } = data as T & { skey?: unknown };
  void _s;
  return rest as Omit<T, 'skey'>;
}
