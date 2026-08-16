/**
 * הגנת-מקור · שומר-מארח (16.8) — שכבת-הרתעה+זיהוי לעותק-מגורר.
 *
 * ⚠️ הבהרה: frontend רץ בדפדפן ⇒ **תמיד ניתן-לעריכה**; תוקף נחוש יכול להסיר את
 * הבדיקה. לכן זו **שכבת-הרתעה+זיהוי**, לא מנגנון-אכיפה (האכיפה האמיתית = App Check
 * + Rules בשרת). ערך: מרים את מדרגת-המאמץ, ומשאיר עקבה בקונסולה של עותק שדלף.
 *
 * `foreignHost(hostname, allowed)` — טהור (נבדק ביחידה). מחזיר true כשהמארח הנוכחי
 * אינו ברשימת-ההיתר ואינו סביבת-פיתוח מקומית. allowed ריק/חסר ⇒ אין בדיקה (false).
 */

/** מארחים מקומיים תמיד-מותרים (פיתוח/בדיקה) — לא נחשבים "זרים". */
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1']);

/** נורמליזציה: אותיות-קטנות, בלי www., בלי פורט. */
function normHost(h: string): string {
  return (h || '').toLowerCase().trim().replace(/:\d+$/, '').replace(/^www\./, '');
}

/**
 * האם המארח הנוכחי "זר" (עותק-מגורר)? allowed=רשימת-מארחים-רשמיים. אחד מהם
 * יכול להיות סיומת (למשל `github.io` יתאים ל-`org.github.io`). מקומי ⇒ לעולם לא-זר.
 */
export function foreignHost(hostname: string, allowed: readonly string[] | undefined): boolean {
  if (!allowed || allowed.length === 0) return false; // דורמנטי — אין רשימה ⇒ אין בדיקה
  const h = normHost(hostname);
  if (!h || LOCAL_HOSTS.has(h) || h.endsWith('.local')) return false;
  const list = allowed.map(normHost).filter(Boolean);
  return !list.some((a) => h === a || h.endsWith('.' + a));
}

/**
 * הרצת-השומר (תופעת-לוואי מינימלית): כשהמארח זר — אזהרת-זכויות בקונסולה. אין
 * חסימת-אפליקציה (הרתעה בלבד). מדולג ב-Playwright ובלי DOM. מחזיר האם זוהה-זר.
 */
export function runOriginGuard(allowed: readonly string[] | undefined, orgName?: string): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  if (navigator.webdriver) return false; // סוויטות-הדפדפן — אפס התערבות
  if (!foreignHost(window.location.hostname, allowed)) return false;
  // אזהרה גלויה בקונסולה — הרתעה + עקבה. הזכויות של הבעלים.
  // eslint-disable-next-line no-console
  console.warn(
    `%c⚠️ ${orgName || 'מערכת זו'} — עותק לא-מורשה?%c\nהתוכנה מוגנת בזכויות-יוצרים ומורשית לשימוש רשמי בלבד.\nשימוש/העתקה בלתי-מורשים אסורים. מארח: ${window.location.hostname}`,
    'color:#b45309;font-weight:800;font-size:14px',
    'color:inherit',
  );
  return true;
}
