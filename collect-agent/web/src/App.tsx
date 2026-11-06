import { useEffect } from 'react';
import { AppProvider, useApp } from './store.tsx';
import { useRoute } from './router.ts';
import { Shell } from './components/Shell.tsx';
import { Landing } from './pages/Landing.tsx';
import { Signup } from './pages/Signup.tsx';
import { Dashboard } from './pages/Dashboard.tsx';
import { Invoices } from './pages/Invoices.tsx';
import { Settings } from './pages/Settings.tsx';
import { Inbox } from './pages/Inbox.tsx';
import { Pay } from './pages/Pay.tsx';
import { payCodeOf, takeTokenFromHash } from './lib/auth.ts';

function Routed() {
  const r = useRoute();
  const { toast, mode, reload } = useApp();
  // מעבר מסך בחי ⇒ רענון מהשרת (התור/החשבוניות משתנים בשרת: ייבוא CSV, תכנון לילי, תשובות לקוחות)
  useEffect(() => { if (mode === 'live') void reload().catch(() => { /* השגיאה תוצג בפעולה הבאה */ }); }, [r, mode, reload]);
  const page = r === 'landing' ? <Landing /> : r === 'signup' ? <Signup /> : (
    <Shell route={r}>{r === 'dashboard' ? <Dashboard /> : r === 'invoices' ? <Invoices /> : r === 'inbox' ? <Inbox /> : <Settings />}</Shell>
  );
  return (
    <>
      {page}
      <div aria-live="polite" className="fixed bottom-5 inset-x-0 flex justify-center pointer-events-none z-50 px-4">
        {toast && <div className="bg-ink-900 text-white rounded-xl px-5 py-3 shadow-pop font-medium">{toast}</div>}
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
