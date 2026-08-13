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
import { buildDirectory, lookupCaller, lookupInDirectory } from './lib/cti.mjs';
import { tenantFromIntake, INTAKE_STEPS } from './lib/onboard.mjs';
import { planApply, rollbackPlan, planTenants, summarize } from './lib/apply.mjs';
import { channelPlan, isPureDownstream } from './lib/channels.mjs';
import {
  flagOn, featureOn, termOf, expandTerms, applyVertical, VERTICAL_PACKS,
  capabilities, migrateConfig, effectiveConfig, diffConfig, isBaselineConfig,
  sanitizeConfigFields, SCHEMA_VERSION,
} from './lib/config.mjs';

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

// ── סיכום ───────────────────────────────────────────────────────────────────
console.log(`\n${fail === 0 ? '✅' : '❌'} ${pass} עברו · ${fail} נכשלו`);
if (fail > 0) {
  console.error('נכשלו:\n  ' + fails.join('\n  '));
  process.exit(1);
}
