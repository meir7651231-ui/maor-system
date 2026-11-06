// עמוד החייב v2 — /pay/{code}. מובייל-ראשון. ציבורי: רואה רק עסק, מספר חשבונית, סכום ומועד.
// כפתור ניטרלי אחד ⇒ עמוד התשלום של העסק (חשבונית ירוקה / משולם / ביט — נגזר מהקישור בפועל),
// והדומיין המדויק של היעד מוצג. בלי לוגואים או צבעי מותג של צד ג' (review חור 4: סימני מסחר,
// הבטחה לאמצעים שהעסק אולי לא מקבל, ומראה של דף פישינג). גבי לא רואה ולא שומר פרטי תשלום.
import { useEffect, useState } from 'react';
import { LogoMark } from '../components/Logo.tsx';
import { payer, type PayerView } from '../api.ts';
import { fmtDate } from '../lib/format.ts';


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
            <div className="text-xs text-ink-400">תזכורת תשלום מטעם העסק</div>
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
                    <a href={payer.goUrl(code, 'page')} data-testid="pay-page"
                      className="flex h-14 items-center justify-center gap-2 rounded-2xl text-lg font-bold shadow-sm transition bg-brand text-ink-900 hover:brightness-105">
                      לעמוד התשלום של {v.business}
                    </a>
                    <p className="text-xs text-center text-ink-500" data-testid="pay-host">
                      🔒 התשלום מתבצע אצל {v.pay_provider || 'ספק התשלום של העסק'}
                      {v.pay_host && v.pay_host !== v.pay_provider && <> · <span dir="ltr" className="num">{v.pay_host}</span></>}. גבי לא רואה פרטי תשלום.
                    </p>
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

