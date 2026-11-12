// הפעלה 143: הודעת כשל אחת לכל פעולה מול השרת. עד עכשיו כשל רשת הציג «Failed to fetch» באנגלית,
// ו-5xx בלי גוף JSON הציג את קוד ה-HTTP הגולמי («לא בוצע: 502»). טהור (נבדק ב-tests/lib.check.ts).
const HEBREW = /[֐-׿]/;

export const NO_CONNECTION = 'אין חיבור לשרת גבי. בדקו את החיבור ונסו שוב';
export const SERVER_DOWN = 'השרת לא זמין כרגע. נסו שוב בעוד רגע';

/** status 0 = הבקשה לא הגיעה לשרת (רשת). detail = השדה detail מתשובת השרת, אם היה.
 *  הסבר בעברית מהשרת נשמר כמו שהוא (גם ב-5xx: «אין מפתח הצפנה…»); קוד או טקסט טכני לא מוצגים למשתמש ב-5xx. */
export function failureText(status: number, detail?: string | null): string {
  const d = (detail ?? '').trim();
  if (status === 0) return NO_CONNECTION;
  if (status >= 500) return HEBREW.test(d) ? d : SERVER_DOWN;
  if (status === 429 && !HEBREW.test(d)) return 'יותר מדי בקשות בזמן קצר. המתינו רגע ונסו שוב';
  return d || `הבקשה נכשלה (שגיאה ${status})`;
}
