// ─────────────────────────────────────────────────────────────────────────────
// telephony · generate — המנוע. tenant מנורמל → קונפיג-מרכזייה מוכן-להתקנה.
//
// זו אבן-הפינה של המוצר: הלקוח ממלא נתונים, והמערכת מחוללת לבד את כל הניתוב.
// הפלט דטרמיניסטי (אין Date/Math.random) ⇒ ניתן-להקפאה כ-golden ולהשוואה ביט-לביט.
//
// עיקרון-ברזל (pure-downstream) נאכף בקוד: הדיאלפלן מדבר רק עם ציוד-הלקוח —
// שער-GSM עם ה-SIM שלו — ועם ה-softphones של הלקוח. אין gateway של שום ספק,
// אין SIP-trunk שנקנה מחברה, אין API-ספק. device-link (ווצאפ) מדולג מהדיאלפלן
// הקולי לגמרי. virtual/customer-forward = הלקוח מפנה אצל הספק הקיים שלו אלינו.
// ─────────────────────────────────────────────────────────────────────────────

import { featureOn, termOf } from './config.mjs';
import { hebrewClosedDates } from './hebcal.mjs';
import { hebrewClosedWindows, geoOf } from './zmanim.mjs';
import { numbersAlternation } from './routing.mjs';
import { promptDir, requiredPrompts, promptCapabilities } from './prompts.mjs';
import { extSecret, vmSecret, secretsFor } from './security.mjs';

const XML_ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' };
function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => XML_ESC[c]);
}

// 0=ראשון..6=שבת (המודל שלנו) → wday של FreeSWITCH (1=ראשון..7=שבת).
function daysToWday(days) {
  const w = days.map((d) => d + 1).sort((a, b) => a - b);
  // כווץ לטווחים רציפים: [1,2,3,4,5] → "1-5"; [1,3,5] → "1,3,5".
  const parts = [];
  let start = w[0];
  let prev = w[0];
  for (let i = 1; i <= w.length; i++) {
    if (i < w.length && w[i] === prev + 1) {
      prev = w[i];
      continue;
    }
    parts.push(start === prev ? `${start}` : `${start}-${prev}`);
    if (i < w.length) {
      start = w[i];
      prev = w[i];
    }
  }
  return parts.join(',');
}

// "09:00" → "9:00" (FreeSWITCH time-of-day לא אוהב אפס-מוביל בשעה).
function fsTime(hhmm) {
  const [h, m] = hhmm.split(':');
  return `${Number(h)}:${m}`;
}

// regex-escape של e164 לתוך expression (הנקודה/הפלוס הם מטא).
function reEsc(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** מספרים נושאי-קול שמגיעים בפועל לדיאלפלן (לא device-link). */
function voiceNumbers(tenant) {
  return tenant.numbers.filter((n) => n.channels.includes('voice') && n.onramp !== 'device-link');
}
/** האם מנוע-הזמנים ההלכתי פעיל (דורש anchorDate לדטרמיניזם golden). */
function zmanimOn(tenant, opts) {
  return featureOn(tenant, 'calendar.zmanim') && !!opts.anchorDate;
}
/** חלונות-סגירה מדויקים (הלכתי) — ריק אם zmanim כבוי. שבת/יו״ט לפי הדגלים. */
function zmanimBlock(tenant, opts) {
  if (!zmanimOn(tenant, opts)) return [];
  return hebrewClosedWindows(opts.anchorDate, opts.calendarWindow || 400, tenant, {
    includeShabbat: featureOn(tenant, 'calendar.shabbat'),
    includeYomTov: featureOn(tenant, 'calendar.hebrew'),
    tzeis: (tenant.geo && Number.isFinite(tenant.geo.tzeis)) ? tenant.geo.tzeis : 40,
  });
}
/** ימי-הסגירה העבריים (יו״ט) לחלון — ריק אם הדגל כבוי, אין anchorDate, או zmanim פעיל (מוחלף בחלונות-מדויקים). */
function hebrewBlock(tenant, opts) {
  if (zmanimOn(tenant, opts)) return [];
  if (!featureOn(tenant, 'calendar.hebrew') || !opts.anchorDate) return [];
  const diaspora = tenant.timezone && !/Jerusalem|Tel_Aviv|Asia\/Hebron/.test(tenant.timezone);
  return hebrewClosedDates(opts.anchorDate, opts.calendarWindow || 400, {
    diaspora,
    tz: tenant.timezone || 'Asia/Jerusalem',
    includeErev: featureOn(tenant, 'calendar.erev'),
    includeCholHamoed: featureOn(tenant, 'calendar.cholhamoed'),
    includeFasts: featureOn(tenant, 'calendar.fasts'),
  });
}

const HHMM_RE = /^([01]?\d|2[0-3]):[0-5]\d$/;
const hhmmMin = (s) => { const [h, m] = String(s).split(':').map(Number); return h * 60 + m; };
/**
 * חלונות-פתיחה מודעי-שבת עבור מבנה-שעות (גלובלי או פר-מספר). calendar.shabbat דלוק ⇒
 * אין שבת, ושישי נחתך ב-shabbatFriEnd (מאומת HH:MM, נפילה 15:00). מחזיר [{days,start,end}].
 */
function windowsFor(tenant, oh, opts = {}) {
  // zmanim פעיל ⇒ הסגירה המדויקת מגיעה מהחלונות-הצרובים (force_closed); שעות-המשרד
  // נשארות פתוחות עד הדלקת-הנרות, והחלון הצרוב סוגר בדיוק בזמן ⇒ בלי חיתוך-סטטי.
  if (zmanimOn(tenant, opts)) return [{ days: oh.days, start: oh.start, end: oh.end }];
  if (!featureOn(tenant, 'calendar.shabbat')) return [{ days: oh.days, start: oh.start, end: oh.end }];
  const friEndRaw = termOf(tenant, 'shabbatFriEnd', '15:00');
  const friEnd = HHMM_RE.test(friEndRaw) ? friEndRaw : '15:00';
  const windows = [];
  const nonSh = oh.days.filter((d) => d !== 5 && d !== 6);
  if (nonSh.length) windows.push({ days: nonSh, start: oh.start, end: oh.end });
  if (oh.days.includes(5)) {
    const cap = hhmmMin(friEnd) < hhmmMin(oh.end) ? friEnd : oh.end;
    if (hhmmMin(oh.start) < hhmmMin(cap)) windows.push({ days: [5], start: oh.start, end: cap });
  }
  return windows;
}

/** מספרי-יציאה: SIM בשער עם ערוץ. */
function outboundSims(tenant) {
  return tenant.numbers
    .filter((n) => n.onramp === 'sim-in-gateway' && Number.isInteger(n.gatewayChannel))
    .sort((a, b) => a.gatewayChannel - b.gatewayChannel);
}

// ── דיאלפלן: context הלקוח ──────────────────────────────────────────────────
function dialplanXml(tenant, opts = {}) {
  const ctx = `tenant_${tenant.tenantId}`;
  const gw = `${tenant.tenantId}-gw`;
  const oh = tenant.officeHours;
  const office = tenant.destinations.office;
  const manager = tenant.destinations.manager;
  const vm = tenant.destinations.voicemail;
  const vnums = voiceNumbers(tenant);
  const sims = outboundSims(tenant);
  const R = tenant.routing || {};

  // אסטרטגיית-צלצול: פסיק=בו-זמני · צינור=מחזורי (נסה-אחד-אחרי-השני) · :_:=enterprise.
  const ringSep = R.ringStrategy === 'sequential' ? '|' : R.ringStrategy === 'enterprise' ? ':_:' : ',';
  const officeBridge = office.ext
    .map((e) => `user/${esc(e)}@${esc(tenant.tenantId)}`)
    .join(ringSep);
  const useIvr = featureOn(tenant, 'voice.ivr') && R.ivr;
  const useQueue = featureOn(tenant, 'voice.queue') && R.queue && !useIvr;

  const L = [];
  L.push(`<?xml version="1.0" encoding="utf-8"?>`);
  L.push(`<!-- מחולל אוטומטית מקונפיג-הלקוח. אין לערוך ידנית — ערוך את הנתונים והרץ מחדש. -->`);
  L.push(`<!-- ${esc(tenant.orgName)} · pure-downstream · ${vnums.length} מספרים נושאי-קול · ${sims.length} ערוצי-יציאה -->`);
  L.push(`<include>`);
  L.push(`  <context name="${esc(ctx)}">`);

  const pdir = promptDir(tenant);
  const greet = featureOn(tenant, 'voice.greeting');
  const holdMusic = termOf(tenant, 'holdMusic', 'ברירת-מחדל');

  // 0א. setup: קונפיג עצמאי — hangup_after_bridge=true כדי ששיחה-שנענתה לא
  // תמשיך לזרום בדיאלפלן (אחרת כל שיחה תקינה חוזרת ל-afterhours). + מוזיקת-המתנה.
  L.push(``);
  L.push(`    <!-- setup: התנהגות עצמאית (לא תלוי vars.xml של השרת) -->`);
  L.push(`    <extension name="setup_defaults" continue="true">`);
  L.push(`      <condition>`);
  L.push(`        <action application="set" data="hangup_after_bridge=true"/>`);
  L.push(`        <action application="set" data="continue_on_fail=true"/>`);
  // רוצח-לולאת-transfer: המנוע לא תלוי vars.xml ⇒ ברירת-max_forwards לא-מובטחת;
  // שרשרת transfer (incoming→do_open→ivr_menu→ivr_opt→…) לא תיסגר למעגל שמכלה ערוצים.
  L.push(`        <action application="set" data="max_forwards=20"/>`);
  if (holdMusic !== 'ברירת-מחדל') L.push(`        <action application="set" data="hold_music=${esc(holdMusic)}"/>`);
  L.push(`      </condition>`);
  L.push(`    </extension>`);

  // 0ב. נרמול caller-id ל-E.164 (cid_e164): שער-GSM מוסר לרוב פורמט-לאומי (0XX);
  // כל השוואת-חסימה/היתר נעשית מול cid_e164 ולא מול הגולמי (אחרת חסימה fail-open
  // והיתר נועל את כולם). פנימי (שלוחה) נשאר כמות-שהוא.
  // מכסה את אותן תבניות כמו toE164: default=as-is · 00<intl>→+ · 0XX→+972 · <cc>→+.
  // כל תנאי break="never" ⇒ כולם נבדקים, המתאים-האחרון קובע (default ראשון).
  L.push(`    <extension name="cid_normalize" continue="true">`);
  L.push(`      <condition break="never"><action application="set" data="cid_e164=\${caller_id_number}"/></condition>`);
  L.push(`      <condition field="caller_id_number" expression="^00([1-9]\\d+)$" break="never"><action application="set" data="cid_e164=+$1"/></condition>`);
  L.push(`      <condition field="caller_id_number" expression="^0([1-9]\\d+)$" break="never"><action application="set" data="cid_e164=+972$1"/></condition>`);
  L.push(`      <condition field="caller_id_number" expression="^(972\\d+)$" break="never"><action application="set" data="cid_e164=+$1"/></condition>`);
  L.push(`      <condition field="caller_id_number" expression="^([1-9]\\d{6,8})$" break="never"><action application="set" data="cid_e164=+972$1"/></condition>`);
  L.push(`      <condition field="caller_id_number" expression="^([1-9]\\d{9,14})$" break="never"><action application="set" data="cid_e164=+$1"/></condition>`);
  L.push(`      <condition field="\${cid_e164}" expression="^\\+9720([1-9]\\d+)$" break="never"><action application="set" data="cid_e164=+972$1"/></condition>`);
  L.push(`    </extension>`);

  // 0ג. חסימה/היתר — מול cid_e164 המנורמל.
  if (featureOn(tenant, 'voice.blocklist') && R.blocklist && R.blocklist.length) {
    L.push(`    <!-- רשימת-חסימה: ${R.blocklist.length} מספרים → ניתוק -->`);
    L.push(`    <extension name="blocklist">`);
    L.push(`      <condition field="\${inbound_call}" expression="^true$"/>`);
    L.push(`      <condition field="\${cid_e164}" expression="^(${numbersAlternation(R.blocklist)})$">`);
    L.push(`        <action application="set" data="closed_reason=מספר-חסום"/>`);
    L.push(`        <action application="hangup" data="CALL_REJECTED"/>`);
    L.push(`      </condition>`);
    L.push(`    </extension>`);
  }
  if (featureOn(tenant, 'voice.blocklist') && R.allowlist && R.allowlist.length) {
    // חסוי/אנונימי חיצוני → ניתוק (אנטי-הטרדה). פנימי (שלוחה) לא נתפס.
    L.push(`    <!-- רשימת-היתר: חיצוני-שאינו-ברשימה או חסוי → ניתוק -->`);
    L.push(`    <extension name="allowlist_anon" continue="true">`);
    L.push(`      <condition field="\${inbound_call}" expression="^true$"/>`);
    L.push(`      <condition field="\${cid_e164}" expression="^(|anonymous|Anonymous|unknown|Unknown|restricted|Restricted|private|Private|withheld|Withheld|CLIR)$">`);
    L.push(`        <action application="hangup" data="CALL_REJECTED"/>`);
    L.push(`      </condition>`);
    L.push(`    </extension>`);
    L.push(`    <extension name="allowlist" continue="true">`);
    L.push(`      <condition field="\${inbound_call}" expression="^true$"/>`);
    L.push(`      <condition field="\${cid_e164}" expression="^(${numbersAlternation(R.allowlist)})$">`);
    L.push(`        <anti-action application="hangup" data="CALL_REJECTED"/>`);
    L.push(`      </condition>`);
    L.push(`    </extension>`);
  }

  // 1. שער-הזמן: שני משתנים נפרדים ⇒ עמידים ל-transfer (החלטה נקבעת פעם-אחת).
  //   global_open = בתוך חלון-שעות-המשרד · force_closed = חג/שבת/dnd/חירום (גובר).
  L.push(``);
  L.push(`    <!-- שער-הזמן: ברירת-מחדל סגור; global_open לפי שעות, force_closed לפי חג/dnd/חירום -->`);
  L.push(`    <extension name="gate_default" continue="true">`);
  L.push(`      <condition>`);
  L.push(`        <action application="set" data="global_open=false"/>`);
  L.push(`        <action application="set" data="force_closed=false"/>`);
  L.push(`      </condition>`);
  L.push(`    </extension>`);

  // 2. חלון(ות) שעות-משרד (מודע-שבת דרך windowsFor).
  const windows = windowsFor(tenant, oh, opts);
  windows.forEach((w, i) => {
    L.push(`    <extension name="office_window${windows.length > 1 ? `_${i + 1}` : ''}" continue="true">`);
    L.push(`      <condition wday="${daysToWday(w.days)}" time-of-day="${fsTime(w.start)}-${fsTime(w.end)}">`);
    L.push(`        <action application="set" data="global_open=true"/>`);
    L.push(`      </condition>`);
    L.push(`    </extension>`);
  });

  // 2א. נא-לא-להפריע — לפני החג כדי שהחג יגבר עליו (precedence: חירום>חג>dnd).
  if (featureOn(tenant, 'voice.dnd') && R.dnd) {
    L.push(``);
    L.push(`    <!-- מצב נא-לא-להפריע: הכל מנותב לאחרי-שעות -->`);
    L.push(`    <extension name="dnd_override" continue="true">`);
    L.push(`      <condition>`);
    L.push(`        <action application="set" data="force_closed=true"/>`);
    L.push(`        <action application="set" data="closed_kind=dnd"/>`);
    L.push(`        <action application="set" data="closed_reason=נא לא להפריע"/>`);
    L.push(`      </condition>`);
    L.push(`    </extension>`);
  }

  // 2ב. לוח-עברי (opt-in calendar.hebrew): ימי-חג מחושבים-מראש דורסים ל"סגור".
  // שבת כבר מכוסה ב-wday (לכן לא נכללת). דורש anchorDate (דטרמיניזם golden).
  const heb = hebrewBlock(tenant, opts);
  if (heb.length) {
    L.push(``);
    L.push(`    <!-- לוח-עברי: ${heb.length} ימי-חג → סגור (מחושב מ-${esc(opts.anchorDate)}, חלון ${opts.calendarWindow || 400} יום) -->`);
    for (const c of heb) {
      L.push(`    <extension name="heb_${c.iso.replace(/-/g, '')}" continue="true">`);
      L.push(`      <condition date-time="${c.iso} 00:00:00~${c.iso} 23:59:59">`);
      L.push(`        <action application="set" data="force_closed=true"/>`);
      L.push(`        <action application="set" data="closed_kind=holiday"/>`);
      L.push(`        <action application="set" data="closed_reason=${esc(c.reason)}"/>`);
      L.push(`      </condition>`);
      L.push(`    </extension>`);
    }
  }

  // 2ג. זמנים הלכתיים מדויקים (opt-in calendar.zmanim): חלון [הדלקת-נרות בערב →
  //     צאת-הכוכבים ביום-האחרון] פר-שבת/חג — במקום יום-אזרחי-מלא. הקו נפתח בשישי
  //     עד ההדלקה המחושבת ונסגר בדיוק בשקיעה, לא ב-15:00 סטטי.
  const zwins = zmanimBlock(tenant, opts);
  if (zwins.length) {
    L.push(``);
    L.push(`    <!-- זמנים הלכתיים: ${zwins.length} חלונות מדויקים (הדלקה→צאת) מחושבים מ-${esc(opts.anchorDate)} -->`);
    for (const w of zwins) {
      const yt = w.kind === 'yomtov';
      L.push(`    <extension name="zwin_${w.startIso.replace(/-/g, '')}" continue="true">`);
      L.push(`      <condition date-time="${w.startIso} ${w.startTime}:00~${w.endIso} ${w.endTime}:59">`);
      L.push(`        <action application="set" data="force_closed=true"/>`);
      if (yt) L.push(`        <action application="set" data="closed_kind=holiday"/>`);
      L.push(`        <action application="set" data="closed_reason=${esc(w.reason)}"/>`);
      L.push(`      </condition>`);
      L.push(`    </extension>`);
    }
  }

  // 2ד. מצב-חירום (opt-in emergency): "סגור היום" — דורס לסגור + סיבה.
  if (featureOn(tenant, 'emergency') && tenant.emergency && tenant.emergency.active) {
    L.push(``);
    L.push(`    <!-- מצב-חירום: סגור היום -->`);
    L.push(`    <extension name="emergency_override" continue="true">`);
    L.push(`      <condition>`);
    L.push(`        <action application="set" data="force_closed=true"/>`);
    L.push(`        <action application="set" data="closed_kind=emergency"/>`);
    L.push(`        <action application="set" data="closed_reason=חירום"/>`);
    L.push(`      </condition>`);
    L.push(`    </extension>`);
  }

  // 2ה. מצב-שבעה/אבלות (opt-in mourning): חלון-תאריכים ⇒ mourning_active=true.
  //     הניתוב עצמו (incoming_mourning) מפנה למחליף; פג-תוקף לבד בסוף החלון.
  const mrn = tenant.mourning;
  if (mrn) {
    L.push(``);
    L.push(`    <!-- מצב-שבעה: ${esc(mrn.fromIso)}~${esc(mrn.untilIso)} → מחליף ${esc(mrn.ext)} (פג-תוקף לבד) -->`);
    L.push(`    <extension name="mourning_gate" continue="true">`);
    L.push(`      <condition date-time="${mrn.fromIso} 00:00:00~${mrn.untilIso} 23:59:59">`);
    L.push(`        <action application="set" data="mourning_active=true"/>`);
    L.push(`        <action application="set" data="closed_reason=${esc(mrn.reason)}"/>`);
    L.push(`      </condition>`);
    L.push(`    </extension>`);
  }

  // פעולות-הכניסה של קו (זיהוי-קו + הכרזה/ניתוב) — משותף ל-in_<id> ולהקשרי-השער.
  const entryActions = (n, ind) => {
    L.push(`${ind}<action application="set" data="inbound_call=true"/>`);
    L.push(`${ind}<action application="set" data="inbound_line=${esc(n.label)}"/>`);
    L.push(`${ind}<action application="set" data="inbound_number=${esc(n.e164)}"/>`);
    if (n.role === 'announcement') {
      L.push(`${ind}<action application="answer"/>`);
      L.push(`${ind}<action application="playback" data="${pdir}/announce-${esc(n.id)}.wav"/>`);
      L.push(`${ind}<action application="hangup" data="NORMAL_CLEARING"/>`);
    } else {
      const hasHours = n.hours && Array.isArray(n.hours.days) && n.hours.start && n.hours.end;
      L.push(`${ind}<action application="transfer" data="${hasHours ? `line_${esc(n.id)}` : 'incoming'} XML ${esc(ctx)}"/>`);
    }
  };

  // 3. כניסה. SIM נכנס דרך הקשר-שער ייחודי (זיהוי-אמין לפי השער, לא לפי DID — ראה
  //    למטה). כאן רק קווים-מופנים (customer-forward בלי forwardTo) — best-effort לפי DID.
  L.push(``);
  L.push(`    <!-- כניסה: קווים-מופנים מזוהים לפי DID (תלוי בכך שהספק משמרו) -->`);
  for (const n of vnums) {
    if (n.onramp === 'sim-in-gateway') continue; // מטופל בהקשר-השער
    if (n.onramp === 'customer-forward' && n.forwardTo) continue; // alias של SIM
    L.push(`    <extension name="in_${esc(n.id)}">`);
    L.push(`      <!-- קו-מופנה: תלוי בכך שהספק מעביר את ה-DID המקורי -->`);
    L.push(`      <condition field="destination_number" expression="^${reEsc(n.e164)}$">`);
    entryActions(n, '        ');
    L.push(`      </condition>`);
    L.push(`    </extension>`);
  }

  // 3ב. לו״ז פר-מספר (number.hours): חלונות מודעי-שבת → do_open/do_closed.
  // force_closed (חג/שבת/dnd/חירום) גובר; forwardTo = alias (מדולג).
  for (const n of vnums) {
    if (n.forwardTo) continue;
    if (!(n.hours && Array.isArray(n.hours.days) && n.hours.start && n.hours.end)) continue;
    const dst = `destination_number" expression="^line_${esc(n.id)}$`;
    L.push(`    <extension name="line_${esc(n.id)}_closed">`);
    L.push(`      <condition field="${dst}"/>`);
    L.push(`      <condition field="\${force_closed}" expression="^true$">`);
    L.push(`        <action application="transfer" data="do_closed XML ${esc(ctx)}"/>`);
    L.push(`      </condition>`);
    L.push(`    </extension>`);
    const lwins = windowsFor(tenant, n.hours, opts);
    lwins.forEach((w, i) => {
      L.push(`    <extension name="line_${esc(n.id)}_w${i + 1}">`);
      L.push(`      <condition field="${dst}"/>`);
      L.push(`      <condition wday="${daysToWday(w.days)}" time-of-day="${fsTime(w.start)}-${fsTime(w.end)}">`);
      L.push(`        <action application="transfer" data="do_open XML ${esc(ctx)}"/>`);
      L.push(`      </condition>`);
      L.push(`    </extension>`);
    });
    // ברירת-מחדל: אם אף חלון לא נתפס → סגור.
    L.push(`    <extension name="line_${esc(n.id)}_default">`);
    L.push(`      <condition field="${dst}">`);
    L.push(`        <action application="transfer" data="do_closed XML ${esc(ctx)}"/>`);
    L.push(`      </condition>`);
    L.push(`    </extension>`);
  }

  // 4. ניתוב: ההחלטה נקבעה פעם-אחת (force_closed/global_open) ומועברת ל-handler
  //    שאינו בודק-זמן שוב ⇒ עמיד ל-transfer.
  L.push(``);
  // 3ג. מוקד-מצוקה (opt-in routing.priority): מתקשר-בסיכון עוקף את שער-הזמן ומגיע
  //     ישירות לאחראי-התורן (24/7), ואם אין-מענה → אחרי-שעות (מנהל→תא-קולי). לפני
  //     שער-הזמן כדי לעקוף שעות/חג. נכנס רק דרך 'incoming' ⇒ בלי לולאת-transfer.
  if (R.priority && R.priority.numbers && R.priority.numbers.length) {
    const pRing = R.priority.ringSeconds || manager.ringSeconds;
    L.push(`    <!-- מוקד-מצוקה: ${R.priority.numbers.length} מתקשרים-בסיכון → אחראי ${esc(R.priority.ext)} ישירות (24/7) -->`);
    L.push(`    <extension name="incoming_priority">`);
    L.push(`      <condition field="destination_number" expression="^incoming$"/>`);
    L.push(`      <condition field="\${cid_e164}" expression="^(${numbersAlternation(R.priority.numbers)})$">`);
    L.push(`        <action application="set" data="priority_call=true"/>`);
    L.push(`        <action application="bridge" data="{leg_timeout=${pRing}}user/${esc(R.priority.ext)}@${esc(tenant.tenantId)}"/>`);
    L.push(`        <action application="transfer" data="afterhours XML ${esc(ctx)}"/>`);
    L.push(`      </condition>`);
    L.push(`    </extension>`);
  }
  // 3ד. מצב-שבעה: כשהחלון פעיל, כל מתקשר (למעט מוקד-מצוקה שכבר נתפס) מנותב
  //     למחליף ישירות (עוקף שער-זמן), ואם אין-מענה → אחרי-שעות (תא-קולי). פג-תוקף לבד.
  if (mrn) {
    const mRing = manager.ringSeconds;
    L.push(`    <!-- מצב-שבעה: מתקשר → מחליף ${esc(mrn.ext)} ישירות, אין-מענה → תא-קולי -->`);
    L.push(`    <extension name="incoming_mourning">`);
    L.push(`      <condition field="destination_number" expression="^incoming$"/>`);
    L.push(`      <condition field="\${mourning_active}" expression="^true$">`);
    L.push(`        <action application="bridge" data="{leg_timeout=${mRing}}user/${esc(mrn.ext)}@${esc(tenant.tenantId)}"/>`);
    L.push(`        <action application="transfer" data="afterhours XML ${esc(ctx)}"/>`);
    L.push(`      </condition>`);
    L.push(`    </extension>`);
  }
  L.push(`    <!-- ניתוב: force_closed→do_closed · global_open→do_open · אחרת→do_closed -->`);
  L.push(`    <extension name="incoming_closed">`);
  L.push(`      <condition field="destination_number" expression="^incoming$"/>`);
  L.push(`      <condition field="\${force_closed}" expression="^true$">`);
  L.push(`        <action application="transfer" data="do_closed XML ${esc(ctx)}"/>`);
  L.push(`      </condition>`);
  L.push(`    </extension>`);
  L.push(`    <extension name="incoming">`);
  L.push(`      <condition field="destination_number" expression="^incoming$"/>`);
  L.push(`      <condition field="\${global_open}" expression="^true$">`);
  L.push(`        <action application="transfer" data="do_open XML ${esc(ctx)}"/>`);
  L.push(`        <anti-action application="transfer" data="do_closed XML ${esc(ctx)}"/>`);
  L.push(`      </condition>`);
  L.push(`    </extension>`);

  // 4ב. do_open — ניתוב-פתוח (ברכה/שם-מתקשר/הקלטה → IVR/תור/משרד; אין-מענה→afterhours).
  L.push(`    <extension name="do_open">`);
  L.push(`      <condition field="destination_number" expression="^do_open$">`);
  if (greet) {
    L.push(`        <action application="answer"/>`);
    L.push(`        <action application="playback" data="${pdir}/greeting-open.wav"/>`);
  }
  if (featureOn(tenant, 'cti.namegreeting') && tenant.cti && tenant.cti.mode !== 'off') {
    L.push(`        <action application="set" data="cti_namegreeting=true"/>`);
  }
  if (featureOn(tenant, 'recording')) {
    L.push(`        <action application="set" data="RECORD_STEREO=true"/>`);
    L.push(`        <action application="record_session" data="$\${recordings_dir}/${esc(tenant.tenantId)}/\${strftime(%Y-%m-%d-%H-%M-%S)}_\${uuid}.wav"/>`);
  }
  if (useIvr) {
    L.push(`        <action application="transfer" data="ivr_menu XML ${esc(ctx)}"/>`);
  } else if (useQueue) {
    L.push(`        <action application="answer"/>`);
    const qAnnounce = R.queue.announcePosition ? `${pdir}/queue-position.wav` : 'undef';
    // maxWaitSec נאכף: מתקשר שממתין מעבר-לזמן נשלח ל-afterhours (לא תקוע לנצח).
    L.push(`        <action application="set" data="fifo_orbit_exten=afterhours:${R.queue.maxWaitSec}"/>`);
    L.push(`        <action application="fifo" data="tenant_${esc(tenant.tenantId)}_q in ${qAnnounce} ${esc(R.queue.music)}"/>`);
    L.push(`        <action application="transfer" data="afterhours XML ${esc(ctx)}"/>`);
  } else {
    L.push(`        <action application="bridge" data="{leg_timeout=${office.ringSeconds}}${esc(officeBridge)}"/>`);
    L.push(`        <action application="transfer" data="afterhours XML ${esc(ctx)}"/>`);
  }
  L.push(`      </condition>`);
  L.push(`    </extension>`);

  // 4ג. do_closed — ניתוב-סגור. עם ברכה: הסתעפות לפי closed_kind
  // (emergency→greeting-emergency · holiday→greeting-holiday · אחרת→greeting-closed).
  if (greet) {
    const closedGreet = (name, kind, file) => {
      L.push(`    <extension name="${name}">`);
      L.push(`      <condition field="destination_number" expression="^do_closed$"/>`);
      if (kind) L.push(`      <condition field="\${closed_kind}" expression="^${kind}$">`);
      else L.push(`      <condition>`);
      L.push(`        <action application="answer"/>`);
      L.push(`        <action application="playback" data="${pdir}/${file}"/>`);
      L.push(`        <action application="transfer" data="afterhours XML ${esc(ctx)}"/>`);
      L.push(`      </condition>`);
      L.push(`    </extension>`);
    };
    closedGreet('do_closed_emergency', 'emergency', 'greeting-emergency.wav');
    closedGreet('do_closed_holiday', 'holiday', 'greeting-holiday.wav');
    closedGreet('do_closed', null, 'greeting-closed.wav'); // fallback (dnd/רגיל)
  } else {
    L.push(`    <extension name="do_closed">`);
    L.push(`      <condition field="destination_number" expression="^do_closed$">`);
    L.push(`        <action application="transfer" data="afterhours XML ${esc(ctx)}"/>`);
    L.push(`      </condition>`);
    L.push(`    </extension>`);
  }

  // 5. אחרי-שעות: מנהל → תא-קולי.
  L.push(`    <extension name="afterhours">`);
  L.push(`      <condition field="destination_number" expression="^afterhours$">`);
  L.push(`        <action application="bridge" data="{leg_timeout=${manager.ringSeconds}}user/${esc(manager.ext)}@${esc(tenant.tenantId)}"/>`);
  // גלישה מדורגת (opt-in): מנהל → כל יעד-גלישה בתורו → תא-קולי.
  if (R.overflow && R.overflow.length) {
    for (const ext of R.overflow) {
      L.push(`        <action application="bridge" data="{leg_timeout=${manager.ringSeconds}}user/${esc(ext)}@${esc(tenant.tenantId)}"/>`);
    }
  }
  if (featureOn(tenant, 'voicemail')) {
    L.push(`        <action application="answer"/>`);
    L.push(`        <action application="sleep" data="500"/>`);
    if (featureOn(tenant, 'voicemail.transcription')) {
      L.push(`        <action application="set" data="vm_transcribe=true"/>`);
    }
    L.push(`        <action application="voicemail" data="default ${esc(tenant.tenantId)} ${esc(vm.box)}"/>`);
  } else {
    // fail-safe: תא-קולי כבוי + מנהל לא-ענה = מבוי-סתום שקט (הגרוע-מכול, דווקא
    // אחרי-שעות). טרמינל-מובטח: answer + צליל-תפוס מובנה (בלי-קובץ) + ניתוק-נקי.
    L.push(`        <action application="answer"/>`);
    L.push(`        <action application="playback" data="tone_stream://%(1000,500,480,620);loops=3"/>`);
    L.push(`        <action application="hangup" data="NORMAL_CLEARING"/>`);
  }
  L.push(`      </condition>`);
  L.push(`    </extension>`);

  // 6. יציאה (מגודר featureOn('outbound')): קידומת N# → SIM לפי ערוץ-שער.
  // כל יציאה מותנית ${sip_authorized}=true ⇒ רק שלוחה-רשומה מחייגת החוצה;
  // רגל-נכנסת מהשער לעולם לא תגשר החוצה (מונע לולאה/toll-fraud).
  // מצב-כשר end-to-end (opt-in voice.kosher): כל חיוג-יוצא (בחירה/ברירת-מחדל/מהיר/
  // IVR-number) יוצא רק דרך SIM-כשר ⇒ המערכת לעולם לא מנתבת דרך תשתית לא-כשרה.
  // (השערים עצמם נשארים כולם לכניסה; רק הבחירה-ליציאה מסוננת.)
  const kosherMode = featureOn(tenant, 'voice.kosher');
  const pickSims = kosherMode ? sims.filter((n) => n.kosher) : sims;
  // במצב-כשר: def כשר-בלבד (ואם אין כשר ⇒ undefined ⇒ המערכת לא מנתבת יציאה
  // לא-כשרה כלל; validate מזהיר). רגיל: ברירת-המחדל המוגדרת/הראשון.
  const def = kosherMode
    ? (pickSims.find((n) => n.id === tenant.outbound.defaultNumberId) || pickSims[0])
    : (sims.find((n) => n.id === tenant.outbound.defaultNumberId) || sims[0]);
  // תקרות-toll-fraud (opt-in voice.hardening): גם cred-גנוב חסום בתקרת-בו-זמניות
  // (רוחב-ה-SIM) ובתקרת-משך (שעה) ⇒ לא מרוקן את חשבון-הסלולר של העמותה. כבוי=ביט-זהה.
  const hardenOut = featureOn(tenant, 'voice.hardening');
  const sec = tenant.security || {};
  const maxConc = Number.isInteger(sec.maxConcurrentOut) && sec.maxConcurrentOut > 0 ? sec.maxConcurrentOut : Math.max(1, sims.length);
  const maxCallSec = Number.isInteger(sec.maxCallSec) && sec.maxCallSec > 0 ? sec.maxCallSec : 3600;
  const tollGuard = (ind) => (hardenOut
    ? [
        `${ind}<action application="limit" data="hash tenant_${esc(tenant.tenantId)} outbound ${maxConc} !USER_BUSY"/>`,
        `${ind}<action application="sched_hangup" data="+${maxCallSec} allotted_timeout"/>`,
      ]
    : []);
  if (featureOn(tenant, 'outbound')) {
    L.push(``);
    L.push(`    <!-- יציאה: קידומת <ערוץ>#<מספר> בוחרת דרך איזה SIM לצאת (רק שלוחה-רשומה) -->`);
    if (featureOn(tenant, 'outbound.pick')) {
      for (const n of pickSims) {
        L.push(`    <extension name="out_pick_${esc(n.id)}">`);
        L.push(`      <condition field="\${sip_authorized}" expression="^true$"/>`);
        L.push(`      <condition field="destination_number" expression="^${n.gatewayChannel}#(\\+?\\d+)$">`);
        L.push(`        <action application="set" data="effective_caller_id_number=${esc(n.e164)}"/>`);
        L.push(`        <action application="set" data="effective_caller_id_name=${esc(n.label)}"/>`);
        for (const g of tollGuard('        ')) L.push(g);
        L.push(`        <action application="bridge" data="sofia/gateway/${esc(gw)}${n.gatewayChannel}/$1"/>`);
        L.push(`      </condition>`);
        L.push(`    </extension>`);
      }
    }
    // 7. יציאת-ברירת-מחדל (בלי קידומת) → המספר שנבחר.
    if (def && featureOn(tenant, 'outbound.default')) {
      // מקומי בלבד (0X / +972 / 972) — הגנת-toll-fraud. בין-לאומי דורש דגל מפורש.
      L.push(`    <!-- יציאת-ברירת-מחדל מקומית (חיוג רגיל בלי קידומת) → ${esc(def.label)} -->`);
      L.push(`    <extension name="out_default">`);
      L.push(`      <condition field="\${sip_authorized}" expression="^true$"/>`);
      L.push(`      <condition field="destination_number" expression="^(0\\d{7,9}|\\+?972\\d{7,9})$">`);
      L.push(`        <action application="set" data="effective_caller_id_number=${esc(def.e164)}"/>`);
      for (const g of tollGuard('        ')) L.push(g);
      L.push(`        <action application="bridge" data="sofia/gateway/${esc(gw)}${def.gatewayChannel}/$1"/>`);
      L.push(`      </condition>`);
      L.push(`    </extension>`);
      if (featureOn(tenant, 'outbound.international')) {
        L.push(`    <!-- יציאה בין-לאומית (opt-in outbound.international) -->`);
        L.push(`    <extension name="out_intl">`);
        L.push(`      <condition field="\${sip_authorized}" expression="^true$"/>`);
        L.push(`      <condition field="destination_number" expression="^(00\\d{6,}|\\+\\d{8,15})$">`);
        L.push(`        <action application="set" data="effective_caller_id_number=${esc(def.e164)}"/>`);
        for (const g of tollGuard('        ')) L.push(g);
        L.push(`        <action application="bridge" data="sofia/gateway/${esc(gw)}${def.gatewayChannel}/$1"/>`);
        L.push(`      </condition>`);
        L.push(`    </extension>`);
      }
    }
  }

  // 8. IVR (opt-in voice.ivr): תפריט-בחירה. הנחיות מוקלטות ע״י המפעיל (מ-manifest).
  if (useIvr) {
    const digits = R.ivr.options.map((o) => o.digit).join('');
    const sd = `$\${sounds_dir}/ivr/${esc(tenant.tenantId)}`;
    L.push(``);
    L.push(`    <!-- IVR: תפריט-בחירה (${R.ivr.options.length} אפשרויות) -->`);
    L.push(`    <extension name="ivr_menu">`);
    L.push(`      <condition field="destination_number" expression="^ivr_menu$">`);
    L.push(`        <action application="answer"/>`);
    L.push(`        <action application="play_and_get_digits" data="1 1 ${R.ivr.invalidMax} ${R.ivr.timeout * 1000} # ${sd}/menu.wav ${sd}/invalid.wav ivr_choice [${digits}] 2000"/>`);
    L.push(`        <action application="transfer" data="ivr_opt_\${ivr_choice} XML ${esc(ctx)}"/>`);
    L.push(`      </condition>`);
    L.push(`    </extension>`);
    // אפשרות ריקה (timeout/invalid מוצה) → אחרי-שעות.
    L.push(`    <extension name="ivr_opt_empty">`);
    L.push(`      <condition field="destination_number" expression="^ivr_opt_$">`);
    L.push(`        <action application="transfer" data="afterhours XML ${esc(ctx)}"/>`);
    L.push(`      </condition>`);
    L.push(`    </extension>`);
    for (const o of R.ivr.options) {
      L.push(`    <extension name="ivr_opt_${esc(o.digit)}">`);
      L.push(`      <condition field="destination_number" expression="^ivr_opt_${esc(o.digit)}$">`);
      for (const a of destActions(o.dest, tenant, gw, def)) L.push(`        ${a}`);
      L.push(`      </condition>`);
      L.push(`    </extension>`);
    }
  }

  // 9. תור (opt-in voice.queue): צוות-המשרד מושך שיחה מהתור ב-*20.
  if (useQueue) {
    L.push(``);
    L.push(`    <!-- תור: צוות-המשרד מקבל שיחה-בהמתנה בחיוג *20 -->`);
    L.push(`    <extension name="queue_agent">`);
    L.push(`      <condition field="destination_number" expression="^\\*20$">`);
    L.push(`        <action application="answer"/>`);
    L.push(`        <action application="fifo" data="tenant_${esc(tenant.tenantId)}_q out nowait"/>`);
    L.push(`      </condition>`);
    L.push(`    </extension>`);
  }

  // 10. חיוג-מהיר (opt-in לפי-נתונים): קוד → מספר, דרך ה-SIM ברירת-המחדל.
  if (R.speedDial && R.speedDial.length && def) {
    L.push(``);
    L.push(`    <!-- חיוג-מהיר -->`);
    for (const s of R.speedDial) {
      L.push(`    <extension name="sd_${esc(s.code.replace(/[*#]/g, (c) => (c === '*' ? 'star' : 'hash')))}">`);
      L.push(`      <condition field="destination_number" expression="^${reEsc(s.code)}$">`);
      L.push(`        <action application="set" data="effective_caller_id_number=${esc(def.e164)}"/>`);
      L.push(`        <action application="bridge" data="sofia/gateway/${esc(gw)}${def.gatewayChannel}/${esc(s.e164)}"/>`);
      L.push(`      </condition>`);
      L.push(`    </extension>`);
    }
  }

  // 11. חיוג-פנימי (opt-in routing.internal): שלוחה→שלוחה — הרשימה נגזרת מהשלוחות
  //     בפועל (office∪manager∪overflow∪IVR), לא טווח קשיח.
  if (R.internal) {
    const ivrExts = R.ivr ? R.ivr.options.flatMap((o) => (o.dest.type === 'ext' ? [o.dest.value] : o.dest.type === 'ringgroup' ? o.dest.value : [])) : [];
    const allExts = [...new Set([...office.ext, manager.ext, ...(R.overflow || []), ...ivrExts, ...(R.priority && R.priority.ext ? [R.priority.ext] : []), ...(tenant.mourning && tenant.mourning.ext ? [tenant.mourning.ext] : [])])].filter((e) => /^[0-9]+$/.test(e));
    if (allExts.length) {
      L.push(``);
      L.push(`    <!-- חיוג-פנימי בין שלוחות -->`);
      L.push(`    <extension name="internal_dial">`);
      L.push(`      <condition field="destination_number" expression="^(${allExts.map(reEsc).join('|')})$">`);
      L.push(`        <action application="bridge" data="user/$1@${esc(tenant.tenantId)}"/>`);
      L.push(`      </condition>`);
      L.push(`    </extension>`);
    }
  }

  // 12. חניית-שיחה (opt-in voice.park): חייג 700 להחניה, השלוחה השנייה מרימה.
  if (featureOn(tenant, 'voice.park')) {
    L.push(``);
    L.push(`    <!-- חניית-שיחה (700) -->`);
    L.push(`    <extension name="park">`);
    L.push(`      <condition field="destination_number" expression="^700$">`);
    L.push(`        <action application="answer"/>`);
    L.push(`        <action application="valet_park" data="valet_lot_${esc(tenant.tenantId)} auto in 5 400"/>`);
    L.push(`      </condition>`);
    L.push(`    </extension>`);
  }

  // 13. אחזור-תא-קולי (*98): הצוות מאזין להודעות מהמכשיר.
  if (featureOn(tenant, 'voicemail')) {
    L.push(``);
    L.push(`    <!-- אחזור-תא-קולי -->`);
    L.push(`    <extension name="vm_retrieve">`);
    L.push(`      <condition field="destination_number" expression="^\\*98$">`);
    L.push(`        <action application="answer"/>`);
    L.push(`        <action application="voicemail" data="check default ${esc(tenant.tenantId)} ${esc(vm.box)}"/>`);
    L.push(`      </condition>`);
    L.push(`    </extension>`);
  }

  L.push(`  </context>`);

  // ── הקשרי-שער פר-SIM נושא-קול: זיהוי-קו אמין לפי השער (לא לפי DID). SIM ל-SMS-
  //    בלבד אינו מקבל הקשר-כניסה-קולי (הוא רק ערוץ-יציאה/SMS). ──
  for (const n of sims.filter((s) => (s.channels || []).includes('voice'))) {
    const gctx = `tenant_${tenant.tenantId}_gw${n.gatewayChannel}`;
    L.push(``);
    L.push(`  <context name="${esc(gctx)}">`);
    L.push(`    <!-- ${esc(n.label)} · ${esc(n.e164)} · ערוץ ${n.gatewayChannel} -->`);
    L.push(`    <extension name="gw${n.gatewayChannel}_entry">`);
    L.push(`      <condition field="destination_number" expression="^.*$">`);
    entryActions(n, '        ');
    L.push(`      </condition>`);
    L.push(`    </extension>`);
    L.push(`  </context>`);
  }

  L.push(`</include>`);
  L.push(``);
  return L.join('\n');
}

/** שורות-actions ליעד-IVR. dest = {type,value}. */
function destActions(dest, tenant, gw, def) {
  const dom = esc(tenant.tenantId);
  switch (dest.type) {
    case 'ext':
      return [`<action application="bridge" data="user/${esc(dest.value)}@${dom}"/>`];
    case 'ringgroup':
      return [`<action application="bridge" data="${dest.value.map((e) => `user/${esc(e)}@${dom}`).join(',')}"/>`];
    case 'number':
      return def
        ? [
            `<action application="set" data="effective_caller_id_number=${esc(def.e164)}"/>`,
            `<action application="bridge" data="sofia/gateway/${esc(gw)}${def.gatewayChannel}/${esc(dest.value)}"/>`,
          ]
        : [`<action application="hangup" data="NO_ROUTE_DESTINATION"/>`];
    case 'voicemail':
      return [
        `<action application="answer"/>`,
        `<action application="voicemail" data="default ${dom} ${esc(dest.value)}"/>`,
      ];
    case 'ivr':
      return [`<action application="transfer" data="${esc(dest.value)} XML tenant_${dom}"/>`];
    case 'hangup':
    default:
      return [`<action application="hangup" data="NORMAL_CLEARING"/>`];
  }
}

// ── directory: משתמשים (משרד, מנהל, תא-קולי) ────────────────────────────────
function directoryXml(tenant) {
  const domain = tenant.tenantId;
  const office = tenant.destinations.office;
  const manager = tenant.destinations.manager;
  const vm = tenant.destinations.voicemail;
  // אקסטנשנים ייחודיים: office + מנהל + גלישה + יעדי-IVR (ext/ringgroup) —
  // אחרת bridge ל-user/<ext> שאין לו רשומה נכשל תמיד.
  const R = tenant.routing || {};
  const ivrExts = [];
  if (R.ivr) {
    for (const o of R.ivr.options) {
      if (o.dest.type === 'ext') ivrExts.push(o.dest.value);
      else if (o.dest.type === 'ringgroup') ivrExts.push(...o.dest.value);
      else if (o.dest.type === 'voicemail') ivrExts.push(o.dest.value); // תיבת-IVR צריכה משתמש
    }
  }
  // תיבת תא-הקולי חייבת להיות משתמש-directory (אחרת ההודעה אובדת); מוסיפים אם חסרה.
  const priorityExt = R.priority && R.priority.ext ? [R.priority.ext] : [];
  const mourningExt = tenant.mourning && tenant.mourning.ext ? [tenant.mourning.ext] : [];
  const exts = [...new Set([...office.ext, manager.ext, ...(R.overflow || []), ...ivrExts, ...priorityExt, ...mourningExt])];
  const users = [...exts, ...(exts.includes(vm.box) ? [] : [vm.box])];
  const tid = tenant.tenantId;

  const L = [];
  L.push(`<?xml version="1.0" encoding="utf-8"?>`);
  L.push(`<!-- מחולל אוטומטית — משתמשי ${esc(tenant.orgName)}. סיסמאות (סוד פר-שלוחה) מוזרקות בהתקנה. -->`);
  L.push(`<include>`);
  L.push(`  <domain name="${esc(domain)}">`);
  L.push(`    <users>`);
  for (const ext of users) {
    const isManager = ext === manager.ext;
    const isVmBox = ext === vm.box && !exts.includes(vm.box); // תיבה-בלבד
    L.push(`      <user id="${esc(ext)}">`);
    L.push(`        <params>`);
    L.push(`          <param name="password" value="$\${${esc(extSecret(tid, ext))}}"/>`);
    L.push(`          <param name="vm-password" value="$\${${esc(vmSecret(tid, ext))}}"/>`);
    // תא-קולי-במייל (מגודר voicemail.email): מנהל/תיבה→vm.email; שלוחת-משרד→office.email.
    const vmMail = isManager || isVmBox ? vm.email : office.ext.includes(ext) ? office.email : undefined;
    if (vmMail && featureOn(tenant, 'voicemail.email')) {
      L.push(`          <param name="vm-mailto" value="${esc(vmMail)}"/>`);
      L.push(`          <param name="vm-attach-file" value="true"/>`);
    }
    L.push(`        </params>`);
    L.push(`        <variables>`);
    L.push(`          <variable name="user_context" value="tenant_${esc(tenant.tenantId)}"/>`);
    L.push(`          <variable name="effective_caller_id_name" value="${esc(isManager ? 'מנהל' : isVmBox ? 'תא-קולי' : 'משרד')} ${esc(tenant.orgName)}"/>`);
    L.push(`          <variable name="toll_allow" value="domestic"/>`);
    L.push(`        </variables>`);
    L.push(`      </user>`);
  }
  L.push(`    </users>`);
  L.push(`  </domain>`);
  L.push(`</include>`);
  L.push(``);
  return L.join('\n');
}

// ── gateways: שער-ה-GSM של הלקוח (ציוד-לקוח, downstream) ─────────────────────
function gatewaysXml(tenant) {
  const gw = `${tenant.tenantId}-gw`;
  const sims = outboundSims(tenant);
  const L = [];
  L.push(`<?xml version="1.0" encoding="utf-8"?>`);
  L.push(`<!-- שער-ה-GSM של הלקוח (ציוד בבעלותו, עם ה-SIM שלו). זה לא ספק — זה הלקוח. -->`);
  L.push(`<!-- כתובת-ה-IP והסיסמה מוזרקות בהתקנה לפי הרשת של הלקוח. -->`);
  L.push(`<include>`);
  for (const n of sims) {
    L.push(`  <gateway name="${esc(gw)}${n.gatewayChannel}">`);
    L.push(`    <!-- ${esc(n.label)} · ${esc(n.e164)}${n.kosher ? ' · כשר' : ''} · ערוץ ${n.gatewayChannel} -->`);
    L.push(`    <param name="username" value="${esc(gw)}${n.gatewayChannel}"/>`);
    L.push(`    <param name="password" value="$\${${secretsFor(tenant).gsm_gateway_password}}"/>`);
    L.push(`    <param name="proxy" value="$\${${secretsFor(tenant).gsm_gateway_ip}}"/>`);
    L.push(`    <param name="register" value="false"/>`);
    L.push(`    <param name="caller-id-in-from" value="true"/>`);
    L.push(`    <!-- שיחה נכנסת מה-SIM הזה נופלת להקשר-השער הייחודי (זיהוי-קו אמין) -->`);
    L.push(`    <param name="context" value="tenant_${esc(tenant.tenantId)}_gw${n.gatewayChannel}"/>`);
    L.push(`  </gateway>`);
  }
  L.push(`</include>`);
  L.push(``);
  return L.join('\n');
}

// ── manifest: תקציר-מה-שחולל + מפת-מסלולים + סייגים ──────────────────────────
function manifest(tenant, warnings, opts = {}) {
  const vnums = voiceNumbers(tenant);
  const sims = outboundSims(tenant);
  const skipped = tenant.numbers.filter((n) => n.onramp === 'device-link' || !n.channels.includes('voice'));
  const heb = hebrewBlock(tenant, opts);
  const zwins = zmanimBlock(tenant, opts);
  const prompts = requiredPrompts(tenant);
  return {
    tenantId: tenant.tenantId,
    orgName: tenant.orgName,
    model: 'pure-downstream',
    ...(prompts.length ? { requiredPrompts: prompts, promptCapabilities: promptCapabilities(tenant) } : {}),
    context: `tenant_${tenant.tenantId}`,
    officeHours: tenant.officeHours,
    ...(heb.length ? { hebrewCalendar: { anchor: opts.anchorDate, window: opts.calendarWindow || 400, closedDays: heb } } : {}),
    ...(zwins.length ? { zmanim: { anchor: opts.anchorDate, window: opts.calendarWindow || 400, city: geoOf(tenant).he, windows: zwins } } : {}),
    ...(tenant.mourning ? { mourning: tenant.mourning } : {}),
    inboundVoiceNumbers: vnums.map((n) => ({ id: n.id, e164: n.e164, label: n.label, onramp: n.onramp, kosher: n.kosher })),
    outboundSims: sims.map((n) => ({ id: n.id, e164: n.e164, label: n.label, prefix: `${n.gatewayChannel}#`, channel: n.gatewayChannel })),
    outboundDefault: tenant.outbound.defaultNumberId,
    ...(featureOn(tenant, 'voice.kosher') ? { kosherOutbound: true } : {}),
    nonVoiceChannels: skipped.map((n) => ({ id: n.id, e164: n.e164, label: n.label, type: n.type, onramp: n.onramp, channels: n.channels, note: n.onramp === 'device-link' ? 'ווצאפ ריבוי-מכשירים — מטופל בגשר-הודעות, לא בדיאלפלן הקולי' : 'לא נושא-קול' })),
    cti: tenant.cti,
    ...(tenant.routing && Object.keys(tenant.routing).length
      ? {
          routing: {
            ivr: tenant.routing.ivr ? { options: tenant.routing.ivr.options.length, greeting: tenant.routing.ivr.greeting } : null,
            queue: tenant.routing.queue || null,
            ringStrategy: tenant.routing.ringStrategy || 'simultaneous',
            blocklist: (tenant.routing.blocklist || []).length,
            allowlist: (tenant.routing.allowlist || []).length,
            ...(tenant.routing.priority ? { priority: { count: tenant.routing.priority.numbers.length, ext: tenant.routing.priority.ext } } : {}),
            dnd: !!tenant.routing.dnd,
            speedDial: (tenant.routing.speedDial || []).length,
            overflow: tenant.routing.overflow || [],
            internal: !!tenant.routing.internal,
            perNumberHours: tenant.numbers.filter((n) => n.hours).map((n) => n.id),
          },
        }
      : {}),
    files: [
      `dialplan/tenant_${tenant.tenantId}.xml`,
      `directory/${tenant.tenantId}.xml`,
      `sip_profiles/gateways/${tenant.tenantId}.xml`,
    ],
    warnings,
  };
}

/**
 * המנוע הראשי. tenant מנורמל (מ-validateTenant) → מפת-קבצים + manifest.
 * @param {object} tenant
 * @param {string[]} [warnings=[]] סייגים מהוולידציה — נצרבים ל-manifest.
 * @returns {{files: Record<string,string>, manifest: object}}
 */
export function generateConfig(tenant, warnings = [], opts = {}) {
  // אזהרה: לוח-עברי דלוק אך לא נמסר anchorDate ⇒ כל סגירות-החג נופלות בשקט.
  const warns = [...warnings];
  if (featureOn(tenant, 'calendar.hebrew') && !opts.anchorDate) {
    warns.push('calendar.hebrew דלוק אך לא נמסר anchorDate — סגירות-החג לא ייווצרו (העבר opts.anchorDate).');
  }
  const m = manifest(tenant, warns, opts);
  const files = {
    [`dialplan/tenant_${tenant.tenantId}.xml`]: dialplanXml(tenant, opts),
    [`directory/${tenant.tenantId}.xml`]: directoryXml(tenant),
    [`sip_profiles/gateways/${tenant.tenantId}.xml`]: gatewaysXml(tenant),
    'manifest.json': JSON.stringify(m, null, 2) + '\n',
  };
  return { files, manifest: m, warnings: warns };
}
