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
 * האוספים הנאכפים פר-skey: `supporters` (הייעוד עליו) + `events` (אירוע-מעקב
 * מקושר-תומך נושא את מפתח-התומך, כדי ששם-התורם בלוח לא ידלוף לעובדת אחרת).
 */
export const SUP_KEYED_COLS = ['supporters', 'events'] as const;

/**
 * מפתח-ה-skey של מסמך באוסף נאכף (טהור). `supporters` ⇒ forWho שלו. `events` ⇒
 * מפתח-התומך-המקושר (spId→forWho דרך המפה); אירוע ללא-תומך (כללי/משפחה) = משותף.
 * אוסף לא-נאכף ⇒ '' (הקורא לא יזריק skey). המפה = spId→skey (נבנית מהתומכים).
 */
export function docSkey(col: string, data: Record<string, unknown>, supKeyBySpId: Map<string, string>): string {
  if (col === 'supporters') return supKeyOf(data as Pick<Supporter, 'forWho'>);
  if (col === 'events') {
    const spId = typeof data.spId === 'string' ? data.spId : '';
    return spId ? (supKeyBySpId.get(spId) ?? SHARED_SUP_KEY) : SHARED_SUP_KEY;
  }
  return '';
}

/** מפת spId→skey מרשימת-התומכים — לגזירת מפתח-אירוע בדחיפה/מיגרציה. */
export function supKeyMapOf(supporters: Pick<Supporter, 'id' | 'forWho'>[]): Map<string, string> {
  return new Map(supporters.map((sp) => [sp.id, supKeyOf(sp)]));
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

/**
 * קילוף לוג-הפעולות (`audit`) ממסמך-ה-meta (משטח #3): הלוג נושא שמות-תורמים ורוכב
 * על ה-meta המשותף שכל חבר מושך. כשהאכיפה דלוקה מקלפים אותו לפני הכתיבה לענן —
 * הלוג נשאר מקומי פר-מכשיר, ועובדת לא תלמד על תורם של אחרת דרכו. כבוי ⇒ לא נקרא.
 */
export function stripAuditMeta<T extends Record<string, unknown>>(meta: T): Omit<T, 'audit'> {
  if (!('audit' in meta)) return meta;
  const { audit: _a, ...rest } = meta as T & { audit?: unknown };
  void _a;
  return rest as Omit<T, 'audit'>;
}
