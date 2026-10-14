/**
 * 🎭 assign-role · מקצה תפקיד — חלק טהור בלי עולם (STATIC-VERBS, 14.10.2026).
 *
 * כל חבר מקבל תפקיד אחד בדיוק. התוכנית אומרת כמה מכל תפקיד (לפי הסדר — הראשון מתמלא ראשון), ומי שנשאר
 * מקבל את תפקיד-השארית (`rest`) — כמו roleOf באורביט: מנהל ⇒ מורה ⇒ "צוות" לכל השאר.
 * מי מקבל איזה מקום נקבע בהגרלה עם זרע מוזרק (mulberry32): אותו זרע ⇒ אותה חלוקה; שינוי סדר-החברים לא משנה כמה מכל תפקיד.
 */

/** PRNG עם זרע (mulberry32). */
export function seeded(seed) {
  let a = (Number(seed) >>> 0) || 0x9e3779b9;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * @param {string[]} members
 * @param {{role: 'admin'|'teacher'|'driver'|'cook', count: number}[]} plan  לפי סדר-העדיפות
 * @param {number} [seed]
 * @param {string} [rest]  התפקיד של מי שלא נכנס לתוכנית
 * @returns {{who: string, role: string}[]} בסדר של members
 */
export function assignRoles(members, plan, seed = 1, rest = 'staff') {
  const ms = Array.isArray(members) ? members : [];
  // ההגרלה על החברים הממוינים — כך הסדר שבו הם הגיעו לא משנה מי מקבל מה
  const order = ms.map((m, k) => k).sort((p, q) => cmp(ms[p], ms[q]) || p - q);
  const rnd = seeded(seed);
  for (let k = order.length - 1; k > 0; k--) { const j = Math.floor(rnd() * (k + 1)); [order[k], order[j]] = [order[j], order[k]]; }
  const slots = [];
  for (const p of Array.isArray(plan) ? plan : []) {
    if (!p || typeof p.role !== 'string' || !p.role) continue;
    const c = Math.max(0, Math.floor(Number(p.count) || 0));
    for (let k = 0; k < c; k++) slots.push(p.role);
  }
  const role = new Array(ms.length);
  order.forEach((idx, k) => { role[idx] = k < slots.length ? slots[k] : rest; });
  return ms.map((who, k) => ({ who, role: role[k] }));
}
const cmp = (a, b) => { const x = JSON.stringify(a) ?? ''; const y = JSON.stringify(b) ?? ''; return x < y ? -1 : x > y ? 1 : 0; };
