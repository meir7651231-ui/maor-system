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
