import { useState, type ReactNode } from 'react';
import { Logo, LogoMark } from './Logo.tsx';
import { go, type Route } from '../router.ts';
import { useApp } from '../store.tsx';

const NAV: { r: Route; label: string; icon: string }[] = [
  { r: 'dashboard', label: 'סקירה', icon: '◧' },
  { r: 'invoices', label: 'חשבוניות פתוחות', icon: '🧾' },
  { r: 'inbox', label: 'תשובות לקוחות', icon: '💬' },
  { r: 'settings', label: 'הגדרות עסק', icon: '⚙' },
];

/** הפעלה 142: רענון מהשרת נכשל באמצע עבודה ⇒ פס גלוי עם ניסיון חוזר, במקום נתונים ישנים בלי סימן. */
function StaleBanner() {
  const { reload } = useApp();
  const [busy, setBusy] = useState(false);
  return (
    <div role="status" data-testid="stale-banner" className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <span className="min-w-0 flex-1"><b>⚠ הנתונים לא עודכנו.</b> לא הצלחנו להתחבר לשרת, וייתכן שמה שמוצג כבר לא עדכני.</span>
      <button disabled={busy} data-testid="stale-retry" onClick={() => { setBusy(true); void reload().catch(() => { /* הפס נשאר */ }).finally(() => setBusy(false)); }}
        className="h-10 shrink-0 rounded-lg bg-ink-900 px-4 font-bold text-white cursor-pointer disabled:opacity-60">{busy ? 'מנסה…' : 'נסו שוב'}</button>
    </div>
  );
}

export function Shell({ route, children }: { route: Route; children: ReactNode }) {
  const { business, queue, mode, drafts, me, logout, stale } = useApp();
  // בחי: שם העובד המחובר (שער 6); טוקן משותף ⇒ שם העסק (כמו קודם)
  const who = mode === 'loading' || mode === 'error' ? '…' : mode === 'live' && me?.kind === 'user' && me.name ? me.name : business.name;
  const pending = queue.length;
  const modeText = mode === 'live' ? (stale ? '⚠ אין חיבור לשרת · הנתונים לא עודכנו' : '● מחובר לשרת גבי · dry-run') : mode === 'mock' ? '● מצב דמו (מוק) — אין שליחה' : mode === 'locked' ? '🔒 נדרש קוד גישה' : mode === 'error' ? '⚠ אין חיבור לשרת' : '… בודק חיבור לשרת';
  return (
    <div className="min-h-screen md:flex">
      <aside className="md:w-64 bg-ink-900 text-white shrink-0">
        <div className="flex flex-col md:sticky md:top-0 md:h-screen md:overflow-y-auto">
        {/* מובייל: לוגו + מצב חיבור תמיד גלויים (dry-run/מוק/נעול לא מוסתר) */}
        <div className="md:hidden flex items-center justify-between gap-2 px-3 pt-3">
          <button onClick={() => go('landing')} className="cursor-pointer flex items-center gap-2 min-h-10" aria-label="גבי – לדף הבית"><LogoMark size={28} dark /><b className="font-display">גבי</b></button>
          <span className="flex items-center gap-2 min-w-0">
            <span className="text-[11px] text-brand truncate" data-testid="mode-mobile">{modeText}</span>
            {mode === 'live' && <button onClick={() => void logout()} className="shrink-0 min-h-10 text-[11px] font-bold rounded-lg border border-white/20 px-3 cursor-pointer" data-testid="logout-mobile">יציאה</button>}
          </span>
        </div>
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
            <div className="font-bold truncate" data-testid="whoami">{who}</div>
            <div className="text-xs text-brand mt-1" data-testid="mode">{modeText}</div>
            {mode === 'live' && (
              <button onClick={() => void logout()} data-testid="logout"
                className="mt-3 w-full h-9 rounded-lg border border-white/15 text-sm font-bold text-ink-100 hover:bg-white/10 cursor-pointer">יציאה</button>
            )}
          </div>
        </div>
        </div>
      </aside>
      <main className="flex-1 min-w-0 p-4 md:p-8 max-w-6xl">{mode === 'live' && stale && <StaleBanner />}{children}</main>
    </div>
  );
}
