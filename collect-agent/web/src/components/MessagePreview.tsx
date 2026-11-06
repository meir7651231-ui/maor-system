import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../store.tsx';
import type { Channel, Invoice, Step } from '../lib/domain.ts';
import { STEP_LABEL, STEP_ORDER, buildEmail, buildSms, nextStep, requiresApproval, smsSegments } from '../lib/message.ts';
import { fmtWhen, nextAllowed } from '../lib/policy.ts';
import { daysOverdue, fmtIls, fmtPhone } from '../lib/format.ts';
import { Button, LateBadge } from './ui.tsx';
import { LogoMark } from './Logo.tsx';

/** תצוגה מקדימה של התזכורת בדיוק כפי שתישלח — SMS ומייל — עם "אשר ושלח". */
export function MessagePreview({ invoice, onClose, now = new Date() }: { invoice: Invoice; onClose: () => void; now?: Date }) {
  const { business, customerOf, approveAndSend, today } = useApp();
  const c = customerOf(invoice.customerId);
  const [step, setStep] = useState<Step>(nextStep(invoice));
  const [tab, setTab] = useState<Channel>(c.phone && business.channels.sms ? 'sms' : 'email');
  const [on, setOn] = useState<Record<Channel, boolean>>({ sms: !!c.phone && business.channels.sms, email: !!c.email && business.channels.email });
  const [smsText, setSmsText] = useState('');
  useEffect(() => setSmsText(buildSms(invoice, c, business, step)), [invoice, c, business, step]);
  const email = useMemo(() => buildEmail(invoice, c, business, step), [invoice, c, business, step]);
  const seg = smsSegments(smsText);
  const when = nextAllowed(now);
  const sendable = (on.sms || on.email) && !c.optedOut;
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
              <legend className="text-sm font-bold mb-2">שלב בסולם</legend>
              <div className="grid grid-cols-2 gap-2">
                {STEP_ORDER.map(s => (
                  <button key={s} onClick={() => setStep(s)} aria-pressed={step === s}
                    className={`rounded-xl border px-3 py-2 text-sm font-medium text-right cursor-pointer ${step === s ? 'border-brand bg-brand-50 text-brand-700 ring-1 ring-brand' : 'border-ink-200 hover:bg-ink-50'}`}>
                    {STEP_LABEL[s]}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="text-sm font-bold mb-2">ערוצים</legend>
              {([['sms', 'SMS', c.phone ? fmtPhone(c.phone) : 'אין טלפון'], ['email', 'מייל', c.email ?? 'אין מייל']] as const).map(([ch, label, to]) => {
                const has = ch === 'sms' ? !!c.phone : !!c.email;
                return (
                  <label key={ch} className={`flex items-center gap-3 rounded-xl border border-ink-200 px-3 py-2.5 mb-2 ${has ? 'cursor-pointer' : 'opacity-50'}`}>
                    <input type="checkbox" className="h-5 w-5 accent-[#10B981]" disabled={!has} checked={on[ch]} onChange={e => setOn({ ...on, [ch]: e.target.checked })} />
                    <span className="font-bold">{label}</span><span className="text-sm text-ink-500 ms-auto num">{to}</span>
                  </label>
                );
              })}
            </fieldset>
            <div className="rounded-xl bg-ink-50 p-3 text-sm space-y-1.5">
              <div>🕘 <b>יישלח:</b> {+when === +now ? 'מיד עם האישור' : fmtWhen(when)} <span className="text-ink-500">(א׳–ה׳ 9–19, ו׳ 9–12, לא בשבת/חג)</span></div>
              <div>🔗 <b>קישור תשלום:</b> <span className="num text-info">{invoice.payUrl}</span></div>
              <div>🛑 כולל קישור הסרה · מזהה את העסק · ללא תוכן שיווקי (סעיף 30א)</div>
              {requiresApproval(step, business, invoice.reminders.length === 0) && <div className="text-amber-700">✋ שלב זה דורש את אישורך</div>}
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
                    <div className="mx-auto h-9 w-9 rounded-full bg-ink-200 grid place-items-center text-sm font-bold">{business.smsSender.slice(0, 1)}</div>
                    <div className="text-xs font-bold mt-1 num">{business.smsSender}</div>
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
                  <textarea value={smsText} onChange={e => setSmsText(e.target.value)} rows={4}
                    className="mt-1 w-full rounded-xl border border-ink-200 p-3 text-sm focus:border-brand focus:ring-2 focus:ring-brand/30 outline-none" />
                </label>
                <div className={`text-xs mt-1 ${seg.segments > 3 ? 'text-critical font-bold' : 'text-ink-500'}`}>
                  <span className="num">{seg.chars}</span> תווים · <span className="num">{seg.segments}</span> מקטעי SMS {seg.unicode && '(עברית: 70/67 תווים למקטע)'}
                  {!smsText.includes(invoice.payUrl) && <span className="text-critical font-bold"> · ⚠️ חסר קישור תשלום</span>}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-ink-200 overflow-hidden shadow-card text-[14px]">
                <div className="bg-ink-50 px-4 py-2.5 border-b border-ink-200 text-xs space-y-0.5">
                  <div><span className="text-ink-500">מאת:</span> {business.name} <span className="num">&lt;{business.email}&gt;</span></div>
                  <div><span className="text-ink-500">אל:</span> <span className="num">{c.email ?? '—'}</span></div>
                  <div className="text-sm font-bold text-ink-900 pt-1">{email.subject}</div>
                </div>
                <div className="bg-ink-100 p-4">
                  <div className="bg-white rounded-xl p-5 max-w-md mx-auto">
                    <div className="flex items-center gap-2 mb-4"><LogoMark size={22} /><span className="font-bold">{business.name}</span></div>
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
          <Button variant="ghost" onClick={onClose}>ביטול</Button>
          <Button disabled={!sendable} onClick={() => { approveAndSend(invoice.id, step, channels); onClose(); }}>
            ✓ אשר ושלח {channels.length === 2 ? 'ב-SMS ובמייל' : channels[0] === 'sms' ? 'ב-SMS' : channels[0] === 'email' ? 'במייל' : ''}
          </Button>
        </footer>
      </div>
    </div>
  );
}

function linkify(t: string) {
  return t.split(/(https?:\/\/\S+)/).map((p, i) => /^https?:\/\//.test(p)
    ? <span key={i} className="text-info underline num">{p}</span> : <span key={i}>{p}</span>);
}
