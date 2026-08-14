// ─────────────────────────────────────────────────────────────────────────────
// telephony · validate — שער-התקינות של קונפיג-הלקוח.
// טהור. מחזיר {ok, errors[], warnings[], tenant} כאשר tenant = הקונפיג המנורמל
// (e164 ממולא, ברירות-מחדל מוזרקות). errors חוסמים generate; warnings לא.
// עיקרון-ברזל נאכף כאן: אין שדה-ספק. כל onramp הוא downstream. type=whatsapp/
// virtual מקבלים סייג אם ה-onramp לא תואם את המודל pure-downstream.
// ─────────────────────────────────────────────────────────────────────────────

import { toE164 } from './normalize.mjs';
import { applyVertical, migrateConfig, sanitizeConfigFields, reportDroppedKeys, VERTICAL_PACKS, SCHEMA_VERSION } from './config.mjs';
import { normalizeRouting } from './routing.mjs';

const TIME_RE = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;
const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;
const NUMID_RE = /^[a-z0-9][a-z0-9_-]{0,30}$/;

const NUMBER_TYPES = ['sim', 'virtual', 'whatsapp'];
const ONRAMPS = ['sim-in-gateway', 'customer-forward', 'device-link'];
const CHANNELS = ['voice', 'sms', 'whatsapp'];

// המודל-הנכון לכל טיב-מספר (pure-downstream). סטייה = warning, לא error —
// כי הלקוח בשטח יכול לבחור אחרת, אבל אנחנו מסמנים שזה לא הדרך המומלצת.
const EXPECTED_ONRAMP = {
  sim: 'sim-in-gateway',
  virtual: 'customer-forward',
  whatsapp: 'device-link',
};

function hhmmToMinutes(s) {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
}

// C1 מנחיל-העומק: מסיר '$' מטקסט-חופשי-לתצוגה (שם/תווית/סיבה) — מונע הזרקת
// $${SECRET}/${var} של FreeSWITCH. שמות-עמותה/תוויות לעולם לא מכילים '$' לגיטימי.
const noVars = (s) => (typeof s === 'string' ? s.replace(/\$/g, '') : s);

// C1-שלם (נחיל-5 F1): כתובת-מייל לתא-קולי נצרבת ל-<param name="vm-mailto"> ב-directory,
// שאותו FreeSWITCH מרחיב-$${} בזמן-טעינה. פורמט קפדני ללא '$'/מרכאות/סוגריים/רווח ⇒
// אין הזרקת-סוד (‏$${GSM_PW__x}) ולא שבירת-XML. פסול = דילוג + אזהרה (לא חוסם).
// נחיל-6 R6-10: מחלקת-\s של JS לא כוללת תווי-בקרה (0x00-0x08,0x0E-0x1F,0x7F) — מייל
// נושא-בקרה עבר cleanEmail ונצרב ל-directory ⇒ פרסינג-XML נכשל וכל שלוחות-הדייר לא נטענו.
const EMAIL_RE = /^[^\s\x00-\x1f\x7f$<>"'`{}@]+@[^\s\x00-\x1f\x7f$<>"'`{}@]+\.[^\s\x00-\x1f\x7f$<>"'`{}@]{2,}$/;

/**
 * @param {object} raw קונפיג-לקוח גולמי
 * @returns {{ok:boolean, errors:string[], warnings:string[], tenant:object|null}}
 */
export function validateTenant(raw) {
  const errors = [];
  const warnings = [];
  if (!raw || typeof raw !== 'object') {
    return { ok: false, errors: ['קונפיג ריק או לא-אובייקט.'], warnings, tenant: null };
  }
  // מיגרציה→ורטיקל→חיטוי: ורטיקל זורע ברירות מתחת לקונפיג המפורש (שגובר).
  if (raw.vertical != null && !VERTICAL_PACKS[raw.vertical]) {
    warnings.push(`vertical לא-מוכר: "${raw.vertical}" — התעלמות מחבילת-הברירות.`);
  }
  raw = applyVertical(migrateConfig(raw));
  const { features, terms } = sanitizeConfigFields(raw);
  // גלאי-טעות-הקלדה: מפתח-תצורה לא-מוכר הדומה-מאוד למוכר ⇒ אזהרה ("אולי התכוונת").
  // מונע את כשל-ה"הדלקתי-בשקט" (voice.ivrr ⇒ IVR כבוי בלי אזהרה). לא-error.
  for (const d of reportDroppedKeys(raw)) {
    warnings.push(`${d.kind === 'feature' ? 'דגל' : 'מונח'} לא-מוכר "${d.key}" — לא-משפיע; אולי התכוונת ל-"${d.suggestion}"?`);
  }

  // ── שדות-שורש ──
  if (!SLUG_RE.test(raw.tenantId || '')) {
    errors.push(`tenantId לא-תקין: "${raw.tenantId}" (slug אותיות-קטנות/ספרות/מקף, 3-40 תווים).`);
  }
  if (!raw.orgName || typeof raw.orgName !== 'string') {
    errors.push('orgName חסר.');
  }
  const timezone = typeof raw.timezone === 'string' && raw.timezone ? raw.timezone : 'Asia/Jerusalem';
  // מיקום לזמנים הלכתיים (opt): city (מפתח-עיר) או geo{lat,lon,candle?,tzeis?}.
  let city;
  if (typeof raw.city === 'string' && /^[a-z]{2,20}$/.test(raw.city)) city = raw.city;
  let geo;
  if (raw.geo && typeof raw.geo === 'object' && Number.isFinite(raw.geo.lat) && Number.isFinite(raw.geo.lon)
    && raw.geo.lat >= -90 && raw.geo.lat <= 90 && raw.geo.lon >= -180 && raw.geo.lon <= 180) {
    geo = { lat: raw.geo.lat, lon: raw.geo.lon };
    if (Number.isFinite(raw.geo.candle) && raw.geo.candle >= 0 && raw.geo.candle <= 120) geo.candle = raw.geo.candle;
    if (Number.isFinite(raw.geo.tzeis) && raw.geo.tzeis >= 0 && raw.geo.tzeis <= 120) geo.tzeis = raw.geo.tzeis;
    if (typeof raw.geo.he === 'string' && raw.geo.he.length <= 40) geo.he = raw.geo.he;
  }

  // ── שעות-משרד ──
  const oh = raw.officeHours;
  let officeHours = null;
  if (!oh || typeof oh !== 'object') {
    errors.push('officeHours חסר.');
  } else {
    const days = Array.isArray(oh.days) ? oh.days : [];
    const daysOk = days.length > 0 && days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6);
    if (!daysOk) errors.push('officeHours.days חייב להיות מערך ימים 0-6 לא-ריק.');
    if (!TIME_RE.test(oh.start || '')) errors.push(`officeHours.start לא-תקין: "${oh.start}".`);
    if (!TIME_RE.test(oh.end || '')) errors.push(`officeHours.end לא-תקין: "${oh.end}".`);
    if (TIME_RE.test(oh.start || '') && TIME_RE.test(oh.end || '')) {
      if (hhmmToMinutes(oh.start) >= hhmmToMinutes(oh.end)) {
        errors.push(`officeHours: start (${oh.start}) חייב להיות לפני end (${oh.end}).`);
      }
    }
    if (daysOk) {
      officeHours = {
        days: [...new Set(days)].sort((a, b) => a - b),
        start: oh.start,
        end: oh.end,
      };
    }
  }

  // ── מספרים ──
  const numbers = [];
  const seenIds = new Set();
  const seenE164 = new Map(); // e164 → id ראשון
  let voiceBearing = 0;
  if (!Array.isArray(raw.numbers) || raw.numbers.length === 0) {
    errors.push('numbers חייב להיות מערך לא-ריק.');
  } else {
    for (let i = 0; i < raw.numbers.length; i++) {
      const n = raw.numbers[i] || {};
      const tag = n.id ? `numbers[${n.id}]` : `numbers[#${i}]`;
      if (!NUMID_RE.test(n.id || '')) {
        errors.push(`${tag}: id לא-תקין.`);
      } else if (seenIds.has(n.id)) {
        errors.push(`${tag}: id כפול.`);
      } else {
        seenIds.add(n.id);
      }
      if (!NUMBER_TYPES.includes(n.type)) {
        errors.push(`${tag}: type חייב להיות אחד מ-${NUMBER_TYPES.join('/')}.`);
      }
      if (!ONRAMPS.includes(n.onramp)) {
        errors.push(`${tag}: onramp חייב להיות אחד מ-${ONRAMPS.join('/')}.`);
      }
      const e164 = toE164(n.e164);
      if (!e164) {
        errors.push(`${tag}: e164 לא-ניתן-לנרמול: "${n.e164}".`);
      } else if (seenE164.has(e164)) {
        errors.push(`${tag}: e164 ${e164} כפול (כבר ב-${seenE164.get(e164)}).`);
      } else {
        seenE164.set(e164, n.id);
      }
      if (!n.label) errors.push(`${tag}: label חסר.`);

      // ערוצים + ברירת-מחדל.
      let channels = Array.isArray(n.channels) ? [...new Set(n.channels)] : ['voice'];
      if (channels.length === 0) channels = ['voice'];
      const badCh = channels.filter((c) => !CHANNELS.includes(c));
      if (badCh.length) errors.push(`${tag}: channels לא-תקינים: ${badCh.join(',')}.`);

      // סייג pure-downstream: onramp שלא תואם את הטיב.
      if (NUMBER_TYPES.includes(n.type) && ONRAMPS.includes(n.onramp)) {
        const expected = EXPECTED_ONRAMP[n.type];
        if (n.onramp !== expected) {
          warnings.push(
            `${tag}: type=${n.type} בדרך-כלל onramp=${expected} (downstream); הוגדר ${n.onramp}. ודא שזו כוונה.`,
          );
        }
      }

      // ערוץ-קול דורש sim-in-gateway או customer-forward (device-link = לא-קולי).
      const carriesVoice = channels.includes('voice');
      if (carriesVoice) {
        if (n.onramp === 'device-link') {
          warnings.push(`${tag}: מסומן voice אך onramp=device-link — device-link אינו מסלול-קול; מדולג מהדיאלפלן הקולי.`);
        } else {
          voiceBearing++;
        }
      }

      // ערוץ יציאה דרך SIM דורש gatewayChannel.
      if (n.onramp === 'sim-in-gateway' && !Number.isInteger(n.gatewayChannel)) {
        warnings.push(`${tag}: sim-in-gateway ללא gatewayChannel — יציאה דרך המספר הזה לא תנותב עד שיוגדר ערוץ.`);
      }
      if (n.kosher && carriesVoice) {
        warnings.push(`${tag}: מספר-כשר — יציאה לא-כשרה לא תנותב דרכו אוטומטית; אמת מול הספק הכשר.`);
      }

      // לו״ז פר-מספר (אופציונלי): חלון-שעות משלו לקו הזה.
      let lineHours;
      if (n.hours && typeof n.hours === 'object') {
        const hd = Array.isArray(n.hours.days) ? n.hours.days.filter((x) => Number.isInteger(x) && x >= 0 && x <= 6) : [];
        if (hd.length && TIME_RE.test(n.hours.start || '') && TIME_RE.test(n.hours.end || '') && hhmmToMinutes(n.hours.start) < hhmmToMinutes(n.hours.end)) {
          lineHours = { days: [...new Set(hd)].sort((a, b) => a - b), start: n.hours.start, end: n.hours.end };
        } else {
          warnings.push(`${tag}: hours לא-תקין — הקו ישתמש בשעות-המשרד הכלליות.`);
        }
      }

      numbers.push({
        id: n.id,
        e164: e164 || n.e164,
        label: noVars(n.label),
        type: n.type,
        onramp: n.onramp,
        channels,
        kosher: !!n.kosher,
        ...(Number.isInteger(n.gatewayChannel) ? { gatewayChannel: n.gatewayChannel } : {}),
        ...(lineHours ? { hours: lineHours } : {}),
        ...(n.role === 'announcement'
          ? { role: 'announcement', announcementText: typeof n.announcementText === 'string' ? n.announcementText : '' }
          : {}),
        // קו-מופנה שהוגדר לו forwardTo (id של SIM) = alias של אותו SIM.
        ...(n.onramp === 'customer-forward' && typeof n.forwardTo === 'string' ? { forwardTo: n.forwardTo } : {}),
      });
    }
  }
  if (voiceBearing === 0) {
    errors.push('אין אף מספר נושא-קול (voice + onramp שאינו device-link). המרכזייה הקולית ריקה.');
  }
  // מצב-כשר (voice.kosher) דורש לפחות SIM-כשר אחד ליציאה — אחרת אין דרך-יציאה כשרה.
  if (features['voice.kosher'] === true) {
    const kosherOut = numbers.some((n) => n.kosher && n.onramp === 'sim-in-gateway' && Number.isInteger(n.gatewayChannel) && n.channels.includes('voice'));
    if (!kosherOut) {
      warnings.push('voice.kosher פעיל אך אין אף SIM-כשר ליציאה (kosher + sim-in-gateway + ערוץ) — חיוג-יוצא של המערכת יושבת (לא ינותב דרך תשתית לא-כשרה).');
    }
  }
  // קו-מופנה חייב לנחות על SIM-בשער (הפניה אינה מסלול-כניסה עצמאי downstream).
  const hasSimVoice = numbers.some((n) => n.onramp === 'sim-in-gateway' && n.channels.includes('voice'));
  const hasForwardVoice = numbers.some((n) => n.onramp === 'customer-forward' && n.channels.includes('voice'));
  if (hasForwardVoice && !hasSimVoice) {
    warnings.push('קווים-מופנים (customer-forward) קיימים אך אין אף SIM-בשער נושא-קול לנחיתה — הפניה חייבת לנחות על SIM; עד אז המרכזייה לא תקבל שיחות מהקווים המופנים.');
  }
  // קו-מופנה עם הכרזה/לו״ז-פר-קו לא יעבוד downstream (ה-DID לא נשמר בשער-GSM).
  for (const n of numbers) {
    if (n.onramp === 'customer-forward' && (n.role === 'announcement' || n.hours)) {
      warnings.push(`numbers[${n.id}]: קו-מופנה עם ${n.role === 'announcement' ? 'הכרזה' : 'לו״ז-פר-קו'} — לא נתמך ב-GSM downstream (ה-DID אינו נשמר). השתמש ב-SIM נפרד.`);
    }
  }
  // forwardTo (אם הוגדר) חייב להצביע על SIM-בשער.
  for (const n of numbers) {
    if (n.forwardTo) {
      const target = numbers.find((x) => x.id === n.forwardTo);
      if (!target || target.onramp !== 'sim-in-gateway') {
        warnings.push(`numbers[${n.id}]: forwardTo "${n.forwardTo}" אינו מצביע על SIM-בשער — יטופל כקו-רגיל.`);
      }
    }
  }

  // ── יעדים ──
  const dst = raw.destinations;
  let destinations = null;
  if (!dst || typeof dst !== 'object') {
    errors.push('destinations חסר.');
  } else {
    const officeExt = dst.office && dst.office.ext;
    const managerExt = dst.manager && dst.manager.ext;
    const officeOk =
      typeof officeExt === 'string'
        ? !!officeExt
        : Array.isArray(officeExt) && officeExt.length > 0 && officeExt.every((e) => typeof e === 'string' && e);
    if (!officeOk) errors.push('destinations.office.ext חסר (אקסטנשן-משרד או רשימה).');
    if (typeof managerExt !== 'string' || !managerExt) errors.push('destinations.manager.ext חסר.');
    // שלוחות חייבות ספרות בלבד (2-6) — מונע הזרקת-XML/שבירה + התנגשות.
    const EXT_RE = /^[0-9]{2,6}$/;
    const allExtVals = [...(Array.isArray(officeExt) ? officeExt : [officeExt]), managerExt, dst.voicemail?.box].filter(Boolean);
    for (const e of allExtVals) {
      if (typeof e === 'string' && !EXT_RE.test(e)) errors.push(`שלוחה/תיבה לא-תקינה: "${e}" (ספרות בלבד, 2-6).`);
    }

    // כתובות-מייל (נחיל-5 F1): אימות-פורמט קפדני לפני שהן נצרבות ל-vm-mailto בגנרטור;
    // פסולה (או נושאת '$'/מרכאות) מושמטת עם אזהרה — לא מגיעה ל-XML.
    const cleanEmail = (val, label) => {
      if (typeof val !== 'string') return undefined;
      const v = val.trim();
      if (!EMAIL_RE.test(v)) { warnings.push(`${label} אינו כתובת-מייל תקינה ("${val}") — הושמט (הגנת-הזרקה).`); return undefined; }
      return v;
    };
    const officeEmail = cleanEmail(dst.office?.email, 'destinations.office.email');
    const vmEmail = cleanEmail(dst.voicemail?.email, 'destinations.voicemail.email');
    destinations = {
      office: {
        ext: Array.isArray(officeExt) ? officeExt : [officeExt].filter(Boolean),
        ringSeconds: Number.isInteger(dst.office?.ringSeconds) ? dst.office.ringSeconds : 25,
        ...(officeEmail ? { email: officeEmail } : {}),
      },
      manager: {
        ext: managerExt,
        ringSeconds: Number.isInteger(dst.manager?.ringSeconds) ? dst.manager.ringSeconds : 30,
      },
      voicemail: {
        box: (dst.voicemail && dst.voicemail.box) || '100',
        ...(vmEmail ? { email: vmEmail } : {}),
      },
    };
  }

  // ── יציאה ──
  let outbound = null;
  if (raw.outbound && typeof raw.outbound === 'object') {
    const defId = raw.outbound.defaultNumberId;
    if (defId != null) {
      const target = numbers.find((n) => n.id === defId);
      if (!target) {
        errors.push(`outbound.defaultNumberId "${defId}" לא מצביע על מספר קיים.`);
      } else if (target.onramp !== 'sim-in-gateway') {
        warnings.push(`outbound.defaultNumberId "${defId}" אינו sim-in-gateway — יציאת-ברירת-מחדל דרכו לא אפשרית downstream.`);
      }
      outbound = { defaultNumberId: defId };
    }
    // גיבוי-יציאה (opt): SIM-גיבוי אם הראשי לא-מגיב (שרשרת continue_on_fail).
    if (Array.isArray(raw.outbound.failover)) {
      const fb = [];
      for (const id of raw.outbound.failover) {
        const t = numbers.find((n) => n.id === id);
        if (!t) warnings.push(`outbound.failover: "${id}" לא מצביע על מספר קיים — דילוג.`);
        else if (t.onramp !== 'sim-in-gateway' || !Number.isInteger(t.gatewayChannel)) warnings.push(`outbound.failover: "${id}" אינו SIM-בשער עם ערוץ — דילוג.`);
        else if (id === (outbound && outbound.defaultNumberId)) warnings.push(`outbound.failover: "${id}" זהה לברירת-המחדל — דילוג.`);
        else if (!fb.includes(id)) fb.push(id);
      }
      if (fb.length) outbound = { ...(outbound || { defaultNumberId: null }), failover: fb };
    }
  }
  // ברירת-מחדל ליציאה: ה-SIM הראשון עם ערוץ-שער.
  if (!outbound) {
    const firstSim = numbers.find((n) => n.onramp === 'sim-in-gateway' && Number.isInteger(n.gatewayChannel));
    outbound = firstSim ? { defaultNumberId: firstSim.id } : { defaultNumberId: null };
  }

  // ── CTI (מאור) ──
  let cti = { org: null, mode: 'off' };
  if (raw.cti && typeof raw.cti === 'object') {
    const mode = ['off', 'directory', 'api'].includes(raw.cti.mode) ? raw.cti.mode : 'off';
    cti = { org: raw.cti.org || null, mode };
    if (mode !== 'off' && !cti.org) {
      warnings.push('cti.mode פעיל אך cti.org חסר — screen-pop לא יוכל להצליב מול מאור.');
    }
  }

  // ── ניתוב מתקדם (opt-in, מנורמל בטהור) ──
  const { routing, warnings: routeWarn } = normalizeRouting(raw.routing || {});
  warnings.push(...routeWarn);

  // ── מצב-חירום (opt-in): "סגור היום" עם הודעה ──
  let emergency = null;
  if (raw.emergency && typeof raw.emergency === 'object') {
    emergency = {
      active: raw.emergency.active === true,
      message: typeof raw.emergency.message === 'string' ? raw.emergency.message : '',
    };
  }

  // ── מצב-שבעה/אבלות (opt-in): חלון-תאריכים שמנתב את הקו למחליף, פג-תוקף לבד ──
  const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;
  let mourning = null;
  if (raw.mourning && typeof raw.mourning === 'object') {
    const from = raw.mourning.fromIso;
    const until = raw.mourning.untilIso;
    const mExt = raw.mourning.ext;
    if (!ISO_RE.test(from || '') || !ISO_RE.test(until || '')) {
      warnings.push('mourning: fromIso/untilIso חייבים תאריך ISO (YYYY-MM-DD) — מדולג.');
    } else if (from > until) {
      warnings.push('mourning: fromIso אחרי untilIso — מדולג.');
    } else if (typeof mExt !== 'string' || !/^[0-9]{2,6}$/.test(mExt)) {
      warnings.push('mourning: ext (מחליף) חייב ספרות 2-6 — מדולג.');
    } else {
      mourning = {
        fromIso: from,
        untilIso: until,
        ext: mExt,
        reason: typeof raw.mourning.reason === 'string' && raw.mourning.reason ? noVars(raw.mourning.reason) : 'בית האבל',
      };
    }
  }

  const ok = errors.length === 0;
  const tenant = ok
    ? {
        schemaVersion: SCHEMA_VERSION,
        tenantId: raw.tenantId,
        orgName: noVars(raw.orgName),
        timezone,
        ...(city ? { city } : {}),
        ...(geo ? { geo } : {}),
        ...(raw.vertical && VERTICAL_PACKS[raw.vertical] ? { vertical: raw.vertical } : {}),
        officeHours,
        numbers,
        destinations,
        outbound,
        cti,
        features,
        terms,
        routing,
        ...(emergency ? { emergency } : {}),
        ...(mourning ? { mourning } : {}),
      }
    : null;
  return { ok, errors, warnings, tenant };
}
