// ─────────────────────────────────────────────────────────────────────────────
// telephony · billing — CDR · מדידת-שימוש · תוכניות-חיוב · מכסות.
// טהור, דטרמיניסטי. downstream: המדידה על ה-CDR שלנו בלבד; אין חיוב-ספק.
// ─────────────────────────────────────────────────────────────────────────────

// ── 83. סכמת-CDR + נרמול ─────────────────────────────────────────────────────
import { toE164 } from './normalize.mjs';
/** מנרמל רשומת-CDR גולמית (מ-FreeSWITCH) לסכמה-אחידה. */
export function normalizeCdr(raw = {}) {
  // לחיוב: billsec (זמן-שיחה) בלבד — לא duration (שכולל צלצול). חסר ⇒ 0 שניות-חיוב.
  const dur = Number(raw.billsec ?? 0) || 0;
  return {
    uuid: String(raw.uuid ?? raw.id ?? ''),
    tenantId: String(raw.tenantId ?? raw.domain ?? ''),
    // כיוון עם fallback לשמות-שדה של FreeSWITCH (אחרת שיחות-יוצאות בורחות מחיוב).
    direction: (raw.direction ?? raw.call_direction ?? raw.variable_direction) === 'outbound' ? 'outbound' : 'inbound',
    from: toE164(raw.caller ?? raw.from) || String(raw.caller ?? raw.from ?? ''),
    to: toE164(raw.destination ?? raw.to) || String(raw.destination ?? raw.to ?? ''),
    line: String(raw.line ?? raw.inbound_number ?? ''),
    startedAt: String(raw.startedAt ?? raw.start_stamp ?? ''),
    billsec: dur,
    answered: dur > 0 || raw.answered === true,
    hangupCause: String(raw.hangupCause ?? raw.hangup_cause ?? ''),
  };
}

// ── 84. מדידת-שימוש פר-לקוח מ-CDR ────────────────────────────────────────────
/** מסכם דקות/שיחות פר-כיוון + מונה-מענה. filterTenant אופציונלי. */
export function meterUsage(cdrs, tenantId = null) {
  const u = { calls: 0, answered: 0, minutes: 0, inbound: { calls: 0, minutes: 0 }, outbound: { calls: 0, minutes: 0 } };
  for (const raw of Array.isArray(cdrs) ? cdrs : []) {
    const c = normalizeCdr(raw);
    if (tenantId && c.tenantId !== tenantId) continue;
    const mins = Math.ceil(c.billsec / 60); // עיגול-מעלה לדקה (חיוב-נהוג)
    u.calls++;
    if (c.answered) u.answered++;
    u.minutes += mins;
    u[c.direction].calls++;
    u[c.direction].minutes += mins;
  }
  return u;
}

// ── 85. תוכניות-חיוב + חשבונית ───────────────────────────────────────────────
// תוכניות-לדוגמה (בסיס-חודשי + פר-שלוחה + פר-דקה-יוצאת). ערכים = ₪.
export const PLANS = {
  basic: { name: 'בסיסי', base: 90, perExt: 0, includedMinutes: 0, perMinute: 0, maxExt: 3 },
  standard: { name: 'רגיל', base: 190, perExt: 15, includedMinutes: 500, perMinute: 0.1, maxExt: 10 },
  pro: { name: 'מורחב', base: 390, perExt: 12, includedMinutes: 2000, perMinute: 0.08, maxExt: 50 },
};
/**
 * מחשב חשבונית מתוכנית + שימוש + מס' שלוחות. מחזיר פריטים + סה״כ (₪, בלי מע״מ).
 * @param {string} planKey
 * @param {{minutes?:number, outbound?:{minutes?:number}}} usage
 * @param {{extensions?:number}} [opt]
 */
export function computeInvoice(planKey, usage = {}, opt = {}) {
  const plan = PLANS[planKey] || PLANS.basic;
  const items = [{ label: `מנוי ${plan.name}`, amount: plan.base }];
  const exts = Math.max(0, (opt.extensions || 0));
  if (plan.perExt && exts > 0) items.push({ label: `${exts} שלוחות × ₪${plan.perExt}`, amount: exts * plan.perExt });
  // רק דקות-יוצאות מחויבות כחריגה. אין outbound ⇒ 0 (לא ליפול לסך-הכל הנכנס).
  const outMin = usage.outbound ? (usage.outbound.minutes || 0) : 0;
  const billableMin = Math.max(0, outMin - plan.includedMinutes);
  if (plan.perMinute && billableMin > 0) {
    items.push({ label: `${billableMin} דק׳ מעבר-לחבילה × ₪${plan.perMinute}`, amount: Math.round(billableMin * plan.perMinute * 100) / 100 });
  }
  const total = Math.round(items.reduce((s, i) => s + i.amount, 0) * 100) / 100;
  return { plan: plan.name, items, total, currency: '₪' };
}

// ── 88. מכסות + הגבלת-קצב ────────────────────────────────────────────────────
/** האם השימוש בתוך-המכסה. quota = {minutes?, calls?, extensions?}. */
export function checkQuota(usage, quota = {}, extensions = 0) {
  const exceeded = [];
  if (quota.minutes != null && usage.minutes > quota.minutes) exceeded.push('minutes');
  if (quota.calls != null && usage.calls > quota.calls) exceeded.push('calls');
  if (quota.extensions != null && extensions > quota.extensions) exceeded.push('extensions');
  return { within: exceeded.length === 0, exceeded };
}
/** מכסת-התוכנית לשלוחות (maxExt) — נגזרת ל-checkQuota. */
export function planQuota(planKey) {
  const p = PLANS[planKey] || PLANS.basic;
  return { extensions: p.maxExt };
}
