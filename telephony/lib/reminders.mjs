// ─────────────────────────────────────────────────────────────────────────────
// telephony · reminders — תזכורות-מצווה (item 5) · שכבת-הלוגיקה הטהורה.
//
// מחשב **מתי ולמי** לשלוח תזכורת-קולית, וממנף את מנוע-הזמנים (#1) לתזמון-הלכתי
// מדויק: תזכורת-הדלקת-נרות יוצאת N דקות לפני הדלקת-הנרות המחושבת פר-עיר. הפלט =
// תור-שיחות-יוצאות מוכן. **המסירה עצמה** (החייגן שמרים את השיחה בזמן) היא runtime —
// hook דורמנטי; כאן רק התוכנית הטהורה. downstream — יוצא מהמספר של העמותה.
// ─────────────────────────────────────────────────────────────────────────────

import { shabbatTimes } from './zmanim.mjs';
import { dialString } from './cti.mjs';
import { toE164 } from './normalize.mjs';

const toMin = (hhmm) => { const [h, m] = String(hhmm).split(':').map(Number); return h * 60 + m; };
const fromMin = (min) => { const x = ((min % 1440) + 1440) % 1440; return `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`; };

/**
 * בונה תור-תזכורות-קוליות. כל פריט: {number, name?, kind, date, leadMinutes?, at?}.
 *   kind==='candle'  → תזכורת-הדלקת-נרות: dispatchAt = הדלקת-הנרות (date) − leadMinutes.
 *   kind==='custom'  → תזכורת-חופשית בשעה at (HH:MM) בתאריך date.
 * מדלג-מנומק על פריט לא-תקין. ממוין לפי (date, dispatchAt). downstream — מחרוזת-חיוג
 * דרך ה-SIM של העמותה. **החיוג-בפועל = runtime (חייגן).**
 * @param {Array} items
 * @param {object} tenant tenant מנורמל (geo/city/timezone/numbers)
 * @param {{viaNumberId?:string, defaultLead?:number}} [opt]
 * @returns {{queue:Array<{date,dispatchAt,name,e164,kind,dialString}>, skipped:Array}}
 */
export function reminderQueue(items, tenant, opt = {}) {
  const defaultLead = Number.isInteger(opt.defaultLead) ? opt.defaultLead : 30;
  const queue = [];
  const skipped = [];
  for (const it of Array.isArray(items) ? items : []) {
    const e164 = toE164(it && (it.number ?? it.phone));
    if (!e164) { skipped.push({ raw: String((it && (it.number ?? it.phone)) || ''), reason: 'מספר לא-תקין' }); continue; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test((it && it.date) || '')) { skipped.push({ raw: e164, reason: 'תאריך לא-תקין' }); continue; }
    let dispatchAt = null;
    if (it.kind === 'candle') {
      const st = shabbatTimes(it.date, tenant);
      if (!st) { skipped.push({ raw: e164, reason: 'זמן-שקיעה לא-חושב (קוטב)' }); continue; }
      const lead = Number.isInteger(it.leadMinutes) ? it.leadMinutes : defaultLead;
      dispatchAt = fromMin(toMin(st.candle) - lead);
    } else if (it.kind === 'custom') {
      if (!/^([01]?\d|2[0-3]):[0-5]\d$/.test(it.at || '')) { skipped.push({ raw: e164, reason: 'שעה לא-תקינה' }); continue; }
      dispatchAt = it.at;
    } else {
      skipped.push({ raw: e164, reason: 'kind לא-מוכר (candle/custom)' }); continue;
    }
    queue.push({
      date: it.date,
      dispatchAt,
      name: (it && it.name) || '',
      e164,
      kind: it.kind,
      dialString: dialString(tenant, e164, { viaNumberId: opt.viaNumberId }),
    });
  }
  queue.sort((a, b) => a.date.localeCompare(b.date) || a.dispatchAt.localeCompare(b.dispatchAt));
  return { queue, skipped };
}
