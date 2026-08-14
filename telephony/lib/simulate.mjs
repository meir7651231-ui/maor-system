// ─────────────────────────────────────────────────────────────────────────────
// telephony · simulate — סימולטור-שיחה: עוקב אחר מסלול-שיחה דרך הקונפיג.
// טהור, דטרמיניסטי (הזמן נמסר). בודק את ההיגיון בלי PBX-חי — כלי-בדיקה מרכזי.
// ─────────────────────────────────────────────────────────────────────────────

import { toE164 } from './normalize.mjs';
import { featureOn, termOf } from './config.mjs';
import { classifyDay } from './hebcal.mjs';

function hhmmToMin(s) {
  const [h, m] = String(s).split(':').map(Number);
  return h * 60 + m;
}

/** האם הרגע בתוך חלון (days,start,end). at = {dow, minutes}. */
function inWindow(win, at) {
  return win.days.includes(at.dow) && at.minutes >= hhmmToMin(win.start) && at.minutes < hhmmToMin(win.end);
}

/** חלון מודע-שבת — מיישר לגנרטור: calendar.shabbat ⇒ אין שבת, שישי חתוך ב-shabbatFriEnd. */
function inWindowShabbat(tenant, win, at) {
  if (!featureOn(tenant, 'calendar.shabbat')) return inWindow(win, at);
  if (at.dow === 6) return false; // שבת סגור
  if (at.dow === 5) {
    if (!win.days.includes(5)) return false;
    const cap = Math.min(hhmmToMin(win.end), hhmmToMin(termOf(tenant, 'shabbatFriEnd', '15:00')));
    return at.minutes >= hhmmToMin(win.start) && at.minutes < cap;
  }
  return inWindow(win, at);
}

/**
 * מדמה שיחה נכנסת/יוצאת ומחזיר את המסלול + התוצאה.
 * @param {object} tenant  tenant מנורמל
 * @param {{did?:string, callerId?:string, date?:string, dow?:number, hhmm?:string,
 *          digit?:string, direction?:string}} call
 * @returns {{path:string[], outcome:string, reason?:string}}
 */
export function simulateCall(tenant, call = {}) {
  const path = [];
  const R = tenant.routing || {};

  // יוצאת: בחירת-SIM.
  if (call.direction === 'outbound') {
    const target = call.did || '';
    const m = /^(\d+)#/.exec(target);
    if (m) {
      const sim = tenant.numbers.find((n) => n.onramp === 'sim-in-gateway' && n.gatewayChannel === Number(m[1]));
      return { path: ['outbound', `pick:${m[1]}`], outcome: sim ? `via:${sim.label}` : 'no-such-sim' };
    }
    const def = tenant.numbers.find((n) => n.id === tenant.outbound.defaultNumberId);
    return { path: ['outbound', 'default'], outcome: def ? `via:${def.label}` : 'no-default' };
  }

  const didE164 = toE164(call.did);
  const num = tenant.numbers.find((n) => n.e164 === didE164 || n.e164 === call.did);
  if (!num) return { path: ['inbound'], outcome: 'unknown-did' };
  path.push(`in:${num.label}`);

  // חסימה — מיושר לגנרטור: חסום ברשימה, וגם חסוי/אנונימי כשיש allowlist.
  const cid = toE164(call.callerId);
  const anon = !call.callerId || /^(anonymous|unknown|restricted|private|withheld|clir)$/i.test(String(call.callerId));
  if (featureOn(tenant, 'voice.blocklist') && cid && (R.blocklist || []).includes(cid)) {
    return { path: [...path, 'blocklist'], outcome: 'blocked' };
  }
  if (featureOn(tenant, 'voice.blocklist') && R.allowlist && R.allowlist.length) {
    if (anon || !cid || !R.allowlist.includes(cid)) return { path: [...path, 'allowlist'], outcome: 'blocked' };
  }

  // מוקד-מצוקה: מתקשר-בסיכון עוקף שער-זמן → אחראי ישירות (24/7).
  if (R.priority && R.priority.numbers && cid && R.priority.numbers.includes(cid)) {
    return { path: [...path, 'priority', `resp:${R.priority.ext}`], outcome: 'priority' };
  }

  // קו-הכרזה.
  if (num.role === 'announcement') return { path: [...path, 'announcement'], outcome: 'announcement' };

  // חישוב-פתיחה — מיישר לגנרטור: force_closed (חירום/dnd/חג) גובר על global_open (שעות).
  const at = resolveMoment(call);
  let forceClosed = false;
  let reason = '';
  if (featureOn(tenant, 'emergency') && tenant.emergency && tenant.emergency.active) { forceClosed = true; reason = 'חירום'; }
  else if (featureOn(tenant, 'voice.dnd') && R.dnd) { forceClosed = true; reason = 'נא לא להפריע'; }
  else if (featureOn(tenant, 'calendar.hebrew') && call.date) {
    // כמו hebrewClosedDates: יו״ט תמיד; ערב-חג/חוה״מ רק אם הדגל דלוק. שבת ב-wday.
    const diaspora = tenant.timezone && !/Jerusalem|Tel_Aviv|Hebron/.test(tenant.timezone);
    const c = classifyDay(call.date, { tz: tenant.timezone, diaspora });
    const closes = c.yomTov
      || (featureOn(tenant, 'calendar.erev') && c.erevChag)
      || (featureOn(tenant, 'calendar.cholhamoed') && c.cholHamoed)
      || (featureOn(tenant, 'calendar.fasts') && c.fast && !c.shabbat);
    if (closes) { forceClosed = true; reason = c.yomTov || c.erevChag || c.cholHamoed || c.fast; }
  }
  // global_open: חלון-הקו (אם יש) אחרת שעות-המשרד, מודע-שבת.
  const win = num.hours || tenant.officeHours;
  const open = !forceClosed && inWindowShabbat(tenant, win, at);
  if (!reason) reason = open ? 'שעות-פעילות' : 'מחוץ-לשעות';

  if (open) {
    path.push('open');
    if (featureOn(tenant, 'voice.ivr') && R.ivr) {
      path.push('ivr');
      if (call.digit != null) {
        const opt = R.ivr.options.find((o) => o.digit === String(call.digit));
        if (opt) return { path: [...path, `opt:${call.digit}`], outcome: `ivr:${opt.dest.type}`, reason };
        return { path: [...path, 'ivr-invalid'], outcome: 'afterhours', reason };
      }
      return { path, outcome: 'ivr-menu', reason };
    }
    if (featureOn(tenant, 'voice.queue') && R.queue) return { path: [...path, 'queue'], outcome: 'queue', reason };
    // משרד → אם אין-מענה נופל לאחרי-שעות (מדומה כ-'office' עם fallback).
    return { path: [...path, 'office'], outcome: call.officeAnswered === false ? 'afterhours' : 'office', reason };
  }

  // סגור → אחרי-שעות: מנהל → גלישה → תא-קולי.
  path.push('closed');
  const chain = ['manager', ...((R.overflow || []).map((e) => `overflow:${e}`)), 'voicemail'];
  return { path: [...path, ...chain], outcome: featureOn(tenant, 'voicemail') ? 'voicemail' : 'manager', reason };
}

/** ממיר date/dow/hhmm ל-{dow, minutes}. date גובר (UTC-noon לשמירת-היום). */
function resolveMoment(call) {
  if (call.dow != null && call.hhmm) return { dow: call.dow, minutes: hhmmToMin(call.hhmm) };
  if (call.date) {
    const d = new Date(`${call.date}T${call.hhmm || '12:00'}:00Z`);
    return { dow: d.getUTCDay(), minutes: hhmmToMin(call.hhmm || '12:00') };
  }
  return { dow: 0, minutes: 12 * 60 };
}
