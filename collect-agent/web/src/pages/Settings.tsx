import { useState } from 'react';
import { useApp } from '../store.tsx';
import type { Business, DataSource, PayProvider } from '../lib/domain.ts';
import { PRODUCT_RULES, RULES } from '../lib/domain.ts';
import { Button, Card, Field, inputCls } from '../components/ui.tsx';

const PAY: [PayProvider, string][] = [['greeninvoice', 'חשבונית ירוקה (morning)'], ['meshulam', 'משולם'], ['bit', 'ביט']];
const SOURCE: [DataSource, string, string][] = [
  ['api', 'חיבור API לחשבונית ירוקה', 'מומלץ. מפתח לקריאה בלבד, מתעדכן אוטומטית.'],
  ['csv', 'העלאת קובץ CSV', 'חלופה כשאין API. מעלים קובץ חשבוניות פתוחות.'],
];
const STEP_NAMES = ['תזכורת 1', 'תזכורת 2', 'תזכורת 3 (אחרונה)'];

/**
 * הגדרות עסק — **מוק מסומן**. לשרת אין עדיין API להגדרות (חוזה מוצע ב-DESIGN.md §3ב).
 * שום דבר כאן לא נשמר בשרת, והממשק אומר זאת במפורש. מפתחות לא נשלחים לשום מקום.
 */
export function Settings() {
  const { business, setBusiness, showToast } = useApp();
  const [b, setB] = useState<Business>(business);
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);
  const set = <K extends keyof Business>(k: K, v: Business[K]) => { setB({ ...b, [k]: v }); setSaved(false); };
  const senderOk = /^[A-Za-z][A-Za-z0-9 ]{0,10}$/.test(b.smsSender);
  const payOk = /^https:\/\/\S+$/.test(b.payPageUrl);
  const cadenceOk = b.cadenceDays.every((x, i) => x >= 0 && (i === 0 || x > b.cadenceDays[i - 1]));

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-3xl font-extrabold">הגדרות עסק</h1>
      <div role="note" data-testid="settings-mock" className="rounded-2xl border-2 border-dashed border-amber-400 bg-amber-50 p-4 text-amber-900">
        <b>🧪 מוק — ההגדרות לא נשמרות בשרת.</b> לשרת אין עדיין API להגדרות עסק. אפשר לנסות את המסך, אבל שינוי כאן לא משפיע על התזכורות,
        ונמחק ברענון. מפתחות שמודבקים כאן לא נשלחים לשום מקום.
      </div>

      <Card className="p-5 space-y-4">
        <h2 className="text-lg font-extrabold">פרטי העסק</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="שם העסק (פותח כל הודעה)"><input className={inputCls} value={b.name} onChange={e => set('name', e.target.value)} /></Field>
          <Field label="שם פרטי לחתימה"><input className={inputCls} value={b.ownerName} onChange={e => set('ownerName', e.target.value)} /></Field>
          <Field label="ע.מ. / ח.פ."><input className={`${inputCls} num text-right`} inputMode="numeric" value={b.vatId} onChange={e => set('vatId', e.target.value)} /></Field>
          <Field label="מייל לתשובות לקוחות"><input className={`${inputCls} num text-right`} type="email" value={b.email} onChange={e => set('email', e.target.value)} /></Field>
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <h2 className="text-lg font-extrabold">מאיפה מגיעות החשבוניות</h2>
        <div className="grid sm:grid-cols-2 gap-2" role="radiogroup" aria-label="מקור החשבוניות">
          {SOURCE.map(([k, t, d]) => (
            <button key={k} role="radio" aria-checked={b.dataSource === k} onClick={() => set('dataSource', k)}
              className={`text-right rounded-xl border p-3 cursor-pointer ${b.dataSource === k ? 'border-brand ring-1 ring-brand bg-brand-50' : 'border-ink-200 bg-white hover:bg-ink-50'}`}>
              <div className="font-bold">{t}</div><div className="text-xs text-ink-500 mt-0.5">{d}</div>
            </button>
          ))}
        </div>
        {b.dataSource === 'api'
          ? <Field label="מפתח API (חשבונית ירוקה)" hint="במוק: לא נשמר ולא נשלח. בגרסה האמיתית — נשמר מוצפן, וכל עסק מחבר מפתח משלו. דורש מסלול Best ומעלה ב-morning.">
              <input className={`${inputCls} num text-left`} type="password" autoComplete="off" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="id:secret" />
            </Field>
          : <Field label="קובץ CSV" hint="במוק: הקובץ לא נקרא ולא נשלח. עמודות צפויות: מספר, לקוח, טלפון, מייל, סכום, מועד.">
              <input type="file" accept=".csv,text/csv" className="block text-sm" disabled aria-disabled="true" />
            </Field>}
      </Card>

      <Card className="p-5 space-y-4">
        <h2 className="text-lg font-extrabold">ערוצי שליחה</h2>
        <div className="rounded-xl bg-ink-50 p-3 text-sm">
          📱 <b>SMS:</b> ספק ראשי <b>019</b>, גיבוי <b>InforU</b> (מאחורי מתאם אחד בשרת; כרגע מצב בדיקה בלבד).<br />
          ✉️ <b>מייל:</b> נוסח מלא עם קישור לתשלום וקישור הסרה.<br />
          🚫 <b>וואטסאפ:</b> לא בשימוש (המדיניות שלו אוסרת גביית חובות).
        </div>
        <Field label="שם השולח ב-SMS" hint={senderOk ? 'עד 11 תווים באנגלית/ספרות, מתחיל באות. נרשם אצל הספק לפני שליחה ראשונה.' : '⚠️ עד 11 תווים באנגלית/ספרות, מתחיל באות'}>
          <input className={`${inputCls} num text-right ${senderOk ? '' : 'border-critical'}`} value={b.smsSender} maxLength={11} onChange={e => set('smsSender', e.target.value)} />
        </Field>
      </Card>

      <Card className="p-5 space-y-4">
        <h2 className="text-lg font-extrabold">קישור לתשלום</h2>
        <p className="text-sm text-ink-500">גבי לא מחזיק כסף. כל תזכורת מובילה לעמוד התשלום של העסק שלכם, והכסף עובר ישירות אליכם.</p>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="עמוד תשלום">
          {PAY.map(([k, t]) => (
            <button key={k} role="radio" aria-checked={b.payProvider === k} onClick={() => set('payProvider', k)}
              className={`rounded-full px-4 py-2 text-sm font-bold border cursor-pointer ${b.payProvider === k ? 'bg-ink-900 text-white border-ink-900' : 'bg-white border-ink-200'}`}>{t}</button>
          ))}
        </div>
        <Field label="כתובת עמוד התשלום" hint={payOk ? 'https בלבד. בהדגמה: כתובת example.' : '⚠️ כתובת https מלאה'}>
          <input className={`${inputCls} num text-left ${payOk ? '' : 'border-critical'}`} value={b.payPageUrl} onChange={e => set('payPageUrl', e.target.value)} />
        </Field>
      </Card>

      <Card className="p-5 space-y-4">
        <h2 className="text-lg font-extrabold">מתי ואיך שולחים</h2>
        <ul className="space-y-1.5 text-sm" data-testid="settings-rules">
          {RULES.map(r => <li key={r} className="flex gap-2"><span className="text-brand-700">🔒</span>{r}</li>)}
        </ul>
        <p className="text-xs text-ink-500">כללים קבועים של המוצר — לא ניתנים לשינוי.</p>
        <div>
          <div className="text-sm font-bold mb-2">מתי כל תזכורת (ימים אחרי מועד התשלום) · עד {PRODUCT_RULES.maxReminders}</div>
          <div className="grid grid-cols-3 gap-3">
            {STEP_NAMES.map((n, idx) => (
              <Field key={n} label={n}>
                <input type="number" min={0} max={120} className={`${inputCls} num text-right`} value={b.cadenceDays[idx]}
                  onChange={e => { const c = [...b.cadenceDays] as Business['cadenceDays']; c[idx] = Number(e.target.value); set('cadenceDays', c); }} />
              </Field>
            ))}
          </div>
          {!cadenceOk && <p className="text-xs text-critical mt-1">כל תזכורת צריכה להיות אחרי הקודמת.</p>}
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-3 sticky bottom-4 bg-paper/90 backdrop-blur rounded-xl p-2">
        <Button disabled={!senderOk || !payOk || !cadenceOk} onClick={() => { setBusiness(b); setSaved(true); showToast('נשמר בלשונית הזו בלבד — לא בשרת (מוק)'); }}>
          שמירה בלשונית בלבד (מוק)
        </Button>
        <Button variant="ghost" onClick={() => { setB(business); setSaved(false); }}>ביטול שינויים</Button>
        {saved && <span className="text-sm text-amber-800" data-testid="saved-note">עודכן בתצוגה בלבד. השרת לא יודע על השינוי.</span>}
      </div>
    </div>
  );
}
