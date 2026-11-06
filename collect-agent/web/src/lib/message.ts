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

/** השלב הבא לפי מספר התזכורות שכבר נשלחו. */
export const nextStep = (inv: Invoice): Step => STEP_ORDER[Math.min(inv.reminders.length, 3)];
/** "אחרונה" והודעה ראשונה ללקוח תמיד דורשות אישור בעלים (תואם לבקאנד). */
export const requiresApproval = (step: Step, b: Business, isFirstToCustomer: boolean) =>
  step === 'final' || isFirstToCustomer || !b.autoApprove;

// ⚠️ מראה מדויקת של app/templates.py STEPS (שדות {biz} {name} {num} {amount} {link} {unsub}).
// שינוי נוסח = לשנות קודם בבקאנד (שם נאכפים MARKETING_WORDS/THREAT_WORDS) ואז כאן.
export const TEMPLATES: Record<Step, { sms: string; subject: string; email: string }> = {
  friendly: {
    sms: '{biz}: שלום {name}, תזכורת ידידותית - חשבונית {num} על {amount} טרם שולמה. לתשלום: {link} להסרה: {unsub}',
    subject: 'תזכורת ידידותית: חשבונית {num} מ-{biz}',
    email: 'שלום {name},\n\nזו תזכורת ידידותית שחשבונית {num} על סך {amount} טרם סומנה כשולמה.\nאפשר לשלם בקישור: {link}\n\nאם כבר שילמתם — תודה רבה, ואפשר להתעלם מהודעה זו.\n\nבברכה,\n{biz}',
  },
  second: {
    sms: '{biz}: שלום {name}, חשבונית {num} על {amount} עדיין פתוחה. לתשלום: {link} לשאלות השיבו להודעה. להסרה: {unsub}',
    subject: 'חשבונית {num} מ-{biz} עדיין פתוחה',
    email: 'שלום {name},\n\nחשבונית {num} על סך {amount} עדיין פתוחה.\nלתשלום: {link}\n\nאם יש שאלה, או אם נוח לכם לפרוס את הסכום — פשוט השיבו למייל הזה.\n\nבברכה,\n{biz}',
  },
  plan_offer: {
    sms: '{biz}: שלום {name}, אפשר לפרוס את חשבונית {num} ({amount}) לתשלומים ללא תוספת - השיבו פריסה. לתשלום: {link} להסרה: {unsub}',
    subject: 'אפשרות פריסה לחשבונית {num}',
    email: 'שלום {name},\n\nרצינו לוודא שהכול בסדר לגבי חשבונית {num} ({amount}).\nאם נוח לכם, אפשר לפרוס את הסכום לכמה תשלומים ללא כל תוספת — השיבו "פריסה".\nלתשלום מלא: {link}\n\nבברכה,\n{biz}',
  },
  final: {
    sms: '{biz}: שלום {name}, תזכורת אוטומטית אחרונה לחשבונית {num} ({amount}). נחזור אליכם אישית. לתשלום: {link} להסרה: {unsub}',
    subject: 'תזכורת אחרונה: חשבונית {num} מ-{biz}',
    email: 'שלום {name},\n\nזו התזכורת האוטומטית האחרונה לגבי חשבונית {num} ({amount}).\nבעל העסק ייצור איתכם קשר אישית בהמשך.\nלתשלום: {link}\n\nבברכה,\n{biz}',
  },
};
/** תואם templates.fmt_amount: "12,870 ₪" */
export const fmtAmountBackend = (ils: number) => `${Math.round(ils).toLocaleString('en-US')} ₪`;

function fields(inv: Invoice, c: Customer, b: Business): Record<string, string> {
  return { biz: b.name, name: c.name || 'לקוח/ה יקר/ה', num: inv.number, amount: fmtAmountBackend(inv.amount), link: inv.payUrl, unsub: demoUnsubUrl(c) };
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
