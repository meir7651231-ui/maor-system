// פונקציות טהורות — בלי DOM. נבדקות ב-tests/.
const ils = new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 });
export const fmtIls = (n: number): string => ils.format(Math.round(n));

const dayMs = 86_400_000;
const at = (iso: string) => new Date(iso + 'T12:00:00').getTime();
/** ימים מאז מועד הפירעון (שלילי = עוד לא הגיע). */
export const daysOverdue = (dueAt: string, today: string): number => Math.round((at(today) - at(dueAt)) / dayMs);

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
