import { useState } from 'react';
import { useApp } from '../store.tsx';
import { api, type Draft } from '../api.ts';
import { Button, Card } from '../components/ui.tsx';
import { smsSegments } from '../lib/message.ts';
import { fmtWhenIL } from '../lib/policy.ts';

const INTENT: Record<string, string> = {
  how_to_pay: 'שאל/ה איך משלמים', paid_claim: 'טוען/ת ששילם/ה', plan_request: 'מבקש/ת פריסה', opt_out: 'ביקש/ה הסרה',
  dispute: 'מחלוקת', copy_request: 'מבקש/ת העתק חשבונית', thanks: 'תודה', unknown: 'לא ברור',
};
const ESC: Record<string, [string, string]> = {
  urgent: ['דחוף', 'bg-red-50 text-red-700 ring-red-200'], normal: ['לטיפולך', 'bg-amber-50 text-amber-700 ring-amber-200'], none: ['שגרתי', 'bg-ink-100 text-ink-700 ring-ink-200'],
};

/** קודי מסנן הניסוח (app/compliance.py) ⇒ הסבר לבעל העסק. קוד לא מוכר מוצג כמו שהוא. */
const VIOLATION: Record<string, string> = {
  marketing: 'תוכן שיווקי (מבצע, קופון, "חדש")', discount: 'הבטחת הנחה או מחילה', enforcement: 'איום בהוצאה לפועל',
  lawyer: 'איום בעורך דין', court: 'איום בבית משפט', warning_letter: 'מכתב התראה', seizure: 'איום בעיקול', police: 'משטרה',
  credit: 'איום בדירוג אשראי', third_party: 'פנייה לצד שלישי', shaming: 'ביוש', fees: 'הוצאות גבייה', threat: 'איום',
  judgmental: 'ניסוח שיפוטי', pressure: 'לחץ', debt_word: 'המילה "חוב"', foreign_link: 'קישור לא מאושר',
  no_business_first: 'ההודעה חייבת להתחיל בשם העסק', sms_too_long: 'ה-SMS ארוך מדי',
};
export const explainViolation = (msg: string) =>
  msg.replace(/\b[a-z_]{4,}\b/g, code => VIOLATION[code] ? `${VIOLATION[code]}` : code);

/** "תשובות לקוחות": כל תשובת חייב ⇒ סיכום לבעל העסק + טיוטת מענה. שום דבר לא נשלח בלי אישור. */
export function Inbox() {
  const { mode, drafts } = useApp();
  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-3xl font-extrabold">תשובות לקוחות</h1>
        <p className="text-ink-500 mt-1">גבי קורא כל תשובה, מסכם לך ומכין מענה. אתה מאשר, עורך או סוגר — שום דבר לא יוצא בלי אישור.</p>
      </div>
      {mode !== 'live' ? (
        <Card className="p-8 text-center text-ink-500">התיבה זמינה בחיבור לשרת גבי (<span className="num">./demo.sh</span> ⇒ /app/).</Card>
      ) : drafts.length === 0 ? (
        <Card className="p-8 text-center text-ink-500" >אין תשובות שמחכות לך ✨ — אפשר לנסות את «סימולציה: לקוח עונה» בסקירה.</Card>
      ) : (
        <ul className="space-y-4" data-testid="drafts">{drafts.map(d => <DraftCard key={d.id} d={d} />)}</ul>
      )}
    </div>
  );
}

function DraftCard({ d }: { d: Draft }) {
  const { reload, showToast } = useApp();
  const [body, setBody] = useState(d.body ?? '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [esc, cls] = ESC[d.escalate] ?? ESC.none;
  const needsWrite = d.status === 'needs_owner';
  const seg = smsSegments(body);
  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true); setErr(null);
    try { await fn(); await reload(); showToast(ok); } catch (e) { setErr(explainViolation((e as Error).message)); setBusy(false); }
  };
  return (
    <li>
      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset ${cls}`}>{esc}</span>
          <b className="text-lg">{d.customer}</b>
          <span className="text-sm text-ink-500">· {INTENT[d.intent] ?? d.intent} · {d.channel === 'sms' ? '📱 SMS' : '✉️ מייל'}</span>
          <span className="ms-auto text-xs text-ink-500">{fmtWhenIL(d.created_at)}</span>
        </div>
        <p className="mt-3 font-medium">{d.owner_summary}</p>
        {d.owner_actions.length > 0 && (
          <ul className="mt-2 space-y-1 text-sm text-ink-700">{d.owner_actions.map(a => <li key={a}>☐ {a}</li>)}</ul>
        )}
        <label className="block mt-4">
          <span className="text-sm font-bold">{needsWrite ? 'אין טיוטה — כתבו מענה (או סגרו את הכרטיס)' : 'טיוטת המענה של גבי (אפשר לערוך)'}</span>
          <textarea value={body} onChange={e => setBody(e.target.value)} rows={3} aria-label={`מענה ל${d.customer}`}
            className="mt-1 w-full rounded-xl border border-ink-200 p-3 text-sm focus:border-brand focus:ring-2 focus:ring-brand/30 outline-none" />
        </label>
        {d.channel === 'sms' && <div className="text-xs text-ink-500"><span className="num">{seg.chars}</span> תווים · <span className="num">{seg.segments}</span> מקטעי SMS · נוסח שנערך עובר את מסנן הניסוח (בלי שיווק/איומים)</div>}
        {err && <p className="mt-2 text-sm text-critical font-bold" role="alert">לא נשלח: {err}</p>}
        <div className="mt-4 flex flex-wrap gap-2 justify-end">
          <Button variant="ghost" disabled={busy} onClick={() => run(() => api.rejectDraft(d.id), 'הכרטיס נסגר בלי מענה')}>✗ סגירה בלי מענה</Button>
          <Button disabled={busy || !body.trim()} onClick={() => run(() => api.approveDraft(d.id, body === d.body ? undefined : body), '✓ המענה אושר ונשלח (dry-run)')}>✓ אשר ושלח</Button>
        </div>
      </Card>
    </li>
  );
}
