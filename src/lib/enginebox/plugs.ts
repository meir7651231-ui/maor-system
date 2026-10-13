/**
 * 🧰 ארגז-המנועים — תקן החיבור (BUILD-ORDER-ENGINEBOX-2026-10-13).
 *
 * "יש ארגז עם מנועים עם חיבור זכר ונקבה" — כל מנוע (חלק) נותן משהו (זכר) וצריך משהו (נקבה), כמו מחברי-אינסטלציה.
 * כדי ששני חלקים יתחברו הם חייבים לדבר באותו **סוג-מחבר**. הקובץ הזה הוא רשימת-הסוגים — **סגורה**: חלק לא ממציא
 * סוג משלו; סוג חדש נכנס רק כאן (ובדיקת "התקן סגור" נועלת זאת).
 *
 * טהור: נתונים בלבד — בלי React, store, DOM או שעון. בידוד: אין כאן כסף, קבלות, לוח-ראשי או חדרי-חוגים.
 */

/** גרסת-התקן — עולה כשסוג קיים משנה משמעות (לא כשנוסף סוג). */
export const PLUG_STANDARD_VERSION = 1;

/** סוג-מחבר: מזהה יציב · תווית עברית קצרה · שורת-הסבר אחת. */
export interface PlugTypeInfo {
  readonly id: string;
  readonly label: string;
  readonly desc: string;
}

/** רשימת סוגי-המחברים (הסדר = סדר-התצוגה). */
export const PLUG_TYPES = [
  { id: 'times.shabbat', label: 'זמני שבת', desc: 'הדלקת נרות, צאת השבת ור״ת של שבת מסוימת לפי מיקום הקהילה' },
  { id: 'times.prayers', label: 'מניינים', desc: 'תפילות בציבור לפי בית כנסת, כתובת, יום ושעה' },
  { id: 'times.blocked', label: 'שבת וחג סגורים', desc: 'האם עכשיו שבת או יום טוב — כדי לסגור מה שאסור להפעיל בהם' },
  { id: 'pro.match', label: 'בעל מקצוע מתאים', desc: 'בעלי מקצוע מהמדריך שמתאימים לצורך שנכתב במילים, פתוחים עכשיו קודם' },
  { id: 'emergency', label: 'מספרי חירום', desc: 'רשימת מספרי החירום של הקהילה (מד״א, משטרה, כיבוי ומקומיים)' },
  { id: 'availability', label: 'מקום פנוי', desc: 'אילו יחידות אירוח פנויות בלילה מסוים — בלי מחירים ובלי שמות אורחים' },
  { id: 'booking', label: 'הזמנה', desc: 'בקשת הזמנה של מקום שנרשמת לאישור' },
  { id: 'request.text', label: 'בקשה בעברית', desc: 'בקשה שנכתבה במילים רגילות ("נזילה במקלחת") להעברה לטיפול' },
  { id: 'message.text', label: 'הודעה מוכנה', desc: 'נוסח הודעה מוכן לשליחה לאדם (בוואטסאפ או במסרון)' },
  { id: 'voice.menu', label: 'שלוחה בקו', desc: 'תפריט שמושמע למתקשר בקו הטלפון ונבחר במקש' },
  { id: 'print.page', label: 'דף להדפסה', desc: 'עמוד מוכן להדפסה או לחוברת' },
  { id: 'date.hebrew', label: 'תאריך עברי', desc: 'תאריך עברי, חג ופרשה של יום מסוים' },
  { id: 'reminder', label: 'תזכורת', desc: 'תזכורת ביום ובשעה מסוימים' },
  { id: 'payment.link', label: 'קישור תשלום', desc: 'קישור לעמוד הסליקה של הארגון — קישור בלבד, בלי הנפקת מסמכים' },
  { id: 'person', label: 'אדם או משפחה', desc: 'פרטי אדם או משפחה שכבר רשומים במערכת (שם וטלפון)' },
  { id: 'day.summary', label: 'שורה בתקציר היום', desc: 'שורה קצרה בכרטיס "☀ תקציר היום" — מה חשוב היום בכלי הזה' },
] as const satisfies readonly PlugTypeInfo[];

/** מזהה סוג-מחבר — רק מהרשימה הסגורה. */
export type PlugType = (typeof PLUG_TYPES)[number]['id'];

const BY_ID = new Map<string, PlugTypeInfo>((PLUG_TYPES as readonly PlugTypeInfo[]).map((p) => [p.id, p]));

/** האם המחרוזת היא סוג-מחבר מהתקן. */
export function isPlugType(x: unknown): x is PlugType {
  return typeof x === 'string' && BY_ID.has(x);
}

/** פרטי סוג-מחבר — undefined למזהה זר. */
export function plugInfo(id: string): PlugTypeInfo | undefined {
  return BY_ID.get(id);
}

/** מיקום הסוג ברשימה (לסדר דטרמיניסטי); זר ⇒ סוף. */
export function plugOrder(id: string): number {
  const i = (PLUG_TYPES as readonly PlugTypeInfo[]).findIndex((p) => p.id === id);
  return i < 0 ? PLUG_TYPES.length : i;
}
