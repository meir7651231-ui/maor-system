import { useState } from 'react';
import { Logo, LogoMark } from '../components/Logo.tsx';
import { Button } from '../components/ui.tsx';
import { go } from '../router.ts';
import { DEFAULT_RECOVERY, GABI_PRICE, roi } from '../lib/roi.ts';
import { fmtIls } from '../lib/format.ts';

// הכרעות מאיר (6.11, סופי): ₪119 לחודש או ₪1,190 לשנה, כולל מע״מ ככל שחל · 14 ימי ניסיון בלי כרטיס · אין מסלולים אחרים.
// מיצוב: "גבי – תזכורות תשלום" · "הכסף שלך חוזר. בלי שתצטרך לרדוף." · SMS ומייל בלבד.
// טיוטה, לא לפרסום (noindex ב-index.html). טופס רשימת ההמתנה לא שולח ולא שומר דבר.
export const PRICE = { monthly: 119, yearly: 1190, trialDays: 14 } as const;
export const TAGLINE = 'הכסף שלך חוזר. בלי שתצטרך לרדוף.';
export const PLAN_FEATURES = [
  'חיבור לחשבונית ירוקה (קריאה בלבד)',
  'תזכורות ב-SMS ובמייל, עם קישור תשלום בכל הודעה',
  'כל הודעה מחכה לאישור שלכם לפני שהיא יוצאת',
  'עד 3 תזכורות לחשבונית, ואז גבי עוצר ומעדכן אתכם',
  'זיהוי תשובות: "שילמתי", "הסר", בקשת פריסה',
  'הצעות פריסה בלי ריבית, באישורכם',
];

const STEPS = [
  ['🔌', 'מחברים פעם אחת', 'מדביקים מפתח API מחשבונית ירוקה. גבי קורא רק חשבוניות פתוחות, ולא יוצר או משנה מסמכים.'],
  ['☕', 'כל בוקר: רשימה מוכנה', 'גבי מכין תזכורות מנומסות ב-SMS ובמייל, עם קישור לעמוד התשלום של העסק.'],
  ['✅', 'מאשרים כל הודעה', 'רואים בדיוק מה יישלח ומאשרים. גבי שולח בשעות סבירות ועוצר כשהחשבונית נסגרת.'],
];

const LADDER = [
  ['יום 1', 'תזכורת ידידותית', 'bg-brand'],
  ['יום 7', 'תזכורת שנייה', 'bg-due'],
  ['יום 14', 'תזכורת שלישית ואחרונה, עם הצעת פריסה', 'bg-late'],
  ['ואז', 'גבי עוצר ומעדכן אתכם. ההמשך אצלכם', 'bg-ink-900'],
] as const;

const REPLIES = [
  ['«איך משלמים?»', 'מכין מענה עם קישור התשלום, לאישורכם'],
  ['«שילמתי אתמול»', 'עוצר את התזכורות ומבקש מכם לבדוק'],
  ['«אפשר בתשלומים?»', 'מכין הצעה בלי תוספת, ומחכה לאישורכם'],
  ['«יש פה טעות»', 'עוצר הכול ומסמן אצלכם «דחוף»'],
  ['«הסר»', 'מפסיק לפנות ללקוח הזה'],
] as const;

const FAQ = [
  ['זה לא יפגע ביחסים עם הלקוחות?', 'הנוסחים מנומסים ועובדתיים, בלי איומים ובלי שיווק, וההודעה יוצאת בשם העסק שלכם. שום הודעה לא יוצאת בלי שאישרתם אותה.'],
  ['למי גבי שולח?', 'רק ללקוחות קיימים שלכם, על חשבוניות שהוצאתם להם. לפני כל שליחה הסכום נבדק מול החשבונית.'],
  ['באילו ערוצים?', 'SMS ומייל. בכל הודעה יש קישור לעמוד התשלום של העסק ואפשרות הסרה.'],
  ['מתי ההודעות נשלחות?', 'בין 08:00 ל-20:00. לא בשישי אחר הצהריים, לא בשבת ולא בחג.'],
  ['כמה תזכורות?', 'לכל היותר 3 לכל חשבונית. אחר כך גבי עוצר ומעדכן אתכם, וההחלטה מה לעשות אצלכם.'],
  ['הכסף עובר דרככם?', 'לא. הקישור מוביל לעמוד התשלום של העסק שלכם (למשל בחשבונית ירוקה, משולם או ביט). אנחנו לא מחזיקים כסף.'],
  ['זה מכתב התראה משפטי?', 'לא. אלה תזכורות עובדתיות על החשבוניות שלכם. אם שוקלים הליך משפטי, כדאי להתייעץ עם עו״ד.'],
  ['כמה זה עולה?', `₪${PRICE.monthly} לחודש או ₪${PRICE.yearly.toLocaleString('he-IL')} לשנה, כולל מע״מ ככל שחל. ${PRICE.trialDays} ימי ניסיון בלי כרטיס אשראי. אין מסלולים אחרים.`],
  ['אתם לוקחים אחוז מהכסף?', 'לא. רק מנוי קבוע.'],
] as const;

const scrollTo = (id: string) => (e: React.MouseEvent) => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); };

export function Landing() {
  return (
    <div className="bg-cream">
      <div role="note" className="bg-due/20 text-ink-900 text-center text-sm font-bold px-4 py-1.5">
        טיוטה, לא לפרסום · הדגמה במצב בדיקה בלבד: שום הודעה לא נשלחת באמת
      </div>
      <header className="sticky top-0 z-30 bg-cream/90 backdrop-blur border-b border-ink-200/70">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Logo size={34} />
          <nav className="hidden md:flex gap-6 text-sm font-medium text-ink-700" aria-label="ניווט ראשי">
            <a href="#how" onClick={scrollTo('how')}>איך זה עובד</a>
            <a href="#control" onClick={scrollTo('control')}>שליטה</a>
            <a href="#roi" onClick={scrollTo('roi')}>כמה תחזירו</a>
            <a href="#pricing" onClick={scrollTo('pricing')}>מחיר</a>
            <a href="#/dashboard">דמו חי</a>
          </nav>
          <Button size="sm" onClick={() => go('signup')}>{PRICE.trialDays} ימי ניסיון</Button>
        </div>
      </header>

      <section className="bg-ink-900 text-white overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block rounded-full bg-brand/15 text-brand px-3 py-1 text-sm font-bold mb-5">גבי · תזכורות תשלום לעסקים קטנים</span>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-[1.1]" data-testid="hero-title">הכסף שלך חוזר.<br /><span className="text-brand">בלי שתצטרך לרדוף.</span></h1>
            <p className="text-lg md:text-xl text-ink-400 mt-6 leading-relaxed max-w-lg">
              גבי מתחבר לחשבונית ירוקה, מוצא חשבוניות שלא שולמו ומכין ללקוחות שלכם תזכורות מנומסות ב-SMS ובמייל, עם קישור לתשלום. אתם מאשרים כל הודעה, והיא יוצאת בשם העסק שלכם.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Button size="lg" onClick={() => go('signup')}>התחילו {PRICE.trialDays} ימי ניסיון</Button>
              <Button size="lg" variant="ghost" className="text-white hover:bg-white/10" onClick={() => go('dashboard')}>לצפייה בדמו ←</Button>
            </div>
            <p className="text-sm text-ink-400 mt-4">בלי כרטיס אשראי · ₪{PRICE.monthly} לחודש או ₪{PRICE.yearly.toLocaleString('he-IL')} לשנה אחרי הניסיון · בלי אחוז מהגבייה</p>
          </div>
          <HeroPhone />
        </div>
      </section>

      <section className="border-b border-ink-200">
        <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[['כל', 'הודעה באישורכם'], ['3', 'תזכורות לכל היותר'], ['8:00–20:00', 'שעות שליחה'], ['0%', 'עמלה מהגבייה']].map(([n, l]) => (
            <div key={l}><div className="text-3xl md:text-4xl font-extrabold text-brand-700 font-display"><bdi dir="ltr">{n}</bdi></div><div className="text-sm text-ink-500 mt-1">{l}</div></div>
          ))}
        </div>
      </section>

      <section id="how" className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center">איך גבי עובד</h2>
        <p className="text-center text-ink-500 mt-3 text-lg">שלושה צעדים, ואתם כבר לא צריכים לעקוב בעצמכם.</p>
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          {STEPS.map(([i, t, d], n) => (
            <div key={t} className="rounded-2xl border border-ink-200 bg-white p-6 relative">
              <div className="text-3xl">{i}</div>
              <div className="absolute top-6 left-6 text-5xl font-extrabold text-ink-100 font-display">{n + 1}</div>
              <h3 className="text-xl font-extrabold mt-4">{t}</h3>
              <p className="text-ink-500 mt-2 leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="control" className="bg-brand-50">
        <div className="max-w-6xl mx-auto px-4 py-16 grid md:grid-cols-2 gap-10 items-start">
          <div>
            <h2 className="text-3xl font-extrabold">אתם בשליטה. תמיד.</h2>
            <ul className="mt-6 space-y-3 text-lg">
              {['שום הודעה לא יוצאת בלי שאישרתם אותה.',
                'רק ללקוחות קיימים, על חשבוניות שלכם. הסכום נבדק לפני כל שליחה.',
                'בין 08:00 ל-20:00. לא בשישי אחה״צ, לא בשבת ולא בחג.',
                'בכל הודעה יש אפשרות הסרה, והיא נכבדת מיד.',
                'בלי איומים ובלי שיווק. ניסוח עובדתי ומנומס.'].map(t => (
                <li key={t} className="flex gap-3"><span className="text-brand-600 font-bold">✓</span>{t}</li>
              ))}
            </ul>
            <div className="rounded-2xl bg-white shadow-card p-6 mt-8">
              <div className="text-sm text-ink-500 mb-3">הסולם של גבי (ימים אחרי מועד התשלום)</div>
              {LADDER.map(([d, t, c]) => (
                <div key={t} className="flex items-center gap-3 py-2.5"><span className={`h-3 w-3 rounded-full shrink-0 ${c}`} /><b className="w-16 text-right shrink-0">{d}</b><span>{t}</span></div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-white shadow-card p-6 overflow-x-auto">
            <table className="w-full text-right" aria-label="מה גבי עושה כשהלקוח עונה">
              <thead><tr className="text-sm text-ink-500"><th scope="col" className="pb-3 font-medium">הלקוח כותב</th><th scope="col" className="pb-3 font-medium">גבי</th></tr></thead>
              <tbody>
                {REPLIES.map(([q, a]) => (
                  <tr key={q} className="border-t border-ink-200"><td className="py-3 pl-4 font-bold whitespace-nowrap">{q}</td><td className="py-3 text-ink-700">{a}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <RoiCalculator />

      <section id="pricing" className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center">מחיר אחד. פשוט.</h2>
        <p className="text-center text-ink-500 mt-3 text-lg">{PRICE.trialDays} ימי ניסיון · בלי כרטיס אשראי · בלי אחוזים מהגבייה</p>
        <div className="mt-12 max-w-md mx-auto rounded-2xl bg-ink-900 text-white p-8 ring-4 ring-brand/30" data-testid="price-card">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-extrabold">גבי</h3>
            <span className="text-xs font-bold bg-brand text-ink-900 rounded-full px-2.5 py-1">{PRICE.trialDays} יום ניסיון</span>
          </div>
          <div className="mt-5 flex items-baseline gap-1 flex-wrap"><span className="text-5xl font-extrabold font-display num">₪{PRICE.monthly}</span><span className="text-ink-400">/חודש</span></div>
          <p className="text-ink-400 mt-1">או <b className="text-white num">₪{PRICE.yearly.toLocaleString('he-IL')}</b> לשנה</p>
          <p className="text-sm text-ink-400 mt-2">כולל מע״מ ככל שחל. ביטול בכל רגע.</p>
          <ul className="mt-6 space-y-2.5 text-sm">
            {PLAN_FEATURES.map(f => <li key={f} className="flex gap-2"><span className="text-brand">✓</span>{f}</li>)}
          </ul>
          <Button className="mt-8 w-full" size="lg" onClick={() => go('signup')}>התחילו {PRICE.trialDays} ימי ניסיון</Button>
        </div>
        <Waitlist />
      </section>

      <section className="bg-white">
        <div className="max-w-3xl mx-auto px-4 py-20">
          <h2 className="text-3xl font-extrabold text-center mb-10">שאלות נפוצות</h2>
          {FAQ.map(([q, a]) => (
            <details key={q} className="group bg-cream rounded-xl border border-ink-200 mb-3 open:shadow-card">
              <summary className="cursor-pointer list-none p-5 font-bold flex justify-between items-center">{q}<span className="text-brand-600 group-open:rotate-45 transition-transform text-2xl leading-none">+</span></summary>
              <p className="px-5 pb-5 text-ink-700 leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="bg-ink-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-16 text-center">
          <LogoMark size={56} dark className="mx-auto" />
          <h2 className="text-3xl md:text-4xl font-extrabold mt-5">{TAGLINE}</h2>
          <p className="text-ink-400 mt-3 text-lg">גבי מזכיר ללקוחות לשלם, בנימוס ובשמכם.</p>
          <Button size="lg" className="mt-8" onClick={() => go('signup')}>התחילו {PRICE.trialDays} ימי ניסיון</Button>
        </div>
      </section>
      <footer className="bg-ink-900 border-t border-white/10 text-ink-400 text-sm">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-2">
          <div className="flex flex-wrap gap-4 justify-between"><span>© 2026 גבי – תזכורות תשלום</span><span>אב-טיפוס · נתוני דמו בלבד</span></div>
          <span>תנאי שימוש · מדיניות פרטיות · הצהרת נגישות (טיוטה – לבדיקת עו״ד) · [שם החברה, ח.פ., כתובת: ימולאו לפני השקה]</span>
          <span>חשבונית ירוקה ו-morning הם סימנים מסחריים של בעליהם. גבי הוא מוצר עצמאי ואינו קשור אליהם.</span>
        </div>
      </footer>
    </div>
  );
}

// טיוטה: הטופס לא שולח לשום שירות ולא שומר דבר (גם לא ב-localStorage).
function Waitlist() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  return (
    <form className="mt-8 max-w-md mx-auto" noValidate data-testid="waitlist"
      onSubmit={e => { e.preventDefault(); setMsg(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? 'תודה! (בטיוטה הזו הטופס לא שולח ולא שומר דבר.)' : 'נא להזין כתובת מייל תקינה.'); }}>
      <label htmlFor="wait-email" className="block text-sm text-ink-500 mb-2 text-center">רוצים לשמוע כשהבטא נפתחת?</label>
      <div className="flex gap-2">
        <input id="wait-email" type="email" dir="ltr" autoComplete="email" placeholder="המייל שלכם" value={email} onChange={e => setEmail(e.target.value)}
          className="flex-1 min-w-0 min-h-11 rounded-xl border border-ink-200 bg-white px-3" />
        <Button type="submit" variant="outline">לרשימת ההמתנה</Button>
      </div>
      <p role="status" aria-live="polite" className="text-sm text-ink-500 mt-2 min-h-5 text-center">{msg}</p>
    </form>
  );
}

function HeroPhone() {
  return (
    <div className="relative mx-auto w-[290px]" aria-hidden>
      <div className="absolute -inset-10 bg-brand/25 blur-3xl rounded-full" />
      <div className="relative rounded-[2.4rem] border-[10px] border-ink-700 bg-ink-100 overflow-hidden shadow-pop">
        <div className="bg-white px-4 py-3 text-center text-ink-900 border-b border-ink-200">
          <div className="mx-auto h-9 w-9 rounded-full bg-ink-200 grid place-items-center text-sm font-bold">L</div>
          <div className="text-xs font-bold mt-1">LotemDesign</div>
        </div>
        <div className="p-3 space-y-2 text-ink-900 text-[13px] leading-relaxed min-h-72">
          <div className="text-[10px] text-center text-ink-500">היום 09:00</div>
          <div className="bg-white rounded-2xl rounded-tr-md px-3 py-2 shadow-sm max-w-[90%]">
            סטודיו לוטם עיצוב: שלום אבי, חשבונית 1042 ע"ס 4,680 ₪ טרם סומנה כשולמה. לתשלום: <span className="text-info underline">gabi.example/p/k3T9xQa</span> להפסקה: בקישור
          </div>
          <div className="bg-brand text-ink-900 rounded-2xl rounded-tl-md px-3 py-2 max-w-[70%] mr-auto">תודה, משלם עכשיו 🙏</div>
          <div className="bg-white rounded-xl px-3 py-2 shadow-sm flex items-center gap-2 text-xs"><span className="text-brand-600 text-base">✓</span> שולם · ₪4,680 · התזכורות נעצרו</div>
        </div>
      </div>
    </div>
  );
}

/** מחשבון החזר — הערכה שקופה, לא הבטחה: ההנחות מוצגות ונשלטות על ידי המשתמש. */
function RoiCalculator() {
  const [monthly, setMonthly] = useState(40000);
  const [late, setLate] = useState(25);
  const [hours, setHours] = useState(4);
  const r = roi({ monthlyInvoiced: monthly, latePct: late, hoursChasing: hours });
  const slider = 'w-full accent-[#10B981] h-2 cursor-pointer';
  return (
    <section id="roi" className="bg-ink-900 text-white" aria-labelledby="roi-title">
      <div className="max-w-6xl mx-auto px-4 py-20 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h2 id="roi-title" className="text-3xl md:text-4xl font-extrabold">כמה כסף חוזר אליכם?</h2>
          <p className="text-ink-400 mt-3 text-lg">הזיזו את הסרגלים. החישוב פשוט ושקוף — בלי אותיות קטנות.</p>
          <div className="mt-8 space-y-6">
            <label className="block"><div className="flex justify-between text-sm"><span>חשבוניות בחודש</span><b className="num text-brand">{fmtIls(monthly)}</b></div>
              <input type="range" min={5000} max={300000} step={5000} value={monthly} onChange={e => setMonthly(+e.target.value)} className={slider} aria-label="סכום חשבוניות בחודש" data-testid="roi-monthly" /></label>
            <label className="block"><div className="flex justify-between text-sm"><span>כמה מזה משולם באיחור</span><b className="num text-brand">{late}%</b></div>
              <input type="range" min={0} max={80} step={5} value={late} onChange={e => setLate(+e.target.value)} className={slider} aria-label="אחוז באיחור" /></label>
            <label className="block"><div className="flex justify-between text-sm"><span>שעות בחודש שאתם רודפים אחרי תשלומים</span><b className="num text-brand">{hours}</b></div>
              <input type="range" min={0} max={30} step={1} value={hours} onChange={e => setHours(+e.target.value)} className={slider} aria-label="שעות רדיפה בחודש" /></label>
          </div>
        </div>
        <div className="rounded-2xl bg-white text-ink-900 p-6 md:p-8 shadow-pop" data-testid="roi-result">
          <div className="text-sm text-ink-500">באיחור כל חודש</div>
          <div className="text-2xl font-extrabold num">{fmtIls(r.lateAmount)}</div>
          <div className="mt-5 grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-brand-50 p-4"><div className="text-xs text-ink-500">חוזר מוקדם יותר*</div><div className="text-2xl font-extrabold text-brand-700 num">{fmtIls(r.recovered)}</div></div>
            <div className="rounded-xl bg-ink-50 p-4"><div className="text-xs text-ink-500">שווי הזמן שנחסך**</div><div className="text-2xl font-extrabold num">{fmtIls(r.timeSaved)}</div></div>
          </div>
          <div className="mt-5 flex items-end justify-between border-t border-ink-200 pt-5">
            <div><div className="text-sm text-ink-500">תזרים שמוקדם, מול ₪{GABI_PRICE} לחודש</div><div className="text-4xl font-extrabold font-display text-brand-700 num">×{r.multiple}</div></div>
            <Button onClick={() => go('signup')}>להתחיל ניסיון</Button>
          </div>
          <p className="text-[11px] text-ink-500 mt-4 leading-relaxed">* הכסף הזה שלכם ממילא — גבי מקדים את הגעתו ומקטין את הסיכון שלא יגיע. הערכה: {Math.round(DEFAULT_RECOVERY * 100)}% מהסכום שבאיחור נגבה מוקדם יותר בזכות תזכורות קבועות — השערה, לא התחייבות. ** לפי ₪150 לשעה. התוצאה בפועל תלויה בלקוחות שלכם.</p>
        </div>
      </div>
    </section>
  );
}
