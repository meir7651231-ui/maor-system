import { useEffect, useLayoutEffect, useState } from 'react';
import { TOAST_BOTTOM, toastBottom } from './lib/toast.ts';
import { AppProvider, useApp } from './store.tsx';
import { go, useRoute } from './router.ts';
import { Shell } from './components/Shell.tsx';
import { Landing } from './pages/Landing.tsx';
import { Signup } from './pages/Signup.tsx';
import { Dashboard } from './pages/Dashboard.tsx';
import { Invoices } from './pages/Invoices.tsx';
import { Settings } from './pages/Settings.tsx';
import { Inbox } from './pages/Inbox.tsx';
import { Pay } from './pages/Pay.tsx';
import { Login } from './pages/Login.tsx';
import { payCodeOf, takeTokenFromHash } from './lib/auth.ts';

/** הפעלה 141: השרת לא ענה או שהטעינה נכשלה ⇒ הודעה ברורה ו«נסו שוב», בלי נתוני מוק שנראים כמו נתוני העסק. */
function LoadError() {
  const { retry } = useApp();
  const [busy, setBusy] = useState(false);
  return (
    <div role="alert" data-testid="app-error" className="py-24 text-center max-w-md mx-auto">
      <h1 className="text-xl font-bold text-ink-900">לא הצלחנו לטעון את הנתונים מהשרת</h1>
      <p className="mt-2 text-ink-500">לא מוצגים נתונים, כדי שלא תראו מספרים שאינם שלכם. בדקו את החיבור ונסו שוב.</p>
      <button disabled={busy} data-testid="app-retry" onClick={() => { setBusy(true); void retry().finally(() => setBusy(false)); }}
        className="mt-6 h-11 px-6 rounded-xl bg-ink-900 text-white font-bold cursor-pointer disabled:opacity-60">{busy ? 'מנסה…' : 'נסו שוב'}</button>
    </div>
  );
}

function Routed() {
  const r = useRoute();
  const { toast, mode, reload } = useApp();
  // מעבר מסך בחי ⇒ רענון מהשרת (התור/החשבוניות משתנים בשרת: ייבוא CSV, תכנון לילי, תשובות לקוחות)
  useEffect(() => { if (mode === 'live') void reload().catch(() => { /* כשל ⇒ store מסמן stale והשלד מציג «הנתונים לא עודכנו» */ }); }, [r, mode, reload]);
  // כבר מחובר ⇒ #/login מעביר לסקירה (גם מיד אחרי כניסה מוצלחת)
  // הפעלה 143: גם כניסה שהצליחה כשהטעינה שאחריה נכשלה (mode='error', הסשן שמור) יוצאת ממסך הכניסה, אל מסך השגיאה עם «נסו שוב»
  useEffect(() => { if (r === 'login' && (mode === 'live' || mode === 'error')) go('dashboard'); }, [r, mode]);
  // הפעלה 148: כשמוצג toast מודדים את הסרגל הדביק שבתחתית (אם יש) ומרימים את ה-toast מעליו
  const [toastAt, setToastAt] = useState(TOAST_BOTTOM);
  useLayoutEffect(() => {
    if (!toast) return;
    const bar = document.querySelector('[data-sticky-bar]');
    setToastAt(toastBottom(bar ? bar.getBoundingClientRect().top : null, window.innerHeight));
  }, [toast, r]);
  // שער 6: שרת חי שדורש אימות ⇒ מסך הכניסה במקום המסך המבוקש (הכתובת נשמרת ⇒ אחרי כניסה חוזרים אליו)
  const page = r === 'landing' ? <Landing /> : r === 'signup' ? <Signup /> : r === 'login' || mode === 'locked' ? <Login /> : (
    // הפעלה 140: עד שיודעים אם יש שרת (mode='loading') לא מציגים את נתוני המוק — בעל עסק מחובר ראה לרגע לקוחות
    // וסכומים בדויים בכל טעינה. מצב ניטרלי עד שהשרת עונה (חי) או שאין שרת (מוק).
    <Shell route={r}>{mode === 'loading' ? <div role="status" data-testid="app-loading" className="py-24 text-center text-ink-500">טוען…</div>
      : mode === 'error' ? <LoadError />
      : r === 'dashboard' ? <Dashboard /> : r === 'invoices' ? <Invoices /> : r === 'inbox' ? <Inbox /> : <Settings />}</Shell>
  );
  return (
    <>
      {page}
      {/* הפעלה 145: בהגדרות ה-toast כיסה את שורת השגיאה בסרגל השמירה הדביק שבתחתית.
          הפעלה 148: הפתרון של 145 (להציג למעלה) כיסה את הכותרת, מצב החיבור וכפתור היציאה ⇒ ה-toast תמיד בתחתית, מורם מעל הסרגל */}
      <div aria-live="polite" style={{ bottom: toastAt }} className="fixed inset-x-0 flex justify-center pointer-events-none z-50 px-4">
        {toast && <div data-testid="toast" className="bg-ink-900 text-white rounded-xl px-5 py-3 shadow-pop font-medium">{toast}</div>}
      </div>
    </>
  );
}
// קישור מ-demo.sh: #/dashboard?token=… ⇒ נשמר ב-sessionStorage ונמחק משורת הכתובת
const absorbToken = (): boolean => {
  try {
    const clean = takeTokenFromHash(location.hash, sessionStorage);
    if (clean === location.hash) return false;
    history.replaceState(null, '', location.pathname + location.search + clean);
    return true;
  } catch { return false; }   // sessionStorage חסום
};
absorbToken();
// קישור-עם-טוקן שנפתח בלשונית שכבר פתוחה (רק ה-hash משתנה) ⇒ טעינה מחדש עם הטוקן
addEventListener('hashchange', () => { if (absorbToken()) location.reload(); });

/** /pay/{code} = עמוד החייב: ציבורי, בלי AppProvider (לא נוגע ב-API של בעל העסק). */
export const App = () => {
  const code = payCodeOf(location.pathname);
  return code ? <Pay code={code} /> : <AppProvider><Routed /></AppProvider>;
};
