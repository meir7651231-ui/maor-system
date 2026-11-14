import { Fragment, useMemo, useState } from 'react';
import { useApp } from '../store.tsx';
import { daysOverdue, fmtDate, fmtMoney, fmtTotal } from '../lib/format.ts';
import { STEP_LABEL, nextStep } from '../lib/message.ts';
import { byAmountDesc, hasOpenDrift, hasPausedCustomer, isOpen, sentChannels } from '../lib/stats.ts';
import type { Invoice, InvoiceStatus } from '../lib/domain.ts';
import { Button, Card, LateBadge, StatusBadge, inputCls } from '../components/ui.tsx';
import { DRIFT_LABEL, driftText } from '../api.ts';
import { MessagePreview } from '../components/MessagePreview.tsx';
import { hashParam } from '../router.ts';
import { found } from '../lib/search.ts';

type Sort = 'late' | 'amount' | 'name';
type Filter = InvoiceStatus | 'all' | 'drift' | 'paused';
const FILTERS: [InvoiceStatus | 'all', string][] = [['all', 'הכול'], ['open', 'פתוחות'], ['reminded', 'נשלחה תזכורת'], ['promised', 'הבטיח'], ['disputed', 'במחלוקת']];

export function Invoices() {
  const { invoices, today, customerOf, markPaid, mode, pendingOf, mergedAnchorOf } = useApp();
  const live = mode === 'live';
  const [q, setQ] = useState('');
  // הפעלה 164: «ועוד N» ממסך הסקירה מגיע עם #/invoices?f=drift ⇒ מסונן לתזכורות שהסכום שלהן השתנה (חי בלבד)
  // הפעלה 174: גם #/invoices?f=paused ⇒ מסונן ללקוחות מושהים
  const [f, setF] = useState<Filter>(() => { const h = live ? hashParam(location.hash, 'f') : null; return h === 'drift' || h === 'paused' ? h : 'all'; });
  const driftCount = live ? invoices.filter(hasOpenDrift).length : 0;
  // הפעלה 174: «מושהים (N)» — חשבוניות פתוחות של לקוחות שהתזכורות אליהם מושהות (חי בלבד; בדמו אין השהיה)
  const isPaused = (i: Invoice) => hasPausedCustomer(i, customerOf);
  const pausedCount = live ? invoices.filter(isPaused).length : 0;
  const chips: [Filter, string][] = [...FILTERS,
    ...(live && (driftCount > 0 || f === 'drift') ? [['drift', `הסכום השתנה (${driftCount})`] as [Filter, string]] : []),
    ...(live && (pausedCount > 0 || f === 'paused') ? [['paused', `מושהים (${pausedCount})`] as [Filter, string]] : [])];
  const [sort, setSort] = useState<Sort>('late');
  const [open, setOpen] = useState<Invoice | null>(null);
  const rows = useMemo(() => {
    const t = q.trim();
    return invoices.filter(isOpen)
      .filter(i => f === 'all' || (f === 'drift' ? hasOpenDrift(i) : f === 'paused' ? isPaused(i) : i.status === f))
      // הפעלה 171: אותם כללים כמו /ui (lib/search.ts) — גם טלפון, ספרות בלי מקפים, בלי ניקוד/רישיות
      .filter(i => { if (!t) return true; const c = customerOf(i.customerId); return found(t, c.name, i.number, c.phone); })
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
      {/* הפעלה 185: במובייל (<640) החיפוש ברוחב מלא כמו המיון, והצ׳יפים 40px+ גובה (יעד-לחיצה) */}
      <div className="flex flex-wrap gap-3 items-center">
        <input className={`${inputCls} sm:max-w-xs`} type="search" placeholder="חיפוש לפי שם, מס׳ חשבונית או טלפון" value={q} onChange={e => setQ(e.target.value)} aria-label="חיפוש בחשבוניות" data-testid="inv-find" autoComplete="off" />
        <div className="flex flex-wrap gap-1.5">
          {chips.map(([k, l]) => (
            <button key={k} onClick={() => setF(k)} aria-pressed={f === k} {...(k === 'drift' || k === 'paused' ? { 'data-testid': `filter-${k}` } : {})}
              className={`inline-flex min-h-10 items-center rounded-full px-3.5 py-1.5 text-sm font-medium cursor-pointer ${f === k ? 'bg-ink-900 text-white' : 'bg-white border border-ink-200 hover:bg-ink-50'}`}>{l}</button>
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
                  <Fragment key={i.id}>
                  <tr className="hover:bg-ink-50/60">
                    <td className="px-4 py-3"><div className="font-bold">{c.name}</div>{i.note && <div className="text-xs text-ink-500">📝 {i.note}</div>}</td>
                    <td className="px-4 py-3"><span className="num">{i.number}</span>{i.source === 'csv' && <span className="ms-1.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5" title="יובאה מקובץ CSV — לא מתעדכנת לבד">CSV</span>}</td>
                    <td className="px-4 py-3 font-bold whitespace-nowrap">{fmtMoney(i.amount, i.currency)}</td>
                    <td className="px-4 py-3 num">{fmtDate(i.dueAt)}</td>
                    <td className="px-4 py-3 whitespace-nowrap"><LateBadge days={d} /></td>
                    <td className="px-4 py-3"><StatusBadge status={i.status} />
                      {live && i.amountDrift && <span data-testid="amount-drift-chip" className="mt-1.5 flex w-fit rounded-full bg-amber-50 ring-1 ring-inset ring-amber-200 px-2.5 py-0.5 text-xs font-bold text-amber-800 whitespace-nowrap">{DRIFT_LABEL}</span>}</td>
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
                  {/* הפעלה 160: תזכורת מאושרת שהסכום שלה השתנה במקור. ההסבר בשורה משלו, מתחילת הטבלה: גלוי גם
                      במובייל (עמודת הסטטוס שם מחוץ למסך עד גלילה) ובמגע (אין ריחוף ל-title). */}
                  {live && i.amountDrift && <tr data-testid="amount-drift" className="bg-amber-50/60 border-t-0">
                    <td colSpan={8} className="px-4 pb-3 pt-0 text-xs text-amber-900">
                      <p className="max-w-[min(42rem,calc(100vw-4rem))] leading-snug">⚠️ <b>חשבונית <span className="num">{i.number}</span>:</b> {driftText(i.amountDrift)}</p>
                      {/* הפעלה 163: פותח את הנוסח שאושר, לקריאה בלבד */}
                      {i.amountDrift.reminderId && <button type="button" data-testid="drift-open" onClick={() => setOpen(i)}
                        className="mt-1.5 min-h-9 rounded-lg bg-white ring-1 ring-inset ring-amber-300 px-3 py-1 text-xs font-bold text-amber-900 hover:bg-amber-100 cursor-pointer">הנוסח שאושר</button>}
                    </td>
                  </tr>}
                  </Fragment>
                );
              })}
              {rows.length === 0 && <tr><td colSpan={8} className="text-center py-12 text-ink-500" data-testid="inv-empty">{q.trim()
                ? <>לא נמצאו חשבוניות עבור «{q.trim()}». <button type="button" onClick={() => setQ('')} className="font-bold underline cursor-pointer">ניקוי החיפוש</button></>
                : f === 'paused' ? 'אין כרגע לקוחות מושהים' : 'לא נמצאו חשבוניות'}</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
      {open && <MessagePreview invoice={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
