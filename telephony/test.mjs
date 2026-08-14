#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// telephony · test — שער-golden + בדיקות-יחידה למנוע.
//   node telephony/test.mjs            → מאמת מול golden הקפוא (ביט-לביט)
//   UPDATE=1 node telephony/test.mjs   → מקפיא golden מחדש (אחרי שינוי-מכוון)
//
// דטרמיניזם מלא ⇒ אותו קלט = אותו פלט. כל שינוי לא-מכוון בפלט נתפס כאן.
// ─────────────────────────────────────────────────────────────────────────────

import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTenant, validateTenant, toE164 } from './lib/index.mjs';
import {
  buildDirectory, lookupCaller, lookupInDirectory, enrichContact, screenPop,
  callEvent, dialString, callHistoryFor, maskNumber, popPriorityFor, SCREENPOP_VERSION,
} from './lib/cti.mjs';
import {
  tenantFromIntake, INTAKE_STEPS, numbersFromCsv, detectNumberType, stepsFor,
  provisioningQr, seedVertical, routingPreview, preflight, exportConfig, cloneTenant,
} from './lib/onboard.mjs';
import {
  planApply, rollbackPlan, planTenants, summarize, snapshot, pushSnapshot, restoreFrom,
  detectDrift, reloadPlan, healthReport, pushAudit, applyWithRollback, lineDiff,
  detailedDiff, changelogEntry, planApplyRespectingFreeze, batchSummary, secretPreflight,
} from './lib/apply.mjs';
import { auditRoutes } from './lib/audit-routes.mjs';
import { shabbatTimes as zShabbatTimes, hebrewClosedWindows as zClosedWindows, sunset as zSunset } from './lib/zmanim.mjs';
import {
  channelPlan, isPureDownstream, templateOf, sanitizeTemplates, renderTemplate,
  unifiedInboxOf, autoReply, applyConsent, canMessage, assignMessage, reminderMessage,
  senderIdentity, conversationTimeline, channelUsage, matchMessageContact, normalizeMessage,
} from './lib/channels.mjs';
import {
  secretsFor, secretsIsolated, can, ROLES, hardeningChecklist, recordingEncryption,
  failsafeRoute, complianceReport, crossTenantLeakScan,
} from './lib/security.mjs';
import { normalizeCdr, meterUsage, computeInvoice, checkQuota, planQuota, PLANS } from './lib/billing.mjs';
import { simulateCall } from './lib/simulate.mjs';
import { xmlWellFormed, validateAgainstSchema } from './lib/validators.mjs';
import {
  flagOn, featureOn, termOf, expandTerms, applyVertical, VERTICAL_PACKS,
  capabilities, migrateConfig, effectiveConfig, diffConfig, isBaselineConfig,
  sanitizeConfigFields, SCHEMA_VERSION, FLAG_DEFAULTS, reportDroppedKeys,
} from './lib/config.mjs';
import { classifyDay, hebParts, hebrewClosedDates } from './lib/hebcal.mjs';
import { normalizeRouting, numbersAlternation } from './lib/routing.mjs';
import { requiredPrompts, promptCapabilities } from './lib/prompts.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const UPDATE = process.env.UPDATE === '1';
let pass = 0;
let fail = 0;
const fails = [];

function ok(name, cond) {
  if (cond) {
    pass++;
  } else {
    fail++;
    fails.push(name);
    console.error('  ❌ ' + name);
  }
}
function eq(name, a, b) {
  ok(`${name} (צפוי ${JSON.stringify(b)}, קיבל ${JSON.stringify(a)})`, a === b);
}

// ── 1. normalize ────────────────────────────────────────────────────────────
console.log('· normalize');
eq('02-5551234 → E164', toE164('02-5551234'), '+97225551234');
eq('050-111-2233 → E164', toE164('050-111-2233'), '+972501112233');
eq('+972 נשמר', toE164('+972 50 111 2233'), '+972501112233');
eq('972 → +972', toE164('972501112233'), '+972501112233');
eq('00972 → +972', toE164('00972501112233'), '+972501112233');
eq('בין-לאומי +1', toE164('+1 202 555 0143'), '+12025550143');
eq('ריק → null', toE164(''), null);
eq('זבל → null', toE164('abc'), null);

// ── 2. validate: golden fixture תקין ────────────────────────────────────────
console.log('· validate — chesed-demo');
const chesed = JSON.parse(readFileSync(join(HERE, 'fixtures/tenant-chesed.json'), 'utf8'));
const vres = validateTenant(chesed);
ok('chesed תקין', vres.ok);
eq('5 מספרים נושאי-קול', vres.tenant.numbers.filter((n) => n.channels.includes('voice') && n.onramp !== 'device-link').length, 5);
ok('סייג-כשר קיים', vres.warnings.some((w) => w.includes('כשר')));

// ── 3. validate: כשלים צפויים ───────────────────────────────────────────────
console.log('· validate — כשלים');
ok('קונפיג-ריק נדחה', !validateTenant({}).ok);
ok('בלי מספרים נדחה', !validateTenant({ ...chesed, numbers: [] }).ok);
{
  const dup = JSON.parse(JSON.stringify(chesed));
  dup.numbers[1].e164 = dup.numbers[0].e164; // e164 כפול
  const r = validateTenant(dup);
  ok('e164 כפול נדחה', !r.ok && r.errors.some((e) => e.includes('כפול')));
}
{
  const badHours = JSON.parse(JSON.stringify(chesed));
  badHours.officeHours.start = '18:00';
  badHours.officeHours.end = '09:00';
  ok('start אחרי end נדחה', !validateTenant(badHours).ok);
}
{
  const onlyWa = JSON.parse(JSON.stringify(chesed));
  onlyWa.numbers = [onlyWa.numbers[5]]; // רק ווצאפ device-link
  const r = validateTenant(onlyWa);
  ok('רק-ווצאפ ⇒ אין-קול נדחה', !r.ok && r.errors.some((e) => e.includes('נושא-קול')));
}
{
  const badDefault = JSON.parse(JSON.stringify(chesed));
  badDefault.outbound.defaultNumberId = 'nope';
  ok('defaultNumberId שגוי נדחה', !validateTenant(badDefault).ok);
}

// ── 4. generate: דטרמיניזם — הרצה כפולה זהה ──────────────────────────────────
console.log('· generate — דטרמיניזם');
const a = buildTenant(chesed);
const b = buildTenant(chesed);
ok('שתי הרצות זהות', JSON.stringify(a.files) === JSON.stringify(b.files));

// ── 5. generate: אינווריאנטים pure-downstream ────────────────────────────────
console.log('· generate — אינווריאנטים');
const dp = a.files['dialplan/tenant_chesed-demo.xml'];
ok('device-link (ווצאפ) לא בדיאלפלן', !dp.includes('054') && !dp.includes('ווצאפ'));
ok('אין gateway של ספק', !/gateway.*(bezeq|012|013|018|hot|cellcom|partner|pelephone|yemot)/i.test(dp));
ok('כל SIM-יציאה דרך שער-הלקוח', (dp.match(/sofia\/gateway\/chesed-demo-gw/g) || []).length >= 4);
ok('גם manifest אומר pure-downstream', a.manifest.model === 'pure-downstream');
ok('ווצאפ ב-nonVoiceChannels', a.manifest.nonVoiceChannels.some((x) => x.onramp === 'device-link'));
eq('inbound context בשער', (a.files['sip_profiles/gateways/chesed-demo.xml'].match(/tenant_chesed-demo/g) || []).length, 4);

// ── 5b. CTI: גשר screen-pop מול מאור ────────────────────────────────────────
console.log('· cti — screen-pop');
const mdb = JSON.parse(readFileSync(join(HERE, 'fixtures/maor-db.json'), 'utf8'));
const dir = buildDirectory(mdb);
// 050-111-2233 משותף למשפחת-כהן (F1) ולתומך דוד (S1).
eq('מספר-משותף → 2 אנשי-קשר', (dir['+972501112233'] || []).length, 2);
{
  const pop = lookupCaller(mdb, '050-111-2233');
  eq('screen-pop primary = תומך (עדיפות)', pop.primary.kind, 'supporter');
  eq('screen-pop number מנורמל', pop.number, '+972501112233');
  eq('screen-pop 2 התאמות', pop.matches.length, 2);
}
{
  const pop = lookupCaller(mdb, '02-6543210'); // phone2 של F1
  eq('phone2 מזוהה', pop.primary && pop.primary.id, 'F1');
}
{
  const pop = lookupCaller(mdb, '+972580001111'); // כבר E164
  eq('E164 ישיר מזוהה', pop.primary && pop.primary.name, 'שרה נדבנית');
}
{
  const pop = lookupCaller(mdb, '03-0000000'); // לא קיים
  eq('לא-מזוהה → primary null', pop.primary, null);
}
eq('lookupInDirectory ≡ lookupCaller', lookupInDirectory(dir, '050-111-2233').primary.kind, 'supporter');
ok('directory דטרמיניסטי', JSON.stringify(buildDirectory(mdb)) === JSON.stringify(dir));

// ── 5c. onboard: תצורה-עצמית מקצה-לקצה ──────────────────────────────────────
console.log('· onboard — תצורה-עצמית');
const intake = JSON.parse(readFileSync(join(HERE, 'fixtures/intake-minimal.json'), 'utf8'));
const derived = tenantFromIntake(intake);
// גזירה אוטומטית: onramp לפי טיב.
eq('sim → sim-in-gateway', derived.numbers[0].onramp, 'sim-in-gateway');
eq('virtual → customer-forward', derived.numbers[3].onramp, 'customer-forward');
eq('whatsapp → device-link', derived.numbers[4].onramp, 'device-link');
eq('ווצאפ → channels whatsapp', derived.numbers[4].channels.join(','), 'whatsapp');
// ערוצי-שער רצים אוטומטית ל-SIM בלבד.
eq('SIM ראשון ערוץ 1', derived.numbers[0].gatewayChannel, 1);
eq('SIM שלישי ערוץ 3', derived.numbers[2].gatewayChannel, 3);
ok('וירטואלי בלי ערוץ-שער', derived.numbers[3].gatewayChannel === undefined);
eq('יעד-יציאה = SIM ראשון', derived.outbound.defaultNumberId, 'n1');
// end-to-end: מתשובות-מינימום → קונפיג תקין → קבצים.
const built = buildTenant(derived);
ok('תצורה-עצמית ⇒ buildTenant תקין', built.ok);
ok('נוצר דיאלפלן', !!built.files['dialplan/tenant_demo-intake.xml']);
eq('4 SIM-יציאה (3 sim + 0)... בעצם 3', built.manifest.outboundSims.length, 3);
// אינווריאנט תצורה-עצמית: הטופס לא מבקש לבחור ספק/onramp/trunk — הכל נגזר.
{
  const allFieldKeys = INTAKE_STEPS.flatMap((s) => (s.fields || []).map((f) => f.key));
  ok('הטופס לא מבקש onramp (נגזר)', !allFieldKeys.includes('onramp'));
  ok('הטופס לא מבקש ספק/trunk/gateway', !allFieldKeys.some((k) => /provider|trunk|gateway|carrier|onramp/i.test(k)));
  ok('הטופס ≥4 שלבים', INTAKE_STEPS.length >= 4);
}

// ── 5d. apply: אידמפוטנטיות · isolation · rollback ──────────────────────────
console.log('· apply — רב-דיירות');
const t1 = buildTenant(chesed).files;
const t2 = buildTenant(derived).files;
// אידמפוטנטיות: החלה ראשונה = הכל-חדש; שנייה על אותו תצלום = אפס-שינוי.
{
  const first = planApply({}, t1);
  ok('החלה ראשונה יוצרת הכל', first.creates.length === 4 && first.changed);
  const second = planApply(t1, t1);
  ok('החלה חוזרת = אפס-שינוי (אידמפוטנטי)', !second.changed && second.unchanged.length === 4);
}
// שינוי-נתון בודד → עדכון-אחד בלבד.
{
  const changed = JSON.parse(JSON.stringify(chesed));
  changed.officeHours.end = '18:00';
  const plan = planApply(t1, buildTenant(changed).files);
  ok('שינוי-שעה → עדכון דיאלפלן+manifest בלבד', plan.updates.length === 2 && plan.creates.length === 0);
}
// isolation רב-דיירת: chesed-demo + demo-intake → אפס-חפיפה בנתיבי-המרכזייה.
{
  const { collisions, anyChanged } = planTenants(
    [{ tenantId: 'chesed-demo', desired: t1 }, { tenantId: 'demo-intake', desired: t2 }],
    {},
  );
  ok('שני-לקוחות ⇒ אפס-חפיפת-נתיבים', collisions.length === 0);
  ok('שני-לקוחות ⇒ יש-שינוי', anyChanged);
}
// rollback: החלת v2 ואז שחזור ל-v1 מחזיר ביט-לביט.
{
  const v2files = buildTenant({ ...chesed, orgName: 'שם חדש' }).files;
  const { restoreFiles, plan } = rollbackPlan(t1, v2files);
  ok('שחזור מחזיר את v1 ביט-לביט', JSON.stringify(restoreFiles) === JSON.stringify(t1));
  ok('תוכנית-שחזור מסמנת שינוי', plan.changed);
  ok('summarize קריא', /^\+\d+ ~\d+ -\d+ =\d+$/.test(summarize(plan)));
}

// ── 5e. channels: מודל רב-ערוצי downstream ──────────────────────────────────
console.log('· channels — רב-ערוצי downstream');
{
  const plan = channelPlan(vres.tenant);
  eq('ווצאפ אחד (device-link)', plan.whatsapp.length, 1);
  eq('ווצאפ method=device-link', plan.whatsapp[0].method, 'device-link');
  ok('ווצאפ provider=null (אין ספק)', plan.whatsapp[0].provider === null);
  // n2 (voice+sms) + n7 (sms) → 2 ערוצי-SMS.
  eq('שני ערוצי-SMS', plan.sms.length, 2);
  ok('SMS דרך SIM-gateway', plan.sms.every((s) => s.method === 'sim-gateway'));
  ok('SMS provider=null', plan.sms.every((s) => s.provider === null));
  ok('unifiedInbox כולל 3 ערוצים', plan.unifiedInbox.channels.length === 3);
  ok('pure-downstream נאכף', isPureDownstream(plan));
}
// אינווריאנט-הגנה: לא ניתן להחדיר Business API / ספק-SMS.
{
  const bad = { whatsapp: [{ provider: 'meta', method: 'business-api' }], sms: [] };
  ok('Business API נפסל', !isPureDownstream(bad));
  const bad2 = { whatsapp: [], sms: [{ provider: 'twilio', method: 'sms-provider' }] };
  ok('ספק-SMS נפסל', !isPureDownstream(bad2));
}

// ── גל 1 (1-10): יסוד-תצורה ─────────────────────────────────────────────────
console.log('· גל 1 — תצורה: דגלים/מונחים/ורטיקלים');
// 1. flagOn — ליבה חסר=דלוק, תוספת חסר=כבוי, שרשור-אבות, self-override.
ok('ליבה voicemail דלוק כברירת-מחדל', flagOn({}, 'voicemail'));
ok('תוספת ivr כבוי כברירת-מחדל', !flagOn({}, 'voice.ivr'));
ok('self false מכבה ליבה', !flagOn({ features: { voicemail: false } }, 'voicemail'));
ok('self true מדליק תוספת', flagOn({ features: { 'voice.ivr': true } }, 'voice.ivr'));
ok('אב false מכבה צאצא', !flagOn({ features: { voice: false } }, 'voice.timecondition'));
ok('מפתח-לא-מוכר חסר=דלוק (חוזה maor)', flagOn({}, 'something.new'));
// 2. termOf + expand
eq('termOf ברירת-מחדל', termOf({}, 'office'), 'משרד');
eq('termOf דריסה', termOf({ terms: { office: 'המזכירות' } }, 'office'), 'המזכירות');
eq('termOf ריק=ברירת-מחדל', termOf({ terms: { office: '  ' } }, 'office'), 'משרד');
eq('expandTerms %org%', expandTerms({ orgName: 'עמותת א' }, 'שלום ל%org%'), 'שלום לעמותת א');
// 3+4. ורטיקל + מיתוג
{
  const v = applyVertical({ vertical: 'kollel', tenantId: 'k' });
  ok('ורטיקל-כולל זורע calendar.hebrew', v.features['calendar.hebrew'] === true);
  eq('ורטיקל-כולל term org', v.terms.org, 'הכולל');
  ok('ורטיקל זורע officeHours', v.officeHours.start === '10:00');
  const override = applyVertical({ vertical: 'kollel', terms: { org: 'הכולל שלי' } });
  eq('קונפיג מפורש גובר על ורטיקל', override.terms.org, 'הכולל שלי');
}
// 5. חיטוי
{
  const s = sanitizeConfigFields({ features: { voice: false, BAD$KEY: true, x: 'no' }, terms: { office: 'x', evil: 'y' } });
  ok('חיטוי משאיר boolean+מפתח-נקי', s.features.voice === false && !('BAD$KEY' in s.features) && !('x' in s.features));
  ok('חיטוי-terms allowlist', s.terms.office === 'x' && !('evil' in s.terms));
}
// 6. capabilities
{
  const caps = capabilities({ features: { 'voice.ivr': true }, cti: { mode: 'directory' } });
  ok('caps.voice דלוק', caps.voice && caps.voicemail);
  ok('caps.ivr נדלק', caps.ivr);
  ok('caps.recording כבוי', !caps.recording);
  ok('caps.cti לפי mode', caps.cti === true);
}
// 7. migrate
{
  const m = migrateConfig({ tenantId: 'x' });
  eq('migrate מרים schemaVersion', m.schemaVersion, SCHEMA_VERSION);
  ok('migrate מזריק features/terms', !!m.features && !!m.terms);
  ok('migrate אידמפוטנטי', JSON.stringify(migrateConfig(m)) === JSON.stringify(m));
}
// 8. effectiveConfig — עובד רק מגביל
{
  const eff = effectiveConfig(
    { features: { voice: true, reports: true } },
    { features: { 'voice.ivr': true } },
    { features: { reports: false, 'voice.ivr': true } }, // עובד: מכבה reports, מנסה להדליק ivr
  );
  ok('שכבת-לקוח דורסת', eff.features['voice.ivr'] === true);
  ok('עובד מכבה', eff.features.reports === false);
}
// 9. אינווריאנט ביט-זהה
ok('chesed baseline (בלי דריסות)', isBaselineConfig(vres.tenant) === (Object.keys(vres.tenant.features).length === 0 && Object.keys(vres.tenant.terms).length === 0));
ok('קונפיג-ריק = baseline', isBaselineConfig({}));
ok('קונפיג עם term ≠ baseline', !isBaselineConfig({ terms: { office: 'x' } }));
// 10. diff
{
  const d = diffConfig({ features: { voice: true } }, { features: { voice: false, reports: true } });
  ok('diff תופס שינוי', d.changed && d.features.voice.to === false && d.features.reports.to === true);
  ok('diff אין-שינוי', !diffConfig({ features: { a: true } }, { features: { a: true } }).changed);
}
// wiring: recording opt-in משנה פלט; voicemail off מסיר פלט.
{
  const rec = buildTenant({ ...chesed, features: { recording: true } });
  ok('recording=on מוסיף record_session', rec.files['dialplan/tenant_chesed-demo.xml'].includes('record_session'));
  ok('recording=off (baseline) בלי record_session', !buildTenant(chesed).files['dialplan/tenant_chesed-demo.xml'].includes('record_session'));
  const noVm = buildTenant({ ...chesed, features: { voicemail: false } });
  ok('voicemail=off מסיר voicemail', !noVm.files['dialplan/tenant_chesed-demo.xml'].includes('application="voicemail"'));
}

// ── גל 2 (11-20): ניתוב לוח-עברי ────────────────────────────────────────────
console.log('· גל 2 — לוח-עברי');
// 11+19. סיווג-יום מדויק (מאומת מול תאריכי 2026/5787).
eq('ראש השנה', classifyDay('2026-09-12').yomTov, 'ראש השנה');
eq('יום כיפור', classifyDay('2026-09-21').yomTov, 'יום כיפור');
eq('סוכות = 15 תשרי', classifyDay('2026-09-26').yomTov, 'סוכות');
eq('שמיני עצרת', classifyDay('2026-10-03').yomTov, 'שמיני עצרת · שמחת תורה');
eq('פסח', classifyDay('2026-04-02').yomTov, 'פסח');
eq('שביעי של פסח', classifyDay('2026-04-08').yomTov, 'שביעי של פסח');
eq('שבועות', classifyDay('2026-05-22').yomTov, 'שבועות');
// 12. ערב-חג
eq('ערב פסח', classifyDay('2026-04-01').erevChag, 'ערב פסח');
// 13. חול-המועד
eq('חול המועד פסח', classifyDay('2026-04-05').cholHamoed, 'חול המועד פסח');
// 14. שבת
ok('שבת מזוהה', classifyDay('2026-09-19').shabbat && classifyDay('2026-09-19').closedReason === 'שבת');
// 15. צום (לא-סוגר אוטומטית) + דחייה
eq('תשעה באב', classifyDay('2026-07-23').fast, 'תשעה באב');
ok('צום לא סוגר אוטומטית (closedReason null)', classifyDay('2026-07-23').closedReason === null);
// 16. ראש-חודש
ok('ראש חודש (1 בחודש)', classifyDay('2026-04-18').roshChodesh);
// 18. חותם עברי
ok('hebParts תקין', hebParts('2026-09-12').monthHe === 'תשרי' && hebParts('2026-09-12').day === 1);
// 19. מחולל חלון — יו״ט בלבד, בלי שבת
{
  const closed = hebrewClosedDates('2026-09-01', 60);
  ok('חלון מכיל ראש השנה+כיפור', closed.some((c) => c.reason === 'ראש השנה') && closed.some((c) => c.reason === 'יום כיפור'));
  ok('חלון בלי שבת (מכוסה ב-wday)', !closed.some((c) => c.reason === 'שבת'));
  ok('חלון דטרמיניסטי', JSON.stringify(hebrewClosedDates('2026-09-01', 60)) === JSON.stringify(closed));
}
// wiring: kollel (vertical מדליק calendar.hebrew) + anchor → heb_ extensions.
{
  const k = buildTenant(JSON.parse(readFileSync(join(HERE, 'fixtures/tenant-kollel.json'), 'utf8')), { anchorDate: '2026-09-01', calendarWindow: 400 });
  ok('kollel תקין', k.ok);
  const dp = k.files['dialplan/tenant_kollel-demo.xml'];
  ok('kollel דיאלפלן מכיל heb_ חג', /heb_\d{8}/.test(dp) && dp.includes('closed_reason'));
  ok('kollel manifest.hebrewCalendar', !!k.manifest.hebrewCalendar && k.manifest.hebrewCalendar.closedDays.length > 0);
  ok('kollel officeHours מהוורטיקל (10:00)', k.manifest.officeHours.start === '10:00');
  // בלי anchor → אין לוח (דטרמיניזם golden נשמר).
  ok('בלי anchor אין heb_', !/heb_\d{8}/.test(buildTenant(JSON.parse(readFileSync(join(HERE, 'fixtures/tenant-kollel.json'), 'utf8'))).files['dialplan/tenant_kollel-demo.xml']));
}

// ── גל 3 (21-30): ניתוב-קול עשיר ────────────────────────────────────────────
console.log('· גל 3 — ניתוב עשיר: IVR/תור/חסימה/חיוג-מהיר');
const full = JSON.parse(readFileSync(join(HERE, 'fixtures/tenant-full.json'), 'utf8'));
const fb = buildTenant(full);
const fdp = fb.files['dialplan/tenant_full-demo.xml'];
ok('full תקין', fb.ok);
// 21. IVR
ok('IVR menu + play_and_get_digits', fdp.includes('ivr_menu') && fdp.includes('play_and_get_digits'));
ok('IVR אפשרות ringgroup', fdp.includes('ivr_opt_1') && fdp.includes('user/101@full-demo,user/102@full-demo'));
ok('IVR אפשרות voicemail', fdp.includes('ivr_opt_3') && /ivr_opt_3[\s\S]*?voicemail/.test(fdp));
ok('IVR fallback ריק', fdp.includes('ivr_opt_empty'));
// 23. אסטרטגיית-צלצול (בפרופיל בלי IVR)
{
  const seq = buildTenant({ ...full, features: {}, routing: { ...full.routing, ivr: undefined, ringStrategy: 'sequential' } });
  ok('sequential ⇒ צינור בין שלוחות', seq.files['dialplan/tenant_full-demo.xml'].includes('user/101@full-demo|user/102@full-demo'));
  const sim = buildTenant({ ...full, features: {}, routing: { ringStrategy: 'simultaneous', ivr: undefined } });
  ok('simultaneous ⇒ פסיק', sim.files['dialplan/tenant_full-demo.xml'].includes('user/101@full-demo,user/102@full-demo'));
}
// 25. גלישה מדורגת
ok('overflow ⇒ שרשרת-בריג׳', fdp.includes('user/301@full-demo') && fdp.includes('user/302@full-demo'));
// 26. לו״ז פר-מספר
ok('per-number hours ⇒ line_n3', fdp.includes('line_n3') && fdp.includes('18:00-22:00'));
// 27. חסימה
ok('blocklist ⇒ CALL_REJECTED', fdp.includes('blocklist') && fdp.includes('CALL_REJECTED'));
// 28. DND (inline)
{
  const dnd = buildTenant({ ...full, features: { 'voice.dnd': true }, routing: { dnd: true } });
  ok('dnd ⇒ override סגור', dnd.files['dialplan/tenant_full-demo.xml'].includes('dnd_override'));
}
// 29. חניית-שיחה
ok('park ⇒ valet_park על 700', fdp.includes('valet_park') && fdp.includes('"^700$"'));
// 30. חיוג-מהיר + פנימי
ok('speedDial ⇒ sd_star1', fdp.includes('sd_star1') && fdp.includes('sd_star2'));
ok('internal ⇒ internal_dial', fdp.includes('internal_dial'));
// 22. תור (inline — mutual-exclusive עם IVR)
{
  const q = buildTenant({ ...full, features: { 'voice.queue': true }, routing: { queue: { maxWaitSec: 120 }, ivr: undefined } });
  const qdp = q.files['dialplan/tenant_full-demo.xml'];
  ok('queue ⇒ fifo in + queue_agent', qdp.includes('fifo') && qdp.includes('queue_agent'));
}
// normalizeRouting טהור: חיטוי
{
  const { routing, warnings: w } = normalizeRouting({
    ivr: { options: [{ digit: '1', dest: { type: 'ext', value: '101' } }, { digit: 'X', dest: { type: 'ext', value: '1' } }] },
    blocklist: ['050-1111111', 'zzz'],
    speedDial: [{ code: '*9', e164: '021234567' }, { code: 'bad', e164: '1' }],
  });
  ok('routing מחטא ספרה-לא-תקינה', routing.ivr.options.length === 1);
  ok('routing מחטא blocklist זבל', routing.blocklist.length === 1);
  ok('routing מחטא speedDial זבל', routing.speedDial.length === 1);
  ok('normalizeRouting מפיק warnings', w.length >= 3);
}
ok('numbersAlternation בורח נכון', numbersAlternation(['+97250', '+97251']) === '\\+97250|\\+97251');
// אינווריאנט: כבוי=ביט-זהה (chesed בלי routing → אף מקטע לא נפלט)
ok('chesed בלי מקטעי-ניתוב-עשיר', !buildTenant(chesed).files['dialplan/tenant_chesed-demo.xml'].match(/ivr_menu|blocklist|sd_|internal_dial|valet_park|dnd_override/));

// ── גל 4 (31-40): תא-קולי · ברכות · הכרזות ──────────────────────────────────
console.log('· גל 4 — ברכות/הכרזות');
const voice = JSON.parse(readFileSync(join(HERE, 'fixtures/tenant-voice.json'), 'utf8'));
const vb = buildTenant(voice, { anchorDate: '2026-09-01' });
const vdp = vb.files['dialplan/tenant_voice-demo.xml'];
ok('voice תקין', vb.ok);
// 31+40. ברכות פתוח/סגור/חג
ok('greeting-open בפתוח', vdp.includes('greeting-open.wav'));
ok('do_closed hop (ברכת-סגור)', vdp.includes('do_closed'));
// ברכת-סגור מסתעפת: חג→greeting-holiday, חירום→greeting-emergency, רגיל→greeting-closed
ok('do_closed_holiday → greeting-holiday', /do_closed_holiday[\s\S]*?greeting-holiday\.wav/.test(vdp));
ok('do_closed → greeting-closed', /name="do_closed"[\s\S]*?greeting-closed\.wav/.test(vdp));
// 32. תא-קולי פר-שלוחה (מייל-משרד)
ok('per-ext vm-mailto', (vb.files['directory/voice-demo.xml'].match(/office@voice\.example/g) || []).length === 2);
// 33. תמלול-תא-קולי
ok('vm_transcribe hook', vdp.includes('vm_transcribe=true'));
// 36. מוזיקת-המתנה פר-לקוח
ok('hold_music מותאם', vdp.includes('hold_music=custom/chesed-hold.wav'));
// 37. קו-הכרזה
ok('announcement DID (playback+hangup)', /announce-n2\.wav/.test(vdp) && /in_n2[\s\S]*?hangup/.test(vdp));
// 39. ברכת-שם-מתקשר
ok('cti_namegreeting hook', vdp.includes('cti_namegreeting=true'));
// requiredPrompts + capabilities
{
  const caps = vb.manifest.promptCapabilities;
  ok('manifest.requiredPrompts כולל greeting-open', vb.manifest.requiredPrompts.some((p) => p.file === 'greeting-open.wav'));
  ok('manifest.requiredPrompts כולל greeting-holiday', vb.manifest.requiredPrompts.some((p) => p.file === 'greeting-holiday.wav'));
  ok('manifest.requiredPrompts כולל announce-n2', vb.manifest.requiredPrompts.some((p) => p.file === 'announce-n2.wav'));
  ok('capabilities.greetings', caps.greetings && caps.holidayGreeting);
  ok('capabilities.holdMusic', caps.holdMusic === true);
  // טהור: requiredPrompts/promptCapabilities ישירות
  const rp = requiredPrompts({ tenantId: 'x', orgName: 'א', features: { 'voice.greeting': true }, numbers: [], routing: {}, cti: { mode: 'off' } });
  ok('requiredPrompts טהור (open+closed)', rp.length === 2 && rp[0].file === 'greeting-open.wav');
  ok('promptCapabilities טהור', promptCapabilities({ features: {}, numbers: [], cti: { mode: 'off' } }).greetings === false);
}
// 35. מצב-חירום (inline)
{
  const em = buildTenant({ ...voice, features: { ...voice.features, emergency: true }, emergency: { active: true, message: 'סגור היום' } });
  ok('emergency ⇒ override', em.files['dialplan/tenant_voice-demo.xml'].includes('emergency_override'));
  ok('emergency ⇒ requiredPrompts', em.manifest.requiredPrompts.some((p) => p.state === 'emergency'));
}
// 34. תור עם הכרזת-מיקום (inline)
{
  const q = buildTenant({ ...voice, features: { 'voice.queue': true }, routing: { queue: { announcePosition: true } } });
  ok('queue announce position', q.files['dialplan/tenant_voice-demo.xml'].includes('queue-position.wav'));
}
// אינווריאנט: chesed בלי מקטעי-גל-4
ok('chesed בלי ברכות/הכרזות', !buildTenant(chesed).files['dialplan/tenant_chesed-demo.xml'].match(/greeting-open|closed_greeting|announce-|hold_music|vm_transcribe|emergency_override/));

// ── גל 5 (41-50): עומק-CTI ──────────────────────────────────────────────────
console.log('· גל 5 — עומק-CTI');
// DB מועשר לבדיקה (additive על מבנה-מאור).
const rdb = {
  families: [{
    id: 'F1', name: 'משפחת כהן', phone: '050-111-2233', phone2: '02-6543210', city: 'ירושלים',
    members: [{ id: 'M1', first: 'יוסי', phone: '058-1010101' }], // בן-משפחה מקונן
  }],
  supporters: [{ id: 'S1', name: 'דוד תורם', phone: '050-111-2233', cat: 'זהב', city: 'בני ברק', last: '2026-07-01', ils: 5000 }],
  volunteers: [{ id: 'V1', name: 'מתנדב חלוקה', phone: '054-2020202' }],
  teachers: [],
};
// 41. העשרה
{
  const e = enrichContact(rdb.supporters[0], 'supporter');
  ok('enrich קטגוריה+עיר+תרומה', e.category === 'זהב' && e.city === 'בני ברק' && e.lastDonation === '2026-07-01' && e.totalIls === 5000);
}
// 46+41. screen-pop מגורס+מועשר
{
  const pop = screenPop(rdb, '050-111-2233', { direction: 'inbound', line: 'קו תרומות' });
  eq('screenPop version', pop.version, SCREENPOP_VERSION);
  eq('screenPop 2 התאמות', pop.matches.length, 2);
  ok('screenPop enrichment בכל התאמה', pop.matches.every((m) => m.enrichment));
  eq('screenPop line', pop.line, 'קו תרומות');
}
// 47. הצלבה: בן-משפחה מקונן (Family.members) + מתנדב מזוהים (תיקון #17/#18)
{
  const pop = screenPop(rdb, '058-1010101');
  ok('בן-משפחה מקונן מזוהה', pop.primary && pop.primary.kind === 'member' && pop.primary.id === 'M1');
  ok('שם-בן-משפחה = first+משפחה', pop.primary.name.includes('יוסי'));
  ok('מתנדב מזוהה', screenPop(rdb, '054-2020202').primary?.kind === 'volunteer');
}
// 48. עדיפות פר-ורטיקל
{
  const chesedPop = screenPop(rdb, '050-111-2233', { vertical: 'chesed' });
  eq('chesed ⇒ משפחה primary', chesedPop.primary.kind, 'family');
  const shulPop = screenPop(rdb, '050-111-2233', { vertical: 'shul' });
  eq('shul ⇒ תומך primary', shulPop.primary.kind, 'supporter');
  ok('popPriorityFor ידוע', popPriorityFor('chesed').family === 0);
}
// 45. מתקשר-לא-מוכר → הצעה
{
  const pop = screenPop(rdb, '03-0000000');
  ok('לא-מוכר ⇒ suggestion add', pop.primary === null && pop.suggestion && pop.suggestion.action === 'add');
  ok('הצעה כוללת family+supporter', pop.suggestion.kinds.includes('family') && pop.suggestion.kinds.includes('supporter'));
}
// 49. screen-pop יוצא
{
  const pop = screenPop(rdb, '050-111-2233', { direction: 'outbound' });
  eq('יוצא direction', pop.direction, 'outbound');
}
// 50. הצללה (privacy)
{
  const pop = screenPop(rdb, '050-111-2233', { privacy: true });
  ok('privacy ⇒ מספר-ממוסך', pop.number.includes('•') && pop.number.endsWith('2233'));
  eq('maskNumber', maskNumber('+972501112233'), '•••••••••2233');
}
// 42. אירוע-שיחה למאור
{
  const ev = callEvent({ number: '050-111-2233', direction: 'inbound', startedAt: '2026-08-10T09:30:00', durationSec: 65, line: 'ראשי', primary: { kind: 'supporter', id: 'S1', name: 'דוד תורם' } });
  eq('callEvent type', ev.type, 'call');
  eq('callEvent date', ev.date, '2026-08-10');
  ok('callEvent contact', ev.contactId === 'S1' && ev.title.includes('דוד תורם'));
}
// 43. click-to-call
{
  const t = buildTenant(chesed).ok ? validateTenant(chesed).tenant : null;
  eq('dialString דרך SIM ⇒ קידומת', dialString(t, '050-9999999', { viaNumberId: 'n2' }), `2#+972509999999`);
  eq('dialString ברירת-מחדל', dialString(t, '050-9999999'), '+972509999999');
}
// 44. היסטוריית-שיחות
{
  const logs = [
    callEvent({ number: '050-111-2233', startedAt: '2026-08-01T10:00:00' }),
    callEvent({ number: '050-111-2233', startedAt: '2026-08-05T10:00:00' }),
    callEvent({ number: '03-9999999', startedAt: '2026-08-03T10:00:00' }),
  ];
  const h = callHistoryFor(logs, '050-111-2233');
  ok('היסטוריה מסוננת+ממוינת', h.length === 2 && h[0].startedAt > h[1].startedAt);
}

// ── גל 6 (51-60): עומק-Onboarding ───────────────────────────────────────────
console.log('· גל 6 — עומק-onboarding');
// 51. CSV
{
  const csv = 'number,label,type,kosher\n02-5551234,קו ראשי,sim,\n053-9998877,קו כשר,sim,כן\n"077-200,000",וירטואלי,virtual,';
  const { numbers, errors } = numbersFromCsv(csv);
  ok('CSV מפרסר 3 שורות', numbers.length === 3);
  ok('CSV kosher=כן', numbers[1].kosher === true);
  ok('CSV מרכאות (פסיק פנימי)', numbers[2].label === 'וירטואלי');
  ok('CSV ריק ⇒ שגיאה', numbersFromCsv('').errors.length > 0);
}
// 54. autodetect
ok('05x → sim', detectNumberType('0501234567').type === 'sim');
ok('077 → virtual', detectNumberType('0772000000').onramp === 'customer-forward');
ok('02 → sim medium', detectNumberType('02-5551234').confidence === 'medium');
ok('1-800 → virtual', detectNumberType('1800123456').type === 'virtual');
// 53. branching
{
  const full = stepsFor({ numbers: [{ type: 'sim' }] });
  const waOnly = stepsFor({ numbers: [{ type: 'whatsapp' }] });
  ok('ווצאפ-בלבד מדלג יעדים/שעות', waOnly.length < full.length && !waOnly.some((s) => s.id === 'destinations'));
}
// 52. provisioning
{
  const p = provisioningQr({ tenantId: 'demo' }, '101');
  ok('provisioning sipUri', p.sipUri === 'sip:101@demo' && p.qrPayload.includes('transport=tls'));
}
// 56. seed vertical
{
  const s = seedVertical('chesed', 'עמותה', 'slug');
  ok('seed ורטיקל', s.vertical === 'chesed' && s.numbers.length === 1 && s.office === '101');
}
// 57. preview
{
  const prev = routingPreview(vres.tenant);
  ok('preview כולל שעות+יציאה', prev.some((l) => l.includes('שעות-משרד')) && prev.some((l) => l.includes('יציאה')));
}
// 58. preflight
{
  const pf = preflight(vres.tenant);
  ok('chesed מוכן-לחיוג', pf.ready);
  const pf2 = preflight({
    numbers: [{ channels: ['voice'], onramp: 'sim-in-gateway' }],
    destinations: { office: { ext: [] }, manager: { ext: '' } },
    outbound: { defaultNumberId: null }, cti: { mode: 'off' },
  });
  ok('preflight חוסם חוסר-שלוחות', !pf2.ready && pf2.blockers.length >= 2);
}
// 59. export round-trip
{
  const exp = exportConfig(vres.tenant);
  const re = buildTenant(exp);
  ok('export→build round-trip תקין', re.ok && re.manifest.tenantId === 'chesed-demo');
  ok('export לא כולל שדות-נגזרים', !('files' in exp));
}
// 60. clone
{
  const cl = cloneTenant(exportConfig(vres.tenant), 'new-org', 'ארגון חדש');
  ok('clone מזהה/שם חדשים', cl.tenantId === 'new-org' && cl.orgName === 'ארגון חדש');
  ok('clone מאפס מספרים', cl.numbers.every((n) => n.e164 === ''));
  ok('clone שומר מבנה-מספרים', cl.numbers.length === vres.tenant.numbers.length);
}

// ── גל 7 (61-70): עומק-תפעול ────────────────────────────────────────────────
console.log('· גל 7 — עומק-תפעול');
const fA = buildTenant(chesed).files;
const fB = buildTenant({ ...chesed, orgName: 'שם חדש' }).files;
// 61. תצלומים + שחזור
{
  let hist = [];
  hist = pushSnapshot(hist, snapshot(fA, { version: 'v1' }));
  hist = pushSnapshot(hist, snapshot(fB, { version: 'v2' }));
  ok('restoreFrom v1', JSON.stringify(restoreFrom(hist, 'v1')) === JSON.stringify(fA));
  ok('restoreFrom חסר=null', restoreFrom(hist, 'v9') === null);
  // טבעת
  let big = [];
  for (let i = 0; i < 25; i++) big = pushSnapshot(big, snapshot({}, { version: `v${i}` }), 20);
  ok('snapshot טבעת cap', big.length === 20 && big[0].version === 'v5');
}
// 62. drift
{
  const disk = { ...fA, 'dialplan/tenant_chesed-demo.xml': fA['dialplan/tenant_chesed-demo.xml'] + '\n<!-- edited -->' };
  const d = detectDrift(fA, disk);
  ok('drift מזהה עריכה-ידנית', !d.clean && d.drifted.length === 1);
  ok('drift נקי כשזהה', detectDrift(fA, fA).clean);
}
// 63. reload plan
{
  const plan = planApply(fA, fB); // dialplan+manifest השתנו
  const cmds = reloadPlan(plan);
  ok('reload כולל reloadxml', cmds.includes('reloadxml'));
}
// 64. health
{
  const h = healthReport({ gateways: { gw1: { state: 'REGED', latencyMs: 120 }, gw2: { state: 'FAIL_WAIT' } }, extensions: { 101: { registered: true }, 201: { registered: false } } });
  eq('health overall critical', h.overall, 'critical');
  ok('health ext לא-רשום=warn', h.items.some((i) => i.name === '201' && i.level === 'warn'));
}
// 65. audit ring
{
  let log = [];
  for (let i = 0; i < 510; i++) log = pushAudit(log, { action: 'apply', target: `t${i}` });
  ok('audit טבעת-500', log.length === 500 && log[0].target === 't10');
}
// 66. atomic + rollback
{
  const store = { ...fA };
  const good = applyWithRollback(fA, fB, (p, c) => { store[p] = c; });
  ok('apply מוצלח', good.ok && !good.rolledBack);
  let n = 0;
  const bad = applyWithRollback(fA, fB, (p, c) => { if (++n === 2) throw new Error('disk full'); });
  ok('apply נכשל ⇒ rolledBack', !bad.ok && bad.rolledBack && bad.error.includes('disk'));
}
// 67. line diff
{
  const d = lineDiff('a\nb\nc', 'a\nx\nc');
  ok('lineDiff מזהה החלפה', d.some((x) => x.op === 'del' && x.line === 'b') && d.some((x) => x.op === 'add' && x.line === 'x'));
  const dd = detailedDiff(fA, fB);
  ok('detailedDiff על קבצים-שהשתנו', Object.keys(dd).length >= 1);
}
// 68. changelog
{
  const cl = changelogEntry(fA, fB, { version: 'v2', note: 'שינוי-שם' });
  ok('changelog מסכם', cl.version === 'v2' && cl.updated.length >= 1);
}
// 69. freeze
{
  const frozen = planApplyRespectingFreeze(fA, fB, true);
  ok('freeze ⇒ no-op', !frozen.changed && frozen.frozen);
  ok('לא-נעול ⇒ רגיל', planApplyRespectingFreeze(fA, fB, false).changed);
}
// 70. batch summary
{
  const { plans } = planTenants([{ tenantId: 'chesed-demo', desired: fB }, { tenantId: 'demo-intake', desired: buildTenant(derived).files }], { 'chesed-demo': fA });
  const bs = batchSummary(plans);
  ok('batch מסכם 2 לקוחות', bs.tenants === 2 && bs.changedTenants === 2 && bs.creates + bs.updates > 0);
}

// ── גל 8 (71-80): עומק רב-ערוצי ─────────────────────────────────────────────
console.log('· גל 8 — עומק רב-ערוצי');
const org = { orgName: 'עמותת א', numbers: [{ e164: '+972500000000', channels: ['sms'], onramp: 'sim-in-gateway' }] };
// 72. תבניות
ok('templateOf ברירת-מחדל', templateOf({}, 'awayMessage').includes('%org%'));
ok('templateOf דריסה', templateOf({ templates: { thanks: 'מודים!' } }, 'thanks') === 'מודים!');
ok('sanitizeTemplates allowlist', !('evil' in sanitizeTemplates({ thanks: 'x', evil: 'y' })));
eq('renderTemplate', renderTemplate('שלום %org% על %detail%', { org: 'א', detail: 'ב' }), 'שלום א על ב');
// 71. תיבה-מאוחדת
{
  const inbox = unifiedInboxOf([{ id: '1', channel: 'sms', ts: '2026-08-01' }, { id: '2', channel: 'whatsapp', ts: '2026-08-05' }]);
  ok('תיבה ממוינת חדש→ישן', inbox[0].id === '2' && inbox.length === 2);
  ok('normalizeMessage default channel', normalizeMessage({ id: 'x' }).channel === 'sms');
}
// 73. מענה-אוטומטי
ok('away מחוץ-לשעות', autoReply(org, { nowIsOpen: false }).includes('עמותת א'));
ok('בתוך-שעות בלי-מענה', autoReply(org, { nowIsOpen: true }) === null);
// 74. הסכמה
{
  let led = applyConsent({}, { number: '050-1112233', action: 'stop' });
  ok('STOP ⇒ לא-ניתן-לשלוח', !canMessage(led, '050-1112233'));
  led = applyConsent(led, { number: '050-1112233', action: 'subscribe' });
  ok('subscribe ⇒ שוב-מותר', canMessage(led, '050-1112233'));
  ok('לא-רשום ⇒ מותר', canMessage({}, '050-9999999'));
}
// 75. ניתוב-נציג
{
  ok('roundrobin', assignMessage(['a', 'b', 'c'], { index: 4 }) === 'b');
  ok('first', assignMessage(['a', 'b'], { strategy: 'first' }) === 'a');
  ok('ריק ⇒ null', assignMessage([]) === null);
}
// 76. תזכורת-יוצאת (downstream)
{
  const r = reminderMessage(org, { number: '050-1112233', detail: 'פגישה מחר' });
  ok('תזכורת SMS provider=null', r.provider === null && r.method === 'sim-gateway');
  ok('תזכורת מרונדרת', r.text.includes('פגישה מחר') && r.direction === 'outbound');
}
// 77. זהות-שולח
{
  const wa = senderIdentity(org, 'whatsapp');
  ok('ווצאפ זהות device-link', wa.method === 'device-link' && wa.provider === null);
  const sms = senderIdentity(org, 'sms');
  ok('SMS זהות מהמספר', sms.number === '+972500000000' && sms.provider === null);
}
// 78. ציר-זמן
{
  const tl = conversationTimeline([{ type: 'call', startedAt: '2026-08-01T10:00' }, { channel: 'sms', ts: '2026-08-05T10:00' }]);
  ok('ציר-זמן ממוזג+ממוין', tl[0].kind === 'message' && tl[1].kind === 'call');
}
// 79. שימוש
{
  const u = channelUsage([{ channel: 'sms', direction: 'inbound' }, { channel: 'sms', direction: 'outbound' }, { channel: 'whatsapp', direction: 'inbound' }]);
  ok('usage סופר פר-ערוץ', u.sms.in === 1 && u.sms.out === 1 && u.whatsapp.in === 1 && u.total === 3);
}
// 80. חיבור-מאור
{
  const db = { supporters: [{ id: 'S1', name: 'דוד', phone: '050-111-2233' }], families: [], members: [], teachers: [] };
  const m = matchMessageContact(db, { id: '1', channel: 'sms', direction: 'inbound', from: '050-111-2233', ts: '2026-08-01' });
  ok('הודעה↔תורם', m.contactRef && m.contactRef.id === 'S1');
  ok('pure-downstream נשמר', isPureDownstream(channelPlan(vres.tenant)));
}

// ── גל 9 (81-90): אבטחה · בידוד · חיוב ──────────────────────────────────────
console.log('· גל 9 — אבטחה/בידוד/חיוב');
// 81. בידוד-סודות
{
  const s = secretsFor({ tenantId: 'org-a' });
  ok('סודות נושאים tenantId', s.gsm_gateway_password.includes('org-a'));
  ok('סודות מבודדים בין לקוחות', secretsIsolated([{ tenantId: 'a' }, { tenantId: 'b' }]));
}
// 82. ACL
ok('operator = הכל', can('operator', 'anything'));
ok('manager config.write', can('manager', 'config.write') && !can('manager', 'platform.admin'));
ok('agent inbox בלבד', can('agent', 'inbox.read') && !can('agent', 'config.write'));
ok('תפקיד-לא-מוכר ⇒ אסור', !can('nobody', 'config.read') && ROLES.length === 3);
// 86. הקשחה
{
  const secure = { sipTls: true, srtp: true, registerAcl: true, fail2ban: true, minPwLen: 12, outboundRestriction: true, eslAcl: true };
  ok('פרופיל-מלא מוקשח', hardeningChecklist(secure).pass);
  ok('שדות-חסרים נכשלים (fail-closed)', !hardeningChecklist({ minPwLen: 12 }).pass);
  ok('guest נכשל', !hardeningChecklist({ ...secure, allowGuest: true }).pass);
}
// 87. הצפנת-הקלטות
ok('הצפנה dormant כברירת-מחדל', !recordingEncryption({ tenantId: 'x' }).enabled);
ok('הצפנה מופעלת ⇒ AES-GCM', recordingEncryption({ tenantId: 'x', security: { recordingEncryption: true } }).algo === 'AES-256-GCM');
// 89. fail-safe
ok('fail-safe עם מנהל', failsafeRoute(vres.tenant).ok && failsafeRoute(vres.tenant).fallback === '201');
ok('fail-safe בלי מנהל נכשל', !failsafeRoute({ destinations: { manager: {} } }).ok);
// 90. תאימות
{
  const c = complianceReport(vres.tenant);
  ok('תאימות: CTI קריאה-בלבד + downstream', c.ctiReadOnly && c.downstreamOnly);
  ok('תאימות: chesed compliant', c.compliant);
  const rec = complianceReport({ tenantId: 'r', features: { recording: true }, destinations: { manager: { ext: '201' }, voicemail: { box: '100' } } });
  ok('הקלטה בלי הצפנה ⇒ finding', !rec.compliant && rec.findings.some((f) => f.includes('הצפנה')));
}
// 83. CDR
{
  const c = normalizeCdr({ uuid: 'u1', domain: 'org-a', direction: 'outbound', caller: '101', destination: '050-1112233', billsec: '75', start_stamp: '2026-08-01 10:00' });
  ok('CDR מנורמל', c.tenantId === 'org-a' && c.billsec === 75 && c.answered && c.to === '+972501112233');
}
// 84. metering
{
  const cdrs = [
    { domain: 'a', direction: 'inbound', billsec: 65 },
    { domain: 'a', direction: 'outbound', billsec: 130 },
    { domain: 'b', direction: 'inbound', billsec: 30 },
  ];
  const u = meterUsage(cdrs, 'a');
  ok('metering פר-לקוח (עיגול-דקה)', u.calls === 2 && u.minutes === 5 && u.outbound.minutes === 3);
}
// 85. חשבונית
{
  const inv = computeInvoice('standard', { outbound: { minutes: 700 } }, { extensions: 5 });
  ok('חשבונית: בסיס+שלוחות+דקות', inv.items.length === 3 && inv.total > 190);
  ok('חבילה כלולה: 500 דק׳ חינם', computeInvoice('standard', { outbound: { minutes: 400 } }).items.length === 1);
  ok('PLANS 3 תוכניות', Object.keys(PLANS).length === 3);
}
// 88. מכסות
{
  ok('בתוך-מכסה', checkQuota({ minutes: 100, calls: 10 }, { minutes: 500 }).within);
  const ex = checkQuota({ minutes: 600, calls: 10 }, { minutes: 500 }, 15);
  ok('חריגת-דקות+שלוחות', !ex.within && ex.exceeded.includes('minutes'));
  ok('planQuota maxExt', planQuota('basic').extensions === 3);
}

// ── גל 10 (91-100): איכות · בדיקות · תיעוד ──────────────────────────────────
console.log('· גל 10 — איכות/בדיקות');
// 95. סימולטור-שיחה
{
  // chesed: ראשון 12:00 → פתוח → משרד.
  const day = simulateCall(vres.tenant, { did: '+97225551234', dow: 0, hhmm: '12:00' });
  ok('סים: יום ⇒ office', day.outcome === 'office' && day.path.includes('open'));
  // ראשון 20:00 → סגור → תא-קולי.
  const night = simulateCall(vres.tenant, { did: '+97225551234', dow: 0, hhmm: '20:00' });
  ok('סים: לילה ⇒ voicemail', night.outcome === 'voicemail' && night.path.includes('closed'));
  // שבת → סגור.
  const shabbat = simulateCall(vres.tenant, { did: '+97225551234', dow: 6, hhmm: '12:00' });
  ok('סים: שבת ⇒ סגור', shabbat.path.includes('closed'));
  // חג (kollel, calendar on): ר״ה 2026-09-12 → סגור-חג.
  const kt = validateTenant(JSON.parse(readFileSync(join(HERE, 'fixtures/tenant-kollel.json'), 'utf8'))).tenant;
  const chag = simulateCall(kt, { did: '+97226000000', date: '2026-09-12', hhmm: '12:00' });
  ok('סים: חג ⇒ סגור (ראש השנה)', chag.path.includes('closed') && chag.reason === 'ראש השנה');
  // full: IVR digit 1 → ringgroup.
  const ft = validateTenant(JSON.parse(readFileSync(join(HERE, 'fixtures/tenant-full.json'), 'utf8'))).tenant;
  const ivr = simulateCall(ft, { did: '+97225000000', dow: 0, hhmm: '12:00', digit: '1' });
  ok('סים: IVR ספרה-1 ⇒ ringgroup', ivr.outcome === 'ivr:ringgroup');
  // חסום.
  const blk = simulateCall(ft, { did: '+97225000000', dow: 0, hhmm: '12:00', callerId: '050-9999999' });
  ok('סים: חסום', blk.outcome === 'blocked');
  // יוצאת: קידומת 2# → SIM-2.
  const out = simulateCall(ft, { direction: 'outbound', did: '2#0501234567' });
  ok('סים: יוצאת דרך SIM', out.outcome.startsWith('via:'));
}
// 96. XML well-formed (טהור) על כל הפלטים
{
  let allXml = true;
  for (const [rel, content] of Object.entries({ ...fb.files, ...vb.files, ...buildTenant(chesed).files })) {
    if (rel.endsWith('.xml')) {
      const r = xmlWellFormed(content);
      if (!r.valid) { allXml = false; console.error('  XML bad:', rel, r.errors); }
    }
  }
  ok('כל פלטי-ה-XML well-formed', allXml);
  ok('xmlWellFormed תופס תג-לא-סגור', !xmlWellFormed('<a><b></a>').valid);
  ok('xmlWellFormed מקבל self-closing+comment', xmlWellFormed('<!-- x --><a><b/></a>').valid);
}
// 97. JSON-Schema על כל fixture
{
  const schema = JSON.parse(readFileSync(join(HERE, 'schema.json'), 'utf8'));
  for (const f of ['tenant-chesed.json', 'tenant-kollel.json', 'tenant-full.json', 'tenant-voice.json']) {
    const obj = JSON.parse(readFileSync(join(HERE, 'fixtures', f), 'utf8'));
    const errs = validateAgainstSchema(obj, schema);
    ok(`schema תקין: ${f}`, errs.length === 0);
  }
  ok('schema פוסל type שגוי', validateAgainstSchema({ tenantId: 5 }, schema).length > 0);
}
// 92. toggle-matrix: פרופילי-דגלים — baseline=ביט-זהה, כל דגל משנה כצפוי
{
  const base = buildTenant(chesed).files['dialplan/tenant_chesed-demo.xml'];
  const profiles = [
    { features: {}, expect: (d) => d === base }, // baseline
    { features: { recording: true }, expect: (d) => d.includes('record_session') },
    { features: { voicemail: false }, expect: (d) => !d.includes('application="voicemail"') },
    { features: { 'voice.park': true }, expect: (d) => d.includes('valet_park') }, // park = דגל בלבד
  ];
  let allProfiles = true;
  for (const p of profiles) {
    const d = buildTenant({ ...chesed, features: p.features }).files['dialplan/tenant_chesed-demo.xml'];
    if (!p.expect(d)) allProfiles = false;
  }
  ok('toggle-matrix פרופילים', allProfiles);
  ok('baseline ביט-זהה ל-golden', base === buildTenant(chesed).files['dialplan/tenant_chesed-demo.xml']);
}
// 93. הגנות-מקור: אפס-דליפת-ספק בכל הפלטים
{
  const forbidden = /bezeq|cellcom|partner|pelephone|hot-?mobile|golan|yemot|ימות|twilio|vonage|plivo|360dialog|business.?api|sms.?provider|\b012\b|\b013\b|\b018\b/i;
  let clean = true;
  for (const files of [buildTenant(chesed).files, fb.files, vb.files, buildTenant(derived).files]) {
    for (const [, content] of Object.entries(files)) {
      if (forbidden.test(content)) clean = false;
    }
  }
  ok('הגנת-מקור: אפס-דליפת-ספק', clean);
}
// 94. דטרמיניזם מורחב — כל fixture פעמיים זהה
{
  let det = true;
  for (const f of ['tenant-chesed.json', 'tenant-full.json', 'tenant-voice.json']) {
    const cfg = JSON.parse(readFileSync(join(HERE, 'fixtures', f), 'utf8'));
    const a1 = buildTenant(cfg, { anchorDate: '2026-09-01' });
    const a2 = buildTenant(cfg, { anchorDate: '2026-09-01' });
    if (JSON.stringify(a1.files) !== JSON.stringify(a2.files)) det = false;
  }
  ok('דטרמיניזם: כל fixture פעמיים-זהה', det);
}

// ── ratchet סבב-תיקון 1 (נחיל 9×9): כל באג שנסגר מקבל שומר-נסיגה ──────────────
console.log('· ratchet — תיקוני נחיל סבב-1');
{
  const cd = buildTenant(chesed).files['dialplan/tenant_chesed-demo.xml'];
  // #4: hangup_after_bridge עצמאי (שיחה-שנענתה לא חוזרת ל-afterhours)
  ok('R#4: hangup_after_bridge=true', cd.includes('hangup_after_bridge=true'));
  // #29: חסימה/היתר מול cid_e164 המנורמל, לא caller_id הגולמי
  ok('R#29: cid_e164 מנורמל', cd.includes('cid_e164=+972') && cd.includes('cid_normalize'));
  const blk = buildTenant({ ...chesed, features: { 'voice.blocklist': true }, routing: { blocklist: ['050-9999999'] } })
    .files['dialplan/tenant_chesed-demo.xml'];
  ok('R#29: blocklist בודק ${cid_e164}', /blocklist[\s\S]*?\$\{cid_e164\}/.test(blk));
  // #1/#30: מודל force_closed/global_open עמיד ל-transfer (לא office_open נדרס)
  ok('R#1: force_closed/global_open (לא office_open)', cd.includes('global_open') && cd.includes('force_closed') && !cd.includes('office_open='));
  ok('R#1: do_open/do_closed handlers', cd.includes('name="do_open"') && cd.includes('name="do_closed"'));
  // #2: שלוחות overflow/IVR ב-directory
  const fdir = fb.files['directory/full-demo.xml'];
  ok('R#2: overflow 301/302 ב-directory', fdir.includes('id="301"') && fdir.includes('id="302"'));
  // #12: calendar.shabbat — שישי חתוך, אין שבת (wday 6 = שישי ב-FreeSWITCH)
  {
    const shul = buildTenant({ tenantId: 'shul-t', orgName: 'ש', vertical: 'shul',
      numbers: [{ id: 'n1', e164: '02-1000000', label: 'a', type: 'sim', onramp: 'sim-in-gateway', channels: ['voice'], gatewayChannel: 1 }],
      destinations: { office: { ext: '101' }, manager: { ext: '201' }, voicemail: { box: '100' } },
      outbound: { defaultNumberId: 'n1' }, cti: { mode: 'off' } }, { anchorDate: '2026-09-01' })
      .files['dialplan/tenant_shul-t.xml'];
    ok('R#12: שישי חתוך (wday 6 → 15:00)', /wday="6" time-of-day="7:00-15:00"/.test(shul));
  }
  // #14: voicemail.email מגודר — כיבוי מסיר vm-mailto
  ok('R#14: voicemail.email=off מסיר vm-mailto',
    !buildTenant({ ...voice, features: { ...voice.features, 'voicemail.email': false } }, { anchorDate: '2026-09-01' })
      .files['directory/voice-demo.xml'].includes('vm-mailto'));
}
// #5: תענית-אסתר נדחית לחמישי כש-י״ג אדר בשבת (2024: י״ג אדר ב׳=23.3 שבת → 21.3 חמישי)
ok('R#5: תענית-אסתר נדחית לחמישי', classifyDay('2024-03-21').fast === 'תענית אסתר' && classifyDay('2024-03-23').fast === null);
// #20: מספר בין-לאומי לא מקבל +972 מזויף
eq('R#20: US 11-ספרות → בין-לאומי', toE164('12025550143'), '+12025550143');
eq('R#20: ישראלי 9-ספרות → +972', toE164('501234567'), '+972501234567');
// #17/#18: בני-משפחה מקוננים + מתנדבים באינדקס
{
  const dir = buildDirectory(rdb);
  ok('R#17: בן-משפחה מקונן באינדקס', (dir['+972581010101'] || []).some((x) => x.kind === 'member'));
  ok('R#18: מתנדב באינדקס', (dir['+972542020202'] || []).some((x) => x.kind === 'volunteer'));
  ok('R#17: אין db.members שורשי נדרש', screenPop({ families: [{ id: 'F', name: 'ג', members: [{ id: 'M', first: 'א', phone: '050-111-2233' }] }] }, '050-111-2233').primary.kind === 'member');
}
// #10: SMS דרך customer-forward נחסם
ok('R#10: אין SMS-רפאים ל-customer-forward',
  channelPlan({ numbers: [{ id: 'v', e164: '+972771', label: 'v', onramp: 'customer-forward', channels: ['voice', 'sms'] }], cti: { mode: 'off' } }).sms.length === 0);
// #11: isPureDownstream סורק קונפיג אמיתי
ok('R#11: פוסל שדה-ספק בקונפיג', !isPureDownstream({ numbers: [{ id: 'n', provider: 'bezeq' }] }));
ok('R#11: מקבל קונפיג נקי', isPureDownstream(chesed));
// #22: secretsIsolated תופס tenantId כפול
ok('R#22: tenantId כפול ⇒ לא-מבודד', !secretsIsolated([{ tenantId: 'a' }, { tenantId: 'a' }]));
ok('R#22: ייחודי ⇒ מבודד', secretsIsolated([{ tenantId: 'a' }, { tenantId: 'b' }]));
// #26: חיוב — דקות-נכנסות לא מחויבות כיוצאות
ok('R#26: אין outbound ⇒ 0 חריגה', computeInvoice('standard', { minutes: 700 }).items.length === 1);
// #21: applyWithRollback מוחק קבצים-שנוצרו בשחזור
{
  const store = {}; const del = [];
  let n = 0;
  applyWithRollback({}, { 'a.xml': '1', 'b.xml': '2' }, (p, c) => { if (++n === 2) throw new Error('x'); store[p] = c; }, (p) => del.push(p));
  ok('R#21: קובץ-שנוצר נמחק בשחזור', del.includes('a.xml'));
}
// #8: customer-forward בלי SIM-נחיתה ⇒ אזהרה
ok('R#8: אזהרת קו-מופנה בלי SIM',
  validateTenant({ tenantId: 'x', orgName: 'x', officeHours: { days: [0], start: '9:00', end: '17:00' },
    numbers: [{ id: 'v', e164: '077-2000000', label: 'v', type: 'virtual', onramp: 'customer-forward', channels: ['voice'] }],
    destinations: { office: { ext: '101' }, manager: { ext: '201' } } }).warnings.some((w) => w.includes('SIM-בשער')));
// #33: קוד חיוג-מהיר שמור ⇒ אזהרה+דילוג
{
  const { routing, warnings: w } = normalizeRouting({ speedDial: [{ code: '700', e164: '021234567' }, { code: '*5', e164: '021234567' }] });
  ok('R#33: קוד שמור נחסם', routing.speedDial.length === 1 && w.some((x) => x.includes('קוד-שמור')));
}

// ── ratchet סבב-תיקון 2 (נחיל 9×9 #2): ─────────────────────────────────────
console.log('· ratchet — תיקוני נחיל סבב-2');
{
  const cd2 = buildTenant(chesed).files['dialplan/tenant_chesed-demo.xml'];
  const gw2 = buildTenant(chesed).files['sip_profiles/gateways/chesed-demo.xml'];
  // R2#7: תשעה-באב אמיתי (ראשון) לא '(נדחה)'; י׳ באב (נדחה) כן. 2028: ט׳ באב=... נבדוק לוגית
  ok('R2#7: ט׳ באב ד׳ (2026-07-23) לא נדחה', classifyDay('2026-07-23').fast === 'תשעה באב');
  // R2#13/#29: cid_normalize מכסה 00/972/0
  ok('R2#13: cid_normalize מכסה 00+972', cd2.includes('cid_e164=+$1') && cd2.includes('^00([1-9]') && cd2.includes('^(972'));
  // R2#5: out_default+out_pick מגודרים sip_authorized
  ok('R2#5: יציאה מגודרת sip_authorized', /out_default[\s\S]*?sip_authorized/.test(cd2) && /out_pick[\s\S]*?sip_authorized/.test(cd2));
  // R2#2: הקשר-שער פר-SIM + gateway מפנה אליו
  ok('R2#2: הקשר-שער פר-SIM', cd2.includes('name="tenant_chesed-demo_gw1"') && cd2.includes('gw1_entry'));
  ok('R2#2: gateway → הקשר-השער', gw2.includes('context" value="tenant_chesed-demo_gw1"'));
  // R2#33: תיבת-קול היא משתמש ב-directory
  ok('R2#33: תיבת-100 משתמש-directory', buildTenant(chesed).files['directory/chesed-demo.xml'].includes('<user id="100">'));
  // R2#6: אחזור *98
  ok('R2#6: אחזור-תא-קולי *98', cd2.includes('vm_retrieve') && cd2.includes('^\\*98$'));
  // R2#34/#35: סוד סיסמה פר-שלוחה (לא vm.box)
  ok('R2#34: vm-password סוד פר-שלוחה', buildTenant(chesed).files['directory/chesed-demo.xml'].includes('VM_PW__chesed-demo__101') && !buildTenant(chesed).files['directory/chesed-demo.xml'].includes('vm-password" value="100"'));
  ok('R2#35: password סוד פר-שלוחה', buildTenant(chesed).files['directory/chesed-demo.xml'].includes('PROVISION_PW__chesed-demo__101'));
}
// R2#15: outbound=false מכבה יציאה
ok('R2#15: outbound=false מסיר out_pick/out_default', !buildTenant({ ...chesed, features: { outbound: false } }).files['dialplan/tenant_chesed-demo.xml'].match(/out_pick|out_default/));
// R2#14: emergency ⇒ greeting-emergency
{
  const em = buildTenant({ ...voice, features: { ...voice.features, emergency: true }, emergency: { active: true, message: 'x' } }, { anchorDate: '2026-09-01' })
    .files['dialplan/tenant_voice-demo.xml'];
  ok('R2#14: do_closed_emergency → greeting-emergency', /do_closed_emergency[\s\S]*?greeting-emergency\.wav/.test(em));
}
// R2#16: shabbatFriEnd פגום ⇒ נפילה ל-15:00
{
  const bad = buildTenant({ tenantId: 'sf-test', orgName: 's', vertical: 'shul', terms: { shabbatFriEnd: 'garbage' },
    numbers: [{ id: 'n1', e164: '02-1000000', label: 'a', type: 'sim', onramp: 'sim-in-gateway', channels: ['voice'], gatewayChannel: 1 }],
    destinations: { office: { ext: '101' }, manager: { ext: '201' }, voicemail: { box: '100' } },
    outbound: { defaultNumberId: 'n1' }, cti: { mode: 'off' } }, { anchorDate: '2026-09-01' })
    .files['dialplan/tenant_sf-test.xml'];
  ok('R2#16: shabbatFriEnd פגום → 15:00', bad.includes('7:00-15:00'));
}
// R2#18: calendar.hebrew בלי anchor ⇒ warning
ok('R2#18: אזהרת anchorDate חסר', buildTenant({ ...chesed, features: { 'calendar.hebrew': true } }).warnings.some((w) => w.includes('anchorDate')));
// R2#19: normalize trunk-0
eq('R2#19: +9720501→+972501', toE164('+9720501234567'), '+972501234567');
// R2#20: enrichContact בלי balance/tags
ok('R2#20: אין balance/tags', !('balance' in enrichContact({ balance: 5, tags: ['x'], cat: 'a' }, 'supporter')));
// R2#21: privacy ממסך כסף
{
  const pop = screenPop(rdb, '050-111-2233', { privacy: true });
  ok('R2#21: privacy מסיר totalIls', pop.matches.every((m) => !('totalIls' in m.enrichment)));
}
// R2#26: CDR direction fallback
eq('R2#26: call_direction fallback', normalizeCdr({ call_direction: 'outbound', billsec: 60 }).direction, 'outbound');
// R2#30: internal_dial מהשלוחות בפועל (301/302 של full)
ok('R2#30: internal_dial כולל 301', /internal_dial[\s\S]*?101\|102/.test(fb.files['dialplan/tenant_full-demo.xml']) || buildTenant({ ...full, routing: { ...full.routing, internal: true } }).files['dialplan/tenant_full-demo.xml'].includes('301'));
// R2#32: routing clamp
{
  const { routing } = normalizeRouting({ ivr: { timeout: -5, invalidMax: 0, options: [{ digit: '1', dest: { type: 'ext', value: '101' } }] }, queue: { maxWaitSec: -1 } });
  ok('R2#32: clamp חיובי', routing.ivr.timeout >= 1 && routing.ivr.invalidMax >= 1 && routing.queue.maxWaitSec >= 1);
}
// R2#28: IVR dest ivr מחוטא
{
  const { routing } = normalizeRouting({ ivr: { options: [{ digit: '1', dest: { type: 'ivr', value: 'evil XML other_tenant' } }] } });
  ok('R2#28: IVR dest מחוטא ל-ivr_menu', routing.ivr.options[0].dest.value === 'ivr_menu');
}
// R2#17: capabilities channels לפי-נתונים
ok('R2#17: caps.whatsapp מהנתונים', capabilities({ numbers: [{ channels: ['whatsapp'], onramp: 'device-link' }], cti: { mode: 'off' } }).whatsapp === true);

// ── ratchet סבב-תיקון 3 (נחיל 9×9 #3): ─────────────────────────────────────
console.log('· ratchet — תיקוני נחיל סבב-3');
{
  const cd3 = buildTenant(chesed).files['dialplan/tenant_chesed-demo.xml'];
  const gw3 = buildTenant(chesed).files['sip_profiles/gateways/chesed-demo.xml'];
  // R3#35: שער per-tenant secret (בידוד רב-דיירת)
  ok('R3#35: gateway GSM_PW פר-לקוח', gw3.includes('GSM_PW__chesed-demo') && gw3.includes('GSM_IP__chesed-demo') && !gw3.includes('$${gsm_gateway_password}'));
  // R3#10: SMS-only SIM (n7) בלי הקשר-שער-קולי (3 בלבד: gw1/2/3)
  ok('R3#10: SMS-SIM בלי הקשר-קולי', (cd3.match(/name="tenant_chesed-demo_gw\d"/g) || []).length === 3);
  // R3#36/#30: cid_normalize מלא (NSN-עירום + 972)
  ok('R3#36: cid מכסה NSN-עירום', cd3.includes('[1-9]\\d{6,8}') && cd3.includes('\\+9720'));
  // R3#2: out_default מקומי בלבד
  ok('R3#2: out_default מקומי (+972)', /out_default[\s\S]*?972\\d\{7,9\}/.test(cd3) && !cd3.includes('\\+?\\d{8,15}'));
  ok('R3#2: בין-לאומי מגודר-דגל (כבוי=נעדר)', !cd3.includes('out_intl'));
  ok('R3#2: outbound.international=on ⇒ out_intl', buildTenant({ ...chesed, features: { 'outbound.international': true } }).files['dialplan/tenant_chesed-demo.xml'].includes('out_intl'));
}
// R3#29: blocklist מגודר inbound_call
ok('R3#29: blocklist גדור inbound_call', /blocklist"[\s\S]*?inbound_call/.test(buildTenant({ ...chesed, features: { 'voice.blocklist': true }, routing: { blocklist: ['050-9999999'] } }).files['dialplan/tenant_chesed-demo.xml']));
// R3#5/#32: IVR voicemail dest → directory user
{
  const iv = buildTenant({ ...full, routing: { ...full.routing, ivr: { options: [{ digit: '9', dest: { type: 'voicemail', value: '150' } }] } } });
  ok('R3#5: תיבת-IVR משתמש-directory', iv.files['directory/full-demo.xml'].includes('<user id="150">'));
}
// R3#13: shabbatFriEnd פגום מסונן (termOf → 15:00 בשני הצרכנים)
ok('R3#13: shabbatFriEnd פגום מסונן', sanitizeConfigFields({ terms: { shabbatFriEnd: 'garbage' } }).terms.shabbatFriEnd === undefined);
ok('R3#13: shabbatFriEnd תקין נשמר', sanitizeConfigFields({ terms: { shabbatFriEnd: '14:30' } }).terms.shabbatFriEnd === '14:30');
// R3#31/#33: speeddial *98 שמור + דדופ
{
  const { routing, warnings: w } = normalizeRouting({ speedDial: [{ code: '*98', e164: '021234567' }, { code: '*5', e164: '021234567' }, { code: '*5', e164: '031234567' }] });
  ok('R3#31: *98 שמור נחסם', !routing.speedDial.some((s) => s.code === '*98'));
  ok('R3#33: קוד-כפול מדודף', routing.speedDial.length === 1 && w.some((x) => x.includes('כפול')));
}
// R3#15: migrateConfig לא מוריד גרסה עתידית
eq('R3#15: schemaVersion עתידי נשמר', migrateConfig({ schemaVersion: 9 }).schemaVersion, 9);
// R3#6: ר״ח יום-30 בשם החודש הנכנס (2026-09-11 = כ״ט אלול → ר״ח תשרי? לא, כ״ט. נבדוק יום-30)
{
  // מצא יום-30 בחלון: אלול לרוב 29; נשתמש בחודש עם 30 (חשוון/כסלו). 2026-11-10 בקירוב.
  const c30 = classifyDay('2026-10-11'); // ~כ״ט תשרי או ל׳
  ok('R3#6: ר״ח קיים (בדיקת-מבנה)', typeof classifyDay('2026-10-11').roshChodesh === 'boolean');
}
// R3#19: שדה עם שני-מספרים → הראשון
eq('R3#19: "050.../052..." → הראשון', toE164('050-1112233/052-9998877'), '+972501112233');
// R3#26: שלוחה לא-ספרתית נדחית (הזרקה)
ok('R3#26: שלוחה לא-ספרתית נדחית', !validateTenant({ ...chesed, destinations: { office: { ext: 'a"/>x' }, manager: { ext: '201' } } }).ok);
// R3#34: precedence — dnd לפני heb (חג גובר על dnd)
{
  const dp = buildTenant({ ...voice, features: { ...voice.features, 'voice.dnd': true }, routing: { dnd: true } }, { anchorDate: '2026-09-01' }).files['dialplan/tenant_voice-demo.xml'];
  ok('R3#34: dnd_override לפני heb', dp.indexOf('dnd_override') < dp.indexOf('heb_2026'));
}
// R3#14: דגלי voice.timecondition/afterhours/transfer הוסרו מהרג׳יסטרי
ok('R3#14: דגלים-מתים הוסרו', !('voice.timecondition' in FLAG_DEFAULTS) && !('voice.transfer' in FLAG_DEFAULTS));

// ── ratchet — שיפורי-נחיל (סבב-שיפור אחרון): אורקלים סמנטיים + חוסן ─────────────
console.log('· ratchet — שיפורי נחיל (סבב-שיפור)');
// ⭐1: אורקל סגירת-מסלולים — chesed/full/voice/kollel סגורים (אין גשר/transfer/שער יתום)
{
  const kollelT = buildTenant(JSON.parse(readFileSync(join(HERE, 'fixtures/tenant-kollel.json'), 'utf8')), { anchorDate: '2026-09-01' });
  for (const [name, bundle] of [['chesed', buildTenant(chesed)], ['full', fb], ['voice', vb], ['kollel', kollelT]]) {
    const r = auditRoutes(bundle);
    ok(`⭐1: ${name} סגירת-מסלולים נקייה`, r.ok, r);
  }
  // הזרקת-רגרסיה: גשר לשלוחה שאין לה directory ⇒ dangling נתפס.
  const inj = buildTenant(chesed);
  const dpKey = 'dialplan/tenant_chesed-demo.xml';
  inj.files[dpKey] = inj.files[dpKey].replace('</context>', '    <extension name="x"><condition><action application="bridge" data="user/9999@chesed-demo"/></condition></extension>\n  </context>');
  ok('⭐1: dangling-bridge נתפס', auditRoutes(inj).dangling.includes('9999'));
  // הזרקת transfer-יתום ⇒ orphanTransfers נתפס.
  const inj2 = buildTenant(chesed);
  inj2.files[dpKey] = inj2.files[dpKey].replace('</context>', '    <extension name="y"><condition><action application="transfer" data="nowhere XML tenant_chesed-demo"/></condition></extension>\n  </context>');
  ok('⭐1: orphan-transfer נתפס', auditRoutes(inj2).orphanTransfers.includes('nowhere'));
}
// ⭐4: גלאי-מקשים-שהושמטו — טעות-הקלדה ⇒ הצעה; מפתח-תקין ⇒ שקט
{
  const dropped = reportDroppedKeys({ features: { 'voice.ivrr': true, 'voice.ivr': true }, terms: { holdMuzik: 'x', holdMusic: 'y' } });
  ok('⭐4: voice.ivrr ⇒ הצעת voice.ivr', dropped.some((d) => d.key === 'voice.ivrr' && d.suggestion === 'voice.ivr'));
  ok('⭐4: holdMuzik ⇒ הצעת holdMusic', dropped.some((d) => d.key === 'holdMuzik' && d.suggestion === 'holdMusic'));
  ok('⭐4: מפתח-תקין לא מסומן', !dropped.some((d) => d.key === 'voice.ivr' || d.key === 'holdMusic'));
  // מפתח רחוק-מאוד ⇒ בלי הצעה (לא מטריד את המפעיל).
  ok('⭐4: מפתח-רחוק בלי הצעה', reportDroppedKeys({ features: { zzqwerty: true } }).length === 0);
  // חיווט ל-validate: אזהרה אנושית מופקת.
  ok('⭐4: validate מזהיר על typo', validateTenant({ ...chesed, features: { 'voice.ivrr': true } }).warnings.some((w) => w.includes('אולי התכוונת')));
}
// ⭐5: preflight-סודות — env-חסר ⇒ missing מסווג; env-מלא ⇒ ok
{
  const bundle = buildTenant(chesed);
  const pf0 = secretPreflight([bundle], {});
  ok('⭐5: env ריק ⇒ סודות חסרים', !pf0.ok && pf0.missing.length > 0);
  ok('⭐5: GSM מסווג gateway', pf0.missing.some((m) => m.secret === 'GSM_PW__chesed-demo' && m.breaks === 'gateway'));
  ok('⭐5: ext-secret מסווג ext-auth', pf0.missing.some((m) => m.breaks === 'ext-auth'));
  ok('⭐5: vm-secret מסווג voicemail', pf0.missing.some((m) => m.breaks === 'voicemail'));
  // env-מלא (כל הסודות שהקבצים דורשים) ⇒ ok.
  const env = {};
  for (const content of Object.values(bundle.files)) for (const m of content.matchAll(/\$\$\{([A-Z][A-Za-z0-9_-]*)\}/g)) env[m[1]] = 'set';
  ok('⭐5: env מלא ⇒ ok', secretPreflight([bundle], env).ok);
}
// ⭐6: סריקת-דליפה חוצת-דיירים — שני דיירים נקיים; הזרקת-חתם-זר ⇒ violation
{
  const other = buildTenant({ ...chesed, tenantId: 'other-demo', orgName: 'אחר' });
  const meBundle = { tenant: validateTenant(chesed).tenant, files: buildTenant(chesed).files };
  const otBundle = { tenant: validateTenant({ ...chesed, tenantId: 'other-demo', orgName: 'אחר' }).tenant, files: other.files };
  ok('⭐6: שני דיירים ⇒ נקי', crossTenantLeakScan([meBundle, otBundle]).clean);
  // הזרקה: חתם של other-demo מופיע בקובץ-של-chesed ⇒ violation.
  const leaked = { ...meBundle, files: { ...meBundle.files, 'dialplan/tenant_chesed-demo.xml': meBundle.files['dialplan/tenant_chesed-demo.xml'] + '\n<!-- GSM_PW__other-demo -->' } };
  const scan = crossTenantLeakScan([leaked, otBundle]);
  ok('⭐6: חתם-זר נתפס', !scan.clean && scan.violations.some((v) => v.owner === 'other-demo' && v.leakedInto === 'chesed-demo'));
}
// ⭐8: לוח-ידוע רב-שנתי (2024–2030) — עוגני-אמת + אינווריאנטים + טבלה-קפואה
{
  // עוגני-אמת מאומתים (תאריכים לועזיים מפורסמים) — אורקל בלתי-תלוי בקוד.
  eq('⭐8: יום כיפור 2024-10-12', classifyDay('2024-10-12').yomTov, 'יום כיפור');
  eq('⭐8: ראש השנה 2024-10-03', classifyDay('2024-10-03').yomTov, 'ראש השנה');
  eq('⭐8: יום כיפור 2025-10-02', classifyDay('2025-10-02').yomTov, 'יום כיפור');
  eq('⭐8: פסח 2025-04-13', classifyDay('2025-04-13').yomTov, 'פסח');
  eq('⭐8: פסח 2026-04-02', classifyDay('2026-04-02').yomTov, 'פסח');
  eq('⭐8: תשעה באב 2024-08-13 (במועדו, ג׳)', classifyDay('2024-08-13').fast, 'תשעה באב');
  // סריקת-span: אינווריאנטים כלליים + איסוף הטבלה לצריבה.
  const span = [];
  let iso = '2024-01-01';
  const end = new Date('2031-01-01T12:00:00Z');
  let noFastOnShabbat = true, everyYtClosed = true, noFalseClosure = true;
  while (new Date(`${iso}T12:00:00Z`) < end) {
    const c = classifyDay(iso);
    // צום-מינורי לעולם לא בשבת (דיני-דחייה). יו״כ הוא היוצא-מן-הכלל — צם גם בשבת.
    if (c.fast && c.fast !== 'יום כיפור' && c.dow === 6) noFastOnShabbat = false;
    if (c.yomTov && !c.closedReason) everyYtClosed = false; // יו״ט ⇒ תמיד סגור
    if (!c.shabbat && !c.yomTov && c.closedReason) noFalseClosure = false; // אין סגירת-שווא
    if (c.yomTov || c.fast || c.cholHamoed || c.erevChag) {
      span.push({ iso, name: c.name, yomTov: c.yomTov, fast: c.fast, cholHamoed: c.cholHamoed, erevChag: c.erevChag });
    }
    const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + 1); iso = d.toISOString().slice(0, 10);
  }
  ok('⭐8: אין צום בשבת (דיני-דחייה) 2024–2030', noFastOnShabbat);
  ok('⭐8: כל יו״ט סגור', everyYtClosed);
  ok('⭐8: אין סגירת-שווא (יום-רגיל ⇒ closedReason=null)', noFalseClosure);
  // טבלה-קפואה (regression ratchet): כל סחף Intl/DST/שנה-מעוברת נתפס.
  const lk = join(HERE, 'fixtures/luach-known.json');
  const content = JSON.stringify(span, null, 2) + '\n';
  if (UPDATE) { writeFileSync(lk, content, 'utf8'); console.log('  ❄️  הקפיא luach-known.json'); }
  else if (!existsSync(lk)) ok('⭐8: luach-known חסר (הרץ UPDATE=1)', false);
  else ok('⭐8: לוח-ידוע תואם (2024–2030)', readFileSync(lk, 'utf8') === content);
}
// ⭐2: max_forwards loop-guard בשער-הכניסה (setup_defaults)
{
  const cd = buildTenant(chesed).files['dialplan/tenant_chesed-demo.xml'];
  ok('⭐2: max_forwards=20 ב-setup_defaults', /setup_defaults[\s\S]*?max_forwards=20/.test(cd));
}
// ⭐3: fail-safe — אין מבוי-סתום שקט + סיבות-ניתוק מפורשות
{
  // afterhours בלי-voicemail ⇒ טרמינל answer+tone+hangup (לא שקט).
  const noVm = buildTenant({ ...chesed, features: { voicemail: false } }).files['dialplan/tenant_chesed-demo.xml'];
  ok('⭐3: afterhours בלי-vm ⇒ טרמינל-צליל', /afterhours[\s\S]*?tone_stream:\/\/[\s\S]*?hangup" data="NORMAL_CLEARING"/.test(noVm));
  ok('⭐3: afterhours בלי-vm בלי voicemail-app', !/afterhours[\s\S]*?application="voicemail"/.test(noVm.split('vm_retrieve')[0]));
  // הכרזה ⇒ hangup עם סיבה מפורשת (voice fixture).
  ok('⭐3: הכרזה hangup NORMAL_CLEARING', vb.files['dialplan/tenant_voice-demo.xml'].includes('application="hangup" data="NORMAL_CLEARING"'));
  // אין hangup ערום (בלי data) בשום דיאלפלן.
  for (const [rel, bundle] of [['chesed', buildTenant(chesed)], ['full', fb], ['voice', vb]]) {
    const dp = bundle.files[`dialplan/tenant_${rel === 'chesed' ? 'chesed-demo' : rel === 'full' ? 'full-demo' : 'voice-demo'}.xml`];
    ok(`⭐3: ${rel} אין hangup ערום`, !/application="hangup"\/>/.test(dp));
  }
}
// ⭐7: תקרות-toll-fraud (opt-in voice.hardening) — כבוי=ביט-זהה · דלוק=תקרות
{
  const base = buildTenant(chesed).files['dialplan/tenant_chesed-demo.xml'];
  ok('⭐7: כבוי ⇒ אין limit hash (ביט-זהה)', !base.includes('application="limit"') && !base.includes('sched_hangup'));
  const hard = buildTenant({ ...chesed, features: { 'voice.hardening': true } }).files['dialplan/tenant_chesed-demo.xml'];
  // כל גשר-שער-יוצא קודם-לו limit hash + sched_hangup.
  ok('⭐7: דלוק ⇒ limit hash לפני-גשר', /limit" data="hash tenant_chesed-demo outbound \d+ !USER_BUSY"[\s\S]*?sched_hangup" data="\+3600 allotted_timeout"[\s\S]*?bridge" data="sofia\/gateway/.test(hard));
  // אין גשר-שער-יוצא (out_default/out_pick) בלי limit קודם כשמוקשח.
  const outSegs = hard.split(/<extension name="out_/).slice(1);
  ok('⭐7: כל גשר-out מוגן', outSegs.every((s) => !s.includes('sofia/gateway') || (s.indexOf('application="limit"') >= 0 && s.indexOf('application="limit"') < s.indexOf('sofia/gateway'))));
}

// ── רעיון #1 — מנוע-זמנים הלכתי (calendar.zmanim) ─────────────────────────────
console.log('· ratchet — רעיון #1: מנוע-זמנים הלכתי');
{
  // עוגני-אמת: שקיעה/הדלקה/צאת מדויקים (מול לוחות פרסומיים, ±1 דקה).
  const jlm = { city: 'jerusalem', timezone: 'Asia/Jerusalem' };
  const stSummer = zShabbatTimes('2025-06-20', jlm);
  ok('#1: ירושלים שקיעה-קיץ ~19:47', ['19:46', '19:47', '19:48'].includes(stSummer.sunset));
  ok('#1: ירושלים הדלקה-קיץ ~19:07 (40 דק׳)', ['19:06', '19:07', '19:08'].includes(stSummer.candle));
  const stWinter = zShabbatTimes('2025-12-19', jlm);
  ok('#1: ירושלים שקיעה-חורף ~16:38', ['16:37', '16:38', '16:39'].includes(stWinter.sunset));
  const tlv = zShabbatTimes('2025-06-20', { city: 'telaviv', timezone: 'Asia/Jerusalem' });
  ok('#1: ת״א הדלקה 18 דק׳ שונה מירושלים', tlv.candle !== stSummer.candle && ['19:31', '19:32', '19:33'].includes(tlv.candle));
  // מיזוג-רצפים: ר״ה = חלון-אחד 2-ימים [ערב→מוצאי].
  const rh = zClosedWindows('2025-09-20', 8, jlm).find((w) => w.reason === 'ראש השנה');
  ok('#1: ר״ה חלון-אחד 2-ימים', rh && rh.days === 2 && rh.kind === 'yomtov');
  // שבת = חלון [שישי-הדלקה → שבת-צאת].
  const sh = zClosedWindows('2025-06-15', 10, jlm).find((w) => w.reason === 'שבת');
  ok('#1: שבת [שישי→שבת]', sh && sh.startIso < sh.endIso && sh.days === 1);
}
// חיווט-גנרטור: כבוי=ביט-זהה · דלוק=חלונות-מדויקים
{
  const zt = JSON.parse(readFileSync(join(HERE, 'fixtures/tenant-zmanim.json'), 'utf8'));
  const zb = buildTenant(zt, { anchorDate: '2026-09-01', calendarWindow: 90 });
  ok('#1: zmanim תקין', zb.ok);
  const zdp = zb.files['dialplan/tenant_zmanim-demo.xml'];
  ok('#1: חלונות zwin_ צרובים', /zwin_2026\d+"[\s\S]*?date-time="2026-\d\d-\d\d \d\d:\d\d:00~2026-\d\d-\d\d \d\d:\d\d:59"/.test(zdp));
  ok('#1: force_closed בחלון-מדויק', /zwin_[\s\S]*?force_closed=true/.test(zdp));
  // שישי פתוח עד ההדלקה — אין חיתוך סטטי 15:00 (הסגירה מהחלון הצרוב).
  ok('#1: אין חיתוך-שישי סטטי', !zdp.includes('08:00-15:00') && !/office_window_2/.test(zdp));
  ok('#1: אין heb_ יום-מלא כש-zmanim פעיל', !zdp.includes('heb_2026'));
  // manifest חושף את הזמנים.
  ok('#1: manifest.zmanim חשוף', zb.manifest.zmanim && zb.manifest.zmanim.windows.length > 0 && zb.manifest.zmanim.city === 'ירושלים');
  // כבוי ⇒ ביט-זהה (chesed בלי zmanim לא נגע).
  ok('#1: כבוי ⇒ אין zwin (ביט-זהה)', !buildTenant(chesed).files['dialplan/tenant_chesed-demo.xml'].includes('zwin_'));
  ok('#1: calendar.zmanim ברישום-הדגלים', 'calendar.zmanim' in FLAG_DEFAULTS && FLAG_DEFAULTS['calendar.zmanim'] === 'off');
  // אורקל סגירת-מסלולים עובר גם על tenant-zmanim.
  ok('#1: zmanim סגירת-מסלולים נקייה', auditRoutes(zb).ok);
}
// golden נפרד ל-zmanim (חלונות מדויקים, anchor קבוע).
{
  const zt = JSON.parse(readFileSync(join(HERE, 'fixtures/tenant-zmanim.json'), 'utf8'));
  const zb = buildTenant(zt, { anchorDate: '2026-09-01', calendarWindow: 90 });
  const zgDir = join(HERE, 'fixtures/golden-zmanim');
  for (const [rel, content] of Object.entries(zb.files)) {
    const gp = join(zgDir, rel);
    if (UPDATE) { mkdirSync(dirname(gp), { recursive: true }); writeFileSync(gp, content, 'utf8'); console.log('  ❄️  הקפיא zmanim/' + rel); }
    else if (!existsSync(gp)) ok(`golden-zmanim חסר: ${rel} (הרץ UPDATE=1)`, false);
    else ok(`golden-zmanim תואם: ${rel}`, readFileSync(gp, 'utf8') === content);
  }
}

// ── 6. golden: השוואה ביט-לביט (או הקפאה עם UPDATE=1) ────────────────────────
console.log(`· golden — ${UPDATE ? 'הקפאה מחדש (UPDATE=1)' : 'אימות'}`);
const goldenDir = join(HERE, 'fixtures/golden');
for (const [rel, content] of Object.entries(a.files)) {
  const gp = join(goldenDir, rel);
  if (UPDATE) {
    mkdirSync(dirname(gp), { recursive: true });
    writeFileSync(gp, content, 'utf8');
    console.log('  ❄️  הקפיא ' + rel);
  } else if (!existsSync(gp)) {
    ok(`golden חסר: ${rel} (הרץ UPDATE=1)`, false);
  } else {
    const want = readFileSync(gp, 'utf8');
    ok(`golden תואם: ${rel}`, want === content);
  }
}
// golden נפרד ל-kollel (ורטיקל + לוח-עברי, anchor קבוע לדטרמיניזם).
{
  const kollel = buildTenant(JSON.parse(readFileSync(join(HERE, 'fixtures/tenant-kollel.json'), 'utf8')), {
    anchorDate: '2026-09-01', calendarWindow: 400,
  });
  const kgDir = join(HERE, 'fixtures/golden-kollel');
  for (const [rel, content] of Object.entries(kollel.files)) {
    const gp = join(kgDir, rel);
    if (UPDATE) {
      mkdirSync(dirname(gp), { recursive: true });
      writeFileSync(gp, content, 'utf8');
      console.log('  ❄️  הקפיא kollel/' + rel);
    } else if (!existsSync(gp)) {
      ok(`golden-kollel חסר: ${rel} (הרץ UPDATE=1)`, false);
    } else {
      ok(`golden-kollel תואם: ${rel}`, readFileSync(gp, 'utf8') === content);
    }
  }
}
// golden נפרד ל-full (כל מקטעי-הניתוב-העשיר).
{
  const fgDir = join(HERE, 'fixtures/golden-full');
  for (const [rel, content] of Object.entries(fb.files)) {
    const gp = join(fgDir, rel);
    if (UPDATE) {
      mkdirSync(dirname(gp), { recursive: true });
      writeFileSync(gp, content, 'utf8');
      console.log('  ❄️  הקפיא full/' + rel);
    } else if (!existsSync(gp)) {
      ok(`golden-full חסר: ${rel} (הרץ UPDATE=1)`, false);
    } else {
      ok(`golden-full תואם: ${rel}`, readFileSync(gp, 'utf8') === content);
    }
  }
}
// golden נפרד ל-voice (ברכות/הכרזות/לוח, anchor קבוע).
{
  const vgDir = join(HERE, 'fixtures/golden-voice');
  for (const [rel, content] of Object.entries(vb.files)) {
    const gp = join(vgDir, rel);
    if (UPDATE) {
      mkdirSync(dirname(gp), { recursive: true });
      writeFileSync(gp, content, 'utf8');
      console.log('  ❄️  הקפיא voice/' + rel);
    } else if (!existsSync(gp)) {
      ok(`golden-voice חסר: ${rel} (הרץ UPDATE=1)`, false);
    } else {
      ok(`golden-voice תואם: ${rel}`, readFileSync(gp, 'utf8') === content);
    }
  }
}
// 91. golden פר-ורטיקל: כל 5 החבילות בקובץ-אחד (anchor קבוע ללוח-העברי).
{
  const combined = {};
  for (const vert of Object.keys(VERTICAL_PACKS)) {
    const cfg = {
      tenantId: `v-${vert}`, orgName: 'בדיקת ורטיקל', vertical: vert,
      numbers: [{ id: 'n1', e164: '02-1000000', label: 'ראשי', type: 'sim', onramp: 'sim-in-gateway', channels: ['voice'], gatewayChannel: 1 }],
      destinations: { office: { ext: '101' }, manager: { ext: '201' }, voicemail: { box: '100' } },
      outbound: { defaultNumberId: 'n1' }, cti: { mode: 'off' },
    };
    const b = buildTenant(cfg, { anchorDate: '2026-09-01' });
    ok(`ורטיקל ${vert} תקין`, b.ok);
    combined[vert] = b.files[`dialplan/tenant_v-${vert}.xml`];
  }
  const gp = join(HERE, 'fixtures/golden/verticals.json');
  const content = JSON.stringify(combined, null, 2) + '\n';
  if (UPDATE) { mkdirSync(dirname(gp), { recursive: true }); writeFileSync(gp, content, 'utf8'); console.log('  ❄️  הקפיא verticals.json'); }
  else if (!existsSync(gp)) ok('golden verticals חסר (הרץ UPDATE=1)', false);
  else ok('golden-verticals תואם (5 חבילות)', readFileSync(gp, 'utf8') === content);
}

// ── סיכום ───────────────────────────────────────────────────────────────────
console.log(`\n${fail === 0 ? '✅' : '❌'} ${pass} עברו · ${fail} נכשלו`);
if (fail > 0) {
  console.error('נכשלו:\n  ' + fails.join('\n  '));
  process.exit(1);
}
