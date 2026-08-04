/**
 * עוזר-AI (INTEGRATIONS גל ג׳, הרחבת `ai`) — "עד-המפתח": הארגון מזין מפתח-API
 * של Anthropic בהגדרות (מנהל-בלבד), והעוזר חי. פיצ'ר-הפתיחה: טיוטת מכתב-תודה
 * אישי לתורם/ת מנתוני-התרומות — נפתחת לעריכה, המזכירה מעתיקה לוואטסאפ/מייל.
 *
 * גבולות-ביטחון (נלעסו): המפתח **מקומי-למכשיר בלבד** (nsLsKey — לא בקונפיג,
 * לא בענן, לא בגיבוי, בדיוק כמו נעילת-ה-PIN); הקריאה ישירה מהדפדפן ל-API
 * (CORS רשמי של Anthropic, בלי שרת-ביניים); מודל Haiku (הזול); בלי מפתח ⇒
 * הכפתור לא מוצג — דורמנטי מוחלט.
 */
import { nsLsKey } from '../store/persist';

const KEY_BASE = 'maor_ai_key';

export function readAiKey(): string {
  try {
    return localStorage.getItem(nsLsKey(KEY_BASE)) ?? '';
  } catch {
    return '';
  }
}

export function writeAiKey(key: string): void {
  try {
    const t = key.trim();
    if (t) localStorage.setItem(nsLsKey(KEY_BASE), t);
    else localStorage.removeItem(nsLsKey(KEY_BASE));
  } catch {
    /* localStorage חסום */
  }
}

/** קלט-טיוטה — נתונים שכבר מוצגים בכרטיס-התורם (אפס נתונים חדשים נחשפים). */
export interface ThanksInput {
  orgName: string;
  supporterName: string;
  /** סכום-התרומה האחרונה + מטבע (מעוצב), למשל '₪500'. */
  lastAmount: string;
  /** ייעוד/הקדשה אם קיימת ('אמץ חתן' וכו'). */
  designation?: string;
  /** סה"כ תרומות מצטבר מעוצב (אופציונלי). */
  totalSoFar?: string;
}

/** בונה-הפרומפט — טהור ונבדק; המודל מקבל הנחיות-סגנון קשיחות בעברית. */
export function thanksPrompt(inp: ThanksInput): string {
  return [
    'כתוב מכתב תודה קצר (4-6 שורות), חם ואישי, בעברית, מארגון "' + (inp.orgName || 'הארגון') + '"',
    'לתורם/ת בשם "' + inp.supporterName + '" על תרומה של ' + inp.lastAmount + '.',
    inp.designation ? 'התרומה יועדה ל: ' + inp.designation + '.' : '',
    inp.totalSoFar ? 'סה"כ תרומותיו/ה עד כה: ' + inp.totalSoFar + ' — אפשר לרמוז לנאמנות בעדינות.' : '',
    'בלי הגזמות, בלי סופרלטיבים ריקים, בלי לציין סכומים מעבר לנאמר. לסיים בברכה חמה.',
    'להחזיר את המכתב בלבד — בלי הקדמות.',
  ].filter(Boolean).join('\n');
}

/** חתימת-שכבת-הרשת — ניתנת-להזרקה בטסטים (בלי רשת אמיתית). */
export type AiFetch = (url: string, init: RequestInit) => Promise<Response>;

/** קריאה ל-Claude מהדפדפן — מחזיר את הטקסט או זורק שגיאה קריאה בעברית. */
export async function askClaude(apiKey: string, prompt: string, doFetch: AiFetch = fetch): Promise<string> {
  const res = await doFetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      // הכותרת הרשמית של Anthropic לקריאות-דפדפן ישירות (מפתח-הארגון, בבחירתו)
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error('מפתח ה-API לא תקין — בדקו בהגדרות');
    if (res.status === 429) throw new Error('חריגה ממכסת-השימוש — נסו בעוד רגע');
    throw new Error('הקריאה לעוזר נכשלה (' + res.status + ')');
  }
  const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
  const text = (data.content ?? []).filter((b) => b.type === 'text').map((b) => b.text ?? '').join('');
  if (!text.trim()) throw new Error('לא התקבלה תשובה — נסו שוב');
  return text.trim();
}
