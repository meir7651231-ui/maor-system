// עמוד החייב v2 — /pay/{code}. מובייל-ראשון. ציבורי: רואה רק עסק, מספר חשבונית, סכום ומועד.
// אמצעי התשלום (Bit / Apple Pay / כרטיס) מובילים לדף התשלום המאובטח של חשבונית ירוקה —
// גבי לא רואה ולא שומר פרטי תשלום. בשלב 1 הכול dry-run: אין חיוב אמיתי.
import { useEffect, useState } from 'react';
import { LogoMark } from '../components/Logo.tsx';
import { payer, type PayMethod, type PayerView } from '../api.ts';
import { fmtDate } from '../lib/format.ts';

const METHOD: Record<PayMethod, { label: string; cls: string; icon: string }> = {
  bit: { label: 'תשלום ב-Bit', cls: 'bg-[#00B2A9] text-white hover:brightness-110', icon: 'bit' },
  apple_pay: { label: 'Apple Pay', cls: 'bg-black text-white hover:bg-ink-800', icon: '' },
  card: { label: 'כרטיס אשראי', cls: 'bg-white text-ink-900 border border-ink-200 hover:bg-ink-50', icon: '💳' },
};

type Done = null | 'paid' | 'plan' | 'stop';

export function Pay({ code }: { code: string }) {
  const [v, setV] = useState<PayerView | null>(null);
  const [err, setErr] = useState('');
  const [done, setDone] = useState<Done>(null);
  const [planN, setPlanN] = useState(3);
  const [confirmStop, setConfirmStop] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => { payer.view(code).then(setV).catch(() => setErr('הקישור אינו תקף או שפג תוקפו.')); }, [code]);
  useEffect(() => { document.title = v ? `תשלום לחשבונית ${v.number} · ${v.business}` : 'תשלום חשבונית'; }, [v]);

  const act = async (a: 'paid' | 'plan' | 'stop') => {
    setBusy(true);
    try { await payer.act(code, a, a === 'plan' ? planN : undefined); setDone(a); }
    catch { setErr('משהו השתבש. נסו שוב בעוד רגע.'); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-ink-50 flex flex-col">
      <header className="bg-ink-900 text-white">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-3">
          <LogoMark size={30} />
          <div className="min-w-0">
            <div className="font-display font-extrabold truncate" data-testid="pay-business">{v?.business ?? '…'}</div>
            <div className="text-xs text-ink-400">תשלום מאובטח דרך חשבונית ירוקה</div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-md mx-auto px-4 py-6 space-y-4">
        {err && <div role="alert" className="rounded-2xl bg-red-50 text-red-800 p-4 font-medium">{err}</div>}
        {!v && !err && <div className="rounded-2xl bg-white shadow-card p-8 text-center text-ink-500">טוען…</div>}

        {v && (
          <>
            <section className="rounded-2xl bg-white shadow-card p-5" aria-labelledby="amt">
              <div className="text-sm text-ink-500">חשבונית <span className="num">{v.number}</span>{v.due && <> · לתשלום עד <span className="num">{fmtDate(v.due)}</span></>}</div>
              <div id="amt" className="font-display font-extrabold text-5xl mt-2 num" data-testid="pay-amount">{v.amount}</div>
              {!v.open && <div className="mt-3 rounded-xl bg-brand-50 text-brand-700 font-bold p-3">✓ החשבונית כבר שולמה. תודה!</div>}
            </section>

            {done ? <DoneCard done={done} planN={planN} business={v.business} /> : v.open && (
              <>
                {v.can_pay ? (
                  <section className="space-y-2.5" aria-label="אמצעי תשלום">
                    {v.methods.map(m => (
                      <a key={m} href={payer.goUrl(code, m)} data-testid={`pay-${m}`}
                        className={`flex h-14 items-center justify-center gap-2 rounded-2xl text-lg font-bold shadow-sm transition ${METHOD[m].cls}`}>
                        {m === 'apple_pay' ? <><AppleLogo /> Pay</> : <>{m === 'bit' ? <b className="font-display tracking-tight">bit</b> : <span aria-hidden>{METHOD[m].icon}</span>}<span className={m === 'bit' ? 'sr-only' : ''}>{METHOD[m].label}</span></>}
                      </a>
                    ))}
                    <p className="text-xs text-center text-ink-500">🔒 התשלום מתבצע בדף המאובטח של חשבונית ירוקה. גבי לא רואה פרטי כרטיס.</p>
                  </section>
                ) : <p className="rounded-2xl bg-amber-50 text-amber-800 p-4">קישור התשלום עוד לא זמין — בעל העסק יעדכן בקרוב.</p>}

                <section className="rounded-2xl bg-white shadow-card p-5 space-y-3">
                  <h2 className="font-extrabold text-lg">צריכים פריסה?</h2>
                  <p className="text-sm text-ink-500">אפשר לבקש לחלק לתשלומים, ללא ריבית. הבקשה עוברת לאישור בעל העסק.</p>
                  <div className="flex gap-2" role="radiogroup" aria-label="מספר תשלומים">
                    {v.plan_options.map(n => (
                      <button key={n} role="radio" aria-checked={planN === n} onClick={() => setPlanN(n)}
                        className={`flex-1 h-11 rounded-xl font-bold num border ${planN === n ? 'bg-ink-900 text-white border-ink-900' : 'bg-white border-ink-200'}`}>{n}</button>
                    ))}
                  </div>
                  <button disabled={busy} onClick={() => act('plan')} className="w-full h-12 rounded-xl bg-brand text-ink-900 font-bold disabled:opacity-50" data-testid="pay-plan">בקשת פריסה ל-{planN} תשלומים</button>
                </section>

                <section className="rounded-2xl bg-white shadow-card p-5 space-y-2">
                  <button disabled={busy} onClick={() => act('paid')} className="w-full h-12 rounded-xl border border-ink-200 font-bold disabled:opacity-50" data-testid="pay-paid">כבר שילמתי</button>
                  {!confirmStop
                    ? <button onClick={() => setConfirmStop(true)} className="w-full h-11 text-sm text-ink-500 underline">הפסקת תזכורות</button>
                    : <button disabled={busy} onClick={() => act('stop')} className="w-full h-11 rounded-xl text-critical font-bold border border-red-200 disabled:opacity-50">כן, להפסיק לשלוח לי תזכורות</button>}
                </section>
              </>
            )}
          </>
        )}
      </main>
      <footer className="text-center text-xs text-ink-500 py-6 px-4">
        נשלח מטעם {v?.business ?? 'העסק'} באמצעות גבי · {v?.dry_run && <b>מצב הדגמה — לא יבוצע חיוב אמיתי</b>}
      </footer>
    </div>
  );
}

function DoneCard({ done, planN, business }: { done: Exclude<Done, null>; planN: number; business: string }) {
  const t = done === 'paid' ? ['תודה! 🙏', `העברנו ל${business} לבדיקה. התזכורות מושהות בינתיים.`]
    : done === 'plan' ? ['הבקשה נשלחה', `בקשת פריסה ל-${planN} תשלומים הועברה ל${business}. תקבלו תשובה בהודעה.`]
    : ['הוסרתם', 'לא נשלח לכם תזכורות אוטומטיות נוספות. בעל העסק ייצור קשר במידת הצורך.'];
  return (
    <section role="status" className="rounded-2xl bg-brand-50 p-6 text-center" data-testid="pay-done">
      <div className="text-2xl font-extrabold font-display">{t[0]}</div>
      <p className="text-ink-700 mt-2">{t[1]}</p>
    </section>
  );
}

const AppleLogo = () => (
  <svg aria-hidden width="18" height="22" viewBox="0 0 17 21" fill="currentColor"><path d="M14.1 11.2c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2.1-.9-3.4-.9-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8s2 .8 3.4.8c1.4 0 2.3-1.3 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9 0 0-2.7-1-2.7-4.1zM11.6 3.6c.7-.9 1.2-2 1-3.2-1 0-2.2.7-3 1.5-.6.7-1.2 1.9-1 3 1.1.1 2.3-.6 3-1.3z"/></svg>
);
