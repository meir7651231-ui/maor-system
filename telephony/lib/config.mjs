// ─────────────────────────────────────────────────────────────────────────────
// telephony · config — יסוד-התצורה: דגלים · מונחים · ורטיקלים · שכבות · diff.
// מיישם את דפוסי-הבשלות של maor (featureOn/termOf/normalizeConfig/effectiveConfig)
// על מנוע-הטלפוניה. טהור, דטרמיניסטי, אפס-תלויות.
//
// חוזה-הדגלים (כמו maor, עם רישום-ברירות-מחדל מפורש):
//   · ליבה (voice/voicemail/outbound/cti) — חסר=דלוק; רק false מכבה.
//   · תוספות (ivr/queue/recording/calendar/…) — חסר=כבוי; רק true מדליק.
//   · שרשור-אבות: אב false ⇒ כל צאצאיו כבויים.
// אינווריאנט: קונפיג בלי `features`/`terms` ⇒ כל הליבה דלוקה, תוספות כבויות ⇒
// הפלט ביט-זהה למנוע-הבסיס (נבדק ב-golden).
// ─────────────────────────────────────────────────────────────────────────────

export const SCHEMA_VERSION = 2;

// רישום-דגלים: key → 'on' (ליבה, חסר=דלוק) | 'off' (תוספת, חסר=כבוי).
export const FLAG_DEFAULTS = {
  // ── ליבה ──
  voice: 'on',
  'voice.timecondition': 'on',
  'voice.afterhours': 'on',
  voicemail: 'on',
  'voicemail.email': 'on',
  outbound: 'on',
  'outbound.default': 'on',
  'outbound.pick': 'on',
  cti: 'on',
  // ── תוספות (opt-in) ──
  'voice.ivr': 'off',
  'voice.queue': 'off',
  'voice.blocklist': 'off',
  'voice.dnd': 'off',
  'voice.park': 'off',
  'voice.transfer': 'off',
  'voice.greeting': 'off',
  'voice.callback': 'off',
  'voicemail.transcription': 'off',
  'cti.namegreeting': 'off',
  emergency: 'off',
  recording: 'off',
  'calendar.hebrew': 'off',
  'calendar.shabbat': 'off',
  'calendar.fasts': 'off',
  'calendar.erev': 'off',
  'calendar.cholhamoed': 'off',
  'channels.whatsapp': 'off',
  'channels.sms': 'off',
  reports: 'off',
  billing: 'off',
};

// מילון-מונחים (white-label). מפתח → ברירת-מחדל. כל הנחיה/כינוי עובר termOf.
export const TERM_DEFS = {
  office: 'משרד',
  manager: 'מנהל',
  org: 'הארגון',
  greetingDay: 'שלום, הגעתם ל%org%. נציג יענה מיד.',
  greetingNight: 'שלום, הגעתם ל%org%. המשרד סגור כעת, נשמח לחזור אליכם.',
  voicemailPrompt: 'לא זמינים כרגע. השאירו הודעה אחרי הצליל.',
  holdMusic: 'ברירת-מחדל',
  callerLine: 'קו',
};

// חבילות-ורטיקל — ברירות-מחדל פר-סוג-עמותה (features/terms/officeHours).
// הקונפיג המפורש של הלקוח תמיד גובר; אלה רק בסיס.
export const VERTICAL_PACKS = {
  chesed: {
    terms: { org: 'עמותת החסד' },
    features: { 'calendar.hebrew': true, 'calendar.shabbat': true },
    officeHours: { days: [0, 1, 2, 3, 4], start: '09:00', end: '17:00' },
  },
  kollel: {
    terms: { org: 'הכולל', office: 'המזכירות' },
    features: { 'calendar.hebrew': true, 'calendar.shabbat': true, 'calendar.fasts': true },
    officeHours: { days: [0, 1, 2, 3, 4], start: '10:00', end: '15:00' },
  },
  gemach: {
    terms: { org: 'הגמ״ח' },
    features: { 'calendar.hebrew': true, 'calendar.shabbat': true },
    officeHours: { days: [0, 1, 2, 3, 4], start: '20:00', end: '22:00' },
  },
  talmudtorah: {
    terms: { org: 'התלמוד-תורה', office: 'המזכירות' },
    features: { 'calendar.hebrew': true, 'calendar.shabbat': true },
    officeHours: { days: [0, 1, 2, 3, 4], start: '08:00', end: '16:00' },
  },
  shul: {
    terms: { org: 'בית-הכנסת', office: 'הגבאי' },
    features: { 'calendar.hebrew': true, 'calendar.shabbat': true, 'calendar.fasts': true },
    officeHours: { days: [0, 1, 2, 3, 4, 5], start: '07:00', end: '21:00' },
  },
};

// ── 1. featureOn / flagOn ────────────────────────────────────────────────────
/**
 * האם דגל דלוק. שרשור-אבות (אב false ⇒ כבוי) · self true ⇒ דלוק ·
 * אחרת ברירת-המחדל מהרישום (לא-מוכר ⇒ 'on', תואם חוזה-maor).
 */
export function flagOn(tenant, key) {
  const feats = (tenant && tenant.features) || {};
  const parts = key.split('.');
  for (let i = 1; i <= parts.length; i++) {
    if (feats[parts.slice(0, i).join('.')] === false) return false;
  }
  if (feats[key] === true) return true;
  return (FLAG_DEFAULTS[key] ?? 'on') === 'on';
}
export const featureOn = flagOn; // שם-נרדף לקריאוּת בליבה

// ── 2. termOf ────────────────────────────────────────────────────────────────
/** מונח מותאם — tenant.terms[key] אחרי trim אם לא-ריק, אחרת fallback/ברירת-המחדל. */
export function termOf(tenant, key, fallback) {
  const v = tenant && tenant.terms && tenant.terms[key];
  if (typeof v === 'string' && v.trim()) return v.trim();
  return fallback !== undefined ? fallback : TERM_DEFS[key] ?? key;
}

/** הרחבת %org%/%office% בתוך מחרוזת-מונח (לברכות). */
export function expandTerms(tenant, text) {
  return String(text)
    .replaceAll('%org%', termOf(tenant, 'org', tenant?.orgName || 'הארגון'))
    .replaceAll('%office%', termOf(tenant, 'office'));
}

// ── 3+4. applyVertical (ורטיקל + מיתוג) ──────────────────────────────────────
/** ממזג ברירות-ורטיקל *מתחת* לקונפיג המפורש (הקונפיג גובר). */
export function applyVertical(config) {
  const pack = config && config.vertical && VERTICAL_PACKS[config.vertical];
  if (!pack) return config;
  return {
    ...config,
    features: { ...(pack.features || {}), ...(config.features || {}) },
    terms: { ...(pack.terms || {}), ...(config.terms || {}) },
    officeHours: config.officeHours || pack.officeHours,
  };
}

// ── 5. normalizeConfig (allowlist מחוטא) ─────────────────────────────────────
const TERM_KEYS = new Set(Object.keys(TERM_DEFS));
/** מסנן features (boolean, מפתח נקי) ו-terms (string, מפתח ברשימה). מחזיר {features,terms}. */
export function sanitizeConfigFields(raw) {
  const features = {};
  const terms = {};
  if (raw && typeof raw.features === 'object' && raw.features) {
    for (const [k, v] of Object.entries(raw.features)) {
      if (typeof v === 'boolean' && /^[a-z][a-z0-9.]{0,40}$/.test(k)) features[k] = v;
    }
  }
  if (raw && typeof raw.terms === 'object' && raw.terms) {
    for (const [k, v] of Object.entries(raw.terms)) {
      if (typeof v === 'string' && TERM_KEYS.has(k)) terms[k] = v;
    }
  }
  return { features, terms };
}

// ── 6. capabilities (מטריצת-יכולות) ──────────────────────────────────────────
/** מטריצת-יכולות אפקטיבית פר-לקוח — נגזרת מהדגלים. מקור-אמת יחיד לתצוגה/בדיקה. */
export function capabilities(tenant) {
  return {
    voice: flagOn(tenant, 'voice'),
    voicemail: flagOn(tenant, 'voicemail'),
    voicemailEmail: flagOn(tenant, 'voicemail.email'),
    outbound: flagOn(tenant, 'outbound'),
    cti: flagOn(tenant, 'cti') && tenant?.cti?.mode !== 'off',
    ivr: flagOn(tenant, 'voice.ivr'),
    queue: flagOn(tenant, 'voice.queue'),
    recording: flagOn(tenant, 'recording'),
    hebrewCalendar: flagOn(tenant, 'calendar.hebrew'),
    shabbat: flagOn(tenant, 'calendar.shabbat'),
    whatsapp: flagOn(tenant, 'channels.whatsapp'),
    sms: flagOn(tenant, 'channels.sms'),
    reports: flagOn(tenant, 'reports'),
    billing: flagOn(tenant, 'billing'),
  };
}

// ── 7. migrateConfig (גרסאות-סכמה) ───────────────────────────────────────────
/** מיגרציה מצטברת — מרפאת schemaVersion + שדות-חדשים. אידמפוטנטי. */
export function migrateConfig(raw) {
  const c = { ...(raw || {}) };
  const v = Number(c.schemaVersion) || 1;
  if (v < 2) {
    c.features = c.features || {};
    c.terms = c.terms || {};
  }
  c.schemaVersion = SCHEMA_VERSION;
  return c;
}

// ── 8. effectiveConfig (שכבות מפעיל→לקוח→עובד) ───────────────────────────────
/**
 * קונפיג-אפקטיבי משכבות. base=מפעיל, tenant=לקוח (דורס), member=עובד (רק מגביל —
 * יכול לכבות, לא להדליק — כמו effectiveConfigFor במאור). מחזיר {features,terms}.
 */
export function effectiveConfig(base = {}, tenant = {}, member = null) {
  const features = { ...(base.features || {}), ...(tenant.features || {}) };
  const terms = { ...(base.terms || {}), ...(tenant.terms || {}) };
  if (member && member.features) {
    for (const [k, v] of Object.entries(member.features)) {
      if (v === false) features[k] = false; // עובד רק מגביל
    }
  }
  return { features, terms };
}

// ── 9. אינווריאנט ביט-זהה: אין features/terms ⇒ ליבה-דלוקה/תוספות-כבויות ──────
/** האם התצורה "נקייה" (בלי דריסות) ⇒ הפלט חייב להיות ביט-זהה לבסיס. לבדיקה. */
export function isBaselineConfig(tenant) {
  const f = tenant && tenant.features;
  const t = tenant && tenant.terms;
  const noFeats = !f || Object.keys(f).length === 0;
  const noTerms = !t || Object.keys(t).length === 0;
  return noFeats && noTerms && !tenant?.vertical;
}

// ── 10. diffConfig (מה-השתנה-ולמה) ───────────────────────────────────────────
/** diff קריא בין שתי תצורות — features/terms שהשתנו, עם from/to. */
export function diffConfig(a = {}, b = {}) {
  const out = { features: {}, terms: {} };
  const fa = a.features || {};
  const fb = b.features || {};
  for (const k of new Set([...Object.keys(fa), ...Object.keys(fb)])) {
    if (fa[k] !== fb[k]) out.features[k] = { from: fa[k] ?? '(ברירת-מחדל)', to: fb[k] ?? '(ברירת-מחדל)' };
  }
  const ta = a.terms || {};
  const tb = b.terms || {};
  for (const k of new Set([...Object.keys(ta), ...Object.keys(tb)])) {
    if (ta[k] !== tb[k]) out.terms[k] = { from: ta[k] ?? '(ברירת-מחדל)', to: tb[k] ?? '(ברירת-מחדל)' };
  }
  out.changed = Object.keys(out.features).length + Object.keys(out.terms).length > 0;
  return out;
}
