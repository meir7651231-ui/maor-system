// גבי · מודל הנתונים של הממשק (חוזה מול הבקאנד — ראו collect-agent/DESIGN.md §API)
// ערוצים: SMS + מייל בלבד (הכרעת מוצר 6.11.2026 — WhatsApp אוסר debt collection במדיניות העסקית).
export type Channel = 'sms' | 'email';
/** תואם ל-app/templates.py STEPS: friendly → second → plan_offer → final */
export type Step = 'friendly' | 'second' | 'plan_offer' | 'final';
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
}
export type SmsProvider = 'inforu' | '019' | 'twilio';
export interface Business {
  name: string;
  ownerName: string;
  phone: string;
  email: string;
  vatId: string;
  smsSender: string;       // שם שולח אלפאנומרי (עד 11 תווים לטיניים)
  smsProvider: SmsProvider;
  channels: Record<Channel, boolean>;
  autoApprove: boolean;
  sendWindow: { from: string; to: string };
  skipShabbat: boolean;
  cadenceDays: [number, number, number, number]; // ימים אחרי מועד-הפירעון לכל שלב
}
