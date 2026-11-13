import { useEffect, useMemo, useRef, useState } from 'react';
import { api, BLOCK_LABEL, blockKind, REAPPROVE_LABEL, type Preview } from '../api.ts';
import { failPrefix, staleChangeText, stalePreview } from '../lib/failure.ts';
import { useApp } from '../store.tsx';
import type { Channel, Invoice, Step } from '../lib/domain.ts';
import { STEP_LABEL, STEP_ORDER, buildEmail, demoShortUrl, buildSms, nextStep, requiresApproval, smsSegments } from '../lib/message.ts';
import { fmtWhen, fmtWhenIL, mockAmountCheck, nextAllowed } from '../lib/policy.ts';
import { daysOverdue, fmtMoney, fmtPhone } from '../lib/format.ts';
import { Button, LateBadge } from './ui.tsx';

/** תצוגה מקדימה של התזכורת בדיוק כפי שתישלח — SMS ומייל — עם "אשר ושלח". */
export function MessagePreview({ invoice, onClose, now = new Date() }: { invoice: Invoice; onClose: () => void; now?: Date }) {
  const { business, customerOf, approveAndSend, today, mode, pendingOf, showFail, invoices, reload } = useApp();
  const live = mode === 'live';
  const c = customerOf(invoice.customerId);
  const pending = pendingOf(invoice.id);
  const [pv, setPv] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);
  // הפעלה 135: השרת דורש confirm_open אם יש חשבונית מ-CSV בכל התזכורת, לא רק בעוגן
  const isCsv = pv?.needs_confirm_open ?? invoice.source === 'csv';
  const merged = live && (pv?.invoice_count ?? pending?.count ?? 1) > 1;
  // הפעלה 149: אחרי אישור שנדחה כי הנוסח השתנה, התצוגה נטענת מחדש וכאן ההסבר (מה היה ומה עכשיו)
  const [changed, setChanged] = useState<string | null>(null);
  // אחרי טעינה מחדש הסכום בכותרת מגיע מהשרת (invoice מהרשימה עוד מחזיק את הסכום הישן עד שהרענון מסתיים)
  const total = changed && pv?.total_text ? pv.total_text
    : merged ? pv?.total_text ?? pending?.totalText ?? '' : fmtMoney(invoice.amount, invoice.currency);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAmount, setConfirmAmount] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [tries, setTries] = useState(0);
  useEffect(() => {
    if (!live || !pending) return;
    // הפעלה 158: רק הבקשה האחרונה קובעת (רענון ברקע מחליף את pending ושולח בקשה חדשה; תשובה ישנה שחזרה
    // אחריה דרסה את החדשה), ו«נסו שוב» מנקה את השגיאה.
    let dead = false;
    setErr(null);
    // הפעלה 160: התזכורת הוחלפה באחרת (מזהה חדש) בזמן שהחלון פתוח ⇒ הנוסח הקודם יורד מיד (שלד, בלי כפתור
    // פעיל) עד שהחדש נטען. אותו מזהה (רענון ברקע) ⇒ הנוסח נשאר עד שהתשובה מחליפה אותו, בלי הבהוב.
    setPv(cur => (cur && cur.reminder_id !== pending.reminderId ? null : cur));
    api.preview(pending.reminderId).then(v => { if (!dead) setPv(v); }).catch(e => { if (!dead) setErr(String(e.message ?? e)); });
    return () => { dead = true; };
  }, [live, pending, tries]);
  // הפעלה 158: עד שהנוסח מגיע מהשרת לא מוצג שום דבר שנגזר מהמוק (שלב, מועד, ערוצים, נוסח מייל) — שלד בלבד.
  const loading = live && !!pending && !pv && !err;
  const failed = live && !pv && !!err;
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
  const sendable = live ? !!pv && blockKind(block) !== 'hard' && !busy : (on.sms || on.email) && !c.optedOut;
  const odd = live ? pv?.amount_check ?? [] : mockAmountCheck(invoice, invoices);   // הפעלה 126: גם בהדגמה הסטטית
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
      <div ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="mp-title" aria-busy={loading || undefined} onClick={e => e.stopPropagation()}
        className="bg-white w-full md:max-w-4xl max-h-[94vh] overflow-y-auto rounded-t-2xl md:rounded-2xl shadow-pop outline-none">
        <header className="flex items-start justify-between gap-4 p-5 border-b border-ink-200">
          <div>
            <h2 id="mp-title" className="text-xl font-extrabold">תזכורת ל{c.name}</h2>
            <p className="text-sm text-ink-500 mt-1" data-testid="mp-sub">{merged
              ? <><span className="num">{pv?.invoice_count ?? pending?.count}</span> חשבוניות{pv?.numbers?.length ? <> (<span className="num">{pv.numbers.join(', ')}</span>)</> : null}</>
              : <>חשבונית <span className="num">{invoice.number}</span></>} · <b className="text-ink-900">{total}</b> · <LateBadge days={daysOverdue(invoice.dueAt, today)} /></p>
          </div>
          <button onClick={onClose} aria-label="סגירה" className="h-9 w-9 rounded-lg hover:bg-ink-100 text-xl cursor-pointer">✕</button>
        </header>

        {changed && <div role="alert" data-testid="mp-stale" className="mx-5 mt-4 rounded-xl bg-amber-50 text-amber-900 px-4 py-3 text-sm font-bold">⚠️ {changed}</div>}
        {loading ? <PreviewSkeleton /> : failed ? (
          <div role="alert" data-testid="mp-error" className="p-8 text-center">
            <p className="font-bold text-ink-900">התצוגה המקדימה לא נטענה מהשרת</p>
            <p className="mt-1 text-sm text-ink-500">לא מוצג נוסח, כדי שלא תאשרו הודעה שלא ראיתם. {err}</p>
            <button type="button" data-testid="mp-retry" onClick={() => setTries(n => n + 1)}
              className="mt-4 h-11 px-6 rounded-xl bg-ink-900 text-white font-bold cursor-pointer">נסו שוב</button>
          </div>
        ) : (
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
              {blockKind(block) === 'hard' && <div className="text-critical font-bold">⛔ חסום: {BLOCK_LABEL[block!] ?? block}</div>}
              {blockKind(block) === 'reapprove' && <div className="text-amber-700 font-bold">⏳ {REAPPROVE_LABEL[block!]}</div>}
              {err && <div className="text-critical">שגיאה: {err}</div>}
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
            {live && !(tab === 'sms' ? liveSms : liveMail) ? (
              // הפעלה 158: ערוץ שאין לו הודעה בתזכורת הזו הציג בועה ריקה (SMS) או מייל שנבנה מהמוק ולא יישלח
              <p data-testid="mp-no-channel" className="rounded-xl bg-ink-50 text-ink-500 text-sm text-center px-4 py-10">
                בתזכורת הזו לא יישלח {tab === 'sms' ? 'SMS' : 'מייל'}.
              </p>
            ) : tab === 'sms' ? (
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
                  {!!payUrl && !smsText.includes(live ? payUrl : demoShortUrl(invoice)) && <span className="text-critical font-bold"> · ⚠️ חסר קישור תשלום</span>}
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
                      <span>{merged ? <><span className="num">{pv?.invoice_count ?? pending?.count}</span> חשבוניות</> : <>חשבונית <span className="num">{invoice.number}</span></>}</span><b>{total}</b>
                    </div>
                    <a href="#" onClick={e => e.preventDefault()} className="block text-center bg-brand text-ink-900 font-bold rounded-xl py-3">{email.cta} · {total}</a>
                    <p className="text-[11px] text-ink-500 mt-4 leading-relaxed">{email.footer} <span className="text-info underline">להסרה מתזכורות</span></p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        )}

        <footer className="sticky bottom-0 bg-white border-t border-ink-200 p-4 flex flex-wrap items-center gap-3 justify-end">
          {c.optedOut && <span className="text-critical text-sm font-bold me-auto">הלקוח ביקש הסרה — אין שליחה</span>}
          {live && !!pv && isCsv && (
            <label className="me-auto flex items-start gap-2 text-sm rounded-xl bg-amber-50 text-amber-900 px-3 py-2 max-w-md" data-testid="confirm-open">
              <input type="checkbox" className="h-5 w-5 mt-0.5 accent-[#10B981]" checked={confirmOpen} onChange={e => setConfirmOpen(e.target.checked)} />
              <span><b>הסכום {total} עדיין פתוח</b> — בדקתי. (חשבונית מקובץ CSV לא מתעדכנת לבד; האישור תקף 24 שעות.)</span>
            </label>
          )}
          {odd.length > 0 && (
            <label className="me-auto flex items-start gap-2 text-sm rounded-xl bg-red-50 text-red-900 px-3 py-2 max-w-md" data-testid="confirm-amount">
              <input type="checkbox" className="h-5 w-5 mt-0.5 accent-[#10B981]" checked={confirmAmount} onChange={e => setConfirmAmount(e.target.checked)} />
              <span><b>הסכום נכון — בדקתי.</b> {odd.map(o => `חשבונית ${o.number}: ${fmtMoney(o.amount_agorot / 100, o.currency)} (בדרך כלל ${fmtMoney(o.usual_agorot / 100, o.currency)})`).join(' · ')}. אולי הנקודה העשרונית במקום הלא נכון?</span>
            </label>
          )}
          <Button variant="ghost" onClick={onClose}>ביטול</Button>
          <Button disabled={!sendable || (live && isCsv && !confirmOpen) || (odd.length > 0 && !confirmAmount)} onClick={async () => {
            setBusy(true);
            try { await approveAndSend(invoice.id, step, channels, { confirmOpen, confirmAmount, seenHash: pv?.body_hash }); onClose(); }
            catch (e) {
              // הפעלה 149: הנוסח השתנה מאז שנפתח (seen_hash) ⇒ טוענים אותו מחדש כאן, מנקים את תיבות האישור
              // (הן סומנו על הסכום הישן), ומציגים מה השתנה. כשהטעינה נכשלת או שהתזכורת כבר לא ממתינה ⇒ ההודעה הרגילה.
              if (stalePreview(e) && pending) {
                try {
                  const fresh = await api.preview(pending.reminderId);
                  if (fresh.status === 'pending_approval') {
                    setChanged(staleChangeText(pv?.total_text, fresh.total_text));
                    setPv(fresh); setConfirmOpen(false); setConfirmAmount(false); setBusy(false);
                    dialog.current?.scrollTo?.({ top: 0 });   // ההסבר בראש החלון; במובייל הכפתור בתחתית
                    void reload().catch(() => { /* הפס «הנתונים לא עודכנו» מטפל */ });
                    return;
                  }
                } catch { /* נופלים להודעה הרגילה */ }
              }
              showFail(failPrefix('לא אושר', (e as Error).message)); setBusy(false);
            }
          }}>
            ✓ אשר ושלח {live && !pv ? '' : channels.length === 2 ? 'ב-SMS ובמייל' : channels[0] === 'sms' ? 'ב-SMS' : channels[0] === 'email' ? 'במייל' : ''}
          </Button>
        </footer>
      </div>
    </div>
  );
}

/** הפעלה 158: שלד התצוגה המקדימה בצורת החלון עצמו: עמודת פרטים ומסגרת טלפון עם בועת הודעה. צורות בלבד,
 *  מוסתרות מקורא מסך; הוא שומע «טוען תצוגה מקדימה…» פעם אחת. */
function PreviewSkeleton() {
  const bar = 'rounded-md bg-ink-200';
  return (
    <div role="status" data-testid="mp-loading">
      <span className="sr-only">טוען תצוגה מקדימה…</span>
      <div aria-hidden="true" data-testid="mp-skeleton" className="animate-pulse grid md:grid-cols-[1fr_1.1fr] gap-6 p-5">
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-2">{[0, 1, 2, 3].map(i => <div key={i} className={`${bar} h-10`} />)}</div>
          <div className="space-y-2"><div className={`${bar} h-12`} /><div className={`${bar} h-12`} /></div>
          <div className={`${bar} h-28`} />
        </div>
        <div>
          <div className={`${bar} h-11 mb-3`} />
          <div className="mx-auto max-w-[320px] rounded-[2rem] border-[10px] border-ink-200 bg-ink-100 overflow-hidden">
            <div className="bg-white px-4 py-3 border-b border-ink-200"><div className={`${bar} mx-auto h-9 w-9 rounded-full`} /></div>
            <div className="p-3 min-h-56"><div className="bg-white rounded-2xl px-3.5 py-3 space-y-2 max-w-[92%]">
              <div className={`${bar} h-3 w-full`} /><div className={`${bar} h-3 w-5/6`} /><div className={`${bar} h-3 w-2/3`} />
            </div></div>
          </div>
        </div>
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
