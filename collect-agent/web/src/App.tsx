import { useEffect, useLayoutEffect, useState } from 'react';
import { TOAST_BOTTOM, toastBottom } from './lib/toast.ts';
import { AppProvider, useApp } from './store.tsx';
import { go, useRoute, type Route } from './router.ts';
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

/** הפעלה 150: שלד טעינה במקום «טוען…» במרכז מסך ריק. צורות אפורות בלבד: בלי שמות, בלי סכומים ובלי כותרות של מסך מסוים
 *  (הכלל של 140 נשמר: שום דבר שנראה כמו נתוני העסק). קורא מסך שומע «טוען נתונים…» פעם אחת; הצורות מוסתרות ממנו.
 *  הפעלה 158: הצורות לפי המסך המבוקש (סקירה: מדדים + תור; חשבוניות: טבלה; תשובות: כרטיסים; הגדרות: טופס),
 *  כדי שהמסך לא יקפוץ לפריסה אחרת כשהנתונים מגיעים. עדיין צורות בלבד. */
function LoadingSkeleton({ route }: { route: Route }) {
  const bar = 'rounded-md bg-ink-200';
  const card = 'rounded-2xl bg-white shadow-card p-5';
  const shape = route === 'invoices' || route === 'inbox' || route === 'settings' ? route : 'dashboard';
  return (
    <>
      <span className="sr-only">טוען נתונים…</span>
      <div aria-hidden="true" data-testid="app-skeleton" data-shape={shape} className="animate-pulse space-y-6 py-2">
        <div className={`${bar} h-7 w-40`} />
        {shape === 'dashboard' && <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className={`${card} space-y-3`}><div className={`${bar} h-7 w-1/2`} /><div className={`${bar} h-4 w-3/4`} /></div>
            ))}
          </div>
          <div className={`${card} space-y-4`}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3"><div className={`${bar} h-10 w-10 shrink-0 rounded-full`} /><div className="flex-1 space-y-2"><div className={`${bar} h-4 w-1/3`} /><div className={`${bar} h-3 w-1/2`} /></div></div>
            ))}
          </div>
        </>}
        {shape === 'invoices' && <>
          <div className="flex flex-wrap gap-2">{[0, 1, 2, 3].map(i => <div key={i} className={`${bar} h-9 w-24 rounded-full`} />)}</div>
          <div className={`${card} space-y-4`} data-testid="sk-table">
            {[0, 1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-4"><div className={`${bar} h-4 w-1/4`} /><div className={`${bar} h-4 w-16`} /><div className={`${bar} h-4 flex-1`} /><div className={`${bar} h-8 w-20 shrink-0`} /></div>
            ))}
          </div>
        </>}
        {shape === 'inbox' && [0, 1, 2].map(i => (
          <div key={i} className={`${card} space-y-3`} data-testid="sk-msg">
            <div className="flex items-center gap-3"><div className={`${bar} h-10 w-10 shrink-0 rounded-full`} /><div className={`${bar} h-4 w-1/3`} /></div>
            <div className={`${bar} h-4 w-5/6`} /><div className={`${bar} h-4 w-2/3`} />
            <div className="flex gap-2"><div className={`${bar} h-9 w-24`} /><div className={`${bar} h-9 w-24`} /></div>
          </div>
        ))}
        {shape === 'settings' && [0, 1].map(i => (
          <div key={i} className={`${card} space-y-4`} data-testid="sk-form">
            <div className={`${bar} h-5 w-1/4`} />
            {[0, 1, 2].map(j => <div key={j} className="space-y-2"><div className={`${bar} h-3 w-24`} /><div className={`${bar} h-11 w-full`} /></div>)}
          </div>
        ))}
      </div>
    </>
  );
}

function Routed() {
  const r = useRoute();
  const { toast, toastSticky, closeToast, mode, reload } = useApp();
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
  // הפעלה 151: Escape סוגר קודם את הודעת הכשל, ורק לחיצה שנייה סוגרת את החלון שמתחתיה (capture ⇒ לפני המאזין של החלון)
  useEffect(() => {
    if (!toast || !toastSticky) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopImmediatePropagation(); closeToast(); } };
    window.addEventListener('keydown', k, true);
    return () => window.removeEventListener('keydown', k, true);
  }, [toast, toastSticky, closeToast]);
  // שער 6: שרת חי שדורש אימות ⇒ מסך הכניסה במקום המסך המבוקש (הכתובת נשמרת ⇒ אחרי כניסה חוזרים אליו)
  const page = r === 'landing' ? <Landing /> : r === 'signup' ? <Signup /> : r === 'login' || mode === 'locked' ? <Login /> : (
    // הפעלה 140: עד שיודעים אם יש שרת (mode='loading') לא מציגים את נתוני המוק — בעל עסק מחובר ראה לרגע לקוחות
    // וסכומים בדויים בכל טעינה. מצב ניטרלי עד שהשרת עונה (חי) או שאין שרת (מוק).
    <Shell route={r}>{mode === 'loading' ? <div role="status" data-testid="app-loading"><LoadingSkeleton route={r} /></div>
      : mode === 'error' ? <LoadError />
      : r === 'dashboard' ? <Dashboard /> : r === 'invoices' ? <Invoices /> : r === 'inbox' ? <Inbox /> : <Settings />}</Shell>
  );
  return (
    <>
      {page}
      {/* הפעלה 145: בהגדרות ה-toast כיסה את שורת השגיאה בסרגל השמירה הדביק שבתחתית.
          הפעלה 148: הפתרון של 145 (להציג למעלה) כיסה את הכותרת, מצב החיבור וכפתור היציאה ⇒ ה-toast תמיד בתחתית, מורם מעל הסרגל */}
      <div aria-live="polite" style={{ bottom: toastAt }} className="fixed inset-x-0 flex justify-center pointer-events-none z-50 px-4">
        {/* הפעלה 151: הודעת כשל נשארת עד סגירה (✕ / Escape). role="alert" ⇒ קורא מסך מכריז מיד; הודעת הצלחה נשארת polite ונעלמת לבד */}
        {toast && (toastSticky
          ? <div data-testid="toast" data-sticky role="alert" className="pointer-events-auto flex items-center gap-2 bg-ink-900 text-white rounded-xl ps-5 pe-1.5 py-1.5 shadow-pop font-medium max-w-full">
              <span className="py-1.5 min-w-0 break-words">{toast}</span>
              <button type="button" data-testid="toast-close" aria-label="סגירת ההודעה" onClick={closeToast}
                className="shrink-0 size-11 grid place-items-center rounded-lg cursor-pointer hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-white"><span aria-hidden="true">✕</span></button>
            </div>
          : <div data-testid="toast" className="bg-ink-900 text-white rounded-xl px-5 py-3 shadow-pop font-medium">{toast}</div>)}
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
