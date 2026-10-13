/**
 * 🧩 ארגז המנועים — התפר (seam) בין המסך לבין הליבה.
 *
 * המסך (`EngineBoxScreen`) נבנה מול הממשק הזה בלבד — לא מול `src/lib/enginebox/`.
 * סשן-החיבור (B) יממש `EngineBoxSource` מעל הליבה האמיתית ויעביר אותו למסך.
 * עד אז הכניסה מעבירה `null` ⇒ המסך מציג מצב-ריק כן ("הארגז בהרכבה").
 *
 * שפת-הבעלים: כל מנוע (BoxPart) "נותן" דברים (זכר) ו"מקבל" דברים (נקבה).
 * מתחילים ממוצר (BoxProduct = כמה מנועים מחוברים) או ממנוע אחד, בוחרים מנוע
 * נוסף, ורואים כל מקום שאפשר לחבר בו — עם התוצאה של כל חיבור.
 *
 * מזהה-התחלה (`start`): מזהה של מוצר **או** של מנוע בודד (מתחילים "ממנוע אחד").
 */
import type { GoalResult } from '../../lib/enginebox/goal/routeAdapter';

export interface BoxPart {
  id: string;
  name: string;
  emoji: string;
  /** מאיזה כלי המנוע הגיע (צ׳יפ קטן בכרטיס) */
  from: string;
  /** שורה אחת — מה המנוע עושה */
  what: string;
}

export interface BoxProduct {
  id: string;
  name: string;
  emoji: string;
  parts: BoxPart[];
}

/** מקום-חיבור אחד בין מנוע-ההתחלה למנוע שנבחר. */
export interface BoxOption {
  key: string;
  /** מי נותן (זכר) */
  giver: BoxPart;
  /** מי מקבל (נקבה) */
  needer: BoxPart;
  /** מה עובר בתקע (צ׳יפ) */
  plugLabel: string;
  /** התוצאה — הטקסט הגדול והברור בשורה */
  result: string;
  /** 'into' = המנוע החדש נכנס לתוך ההתחלה; 'from' = ההתחלה נותנת למנוע החדש */
  side: 'into' | 'from';
  linked: boolean;
  /** 📊 "מה היה קורה בחודש האחרון" עם נתוני-הארגון (FINAL 13.10); חסר/null ⇒ לא מציגים כלום. */
  impact?: BoxImpact | null;
}

/** תוצאת "נסה לפני שמחברים" לאפשרות אחת — משפט + עד 3 דוגמאות (יחידה ותאריך, לעולם לא שם אורח). */
export interface BoxImpact {
  headline: string;
  count: number;
  examples: readonly string[];
}

/** חיבור עתידי — עוד לא זמין, מוצג מושתק ולעולם לא לחיץ. */
export interface BoxFuture {
  giver: BoxPart;
  needer: BoxPart;
  plugLabel: string;
  result: string;
}

export interface EngineBoxSource {
  products(): BoxProduct[];
  /** כל הארגז (הקטלוג) */
  parts(): BoxPart[];
  options(start: string, picked: string): BoxOption[];
  future(start: string, picked: string): BoxFuture[];
  linkedCount(start: string): number;
  connect(key: string): void;
  disconnect(key: string): void;
  /** false = תצוגת-קריאה בלבד (בלי כפתורי חבר/נתק) */
  canEdit: boolean;
  /**
   * 🎯 "להתחיל מהסוף" (FINAL 13.10) — אופציונלי: מקור בלי `goal` ⇒ אין לשונית (המסך ביט-זהה לשלב ב׳).
   * null = עוד לא נכתב / המתאם עוד נטען.
   */
  goal?(text: string, start: string | null): GoalResult | null;
  /** מחבר את כל מפתחות-הדרך לפי הסדר (רק כש-canEdit). */
  applyRoute?(keys: readonly string[]): void;
  /** בקשה כנה למחולל: שורת-לוג בלבד (רק כש-canEdit). */
  requestEngine?(plug: string, text: string): void;
}
