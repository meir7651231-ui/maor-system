// הפעלה 143: הודעת כשל אחת לכל פעולה מול השרת. עד עכשיו כשל רשת הציג «Failed to fetch» באנגלית,
// ו-5xx בלי גוף JSON הציג את קוד ה-HTTP הגולמי («לא בוצע: 502»). טהור (נבדק ב-tests/lib.check.ts).
const HEBREW = /[֐-׿]/;

export const NO_CONNECTION = 'אין חיבור לשרת גבי. בדקו את החיבור ונסו שוב';
export const SERVER_DOWN = 'השרת לא זמין כרגע. נסו שוב בעוד רגע';

// הפעלה 144: פעולת כתיבה שנקטעה (רשת / 5xx בלי הסבר) ⇒ לא ידוע אם השרת רשם אותה. לא מזמינים «נסו שוב» עיוור:
// הממשק מרענן לבד כשהחיבור חוזר (store.tsx), והמשתמש רואה את המצב האמיתי לפני ניסיון חוזר.
const NO_CONNECTION_SHORT = 'אין חיבור לשרת גבי';
const SERVER_DOWN_SHORT = 'השרת לא זמין כרגע';
export const WRITE_UNKNOWN = 'לא ידוע אם הפעולה נרשמה. בדקו אחרי שהנתונים יתרעננו, לפני שמנסים שוב';

/** «לא בוצע: <סיבה>». כשהתוצאה לא ידועה לא כותבים «לא בוצע» (אולי כן בוצע) ⇒ ההודעה בלי הקידומת. */
export function failPrefix(prefix: string, msg: string): string {
  return msg.includes(WRITE_UNKNOWN) ? msg : `${prefix}: ${msg}`;
}

/** האם תוצאת פעולת כתיבה לא ידועה (הבקשה אולי הגיעה לשרת ונרשמה). הסבר בעברית מהשרת = סירוב מפורש, לא «לא ידוע». */
export function writeOutcomeUnknown(status: number, detail?: string | null): boolean {
  return status === 0 || (status >= 500 && !HEBREW.test((detail ?? '').trim()));
}

/** הפעלה 144: המתנה לפני ניסיון רענון אוטומטי מספר n (0 = הראשון) כשהנתונים לא עדכניים. גדל עד 15 שניות. */
const RETRY_MS = [2000, 4000, 8000, 15000];
export function retryDelayMs(n: number): number {
  return RETRY_MS[Math.max(0, Math.min(Math.floor(n) || 0, RETRY_MS.length - 1))];
}

/** status 0 = הבקשה לא הגיעה לשרת (רשת). detail = השדה detail מתשובת השרת, אם היה.
 *  write = פעולת כתיבה (לא GET): כשל בלי הסבר מהשרת ⇒ מוסיפים «לא ידוע אם הפעולה נרשמה».
 *  הסבר בעברית מהשרת נשמר כמו שהוא (גם ב-5xx: «אין מפתח הצפנה…»); קוד או טקסט טכני לא מוצגים למשתמש ב-5xx. */
export function failureText(status: number, detail?: string | null, write = false): string {
  const d = (detail ?? '').trim();
  if (status === 0) return write ? `${NO_CONNECTION_SHORT}. ${WRITE_UNKNOWN}` : NO_CONNECTION;
  if (status >= 500) return HEBREW.test(d) ? d : write ? `${SERVER_DOWN_SHORT}. ${WRITE_UNKNOWN}` : SERVER_DOWN;
  if (status === 429 && !HEBREW.test(d)) return 'יותר מדי בקשות בזמן קצר. המתינו רגע ונסו שוב';
  return d || `הבקשה נכשלה (שגיאה ${status})`;
}

/** הפעלה 146: ניסיון חוזר של הכרעה שכבר נרשמה בשרת (409 + X-Gabi-Already). `want` = ההכרעה שביקשנו.
 *  true רק כשהשרת אישר שאותה הכרעה כבר נרשמה; 409 אחר (חסימה, תזכורת שנדחתה) נשאר סירוב. טהור. */
export const ALREADY_APPROVED = '✓ התזכורת הזו כבר אושרה קודם';
export function alreadyDone(e: unknown, want: 'approved' | 'rejected'): boolean {
  const x = e as { status?: unknown; already?: unknown } | null;
  return !!x && x.status === 409 && x.already === want;
}
