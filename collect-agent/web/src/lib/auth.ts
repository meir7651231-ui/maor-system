// טוקן ל-API: סשן עובד (/auth/login, שער 6) או קוד הגישה המשותף (מצב פיתוח/דמו, team/qa.md S1).
// sessionStorage בלבד — לא localStorage ולא cookie: נמחק בסגירת הלשונית, לא משותף ללשוניות אחרות,
// ונשלח רק בכותרת Authorization (לא אוטומטית ⇒ אין CSRF). השרת שומר רק sha256, תוקף 12 ש׳, ויציאה מבטלת.
// טוקן סשן לעולם לא נכנס לכתובת. קישור הפיתוח מ-demo.sh (#/dashboard?token=…) נקלט ונמחק מהכתובת מיד.
export const TOKEN_KEY = 'gabi_owner_token';

export interface Storage { getItem(k: string): string | null; setItem(k: string, v: string): void }

/** קורא token= מה-hash, שומר, ומחזיר hash נקי (כדי שהטוקן לא יישאר בשורת הכתובת). */
export function takeTokenFromHash(hash: string, store: Storage): string {
  const m = /[?&]token=([A-Za-z0-9_\-.~]{32,})/.exec(hash);
  if (!m) return hash;
  store.setItem(TOKEN_KEY, m[1]);
  return hash.replace(/[?&]token=[^&]*/, '').replace(/\?$/, '');
}

export const readToken = (store: Storage | undefined): string => {
  try { return store?.getItem(TOKEN_KEY) ?? ''; } catch { return ''; }
};

/** דף החייב (/pay/{code}) — ציבורי; מחזיר את הקוד או null. */
export function payCodeOf(pathname: string): string | null {
  const m = /^\/pay\/([A-Za-z0-9]{4,32})\/?$/.exec(pathname);
  return m ? m[1] : null;
}

/** ולידציה לטופס כניסת עובד (מייל + סיסמה + קוד 6 ספרות מאפליקציית האימות). מחזיר הודעת שגיאה או null. */
export function loginProblem(email: string, password: string, code: string): string | null {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'כתבו כתובת מייל תקינה';
  if (password.length < 1) return 'הזינו סיסמה';
  if (!/^\d{6}$/.test(code.trim())) return 'קוד האימות הוא 6 ספרות';
  return null;
}

/** הודעת שגיאה לכניסה לפי תשובת השרת. השרת לא מגלה אם הסיסמה או הקוד שגויים (ולא אם המשתמש קיים)
 *  — בכוונה, נגד ניחוש — ולכן ההודעה מכסה את שניהם ומסבירה את הטעות הנפוצה בקוד. טהור (נבדק). */
export function loginErrorText(status: number, retryAfter?: string | null): string {
  if (status === 401) return 'המייל, הסיסמה או קוד האימות שגויים. הקוד מתחלף כל 30 שניות ואפשר להשתמש בכל קוד פעם אחת בלבד';
  if (status === 429) {
    const s = Number(retryAfter);
    const min = Number.isFinite(s) && s > 0 ? Math.max(1, Math.ceil(s / 60)) : 15;
    return `יותר מדי ניסיונות כניסה. מטעמי אבטחה הכניסה ננעלה זמנית. נסו שוב בעוד ${min === 1 ? 'דקה' : `${min} דקות`}`;
  }
  if (status === 403) return 'אין לחשבון הזה הרשאת גישה. פנו לבעל העסק כדי שיפעיל את המשתמש שלכם';
  if (status === 0) return 'אין חיבור לשרת גבי. בדקו את החיבור ונסו שוב';
  return 'הכניסה נכשלה בגלל תקלה בשרת. נסו שוב בעוד רגע';
}

/** הקוד מאפליקציית האימות: רק ספרות (מדביקים לפעמים «123 456»), עד 6. */
export const cleanCode = (v: string): string => v.replace(/\D/g, '').slice(0, 6);
