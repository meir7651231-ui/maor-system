import { Logo, LogoMark } from '../components/Logo.tsx';
import { Button } from '../components/ui.tsx';
import { go } from '../router.ts';

// מחיר — השערה לבדיקה (הנחיית מנהל 6.11): חבילה אחת, ₪119 לחודש, 14 ימי ניסיון. מנוי קבוע, לא אחוז מהגבייה.
export const PRICE = { monthly: 119, trialDays: 14 } as const;
export const PLAN_FEATURES = [
  'חיבור לחשבונית ירוקה (קריאה בלבד)',
  'תזכורות ב-SMS ובמייל, עם קישור תשלום בכל הודעה',
  'סולם 4 תזכורות מנומסות — אתם מאשרים',
  'זיהוי תשובות: "שילמתי", "הסר", בקשת פריסה',
  'הצעות פריסה ללא ריבית, באישורכם',
  'שעות שליחה סבירות, לא בשבת ובחג',
  'עד 150 חשבוניות פתוחות · 300 תזכורות SMS בחודש',
];

const STEPS = [
  ['🔌', 'מחברים פעם אחת', 'מדביקים מפתח מחשבונית ירוקה. גבי מושך רק חשבוניות פתוחות — קריאה בלבד.'],
  ['☕', 'כל בוקר — רשימה מוכנה', 'גבי מכין תזכורות מנומסות ב-SMS ובמייל, עם קישור תשלום ישיר לחשבונית.'],
  ['✅', 'מאשרים בלחיצה', 'רואים בדיוק מה יישלח. אישור — וגבי שולח בשעות סבירות, ועוצר כשהלקוח משלם.'],
];

const FAQ = [
  ['זה לא יפגע ביחסים עם הלקוחות?', 'הנוסחים מנומסים כברירת מחדל, בלי איומים ובלי שיווק. אתם רואים ומאשרים כל הודעה ראשונה וכל הודעה אחרונה.'],
  ['למה SMS ומייל ולא וואטסאפ?', 'מדיניות WhatsApp Business אוסרת שימוש לגביית חובות. SMS ומייל מגיעים לכל לקוח, בלי סיכון לחסימת המספר שלכם — ובכל הודעה יש קישור תשלום ישיר.'],
  ['מתי ההודעות נשלחות?', 'א׳–ה׳ 9:00–19:00, ו׳ עד 12:00, לעולם לא בשבת ובחג. לכל היותר הודעה אחת ל-72 שעות לאותו לקוח.'],
  ['זה חוקי?', 'תזכורת תשלום ללקוח קיים על חשבונית שלו היא הודעה שירותית ולא "דבר פרסומת" לפי סעיף 30א לחוק התקשורת — כל עוד אין בה תוכן שיווקי. כל הודעה מזהה את העסק וכוללת קישור הסרה.'],
  ['כמה זה עולה?', `₪${PRICE.monthly} לחודש לפני מע״מ, אחרי ${PRICE.trialDays} ימי ניסיון חינם. בלי כרטיס אשראי בהרשמה, ביטול בכל רגע.`],
  ['אתם לוקחים אחוז מהכסף?', 'לא. מנוי חודשי קבוע. הכסף עובר ישירות מהלקוח אליכם דרך קישור התשלום שלכם.'],
];

export function Landing() {
  return (
    <div className="bg-white">
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur border-b border-ink-200/70">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Logo size={34} />
          <nav className="hidden md:flex gap-6 text-sm font-medium text-ink-700">
            <a href="#how" onClick={e => { e.preventDefault(); document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' }); }}>איך זה עובד</a>
            <a href="#pricing" onClick={e => { e.preventDefault(); document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }); }}>מחירים</a>
            <a href="#/dashboard">דמו חי</a>
          </nav>
          <Button size="sm" onClick={() => go('signup')}>{PRICE.trialDays} ימי ניסיון</Button>
        </div>
      </header>

      <section className="bg-ink-900 text-white overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block rounded-full bg-brand/15 text-brand px-3 py-1 text-sm font-bold mb-5">לעסקים קטנים בישראל</span>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-[1.1]">גבי – העוזר<br /><span className="text-brand">לגביית חובות</span></h1>
            <p className="text-lg md:text-xl text-ink-400 mt-6 leading-relaxed max-w-lg">
              גבי שולח ללקוחות תזכורות תשלום מנומסות ב-SMS ובמייל, עם קישור תשלום ישיר. אתם רק מאשרים — והכסף מגיע.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Button size="lg" onClick={() => go('signup')}>התחילו {PRICE.trialDays} ימי ניסיון חינם</Button>
              <Button size="lg" variant="ghost" className="text-white hover:bg-white/10" onClick={() => go('dashboard')}>לצפייה בדמו ←</Button>
            </div>
            <p className="text-sm text-ink-400 mt-4">₪{PRICE.monthly} לחודש אחרי הניסיון · בלי כרטיס אשראי · ביטול בכל רגע</p>
          </div>
          <HeroPhone />
        </div>
      </section>

      <section className="border-b border-ink-200">
        <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[['2 דק׳', 'הקמה'], ['14', 'ימי ניסיון חינם'], ['0', 'הודעות בשבת'], ['0%', 'עמלה מהגבייה']].map(([n, l]) => (
            <div key={l}><div className="text-3xl md:text-4xl font-extrabold text-brand-700 font-display">{n}</div><div className="text-sm text-ink-500 mt-1">{l}</div></div>
          ))}
        </div>
      </section>

      <section id="how" className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center">איך גבי עובד</h2>
        <p className="text-center text-ink-500 mt-3 text-lg">שלושה צעדים, ואתם כבר לא רודפים אחרי אף אחד.</p>
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          {STEPS.map(([i, t, d], n) => (
            <div key={t} className="rounded-2xl border border-ink-200 p-6 relative">
              <div className="text-3xl">{i}</div>
              <div className="absolute top-6 left-6 text-5xl font-extrabold text-ink-100 font-display">{n + 1}</div>
              <h3 className="text-xl font-extrabold mt-4">{t}</h3>
              <p className="text-ink-500 mt-2 leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-brand-50">
        <div className="max-w-6xl mx-auto px-4 py-16 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-3xl font-extrabold">מנומס. בזמן. ועוצר בדיוק כשצריך.</h2>
            <ul className="mt-6 space-y-3 text-lg">
              {['לקוח שילם? התזכורות נעצרות מעצמן.', 'ביקש הסרה? לא נפנה אליו יותר.', 'יש מחלוקת? גבי עוצר ומעביר אליכם.', 'רוצה לפרוס? גבי מציע תשלומים בלי ריבית — באישורכם.'].map(t => (
                <li key={t} className="flex gap-3"><span className="text-brand-600 font-bold">✓</span>{t}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-white shadow-card p-6">
            <div className="text-sm text-ink-500 mb-3">הסולם שגבי מפעיל</div>
            {[['+1 יום', 'תזכורת ידידותית', 'bg-brand'], ['+7 ימים', 'תזכורת שנייה', 'bg-due'], ['+14 ימים', 'הצעת פריסה', 'bg-late'], ['+30 ימים', 'תזכורת אחרונה · תמיד באישורכם', 'bg-ink-900']].map(([d, t, c]) => (
              <div key={t} className="flex items-center gap-3 py-2.5"><span className={`h-3 w-3 rounded-full ${c}`} /><b className="w-20 num text-right">{d}</b><span>{t}</span></div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center">מחיר אחד. פשוט.</h2>
        <p className="text-center text-ink-500 mt-3 text-lg">{PRICE.trialDays} ימי ניסיון חינם · בלי כרטיס אשראי · בלי אחוזים מהגבייה</p>
        <div className="mt-12 max-w-md mx-auto rounded-2xl bg-ink-900 text-white p-8 ring-4 ring-brand/30" data-testid="price-card">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-extrabold">גבי</h3>
            <span className="text-xs font-bold bg-brand text-ink-900 rounded-full px-2.5 py-1">{PRICE.trialDays} יום חינם</span>
          </div>
          <div className="mt-5 flex items-baseline gap-1"><span className="text-5xl font-extrabold font-display num">₪{PRICE.monthly}</span><span className="text-ink-400">/חודש · לפני מע״מ</span></div>
          <p className="text-sm text-ink-400 mt-2">אחרי תקופת הניסיון. ביטול בכל רגע.</p>
          <ul className="mt-6 space-y-2.5 text-sm">
            {PLAN_FEATURES.map(f => <li key={f} className="flex gap-2"><span className="text-brand">✓</span>{f}</li>)}
          </ul>
          <Button className="mt-8 w-full" size="lg" onClick={() => go('signup')}>התחילו {PRICE.trialDays} ימי ניסיון</Button>
        </div>
        <p className="text-center text-xs text-ink-500 mt-4">מחיר בבדיקה (פיילוט). תזכורות מעבר למכסה — לפי עלות.</p>
      </section>

      <section className="bg-ink-50">
        <div className="max-w-3xl mx-auto px-4 py-20">
          <h2 className="text-3xl font-extrabold text-center mb-10">שאלות נפוצות</h2>
          {FAQ.map(([q, a]) => (
            <details key={q} className="group bg-white rounded-xl border border-ink-200 mb-3 open:shadow-card">
              <summary className="cursor-pointer list-none p-5 font-bold flex justify-between items-center">{q}<span className="text-brand-600 group-open:rotate-45 transition-transform text-2xl leading-none">+</span></summary>
              <p className="px-5 pb-5 text-ink-700 leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="bg-ink-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-16 text-center">
          <LogoMark size={56} className="mx-auto" />
          <h2 className="text-3xl md:text-4xl font-extrabold mt-5">מספיק לרדוף אחרי הכסף שלכם.</h2>
          <p className="text-ink-400 mt-3 text-lg">תנו לגבי לעשות את זה — בנימוס.</p>
          <Button size="lg" className="mt-8" onClick={() => go('signup')}>התחילו {PRICE.trialDays} ימי ניסיון חינם</Button>
        </div>
      </section>
      <footer className="bg-ink-900 border-t border-white/10 text-ink-400 text-sm">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-wrap gap-4 justify-between">
          <span>© 2026 גבי – העוזר לגביית חובות</span><span>אב-טיפוס · נתוני דמו בלבד</span>
        </div>
      </footer>
    </div>
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
            סטודיו לוטם עיצוב: שלום אבי, תזכורת ידידותית - חשבונית 1042 על 4,680 ₪ טרם שולמה. לתשלום: <span className="text-info underline">pay.example/i/1042</span> להסרה: <span className="text-info underline">gabi.example/u/c1</span>
          </div>
          <div className="bg-brand text-ink-900 rounded-2xl rounded-tl-md px-3 py-2 max-w-[70%] mr-auto">תודה, משלם עכשיו 🙏</div>
          <div className="bg-white rounded-xl px-3 py-2 shadow-sm flex items-center gap-2 text-xs"><span className="text-brand-600 text-base">✓</span> שולם · ₪4,680 · התזכורות נעצרו</div>
        </div>
      </div>
    </div>
  );
}
