#!/usr/bin/env node
/** 🥇 רתמת-זהב · טלפוניה — הישן (maor/src/components/telephony/lib.ts, מתורגם-חי דרך
 *  ה-typescript של מאור) ≡ החדש (Genesis new/boxes/telephony.mjs) על קורפוס-LCG
 *  (seed=20260824): קונפיגי-טלפוניה × שמות-ארגון × slugs × שיחות × ערים. אפס-סטייה
 *  על כל 6 החוטים. בלי Date.now — שעון קפוא (2026-08-24) לשני הצדדים, כך ש-anchorToday
 *  הפנימי-של-המקור והזרקת-io של הקופסה זהים לבייט. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert';

const MAOR = '/home/user/maor-system';
const require = createRequire(MAOR + '/');
const ts = require('typescript');

// ── שעון-קפוא: new Date() (בלי ארגומנטים) + Date.now ⇒ עוגן-קבוע; פרסור-עם-ארגומנט נשמר ──
const RealDate = Date;
const FIXED = new RealDate('2026-08-24T12:00:00Z').getTime();
class FrozenDate extends RealDate {
  constructor(...a) { if (a.length === 0) super(FIXED); else super(...a); }
  static now() { return FIXED; }
}
globalThis.Date = FrozenDate;

// ── שקעי-המנוע האמיתיים (telephony/lib/*.mjs) — אותם אלה שהמקור מייבא דרך engine.ts ──
const ENG_INDEX = pathToFileURL(MAOR + '/telephony/lib/index.mjs').href;
const ENG_SIM = pathToFileURL(MAOR + '/telephony/lib/simulate.mjs').href;
const ENG_REP = pathToFileURL(MAOR + '/telephony/lib/report.mjs').href;
const ENG_ZM = pathToFileURL(MAOR + '/telephony/lib/zmanim.mjs').href;
const { validateTenant, buildTenant } = await import(ENG_INDEX);
const { explainCall } = await import(ENG_SIM);
const { trustReport } = await import(ENG_REP);
const { hebrewClosedWindows, CITIES } = await import(ENG_ZM);

// ── תרגום-חי של המקור: engine.ts הוא re-export-בלבד (adds no behavior, engine.ts:12);
//    מחליפים אותו ב-shim שמצביע ל-.mjs האמיתיים, ומתרגמים את lib.ts ל-ESM. ──
const tdir = fs.mkdtempSync(path.join(os.tmpdir(), 'tel-'));
fs.writeFileSync(path.join(tdir, 'engine.mjs'),
  `export { validateTenant, buildTenant } from ${JSON.stringify(ENG_INDEX)};\n` +
  `export { explainCall } from ${JSON.stringify(ENG_SIM)};\n` +
  `export { trustReport } from ${JSON.stringify(ENG_REP)};\n` +
  `export { hebrewClosedWindows, CITIES } from ${JSON.stringify(ENG_ZM)};\n`);
const libSrc = fs.readFileSync(MAOR + '/src/components/telephony/lib.ts', 'utf8')
  .replaceAll("'../../lib/telephony/engine'", "'./engine.mjs'");
fs.writeFileSync(path.join(tdir, 'old.mjs'),
  ts.transpileModule(libSrc, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText);
const OLD = await import(pathToFileURL(path.join(tdir, 'old.mjs')).href);
const NEW = await import(pathToFileURL('/home/user/-ai-chat-server/new/boxes/telephony.mjs').href);

// ── עוגן-היום שהמקור מחשב פנימית (anchorToday, lib.ts:124-127) תחת השעון-הקפוא ──
const ANCHOR = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();
const io = { anchorToday: () => ANCHOR, validateTenant, buildTenant, explainCall, trustReport, hebrewClosedWindows, CITIES };

// ── קורפוס-LCG דטרמיניסטי ──
let s = 20260824;
const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const pick = (a) => a[Math.floor(rnd() * a.length)];
const chance = (p) => rnd() < p;

const KINDS = ['sim', 'virtual', 'whatsapp'];
const E164S = ['+972501234567', '+97221234567', '', ' +972541111111 ', 'not-a-number', '+972', '0501234567'];
const ORGS = ['', 'ארגון חסד', 'Or Rishon', 'x', 'ילדים!', 'מאור-החסד'];
const SLUGS = ['default', 'or-rishon', 'My Org!!', 'ab', '', 'חסד', '---', '123abc'];
const CITY_KEYS = [...Object.keys(CITIES), 'nowhere', '', undefined];
const HHMM = ['10:00', '20:00', '11:00', '00:00', '23:59'];
const DOWS = [0, 1, 2, 3, 4, 5, 6];
const TODAYS = ['2026-08-24', '2026-09-01', '2026-03-14', '2026-10-02', '2025-12-31'];

const mkNumbers = () => Array.from({ length: Math.floor(rnd() * 4) }, (_, i) => {
  const n = { id: `n${i + 1}`, e164: pick(E164S), label: chance(0.5) ? `קו ${i}` : '', kind: pick(KINDS) };
  if (chance(0.3)) n.kosher = true;
  return n;
});
const mkTc = () => ({
  numbers: mkNumbers(),
  officeDays: Array.from(new Set(Array.from({ length: 1 + Math.floor(rnd() * 5) }, () => pick(DOWS)))),
  officeStart: pick(['09:00', '08:30', '07:00']),
  officeEnd: pick(['17:00', '16:00', '22:00']),
  officeExt: pick(['101', '100', '5']),
  managerExt: pick(['201', '200']),
  vmBox: pick(['100', '99']),
  city: pick(CITY_KEYS.filter((c) => typeof c === 'string')) ?? '',
  kosherMode: chance(0.4), hebrewCalendar: chance(0.8), zmanim: chance(0.3),
  shabbat: chance(0.7), fasts: chance(0.3), voicemail: chance(0.8),
});

const eq = (label, a, b) => assert.deepStrictEqual(a, b, label);
let n = 0;

for (let i = 0; i < 400; i++) {
  const orgName = pick(ORGS), slug = pick(SLUGS);

  // 1) toTenantId
  eq(`toTenantId(${slug},${orgName})`, NEW.toTenantId(slug, orgName), OLD.toTenantId(slug, orgName)); n++;

  // 2) emptyTelephonyConfig (גטר-קבוע)
  if (i === 0) { eq('emptyTelephonyConfig', NEW.emptyTelephonyConfig(), OLD.emptyTelephonyConfig()); n++; }

  const tid = OLD.toTenantId(slug, orgName);
  const tc = mkTc();

  // 3) telephonyToTenant
  eq(`telephonyToTenant #${i}`, NEW.telephonyToTenant(tc, orgName, tid), OLD.telephonyToTenant(tc, orgName, tid)); n++;

  // 4) previewTelephony (המקור מריץ anchorToday פנימי תחת השעון-הקפוא; החדש מוזרק ANCHOR)
  if (tc.officeDays.length) {
    eq(`previewTelephony #${i}`, NEW.previewTelephony(tc, orgName, tid, io), OLD.previewTelephony(tc, orgName, tid)); n++;

    // 6) explainOne — שיחה אקראית
    const call = { did: pick(E164S).trim(), callerId: '050-1234567', dow: pick(DOWS), hhmm: pick(HHMM) };
    eq(`explainOne #${i}`, NEW.explainOne(tc, orgName, tid, call, io), OLD.explainOne(tc, orgName, tid, call)); n++;
  }

  // 5) nextClosure
  const cfg = chance(0.15) ? {} : { telephony: { city: pick(CITY_KEYS) } };
  const today = pick(TODAYS);
  eq(`nextClosure #${i}`, NEW.nextClosure(cfg, today, io), OLD.nextClosure(cfg, today)); n++;
}

globalThis.Date = RealDate;
fs.rmSync(tdir, { recursive: true, force: true });
console.log(`🥇 זהב-טלפוניה: ישן≡חדש על ${n} השוואות (400 סבבים · 6 חוטים · שעון-קפוא 2026-08-24, אפס-סטייה)`);
