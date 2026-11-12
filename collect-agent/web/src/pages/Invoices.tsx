import { useMemo, useState } from 'react';
import { useApp } from '../store.tsx';
import { daysOverdue, fmtDate, fmtMoney, fmtTotal } from '../lib/format.ts';
import { STEP_LABEL, nextStep } from '../lib/message.ts';
import { byAmountDesc, isOpen, sentChannels } from '../lib/stats.ts';
import type { Invoice, InvoiceStatus } from '../lib/domain.ts';
import { Button, Card, LateBadge, StatusBadge, inputCls } from '../components/ui.tsx';
import { MessagePreview } from '../components/MessagePreview.tsx';

type Sort = 'late' | 'amount' | 'name';
const FILTERS: [InvoiceStatus | 'all', string][] = [['all', 'הכול'], ['open', 'פתוחות'], ['reminded', 'נשלחה תזכורת'], ['promised', 'הבטיח'], ['disputed', 'במחלוקת']];

export function Invoices() {
  const { invoices, today, customerOf, markPaid, mode, pendingOf, mergedAnchorOf } = useApp();
  const live = mode === 'live';
  const [q, setQ] = useState('');
  const [f, setF] = useState<InvoiceStatus | 'all'>('all');
  const [sort, setSort] = useState<Sort>('late');
  const [open, setOpen] = useState<Invoice | null>(null);
  const rows = useMemo(() => {
    const t = q.trim();
    return invoices.filter(isOpen)
      .filter(i => f === 'all' || i.status === f)
      .filter(i => !t || customerOf(i.customerId).name.includes(t) || i.number.includes(t))
      .sort((a, b) => sort === 'amount' ? byAmountDesc(a, b) : sort === 'name'
        ? customerOf(a.customerId).name.localeCompare(customerOf(b.customerId).name, 'he')
        : daysOverdue(b.dueAt, today) - daysOverdue(a.dueAt, today));
  }, [invoices, q, f, sort, today, customerOf]);
  
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-extrabold">חשבוניות שלא שולמו</h1>
        <p className="text-ink-500 mt-1">{live ? 'מסונכרן מחשבונית ירוקה (sandbox מדומה)' : 'מסונכרן מחשבונית ירוקה (דמו)'} · <b className="text-ink-900 num">{rows.length}</b> חשבוניות · <b className="text-ink-900">{fmtTotal(rows)}</b></p>
      </div>
      <div className="flex flex-wrap gap-3 items-center">
        <input className={`${inputCls} max-w-xs`} placeholder="חיפוש לקוח או מס׳ חשבונית…" value={q} onChange={e => setQ(e.target.value)} aria-label="חיפוש" />
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map(([k, l]) => (
            <button key={k} onClick={() => setF(k)} aria-pressed={f === k}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium cursor-pointer ${f === k ? 'bg-ink-900 text-white' : 'bg-white border border-ink-200 hover:bg-ink-50'}`}>{l}</button>
          ))}
        </div>
        <select className={`${inputCls} w-auto ms-auto`} value={sort} onChange={e => setSort(e.target.value as Sort)} aria-label="מיון">
          <option value="late">מיון: הכי באיחור</option><option value="amount">מיון: סכום</option><option value="name">מיון: שם לקוח</option>
        </select>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ink-50 text-ink-500 text-right">
              <tr>{['לקוח', 'חשבונית', 'סכום', 'מועד תשלום', 'איחור', 'סטטוס', 'תזכורות', ''].map(h => <th key={h} className="px-4 py-3 font-bold whitespace-nowrap">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-ink-200">
              {rows.map(i => {
                const c = customerOf(i.customerId), d = daysOverdue(i.dueAt, today);
                const last = i.reminders.at(-1);
                const anchor = live ? mergedAnchorOf(i.id) : undefined;
                return (
                  <tr key={i.id} className="hover:bg-ink-50/60">
                    <td className="px-4 py-3"><div className="font-bold">{c.name}</div>{i.note && <div className="text-xs text-ink-500">📝 {i.note}</div>}</td>
                    <td className="px-4 py-3"><span className="num">{i.number}</span>{i.source === 'csv' && <span className="ms-1.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5" title="יובאה מקובץ CSV — לא מתעדכנת לבד">CSV</span>}</td>
                    <td className="px-4 py-3 font-bold whitespace-nowrap">{fmtMoney(i.amount, i.currency)}</td>
                    <td className="px-4 py-3 num">{fmtDate(i.dueAt)}</td>
                    <td className="px-4 py-3 whitespace-nowrap"><LateBadge days={d} /></td>
                    <td className="px-4 py-3"><StatusBadge status={i.status} /></td>
                    <td className="px-4 py-3 text-xs text-ink-500 whitespace-nowrap">
                      {last && i.lastSent?.unknown ? <span data-testid="sent-cell" className="text-amber-700 font-bold" title="השליחה האחרונה נקטעה באמצע. בדקו ביומן היוצאים לפני שליחה ידנית">{i.reminders.length} · אחרונה: לא ידוע אם יצאה ⚠️</span>
                        : last ? <span data-testid="sent-cell">{i.reminders.length}{last.at && <> · אחרונה {fmtDate(last.at)}</>} {sentChannels(i).map(c => c === 'sms' ? '📱' : '✉️').join('')}</span> : 'טרם נשלחה'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5 justify-end">
                        {(live ? !!pendingOf(i.id) : (i.status === 'open' || i.status === 'reminded') && d > 0) &&
                          <Button size="sm" onClick={() => setOpen(i)} title={STEP_LABEL[nextStep(i)]}>תזכורת</Button>}
                        {anchor && <button type="button" data-testid="in-merged" onClick={() => setOpen(anchor)}
                          title={`החשבונית הזו נכללת בתזכורת אחת יחד עם חשבונית ${anchor.number}. לחיצה פותחת את התזכורת`}
                          className="rounded-full bg-ink-50 border border-ink-200 px-2.5 py-1 text-xs font-medium text-ink-500 hover:bg-ink-200/60 cursor-pointer whitespace-nowrap">בתזכורת מאוחדת</button>}
                        {!live && <Button size="sm" variant="outline" onClick={() => markPaid(i.id)}>שולם</Button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && <tr><td colSpan={8} className="text-center py-12 text-ink-500">לא נמצאו חשבוניות</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
      {open && <MessagePreview invoice={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
