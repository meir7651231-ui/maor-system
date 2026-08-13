// ─────────────────────────────────────────────────────────────────────────────
// telephony · validate — שער-התקינות של קונפיג-הלקוח.
// טהור. מחזיר {ok, errors[], warnings[], tenant} כאשר tenant = הקונפיג המנורמל
// (e164 ממולא, ברירות-מחדל מוזרקות). errors חוסמים generate; warnings לא.
// עיקרון-ברזל נאכף כאן: אין שדה-ספק. כל onramp הוא downstream. type=whatsapp/
// virtual מקבלים סייג אם ה-onramp לא תואם את המודל pure-downstream.
// ─────────────────────────────────────────────────────────────────────────────

import { toE164 } from './normalize.mjs';
import { applyVertical, migrateConfig, sanitizeConfigFields, VERTICAL_PACKS, SCHEMA_VERSION } from './config.mjs';

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

  // ── שדות-שורש ──
  if (!SLUG_RE.test(raw.tenantId || '')) {
    errors.push(`tenantId לא-תקין: "${raw.tenantId}" (slug אותיות-קטנות/ספרות/מקף, 3-40 תווים).`);
  }
  if (!raw.orgName || typeof raw.orgName !== 'string') {
    errors.push('orgName חסר.');
  }
  const timezone = typeof raw.timezone === 'string' && raw.timezone ? raw.timezone : 'Asia/Jerusalem';

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

      numbers.push({
        id: n.id,
        e164: e164 || n.e164,
        label: n.label,
        type: n.type,
        onramp: n.onramp,
        channels,
        kosher: !!n.kosher,
        ...(Number.isInteger(n.gatewayChannel) ? { gatewayChannel: n.gatewayChannel } : {}),
      });
    }
  }
  if (voiceBearing === 0) {
    errors.push('אין אף מספר נושא-קול (voice + onramp שאינו device-link). המרכזייה הקולית ריקה.');
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

    destinations = {
      office: {
        ext: Array.isArray(officeExt) ? officeExt : [officeExt].filter(Boolean),
        ringSeconds: Number.isInteger(dst.office?.ringSeconds) ? dst.office.ringSeconds : 25,
      },
      manager: {
        ext: managerExt,
        ringSeconds: Number.isInteger(dst.manager?.ringSeconds) ? dst.manager.ringSeconds : 30,
      },
      voicemail: {
        box: (dst.voicemail && dst.voicemail.box) || '100',
        ...(dst.voicemail && dst.voicemail.email ? { email: dst.voicemail.email } : {}),
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

  const ok = errors.length === 0;
  const tenant = ok
    ? {
        schemaVersion: SCHEMA_VERSION,
        tenantId: raw.tenantId,
        orgName: raw.orgName,
        timezone,
        ...(raw.vertical && VERTICAL_PACKS[raw.vertical] ? { vertical: raw.vertical } : {}),
        officeHours,
        numbers,
        destinations,
        outbound,
        cti,
        features,
        terms,
      }
    : null;
  return { ok, errors, warnings, tenant };
}
