import { useState } from 'react';
import { useApp } from '../store.tsx';
import { agingBuckets, kpis } from '../lib/stats.ts';
import { AGING_LABEL, daysOverdue, fmtIls, ratioHalfUp, type Aging } from '../lib/format.ts';
import { STEP_LABEL, nextStep } from '../lib/message.ts';
import { demoCollectedByMonth } from '../data/demo.ts';
import { Button, Card, LateBadge } from '../components/ui.tsx';
import { MessagePreview } from '../components/MessagePreview.tsx';
import type { Invoice } from '../lib/domain.ts';
import { api, BLOCK_LABEL, blockKind, REAPPROVE_LABEL } from '../api.ts';
import { mockAmountCheck } from '../lib/policy.ts';
import { areaPath, cumulative, toBars, type Bar } from '../lib/series.ts';

const AGING_COLOR: Record<Aging, string> = { notDue: 'bg-ink-400', d0_30: 'bg-due', d31_60: 'bg-late', d61_90: 'bg-red-500', d90p: 'bg-red-700' };

export function Dashboard() {
  const { invoices, today, customerOf, business, queue, mode, totals, pendingOf, series } = useApp();
  const live = mode === 'live';
  const k = kpis(invoices, today);
  const aging = agingBuckets(invoices, today);
  const agingTotal = Object.values(aging).reduce((a, b) => a + b, 0) || 1;
  const t = live ? totals : null;
  // מוק: נגבה לפי חודש מנתוני הדמו; חי: גבייה שבועית מהשרת (closed_at)
  const bars: Bar[] = live && series ? toBars(series) : demoCollectedByMonth.map(m => ({ label: m.month, value: m.amount, count: 0 }));
  const collected = t?.collected_agorot != null ? t.collected_agorot / 100 : demoCollectedByMonth.reduce((a, m) => a + m.amount, 0);
  // מוק: באגורות שלמות ובאותו עיגול כמו השרת (ratio_half_up) — 24.90 ₪ בשקלים צפים היה נותן 12.4999…
  const collectedAg = Math.round(collected * 100);
  const recovery = t?.recovery_rate_pct ?? ratioHalfUp(collectedAg, collectedAg + Math.round(k.openTotal * 100), 100);
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

      {live && (totals?.csv_unverified ?? 0) > 0 && (
        <div role="status" data-testid="csv-unverified" className="rounded-2xl border border-amber-300 bg-amber-50 text-amber-900 p-4 flex flex-wrap items-center gap-3">
          <span aria-hidden className="text-xl">⚠️</span>
          <span className="flex-1 min-w-0"><b className="num">{totals!.csv_unverified}</b> {totals!.csv_unverified === 1 ? 'חשבונית מקובץ CSV לא הופיעה' : 'חשבוניות מקובץ CSV לא הופיעו'} בייבוא האחרון — ייתכן שכבר שולמו.
            תזכורות עליהן לא יישלחו עד שתאשרו שוב שהסכום עדיין פתוח, או תייבאו קובץ מעודכן.</span>
          <a href="#/settings" className="font-bold underline whitespace-nowrap">ייבוא קובץ מעודכן ←</a>
        </div>
      )}
      <section aria-label="מדדי גבייה" className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4" data-testid="kpis">
        <Kpi hero label="נגבה" value={fmtIls(collected)} sub={live ? `${totals?.closed_invoices ?? 0} חשבוניות שולמו` : 'יוני–נובמבר'} tone="good" />
        <Kpi hero label="שיעור החזר" value={`${recovery}%`} sub="מסך החוב" tone="good" meter={recovery} />
        <Kpi label="פתוח לגבייה" value={fmtIls(k.openTotal)} sub={`${k.openCount} חשבוניות`} />
        <Kpi label="באיחור" value={fmtIls(k.overdueTotal)} sub={`${k.overdueCount} חשבוניות`} tone="late" />
        <Kpi label="ממוצע ימי איחור" value={String(t?.avg_days_overdue ?? k.avgDaysLate)} sub="ימים" />
        <Kpi label="בסיכון (60+ יום)" value={fmtIls((t?.at_risk_agorot ?? 0) / 100 || agingTotalRisk(aging))} sub="דורש תשומת לב" tone="late" />
        <Kpi label="תזכורות שיצאו" value={String(t?.reminders_sent ?? invoices.reduce((a, i) => a + i.reminders.length, 0))}
          sub={live && totals ? `${totals.sent_sms} SMS · ${totals.sent_email} מיילים · dry-run` : 'SMS ומייל'} />
        <Kpi label="שיעור מענה" value={`${t?.reply_rate_pct ?? 0}%`} sub={live ? `${t?.customers_messaged ?? 0} לקוחות קיבלו הודעה` : 'לקוחות שהשיבו'} />
      </section>

      <CollectionChart bars={bars} live={live} cum={cumulative(bars)} />

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
                      {live && blockKind(pendingOf(i.id)?.block) === 'hard' && <span className="text-critical font-bold"> · ⛔ {BLOCK_LABEL[pendingOf(i.id)!.block!] ?? pendingOf(i.id)!.block}</span>}
                      {live && blockKind(pendingOf(i.id)?.block) === 'reapprove' && <span className="text-amber-700 font-bold"> · ⏳ {REAPPROVE_LABEL[pendingOf(i.id)!.block!]}</span>}
                      {!live && mockAmountCheck(i, invoices).length > 0 && <span className="text-amber-700 font-bold" data-testid="mock-amount-check"> · ⏳ {REAPPROVE_LABEL.amount_check}</span>}</div>
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
          {live && <><NeedsYou /><Outbox /><ReplySim /></>}
        </div>
      </div>
      {open && <MessagePreview invoice={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

const agingTotalRisk = (a: Record<Aging, number>) => a.d61_90 + a.d90p;

function Kpi({ label, value, sub, tone, hero, meter }: { label: string; value: string; sub: string; tone?: 'late' | 'good'; hero?: boolean; meter?: number }) {
  if (hero) return (
    <div className="rounded-2xl bg-ink-900 text-white p-4 md:p-5 shadow-card">
      <div className="text-sm text-ink-400">{label}</div>
      <div className="text-2xl md:text-4xl font-extrabold font-display mt-1 text-brand num">{value}</div>
      <div className="text-xs text-ink-400 mt-1">{sub}</div>
      {meter != null && <div className="mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden" role="meter" aria-valuenow={meter} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div className="h-full bg-brand rounded-full" style={{ width: `${Math.min(100, meter)}%` }} /></div>}
    </div>
  );
  return (
    <Card className="p-4">
      <div className="text-sm text-ink-500">{label}</div>
      <div className={`text-xl md:text-3xl font-extrabold font-display mt-1 num ${tone === 'late' ? 'text-late' : tone === 'good' ? 'text-brand-700' : ''}`}>{value}</div>
      <div className="text-xs text-ink-500 mt-0.5">{sub}</div>
    </Card>
  );
}

/** גרף גבייה: עמודות לכל תקופה + שטח מצטבר. SVG טהור, בלי ספרייה. RTL — הכי חדש משמאל. */
function CollectionChart({ bars, cum, live }: { bars: Bar[]; cum: number[]; live: boolean }) {
  const W = 600, H = 160;
  const max = Math.max(...bars.map(b => b.value), 1);
  const total = cum.at(-1) ?? 0;
  const bw = W / Math.max(bars.length, 1);
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-extrabold">גרף גבייה <span className="text-sm font-medium text-ink-500">{live ? '· לפי שבוע, 8 שבועות' : '· לפי חודש (דמו)'}</span></h2>
        <div className="text-sm text-ink-500">סה״כ <b className="text-brand-700 num">{fmtIls(total)}</b></div>
      </div>
      <svg viewBox={`0 0 ${W} ${H + 24}`} className="w-full h-auto mt-3" role="img" aria-label={`גבייה מצטברת ${fmtIls(total)}`} data-testid="collection-chart">
        <defs><linearGradient id="g" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#10B981" stopOpacity=".28" /><stop offset="1" stopColor="#10B981" stopOpacity="0" /></linearGradient></defs>
        <path d={areaPath(cum, W, H, bw / 2)} fill="url(#g)" />
        {bars.map((b, i) => {
          const h = (b.value / max) * (H - 8);
          const x = W - (i + 1) * bw + bw * 0.22;
          return (
            <g key={b.label}>
              <rect x={x} y={H - h} width={bw * 0.56} height={Math.max(h, b.value ? 2 : 0)} rx="6" fill={i === bars.length - 1 ? '#10B981' : '#0F172A'} opacity={i === bars.length - 1 ? 1 : 0.85}>
                <title>{`${b.label}: ${fmtIls(b.value)}`}</title>
              </rect>
              <text x={x + bw * 0.28} y={H + 18} textAnchor="middle" fontSize="12" fill="#64748B">{b.label}</text>
            </g>
          );
        })}
        <line x1="0" x2={W} y1={H} y2={H} stroke="#E2E8F0" />
      </svg>
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
            setRes(`${r.owner_summary ?? INTENT_LABEL[r.intent] ?? r.intent}${r.auto_reply ? ` · מענה אוטומטי: "${r.auto_reply}"` : ''}${r.draft_id ? ' · טיוטת מענה ממתינה לאישורך ב«תשובות לקוחות»' : ''}`);
            await reload();
          } catch (e) { showToast(`שגיאה: ${(e as Error).message}`); }
        }}>שלח תשובה (סימולציה)</Button>
        {res && <p className="text-sm rounded-lg bg-brand-50 text-brand-700 p-2.5" data-testid="reply-result">{res}</p>}
      </div>
    </Card>
  );
}

// סיבת השהיה = כוונת מנוע השיחה (app/conversation.py Intent), אפשר עם ':until=YYYY-MM-DD'. לעולם לא מציגים קוד גולמי.
const PAUSE_LABEL: Record<string, string> = {
  paid_claim: 'כתב/ה ששילם/ה. בדקו בחשבון ואז חדשו', promise: 'הבטיח/ה לשלם', plan_request: 'ביקש/ה פריסה. ממתין להצעה שלכם',
  plan_accept: 'הסכים/ה להצעת הפריסה', plan_reject: 'דחה/תה את הצעת הפריסה', cant_pay: 'כתב/ה שאין אפשרות לשלם כרגע',
  dispute: 'יש מחלוקת על החשבונית', legal: 'הוזכר עניין משפטי', distress: 'נראה שהלקוח/ה במצוקה. כדאי לפנות אישית',
  callback: 'ביקש/ה שתחזרו אליו/ה', wrong_person: 'כתב/ה שזה לא המספר הנכון', abusive: 'תגובה פוגענית. כדאי לטפל אישית',
  credit_review: 'יש זיכוי שלא שויך לחשבונית. בדקו במערכת החשבוניות ואז חדשו',
};
export function pauseLabel(reason: string): string {
  const [base, until] = reason.split(':until=');
  const txt = PAUSE_LABEL[base] ?? 'מושהה עד שתבדקו';
  return until ? `${txt} · עד ${until.split('-').reverse().join('.')}` : txt;
}
/** "דורש טיפול": לקוחות מושהים (חידוש בלחיצה כפולה) + הצעות פריסה שממתינות לאישורך. */
function NeedsYou() {
  const { customers, invoices, plans, notices, reload, showToast } = useApp();
  const [armed, setArmed] = useState<string | null>(null);
  const [planConfirm, setPlanConfirm] = useState<Record<number, boolean>>({});   // critic סבב 49: סכום חריג
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
  if (!paused.length && !proposed.length && !notices.length) return null;
  return (
    <Card className="p-5 border-amber-200" >
      <h2 className="text-lg font-extrabold mb-1">דורש טיפול שלך</h2>
      <p className="text-xs text-ink-500 mb-3">גבי עצר כאן ומחכה להחלטה שלך. אישור = לחיצה כפולה.</p>
      <ul className="space-y-2.5" data-testid="needs-you">
        {notices.map(n => (
          <li key={`n${n.id}`} className={`rounded-lg p-3 text-sm ${n.tone === 'warn' ? 'bg-amber-50' : 'bg-ink-50'}`} data-testid="notice" data-intent={n.intent}>
            <div className="font-bold"><span aria-hidden>{n.icon}</span> {n.title}</div>
            <div className="text-ink-700 text-xs mt-0.5">{n.body}</div>
            <Button size="sm" variant={armed === `n${n.id}` ? 'dark' : 'outline'} className="mt-2" data-testid="notice-done"
              onClick={() => act(`n${n.id}`, () => api.ownerDone(n.id), 'סומן כטופל')}>
              {armed === `n${n.id}` ? 'לחצו שוב לאישור' : '✓ טופל'}</Button>
          </li>
        ))}
        {paused.map(c => (
          <li key={`c${c.backendId}`} className="rounded-lg bg-amber-50 p-3 text-sm">
            <div className="font-bold"><span aria-hidden>⏸️</span> {c.name}</div>
            <div className="text-ink-700 text-xs mt-0.5">{pauseLabel(c.paused!)}</div>
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
              {(p.amount_check?.length ?? 0) > 0 && (
                <label className="mt-2 flex items-start gap-2 text-xs rounded-lg bg-red-50 text-red-900 px-2 py-1.5" data-testid="plan-confirm-amount">
                  <input type="checkbox" className="h-5 w-5 mt-0.5 accent-[#10B981]" checked={!!planConfirm[p.id]}
                    onChange={e => setPlanConfirm(s => ({ ...s, [p.id]: e.target.checked }))} />
                  <span><b>הסכום נכון — בדקתי.</b> {p.amount_check!.map(o => `חשבונית ${o.number || '(ללא מספר)'}: ${fmtIls(o.amount_agorot / 100)} (בדרך כלל ${fmtIls(o.usual_agorot / 100)})`).join(' · ')}. אולי הנקודה העשרונית במקום הלא נכון?</span>
                </label>
              )}
              <Button size="sm" variant={armed === `p${p.id}` ? 'dark' : 'primary'} className="mt-2"
                disabled={(p.amount_check?.length ?? 0) > 0 && !planConfirm[p.id]}
                onClick={() => act(`p${p.id}`, () => api.approvePlan(p.id, planConfirm[p.id] ?? false), 'ההצעה אושרה ונשלחה ללקוח (dry-run)')}>
                {armed === `p${p.id}` ? 'לחצו שוב לאישור' : '✓ אישור ההצעה'}
              </Button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
