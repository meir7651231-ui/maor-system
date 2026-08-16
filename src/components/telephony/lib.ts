// ─────────────────────────────────────────────────────────────────────────────
// telephony · lib — הגשר בין אשף-ההקמה של מאור למנוע-הטלפוניה הטהור (telephony/lib).
//
// המנוע (‏telephony/lib/*.mjs) הוא config-as-data: tenant מנורמל → קונפיג-FreeSWITCH.
// כאן ממירים את השדות הידידותיים-למשתמש של האשף ל-tenant שהמנוע מבין, ומריצים
// **תצוגה-מקדימה חיה** (סימולטור-שיחה + דוח-אמון) בדפדפן. טהור — בלי store/DOM.
//
// אינווריאנט המנוע (המוֹאט): pure-downstream — אין ספק/API/trunk. השדות כאן מתארים
// אך-ורק ציוד-הלקוח (SIM בשער/הפניה/ווצאפ-מכשיר). אין דליפת-ספק.
// ─────────────────────────────────────────────────────────────────────────────

import { buildTenant, validateTenant } from '../../lib/telephony/engine';
import { explainCall } from '../../lib/telephony/engine';
import { trustReport } from '../../lib/telephony/engine';
import { hebrewClosedWindows, CITIES } from '../../lib/telephony/engine';
import type { OrgConfig, TelNumber, TelephonyConfig } from '../../types/config';

// הטיפוסים חיים בשכבת-הטיפוסים (types/config) כדי ש-normalizeConfig יחטא אותם
// בלי לייבא מרכיבים. מיוצאים-מחדש כאן לנוחות הצרכנים ההיסטוריים (הפאנל + הבדיקות).
export type { TelNumber, TelephonyConfig };

const ONRAMP: Record<TelNumber['kind'], string> = {
  sim: 'sim-in-gateway',
  virtual: 'customer-forward',
  whatsapp: 'device-link',
};
const CHANNELS: Record<TelNumber['kind'], string[]> = {
  sim: ['voice'],
  virtual: ['voice'],
  whatsapp: ['whatsapp'],
};

/** תצורת-ברירת-מחדל שמישה — קו-ראשי אחד, שעות 09:00–17:00 א׳–ה׳. */
export function emptyTelephonyConfig(): TelephonyConfig {
  return {
    numbers: [{ id: 'n1', e164: '', label: 'קו ראשי', kind: 'sim' }],
    officeDays: [0, 1, 2, 3, 4],
    officeStart: '09:00',
    officeEnd: '17:00',
    officeExt: '101',
    managerExt: '201',
    vmBox: '100',
    city: '',
    kosherMode: false,
    hebrewCalendar: true,
    zmanim: false,
    shabbat: true,
    fasts: false,
    voicemail: true,
  };
}

/** slug תקין ל-tenantId (אותיות-קטנות/ספרות/מקף, 3–40) מתוך שם-הארגון/slug. */
export function toTenantId(slug: string, orgName: string): string {
  const base = (slug && slug !== 'default' ? slug : orgName || 'org')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 38);
  const padded = base.length >= 3 ? base : `${base}-org`;
  return /^[a-z0-9]/.test(padded) ? padded : `x-${padded}`.slice(0, 40);
}

/**
 * ממיר תצורת-אשף ל-raw-tenant שהמנוע מקבל. ערוצי-שער מוקצים אוטומטית ל-SIM-ים.
 * @param tc תצורת-האשף @param orgName שם-הארגון @param tenantId slug
 */
export function telephonyToTenant(tc: TelephonyConfig, orgName: string, tenantId: string): Record<string, unknown> {
  let gw = 0;
  const numbers = (tc.numbers || [])
    .filter((n) => n.e164 && n.e164.trim())
    .map((n) => {
      const base: Record<string, unknown> = {
        id: n.id,
        e164: n.e164.trim(),
        label: n.label || n.id,
        type: n.kind,
        onramp: ONRAMP[n.kind],
        channels: CHANNELS[n.kind],
        ...(n.kosher ? { kosher: true } : {}),
      };
      if (n.kind === 'sim') { gw += 1; base.gatewayChannel = gw; }
      return base;
    });
  const firstSim = numbers.find((n) => n.onramp === 'sim-in-gateway');
  const features: Record<string, boolean> = {
    'voice.kosher': tc.kosherMode,
    'calendar.hebrew': tc.hebrewCalendar,
    'calendar.shabbat': tc.shabbat,
    'calendar.fasts': tc.fasts,
    'calendar.zmanim': tc.zmanim,
    voicemail: tc.voicemail,
  };
  return {
    tenantId,
    orgName: orgName || 'ארגון',
    timezone: 'Asia/Jerusalem',
    ...(tc.city ? { city: tc.city } : {}),
    officeHours: { days: [...tc.officeDays].sort((a, b) => a - b), start: tc.officeStart, end: tc.officeEnd },
    numbers,
    destinations: {
      office: { ext: [tc.officeExt], ringSeconds: 25 },
      manager: { ext: tc.managerExt, ringSeconds: 30 },
      voicemail: { box: tc.vmBox },
    },
    outbound: { defaultNumberId: firstSim ? (firstSim.id as string) : (numbers[0]?.id ?? 'n1') },
    cti: { org: tenantId, mode: 'directory' },
    features,
  };
}

export interface PreviewRow { when: string; caller: string; summary: string; outcome: string; }
export interface TelephonyPreview {
  ok: boolean;
  errors: string[];
  warnings: string[];
  rows: PreviewRow[];
  trust: { grade: string; score: number; ready: boolean; failing: Array<{ label: string; detail: string; severity: string }> } | null;
  /** קבצי-הקונפיג שחוללו (dialplan/directory/gateways/manifest) — להורדה/מסירה. */
  files: Record<string, string> | null;
}

// עוגן-לוח דטרמיניסטי לתצוגה-המקדימה (12 חודשים קדימה מהיום). לא נשמר — רק לתצוגה.
function anchorToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * תצוגה-מקדימה חיה: בונה tenant, מריץ סימולטור-שיחה על תרחישים מייצגים (בשעות/
 * אחרי-שעות/שבת), ומחשב דוח-אמון. הכול בדפדפן, בלי PBX. downstream — קריאה-בלבד.
 */
export function previewTelephony(tc: TelephonyConfig, orgName: string, tenantId: string): TelephonyPreview {
  const raw = telephonyToTenant(tc, orgName, tenantId);
  const anchor = anchorToday();
  const opts = { anchorDate: anchor, calendarWindow: 400 };
  const v = validateTenant(raw);
  if (!v.ok) return { ok: false, errors: v.errors, warnings: v.warnings, rows: [], trust: null, files: null };
  const tenant = v.tenant;
  const built = buildTenant(raw, opts);

  const voiceDid = (tc.numbers.find((n) => n.kind === 'sim' || n.kind === 'virtual') || tc.numbers[0])?.e164 || '';
  const caller = '050-1234567';
  // תרחישים מייצגים: יום-חול בשעות · יום-חול אחרי-שעות · שבת (אם מגודר).
  const rows: PreviewRow[] = [];
  const scenarios: Array<{ when: string; call: Record<string, unknown> }> = [
    { when: 'יום שלישי 10:00 (בשעות)', call: { did: voiceDid, callerId: caller, dow: 2, hhmm: '10:00' } },
    { when: 'יום שלישי 20:00 (אחרי-שעות)', call: { did: voiceDid, callerId: caller, dow: 2, hhmm: '20:00' } },
    { when: 'שבת 11:00', call: { did: voiceDid, callerId: caller, dow: 6, hhmm: '11:00' } },
  ];
  for (const s of scenarios) {
    const e = explainCall(tenant, s.call, opts);
    rows.push({ when: s.when, caller, summary: e.summary, outcome: e.outcome });
  }

  let trust: TelephonyPreview['trust'] = null;
  if (built.ok) {
    const tr = trustReport(built);
    trust = {
      grade: tr.grade,
      score: tr.score,
      ready: tr.ready,
      failing: tr.failing.map((c) => ({ label: c.label, detail: c.detail, severity: c.severity })),
    };
  }
  return { ok: true, errors: [], warnings: (built.warnings as string[]) || v.warnings || [], rows, trust, files: (built.files as Record<string, string>) || null };
}

/** סגירה-קרובה (שבת/חג) לתצוגת-בית: הדלקת-נרות, צאת, סיבה ועיר-העוגן. */
export interface NextClosure {
  reason: string;
  kind: string;
  startIso: string;
  candle: string;
  endIso: string;
  tzeis: string;
  cityHe: string;
}

/**
 * הסגירה ההלכתית הבאה (שבת/יו״ט) בחלון 10 הימים הקרובים — לווידג'ט-הבית
 * "זמני שבת/חג". רץ על מנוע-הזמנים הטהור (NOAA, חישוב-מקומי בלבד — downstream,
 * אין ספק/שירות). דורש עיר-עוגן; בלי telephony ⇒ null (אין נ״צ). דטרמיניסטי.
 * @param config קונפיג-הארגון (config.telephony.city) @param todayIso עוגן היום
 */
export function nextClosure(config: OrgConfig, todayIso: string): NextClosure | null {
  const tel = config.telephony;
  if (!tel) return null;
  const city = tel.city || 'default';
  const tenant = { city, timezone: 'Asia/Jerusalem' };
  const wins = hebrewClosedWindows(todayIso, 10, tenant, {});
  const w = wins[0];
  if (!w) return null;
  const cityHe = (tel.city && CITIES[tel.city]) ? CITIES[tel.city].he : CITIES.jerusalem.he;
  return { reason: w.reason, kind: w.kind, startIso: w.startIso, candle: w.startTime, endIso: w.endIso, tzeis: w.endTime, cityHe };
}

/** מריץ תיאור-שיחה יחיד (למשתמש שמנסה מספר/שעה ספציפיים). */
export function explainOne(tc: TelephonyConfig, orgName: string, tenantId: string, call: Record<string, unknown>): { summary: string; outcome: string; reason: string } {
  const raw = telephonyToTenant(tc, orgName, tenantId);
  const v = validateTenant(raw);
  if (!v.ok) return { summary: '⚠️ תצורה לא-תקינה: ' + v.errors.join(' · '), outcome: 'invalid', reason: '' };
  const e = explainCall(v.tenant, call, { anchorDate: anchorToday(), calendarWindow: 400 });
  return { summary: e.summary, outcome: e.outcome, reason: e.reason };
}
