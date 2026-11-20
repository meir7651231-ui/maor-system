import { useCallback, useEffect, useState } from 'react';
import { useApp } from '../store.tsx';
import { api } from '../api.ts';
import { Button, Card, OwnerBadge } from './ui.tsx';
import { dsrCloseLocked } from '../lib/roles.ts';
import { failPrefix } from '../lib/failure.ts';
import { DSR_NOTE_MIN, dsrCanClose, dsrSorted, dsrView, type DsrRow } from '../lib/dsr.ts';

const TONE: Record<string, string> = {
  late: 'bg-red-50 text-red-800 ring-red-200', soon: 'bg-amber-50 text-amber-800 ring-amber-200',
  ok: 'bg-ink-100 text-ink-700 ring-ink-200', done: 'bg-brand-50 text-ink-700 ring-ink-200',
};

/** critic סבב 172ב: מרשם בקשות העיון/התיקון/המחיקה — רשימה, ימים שנותרו, וסגירה עם תיעוד (≥5 תווים).
 *  מוצג רק בחיבור לשרת. «✓ טופל» על כרטיס ההתראה סוגר הודעה בלבד; הבקשה עצמה נסגרת כאן. */
export function DsrRegister() {
  const { mode, dataSeq } = useApp();
  const [rows, setRows] = useState<DsrRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const load = useCallback(async () => {
    try { setRows(await api.dsr()); setErr(null); } catch (e) { setErr((e as Error).message); }
  }, []);
  useEffect(() => { if (mode === 'live') void load(); }, [mode, dataSeq, load]);
  // קישור מהכרטיס בסקירה: #/inbox?dsr=1 ⇒ גלילה למרשם
  useEffect(() => {
    if (rows && /[?&]dsr=1/.test(location.hash)) document.getElementById('dsr')?.scrollIntoView({ block: 'start' });
  }, [rows]);
  if (mode !== 'live') return null;
  const sorted = dsrSorted(rows ?? []);
  const open = sorted.filter(r => r.status === 'open');
  const done = sorted.filter(r => r.status !== 'open');
  return (
    <section id="dsr" aria-labelledby="dsr-h" data-testid="dsr-register" className="scroll-mt-4">
      <Card className="p-5">
        <h2 id="dsr-h" className="text-lg font-extrabold">📄 בקשות עיון / תיקון / מחיקה</h2>
        <p className="text-xs text-ink-500 mt-1">לפי חוק הגנת הפרטיות יש להשיב תוך 30 יום (לבדיקת עו״ד). גבי לא עונה ללקוח בשמכם — כשטיפלתם, סגרו כאן עם תיעוד קצר: מה נמסר/תוקן/נמחק ואיך.</p>
        {err && <p role="alert" className="mt-3 text-sm text-critical-ink font-bold">{failPrefix('המרשם לא נטען', err)}</p>}
        {rows && open.length === 0 && <p className="mt-3 text-sm text-ink-500" data-testid="dsr-empty">אין בקשות פתוחות ✨</p>}
        {open.length > 0 && <ul className="mt-3 space-y-3" data-testid="dsr-open">{open.map(r => <DsrItem key={r.id} r={r} onDone={load} />)}</ul>}
        {done.length > 0 && (
          <details className="mt-4" data-testid="dsr-done">
            <summary className="cursor-pointer text-sm font-bold text-ink-700">בקשות שטופלו (<span className="num">{done.length}</span>)</summary>
            <ul className="mt-2 space-y-2">{done.map(r => {
              const v = dsrView(r);
              return <li key={r.id} className="rounded-lg bg-ink-50 p-3 text-sm"><b>{v.kind}</b> · {v.who} · {v.state}<div className="text-xs text-ink-500 mt-0.5 break-words">{r.note}</div></li>;
            })}</ul>
          </details>
        )}
      </Card>
    </section>
  );
}

function DsrItem({ r, onDone }: { r: DsrRow; onDone: () => Promise<void> }) {
  const { reload, showToast, showFail, me } = useApp();
  const v = dsrView(r);
  const locked = dsrCloseLocked(me, r.kind);   // מחיקה = בעל העסק בלבד (השרת: 403)
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const close = async () => {
    setBusy(true);
    try { await api.dsrDone(r.id, note.trim()); } catch (e) { showFail(failPrefix('הבקשה לא נסגרה', (e as Error).message)); setBusy(false); await onDone(); return; }
    await onDone(); await reload().catch(() => { /* stale מטופל ב-store */ });
    showToast(`✓ בקשת ה${v.kind} נסגרה ותועדה`);
  };
  return (
    <li className="rounded-lg border border-ink-200 p-3 text-sm" data-testid="dsr-row" data-tone={v.tone} data-customerless={r.customer_id == null || undefined}>
      <div className="flex flex-wrap items-center gap-2">
        <b>{v.kind}</b>
        <span className={r.customer_id == null ? 'text-amber-800 font-bold' : ''}>· {v.who}</span>
        <span className={`ms-auto rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset ${TONE[v.tone]}`} data-testid="dsr-state">{v.state}</span>
      </div>
      <div className="text-xs text-ink-500 mt-0.5">להשיב עד <span className="num">{v.due}</span></div>
      <label className="block mt-2">
        <span className="text-xs font-bold">תיעוד הטיפול (לפחות {DSR_NOTE_MIN} תווים)</span>
        <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} maxLength={500} data-testid="dsr-note"
          placeholder="למשל: נשלח ללקוח קובץ הייצוא במייל ב-19.11" aria-label={`תיעוד סגירת בקשת ה${v.kind} של ${v.who}`}
          className="mt-1 w-full rounded-xl border border-ink-200 p-2.5 text-sm focus:border-brand focus:ring-2 focus:ring-brand/30 outline-none" />
      </label>
      <div className="flex flex-wrap items-center justify-end gap-1 mt-2">
        {locked && <span className="text-xs text-ink-700 me-auto" data-testid="dsr-close-owner-only">סגירת בקשת מחיקה מאשרת שהמידע נמחק — רק בעל העסק.</span>}
        <Button size="sm" data-testid="dsr-close" disabled={locked || busy || !dsrCanClose(note)} onClick={() => void close()}>✓ טופל — סגירת הבקשה</Button>
        {locked && <OwnerBadge testId="dsr-owner-badge" />}
      </div>
    </li>
  );
}
