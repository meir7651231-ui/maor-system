// נתוני דמו בלבד — שמות, טלפונים ומספרי ח.פ. בדויים. אין חיבור לשום שירות.
import type { Business, Customer, Invoice } from '../lib/domain.ts';

export const DEMO_TODAY = '2026-11-06';

export const demoBusiness: Business = {
  name: 'סטודיו לוטם עיצוב',
  ownerName: 'לוטם',
  phone: '050-000-0000',
  vatId: '000000000',
  email: 'lotem@example.com',
  smsSender: 'LotemDesign',
  smsProvider: '019',
  channels: { sms: true, email: true },
  payProvider: 'greeninvoice',
  payPageUrl: 'https://pay.example/lotem',
  dataSource: 'api',
  cadenceDays: [1, 7, 14],
};

export const demoCustomers: Customer[] = [
  { id: 'c1', name: 'קפה הגפן בע״מ', phone: '0500000001', email: 'client01@example.com', contact: 'אבי כהן' },
  { id: 'c2', name: 'מספרת שירן', phone: '0500000002', email: 'client02@example.com', contact: 'שירן לוי' },
  { id: 'c3', name: 'דני מזרחי – שיפוצים', phone: '0500000003', email: 'client03@example.com', contact: 'דני מזרחי' },
  { id: 'c4', name: 'גן ילדים פרפר', phone: '0500000004', contact: 'מיכל' },
  { id: 'c5', name: 'קליניקת ד״ר רון', phone: '0500000005', email: 'client05@example.com', contact: 'רון ברק' },
  { id: 'c6', name: 'פיצה נפוליטנה', phone: '0500000006', email: 'client06@example.com', contact: 'יוסי' },
  { id: 'c7', name: 'יעל אברהם – אימון אישי', phone: '0500000007', email: 'client07@example.com', contact: 'יעל אברהם' },
  { id: 'c8', name: 'משרד עו״ד גולן', phone: '0500000008', email: 'client08@example.com', contact: 'נועם גולן' },
];

export const demoInvoices: Invoice[] = [
  { id: 'i1', number: '1042', customerId: 'c1', amount: 4680, payUrl: 'https://pay.example/i/1042', issuedAt: '2026-09-01', dueAt: '2026-10-01', status: 'reminded',
    reminders: [{ at: '2026-10-04', step: 'friendly', channel: 'sms', status: 'delivered' }, { at: '2026-10-11', step: 'plan_offer', channel: 'sms', status: 'delivered' }] },
  { id: 'i2', number: '1047', customerId: 'c2', amount: 1170, payUrl: 'https://pay.example/i/1047', issuedAt: '2026-10-10', dueAt: '2026-10-25', status: 'open', reminders: [] },
  { id: 'i3', number: '1031', customerId: 'c3', amount: 12870, payUrl: 'https://pay.example/i/1031', issuedAt: '2026-07-15', dueAt: '2026-08-14', status: 'reminded',
    reminders: [{ at: '2026-08-17', step: 'friendly', channel: 'sms', status: 'delivered' }, { at: '2026-08-24', step: 'plan_offer', channel: 'sms', status: 'delivered' }, { at: '2026-09-04', step: 'final', channel: 'sms', status: 'delivered' }] },
  { id: 'i4', number: '1050', customerId: 'c4', amount: 2340, payUrl: 'https://pay.example/i/1050', issuedAt: '2026-10-20', dueAt: '2026-11-04', status: 'open', reminders: [] },
  { id: 'i5', number: '1044', customerId: 'c5', amount: 7020, payUrl: 'https://pay.example/i/1044', issuedAt: '2026-09-20', dueAt: '2026-10-20', status: 'promised', promisedAt: '2026-11-10',
    reminders: [{ at: '2026-10-23', step: 'friendly', channel: 'sms', status: 'replied' }], note: 'הבטיח להעביר ב-10.11' },
  { id: 'i6', number: '1052', customerId: 'c6', amount: 890, payUrl: 'https://pay.example/i/1052', issuedAt: '2026-10-28', dueAt: '2026-11-12', status: 'open', reminders: [] },
  { id: 'i7', number: '1038', customerId: 'c7', amount: 1950, payUrl: 'https://pay.example/i/1038', issuedAt: '2026-08-25', dueAt: '2026-09-24', status: 'reminded',
    reminders: [{ at: '2026-09-27', step: 'friendly', channel: 'sms', status: 'delivered' }] },
  { id: 'i8', number: '1046', customerId: 'c8', amount: 9360, payUrl: 'https://pay.example/i/1046', issuedAt: '2026-10-01', dueAt: '2026-10-31', status: 'open', reminders: [] },
  { id: 'i9', number: '1029', customerId: 'c6', amount: 640, payUrl: 'https://pay.example/i/1029', issuedAt: '2026-07-01', dueAt: '2026-07-31', status: 'disputed',
    reminders: [{ at: '2026-08-03', step: 'friendly', channel: 'sms', status: 'replied' }], note: 'טוען שהמנה האחרונה לא סופקה' },
  { id: 'i10', number: '1040', customerId: 'c2', amount: 1170, payUrl: 'https://pay.example/i/1040', issuedAt: '2026-09-10', dueAt: '2026-09-25', status: 'paid',
    reminders: [{ at: '2026-09-28', step: 'friendly', channel: 'sms', status: 'replied' }] },
  { id: 'i11', number: '1043', customerId: 'c4', amount: 2340, payUrl: 'https://pay.example/i/1043', issuedAt: '2026-09-20', dueAt: '2026-10-05', status: 'paid', reminders: [] },
  { id: 'i12', number: '1036', customerId: 'c1', amount: 3510, payUrl: 'https://pay.example/i/1036', issuedAt: '2026-08-10', dueAt: '2026-09-09', status: 'paid',
    reminders: [{ at: '2026-09-12', step: 'friendly', channel: 'sms', status: 'delivered' }] },
];

/** נגבה בחודשים האחרונים (₪) — לגרף בדשבורד. */
export const demoCollectedByMonth = [
  { month: 'יוני', amount: 18400 }, { month: 'יולי', amount: 22150 }, { month: 'אוג׳', amount: 19800 },
  { month: 'ספט׳', amount: 26300 }, { month: 'אוק׳', amount: 31200 }, { month: 'נוב׳', amount: 7020 },
];
