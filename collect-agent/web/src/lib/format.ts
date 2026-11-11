// פונקציות טהורות — בלי DOM. נבדקות ב-tests/.
import { fmtAmountBackend } from './message.ts';
const ils0 = new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 });
const ils2 = new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', minimumFractionDigits: 2, maximumFractionDigits: 2 });
/** ₪ שלמים בלי אגורות; אחרת תמיד 2 ספרות (3,450.50 ולא 3,450.5). */
export const fmtIls = (n: number): string => { const r = Math.round(n * 100) / 100; return (Number.isInteger(r) ? ils0 : ils2).format(r); };

/** סכום במטבע החשבונית. ILS/חסר ⇒ fmtIls (כמו תמיד). מטבע אחר ⇒ אות-באות כמו השרת (`templates.fmt_amount`),
 *  כדי שהכותרת בממשק תתאים לסכום שב-SMS. הפעלה 130: קודם כל סכום הוצג ב-₪ — חשבונית של $500 הוצגה «500 ₪»
 *  בטבלה, בכותרת התצוגה המקדימה ובכרטיס «סכום חריג», בזמן שה-SMS ללקוח אמר «$500». */
export const fmtMoney = (n: number, currency?: string): string =>
  !currency || currency === 'ILS' ? fmtIls(n) : fmtAmountBackend(n, currency);

/** סה״כ לפי מטבע — מראה של `conversation.total_text`: מטבע אחד ⇒ סכום אחד; כמה מטבעות ⇒ «1,200 ₪ + $500»
 *  (לא מחברים שקל ודולר). סדר = סדר ההופעה. רשימה ריקה ⇒ 0 ₪. */
export function fmtTotal(items: readonly { amount: number; currency?: string }[]): string {
  const by = new Map<string, number>();
  for (const i of items) { const c = i.currency || 'ILS'; by.set(c, Math.round(((by.get(c) ?? 0) + i.amount) * 100) / 100); }
  if (by.size === 0) return fmtIls(0);
  return [...by].map(([c, v]) => fmtMoney(v, c)).join(' + ');
}

const dayMs = 86_400_000;
const at = (iso: string) => new Date(iso + 'T12:00:00').getTime();
/** ימים מאז מועד הפירעון (שלילי = עוד לא הגיע). */
export const daysOverdue = (dueAt: string, today: string): number => Math.round((at(today) - at(dueAt)) / dayMs);

/** round(scale·num/den) «חצי למעלה» בחשבון שלמים — מראה של app/service.py ratio_half_up (הפעלה 129).
 *  השרת עיגל ב-round() של Python (חצי-לזוגי: 12.5 ⇒ 12) והממשק ב-Math.round (12.5 ⇒ 13). den≤0 ⇒ 0. */
export const ratioHalfUp = (num: number, den: number, scale = 1): number =>
  den <= 0 ? 0 : Math.floor((2 * scale * num + den) / (2 * den));

export const fmtDate = (iso: string): string => {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y.slice(2)}`;
};

export type Aging = 'notDue' | 'd0_30' | 'd31_60' | 'd61_90' | 'd90p';
export const agingOf = (days: number): Aging =>
  days <= 0 ? 'notDue' : days <= 30 ? 'd0_30' : days <= 60 ? 'd31_60' : days <= 90 ? 'd61_90' : 'd90p';
export const AGING_LABEL: Record<Aging, string> = {
  notDue: 'טרם הגיע', d0_30: '1–30 יום', d31_60: '31–60 יום', d61_90: '61–90 יום', d90p: '90+ יום',
};

/** נרמול טלפון ישראלי לתצוגה: 0501234567 ⇒ 050-123-4567 */
export const fmtPhone = (p: string): string => {
  const d = p.replace(/\D/g, '').replace(/^972/, '0');
  return d.length === 10 ? `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}` : p;
};
/** בדיקת תקינות נייד ישראלי (05X + 7 ספרות). */
export const isIlMobile = (p: string): boolean => /^05\d{8}$/.test(p.replace(/\D/g, '').replace(/^972/, '0'));
