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

import { featureOn } from './config.mjs';
import { hebrewClosedDates } from './hebcal.mjs';
import { numbersAlternation } from './routing.mjs';

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
/** ימי-הסגירה העבריים (יו״ט) לחלון — ריק אם הדגל כבוי או אין anchorDate. */
function hebrewBlock(tenant, opts) {
  if (!featureOn(tenant, 'calendar.hebrew') || !opts.anchorDate) return [];
  const diaspora = tenant.timezone && !/Jerusalem|Tel_Aviv|Asia\/Hebron/.test(tenant.timezone);
  return hebrewClosedDates(opts.anchorDate, opts.calendarWindow || 400, {
    diaspora,
    tz: tenant.timezone || 'Asia/Jerusalem',
    includeErev: featureOn(tenant, 'calendar.erev'),
    includeCholHamoed: featureOn(tenant, 'calendar.cholhamoed'),
  });
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
  const wday = daysToWday(oh.days);
  const tod = `${fsTime(oh.start)}-${fsTime(oh.end)}`;
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

  // 0. חסימה/היתר (opt-in voice.blocklist): על caller_id_number בלבד ⇒ בטוח
  // לפנימי/יוצא (השלוחה 101 לעולם לא מספר-חיצוני). חסימה=מתאים→ניתוק;
  // היתר=חיצוני-שאינו-ברשימה→ניתוק (continue=true כדי לא לעצור מותר).
  if (featureOn(tenant, 'voice.blocklist') && R.blocklist && R.blocklist.length) {
    L.push(``);
    L.push(`    <!-- רשימת-חסימה: ${R.blocklist.length} מספרים → ניתוק -->`);
    L.push(`    <extension name="blocklist">`);
    L.push(`      <condition field="caller_id_number" expression="^(${numbersAlternation(R.blocklist)})$">`);
    L.push(`        <action application="set" data="closed_reason=מספר-חסום"/>`);
    L.push(`        <action application="hangup" data="CALL_REJECTED"/>`);
    L.push(`      </condition>`);
    L.push(`    </extension>`);
  }
  if (featureOn(tenant, 'voice.blocklist') && R.allowlist && R.allowlist.length) {
    L.push(`    <!-- רשימת-היתר: מתקשר-חיצוני שאינו ברשימה → ניתוק -->`);
    L.push(`    <extension name="allowlist" continue="true">`);
    L.push(`      <condition field="caller_id_number" expression="^\\+?\\d{8,15}$"/>`);
    L.push(`      <condition field="caller_id_number" expression="^(${numbersAlternation(R.allowlist)})$">`);
    L.push(`        <anti-action application="hangup" data="CALL_REJECTED"/>`);
    L.push(`      </condition>`);
    L.push(`    </extension>`);
  }

  // 1. ברירת-מחדל: משרד סגור.
  L.push(``);
  L.push(`    <!-- שער-הזמן: ברירת-מחדל סגור, נפתח רק בחלון שעות-המשרד -->`);
  L.push(`    <extension name="office_default" continue="true">`);
  L.push(`      <condition>`);
  L.push(`        <action application="set" data="office_open=false"/>`);
  L.push(`      </condition>`);
  L.push(`    </extension>`);

  // 2. חלון שעות-משרד.
  L.push(`    <extension name="office_open_window" continue="true">`);
  L.push(`      <condition wday="${wday}" time-of-day="${tod}">`);
  L.push(`        <action application="set" data="office_open=true"/>`);
  L.push(`      </condition>`);
  L.push(`    </extension>`);

  // 2ב. לוח-עברי (opt-in calendar.hebrew): ימי-חג מחושבים-מראש דורסים ל"סגור".
  // שבת כבר מכוסה ב-wday (לכן לא נכללת). דורש anchorDate (דטרמיניזם golden).
  const heb = hebrewBlock(tenant, opts);
  if (heb.length) {
    L.push(``);
    L.push(`    <!-- לוח-עברי: ${heb.length} ימי-חג → סגור (מחושב מ-${esc(opts.anchorDate)}, חלון ${opts.calendarWindow || 400} יום) -->`);
    for (const c of heb) {
      L.push(`    <extension name="heb_${c.iso.replace(/-/g, '')}" continue="true">`);
      L.push(`      <condition date-time="${c.iso} 00:00:00~${c.iso} 23:59:59">`);
      L.push(`        <action application="set" data="office_open=false"/>`);
      L.push(`        <action application="set" data="closed_reason=${esc(c.reason)}"/>`);
      L.push(`      </condition>`);
      L.push(`    </extension>`);
    }
  }

  // 2ג. נא-לא-להפריע (opt-in voice.dnd): דורס ל"סגור" תמיד ⇒ הכל→מנהל/תא-קולי.
  if (featureOn(tenant, 'voice.dnd') && R.dnd) {
    L.push(``);
    L.push(`    <!-- מצב נא-לא-להפריע: הכל מנותב לאחרי-שעות -->`);
    L.push(`    <extension name="dnd_override" continue="true">`);
    L.push(`      <condition>`);
    L.push(`        <action application="set" data="office_open=false"/>`);
    L.push(`        <action application="set" data="closed_reason=נא לא להפריע"/>`);
    L.push(`      </condition>`);
    L.push(`    </extension>`);
  }

  // 3. כניסה פר-DID → זיהוי-קו → transfer ל-incoming (או ל-line_<id> אם לו לו״ז משלו).
  L.push(``);
  L.push(`    <!-- כניסה: כל מספר נושא-קול מזוהה לפי ה-DID ומנותב פנימה -->`);
  for (const n of vnums) {
    const hasHours = n.hours && Array.isArray(n.hours.days) && n.hours.start && n.hours.end;
    const target = hasHours ? `line_${esc(n.id)}` : 'incoming';
    L.push(`    <extension name="in_${esc(n.id)}">`);
    L.push(`      <condition field="destination_number" expression="^${reEsc(n.e164)}$">`);
    L.push(`        <action application="set" data="inbound_line=${esc(n.label)}"/>`);
    L.push(`        <action application="set" data="inbound_number=${esc(n.e164)}"/>`);
    L.push(`        <action application="transfer" data="${target} XML ${esc(ctx)}"/>`);
    L.push(`      </condition>`);
    L.push(`    </extension>`);
  }

  // 3ב. לו״ז פר-מספר (opt-in voice.timecondition + number.hours): כל DID חלון-משלו.
  for (const n of vnums) {
    if (!(n.hours && Array.isArray(n.hours.days) && n.hours.start && n.hours.end)) continue;
    const lwday = daysToWday(n.hours.days);
    const ltod = `${fsTime(n.hours.start)}-${fsTime(n.hours.end)}`;
    L.push(`    <extension name="line_${esc(n.id)}">`);
    L.push(`      <condition field="destination_number" expression="^line_${esc(n.id)}$"/>`);
    L.push(`      <condition wday="${lwday}" time-of-day="${ltod}">`);
    L.push(`        <action application="set" data="office_open=true"/>`);
    L.push(`        <action application="transfer" data="incoming XML ${esc(ctx)}"/>`);
    L.push(`        <anti-action application="set" data="office_open=false"/>`);
    L.push(`        <anti-action application="transfer" data="incoming XML ${esc(ctx)}"/>`);
    L.push(`      </condition>`);
    L.push(`    </extension>`);
  }

  // 4. ניתוב-פנימי: פתוח → משרד, אחרת → אחרי-שעות.
  L.push(``);
  L.push(`    <!-- ניתוב: פתוח → משרד (אין-מענה נופל לאחרי-שעות); סגור → מנהל → תא-קולי -->`);
  L.push(`    <extension name="incoming">`);
  L.push(`      <condition field="destination_number" expression="^incoming$"/>`);
  L.push(`      <condition field="\${office_open}" expression="^true$">`);
  if (featureOn(tenant, 'recording')) {
    L.push(`        <action application="set" data="RECORD_STEREO=true"/>`);
    L.push(`        <action application="record_session" data="$\${recordings_dir}/${esc(tenant.tenantId)}/\${strftime(%Y-%m-%d-%H-%M-%S)}_\${uuid}.wav"/>`);
  }
  if (useIvr) {
    L.push(`        <action application="transfer" data="ivr_menu XML ${esc(ctx)}"/>`);
  } else if (useQueue) {
    L.push(`        <action application="answer"/>`);
    L.push(`        <action application="fifo" data="tenant_${esc(tenant.tenantId)}_q in undef ${esc(R.queue.music)}"/>`);
    L.push(`        <action application="transfer" data="afterhours XML ${esc(ctx)}"/>`);
  } else {
    L.push(`        <action application="bridge" data="{leg_timeout=${office.ringSeconds}}${esc(officeBridge)}"/>`);
    L.push(`        <action application="transfer" data="afterhours XML ${esc(ctx)}"/>`);
  }
  L.push(`        <anti-action application="transfer" data="afterhours XML ${esc(ctx)}"/>`);
  L.push(`      </condition>`);
  L.push(`    </extension>`);

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
    L.push(`        <action application="voicemail" data="default ${esc(tenant.tenantId)} ${esc(vm.box)}"/>`);
  }
  L.push(`      </condition>`);
  L.push(`    </extension>`);

  // 6. יציאה: קידומת N# → SIM לפי ערוץ-שער.
  L.push(``);
  L.push(`    <!-- יציאה: קידומת <ערוץ>#<מספר> בוחרת דרך איזה SIM לצאת -->`);
  for (const n of sims) {
    L.push(`    <extension name="out_pick_${esc(n.id)}">`);
    L.push(`      <condition field="destination_number" expression="^${n.gatewayChannel}#(\\+?\\d+)$">`);
    L.push(`        <action application="set" data="effective_caller_id_number=${esc(n.e164)}"/>`);
    L.push(`        <action application="set" data="effective_caller_id_name=${esc(n.label)}"/>`);
    L.push(`        <action application="bridge" data="sofia/gateway/${esc(gw)}${n.gatewayChannel}/$1"/>`);
    L.push(`      </condition>`);
    L.push(`    </extension>`);
  }

  // 7. יציאת-ברירת-מחדל (בלי קידומת) → המספר שנבחר.
  const def = sims.find((n) => n.id === tenant.outbound.defaultNumberId) || sims[0];
  if (def) {
    L.push(`    <!-- יציאת-ברירת-מחדל (חיוג רגיל בלי קידומת) → ${esc(def.label)} -->`);
    L.push(`    <extension name="out_default">`);
    L.push(`      <condition field="destination_number" expression="^(0\\d{7,9}|\\+?\\d{8,15})$">`);
    L.push(`        <action application="set" data="effective_caller_id_number=${esc(def.e164)}"/>`);
    L.push(`        <action application="bridge" data="sofia/gateway/${esc(gw)}${def.gatewayChannel}/$1"/>`);
    L.push(`      </condition>`);
    L.push(`    </extension>`);
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

  // 11. חיוג-פנימי (opt-in routing.internal): שלוחה→שלוחה (1XX/2XX).
  if (R.internal) {
    L.push(``);
    L.push(`    <!-- חיוג-פנימי בין שלוחות -->`);
    L.push(`    <extension name="internal_dial">`);
    L.push(`      <condition field="destination_number" expression="^([12]\\d\\d)$">`);
    L.push(`        <action application="bridge" data="user/$1@${esc(tenant.tenantId)}"/>`);
    L.push(`      </condition>`);
    L.push(`    </extension>`);
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

  L.push(`  </context>`);
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
        : [`<action application="hangup"/>`];
    case 'voicemail':
      return [
        `<action application="answer"/>`,
        `<action application="voicemail" data="default ${dom} ${esc(dest.value)}"/>`,
      ];
    case 'ivr':
      return [`<action application="transfer" data="${esc(dest.value)} XML tenant_${dom}"/>`];
    case 'hangup':
    default:
      return [`<action application="hangup"/>`];
  }
}

// ── directory: משתמשים (משרד, מנהל, תא-קולי) ────────────────────────────────
function directoryXml(tenant) {
  const domain = tenant.tenantId;
  const office = tenant.destinations.office;
  const manager = tenant.destinations.manager;
  const vm = tenant.destinations.voicemail;
  // אקסטנשנים ייחודיים: כל ה-office + המנהל.
  const exts = [...new Set([...office.ext, manager.ext])];

  const L = [];
  L.push(`<?xml version="1.0" encoding="utf-8"?>`);
  L.push(`<!-- מחולל אוטומטית — משתמשי ${esc(tenant.orgName)}. סיסמאות מוזרקות בהתקנה. -->`);
  L.push(`<include>`);
  L.push(`  <domain name="${esc(domain)}">`);
  L.push(`    <users>`);
  for (const ext of exts) {
    const isManager = ext === manager.ext;
    L.push(`      <user id="${esc(ext)}">`);
    L.push(`        <params>`);
    L.push(`          <param name="password" value="$\${default_provision_password}"/>`);
    L.push(`          <param name="vm-password" value="${esc(vm.box)}"/>`);
    if (isManager && vm.email) {
      L.push(`          <param name="vm-mailto" value="${esc(vm.email)}"/>`);
      L.push(`          <param name="vm-attach-file" value="true"/>`);
    }
    L.push(`        </params>`);
    L.push(`        <variables>`);
    L.push(`          <variable name="user_context" value="tenant_${esc(tenant.tenantId)}"/>`);
    L.push(`          <variable name="effective_caller_id_name" value="${esc(isManager ? 'מנהל' : 'משרד')} ${esc(tenant.orgName)}"/>`);
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
    L.push(`    <param name="password" value="$\${gsm_gateway_password}"/>`);
    L.push(`    <param name="proxy" value="$\${gsm_gateway_ip}"/>`);
    L.push(`    <param name="register" value="false"/>`);
    L.push(`    <param name="caller-id-in-from" value="true"/>`);
    L.push(`    <!-- שיחה נכנסת מה-SIM הזה נופלת ישר ל-context של הלקוח -->`);
    L.push(`    <param name="context" value="tenant_${esc(tenant.tenantId)}"/>`);
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
  return {
    tenantId: tenant.tenantId,
    orgName: tenant.orgName,
    model: 'pure-downstream',
    context: `tenant_${tenant.tenantId}`,
    officeHours: tenant.officeHours,
    ...(heb.length ? { hebrewCalendar: { anchor: opts.anchorDate, window: opts.calendarWindow || 400, closedDays: heb } } : {}),
    inboundVoiceNumbers: vnums.map((n) => ({ id: n.id, e164: n.e164, label: n.label, onramp: n.onramp, kosher: n.kosher })),
    outboundSims: sims.map((n) => ({ id: n.id, e164: n.e164, label: n.label, prefix: `${n.gatewayChannel}#`, channel: n.gatewayChannel })),
    outboundDefault: tenant.outbound.defaultNumberId,
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
  const m = manifest(tenant, warnings, opts);
  const files = {
    [`dialplan/tenant_${tenant.tenantId}.xml`]: dialplanXml(tenant, opts),
    [`directory/${tenant.tenantId}.xml`]: directoryXml(tenant),
    [`sip_profiles/gateways/${tenant.tenantId}.xml`]: gatewaysXml(tenant),
    'manifest.json': JSON.stringify(m, null, 2) + '\n',
  };
  return { files, manifest: m };
}
