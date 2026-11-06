// מסך ההגדרות מול השרת (GET/PUT /settings, חוזה DESIGN.md §3ב). טהור — נבדק ב-tests.
export type PayProvider = 'greeninvoice' | 'meshulam' | 'bit';
export interface DesignSettings {
  business_name: string; owner_name: string; vat_id: string; reply_email: string;
  sms: { primary: string; backup: string; sender: string };
  pay: { provider: PayProvider; page_url: string; is_mock?: boolean };
  source: { type: 'api' | 'csv'; api_connected: boolean };
  cadence_days: number[];
  rules: { max_reminders: number; window: string; friday_and_holiday_eve?: string; approval: string };
  pricing?: { month_ils: number; year_ils: number; trial_days: number; card_required: boolean };
}
export interface SettingsForm {
  business_name: string; owner_name: string; vat_id: string; reply_email: string;
  sender: string; pay_provider: PayProvider; pay_url: string;
}
export const toForm = (s: DesignSettings): SettingsForm => ({
  business_name: s.business_name ?? '', owner_name: s.owner_name ?? '', vat_id: s.vat_id ?? '', reply_email: s.reply_email ?? '',
  sender: s.sms?.sender ?? '', pay_provider: s.pay?.provider ?? 'greeninvoice', pay_url: s.pay?.page_url ?? '',
});

/** רק מה שהשתנה — PUT חלקי. שדות קבועים (rules/cadence/source/pricing) לעולם לא נשלחים. */
export function diffPatch(a: SettingsForm, b: SettingsForm): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of ['business_name', 'owner_name', 'vat_id', 'reply_email'] as const) if (a[k] !== b[k]) out[k] = b[k].trim();
  if (a.sender !== b.sender) out.sms = { sender: b.sender.trim() };
  const pay: Record<string, string> = {};
  if (a.pay_provider !== b.pay_provider) pay.provider = b.pay_provider;
  if (a.pay_url !== b.pay_url || (a.pay_provider !== b.pay_provider)) pay.page_url = b.pay_url.trim();
  if (Object.keys(pay).length) out.pay = pay;
  return out;
}

/** אותם כללים כמו השרת (app/settings_api.py SettingsIn) — כדי שהמשתמש יראה שגיאה לפני השליחה. */
export function validate(f: SettingsForm): Partial<Record<keyof SettingsForm, string>> {
  const e: Partial<Record<keyof SettingsForm, string>> = {};
  const name = f.business_name.trim();
  if (name.length < 2 || name.length > 40) e.business_name = '2–40 תווים';
  else if (/[<>{}\\]|https?:\/\//.test(name)) e.business_name = 'בלי קישורים או תווים מיוחדים';
  if (f.owner_name && (f.owner_name.trim().length < 2 || /[<>{}\\]|https?:\/\//.test(f.owner_name))) e.owner_name = 'שם לא תקין';
  if (f.vat_id && !vatOk(f.vat_id)) e.vat_id = '9 ספרות עם ספרת ביקורת תקינה';
  if (f.reply_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.reply_email)) e.reply_email = 'כתובת מייל לא תקינה';
  if (!/^[A-Za-z0-9]{1,11}$/.test(f.sender)) e.sender = 'עד 11 אותיות לועזיות/ספרות, בלי רווחים';
  if (f.pay_url && !/^https:\/\/\S+$/.test(f.pay_url)) e.pay_url = 'כתובת https מלאה';
  return e;
}
/** ספרת ביקורת של מספר עוסק/ח.פ. (כמו בשרת). */
export function vatOk(v: string): boolean {
  if (!/^\d{9}$/.test(v)) return false;
  let tot = 0;
  for (let i = 0; i < 9; i++) { const x = Number(v[i]) * (i % 2 === 0 ? 1 : 2); tot += Math.floor(x / 10) + (x % 10); }
  return tot % 10 === 0;
}

const FIELD_HE: Record<string, string> = {
  sms_sender_id: 'שם השולח', business_name: 'שם העסק', owner_name: 'שם לחתימה', vat_id: 'ע.מ./ח.פ.',
  email_reply_to: 'מייל לתשובות', payment_link: 'קישור התשלום', payment_provider: 'ספק התשלום',
};
/** הודעת 422 מהשרת ⇒ עברית (קודי שדה של pydantic מתורגמים; טקסט עברי נשאר כמו שהוא). */
export function explainSettingsError(detail: string): string {
  return detail.split('; ').map(part => {
    const m = /^(\w+): (.*)$/.exec(part);
    if (!m) return part;
    const field = FIELD_HE[m[1]] ?? m[1];
    const msg = /should match pattern|String should have/.test(m[2]) ? 'ערך לא תקין' : m[2];
    return `${field}: ${msg}`;
  }).join(' · ');
}

/** כשל ייבוא CSV ⇒ עברית ברורה. 403 = שער הבטא (נתוני דמו בלבד), לא תקלה; לא יובאה אף שורה. */
export function explainImportError(status: number | undefined, detail: string): string {
  if (status === 403) return 'הייבוא נחסם: בשלב הבטא (dry-run) מותר לייבא רק נתוני דמו מסומנים (טלפון 05X-000XXXX, מייל בדומיין example.*). לא יובאה אף שורה, ושום הודעה לא נשלחת.';
  if (status === 400) return `הקובץ לא נקלט: ${detail}`;
  return `הייבוא נכשל: ${detail}`;
}
