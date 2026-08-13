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
  detailedDiff, changelogEntry, planApplyRespectingFreeze, batchSummary,
} from './lib/apply.mjs';
import { channelPlan, isPureDownstream } from './lib/channels.mjs';
import {
  flagOn, featureOn, termOf, expandTerms, applyVertical, VERTICAL_PACKS,
  capabilities, migrateConfig, effectiveConfig, diffConfig, isBaselineConfig,
  sanitizeConfigFields, SCHEMA_VERSION,
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
ok('closed_greeting hop', vdp.includes('closed_greeting'));
ok('greeting-holiday מותנה closed_reason', /closed_greeting[\s\S]*?greeting-holiday\.wav[\s\S]*?anti-action[\s\S]*?greeting-closed\.wav/.test(vdp));
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
  families: [{ id: 'F1', name: 'משפחת כהן', phone: '050-111-2233', phone2: '02-6543210', city: 'ירושלים', extraPhones: ['058-1010101'] }],
  supporters: [{ id: 'S1', name: 'דוד תורם', phone: '050-111-2233', cat: 'זהב', city: 'בני ברק', last: '2026-07-01', ils: 5000 }],
  members: [], teachers: [],
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
// 47. הצלבה מרובת-שדות (extraPhones)
{
  const pop = screenPop(rdb, '058-1010101');
  ok('extraPhones מזוהה', pop.primary && pop.primary.id === 'F1' && pop.primary.field === 'extra');
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

// ── סיכום ───────────────────────────────────────────────────────────────────
console.log(`\n${fail === 0 ? '✅' : '❌'} ${pass} עברו · ${fail} נכשלו`);
if (fail > 0) {
  console.error('נכשלו:\n  ' + fails.join('\n  '));
  process.exit(1);
}
