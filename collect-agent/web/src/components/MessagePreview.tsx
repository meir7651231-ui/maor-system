import { useEffect, useMemo, useRef, useState } from 'react';
import { api, BLOCK_LABEL, type Preview } from '../api.ts';
import { useApp } from '../store.tsx';
import type { Channel, Invoice, Step } from '../lib/domain.ts';
import { STEP_LABEL, STEP_ORDER, buildEmail, buildSms, nextStep, requiresApproval, smsSegments } from '../lib/message.ts';
import { fmtWhen, fmtWhenIL, nextAllowed } from '../lib/policy.ts';
import { daysOverdue, fmtIls, fmtPhone } from '../lib/format.ts';
import { Button, LateBadge } from './ui.tsx';

/** תצוגה מקדימה של התזכורת בדיוק כפי שתישלח — SMS ומייל — עם "אשר ושלח". */
export function MessagePreview({ invoice, onClose, now = new Date() }: { invoice: Invoice; onClose: () => void; now?: Date }) {
  const { business, customerOf, approveAndSend, today, mode, pendingOf, showToast } = useApp();
  const live = mode === 'live';
  const c = customerOf(invoice.customerId);
  const pending = pendingOf(invoice.id);
  const [pv, setPv] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);
  const isCsv = invoice.source === 'csv';
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    if (!live || !pending) return;
    api.preview(pending.reminderId).then(setPv).catch(e => setErr(String(e.message ?? e)));
  }, [live, pending]);
  const [step, setStep] = useState<Step>(nextStep(invoice));
  const [tab, setTab] = useState<Channel>(c.phone && business.channels.sms ? 'sms' : 'email');
  const [on, setOn] = useState<Record<Channel, boolean>>({ sms: !!c.phone && business.channels.sms, email: !!c.email && business.channels.email });
  const [smsText, setSmsText] = useState('');
  const liveSms = pv?.messages.find(m => m.channel === 'sms');
  const liveMail = pv?.messages.find(m => m.channel === 'email');
  useEffect(() => setSmsText(live ? liveSms?.body ?? '' : buildSms(invoice, c, business, step)), [live, liveSms, invoice, c, business, step]);
  const mockEmail = useMemo(() => buildEmail(invoice, c, business, step), [invoice, c, business, step]);
  const email = live && liveMail ? emailFromBackend(liveMail.body, liveMail.request.headers?.Subject ?? '', business.name) : mockEmail;
  const payUrl = live ? firstPayUrl(liveSms?.body ?? liveMail?.body ?? '') : invoice.payUrl;
  const seg = smsSegments(smsText);
  // שכבת הספקים (app/integrations): 019 ב-XML (fixture תאימות, חוזה לא מאומת) ⇒ <source>; JSON נתמך גם הוא
  const liveReq = (liveSms?.request as { body?: unknown } | undefined)?.body;
  const liveSource = typeof liveReq === 'string'
    ? /<source>([^<]+)<\/source>/.exec(liveReq)?.[1]
    : (liveReq as { sms?: { source?: string } } | undefined)?.sms?.source;
  const smsSender = (live && liveSource) || business.smsSender;
  const when = nextAllowed(now);
  const block = live ? pv?.block_reason ?? pending?.block ?? null : null;
  const sendable = live ? !!pv && !block && !busy : (on.sms || on.email) && !c.optedOut;
  useEffect(() => {
    if (live && pv) { setOn({ sms: !!liveSms, email: !!liveMail }); setTab(liveSms ? 'sms' : 'email'); if (pv.template_key) setStep(pv.template_key); }
  }, [live, pv, liveSms, liveMail]);
  const dialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    dialog.current?.focus();
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    addEventListener('keydown', k);
    return () => removeEventListener('keydown', k);
  }, [onClose]);

  const channels = (['sms', 'email'] as Channel[]).filter(ch => on[ch]);
  return (
    <div className="fixed inset-0 z-40 bg-ink-900/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6" onClick={onClose}>
      <div ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="mp-title" onClick={e => e.stopPropagation()}
        className="bg-white w-full md:max-w-4xl max-h-[94vh] overflow-y-auto rounded-t-2xl md:rounded-2xl shadow-pop outline-none">
        <header className="flex items-start justify-between gap-4 p-5 border-b border-ink-200">
          <div>
            <h2 id="mp-title" className="text-xl font-extrabold">תזכורת ל{c.name}</h2>
            <p className="text-sm text-ink-500 mt-1">חשבונית <span className="num">{invoice.number}</span> · <b className="text-ink-900">{fmtIls(invoice.amount)}</b> · <LateBadge days={daysOverdue(invoice.dueAt, today)} /></p>
          </div>
          <button onClick={onClose} aria-label="סגירה" className="h-9 w-9 rounded-lg hover:bg-ink-100 text-xl cursor-pointer">✕</button>
        </header>

        <div className="grid md:grid-cols-[1fr_1.1fr] gap-6 p-5">
          {/* צד שליטה */}
          <div className="space-y-5">
            <fieldset>
              <legend className="text-sm font-bold mb-2">שלב בסולם {live && <span className="font-normal text-ink-500">(נקבע ע״י גבי לפי הסולם)</span>}</legend>
              <div className="grid grid-cols-2 gap-2">
                {STEP_ORDER.map(s => (
                  <button key={s} onClick={() => setStep(s)} aria-pressed={step === s} disabled={live && step !== s}
                    className={`rounded-xl border px-3 py-2 text-sm font-medium text-right cursor-pointer ${step === s ? 'border-brand bg-brand-50 text-brand-700 ring-1 ring-brand' : 'border-ink-200 hover:bg-ink-50'}`}>
                    {STEP_LABEL[s]}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="text-sm font-bold mb-2">ערוצים</legend>
              {([['sms', 'SMS', c.phone ? fmtPhone(c.phone) : 'אין טלפון'], ['email', 'מייל', c.email ?? 'אין מייל']] as const).map(([ch, label, to]) => {
                const has = live ? !!pv?.messages.some(m => m.channel === ch) : ch === 'sms' ? !!c.phone : !!c.email;
                return (
                  <label key={ch} className={`flex items-center gap-3 rounded-xl border border-ink-200 px-3 py-2.5 mb-2 ${has ? 'cursor-pointer' : 'opacity-50'}`}>
                    <input type="checkbox" className="h-5 w-5 accent-[#10B981]" disabled={!has || live} checked={on[ch]} onChange={e => setOn({ ...on, [ch]: e.target.checked })} />
                    <span className="font-bold">{label}</span><span className="text-sm text-ink-500 ms-auto num">{to}</span>
                  </label>
                );
              })}
            </fieldset>
            <div className="rounded-xl bg-ink-50 p-3 text-sm space-y-1.5">
              <div>🕘 <b>יישלח:</b> {live && pv ? fmtWhenIL(pv.scheduled_for) : +when === +now ? 'מיד עם האישור' : fmtWhen(when)} <span className="text-ink-500">(א׳–ה׳ 8–20, ו׳ עד 12, לא בשבת/חג)</span></div>
              <div>🔗 <b>קישור תשלום:</b> <span className="num text-info break-all">{payUrl || '—'}</span></div>
              {live && <div>🧪 <b>מצב:</b> dry-run · ספק {liveSms?.provider ?? business.smsProvider} · שום הודעה לא יוצאת באמת</div>}
              <div>🛑 כולל קישור הסרה · מזהה את העסק · ללא תוכן שיווקי (סעיף 30א)</div>
              {(live || requiresApproval(step, business, invoice.reminders.length === 0)) && <div className="text-amber-700">✋ שלב זה דורש את אישורך</div>}
              {block && <div className="text-critical font-bold">⛔ חסום: {BLOCK_LABEL[block] ?? block}</div>}
              {err && <div className="text-critical">שגיאה: {err}</div>}
              {live && !pv && !err && <div className="text-ink-500">טוען תצוגה מקדימה מהשרת…</div>}
            </div>
          </div>

          {/* צד תצוגה */}
          <div>
            <div role="tablist" className="flex gap-1 bg-ink-100 rounded-xl p-1 mb-3">
              {(['sms', 'email'] as Channel[]).map(ch => (
                <button key={ch} role="tab" aria-selected={tab === ch} onClick={() => setTab(ch)}
                  className={`flex-1 rounded-lg py-2 text-sm font-bold cursor-pointer ${tab === ch ? 'bg-white shadow-sm' : 'text-ink-500'}`}>
                  {ch === 'sms' ? '📱 SMS' : '✉️ מייל'}
                </button>
              ))}
            </div>
            {tab === 'sms' ? (
              <div>
                <div className="mx-auto max-w-[320px] rounded-[2rem] border-[10px] border-ink-900 bg-ink-100 overflow-hidden shadow-card">
                  <div className="bg-white px-4 py-3 text-center border-b border-ink-200">
                    <div className="mx-auto h-9 w-9 rounded-full bg-ink-200 grid place-items-center text-sm font-bold">{smsSender.slice(0, 1)}</div>
                    <div className="text-xs font-bold mt-1 num">{smsSender}</div>
                  </div>
                  <div className="p-3 min-h-56">
                    <div className="text-[10px] text-center text-ink-500 mb-2">הודעת טקסט · היום</div>
                    <div className="bg-white rounded-2xl rounded-tr-md px-3.5 py-2.5 text-[14px] leading-relaxed shadow-sm whitespace-pre-wrap break-words max-w-[92%]">
                      {linkify(smsText)}
                    </div>
                  </div>
                </div>
                <label className="block mt-3">
                  <span className="text-sm font-bold">עריכת הנוסח</span>
                  <textarea value={smsText} onChange={e => setSmsText(e.target.value)} rows={4} readOnly={live} title={live ? 'בחי: הנוסח מגיע מהשרת (templates.py). עריכה — בשלב הבא' : undefined}
                    className="mt-1 w-full rounded-xl border border-ink-200 p-3 text-sm focus:border-brand focus:ring-2 focus:ring-brand/30 outline-none" />
                </label>
                <div className={`text-xs mt-1 ${seg.segments > 3 ? 'text-critical font-bold' : 'text-ink-500'}`}>
                  <span className="num">{seg.chars}</span> תווים · <span className="num">{seg.segments}</span> מקטעי SMS {seg.unicode && '(עברית: 70/67 תווים למקטע)'}
                  {!!payUrl && !smsText.includes(payUrl) && <span className="text-critical font-bold"> · ⚠️ חסר קישור תשלום</span>}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-ink-200 overflow-hidden shadow-card text-[14px]">
                <div className="bg-ink-50 px-4 py-2.5 border-b border-ink-200 text-xs space-y-0.5">
                  <div><span className="text-ink-500">מאת:</span> {business.name} <span className="num">&lt;{(live && liveMail?.request.headers?.From) || business.email}&gt;</span></div>
                  <div><span className="text-ink-500">אל:</span> <span className="num">{c.email ?? '—'}</span></div>
                  <div className="text-sm font-bold text-ink-900 pt-1">{email.subject}</div>
                </div>
                <div className="bg-ink-100 p-4">
                  <div className="bg-white rounded-xl p-5 max-w-md mx-auto">
                    {/* legal §3.3: בלי לוגו של גבי בהודעה ללקוח — רק זהות העסק */}
                    <div className="flex items-center gap-2 mb-4"><span aria-hidden className="h-6 w-6 rounded-full bg-ink-200 grid place-items-center text-xs font-bold">{business.name.trim().charAt(0)}</span><span className="font-bold">{business.name}</span></div>
                    {email.paragraphs.map((p, i) => <p key={i} className="mb-2.5 leading-relaxed whitespace-pre-line">{linkify(p)}</p>)}
                    <div className="my-4 rounded-lg bg-ink-50 p-3 flex justify-between text-sm">
                      <span>חשבונית <span className="num">{invoice.number}</span></span><b>{fmtIls(invoice.amount)}</b>
                    </div>
                    <a href="#" onClick={e => e.preventDefault()} className="block text-center bg-brand text-ink-900 font-bold rounded-xl py-3">{email.cta} · {fmtIls(invoice.amount)}</a>
                    <p className="text-[11px] text-ink-500 mt-4 leading-relaxed">{email.footer} <span className="text-info underline">להסרה מתזכורות</span></p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <footer className="sticky bottom-0 bg-white border-t border-ink-200 p-4 flex flex-wrap items-center gap-3 justify-end">
          {c.optedOut && <span className="text-critical text-sm font-bold me-auto">הלקוח ביקש הסרה — אין שליחה</span>}
          {live && isCsv && (
            <label className="me-auto flex items-start gap-2 text-sm rounded-xl bg-amber-50 text-amber-900 px-3 py-2 max-w-md" data-testid="confirm-open">
              <input type="checkbox" className="h-5 w-5 mt-0.5 accent-[#10B981]" checked={confirmOpen} onChange={e => setConfirmOpen(e.target.checked)} />
              <span><b>הסכום {fmtIls(invoice.amount)} עדיין פתוח</b> — בדקתי. (חשבונית מקובץ CSV לא מתעדכנת לבד; האישור תקף 24 שעות.)</span>
            </label>
          )}
          <Button variant="ghost" onClick={onClose}>ביטול</Button>
          <Button disabled={!sendable || (live && isCsv && !confirmOpen)} onClick={async () => {
            setBusy(true);
            try { await approveAndSend(invoice.id, step, channels, { confirmOpen }); onClose(); }
            catch (e) { showToast(`לא אושר: ${(e as Error).message}`); setBusy(false); }
          }}>
            ✓ אשר ושלח {channels.length === 2 ? 'ב-SMS ובמייל' : channels[0] === 'sms' ? 'ב-SMS' : channels[0] === 'email' ? 'במייל' : ''}
          </Button>
        </footer>
      </div>
    </div>
  );
}

/** הקישור הראשון שאינו קישור הסרה = קישור התשלום. */
function firstPayUrl(t: string): string {
  return (t.match(/https?:\/\/\S+/g) ?? []).find(u => !/\/u\//.test(u)) ?? '';
}
/** גוף המייל מהשרת (טקסט) ⇒ אותו מבנה תצוגה כמו במוק. */
function emailFromBackend(body: string, subject: string, biz: string) {
  const [main, unsubPart = ''] = body.split('\n\nלהסרה מתזכורות: ');
  return { subject, paragraphs: main.split('\n\n'), cta: 'לתשלום', footer: `הודעה אוטומטית מטעם ${biz}.`, unsub: unsubPart.trim() };
}

function linkify(t: string) {
  return t.split(/(https?:\/\/\S+)/).map((p, i) => /^https?:\/\//.test(p)
    ? <span key={i} className="text-info underline num">{p}</span> : <span key={i}>{p}</span>);
}
