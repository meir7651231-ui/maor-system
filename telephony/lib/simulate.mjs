// ─────────────────────────────────────────────────────────────────────────────
// telephony · simulate — סימולטור-שיחה: עוקב אחר מסלול-שיחה דרך הקונפיג.
// טהור, דטרמיניסטי (הזמן נמסר). בודק את ההיגיון בלי PBX-חי — כלי-בדיקה מרכזי.
// ─────────────────────────────────────────────────────────────────────────────

import { toE164 } from './normalize.mjs';
import { featureOn, termOf, isDiaspora } from './config.mjs';
import { classifyDay } from './hebcal.mjs';
import { hebrewClosedWindows } from './zmanim.mjs';

function addDaysIso(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12) + n * 86400000).toISOString().slice(0, 10);
}
/**
 * סיבת-סגירה כש-zmanim פעיל — מיושר-מלא לגנרטור (last-writer-wins). סדר-הדריסה בגנרטור:
 * hebrewBlock (צום/חוה״מ יום-מלא) נכתב תחילה, זמנים-מדויקים (שבת/יו״ט חלון) נכתבים אחריו
 * ⇒ **החלון גובר**. לכן כאן: קודם החלון-המדויק, ואם לא-בתוכו — נפילה ליום-מלא.
 * נחיל-5: F7 (tzeis מועבר) · F8 (‏!c.yomTov — יו״כ נסגר בחלון, לא יום-מלא) · F16 (ערב-יו״ט).
 */
function zmanimClosedReason(tenant, call) {
  const tz = tenant.timezone || 'Asia/Jerusalem';
  const c = classifyDay(call.date, { tz, diaspora: isDiaspora(tz) });
  // חלון מדויק [ערב-הדלקה→יום-אחרון-צאת] — גובר על יום-מלא. tzeis זהה לגנרטור (F7).
  const wins = hebrewClosedWindows(addDaysIso(call.date, -2), 5, tenant, {
    includeShabbat: featureOn(tenant, 'calendar.shabbat'),
    includeYomTov: featureOn(tenant, 'calendar.hebrew'),
    tzeis: (tenant.geo && Number.isFinite(tenant.geo.tzeis)) ? tenant.geo.tzeis : 40,
  });
  const at = `${call.date}T${call.hhmm || '12:00'}`;
  for (const w of wins) {
    if (`${w.startIso}T${w.startTime}` <= at && at <= `${w.endIso}T${w.endTime}`) return w.reason;
  }
  // יום-מלא (צום/חוה״מ) — נצרב יום-מלא ב-hebrewBlock כשלא בתוך חלון-יו״ט. יו״כ (yomTov+fast)
  // מכוסה ע״י החלון לעיל ⇒ !c.yomTov מונע סגירת-יום-מלא-שגויה אחרי-צאת (F8).
  if (featureOn(tenant, 'calendar.fasts') && c.fast && !c.shabbat && !c.yomTov) return c.fast;
  if (featureOn(tenant, 'calendar.cholhamoed') && c.cholHamoed) return c.cholHamoed;
  return null;
}

function hhmmToMin(s) {
  const [h, m] = String(s).split(':').map(Number);
  return h * 60 + m;
}

/** האם הרגע בתוך חלון (days,start,end). at = {dow, minutes}. */
function inWindow(win, at) {
  return win.days.includes(at.dow) && at.minutes >= hhmmToMin(win.start) && at.minutes < hhmmToMin(win.end);
}

/**
 * שרשרת אחרי-שעות מיושרת לגנרטור (extension afterhours): מנהל → גלישה → תא-קולי,
 * או — כשה-voicemail כבוי — צליל-תפוס+ניתוק (בלי לכידת-הודעה). נחיל-5 F11.
 */
function afterhoursChain(tenant, R) {
  return ['manager', ...((R.overflow || []).map((e) => `overflow:${e}`)), featureOn(tenant, 'voicemail') ? 'voicemail' : 'busy'];
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

  // יוצאת: בחירת-SIM. מצב-כשר ⇒ רק SIM-כשר. **נחיל-5 F6: מגודר-דגלים מיושר לגנרטור** —
  // בלי outbound/pick/default/international (או פורמט לא-תואם) הדיאלפלן ריק מ-extension
  // תואם ⇒ הסימולטור חייב לומר 'no-route'/'outbound-disabled', לא via:label שקרי.
  if (call.direction === 'outbound') {
    const kosherMode = featureOn(tenant, 'voice.kosher');
    if (!featureOn(tenant, 'outbound')) return { path: ['outbound'], outcome: 'outbound-disabled' };
    const target = call.did || '';
    // מיון לפי gatewayChannel — מיושר ל-outboundSims בגנרטור.
    const sims = tenant.numbers.filter((n) => n.onramp === 'sim-in-gateway' && Number.isInteger(n.gatewayChannel))
      .sort((a, b) => a.gatewayChannel - b.gatewayChannel);
    const pick = kosherMode ? sims.filter((n) => n.kosher) : sims;
    // בחירת-ערוץ <ch>#<יעד> — כמו out_pick_ (generate: expression ^<ch>#(\+?\d+)$).
    const m = /^(\d+)#(\+?\d+)$/.exec(target);
    if (m) {
      if (!featureOn(tenant, 'outbound.pick')) return { path: ['outbound', `pick:${m[1]}`], outcome: 'no-route' };
      const sim = sims.find((n) => n.gatewayChannel === Number(m[1]));
      if (!sim) return { path: ['outbound', `pick:${m[1]}`], outcome: 'no-such-sim' };
      if (kosherMode && !sim.kosher) return { path: ['outbound', `pick:${m[1]}`], outcome: 'non-kosher-blocked' };
      return { path: ['outbound', `pick:${m[1]}`], outcome: `via:${sim.label}` };
    }
    // ברירת-מחדל (בלי קידומת): דורש outbound.default + def + פורמט. מקומי↔בין-לאומי לפי הדגל
    // (generate: out_default ^(0\d{7,9}|\+?972\d{7,9})$ · out_intl מגודר outbound.international).
    const def = pick.find((n) => n.id === tenant.outbound.defaultNumberId) || pick[0];
    if (!def) return { path: ['outbound', 'default'], outcome: 'no-default' };
    if (!featureOn(tenant, 'outbound.default')) return { path: ['outbound', 'default'], outcome: 'no-route' };
    if (/^(0\d{7,9}|\+?972\d{7,9})$/.test(target)) return { path: ['outbound', 'default'], outcome: `via:${def.label}` };
    if (/^(00\d{6,}|\+\d{8,15})$/.test(target)) {
      return featureOn(tenant, 'outbound.international')
        ? { path: ['outbound', 'intl'], outcome: `via:${def.label}` }
        : { path: ['outbound', 'intl'], outcome: 'no-route' };
    }
    return { path: ['outbound', 'default'], outcome: 'no-route' };
  }

  const didE164 = toE164(call.did);
  const num = tenant.numbers.find((n) => n.e164 === didE164 || n.e164 === call.did);
  if (!num) return { path: ['inbound'], outcome: 'unknown-did' };
  path.push(`in:${num.label}`);

  // קו-הכרזה: טרמינלי ב-entryActions בגנרטור — לפני כל ניתוב (blocklist/priority/mourning).
  if (num.role === 'announcement') return { path: [...path, 'announcement'], outcome: 'announcement' };

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

  // מצב-שבעה/אבלות: בחלון-התאריכים כל מתקשר (למעט מוקד-מצוקה) → מחליף.
  if (tenant.mourning && call.date && call.date >= tenant.mourning.fromIso && call.date <= tenant.mourning.untilIso) {
    return { path: [...path, 'mourning', `sub:${tenant.mourning.ext}`], outcome: 'mourning' };
  }

  // חישוב-פתיחה — מיישר לגנרטור (last-writer-wins): חירום > חג/זמנים > dnd, גובר על שעות.
  const at = resolveMoment(call);
  const zmActive = featureOn(tenant, 'calendar.zmanim') && !!call.date;
  let forceClosed = false;
  let reason = '';
  if (featureOn(tenant, 'emergency') && tenant.emergency && tenant.emergency.active) {
    forceClosed = true; reason = 'חירום';
  } else {
    let closedReason = null;
    if (zmActive) {
      closedReason = zmanimClosedReason(tenant, call);
    } else if (featureOn(tenant, 'calendar.hebrew') && call.date) {
      const c = classifyDay(call.date, { tz: tenant.timezone, diaspora: isDiaspora(tenant.timezone) }); // F17
      closedReason = c.yomTov
        || (featureOn(tenant, 'calendar.erev') && c.erevChag)
        || (featureOn(tenant, 'calendar.cholhamoed') && c.cholHamoed)
        || (featureOn(tenant, 'calendar.fasts') && c.fast && !c.shabbat) || null;
    }
    if (closedReason) { forceClosed = true; reason = closedReason; } // חג > dnd
    else if (featureOn(tenant, 'voice.dnd') && R.dnd) { forceClosed = true; reason = 'נא לא להפריע'; }
  }
  // global_open: חלון-הקו (אם יש) אחרת שעות-המשרד. zmanim ⇒ חלון-רגיל (הסגירה מהחלון
  // המדויק כבר ב-forceClosed); אחרת מודע-שבת (חיתוך-שישי סטטי).
  const win = num.hours || tenant.officeHours;
  const open = !forceClosed && (zmActive ? inWindow(win, at) : inWindowShabbat(tenant, win, at));
  if (!reason) reason = open ? 'שעות-פעילות' : 'מחוץ-לשעות';

  if (open) {
    path.push('open');
    if (featureOn(tenant, 'voice.ivr') && R.ivr) {
      path.push('ivr');
      if (call.digit != null) {
        const opt = R.ivr.options.find((o) => o.digit === String(call.digit));
        if (opt) return { path: [...path, `opt:${call.digit}`], outcome: `ivr:${opt.dest.type}`, reason };
        return { path: [...path, 'ivr-invalid', ...afterhoursChain(tenant, R)], outcome: 'afterhours', reason };
      }
      return { path, outcome: 'ivr-menu', reason };
    }
    if (featureOn(tenant, 'voice.queue') && R.queue) return { path: [...path, 'queue'], outcome: 'queue', reason };
    // משרד → אם אין-מענה נופל לאחרי-שעות (מנהל→גלישה→תא-קולי/צליל-תפוס — F11).
    if (call.officeAnswered === false) return { path: [...path, 'office', ...afterhoursChain(tenant, R)], outcome: 'afterhours', reason };
    return { path: [...path, 'office'], outcome: 'office', reason };
  }

  // סגור → אחרי-שעות: מנהל → גלישה → תא-קולי.
  path.push('closed');
  const chain = ['manager', ...((R.overflow || []).map((e) => `overflow:${e}`)), 'voicemail'];
  return { path: [...path, ...chain], outcome: featureOn(tenant, 'voicemail') ? 'voicemail' : 'manager', reason };
}

const DOW_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
// סיבת-סגירה להצגה — רק ספציפית (חג/שבת/dnd/חירום), לא הגנרית "מחוץ-לשעות".
function closedTag(reason) {
  return reason && reason !== 'מחוץ-לשעות' && reason !== 'שעות-פעילות' ? ` (${reason})` : '';
}

/**
 * item 16 · סימולטור-שיחה חי: תיאור-אנושי בעברית של מה שמתקשר יחווה — "נסה את
 * עץ-הטלפון שלך" לפני go-live. מריץ simulateCall ומתרגם את המסלול לסיפור קריא.
 * טהור, דטרמיניסטי. מכסה מוקד-מצוקה/שבעה/כשר/שעות/חג/IVR/חסימה.
 * @param {object} tenant tenant מנורמל
 * @param {object} call {did?,callerId?,date?,dow?,hhmm?,digit?,direction?,officeAnswered?}
 * @returns {{outcome:string, reason:string, summary:string, lines:string[], sim:object}}
 */
export function explainCall(tenant, call = {}) {
  const sim = simulateCall(tenant, call);
  const lines = [];
  const office = tenant.destinations?.office?.ext?.join(', ') || '—';
  const manager = tenant.destinations?.manager?.ext || '—';
  const vm = tenant.destinations?.voicemail?.box || '—';
  const when = call.dow != null ? `יום ${DOW_HE[call.dow]} ${call.hhmm || ''}` : call.date ? `${call.date} ${call.hhmm || ''}` : '';

  if (call.direction === 'outbound') {
    lines.push(`📞 חיוג-יוצא: ${call.did || ''}`);
    if (sim.outcome === 'non-kosher-blocked') lines.push('⛔ מצב-כשר: ניסיון-יציאה דרך SIM לא-כשר — נחסם.');
    else if (sim.outcome === 'no-such-sim') lines.push('⚠️ הערוץ שנבחר לא-קיים.');
    else if (sim.outcome === 'no-default') lines.push('⚠️ אין SIM ליציאת-ברירת-מחדל.');
    else lines.push(`✅ יוצא דרך: ${sim.outcome.replace('via:', '')}`);
    return { outcome: sim.outcome, reason: '', summary: lines.join(' '), lines, sim };
  }

  if (call.callerId) lines.push(`📲 מתקשר ${call.callerId}${when ? ` · ${when}` : ''}`);
  switch (sim.outcome) {
    case 'unknown-did':
      lines.push('❓ המספר שחויג אינו מוכר למרכזייה — לא ינותב.'); break;
    case 'blocked':
      lines.push(sim.path.includes('allowlist') ? '⛔ המתקשר אינו ברשימת-ההיתר (או חסוי) — נותק.' : '⛔ המתקשר ברשימת-החסומים — נותק.'); break;
    case 'priority':
      lines.push(`🆘 מוקד-מצוקה: מתקשר-בסיכון — מנותב ישירות לאחראי (${sim.path.find((p) => p.startsWith('resp:'))?.slice(5) || manager}), עוקף שעות/חג.`); break;
    case 'mourning':
      lines.push(`🕯️ מצב-שבעה פעיל: מנותב למחליף (${sim.path.find((p) => p.startsWith('sub:'))?.slice(4) || manager}).`); break;
    case 'announcement':
      lines.push('📢 קו-הכרזה: משמיע הודעה מוקלטת ומנתק.'); break;
    case 'office':
      lines.push(`✅ בשעות-פעילות → מצלצל במשרד (${office}).`); break;
    case 'ivr-menu':
      lines.push('✅ בשעות → תפריט-קולי (IVR) ממתין לבחירה.'); break;
    case 'queue':
      lines.push('✅ בשעות → תור-המתנה עד שנציג מושך את השיחה.'); break;
    case 'voicemail':
      lines.push(`🌙 מחוץ-לשעות${closedTag(sim.reason)} → מנהל (${manager}) → תא-קולי (${vm}).`); break;
    case 'manager':
      lines.push(`🌙 מחוץ-לשעות${closedTag(sim.reason)} → מנהל (${manager}) (בלי תא-קולי).`); break;
    case 'afterhours': {
      // F11: מודע-voicemail — כשהתא-הקולי כבוי, אחרי-שעות מנגן צליל-תפוס ומנתק (בלי לכידה).
      const trg = sim.path.includes('ivr-invalid') ? 'בחירה לא-תקינה ב-IVR' : 'אין-מענה במשרד';
      lines.push(featureOn(tenant, 'voicemail')
        ? `🌙 ${trg} → מנהל (${manager}) → תא-קולי.`
        : `🌙 ${trg} → מנהל (${manager}) → צליל-תפוס (אין תא-קולי).`);
      break;
    }
    default:
      if (String(sim.outcome).startsWith('ivr:')) lines.push(`✅ בחירת-IVR → ${sim.outcome.slice(4)}.`);
      else lines.push(`תוצאה: ${sim.outcome}`);
  }
  return { outcome: sim.outcome, reason: sim.reason || '', summary: lines.join(' '), lines, sim };
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
