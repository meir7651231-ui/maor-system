import { useState } from 'react';
import { Logo } from '../components/Logo.tsx';
import { Button, Field, inputCls } from '../components/ui.tsx';
import { isIlMobile } from '../lib/format.ts';
import { go } from '../router.ts';

const STEPS = ['פרטים', 'חיבור חשבוניות', 'ערוצים'];

export function Signup() {
  const [s, setS] = useState(0);
  const [f, setF] = useState({ name: '', biz: '', email: '', phone: '', gi: 'greeninvoice', sms: true, email2: true, agree: false, marketing: false, marketingAt: '' });
  // critic סבב 5: מיילי ניסיון 5–7 (marketing/emails-trial.md) הם «פרסומת» לפי §30א ⇒ דרושה הסכמה
  // מפורשת מראש: תיבה נפרדת, אופציונלית, **לא מסומנת**, עם חותמת זמן. בלי סימון ⇒ רק הודעות שירות.
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email);
  const ok0 = f.name.trim() && f.biz.trim() && emailOk && isIlMobile(f.phone);
  return (
    <div className="min-h-screen bg-gradient-to-b from-ink-900 to-ink-800 grid place-items-center p-4">
      <div className="w-full max-w-lg">
        <div className="flex justify-center mb-6"><a href="#"><Logo dark size={44} /></a></div>
        <div className="bg-white rounded-2xl shadow-pop p-6 md:p-8">
          <ol className="flex gap-2 mb-6" aria-label="שלבי הרשמה">
            {STEPS.map((t, i) => (
              <li key={t} className="flex-1">
                <div className={`h-1.5 rounded-full ${i <= s ? 'bg-brand' : 'bg-ink-200'}`} />
                <div className={`text-xs mt-1.5 ${i === s ? 'font-bold text-ink-900' : 'text-ink-500'}`}>{i + 1}. {t}</div>
              </li>
            ))}
          </ol>
          {s === 0 && (
            <div className="space-y-4">
              <h1 className="text-2xl font-extrabold">14 ימי ניסיון, בלי כרטיס אשראי</h1>
              <p className="text-sm text-ink-500 -mt-2">אחר כך ₪119 לחודש או ₪1,190 לשנה, כולל מע״מ ככל שחל. ביטול בכל רגע.</p>
              <p className="text-xs rounded-lg bg-amber-50 text-amber-900 p-2">בטא סגורה ל-10 עסקים · טיוטה: לא נוצר חשבון ולא נשמרים פרטים.</p>
              <Field label="שם מלא"><input className={inputCls} value={f.name} onChange={e => setF({ ...f, name: e.target.value })} autoComplete="name" /></Field>
              <Field label="שם העסק"><input className={inputCls} value={f.biz} onChange={e => setF({ ...f, biz: e.target.value })} /></Field>
              <Field label="מייל"><input className={`${inputCls} num text-right`} type="email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} autoComplete="email" /></Field>
              <Field label="נייד" hint={f.phone && !isIlMobile(f.phone) ? '⚠️ מספר נייד ישראלי, למשל 050-1234567' : 'לקבלת התראה כשיש תזכורות לאישור'}>
                <input className={`${inputCls} num text-right`} inputMode="tel" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} autoComplete="tel" />
              </Field>
              <Button className="w-full" disabled={!ok0} onClick={() => setS(1)}>המשך</Button>
            </div>
          )}
          {s === 1 && (
            <div className="space-y-4">
              <h1 className="text-2xl font-extrabold">מאיפה מגיעות החשבוניות?</h1>
              {[['greeninvoice', 'חשבונית ירוקה / morning', 'מחובר ב-MVP'], ['icount', 'iCount', 'בקרוב'], ['csv', 'העלאת קובץ Excel/CSV', 'בקרוב']].map(([k, t, tag]) => (
                <label key={k} className={`flex items-center gap-3 rounded-xl border p-3.5 ${k === 'greeninvoice' ? 'cursor-pointer' : 'opacity-50'} ${f.gi === k ? 'border-brand ring-1 ring-brand bg-brand-50' : 'border-ink-200'}`}>
                  <input type="radio" name="gi" className="accent-[#10B981] h-5 w-5" disabled={k !== 'greeninvoice'} checked={f.gi === k} onChange={() => setF({ ...f, gi: k })} />
                  <span className="font-bold">{t}</span><span className="ms-auto text-xs text-ink-500">{tag}</span>
                </label>
              ))}
              <div className="rounded-xl bg-ink-50 p-3 text-sm text-ink-700">🔒 בשלב הבא תדביק/י מפתח API לקריאה בלבד. גבי לא יוצר ולא משנה מסמכים.</div>
              {/* הכרעת מאיר 6.11: זמינות ה-API לפי מסלול היא הערכה לא מאומתת — נוסח מחייב עד אימות רשמי */}
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-ink-700" data-testid="gi-plan-note">ℹ️ ייתכן שנדרש מסלול Best ומעלה ב-morning; יש לאמת מול הספק.</div>
              <div className="flex gap-2"><Button variant="ghost" onClick={() => setS(0)}>חזרה</Button><Button className="flex-1" onClick={() => setS(2)}>המשך</Button></div>
            </div>
          )}
          {s === 2 && (
            <div className="space-y-4">
              <h1 className="text-2xl font-extrabold">איך לשלוח תזכורות?</h1>
              {([['sms', '📱 SMS', 'מגיע לכל טלפון'], ['email2', '✉️ מייל', 'עם כפתור תשלום']] as const).map(([k, t, d]) => (
                <label key={k} className="flex items-center gap-3 rounded-xl border border-ink-200 p-3.5 cursor-pointer">
                  <input type="checkbox" className="accent-[#10B981] h-5 w-5" checked={f[k]} onChange={e => setF({ ...f, [k]: e.target.checked })} />
                  <span className="font-bold">{t}</span><span className="ms-auto text-xs text-ink-500">{d}</span>
                </label>
              ))}
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" className="accent-[#10B981] h-5 w-5 mt-0.5" checked={f.agree} onChange={e => setF({ ...f, agree: e.target.checked })} />
                <span>אני מאשר/ת שהתזכורות נשלחות רק ללקוחות קיימים של העסק, על חשבוניות אמיתיות, ושאני אחראי/ת לנכונות הסכומים.</span>
              </label>
              <label className="flex items-start gap-2 text-sm text-ink-700" data-testid="marketing-consent">
                <input type="checkbox" className="accent-[#10B981] h-5 w-5 mt-0.5" checked={f.marketing}
                  onChange={e => setF({ ...f, marketing: e.target.checked, marketingAt: e.target.checked ? new Date().toISOString() : '' })} />
                <span>אשמח לקבל מגבי עדכונים והצעות במייל (לא חובה; אפשר להסיר בכל מייל).</span>
              </label>
              <div className="flex gap-2"><Button variant="ghost" onClick={() => setS(1)}>חזרה</Button>
                <Button className="flex-1" disabled={!f.agree || (!f.sms && !f.email2)} onClick={() => go('dashboard')}>התחלת ניסיון (דמו) ←</Button></div>
              <p className="text-xs text-ink-500 text-center">דמו בלבד — לא נוצר חשבון ולא נשמרים פרטים.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
