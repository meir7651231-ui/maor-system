import { useState } from 'react';
import { useApp } from '../store.tsx';
import type { Business, SmsProvider } from '../lib/domain.ts';
import { STEP_LABEL, STEP_ORDER } from '../lib/message.ts';
import { Button, Card, Field, Toggle, inputCls } from '../components/ui.tsx';

const PROVIDERS: [SmsProvider, string, string][] = [
  ['019', '019 SMS', 'ברירת מחדל · ספק ישראלי · webhook לתשובות ודוחות מסירה'],
  ['inforu', 'InforU', 'ספק ישראלי · שם שולח אלפאנומרי'],
  ['twilio', 'Twilio', 'בינלאומי · גיבוי · תיעוד מצוין'],
];

export function Settings() {
  const { business, setBusiness, showToast } = useApp();
  const [b, setB] = useState<Business>(business);
  const set = <K extends keyof Business>(k: K, v: Business[K]) => setB({ ...b, [k]: v });
  const senderOk = /^[A-Za-z][A-Za-z0-9 ]{0,10}$/.test(b.smsSender);

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-3xl font-extrabold">הגדרות עסק</h1>

      <Card className="p-5 space-y-4">
        <h2 className="text-lg font-extrabold">פרטי העסק</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="שם העסק (מופיע בהודעות)"><input className={inputCls} value={b.name} onChange={e => set('name', e.target.value)} /></Field>
          <Field label="שם פרטי לחתימה"><input className={inputCls} value={b.ownerName} onChange={e => set('ownerName', e.target.value)} /></Field>
          <Field label="ע.מ. / ח.פ."><input className={`${inputCls} num text-right`} inputMode="numeric" value={b.vatId} onChange={e => set('vatId', e.target.value)} /></Field>
          <Field label="מייל לתשובות לקוחות"><input className={`${inputCls} num text-right`} type="email" value={b.email} onChange={e => set('email', e.target.value)} /></Field>
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <h2 className="text-lg font-extrabold">ערוצי שליחה</h2>
        <Row title="📱 SMS" desc="ההודעה מגיעה לכל טלפון, בלי אפליקציה."><Toggle label="SMS" checked={b.channels.sms} onChange={v => set('channels', { ...b.channels, sms: v })} /></Row>
        <Row title="✉️ מייל" desc="נוסח מלא עם כפתור תשלום ופרטי החשבונית."><Toggle label="מייל" checked={b.channels.email} onChange={v => set('channels', { ...b.channels, email: v })} /></Row>
        <div className="grid sm:grid-cols-3 gap-2" role="radiogroup" aria-label="ספק SMS">
          {PROVIDERS.map(([k, name, desc]) => (
            <button key={k} role="radio" aria-checked={b.smsProvider === k} onClick={() => set('smsProvider', k)}
              className={`text-right rounded-xl border p-3 cursor-pointer ${b.smsProvider === k ? 'border-brand ring-1 ring-brand bg-brand-50' : 'border-ink-200 hover:bg-ink-50'}`}>
              <div className="font-bold">{name}</div><div className="text-xs text-ink-500 mt-0.5">{desc}</div>
            </button>
          ))}
        </div>
        <Field label="שם השולח ב-SMS" hint={senderOk ? 'עד 11 תווים באנגלית/ספרות, מתחיל באות. מאושר מול הספק לפני שליחה ראשונה.' : '⚠️ עד 11 תווים באנגלית/ספרות, מתחיל באות'}>
          <input className={`${inputCls} num text-right ${senderOk ? '' : 'border-critical'}`} value={b.smsSender} maxLength={11} onChange={e => set('smsSender', e.target.value)} />
        </Field>
      </Card>

      <Card className="p-5 space-y-4">
        <h2 className="text-lg font-extrabold">מתי ואיך שולחים</h2>
        <Row title="אישור אוטומטי לתזכורות המשך" desc="ההודעה הראשונה לכל לקוח והתזכורת האחרונה תמיד מחכות לאישורך.">
          <Toggle label="אישור אוטומטי" checked={b.autoApprove} onChange={v => set('autoApprove', v)} />
        </Row>
        <Row title="לא לשלוח בשבת ובחגים" desc="שישי עד 12:00 בלבד."><Toggle label="שבת וחג" checked={b.skipShabbat} onChange={v => set('skipShabbat', v)} /></Row>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="משעה"><input type="time" className={inputCls} value={b.sendWindow.from} min="08:00" onChange={e => set('sendWindow', { ...b.sendWindow, from: e.target.value })} /></Field>
          <Field label="עד שעה"><input type="time" className={inputCls} value={b.sendWindow.to} max="20:00" onChange={e => set('sendWindow', { ...b.sendWindow, to: e.target.value })} /></Field>
        </div>
        <div>
          <div className="text-sm font-bold mb-2">סולם התזכורות (ימים אחרי מועד התשלום)</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {STEP_ORDER.map((s, idx) => (
              <Field key={s} label={STEP_LABEL[s]}>
                <input type="number" min={0} max={120} className={`${inputCls} num text-right`} value={b.cadenceDays[idx]}
                  onChange={e => { const c = [...b.cadenceDays] as Business['cadenceDays']; c[idx] = Number(e.target.value); set('cadenceDays', c); }} />
              </Field>
            ))}
          </div>
          <p className="text-xs text-ink-500 mt-2">לכל היותר הודעה אחת ל-72 שעות לאותו לקוח. "הסר", מחלוקת או הסדר — עוצרים מיד.</p>
        </div>
      </Card>

      <Card className="p-5 space-y-3">
        <h2 className="text-lg font-extrabold">חיבורים</h2>
        <Row title="🧾 חשבונית ירוקה (morning)" desc="קריאה בלבד: חשבוניות פתוחות + קישור התשלום של כל חשבונית."><span className="text-sm font-bold text-brand-700">● מחובר (דמו)</span></Row>
      </Card>

      <div className="flex gap-3 sticky bottom-4">
        <Button disabled={!senderOk} onClick={() => { setBusiness(b); showToast('ההגדרות נשמרו (בדמו — בזיכרון בלבד)'); }}>שמירה</Button>
        <Button variant="ghost" onClick={() => setB(business)}>ביטול שינויים</Button>
      </div>
    </div>
  );
}

function Row({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return <div className="flex items-center gap-4 justify-between"><div><div className="font-bold">{title}</div><div className="text-sm text-ink-500">{desc}</div></div>{children}</div>;
}
