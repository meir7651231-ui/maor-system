/**
 * 🔀 route · מנתב לפי ערוץ — חלק טהור בלי עולם (STATIC-VERBS, 14.10.2026).
 *
 * כל קלט הולך לערוץ אחד בדיוק, לפי טבלת-כללים (הכלל הראשון שמתאים מנצח). קלט לא מוכר ⇒ ערוץ ברירת-המחדל.
 * כמו sendSmsVia באורביט ('inforu' ⇒ inforu, כל השאר ⇒ 019), deliverReceipt ('pdf' ⇒ הדפסה, אחרת קובץ-טקסט),
 * resolveDialCode (קוד מוכר ⇒ העסק, אחרת "לא נמצא").
 * המפתח מנורמל (רווחים, אותיות גדולות/קטנות) — "SMS " ו-"sms" הם אותו ערוץ.
 */

const keyOf = (v) => (typeof v === 'string' ? v.trim().toLowerCase() : typeof v === 'number' && Number.isFinite(v) ? String(v) : null);

/**
 * @param {string} channel  הקלט (ערוץ מבוקש, ספק, פורמט, קוד…)
 * @param {{key: string, to: string}[]} [rules]  טבלת-ניתוב; ברירת-מחדל: ערוצי-השליחה של אורביט
 * @param {string} [fallback]  ערוץ לקלט לא מוכר
 * @returns {string} ערוץ אחד
 */
export function route(channel, rules = DEFAULT_RULES, fallback = 'default') {
  const k = keyOf(channel);
  const fb = typeof fallback === 'string' && fallback ? fallback : 'default';
  if (k === null || !Array.isArray(rules)) return fb;
  for (const r of rules) if (r && typeof r.to === 'string' && r.to && keyOf(r.key) === k) return r.to;
  return fb;
}

/** כל הקלטים לפי ערוץ: {ערוץ: [קלטים…]} — כל קלט בדיוק בדלי אחד, בסדר המקורי. */
export function routeAll(keys, rules = DEFAULT_RULES, fallback = 'default') {
  const out = {};
  for (const k of Array.isArray(keys) ? keys : []) (out[route(k, rules, fallback)] ??= []).push(k);
  return out;
}

/** ערוצי-השליחה של שער-ההרשמה באורביט (portal.ts) + כינויים. */
export const DEFAULT_RULES = [
  { key: 'whatsapp', to: 'whatsapp' }, { key: 'wa', to: 'whatsapp' },
  { key: 'sms', to: 'sms' }, { key: 'text', to: 'sms' },
  { key: 'email', to: 'email' }, { key: 'mail', to: 'email' },
  { key: 'phone', to: 'phone' }, { key: 'tel', to: 'phone' },
];
