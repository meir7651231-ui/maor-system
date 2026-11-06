import { useState } from 'react';
import { useApp } from '../store.tsx';
import { agingBuckets, kpis } from '../lib/stats.ts';
import { AGING_LABEL, daysOverdue, fmtIls, type Aging } from '../lib/format.ts';
import { STEP_LABEL, nextStep } from '../lib/message.ts';
import { demoCollectedByMonth } from '../data/demo.ts';
import { Button, Card, LateBadge } from '../components/ui.tsx';
import { MessagePreview } from '../components/MessagePreview.tsx';
import type { Invoice } from '../lib/domain.ts';
import { api, BLOCK_LABEL } from '../api.ts';

const AGING_COLOR: Record<Aging, string> = { notDue: 'bg-ink-400', d0_30: 'bg-due', d31_60: 'bg-late', d61_90: 'bg-red-500', d90p: 'bg-red-700' };

export function Dashboard() {
  const { invoices, today, customerOf, business, queue, mode, totals, pendingOf } = useApp();
  const live = mode === 'live';
  const k = kpis(invoices, today);
  const aging = agingBuckets(invoices, today);
  const agingTotal = Object.values(aging).reduce((a, b) => a + b, 0) || 1;
  const max = Math.max(...demoCollectedByMonth.map(m => m.amount));
  const [open, setOpen] = useState<Invoice | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-ink-500 text-sm">בוקר טוב, {business.ownerName} 👋</p>
          <h1 className="text-3xl font-extrabold">יש לך <span className="text-brand-700 num">{queue.length}</span> תזכורות מוכנות לאישור</h1>
        </div>
        <a href="#/invoices"><Button variant="outline">לכל החשבוניות ←</Button></a>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="פתוח לגבייה" value={fmtIls(k.openTotal)} sub={`${k.openCount} חשבוניות`} />
        <Kpi label="באיחור" value={fmtIls(k.overdueTotal)} sub={`${k.overdueCount} חשבוניות`} tone="late" />
        <Kpi label="ממוצע ימי איחור" value={String(k.avgDaysLate)} sub="ימים" />
        {live && totals
          ? <Kpi label="נשלחו (dry-run)" value={String(totals.sent_sms + totals.sent_email)} sub={`${totals.sent_sms} SMS · ${totals.sent_email} מיילים`} tone="good" />
          : <Kpi label="נגבה החודש" value={fmtIls(demoCollectedByMonth.at(-1)!.amount)} sub="מאז 1.11" tone="good" />}
      </div>

      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6 items-start">
        <Card className="p-5">
          <h2 className="text-lg font-extrabold mb-1">תור האישורים של היום</h2>
          <p className="text-sm text-ink-500 mb-4">גבי הכין את ההודעות. תסתכל/י, תאשר/י — והוא שולח בשעות המותרות.</p>
          {queue.length === 0 ? <p className="text-ink-500 py-8 text-center">אין מה לאשר — הכול מטופל ✨</p> : (
            <ul className="divide-y divide-ink-200">
              {queue.map(i => (
                <li key={i.id} className="flex items-center gap-3 py-3">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-brand-50 text-brand-700 grid place-items-center font-bold">{customerOf(i.customerId).name.slice(0, 1)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold truncate">{customerOf(i.customerId).name}</div>
                    <div className="text-sm text-ink-500"><b className="text-ink-900">{fmtIls(i.amount)}</b> · <LateBadge days={daysOverdue(i.dueAt, today)} /> · {STEP_LABEL[nextStep(i)]}
                      {live && pendingOf(i.id)?.block && <span className="text-critical font-bold"> · ⛔ {BLOCK_LABEL[pendingOf(i.id)!.block!] ?? pendingOf(i.id)!.block}</span>}</div>
                  </div>
                  <Button size="sm" onClick={() => setOpen(i)}>תצוגה ואישור</Button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="text-lg font-extrabold mb-3">גיל החוב</h2>
            <div className="flex h-4 rounded-full overflow-hidden bg-ink-100" role="img" aria-label="התפלגות גיל החוב">
              {(Object.keys(aging) as Aging[]).map(a => aging[a] > 0 && <div key={a} className={AGING_COLOR[a]} style={{ width: `${(aging[a] / agingTotal) * 100}%` }} />)}
            </div>
            <ul className="mt-3 space-y-1.5 text-sm">
              {(Object.keys(aging) as Aging[]).map(a => (
                <li key={a} className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${AGING_COLOR[a]}`} />{AGING_LABEL[a]}<b className="ms-auto">{fmtIls(aging[a])}</b></li>
              ))}
            </ul>
          </Card>
          {live ? <><NeedsYou /><Outbox /><ReplySim /></> : <Card className="p-5">
            <h2 className="text-lg font-extrabold mb-3">נגבה לפי חודש</h2>
            <div className="flex items-end gap-2 h-32">
              {demoCollectedByMonth.map(m => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <div className="w-full rounded-t-md bg-brand/80 hover:bg-brand" style={{ height: `${(m.amount / max) * 100}%` }} title={fmtIls(m.amount)} />
                  <span className="text-[11px] text-ink-500">{m.month}</span>
                </div>
              ))}
            </div>
          </Card>}
        </div>
      </div>
      {open && <MessagePreview invoice={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function Kpi({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: 'late' | 'good' }) {
  return (
    <Card className="p-4">
      <div className="text-sm text-ink-500">{label}</div>
      <div className={`text-2xl md:text-3xl font-extrabold font-display mt-1 ${tone === 'late' ? 'text-late' : tone === 'good' ? 'text-brand-700' : ''}`}>{value}</div>
      <div className="text-xs text-ink-500 mt-0.5">{sub}</div>
    </Card>
  );
}

/** יומן היוצאים של השרת — כל מה ש*היה* נשלח (DryRunSender). הוכחה חיה שהזרימה עובדת. */
function Outbox() {
  const { outbox } = useApp();
  const last = [...outbox].reverse().slice(0, 6);
  return (
    <Card className="p-5" >
      <h2 className="text-lg font-extrabold mb-1">יומן יוצאים <span className="text-xs font-bold bg-ink-100 rounded-full px-2 py-0.5 align-middle">dry-run</span></h2>
      <p className="text-xs text-ink-500 mb-3">מה שגבי <b>היה</b> שולח. שום הודעה לא יצאה באמת.</p>
      {last.length === 0 ? <p className="text-sm text-ink-500">עוד לא נשלח דבר.</p> : (
        <ul className="space-y-2" data-testid="outbox">
          {last.map(m => (
            <li key={m.id} className="rounded-lg bg-ink-50 p-2.5 text-xs">
              <div className="flex justify-between font-bold mb-1"><span>{m.channel === 'sms' ? '📱 SMS' : '✉️ מייל'}</span><span className="num text-ink-500">{m.to}</span></div>
              <div className="text-ink-700 line-clamp-2">{m.body}</div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

const INTENT_LABEL: Record<string, string> = {
  paid_claim: 'טוען ששילם ⇒ התזכורות הושהו, עבר אליך לבדיקה', opt_out: 'ביקש הסרה ⇒ לא נפנה אליו יותר',
  how_to_pay: 'שאל איך משלמים ⇒ נשלח קישור תשלום', plan_request: 'ביקש פריסה ⇒ נוצרה הצעה לאישורך',
  dispute: 'מחלוקת ⇒ עצירה והעברה אליך', copy_request: 'ביקש העתק חשבונית ⇒ מענה אוטומטי', thanks: 'תודה ⇒ אין צורך בפעולה', unknown: 'לא ברור ⇒ עבר אליך', unknown_sender: 'שולח לא מוכר ⇒ עבר אליך',
};
/** סימולציה של תשובת לקוח (POST /inbound) — כדי להראות בדמו מה גבי עושה עם תשובות. */
function ReplySim() {
  const { customers, reload, showToast } = useApp();
  const withPhone = customers.filter(c => c.phone);
  const [cid, setCid] = useState(withPhone[0]?.id ?? '');
  const [text, setText] = useState('איך אפשר לשלם?');
  const [res, setRes] = useState<string | null>(null);
  const c = customers.find(x => x.id === cid);
  return (
    <Card className="p-5">
      <h2 className="text-lg font-extrabold mb-1">סימולציה: לקוח עונה</h2>
      <p className="text-xs text-ink-500 mb-3">נכנס לשרת כמו SMS נכנס (dry-run).</p>
      <div className="space-y-2">
        <select className="w-full h-10 rounded-lg border border-ink-200 px-2 bg-white" value={cid} onChange={e => setCid(e.target.value)} aria-label="לקוח">
          {withPhone.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
        </select>
        <div className="flex flex-wrap gap-1.5">
          {['איך אפשר לשלם?', 'שילמתי כבר', 'אפשר ב-3 תשלומים?', 'הסר'].map(t => (
            <button key={t} onClick={() => setText(t)} className={`rounded-full px-2.5 py-1 text-xs border cursor-pointer ${text === t ? 'bg-ink-900 text-white border-ink-900' : 'border-ink-200'}`}>{t}</button>
          ))}
        </div>
        <input className="w-full h-10 rounded-lg border border-ink-200 px-3" value={text} onChange={e => setText(e.target.value)} aria-label="תוכן התשובה" />
        <Button size="sm" className="w-full" disabled={!c?.phone || !text.trim()} onClick={async () => {
          try {
            const r = await api.inbound('sms', c!.phone!, text);
            setRes(`${INTENT_LABEL[r.intent] ?? r.intent}${r.auto_reply ? ` · מענה אוטומטי: "${r.auto_reply}"` : ''}`);
            await reload();
          } catch (e) { showToast(`שגיאה: ${(e as Error).message}`); }
        }}>שלח תשובה (סימולציה)</Button>
        {res && <p className="text-sm rounded-lg bg-brand-50 text-brand-700 p-2.5" data-testid="reply-result">{res}</p>}
      </div>
    </Card>
  );
}

const PAUSE_LABEL: Record<string, string> = { paid_claim: 'כתב/ה ששילם/ה — בדקו בחשבון ואז חדשו' };
/** "דורש טיפול": לקוחות מושהים (חידוש בלחיצה כפולה) + הצעות פריסה שממתינות לאישורך. */
function NeedsYou() {
  const { customers, invoices, plans, reload, showToast } = useApp();
  const [armed, setArmed] = useState<string | null>(null);
  const seen = new Set<number>();
  const paused = customers.filter(c => c.paused && c.backendId != null && !seen.has(c.backendId) && seen.add(c.backendId));
  const proposed = plans.filter(p => p.status === 'proposed');
  const nameOfCustomer = (bid: number) => customers.find(c => c.backendId === bid)?.name ?? `לקוח ${bid}`;
  const numOf = (iid: number) => invoices.find(i => i.id === String(iid))?.number ?? String(iid);
  const act = async (key: string, fn: () => Promise<unknown>, done: string) => {
    if (armed !== key) { setArmed(key); window.setTimeout(() => setArmed(a => a === key ? null : a), 4000); return; }
    setArmed(null);
    try { await fn(); await reload(); showToast(done); } catch (e) { showToast(`לא בוצע: ${(e as Error).message}`); }
  };
  if (!paused.length && !proposed.length) return null;
  return (
    <Card className="p-5 border-amber-200" >
      <h2 className="text-lg font-extrabold mb-1">דורש טיפול שלך</h2>
      <p className="text-xs text-ink-500 mb-3">גבי עצר כאן ומחכה להחלטה שלך. אישור = לחיצה כפולה.</p>
      <ul className="space-y-2.5" data-testid="needs-you">
        {paused.map(c => (
          <li key={`c${c.backendId}`} className="rounded-lg bg-amber-50 p-3 text-sm">
            <div className="font-bold">⏸ {c.name}</div>
            <div className="text-ink-700 text-xs mt-0.5">{PAUSE_LABEL[c.paused!] ?? `מושהה: ${c.paused}`}</div>
            <Button size="sm" variant={armed === `r${c.backendId}` ? 'dark' : 'outline'} className="mt-2"
              onClick={() => act(`r${c.backendId}`, () => api.resume(c.backendId!), `התזכורות ל${c.name} חודשו`)}>
              {armed === `r${c.backendId}` ? 'לחצו שוב לאישור' : '↻ חידוש תזכורות'}
            </Button>
          </li>
        ))}
        {proposed.map(p => {
          const total = p.installments.reduce((s, x) => s + x.amount_agorot, 0) / 100;
          return (
            <li key={`p${p.id}`} className="rounded-lg bg-brand-50 p-3 text-sm">
              <div className="font-bold">💳 הצעת פריסה · {nameOfCustomer(p.customer_id)} · חשבונית <span className="num">{numOf(p.invoice_id)}</span></div>
              <div className="text-xs text-ink-700 mt-0.5">{p.installments.length} תשלומים ללא ריבית · סה״כ {fmtIls(total)}</div>
              <ol className="text-xs text-ink-500 mt-1 space-y-0.5">
                {p.installments.map(x => <li key={x.n}><span className="num">{x.n}. {x.due.split('-').reverse().join('.')}</span> — {fmtIls(x.amount_agorot / 100)}</li>)}
              </ol>
              <Button size="sm" variant={armed === `p${p.id}` ? 'dark' : 'primary'} className="mt-2"
                onClick={() => act(`p${p.id}`, () => api.approvePlan(p.id), 'ההצעה אושרה ונשלחה ללקוח (dry-run)')}>
                {armed === `p${p.id}` ? 'לחצו שוב לאישור' : '✓ אישור ההצעה'}
              </Button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
