// גבי · מודל הנתונים של הממשק (חוזה מול הבקאנד — ראו collect-agent/DESIGN.md §API)
// ערוצים: SMS + מייל בלבד (הכרעת מוצר 6.11.2026 — WhatsApp אוסר debt collection במדיניות העסקית).
export type Channel = 'sms' | 'email';
/** תואם ל-app/templates.py STEPS: friendly → plan_offer → final (3 לכל היותר) */
export type Step = 'friendly' | 'plan_offer' | 'final';
export type InvoiceStatus = 'open' | 'reminded' | 'promised' | 'paid' | 'disputed';

export interface Customer { id: string; name: string; phone?: string; email?: string; contact?: string; optedOut?: boolean;
  /** בחי: מזהה הלקוח בשרת + סיבת השהיה ('paid_claim' וכו׳) */ backendId?: number; paused?: string | null }
export interface Reminder { at: string; step: Step; channel: Channel; status: 'sent' | 'delivered' | 'opened' | 'replied' | 'failed' }
export interface Invoice {
  id: string;
  number: string;
  customerId: string;
  amount: number;       // ₪ שלמים, כולל מע"מ (בבקאנד: agorot)
  issuedAt: string;     // ISO yyyy-mm-dd
  dueAt: string;        // ISO yyyy-mm-dd
  status: InvoiceStatus;
  payUrl: string;       // קישור התשלום של החשבונית (למשל דף התשלום בחשבונית ירוקה)
  reminders: Reminder[];
  promisedAt?: string;
  note?: string;
  /** מאיפה החשבונית: API (מתרענן לבד) או CSV (בעל העסק מאשר שהסכום עדיין פתוח) */
  source?: 'api' | 'csv';
}
/** 019 ראשי, InforU גיבוי — מאחורי adapter יחיד בשרת (dry-run בלבד). */
export type SmsProvider = '019' | 'inforu';
/** תשלום = קישור לעמוד התשלום של העסק. גבי לא מחזיק כסף. */
export type PayProvider = 'greeninvoice' | 'meshulam' | 'bit';
/** מקור החשבוניות: API תחילה, CSV חלופה. */
export type DataSource = 'api' | 'csv';
/** כללי המוצר (הכרעת מאיר 6.11) — לא ניתנים לשינוי בהגדרות. */
export const PRODUCT_RULES = { maxReminders: 3, window: { from: '08:00', to: '20:00' }, fridayUntil: '12:00', perMessageApproval: true } as const;
/** אותם כללים במילים — מוצגים בהגדרות כקבועים (🔒). */
export const RULES = [
  'רק ללקוחות קיימים של העסק, על חשבוניות אמיתיות',
  'כל הודעה יוצאת רק אחרי שאישרתם אותה',
  'הסכום נבדק מול חשבונית ירוקה לפני כל שליחה',
  'בכל הודעה יש דרך להפסיק לקבל תזכורות',
  'בלי איומים, בלי שיווק ובלי פנייה לאף אחד אחר',
  'עד 3 תזכורות לחשבונית. אחר כך גבי עוצר ומעדכן אתכם',
  '08:00–20:00 בלבד. לא בשישי אחר הצהריים, לא בשבת ולא בחג',
] as const;
export interface Business {
  name: string;
  ownerName: string;
  phone: string;
  email: string;
  vatId: string;
  smsSender: string;       // שם שולח אלפאנומרי (עד 11 תווים לטיניים)
  smsProvider: SmsProvider;  // ראשי; השני משמש גיבוי
  payProvider: PayProvider;
  payPageUrl: string;         // עמוד התשלום של העסק (מוק: example)
  dataSource: DataSource;
  channels: Record<Channel, boolean>;
  cadenceDays: [number, number, number]; // ימים אחרי מועד-הפירעון: תזכורת 1/2/3 (עד 3, ואז עצירה)
}
