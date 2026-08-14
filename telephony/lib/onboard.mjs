// ─────────────────────────────────────────────────────────────────────────────
// telephony · onboard — תצורה-עצמית: תשובות-מפעיל מינימליות → קונפיג-לקוח מלא.
//
// זו הבטחת-המוצר: "ברגע שממלאים נתונים, המערכת מתחברת לבד". המפעיל עונה על
// טופס קצר (שם, מספרים, שעות, מנהל) — והמנוע גוזר לבד את כל השאר: onramp לפי
// טיב-המספר, ערוצי-שער רצים, אקסטנשנים, יעד-יציאה. אחר-כך buildTenant מאמת
// ומחולל. onboarding = נתונים, לא הרכבה.
//
// pure-downstream נגזר אוטומטית: sim→sim-in-gateway · virtual→customer-forward ·
// whatsapp→device-link. אין שאלת-ספק בטופס, כי אין ספק במודל.
// ─────────────────────────────────────────────────────────────────────────────

import { validateTenant } from './validate.mjs';
import { generateConfig } from './generate.mjs';
import { trustReport } from './report.mjs';

// טיב-מספר → (onramp, channels) לפי מודל pure-downstream. מקור-אמת יחיד לגזירה.
const TYPE_DEFAULTS = {
  sim: { onramp: 'sim-in-gateway', channels: ['voice'] },
  virtual: { onramp: 'customer-forward', channels: ['voice'] },
  whatsapp: { onramp: 'device-link', channels: ['whatsapp'] },
};

const DEFAULT_HOURS = { days: [0, 1, 2, 3, 4], start: '09:00', end: '17:00' };

/**
 * הגדרת-האשף לצד-הלקוח (UI). כל שלב = שדות-מינימום. מה שלא נשאל — נגזר.
 * מיוצא כדי שהטופס והמנוע יישארו מסונכרנים ממקור-אחד.
 */
export const INTAKE_STEPS = [
  {
    id: 'org',
    title: 'הארגון',
    fields: [
      { key: 'orgName', label: 'שם הארגון', type: 'text', required: true },
      { key: 'tenantId', label: 'מזהה (אנגלית, לכתובת)', type: 'slug', required: true },
    ],
  },
  {
    id: 'hours',
    title: 'שעות המשרד',
    hint: 'בתוך השעות — הכל מצלצל במשרד; אחרי — חוזר למנהל.',
    fields: [
      { key: 'officeHours.days', label: 'ימי פעילות', type: 'days', default: DEFAULT_HOURS.days },
      { key: 'officeHours.start', label: 'משעה', type: 'time', default: DEFAULT_HOURS.start },
      { key: 'officeHours.end', label: 'עד שעה', type: 'time', default: DEFAULT_HOURS.end },
    ],
  },
  {
    id: 'numbers',
    title: 'המספרים שלך',
    hint: 'כל המספרים שמפורסמים היום. אנחנו אחרי הספקים — לא נוגעים בהם.',
    repeat: true,
    fields: [
      { key: 'number', label: 'מספר', type: 'phone', required: true },
      { key: 'label', label: 'כינוי (קו ראשי / תרומות...)', type: 'text', required: true },
      { key: 'type', label: 'סוג', type: 'select', options: ['sim', 'virtual', 'whatsapp'], default: 'sim' },
      { key: 'kosher', label: 'כשר?', type: 'bool', default: false },
    ],
  },
  {
    id: 'destinations',
    title: 'לאן מצלצל',
    fields: [
      { key: 'office', label: 'שלוחת המשרד', type: 'ext', default: '101' },
      { key: 'manager', label: 'שלוחת המנהל (הנייד)', type: 'ext', default: '201' },
      { key: 'managerEmail', label: 'מייל לתא-קולי', type: 'email', required: false },
    ],
  },
  {
    id: 'cti',
    title: 'חיבור למאור',
    hint: 'זיהוי מתקשר מול משפחות/תורמים. קריאה בלבד.',
    fields: [
      { key: 'ctiOrg', label: 'מזהה הארגון במאור (?org=)', type: 'text', required: false },
      { key: 'ctiMode', label: 'מצב', type: 'select', options: ['off', 'directory', 'api'], default: 'off' },
    ],
  },
];

function pick(obj, path, dflt) {
  const v = path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
  return v === undefined || v === null ? dflt : v;
}

/**
 * גוזר קונפיג-לקוח מלא מתשובות-אשף מינימליות.
 * @param {object} a  תשובות (orgName, tenantId, officeHours?, numbers[], office?, manager?, managerEmail?, ctiOrg?, ctiMode?)
 * @returns {object}  קונפיג-לקוח מוכן ל-buildTenant
 */
export function tenantFromIntake(a) {
  const inNums = Array.isArray(a.numbers) ? a.numbers : [];
  let gwChannel = 0;
  const numbers = inNums.map((n, i) => {
    const type = TYPE_DEFAULTS[n.type] ? n.type : 'sim';
    const def = TYPE_DEFAULTS[type];
    const out = {
      id: n.id || `n${i + 1}`,
      e164: n.number ?? n.e164 ?? '',
      label: n.label || `קו ${i + 1}`,
      type,
      onramp: def.onramp,
      channels: Array.isArray(n.channels) && n.channels.length ? n.channels : [...def.channels],
      kosher: !!n.kosher,
    };
    // ערוץ-שער רץ מוקצה אוטומטית לכל SIM — ככה יציאה עובדת בלי שהמפעיל יחשוב על זה.
    if (out.onramp === 'sim-in-gateway') {
      gwChannel += 1;
      out.gatewayChannel = gwChannel;
    }
    return out;
  });

  const officeExt = pick(a, 'office', '101');
  const managerExt = pick(a, 'manager', '201');
  const firstSim = numbers.find((n) => n.onramp === 'sim-in-gateway');

  return {
    tenantId: a.tenantId || '',
    orgName: a.orgName || '',
    timezone: a.timezone || 'Asia/Jerusalem',
    officeHours: {
      days: pick(a, 'officeHours.days', DEFAULT_HOURS.days),
      start: pick(a, 'officeHours.start', DEFAULT_HOURS.start),
      end: pick(a, 'officeHours.end', DEFAULT_HOURS.end),
    },
    numbers,
    destinations: {
      office: { ext: Array.isArray(officeExt) ? officeExt : [officeExt], ringSeconds: 25 },
      manager: { ext: managerExt, ringSeconds: 30 },
      voicemail: { box: '100', ...(a.managerEmail ? { email: a.managerEmail } : {}) },
    },
    outbound: { defaultNumberId: firstSim ? firstSim.id : null },
    cti: { org: a.ctiOrg || null, mode: ['off', 'directory', 'api'].includes(a.ctiMode) ? a.ctiMode : 'off' },
  };
}

// ── 51. ייבוא-מספרים מ-CSV ────────────────────────────────────────────────────
/**
 * מפרסר CSV למערך-מספרים לאשף. כותרת נדרשת: number,label,type[,kosher][,gatewayChannel].
 * מפריד-פסיק, תומך במרכאות-כפולות. שורות-פגומות מדולגות.
 * @returns {{numbers:Array, errors:string[]}}
 */
export function numbersFromCsv(csv) {
  const errors = [];
  const lines = String(csv || '').split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return { numbers: [], errors: ['CSV ריק.'] };
  const parseRow = (line) => {
    const out = [];
    let cur = '', q = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (q) {
        if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (c === '"') q = false;
        else cur += c;
      } else if (c === '"') q = true;
      else if (c === ',') { out.push(cur); cur = ''; }
      else cur += c;
    }
    out.push(cur);
    return out.map((s) => s.trim());
  };
  const header = parseRow(lines[0]).map((h) => h.toLowerCase());
  const idx = (k) => header.indexOf(k);
  if (idx('number') < 0 || idx('label') < 0) return { numbers: [], errors: ['כותרת חייבת לכלול number,label.'] };
  const numbers = [];
  for (let r = 1; r < lines.length; r++) {
    const cols = parseRow(lines[r]);
    const number = cols[idx('number')];
    const label = cols[idx('label')];
    if (!number || !label) { errors.push(`שורה ${r + 1}: חסר number/label — דילוג.`); continue; }
    const typeCol = idx('type') >= 0 ? cols[idx('type')] : '';
    const detected = detectNumberType(number);
    const n = { number, label, type: ['sim', 'virtual', 'whatsapp'].includes(typeCol) ? typeCol : detected.type };
    if (idx('kosher') >= 0) n.kosher = /^(1|true|כן|yes)$/i.test(cols[idx('kosher')] || '');
    if (idx('gatewaychannel') >= 0 && cols[idx('gatewaychannel')]) n.gatewayChannel = Number(cols[idx('gatewaychannel')]);
    numbers.push(n);
  }
  return { numbers, errors };
}

// ── 54. גילוי-אוטומטי של סוג-מספר (heuristic קידומת ישראלי) ───────────────────
/** מנחש type+onramp ממספר גולמי. מחזיר {type,onramp,confidence,reason}. */
export function detectNumberType(raw) {
  const d = String(raw || '').replace(/[^\d]/g, '').replace(/^972/, '0');
  if (/^05[0-9]/.test(d)) return { type: 'sim', onramp: 'sim-in-gateway', confidence: 'high', reason: 'סלולרי (05x)' };
  if (/^07[2-9]/.test(d)) return { type: 'virtual', onramp: 'customer-forward', confidence: 'high', reason: 'וירטואלי/VoIP (07x)' };
  if (/^0(2|3|4|8|9)/.test(d)) return { type: 'sim', onramp: 'sim-in-gateway', confidence: 'medium', reason: 'קו-נייח (אזורי)' };
  if (/^1(700|800|599)/.test(d)) return { type: 'virtual', onramp: 'customer-forward', confidence: 'high', reason: 'קו-שירות (1-700/800/599)' };
  return { type: 'sim', onramp: 'sim-in-gateway', confidence: 'low', reason: 'לא-מזוהה — ברירת-מחדל SIM' };
}

// ── 53. אשף-הסתעפות: שלבים רלוונטיים לפי הבחירות ──────────────────────────────
/** מחזיר את שלבי-האשף הרלוונטיים. ווצאפ-בלבד ⇒ מדלג יעדי-קול; ללא-CTI ⇒ מדלג CTI. */
export function stepsFor(answers = {}) {
  const nums = Array.isArray(answers.numbers) ? answers.numbers : [];
  const onlyWhatsapp = nums.length > 0 && nums.every((n) => n.type === 'whatsapp');
  return INTAKE_STEPS.filter((s) => {
    if (s.id === 'destinations' && onlyWhatsapp) return false; // אין-קול ⇒ אין יעדי-צלצול
    if (s.id === 'hours' && onlyWhatsapp) return false;
    return true;
  });
}

// ── 52. QR-provisioning ל-softphone ──────────────────────────────────────────
/** מבנה-הקצאה ל-Zoiper/Linphone (התוכן שנצרב ל-QR). סיסמה מוזרקת בהתקנה. */
export function provisioningQr(tenant, ext, opt = {}) {
  const domain = tenant.tenantId;
  const server = opt.server || `pbx.${domain}`;
  return {
    ext: String(ext),
    username: String(ext),
    domain,
    server,
    transport: opt.transport || 'tls',
    sipUri: `sip:${ext}@${domain}`,
    // תוכן-QR (Linphone config-uri style). הסיסמה נמסרת בנפרד/בהתקנה.
    qrPayload: `sip:${ext}@${server};transport=${opt.transport || 'tls'}`,
  };
}

// ── 56. seed-ורטיקל בקליק ─────────────────────────────────────────────────────
/** קונפיג-פתיחה מלא לורטיקל (placeholders למספרים). מוכן לעריכה באשף. */
export function seedVertical(vertical, orgName = '', tenantId = '') {
  return {
    tenantId,
    orgName,
    vertical: vertical || undefined,
    numbers: [
      { id: 'n1', number: '', label: 'קו ראשי', type: 'sim' },
    ],
    office: '101',
    manager: '201',
    ctiMode: 'off',
  };
}

// ── 57. תצוגה-מקדימה של הניתוב ────────────────────────────────────────────────
/** תיאור קריא-לאדם של איך שיחות ינותבו — לפני החלה. tenant = מנורמל. */
export function routingPreview(tenant) {
  const lines = [];
  const oh = tenant.officeHours;
  const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  lines.push(`שעות-משרד: ${oh.days.map((d) => DAYS[d]).join(', ')} · ${oh.start}–${oh.end}`);
  const vnums = tenant.numbers.filter((n) => (n.channels || []).includes('voice') && n.onramp !== 'device-link');
  lines.push(`${vnums.length} מספרים נכנסים → בשעות: משרד (${tenant.destinations.office.ext.join(',')}) · אחרי: מנהל (${tenant.destinations.manager.ext})`);
  const R = tenant.routing || {};
  if (R.ivr) lines.push(`IVR: ${R.ivr.options.map((o) => `${o.digit}=${o.label || o.dest.type}`).join(' · ')}`);
  if (R.overflow && R.overflow.length) lines.push(`גלישה: מנהל → ${R.overflow.join(' → ')} → תא-קולי`);
  if (R.blocklist && R.blocklist.length) lines.push(`חסומים: ${R.blocklist.length} מספרים`);
  const sims = tenant.numbers.filter((n) => n.onramp === 'sim-in-gateway' && Number.isInteger(n.gatewayChannel));
  if (sims.length) lines.push(`יציאה: ${sims.map((n) => `${n.gatewayChannel}#→${n.label}`).join(' · ')}`);
  return lines;
}

// ── 58. בדיקת-מוכנות (preflight) ──────────────────────────────────────────────
/** בודק שכל הדרוש לחיוג-חי קיים. מחזיר {ready, blockers[], warnings[]}. */
export function preflight(tenant) {
  const blockers = [];
  const warnings = [];
  const vnums = tenant.numbers.filter((n) => (n.channels || []).includes('voice') && n.onramp !== 'device-link');
  if (!vnums.length) blockers.push('אין אף מספר נושא-קול.');
  const sims = tenant.numbers.filter((n) => n.onramp === 'sim-in-gateway');
  const noChannel = sims.filter((n) => !Number.isInteger(n.gatewayChannel));
  if (noChannel.length) warnings.push(`${noChannel.length} SIM ללא ערוץ-שער — יציאה דרכם לא-תעבוד.`);
  // קו-מופנה בלי SIM-נחיתה נושא-קול = לא יכול לקבל שיחה (חוסם מוכנות אמיתית).
  const simVoice = sims.some((n) => (n.channels || []).includes('voice'));
  const fwdVoice = tenant.numbers.some((n) => n.onramp === 'customer-forward' && (n.channels || []).includes('voice'));
  if (fwdVoice && !simVoice) blockers.push('קווים-מופנים בלי SIM-בשער נושא-קול לנחיתה — לא יתקבלו שיחות.');
  if (!tenant.destinations.office.ext.length) blockers.push('אין שלוחת-משרד.');
  if (!tenant.destinations.manager.ext) blockers.push('אין שלוחת-מנהל.');
  if (!tenant.outbound.defaultNumberId) warnings.push('אין מספר יציאת-ברירת-מחדל.');
  if (tenant.cti && tenant.cti.mode !== 'off' && !tenant.cti.org) warnings.push('CTI פעיל בלי ארגון-מאור.');
  return { ready: blockers.length === 0, blockers, warnings };
}

// ── 59. ייצוא/ייבוא קונפיג (גיבוי) ────────────────────────────────────────────
/** ייצוא-גיבוי: הקונפיג הגולמי (בלי שדות-נגזרים). tenant מנורמל → JSON נקי. */
export function exportConfig(tenant) {
  const { schemaVersion, tenantId, orgName, timezone, vertical, officeHours, numbers, destinations, outbound, cti, features, terms, routing, emergency } = tenant;
  return JSON.parse(JSON.stringify({
    schemaVersion, tenantId, orgName, timezone, vertical, officeHours,
    numbers, destinations, outbound, cti,
    ...(features && Object.keys(features).length ? { features } : {}),
    ...(terms && Object.keys(terms).length ? { terms } : {}),
    ...(routing && Object.keys(routing).length ? { routing } : {}),
    ...(emergency ? { emergency } : {}),
  }));
}

// ── 60. שכפול-לקוח (תבנית → חדש) ──────────────────────────────────────────────
/** משכפל קונפיג עם tenantId/orgName חדשים ומאפס מספרים לריקים (תבנית). */
export function cloneTenant(config, newId, newName) {
  const c = JSON.parse(JSON.stringify(config));
  c.tenantId = newId;
  c.orgName = newName;
  if (c.cti) c.cti = { ...c.cti, org: null };
  // מאפס ערכי-מספר (משאיר מבנה/תוויות) — כל לקוח מזין את מספריו.
  if (Array.isArray(c.numbers)) c.numbers = c.numbers.map((n) => ({ ...n, e164: '', number: '' }));
  return c;
}

// ── 60. הקמה-ב-90-שניות: אורקסטרציה אחת מ-קונפיג לחבילה-מוכנה-לפריסה ──────────
/**
 * item 15 · "מלא-נתונים → מוכן-לפריסה" בקריאה-אחת: validate → generate → שערי-
 * אמון (trustReport + preflight + provisioningQr פר-שלוחה) → go/no-go. אף מרכזייה
 * לא מקצרת "מ-0 ללקוח-פעיל" לקריאה-אחת מגודרת-אורקלים. טהור.
 * @param {object} config קונפיג-לקוח גולמי (מ-tenantFromIntake/seedVertical)
 * @param {{anchorDate?:string, calendarWindow?:number, env?:object, peers?:Array, server?:string}} [opt]
 * @returns {{ready:boolean, stage:string, tenant?, files?, manifest?, trust?, preflight?, provisioning?, blockers:string[], warnings:string[], nextSteps:string[]}}
 */
export function provision(config, opt = {}) {
  const v = validateTenant(config);
  if (!v.ok) return { ready: false, stage: 'validate', blockers: v.errors, warnings: v.warnings, nextSteps: ['תקן את שגיאות-הקונפיג ונסה שוב.'] };
  const gen = generateConfig(v.tenant, v.warnings, opt);
  const bundle = { tenant: v.tenant, files: gen.files, manifest: gen.manifest };
  const trust = trustReport(bundle, { env: opt.env, peers: opt.peers });
  const pf = preflight(v.tenant);
  // QR-הקמה לכל שלוחת-משרד + מנהל (הצוות סורק ומחבר softphone).
  const exts = [...new Set([...(v.tenant.destinations.office.ext || []), v.tenant.destinations.manager.ext])].filter(Boolean);
  const provisioning = exts.map((e) => provisioningQr(v.tenant, e, { server: opt.server }));
  const blockers = [
    ...pf.blockers,
    ...trust.failing.filter((c) => c.severity === 'critical').map((c) => c.detail),
  ];
  const ready = pf.ready && trust.ready;
  const nextSteps = ready
    ? [
        `הזרק את סודות-הסביבה (${opt.env ? 'הוזרקו' : `${trust.checks.find((c) => c.key === 'secrets') ? 'ראה דוח' : 'GSM_PW/PROVISION_PW/VM_PW פר-לקוח'}`}).`,
        `סרוק QR לכל ${provisioning.length} השלוחות (חיבור softphone).`,
        'חבר את שער-ה-GSM עם ה-SIM של הלקוח.',
        'הרץ apply --write (יעבור שערי-סגירה/בידוד/סודות).',
      ]
    : ['פתור את החוסמים למטה לפני פריסה.'];
  return { ready, stage: 'ready', tenant: v.tenant, files: gen.files, manifest: gen.manifest, trust, preflight: pf, provisioning, blockers, warnings: gen.warnings, nextSteps };
}
