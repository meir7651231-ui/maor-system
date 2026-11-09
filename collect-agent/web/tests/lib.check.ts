import { test } from 'node:test';
import assert from 'node:assert/strict';
import { daysOverdue, fmtIls, fmtPhone, isIlMobile, agingOf } from '../src/lib/format.ts';
import { buildSms, buildEmail, smsSegments, nextStep, remindersExhausted, requiresApproval, demoUnsubUrl, demoShortUrl, TEMPLATES } from '../src/lib/message.ts';
import { readFileSync } from 'node:fs';
import { canSendAt, nextAllowed, HOLIDAYS } from '../src/lib/policy.ts';
import { kpis, needsReminder, agingBuckets } from '../src/lib/stats.ts';
import { DEMO_TODAY, demoBusiness, demoCustomers, demoInvoices } from '../src/data/demo.ts';

const inv = demoInvoices[0], cust = demoCustomers[0];

test('format', () => {
  assert.equal(daysOverdue('2026-10-01', '2026-11-06'), 36);
  assert.equal(daysOverdue('2026-11-12', '2026-11-06'), -6);
  assert.match(fmtIls(4680), /4,680/);
  assert.equal(fmtPhone('972501234567'), '050-123-4567');
  assert.ok(isIlMobile('050-1234567')); assert.ok(!isIlMobile('03-1234567'));
  assert.equal(agingOf(0), 'notDue'); assert.equal(agingOf(31), 'd31_60'); assert.equal(agingOf(91), 'd90p');
});

test('כל SMS בכל שלב כולל קישור קצר (תשלום+הסרה) ושורת הפסקה, ובלי מילות שיווק', () => {
  for (const step of ['friendly', 'plan_offer', 'final'] as const) {
    const s = buildSms(inv, cust, demoBusiness, step);
    // סבב 3 בבקאנד: SMS = קישור קצר אחד /p/{code} (עמוד תשלום+פריסה+הפסקה) ⇒ ≤2 חלקים
    assert.ok(s.includes(demoShortUrl(inv)), step);
    assert.ok(s.endsWith('להפסקה: בקישור'), step);
    assert.ok(s.startsWith(demoBusiness.name + ':'), 'מזהה את העסק');
    assert.doesNotMatch(s, /מבצע|הנחה|הטבה|מתנה|קופון|הזדמנות|הוצאה לפועל|תביעה|משטרה|עו"ד|עורך דין/, step);
    assert.ok(smsSegments(s).segments <= 3, `${step}: ${smsSegments(s).chars} תווים`);
    const e = buildEmail(inv, cust, demoBusiness, step);
    assert.ok(e.subject.includes(inv.number) && e.paragraphs.join().includes(inv.payUrl));
  }
});

test('מקטעי SMS', () => {
  assert.deepEqual(smsSegments('a'.repeat(160)), { chars: 160, unicode: false, segments: 1 });
  assert.equal(smsSegments('א'.repeat(70)).segments, 1);
  assert.equal(smsSegments('א'.repeat(71)).segments, 2);
});

test('סולם + אישור', () => {
  assert.equal(nextStep({ ...inv, reminders: [] }), 'friendly');
  assert.equal(nextStep(inv), 'final'); // 2 נשלחו
  assert.ok(remindersExhausted({ ...inv, reminders: [...inv.reminders, inv.reminders[0]] }), '3 ⇒ עצירה');
  assert.ok(!remindersExhausted(inv));
  const auto = { ...demoBusiness, autoApprove: true };
  for (const st of ['friendly', 'plan_offer', 'final'] as const)
    assert.ok(requiresApproval(st, auto, false), `${st}: אישור פרטני לכל הודעה`);
});

test('מדיניות שעות — הכרעת מאיר (השרת מתיישר: נעילת המשפטי ב-STATUS)', () => {
  const d = (s: string) => new Date(s);
  assert.ok(canSendAt(d('2026-11-08T08:00'))); // ראשון 08:00
  assert.ok(!canSendAt(d('2026-11-08T07:59')));
  assert.ok(canSendAt(d('2026-11-08T19:59')));
  assert.ok(!canSendAt(d('2026-11-08T20:00')));
  assert.ok(canSendAt(d('2026-11-13T11:59'))); // שישי
  assert.ok(!canSendAt(d('2026-11-13T12:00')), 'שישי אחר הצהריים');
  assert.ok(!canSendAt(d('2026-11-14T10:00'))); // שבת
  assert.ok(!canSendAt(d('2026-09-21T10:00')), 'יום כיפור — מובנה');
  assert.ok(!canSendAt(d('2026-09-20T13:00')), 'ערב חג אחה"צ');
  assert.equal(+nextAllowed(d('2026-11-13T15:00')), +d('2026-11-15T08:00')); // שישי אחה"צ ⇒ ראשון 8:00
  assert.equal(+nextAllowed(d('2026-11-09T07:30')), +d('2026-11-09T08:00'));
  assert.ok(!canSendAt(d('2026-11-09T10:00'), new Set(['2026-11-09'])), 'חג מהגדרות העסק');
  const py = readFileSync(new URL('../../app/policy.py', import.meta.url), 'utf8');
  const pyHol = [...py.matchAll(/"(\d{4}-\d{2}-\d{2})": "/g)].map(m => m[1]).sort();
  assert.deepEqual([...HOLIDAYS].sort(), pyHol, 'לוח החגים זהה לבקאנד');
});

test('סטטיסטיקה על נתוני הדמו', () => {
  const k = kpis(demoInvoices, DEMO_TODAY);
  assert.equal(k.openCount, 9);
  const q = needsReminder(demoInvoices, DEMO_TODAY).map(i => i.id);
  assert.ok(!q.includes('i5') && !q.includes('i9'), 'הבטחה/מחלוקת לא בתור');
  assert.ok(!q.includes('i6'), 'עוד לא הגיע מועד');
  const a = agingBuckets(demoInvoices, DEMO_TODAY);
  assert.equal(Object.values(a).reduce((x, y) => x + y, 0), k.openTotal);
});

test('הנוסחים בממשק זהים אות-באות ל-app/templates.py (הבקאנד = מקור האמת)', () => {
  const py = readFileSync(new URL('../../app/templates.py', import.meta.url), 'utf8');
  const steps = [...py.matchAll(/\bStep\("(\w+)",([\s\S]*?)\)(?:,\n|\n\))/g)];
  assert.equal(steps.length, 3);
  for (const [, key, body] of steps) {
    // כל ארגומנט = רצף מחרוזות פייתון סמוכות ⇒ משרשרים
    const lits = [...body.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map(m => m[1]);
    const joined = lits.join('');
    const t = TEMPLATES[key as keyof typeof TEMPLATES];
    for (const [name, val] of Object.entries(t)) {
      const pyVal = val.replace(/"/g, '\\"').replace(/\n/g, '\\n');
      assert.ok(joined.includes(pyVal), `${key}.${name} לא תואם לבקאנד`);
    }
  }
});

import { fromDashboard, type Dashboard } from '../src/api.ts';
import { fmtWhenIL } from '../src/lib/policy.ts';

test('fromDashboard: ממפה את תמונת המצב של הבקאנד למודל הממשק', () => {
  const row = (o: Partial<Dashboard['invoices'][0]>): Dashboard['invoices'][0] => ({
    invoice_id: 1, number: '2001', customer: 'דנה', phone: '050-0000001', email: '', amount_agorot: 345050, currency: 'ILS',
    due: '2026-10-01', status: 'open', days_overdue: 38, reminders_sent: 0, last_reminder: null, customer_block: null, ...o });
  const d: Dashboard = { today: '2026-11-08', totals: {} as Dashboard['totals'], invoices: [
    row({}), row({ invoice_id: 2, reminders_sent: 2, last_reminder: { id: 9, step: 1, status: 'sent_dry_run', template_key: 'plan_offer', sent_at: '2026-11-01T10:00:00+02:00', block_reason: null } }),
    row({ invoice_id: 3, customer_block: 'paid_claim' }), row({ invoice_id: 4, customer_block: 'disputed' }),
    row({ invoice_id: 5, status: 'closed' }), row({ invoice_id: 6, customer_block: 'opted_out', phone: '' }) ] };
  const m = fromDashboard(d, [{ id: 7, invoice_id: 1, block_reason: null }, { id: 8, invoice_id: 6, block_reason: 'no_contact' }]);
  assert.equal(m.invoices[0].amount, 3450.5);
  assert.deepEqual(m.invoices.map(i => i.status), ['open', 'reminded', 'promised', 'disputed', 'paid', 'open']);
  assert.deepEqual(m.invoices[1].reminders.map(r => r.step), ['friendly', 'plan_offer']);
  assert.equal(m.invoices[1].reminders[0].at, '2026-11-01');
  assert.equal(m.pendingBy.get('1')?.reminderId, 7);
  assert.equal(m.pendingBy.get('6')?.block, 'no_contact');
  assert.equal(m.customers[5].phone, undefined);
  assert.ok(m.customers[5].optedOut);
  assert.equal(m.invoices[2].note, 'טוען ששילם — לבדיקתך');
});

test('שעה מהשרת מוצגת בשעון ישראל, וסכומים עם אגורות', () => {
  assert.equal(fmtWhenIL('2026-11-08T10:00:00+02:00'), 'יום ראשון 10:00');
  assert.equal(fmtWhenIL('2026-11-08T08:00:00Z'), 'יום ראשון 10:00');
  assert.match(fmtIls(3450.5), /3,450\.50/);
  assert.doesNotMatch(fmtIls(1200), /\./);
});


// ───────── עיצוב v2 ─────────
import { timeValue, GABI_PRICE } from '../src/lib/roi.ts';
import * as roiMod from '../src/lib/roi.ts';
import { toBars, cumulative, areaPath } from '../src/lib/series.ts';
import { takeTokenFromHash, payCodeOf, loginProblem, loginErrorText, cleanCode, TOKEN_KEY } from '../src/lib/auth.ts';

test('מחשבון שווי הזמן: רק זמן העבודה, בלי הבטחת תשואה (הכרעת מאיר 6.11)', () => {
  const r = timeValue({ hoursPerMonth: 4, hourlyValue: 150 });
  assert.equal(r.timeValue, 600); assert.equal(r.price, 119); assert.equal(r.priceInHours, 0.8);
  assert.equal(GABI_PRICE, 119);
  const z = timeValue({ hoursPerMonth: -3, hourlyValue: NaN });
  assert.equal(z.timeValue, 0); assert.equal(z.hours, 0);
  assert.equal(timeValue({ hoursPerMonth: 4, hourlyValue: 0 }).priceInHours, 0);
  // ratchet: אסור לחזור למודל "כמה כסף יחזור" — אין שיעור החזר, אין מכפיל, אין recovered
  const keys = Object.keys(roiMod).join(',');
  assert.ok(!/RECOVERY|roi\b/.test(keys), 'חזר מחשבון תשואה: ' + keys);
  assert.ok(!('recovered' in r) && !('multiple' in r));
});

test('גרף גבייה: עמודות, מצטבר ונתיב SVG', () => {
  const bars = toBars([{ week: '2026-11-01', collected_agorot: 210000, count: 1 }, { week: '2026-11-08', collected_agorot: 0, count: 0 }]);
  assert.deepEqual(bars.map(b => [b.label, b.value]), [['1.11', 2100], ['8.11', 0]]);
  assert.deepEqual(cumulative(bars), [2100, 2100]);
  assert.match(areaPath([0, 5, 10], 100, 50), /^M100,50 L100\.0,50\.0 L50\.0,25\.0 L0\.0,0\.0 L0\.0,50 Z$/);
  assert.equal(areaPath([], 100, 50), '');
  assert.match(areaPath([0, 10], 100, 50, 25), /L75\.0,50\.0 L25\.0,0\.0/);   // מרכזי העמודות
});

test('טוקן בעלים מה-hash נשמר ונמחק מהכתובת; קוד עמוד החייב', () => {
  const m = new Map<string, string>();
  const st = { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
  const tok = 'a'.repeat(40);
  assert.equal(takeTokenFromHash(`#/dashboard?token=${tok}`, st), '#/dashboard');
  assert.equal(m.get(TOKEN_KEY), tok);
  assert.equal(takeTokenFromHash('#/dashboard?token=short', st), '#/dashboard?token=short');   // קצר מדי ⇒ מתעלמים
  assert.equal(payCodeOf('/pay/em7t8a4'), 'em7t8a4');
  assert.equal(payCodeOf('/pay/../etc'), null); assert.equal(payCodeOf('/app/'), null);
});

test('v2: בלי וואטסאפ בדף התשלום ובדף הנחיתה; הכותרת החדשה', () => {
  const pay = readFileSync(new URL('../src/pages/Pay.tsx', import.meta.url), 'utf8');
  const land = readFileSync(new URL('../src/pages/Landing.tsx', import.meta.url), 'utf8');
  assert.ok(land.includes('הכסף שלך חוזר.') && land.includes('בלי שתצטרך לרדוף.'));
  // review חור 4: כפתור ניטרלי + דומיין היעד; בלי לוגו/צבע של Bit או Apple ובלי «חשבונית ירוקה» קשיח
  assert.ok(pay.includes('data-testid="pay-page"') && pay.includes('pay_host'));
  assert.doesNotMatch(pay, /AppleLogo|Apple Pay|#00B2A9|apple_pay|דרך חשבונית ירוקה/);
  assert.doesNotMatch(pay + land, /וואטסאפ|WhatsApp/i);
});

test('הכרעות מאיר 6.11: מחיר כולל מע״מ, שנתי, אזהרת מסלול morning (הערכה) במסך החיבור ובשאלות', () => {
  const land = readFileSync(new URL('../src/pages/Landing.tsx', import.meta.url), 'utf8');
  const sign = readFileSync(new URL('../src/pages/Signup.tsx', import.meta.url), 'utf8');
  const NOTE = 'ייתכן שנדרש מסלול Best ומעלה ב-morning; יש לאמת מול הספק';
  assert.ok(sign.includes(NOTE), 'מסך החיבור חייב לציין שזמינות ה-API לפי מסלול לא מאומתת');
  assert.ok(land.includes(NOTE), 'גם בשאלות הנפוצות');
  assert.ok(/yearly:\s*1190/.test(land) && land.includes('כולל מע״מ ככל שחל'));
  assert.doesNotMatch(land, /לפני מע״מ/);
});

import { stoppedAtMax } from '../src/lib/stats.ts';
import { PRODUCT_RULES } from '../src/lib/domain.ts';
test('עד 3 תזכורות לחשבונית ⇒ עצירה (הכרעת מאיר)', () => {
  assert.equal(PRODUCT_RULES.maxReminders, 3);
  const three = { ...demoInvoices[2], status: 'reminded' as const }; // i3: 3 תזכורות
  assert.equal(three.reminders.length, 3);
  assert.ok(!needsReminder([three], DEMO_TODAY).length, 'אחרי 3 — לא מציעים תזכורת רביעית');
  assert.deepEqual(stoppedAtMax([three]).map(i => i.id), [three.id]);
  assert.equal(demoBusiness.cadenceDays.length, 3);
});

test('סיבת השהיה מוצגת בעברית, לעולם לא כקוד גולמי', async () => {
  const src = readFileSync(new URL('../src/pages/Dashboard.tsx', import.meta.url), 'utf8');
  for (const intent of ['paid_claim', 'promise', 'plan_request', 'dispute', 'distress', 'cant_pay', 'legal', 'callback', 'wrong_person'])
    assert.ok(new RegExp(`\\b${intent}:`).test(src), `חסרה תווית השהיה ל-${intent}`);
  assert.doesNotMatch(src, /מושהה: \$\{/, 'נפילה לקוד גולמי');
});

import { BRAND as LOGO_BRAND, P as LOGO_P, PUBLIC_FILES, markInner } from '../src/brand/logo.ts';
import { readdirSync } from 'node:fs';
test('לוגו: מקור יחיד (עיצוב מאיר), ירוק רק במטבע, דיו לפי רקע, מזהים ייחודיים, קבצים ציבוריים מסונכרנים', () => {
  const light = markInner({ id: 'a' }), dark = markInner({ onDark: true, id: 'b' });
  // הירוק רק על המטבע: #059669 על רקע בהיר, #10B981 על כהה (הכרעת מאיר: ירוק = הכסף)
  assert.match(light, new RegExp(`<circle[^>]*fill="${LOGO_BRAND.greenOnLight}"[^>]*clip-path`));
  assert.match(dark, new RegExp(`<circle[^>]*fill="${LOGO_BRAND.green}"[^>]*clip-path`));
  assert.ok(light.includes(`fill="${LOGO_BRAND.navy}"`) && !light.includes(LOGO_BRAND.cream), 'רקע בהיר: דיו נייבי');
  assert.ok(dark.includes(`fill="${LOGO_BRAND.cream}"`) && !dark.includes(`fill="${LOGO_BRAND.navy}"`), 'רקע כהה: דיו קרם');
  // ערכי-הבעלים לא זזו (כיוונון חי 7.11)
  assert.deepEqual([LOGO_P.handRot, LOGO_P.thumbRot, LOGO_P.coinX, LOGO_P.walX], [25, 6, 22.5, 8.4]);
  // מזהים ייחודיים — שני סמלים באותו עמוד לא מתנגשים
  assert.ok(light.includes('id="w-a"') && dark.includes('id="w-b"') && !light.includes('w-b'));
  // הקבצים ב-public = מה שהמקור מייצר (npm run logo)
  for (const [name, svg] of Object.entries(PUBLIC_FILES))
    assert.equal(readFileSync(new URL(`../public/${name}`, import.meta.url), 'utf8'), svg, `public/${name} סטה מ-brand/logo.ts — הריצו npm run logo`);
  // אין עותק שני של הצורה בקוד
  const walk = (d: URL): string[] => readdirSync(d, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? walk(new URL(`${e.name}/`, d)) : [new URL(e.name, d).pathname]);
  const copies = walk(new URL('../src/', import.meta.url)).filter(f => !f.endsWith('brand/logo.ts'))
    .filter(f => readFileSync(f, 'utf8').includes('C16.5 35 20.5 37.8'));
  assert.deepEqual(copies, [], 'עותק נוסף של הלוגו: ' + copies.join(', '));
});

test('הודעות מערכת לבעל העסק: רק direction=system, סוף ניסיון ראשון, intent לא מוכר לא נבלע', async () => {
  const { systemNotices } = await import('../src/lib/notices.ts');
  const row = (id: number, direction: string, intent: string | null, body = 'x') =>
    ({ id, customer_id: null, direction, channel: 'owner', body, intent, created_at: '2026-11-08T10:00:00+02:00' });
  const n = systemNotices([
    row(1, 'system', 'max_reminders'), row(2, 'in', 'dispute', 'טקסט חופשי של לקוח'),
    row(3, 'system', 'trial_ending', 'תקופת הניסיון של גבי מסתיימת בעוד 3 ימים'), row(4, 'system', 'something_new'),
  ]);
  assert.deepEqual(n.map(x => x.id), [3, 4, 1]);           // trial_ending ראשון, ואז החדש ביותר
  assert.ok(!n.some(x => x.body.includes('טקסט חופשי')));    // תשובת לקוח לא דולפת לכאן
  assert.equal(n[0].title, 'תקופת הניסיון מסתיימת בקרוב');
  assert.equal(n[1].title, 'הודעה מגבי');
});

import { diffPatch, explainImportError, explainSettingsError, SOURCE_SYSTEMS, sourceLabel, toForm, validate, vatOk, type DesignSettings } from '../src/lib/settings.ts';
test('הגדרות: PUT חלקי בלבד, ולידציה כמו בשרת, שגיאות בעברית', () => {
  const s: DesignSettings = {
    business_name: 'סטודיו דמו', owner_name: '', vat_id: '', reply_email: 'owner@example.com',
    sms: { primary: '019', backup: 'inforu', sender: 'StudioDemo' }, pay: { provider: 'greeninvoice', page_url: 'https://pay.example/x' },
    source: { type: 'api', api_connected: true }, cadence_days: [1, 7, 14],
    rules: { max_reminders: 3, window: '08:00-20:00', approval: 'every_message' },
  };
  const a = toForm(s);
  assert.deepEqual(diffPatch(a, a), {}, 'בלי שינוי ⇒ גוף ריק');
  assert.deepEqual(diffPatch(a, { ...a, sender: 'NewName' }), { sms: { sender: 'NewName' } });
  assert.deepEqual(diffPatch(a, { ...a, pay_provider: 'bit' }), { pay: { provider: 'bit', page_url: 'https://pay.example/x' } }, 'החלפת ספק שולחת גם כתובת (נבדקת מול הדומיין החדש)');
  const p = diffPatch(a, { ...a, owner_name: ' מאיר ' });
  assert.deepEqual(p, { owner_name: 'מאיר' });
  for (const k of ['rules', 'cadence_days', 'source', 'pricing']) assert.ok(!(k in diffPatch(a, { ...a, vat_id: '123456782' })), `${k} לעולם לא נשלח`);
  assert.ok(vatOk('123456782') && vatOk('000000000') && !vatOk('123456789') && !vatOk('12345678'));
  assert.equal(validate(a).sender, undefined);
  assert.ok(validate({ ...a, sender: 'Studio Demo' }).sender, 'רווח בשם שולח נדחה (כמו בשרת)');
  assert.ok(validate({ ...a, sender: 'ABCDEFGHIJKL' }).sender);
  assert.ok(validate({ ...a, pay_url: 'http://pay.example/x' }).pay_url);
  assert.ok(validate({ ...a, business_name: 'x' }).business_name);
  assert.equal(explainSettingsError("sms_sender_id: String should match pattern '^[A-Za-z0-9]{1,11}$'"), 'שם השולח: ערך לא תקין');
  assert.equal(explainSettingsError('קישור התשלום חייב להיות https בדומיין של bit: pay.example'), 'קישור התשלום חייב להיות https בדומיין של bit: pay.example');
});

test('מקור חשבוניות: נשלחת רק הבחירה ורק כשהשתנתה; הרשימה זהה לשרת', () => {
  const s: DesignSettings = {
    business_name: 'סטודיו דמו', owner_name: '', vat_id: '', reply_email: '',
    sms: { primary: '019', backup: 'inforu', sender: 'StudioDemo' }, pay: { provider: 'greeninvoice', page_url: '' },
    source: { type: 'api', api_connected: true }, cadence_days: [1, 7, 14],
    rules: { max_reminders: 3, window: '08:00-20:00', approval: 'every_message' },
  };
  const a = toForm(s);
  assert.equal(a.source_system, 'greeninvoice', 'שרת ישן בלי system ⇒ חשבונית ירוקה');
  assert.equal(toForm({ ...s, source: { ...s.source, system: 'rivhit' } }).source_system, 'rivhit');
  assert.deepEqual(diffPatch(a, a), {});
  assert.deepEqual(diffPatch(a, { ...a, source_system: 'icount' }), { source: { system: 'icount' } });
  const p = JSON.stringify(diffPatch(a, { ...a, source_system: 'ezcount' }));
  assert.ok(!/key|token|secret|api_connected|type/.test(p), 'לעולם לא סוד ולא שדה מחושב');
  assert.equal(sourceLabel('rivhit'), 'רווחית');
  assert.equal(sourceLabel(undefined), 'חשבונית ירוקה (morning)');
  // מקור אמת: SOURCE_SYSTEMS ב-app/integrations/sources.py — אותם מפתחות, באותו סדר
  const py = readFileSync(new URL('../../app/integrations/sources.py', import.meta.url), 'utf8');
  const block = py.slice(py.indexOf('SOURCE_SYSTEMS: dict'), py.indexOf('SOURCE_KEYS ='));
  const keys = [...block.matchAll(/^ {4}"(\w+)": SourceSystem\(/gm)].map(m => m[1]);
  assert.deepEqual(SOURCE_SYSTEMS.map(x => x.key), keys);
  assert.equal(explainSettingsError("source_system: Input should be 'greeninvoice'"), "מערכת החשבוניות: Input should be 'greeninvoice'");
});

test('מקור החשבונית מהשרת (api/csv) נשמר במודל — בסיס לתיבת «הסכום עדיין פתוח»', () => {
  const base = { number: '1', customer: 'x', phone: '', email: '', amount_agorot: 100, currency: 'ILS', due: '2026-10-01', status: 'open',
    days_overdue: 1, reminders_sent: 0, last_reminder: null, customer_block: null };
  const d = { today: '2026-11-08', totals: {} as never, invoices: [{ ...base, invoice_id: 1, source: 'csv' as const }, { ...base, invoice_id: 2 }] };
  const m = fromDashboard(d as never, []);
  assert.deepEqual(m.invoices.map(i => i.source), ['csv', 'api']);
  const prev = readFileSync(new URL('../src/components/MessagePreview.tsx', import.meta.url), 'utf8');
  assert.match(prev, /disabled=\{[^}]*isCsv && !confirmOpen/, 'אישור CSV חסום עד סימון התיבה');
});

test('§30א: הסכמה לפרסומת בהרשמה — נפרדת, אופציונלית, לא מסומנת, עם חותמת זמן (critic סבב 5)', () => {
  const su = readFileSync(new URL('../src/pages/Signup.tsx', import.meta.url), 'utf8');
  assert.match(su, /marketing: false, marketingAt: ''/, 'ברירת מחדל: לא מסומן');
  assert.ok(su.includes('data-testid="marketing-consent"') && su.includes('לא חובה'));
  assert.doesNotMatch(su, /disabled=\{[^}]*marketing/, 'ההסכמה לא יכולה להיות תנאי להרשמה');
});

test('ייבוא CSV: 403 של שער הבטא מוסבר בעברית ובלי «נכשל» מטעה; שגיאות אחרות לא נבלעות', () => {
  const m = explainImportError(403, 'x');
  assert.match(m, /נתוני דמו/); assert.match(m, /לא יובאה אף שורה/); assert.doesNotMatch(m, /403/);
  assert.match(explainImportError(400, 'קובץ ריק'), /קובץ ריק/);
  assert.match(explainImportError(500, 'boom'), /boom/);
  const src = readFileSync(new URL('../src/api.ts', import.meta.url), 'utf8');
  assert.match(src, /throw new ApiError\(msg, r\.status\)/, 'השרת מעביר קוד סטטוס ל-UI');
});

test('loginProblem: מייל+סיסמה+קוד 6 ספרות', () => {
  assert.equal(loginProblem('a@b.co', 'x', '123456'), null);
  assert.match(loginProblem('ab', 'x', '123456')!, /מייל/);
  assert.match(loginProblem('a@b.co', '', '123456')!, /סיסמה/);
  assert.match(loginProblem('a@b.co', 'x', '12345')!, /6 ספרות/);
  assert.match(loginProblem('a@b.co', 'x', '12345a')!, /6 ספרות/);
});

test('שער 6 · הודעות כניסה: 401 כללי (לא מגלה מה שגוי), 429 עם דקות, 403, רשת', () => {
  const w = loginErrorText(401);
  assert.match(w, /הסיסמה/); assert.match(w, /קוד האימות/); assert.match(w, /30 שניות/);
  assert.doesNotMatch(w, /לא קיים|לא נמצא/, 'אסור לגלות אם המשתמש קיים');
  assert.match(loginErrorText(429, '900'), /ננעלה זמנית/); assert.match(loginErrorText(429, '900'), /15 דקות/);
  assert.match(loginErrorText(429, '30'), /בעוד דקה/);
  assert.match(loginErrorText(429, null), /15 דקות/);          // בלי Retry-After ⇒ ברירת המחדל של הנעילה
  assert.match(loginErrorText(403), /הרשאת גישה/);
  assert.match(loginErrorText(0), /אין חיבור/);
  assert.match(loginErrorText(500), /תקלה בשרת/);
  for (const st of [401, 403, 429, 0, 500]) assert.doesNotMatch(loginErrorText(st), /\b(401|403|429|500)\b/);
  assert.equal(cleanCode('123 456'), '123456'); assert.equal(cleanCode('12a3-4567'), '123456'); assert.equal(cleanCode(''), '');
});

test('שער 6 · מסך הכניסה: אין טוקן בכתובת, סשן רק ב-sessionStorage, יציאה מבטלת בשרת', () => {
  const login = readFileSync(new URL('../src/pages/Login.tsx', import.meta.url), 'utf8');
  const store = readFileSync(new URL('../src/store.tsx', import.meta.url), 'utf8');
  const api = readFileSync(new URL('../src/api.ts', import.meta.url), 'utf8');
  const all = login + store + api;
  assert.doesNotMatch(all, /localStorage|document\.cookie/, 'הסשן נשמר רק בלשונית');
  assert.doesNotMatch(all, /location\.(hash|href|search)\s*=.*tok/i, 'טוקן לא נכנס לכתובת');
  assert.match(api, /'\/auth\/logout'/); assert.match(store, /logoutRequest\(\)/);
  assert.match(store, /removeItem\(TOKEN_KEY\)/, 'יציאה/פג תוקף מוחקים את הסשן מהלשונית');
  // הקוד המשותף מוצג רק כשהשרת לא דורש כניסת עובד (REQUIRE_USER_LOGIN=1 ⇒ אין «קוד גישה»)
  assert.match(login, /login_required !== true/);
  assert.match(login, /autoComplete="one-time-code"/); assert.match(login, /autoComplete="current-password"/);
});

// critic סבב 32: הממשק השבית את «אשר ושלח» לכל block_reason — גם לסיבות «לאשר מחדש» (approval_expired,
// approval_invalidated, amount_changed), שהשרת דווקא מאשר. ⇒ תזכורת שחזרה לאישור נתקעה לתמיד («⛔ חסום»).
import { blockKind, REAPPROVE_LABEL } from '../src/api.ts';
test('block_reason: חסימה קשה משביתה; «לאשר מחדש» לא', () => {
  for (const b of ['no_contact', 'no_payment_link', 'opted_out', 'disputed', 'paid_claim', 'credit_review'])
    assert.equal(blockKind(b), 'hard', b);
  for (const b of ['approval_expired', 'approval_invalidated', 'amount_changed']) {
    assert.equal(blockKind(b), 'reapprove', b);
    assert.ok(REAPPROVE_LABEL[b], b);
  }
  assert.equal(blockKind(null), null);
  assert.equal(blockKind('something_new'), 'hard');   // לא מוכר ⇒ שמרני (משבית)
  const mp = readFileSync(new URL('../src/components/MessagePreview.tsx', import.meta.url), 'utf8');
  assert.match(mp, /blockKind\(block\) !== 'hard'|blockKind\(block\) === 'hard'/);
  assert.doesNotMatch(mp, /sendable = live \? !!pv && !block &&/);
});

// critic סבב 33: הודעה נכנסת משולח לא מוכר / מכתובת של כמה לקוחות (סבב 27) נשמרת needs_owner=1, אבל
// systemNotices סינן רק direction=system ⇒ בעל העסק לעולם לא ראה אותה (אין לה טיוטה ב«תשובות לקוחות»).
test('הודעות נכנסות בלי לקוח (שולח לא מוכר / כתובת משותפת) מגיעות לבעל העסק', async () => {
  const { systemNotices } = await import('../src/lib/notices.ts');
  const row = (id: number, direction: string, intent: string | null, body: string, customer_id: number | null = null) =>
    ({ id, customer_id, direction, channel: 'sms', body, intent, created_at: '2026-11-09T10:00:00+02:00' });
  const n = systemNotices([
    row(1, 'in', 'unknown_sender', 'מי אתם? אני רונית'),
    row(2, 'in', 'shared_contact_ambiguous', 'שילמתי אתמול'),
    row(3, 'in', 'dispute', 'טקסט חופשי של לקוח', 7),        // לקוח מזוהה ⇒ לא כאן (יש לו טיוטה)
  ]);
  assert.deepEqual(n.map(x => x.id).sort(), [1, 2]);
  assert.ok(n.find(x => x.id === 2)!.title.includes('כמה לקוחות'));
  assert.ok(n.find(x => x.id === 1)!.body.includes('רונית'));
});
