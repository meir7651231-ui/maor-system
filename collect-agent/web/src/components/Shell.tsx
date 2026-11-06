import { useState, type ReactNode } from 'react';
import { Logo } from './Logo.tsx';
import { go, type Route } from '../router.ts';
import { useApp } from '../store.tsx';

const NAV: { r: Route; label: string; icon: string }[] = [
  { r: 'dashboard', label: 'סקירה', icon: '◧' },
  { r: 'invoices', label: 'חשבוניות פתוחות', icon: '🧾' },
  { r: 'inbox', label: 'תשובות לקוחות', icon: '💬' },
  { r: 'settings', label: 'הגדרות עסק', icon: '⚙' },
];

export function Shell({ route, children }: { route: Route; children: ReactNode }) {
  const { business, queue, mode, drafts } = useApp();
  const pending = queue.length;
  return (
    <div className="min-h-screen md:flex">
      <aside className="md:w-64 bg-ink-900 text-white shrink-0">
        <div className="flex md:flex-col md:sticky md:top-0 md:h-screen md:overflow-y-auto">
        <div className="p-4 md:p-6 hidden md:block"><button onClick={() => go('landing')} className="cursor-pointer"><Logo dark /></button></div>
        <nav className="flex md:flex-col gap-1 p-2 md:px-3 w-full overflow-x-auto" aria-label="ניווט ראשי">
          {NAV.map(n => (
            <a key={n.r} href={`#/${n.r}`} aria-current={route === n.r ? 'page' : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium whitespace-nowrap ${route === n.r ? 'bg-white/10 text-white' : 'text-ink-400 hover:text-white hover:bg-white/5'}`}>
              <span aria-hidden className="w-5 text-center">{n.icon}</span>{n.label}
              {n.r === 'invoices' && pending > 0 && <span className="ms-auto bg-brand text-ink-900 text-xs font-bold rounded-full px-2 py-0.5 num">{pending}</span>}
              {n.r === 'inbox' && drafts.length > 0 && <span className="ms-auto bg-amber-400 text-ink-900 text-xs font-bold rounded-full px-2 py-0.5 num" data-testid="inbox-count">{drafts.length}</span>}
            </a>
          ))}
        </nav>
        <div className="mt-auto p-5 hidden md:block text-sm">
          <div className="rounded-xl bg-white/5 p-3">
            <div className="text-ink-400 text-xs">מחובר/ת כ-</div>
            <div className="font-bold">{business.name}</div>
            <div className="text-xs text-brand mt-1" data-testid="mode">{mode === 'live' ? '● מחובר לשרת גבי · dry-run' : mode === 'mock' ? '● מצב דמו (מוק) — אין שליחה' : mode === 'locked' ? '🔒 נדרש קוד גישה' : '… בודק חיבור לשרת'}</div>
          </div>
        </div>
        </div>
      </aside>
      <main className="flex-1 min-w-0 p-4 md:p-8 max-w-6xl">{mode === 'locked' ? <TokenGate /> : children}</main>
    </div>
  );
}

/** השרת חי אבל דורש קוד גישה (401) — לא נופלים למוק בשקט, מבקשים את הקוד. */
function TokenGate() {
  const { unlock } = useApp();
  const [v, setV] = useState('');
  const [err, setErr] = useState('');
  return (
    <form className="max-w-md mx-auto mt-10 bg-white rounded-2xl shadow-card p-6 space-y-4" data-testid="token-gate"
      onSubmit={async e => { e.preventDefault(); setErr(''); if (!(await unlock(v))) setErr('הקוד לא התקבל. בדקו שהעתקתם אותו במלואו.'); }}>
      <h1 className="text-2xl font-extrabold">🔒 קוד גישה לבעל העסק</h1>
      <p className="text-sm text-ink-500">השרת מוגן. הדביקו את קוד הגישה (ב-<code>./demo.sh</code> הוא מודפס בהפעלה). הקוד נשמר רק בלשונית הזו.</p>
      <input value={v} onChange={e => setV(e.target.value)} type="password" autoComplete="off" aria-label="קוד גישה"
        className="w-full h-11 rounded-xl border border-ink-200 px-3.5 num" placeholder="הדביקו כאן" />
      {err && <p role="alert" className="text-critical text-sm font-bold">{err}</p>}
      <button className="w-full h-11 rounded-xl bg-brand text-ink-900 font-bold" disabled={v.trim().length < 32}>כניסה</button>
    </form>
  );
}
