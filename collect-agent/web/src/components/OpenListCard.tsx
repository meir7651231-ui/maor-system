// critic סבב 79: שער «אישור רשימת הפתוחות» — «פתוח בחשבונית ירוקה» ≠ «לא שולם». לפני תזכורת ראשונה על
// חשבונית בעל העסק מסמן «עדיין פתוח» או «כבר שולם» (ביט/מזומן/העברה). בלי הכרטיס הזה השער היה חוסם בשקט.
import { useEffect, useState } from 'react';
import { api, type OpenItem } from '../api.ts';
import { useApp } from '../store.tsx';
import { fmtDate, fmtMoney } from '../lib/format.ts';
import { Button, Card, inputCls } from './ui.tsx';
import { DueEstimatedBadge } from './DueEstimatedBadge.tsx';
import { dueCorrections, humanizeOpenListError, validDue } from '../lib/dueEstimate.ts';

type Mark = 'open' | 'paid';

export function OpenListCard({ count }: { count: number }) {
  const { reload, showToast, showFail, dataSeq } = useApp();
  const [items, setItems] = useState<OpenItem[] | null>(null);
  const [mark, setMark] = useState<Record<number, Mark>>({});
  const [busy, setBusy] = useState(false);
  const [dueEdit, setDueEdit] = useState<Record<number, string>>({});   // תיקון מועד (בעיקר «מועד מוערך»)
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    api.openList().then(r => { if (live) setItems(r.enabled ? r.pending : []); }).catch(() => { if (live) setItems(null); });
    return () => { live = false; };
  }, [count, dataSeq]);

  if (!count || !items?.length) return null;
  const chosen = items.filter(i => mark[i.id]);
  const set = (id: number, m: Mark) => setMark(x => {
    const y = { ...x };
    if (y[id] === m) delete y[id]; else y[id] = m;
    return y;
  });
  const submit = async () => {
    setBusy(true);
    try {
      const open = chosen.filter(i => mark[i.id] === 'open').map(i => i.id);
      const paid = chosen.filter(i => mark[i.id] === 'paid').map(i => i.id);
      const due = dueCorrections(open, dueEdit, Object.fromEntries(items.map(i => [i.id, i.due])));
      setErr(null);
      await api.confirmOpenList(open, paid, due);
      setMark({}); setDueEdit({});
      const fixed = Object.keys(due).length;
      showToast(`נשמר: ${open.length} פתוחות${paid.length ? ` · ${paid.length} סומנו כשולמו` : ''}${fixed ? ` · ${fixed} מועדים תוקנו` : ''}`);
      await reload();
    } catch (e) {
      // 409 מהשרת (מועד לא תקין / חשבונית לא פתוחה) — ההודעה בעברית מהשרת, גלויה בכרטיס ולא רק בטוסט
      const msg = humanizeOpenListError((e as Error).message, items);
      setErr(msg);
      showFail(`האישור לא נשמר: ${msg}`);
    } finally { setBusy(false); }
  };

  return (
    <Card className="p-5 border-amber-300">
      <section aria-label="אישור רשימת הפתוחות" data-testid="open-list">
        <h2 className="text-lg font-extrabold mb-1">{count === 1 ? 'חשבונית אחת מחכה' : <>יש <span className="num">{count}</span> חשבוניות שמחכות</>} לאישור שלך</h2>
        <p className="text-sm text-ink-500 mb-4">לפני תזכורת ראשונה: מה עדיין פתוח, ומה כבר שולם בביט, במזומן או בהעברה? על מה שלא סימנת לא תצא תזכורת.</p>
        <ul className="divide-y divide-ink-100">
          {items.map(i => (
            <li key={i.id} className="py-3 flex flex-wrap items-center gap-2" data-testid={`open-item-${i.number}`}>
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate">{i.customer}</div>
                <div className="text-sm text-ink-500"><span className="num">#{i.number}</span> · <span className="num">{fmtMoney(i.amount_agorot / 100, i.currency)}</span>{i.due ? <> <span className="whitespace-nowrap">· לתשלום עד <span className="num">{fmtDate(i.due)}</span></span></> : null}{i.source === 'csv' ? ' · מקובץ CSV' : ''}</div>
              </div>
              <div className="flex gap-2" role="group" aria-label={`חשבונית ${i.number}`}>
                <Button size="sm" variant={mark[i.id] === 'open' ? 'primary' : 'outline'} aria-pressed={mark[i.id] === 'open'} onClick={() => set(i.id, 'open')}>עדיין פתוח</Button>
                <Button size="sm" variant={mark[i.id] === 'paid' ? 'dark' : 'outline'} aria-pressed={mark[i.id] === 'paid'} onClick={() => set(i.id, 'paid')}>כבר שולם</Button>
              </div>
              {i.due_estimated && (
                // d018a41: מועד מוערך ⇒ אפשר לתקן לפני «עדיין פתוח»; נשלח עם האישור (השרת: רק לחשבונית שסומנה פתוחה)
                <div className="basis-full rounded-lg bg-amber-50 border border-amber-200 p-2 text-sm" data-testid={`due-fix-${i.number}`}>
                  <DueEstimatedBadge withHelp />
                  <label className="mt-1.5 flex flex-wrap items-center gap-2">
                    <span className="font-bold text-ink-900">המועד הנכון:</span>
                    <input type="date" dir="ltr" className={`${inputCls} !w-44 !h-10`} data-testid={`due-input-${i.number}`}
                      value={dueEdit[i.id] ?? i.due ?? ''} aria-label={`מועד התשלום של חשבונית ${i.number}`}
                      onChange={e => setDueEdit(x => ({ ...x, [i.id]: e.target.value }))} />
                    {mark[i.id] !== 'open' && (dueEdit[i.id] ?? i.due) !== i.due && <span className="text-xs text-ink-700">יישמר רק עם «עדיין פתוח»</span>}
                    {dueEdit[i.id] && !validDue(dueEdit[i.id]) && <span className="text-xs font-bold text-critical-ink">תאריך לא תקין</span>}
                  </label>
                </div>
              )}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {err && <p role="alert" data-testid="open-list-error" className="basis-full text-sm font-bold text-critical-ink">האישור לא נשמר: {err}</p>}
          <Button data-testid="open-list-confirm" disabled={busy || !chosen.length} onClick={submit}>אישור ({chosen.length})</Button>
          <Button variant="ghost" size="sm" disabled={busy} onClick={() => setMark(Object.fromEntries(items.map(i => [i.id, 'open' as Mark])))}>הכול עדיין פתוח</Button>
        </div>
      </section>
    </Card>
  );
}
