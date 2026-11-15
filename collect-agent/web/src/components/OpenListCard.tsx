// critic סבב 79: שער «אישור רשימת הפתוחות» — «פתוח בחשבונית ירוקה» ≠ «לא שולם». לפני תזכורת ראשונה על
// חשבונית בעל העסק מסמן «עדיין פתוח» או «כבר שולם» (ביט/מזומן/העברה). בלי הכרטיס הזה השער היה חוסם בשקט.
import { useEffect, useState } from 'react';
import { api, type OpenItem } from '../api.ts';
import { useApp } from '../store.tsx';
import { fmtDate, fmtMoney } from '../lib/format.ts';
import { Button, Card } from './ui.tsx';

type Mark = 'open' | 'paid';

export function OpenListCard({ count }: { count: number }) {
  const { reload, showToast, showFail, dataSeq } = useApp();
  const [items, setItems] = useState<OpenItem[] | null>(null);
  const [mark, setMark] = useState<Record<number, Mark>>({});
  const [busy, setBusy] = useState(false);

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
      await api.confirmOpenList(open, paid);
      setMark({});
      showToast(`נשמר: ${open.length} פתוחות${paid.length ? ` · ${paid.length} סומנו כשולמו` : ''}`);
      await reload();
    } catch (e) {
      showFail(`האישור לא נשמר: ${(e as Error).message}`);
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
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button data-testid="open-list-confirm" disabled={busy || !chosen.length} onClick={submit}>אישור ({chosen.length})</Button>
          <Button variant="ghost" size="sm" disabled={busy} onClick={() => setMark(Object.fromEntries(items.map(i => [i.id, 'open' as Mark])))}>הכול עדיין פתוח</Button>
        </div>
      </section>
    </Card>
  );
}
