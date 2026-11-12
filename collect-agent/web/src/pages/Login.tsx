// מסך הכניסה (legal/BETA-GATE.md שער 6): משתמש לכל עובד + 2FA. מייל + סיסמה + קוד 6 ספרות (TOTP).
// הסשן נשמר ב-sessionStorage של הלשונית בלבד (lib/auth.ts). הטוקן המשותף («קוד גישה») נשאר רק כשהשרת
// לא דורש כניסת עובד (REQUIRE_USER_LOGIN כבוי: דמו/פיתוח). במצב מוק (אין שרת) אין כניסה אמיתית.
import { useState } from 'react';
import { Logo } from '../components/Logo.tsx';
import { Button, Field, inputCls } from '../components/ui.tsx';
import { useApp } from '../store.tsx';
import { cleanCode, loginProblem } from '../lib/auth.ts';
import { go } from '../router.ts';

export function Login() {
  const { login, mode, health, authNote } = useApp();
  const [f, setF] = useState({ email: '', password: '', code: '' });
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const mock = mode === 'mock';
  const sharedCodeAllowed = !mock && health?.login_required !== true;
  return (
    <div className="min-h-screen bg-gradient-to-b from-ink-900 to-ink-800 grid place-items-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6"><a href="#" aria-label="גבי – לדף הבית"><Logo dark size={44} /></a></div>
        <form className="bg-white rounded-2xl shadow-pop p-6 md:p-8 space-y-4" data-testid="staff-login" noValidate
          onSubmit={async e => {
            e.preventDefault(); setErr('');
            if (mock) { setErr('מצב דמו: אין שרת גבי מחובר, ולכן אין כניסה אמיתית. לחצו «המשך להדגמה»'); return; }
            const p = loginProblem(f.email, f.password, f.code); if (p) { setErr(p); return; }
            setBusy(true);
            const m = await login(f.email, f.password, f.code);
            setBusy(false);
            // הקוד חד-פעמי ⇒ תמיד מנקים אותו; הסיסמה נמחקת מהזיכרון אחרי ניסיון
            if (m) { setErr(m); setF(x => ({ ...x, code: '' })); } else setF({ email: '', password: '', code: '' });
          }}>
          <div>
            <h1 className="text-2xl font-extrabold">כניסה לעובדי העסק</h1>
            <p className="text-sm text-ink-500 mt-1">מייל, סיסמה וקוד בן 6 ספרות מאפליקציית האימות בטלפון.</p>
          </div>
          {authNote && <p className="rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm p-3" data-testid="auth-note">⏱ {authNote}</p>}
          {mock && (
            <div className="rounded-xl bg-ink-50 border border-ink-200 p-3 text-sm text-ink-700 space-y-2" data-testid="login-mock">
              <p>● מצב דמו (מוק): אין שרת מחובר ואין צורך בכניסה. הנתונים בדויים ולא נשלחת שום הודעה.</p>
              <Button type="button" variant="dark" size="sm" onClick={() => go('dashboard')}>המשך להדגמה ←</Button>
            </div>
          )}
          <Field label="מייל">
            <input className={`${inputCls} num text-left`} dir="ltr" type="email" autoComplete="username" inputMode="email"
              value={f.email} onChange={e => setF({ ...f, email: e.target.value })} placeholder="name@business.co.il" />
          </Field>
          {/* לא בתוך <label>: אחרת כפתור ההצגה נכנס לשם הנגיש של השדה */}
          <div>
            <label htmlFor="login-pw" className="block text-sm font-bold text-ink-800 mb-1.5">סיסמה</label>
            <div className="relative">
              <input id="login-pw" className={`${inputCls} pe-20`} type={show ? 'text' : 'password'} autoComplete="current-password"
                value={f.password} onChange={e => setF({ ...f, password: e.target.value })} />
              <button type="button" onClick={() => setShow(v => !v)} aria-pressed={show} aria-label={show ? 'הסתרת התווים' : 'הצגת התווים'}
                className="absolute inset-y-0 end-2 my-auto h-8 px-2.5 rounded-lg text-xs font-bold text-ink-700 hover:bg-ink-100 cursor-pointer">
                {show ? 'הסתרה' : 'הצגה'}
              </button>
            </div>
          </div>
          <Field label="קוד אימות" hint="6 ספרות מ-Google Authenticator או אפליקציה דומה. הקוד מתחלף כל 30 שניות.">
            <input className={`${inputCls} num text-center text-lg tracking-[0.4em]`} dir="ltr" inputMode="numeric" autoComplete="one-time-code"
              value={f.code} onChange={e => setF({ ...f, code: cleanCode(e.target.value) })} placeholder="000000" />
          </Field>
          {err && <p role="alert" className="rounded-xl bg-red-50 text-critical text-sm font-bold p-3" data-testid="login-error">{err}</p>}
          <Button className="w-full" disabled={busy}>{busy ? 'נכנסים…' : 'כניסה'}</Button>
          <p className="text-xs text-ink-500 text-center">🔒 הכניסה נשמרת רק בלשונית הזו. סגירת הלשונית, «יציאה» או 12 שעות מבטלות אותה.</p>
        </form>
        {sharedCodeAllowed && (
          <details className="mt-4 text-sm text-ink-400">
            <summary className="cursor-pointer text-center">יש לי קוד גישה משותף (מצב פיתוח)</summary>
            <CodeGate />
          </details>
        )}
        <p className="text-center mt-5"><a href="#" className="text-sm text-ink-400 hover:text-white">← חזרה לדף הבית</a></p>
      </div>
    </div>
  );
}

/** הטוקן המשותף של בעל העסק — רק כשהשרת לא דורש כניסת עובד (דמו/פיתוח). ביומן נרשם כ-«owner». */
function CodeGate() {
  const { unlock } = useApp();
  const [v, setV] = useState('');
  const [err, setErr] = useState('');
  return (
    <form className="mt-3 bg-white rounded-2xl shadow-card p-5 space-y-3 text-ink-900" data-testid="token-gate"
      onSubmit={async e => { e.preventDefault(); setErr(''); const r = await unlock(v);
        if (r === 'bad') setErr('הקוד לא התקבל. בדקו שהעתקתם אותו במלואו.');
        else if (r === 'down') setErr('השרת לא זמין כרגע, ולכן הקוד לא נבדק. נסו שוב בעוד רגע.'); }}>
      <h2 className="font-extrabold">🔑 קוד גישה לבעל העסק</h2>
      <p className="text-ink-500">ב-<code>./demo.sh</code> הקוד מודפס בהפעלה. בבטא אמיתית האפשרות הזו כבויה, וכל עובד נכנס עם משתמש משלו.</p>
      <input value={v} onChange={e => setV(e.target.value)} type="password" autoComplete="off" aria-label="קוד גישה"
        className={`${inputCls} num`} placeholder="הדביקו כאן" />
      {err && <p role="alert" className="text-critical font-bold" data-testid="token-error">{err}</p>}
      <Button variant="dark" className="w-full" disabled={v.trim().length < 32}>כניסה</Button>
    </form>
  );
}
