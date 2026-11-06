// מחולל נוסחי תזכורת SMS + מייל — טהור ודטרמיניסטי.
// הנוסחים = מראה של app/templates.py כדי שהתצוגה המקדימה = מה שיישלח בפועל.
// ⚖️ חוק התקשורת סעיף 30א: תזכורת תשלום ללקוח קיים איננה "דבר פרסומת" — לכן אסור לערבב בה שיווק/מבצעים.
import type { Business, Customer, Invoice, Step } from './domain.ts';

export const STEP_LABEL: Record<Step, string> = {
  friendly: 'תזכורת ידידותית', second: 'תזכורת שנייה', plan_offer: 'הצעת פריסה', final: 'תזכורת אחרונה',
};
export const STEP_ORDER: Step[] = ['friendly', 'second', 'plan_offer', 'final'];
/** כתובת הסרה בדמו (בבקאנד: `{PUBLIC_BASE_URL}/u/{unsub_token}`, service.unsub_url). */
export const demoUnsubUrl = (c: Customer) => `https://gabi.example/u/${c.id}`;
/** קישור קצר בדמו (בבקאנד: `{PUBLIC_BASE_URL}/p/{short_code}`, 7 תווים, service.short_url). */
export const demoShortUrl = (inv: Invoice) => `https://gabi.example/p/${inv.id.padEnd(7, 'x').slice(0, 7)}`;
const ORG = /בע["״]?מ|חברת|עמותת|מרפאת|משרד|סטודיו|קבוצת|ltd|inc|llc/i;
/** מראה של templates.first_name: שם פרטי; שם ארגון ⇒ מלא. */
export const firstName = (name: string) => { const n = (name || '').trim(); return !n ? '' : ORG.test(n) ? n : n.split(/\s+/)[0]; };

/** השלב הבא לפי מספר התזכורות שכבר נשלחו. */
export const nextStep = (inv: Invoice): Step => STEP_ORDER[Math.min(inv.reminders.length, 3)];
/** "אחרונה" והודעה ראשונה ללקוח תמיד דורשות אישור בעלים (תואם לבקאנד). */
export const requiresApproval = (step: Step, b: Business, isFirstToCustomer: boolean) =>
  step === 'final' || isFirstToCustomer || !b.autoApprove;

// ⚠️ מראה מדויקת של app/templates.py STEPS (שדות {biz} {name} {first} {num} {amount} {link} {unsub} {short} {stop} {ask} {plan_cta}).
// SMS: קישור קצר אחד `{PUBLIC_BASE_URL}/p/{code}` (עמוד תשלום/פריסה/שילמתי/הפסקה) ⇒ ≤2 חלקים.
// שינוי נוסח = לשנות קודם בבקאנד (שם נאכפים MARKETING_WORDS/THREAT_WORDS) ואז כאן.
export const TEMPLATES: Record<Step, { sms: string; subject: string; email: string }> = {
  friendly: {
    sms: '{biz}: שלום {first}, חשבונית {num} ע"ס {amount} טרם סומנה כשולמה. לתשלום: {short} {stop}',
    subject: 'תזכורת ידידותית: חשבונית {num} מ-{biz}',
    email: 'שלום {name},\n\nזו תזכורת ידידותית שחשבונית {num} על סך {amount} טרם סומנה כשולמה.\nאפשר לשלם בקישור: {link}\n\nאם כבר שילמתם — תודה רבה, ואפשר להתעלם מהודעה זו.\n\nבברכה,\n{biz}',
  },
  second: {
    sms: '{biz}: שלום {first}, חשבונית {num} ע"ס {amount} פתוחה. לתשלום: {short}{ask} {stop}',
    subject: 'חשבונית {num} מ-{biz} עדיין פתוחה',
    email: 'שלום {name},\n\nחשבונית {num} על סך {amount} עדיין פתוחה.\nלתשלום: {link}\n\nאם יש שאלה, או אם נוח לכם לפרוס את הסכום — פשוט השיבו למייל הזה.\n\nבברכה,\n{biz}',
  },
  plan_offer: {
    sms: '{biz}: {first}, אפשר לפרוס את חשבונית {num} ({amount}) ללא תוספת. {plan_cta}: {short} {stop}',
    subject: 'אפשרות פריסה לחשבונית {num}',
    email: 'שלום {name},\n\nרצינו לוודא שהכול בסדר לגבי חשבונית {num} ({amount}).\nאם נוח לכם, אפשר לפרוס את הסכום לכמה תשלומים ללא כל תוספת — השיבו "פריסה".\nלתשלום מלא: {link}\n\nבברכה,\n{biz}',
  },
  final: {
    sms: '{biz}: {first}, תזכורת אוטומטית אחרונה לחשבונית {num} ({amount}). לתשלום: {short} {stop}',
    subject: 'תזכורת אחרונה: חשבונית {num} מ-{biz}',
    email: 'שלום {name},\n\nזו התזכורת האוטומטית האחרונה לגבי חשבונית {num} ({amount}).\nבעל העסק ייצור איתכם קשר אישית בהמשך.\nלתשלום: {link}\n\nבברכה,\n{biz}',
  },
};
/** תואם templates.fmt_amount: "12,870 ₪" */
export const fmtAmountBackend = (ils: number) => `${Math.round(ils).toLocaleString('en-US')} ₪`;

function fields(inv: Invoice, c: Customer, b: Business): Record<string, string> {
  // מראה של templates.fields (two_way=False — שם שולח אלפאנומרי)
  return { biz: b.name, name: c.name || 'לקוח/ה יקר/ה', first: firstName(c.name) || 'שלום', num: inv.number,
    amount: fmtAmountBackend(inv.amount), link: inv.payUrl, unsub: demoUnsubUrl(c), short: demoShortUrl(inv),
    stop: 'להפסקה: בקישור', ask: '', plan_cta: 'פריסה/תשלום' };
}
const fill = (t: string, f: Record<string, string>) => t.replace(/\{(\w+)\}/g, (_, k: string) => f[k] ?? `{${k}}`);

export function buildSms(inv: Invoice, c: Customer, b: Business, step: Step): string {
  return fill(TEMPLATES[step].sms, fields(inv, c, b));
}

export interface Email { subject: string; paragraphs: string[]; cta: string; footer: string; unsub: string }
export function buildEmail(inv: Invoice, c: Customer, b: Business, step: Step): Email {
  const f = fields(inv, c, b);
  return {
    subject: fill(TEMPLATES[step].subject, f),
    paragraphs: fill(TEMPLATES[step].email, f).split('\n\n'),
    cta: 'לתשלום',
    footer: `הודעה אוטומטית מטעם ${b.name}.`,
    unsub: f.unsub,
  };
}

/** ספירת מקטעי SMS. עברית ⇒ UCS-2: 70 תווים למקטע בודד, 67 במשורשר. */
export function smsSegments(text: string): { chars: number; segments: number; unicode: boolean } {
  const unicode = [...text].some(ch => ch.codePointAt(0)! > 127);
  const chars = [...text].length;
  const single = unicode ? 70 : 160, multi = unicode ? 67 : 153;
  return { chars, unicode, segments: chars <= single ? 1 : Math.ceil(chars / multi) };
}
