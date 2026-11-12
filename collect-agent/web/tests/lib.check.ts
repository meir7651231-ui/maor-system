import { test } from 'node:test';
import assert from 'node:assert/strict';
import { daysOverdue, fmtIls, fmtMoney, fmtTotal, plusOther, fmtPhone, isIlMobile, agingOf, ratioHalfUp } from '../src/lib/format.ts';
import { firstName, buildSms, buildEmail, smsSegments, GSM7, GSM7_EXT, nextStep, remindersExhausted, requiresApproval, demoUnsubUrl, demoShortUrl, TEMPLATES, fmtAmountBackend } from '../src/lib/message.ts';
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

test('smsSegments = מראה של integrations.sms_segments (הפעלה 128: אימוג\'י/GSM-7/הרחבה)', () => {
  // [טקסט, chars, segments, unicode] — הפלט הוקלט מ-app.channels.sms_segments (Python).
  const cases: [string, number, number, boolean][] = [
    ['a'.repeat(160), 160, 1, false], ['a'.repeat(161), 161, 2, false],
    ['א'.repeat(70), 70, 1, true], ['א'.repeat(71), 71, 2, true],
    ['א'.repeat(69) + '👍', 70, 2, true],          // היה 1: אימוג'י = 2 יחידות UTF-16
    ['א'.repeat(134), 134, 2, true], ['א'.repeat(133) + '👍', 134, 3, true],   // היה 2
    ['{'.repeat(80), 80, 1, false], ['{'.repeat(81), 81, 2, false],            // היה 1: תו הרחבה = 2
    ['é'.repeat(160), 160, 1, false], ['é'.repeat(161), 161, 2, false],        // היה 3 (UCS-2)
    ['`'.repeat(10), 10, 1, true],                                              // ` אינו GSM-7
    ['שלום 👍👍', 7, 1, true], ['€'.repeat(81), 81, 2, false], ['', 0, 1, false],
  ];
  for (const [t, chars, segments, unicode] of cases)
    assert.deepEqual(smsSegments(t), { chars, segments, unicode }, JSON.stringify(t.slice(0, 8)) + ` (${t.length})`);
  // הגנת-מקור: טבלאות GSM-7 זהות לשרת (שינוי שם ⇒ לשנות כאן).
  const py = readFileSync(new URL('../../app/integrations/sms.py', import.meta.url), 'utf8');
  const gsm = py.match(/GSM7 = set\("([^"\\]*(?:\\.[^"\\]*)*)"\s*\n\s*"([^"]*)"\)/);
  assert.ok(gsm, 'GSM7 בשרת שינה צורה');
  const unesc = (x: string) => x.replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\"/g, '"');
  assert.deepEqual([...GSM7].sort(), [...new Set([...unesc(gsm[1] + gsm[2])])].sort());
  const ext = py.match(/GSM7_EXT = set\("([^"]*)"\)/);
  assert.ok(ext, 'GSM7_EXT בשרת שינה צורה');
  assert.deepEqual([...GSM7_EXT].sort(), [...new Set([...ext[1].replace(/\\\\/g, '\\')])].sort());
  assert.match(py, /units = sum\(2 if ord\(c\) > 0xFFFF else 1 for c in text\)/);
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
  assert.equal(k.openCount, 10);
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
  assert.match(src, /throw new ApiError\(msg, r\.status[,)]/, 'השרת מעביר קוד סטטוס ל-UI');
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
  for (const b of ['compliance', 'no_reply_to']) assert.equal(blockKind(b), 'hard', b);
  // critic סבב 51: CSV שחזר לאישור (24 ש׳ / חסר בייבוא) — השרת מתיר; הממשק השבית עם קוד גולמי
  for (const b of ['approval_expired', 'approval_invalidated', 'amount_changed', 'amount_check', 'csv_stale', 'csv_missing_from_import']) {
    assert.equal(blockKind(b), 'reapprove', b);
    assert.ok(REAPPROVE_LABEL[b], b);
  }
  assert.equal(blockKind(null), null);
  assert.equal(blockKind('something_new'), 'hard');   // לא מוכר ⇒ שמרני (משבית)
  const mp = readFileSync(new URL('../src/components/MessagePreview.tsx', import.meta.url), 'utf8');
  assert.match(mp, /blockKind\(block\) !== 'hard'|blockKind\(block\) === 'hard'/);
  assert.doesNotMatch(mp, /sendable = live \? !!pv && !block &&/);
  // הפעלה 123: סכום חריג ⇒ תיבת אישור מפורש, והכפתור מושבת עד הסימון; confirm_amount נשלח לשרת
  assert.match(mp, /data-testid="confirm-amount"/);
  assert.match(mp, /odd\.length > 0 && !confirmAmount/);
  const apiSrc = readFileSync(new URL('../src/api.ts', import.meta.url), 'utf8');
  assert.match(apiSrc, /confirm_amount: true/);
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

// critic סבב 34: אין דרך לסמן הודעה כ«טופל» ⇒ «דורש טיפול שלך» מצטבר לנצח. כפתור + API לשרת.
test('«דורש טיפול שלך»: לכל הודעה כפתור «טופל» שקורא ל-/owner/inbox/{id}/done', () => {
  const api = readFileSync(new URL('../src/api.ts', import.meta.url), 'utf8');
  assert.match(api, /ownerDone: \(id: number\) => j<unknown>\(`\/owner\/inbox\/\$\{id\}\/done`, \{ method: 'POST' \}\)/);
  const dash = readFileSync(new URL('../src/pages/Dashboard.tsx', import.meta.url), 'utf8');
  assert.match(dash, /api\.ownerDone\(n\.id\)/);
  assert.match(dash, /data-testid="notice-done"/);
});

test('firstName = מראה של templates.first_name (הפעלה 115: תואר/פיסוק/אורך)', () => {
  const cases: [string, string][] = [
    ['מר דוד כהן', 'דוד'], ['ד"ר שרה לוי', 'שרה'], ['ד״ר שרה לוי', 'שרה'], ['הרב יוסף כהן', 'יוסף'],
    ['מר כהן', 'מר כהן'], ["גב' רחל", "גב' רחל"], ['Dr. Sarah Levi', 'Sarah'], ['Cohen, David', 'Cohen'],
    ['מר', ''], ['א'.repeat(30), ''], ['דוד כהן', 'דוד'], ['סטודיו אור', 'סטודיו אור'], ['', ''],
  ];
  for (const [n, f] of cases) assert.equal(firstName(n), f, n);
});

// critic סבב 47: מספר חשבונית שנוקה לריק (הפעלה 116) הוצג בעמוד החייב כ«חשבונית  ·» — עכשיו «(ללא מספר)».
test('עמוד החייב: מספר חשבונית ריק ⇒ «(ללא מספר)»', () => {
  const pay = readFileSync(new URL('../src/pages/Pay.tsx', import.meta.url), 'utf8');
  assert.equal((pay.match(/number \|\| '\(ללא מספר\)'/g) ?? []).length, 3);
});

// critic סבב 48: טיוטה עם כסף ללקוח עם סכום חריג (פי 50) — השרת דורש confirm_amount; בלי תיבה בממשק בעל העסק תקוע.
test('תשובות לקוחות: סכום חריג ⇒ תיבת «הסכום נכון» והכפתור שולח confirm_amount', () => {
  const inbox = readFileSync(new URL('../src/pages/Inbox.tsx', import.meta.url), 'utf8');
  assert.match(inbox, /data-testid="draft-confirm-amount"/);
  assert.match(inbox, /api\.approveDraft\(d\.id, body === d\.body \? undefined : body, confirmAmount\)/);
  assert.match(inbox, /odd\.length > 0 && !confirmAmount/);
});

test('סכום חריג: מראה של app/policy.py amount_outlier + כרטיס בהדגמה הסטטית (הפעלה 126)', async () => {
  const { amountOutlier, mockAmountCheck, AMOUNT_OUTLIER_FACTOR, AMOUNT_OUTLIER_MIN_AGOROT, AMOUNT_OUTLIER_MIN_HISTORY } = await import('../src/lib/policy.ts');
  const py = readFileSync(new URL('../../app/policy.py', import.meta.url), 'utf8');
  const c = (k: string) => Number(new RegExp(`^${k} = ([\\d_]+)`, 'm').exec(py)![1].replaceAll('_', ''));
  assert.equal(AMOUNT_OUTLIER_FACTOR, c('AMOUNT_OUTLIER_FACTOR'));
  assert.equal(AMOUNT_OUTLIER_MIN_AGOROT, c('AMOUNT_OUTLIER_MIN_AGOROT'));
  assert.equal(AMOUNT_OUTLIER_MIN_HISTORY, c('AMOUNT_OUTLIER_MIN_HISTORY'));
  assert.equal(amountOutlier(1_200_000, [12_000, 13_000]), 12_500, 'פי 100 ⇒ חריג');
  assert.equal(amountOutlier(1_200_000, [12_000]), null, 'היסטוריה קצרה ⇒ לא מנחשים');
  assert.equal(amountOutlier(90_000, [100, 100]), null, 'מתחת ל-₪1,000');
  assert.equal(amountOutlier(500_000, [12_000, 13_000]), null, 'פי 40 ⇒ לא חריג');
  const gal = demoInvoices.find(i => i.number === '2009')!;
  assert.deepEqual(mockAmountCheck(gal, demoInvoices), [{ number: '2009', amount_agorot: 249_000, usual_agorot: 2740, currency: 'ILS' }]);
  assert.ok(needsReminder(demoInvoices, DEMO_TODAY).some(i => i.id === gal.id), 'החשבונית בתור האישורים');
  for (const i of demoInvoices.filter(x => x.id !== gal.id)) assert.deepEqual(mockAmountCheck(i, demoInvoices), [], `רק 2009 חריגה (${i.number})`);
  const mp = readFileSync(new URL('../src/components/MessagePreview.tsx', import.meta.url), 'utf8');
  assert.match(mp, /: mockAmountCheck\(invoice, invoices\)/, 'בהדגמה הכרטיס מחושב מקומית, לא [] קבוע');
  assert.match(mp, /smsText\.includes\(live \? payUrl : demoShortUrl\(invoice\)\)/, 'במוק: אזהרת «חסר קישור» מול הקישור המקוצר שב-SMS');
});

// critic סבב 49: amount_check (הפעלה 123) הוצג בדשבורד ככותרת כללית «הודעה מגבי» בטון מידע.
test('התראת סכום חריג: כותרת ייעודית וטון אזהרה', async () => {
  const { systemNotices } = await import('../src/lib/notices.ts');
  const [n] = systemNotices([{ id: 1, customer_id: 1, direction: 'system', channel: 'owner', body: 'x', intent: 'amount_check', created_at: '2026-11-11T10:00:00+02:00' }]);
  assert.notEqual(n.title, 'הודעה מגבי');
  assert.equal(n.tone, 'warn');
});

// הפעלה 127: סכום ב-SMS של המוק = templates.fmt_amount של השרת, אות-באות (קודם 24.90 עוגל ל-"25 ₪").
test('fmtAmountBackend תואם templates.fmt_amount (אגורות, פסיקים, אפס)', () => {
  const cases: [number, string][] = [
    [12870, '12,870 ₪'], [24.9, '24.90 ₪'], [29.9, '29.90 ₪'], [2490, '2,490 ₪'],
    [0.05, '0.05 ₪'], [1234567.89, '1,234,567.89 ₪'], [100, '100 ₪'], [0.1 + 0.2, '0.30 ₪'],
  ];
  for (const [ils, want] of cases) assert.equal(fmtAmountBackend(ils), want, String(ils));
  // מקור: הצורה בשרת לא השתנתה (אם תשתנה — לעדכן כאן ובמראה).
  const py = readFileSync(new URL('../../app/templates.py', import.meta.url), 'utf8');
  assert.match(py, /s = f"\{whole:,\}" \+ \(f"\.\{frac:02d\}" if frac else ""\)/);
  const paid = demoInvoices.find(i => i.number === '2007')!;
  const cust = demoCustomers.find(c => c.id === paid.customerId)!;
  assert.match(buildSms(paid, cust, demoBusiness, 'friendly'), /ע"ס 24\.90 ₪/);
});

test('ratioHalfUp = מראה של app/service.py ratio_half_up (KPI בדשבורד, הפעלה 129)', () => {
  // אותה טבלה כמו tests/test_ratio_half_up.py (פלט Python). 12.5 ⇒ 13 ו-2.5 ⇒ 3 (round של Python נתן 12 ו-2)
  const cases: [number, number, number, number][] = [[1, 8, 100, 13], [5, 2, 1, 3], [3, 2, 1, 2], [1, 3, 100, 33],
    [2, 3, 100, 67], [0, 5, 100, 0], [7, 0, 100, 0], [249000, 249000 + 872500, 100, 22], [5, 4, 1, 1], [7, 4, 1, 2],
    [1, 200, 100, 1], [1, 201, 100, 0]];
  for (const [n, d, s, want] of cases) assert.equal(ratioHalfUp(n, d, s), want, `${n}/${d}×${s}`);
  const py = readFileSync(new URL('../../app/service.py', import.meta.url), 'utf8');
  assert.match(py, /return \(2 \* scale \* num \+ den\) \/\/ \(2 \* den\)/, 'נוסחת השרת');
  for (const key of ['recovery_rate_pct', 'avg_days_overdue', 'reply_rate_pct'])
    assert.match(py, new RegExp(`"${key}": ratio_half_up\\(`), key);
  // ממוצע ימי איחור במוק: 1 ו-4 ימים ⇒ 3 (לא 2)
  const mk = (id: string, dueAt: string) => ({ ...demoInvoices[0], id, dueAt, status: 'open' as const, reminders: [] });
  assert.equal(kpis([mk('a', '2026-11-05'), mk('b', '2026-11-02')], '2026-11-06').avgDaysLate, 3);
  const dash = readFileSync(new URL('../src/pages/Dashboard.tsx', import.meta.url), 'utf8');
  assert.match(dash, /recovery_rate_pct \?\? ratioHalfUp\(collectedAg/, 'שיעור החזר במוק באגורות ובאותו עיגול');
});

test('הפעלה 130: סכום במטבע החשבונית — מראה של templates.fmt_amount, לא «₪» קבוע', () => {
  // הוקלט מפלט Python: fmt_amount(agorot, currency)
  const py: [number, string, string][] = [
    [50000, 'USD', '$500'], [120050, 'EUR', '€1,200.50'], [99, 'GBP', '£0.99'],
    [123456789, 'CHF', 'CHF 1,234,567.89'], [249000, 'ILS', '2,490 ₪'], [1, 'USD', '$0.01'], [100000, 'JPY', 'JPY 1,000'],
  ];
  for (const [ag, c, want] of py) assert.equal(fmtAmountBackend(ag / 100, c), want, `${ag} ${c}`);
  // ILS/חסר ⇒ התצוגה הקיימת (Intl) לא השתנתה; מטבע אחר ⇒ כמו השרת
  assert.equal(fmtMoney(3450.5), fmtIls(3450.5));
  assert.equal(fmtMoney(3450.5, 'ILS'), fmtIls(3450.5));
  assert.equal(fmtMoney(500, 'USD'), '$500');
  assert.doesNotMatch(fmtMoney(500, 'USD'), /₪/);
  // סה״כ: מטבע אחד ⇒ סכום אחד; מעורב ⇒ לכל מטבע (כמו conversation.total_text), לא חיבור
  assert.equal(fmtTotal([{ amount: 100 }, { amount: 200.5 }]), fmtIls(300.5));
  assert.equal(fmtTotal([{ amount: 1000 }, { amount: 500, currency: 'USD' }, { amount: 200 }]), `${fmtIls(1200)} + $500`);
  assert.equal(fmtTotal([]), fmtIls(0));
  assert.equal(fmtTotal([{ amount: 0.1, currency: 'USD' }, { amount: 0.2, currency: 'USD' }]), '$0.30');
  // הסמלים זהים למילון בשרת
  const tpl = readFileSync(new URL('../../app/templates.py', import.meta.url), 'utf8');
  assert.match(tpl, /\{"ILS": "₪", "USD": "\$", "EUR": "€", "GBP": "£"\}\.get\(currency, currency \+ " "\)/);
  // SMS של המוק נושא את המטבע
  assert.match(buildSms({ ...inv, amount: 500, currency: 'USD' }, cust, demoBusiness, 'friendly'), /\$500/);
  // fromDashboard מעביר את המטבע (ILS לא נכתב — המודל של הדמו לא השתנה)
  const base = { number: '1', customer: 'x', phone: '', email: '', due: '2026-10-01', status: 'open', days_overdue: 1, reminders_sent: 0, last_reminder: null, customer_block: null };
  const m = fromDashboard({ today: '2026-11-08', totals: {} as Dashboard['totals'], invoices: [
    { ...base, invoice_id: 1, amount_agorot: 50000, currency: 'USD' }, { ...base, invoice_id: 2, amount_agorot: 100, currency: 'ILS' }] }, []);
  assert.deepEqual(m.invoices.map(i => i.currency), ['USD', undefined]);
  // הגנת-מקור: אף סכום של חשבונית/בדיקת-סכום בממשק לא עובר ב-fmtIls בלי מטבע
  for (const f of ['components/MessagePreview.tsx', 'pages/Invoices.tsx', 'pages/Inbox.tsx', 'pages/Settings.tsx', 'pages/Dashboard.tsx']) {
    const src = readFileSync(new URL(`../src/${f}`, import.meta.url), 'utf8');
    assert.doesNotMatch(src, /fmtIls\((invoice|i)\.amount\)/, `${f}: סכום חשבונית בלי מטבע`);
    assert.doesNotMatch(src, /fmtIls\(o\.(amount|usual)_agorot/, `${f}: amount_check בלי מטבע`);
  }
});

test('הפעלה 131: KPI ב-₪ בלבד; מטבע אחר לידם («ועוד $500») ולא מחובר', () => {
  const mk = (id: string, amount: number, dueAt: string, currency?: string): (typeof demoInvoices)[number] =>
    ({ ...demoInvoices[0], id, amount, dueAt, status: 'open', reminders: [], ...(currency ? { currency } : {}) }) as (typeof demoInvoices)[number];
  const list = [mk('a', 1200, '2026-10-01'), mk('b', 500, '2026-08-01', 'USD'), mk('c', 300, '2026-12-01', 'ILS')];
  const k = kpis(list, '2026-11-11');
  assert.equal(k.openTotal, 1500);            // הקוד הישן: 2000
  assert.equal(k.overdueTotal, 1200);         // הקוד הישן: 1700
  assert.equal(k.openCount, 3);
  assert.equal(k.overdueCount, 2);
  const ag = agingBuckets(list, '2026-11-11');
  assert.equal(Object.values(ag).reduce((a, b) => a + b, 0), 1500);
  const oc = [{ currency: 'EUR', open_invoices: 0, open_agorot: 0, overdue_agorot: 0, at_risk_agorot: 0, collected_agorot: 2050 },
    { currency: 'USD', open_invoices: 1, open_agorot: 50000, overdue_agorot: 50000, at_risk_agorot: 50000, collected_agorot: 0 }];
  assert.equal(plusOther(oc, 'open_agorot'), 'ועוד $500');
  assert.equal(plusOther(oc, 'collected_agorot'), 'ועוד €20.50');
  assert.equal(plusOther([{ currency: 'USD', open_agorot: 100 }, { currency: 'CHF', open_agorot: 250 }], 'open_agorot'), 'ועוד $1 + CHF 2.50');
  assert.equal(plusOther(undefined, 'open_agorot'), '');
  assert.equal(plusOther([], 'open_agorot'), '');
  // הגנת-מקור: השרת מסכם ₪ בלבד ומחזיר other_currency; הדשבורד מציג אותו
  const svc = readFileSync(new URL('../../app/service.py', import.meta.url), 'utf8');
  assert.match(svc, /"other_currency": _other_currency\(open_rows, closed_all\)/);
  assert.match(svc, /"open_agorot": open_amt,/);
  const dash = readFileSync(new URL('../src/pages/Dashboard.tsx', import.meta.url), 'utf8');
  for (const f of ['open_agorot', 'overdue_agorot', 'at_risk_agorot', 'collected_agorot']) assert.match(dash, new RegExp(`sub\\([^\\n]*'${f}'\\)`), f);
});

import { byAmountDesc } from '../src/lib/stats.ts';
test('הפעלה 132: מיון «לפי סכום» לא משווה מטבעות — ₪ קודם, מטבע אחר כקבוצה נפרדת', () => {
  const mk = (id: string, amount: number, currency?: string): (typeof demoInvoices)[number] =>
    ({ ...demoInvoices[0], id, amount, ...(currency ? { currency } : {}) }) as (typeof demoInvoices)[number];
  const list = [mk('usd9000', 9000, 'USD'), mk('ils100', 100), mk('eur50', 50, 'EUR'), mk('ils2490', 2490, 'ILS'), mk('usd20', 20, 'USD'), mk('ils800', 800)];
  // הקוד הישן (b.amount - a.amount): usd9000 ראשון, eur50 אחרי ils100
  assert.deepEqual([...list].sort(byAmountDesc).map(i => i.id), ['ils2490', 'ils800', 'ils100', 'eur50', 'usd9000', 'usd20']);
  // עסק בשקלים בלבד ⇒ אותו סדר כמו קודם
  const ils = demoInvoices.filter(i => !i.currency || i.currency === 'ILS');
  assert.deepEqual([...ils].sort(byAmountDesc).map(i => i.id), [...ils].sort((a, b) => b.amount - a.amount).map(i => i.id));
  // הגנת-מקור: העמוד ממיין דרך byAmountDesc
  const src = readFileSync(new URL('../src/pages/Invoices.tsx', import.meta.url), 'utf8');
  assert.match(src, /sort === 'amount' \? byAmountDesc\(a, b\)/);
  assert.doesNotMatch(src, /b\.amount - a\.amount/);
});

import { otherInSeries } from '../src/lib/series.ts';
test('הפעלה 134: גרף הגבייה מצייר ₪ בלבד — גבייה במטבע אחר מוצגת לידו («ועוד $500, לא בגרף»)', () => {
  const series = [
    { week: '2026-10-25', collected_agorot: 120000, count: 1, other: [{ currency: 'USD', collected_agorot: 30000 }] },
    { week: '2026-11-01', collected_agorot: 0, count: 0 },
    { week: '2026-11-08', collected_agorot: 0, count: 0, other: [{ currency: 'USD', collected_agorot: 20000 }, { currency: 'EUR', collected_agorot: 2050 }] }];
  assert.deepEqual(otherInSeries(series), [{ currency: 'EUR', collected_agorot: 2050 }, { currency: 'USD', collected_agorot: 50000 }]);
  assert.equal(plusOther(otherInSeries(series), 'collected_agorot'), 'ועוד €20.50 + $500');
  // העמודות עצמן לא משתנות: ₪ בלבד
  assert.deepEqual(toBars(series).map(b => b.value), [1200, 0, 0]);
  // עסק בשקלים בלבד ⇒ אין שורה
  assert.deepEqual(otherInSeries([{ week: '2026-11-08', collected_agorot: 100, count: 1 }]), []);
  assert.equal(plusOther(otherInSeries([]), 'collected_agorot'), '');
  // הגנת-מקור: השרת מחזיר other לשבוע, והדשבורד מציג אותו ליד הסה״כ
  const svc = readFileSync(new URL('../../app/service.py', import.meta.url), 'utf8');
  assert.match(svc, /point\["other"\] = \[\{"currency": c, "collected_agorot": by\[c\]\} for c in sorted\(by\)\]/);
  const dash = readFileSync(new URL('../src/pages/Dashboard.tsx', import.meta.url), 'utf8');
  assert.match(dash, /plusOther\(otherInSeries\(series\), 'collected_agorot'\)/);
  assert.match(dash, /data-testid="chart-other"/);
});

test('הפעלה 135: תזכורת מאוחדת בתור האישורים של /app/ — מספר החשבוניות והסה״כ לפי מטבע, לא חשבונית העוגן', () => {
  const row = (id: number): Dashboard['invoices'][0] => ({
    invoice_id: id, number: String(2000 + id), customer: 'גל', phone: '053-0000007', email: '', amount_agorot: 2490, currency: 'ILS',
    due: '2026-10-01', status: 'open', days_overdue: 38, reminders_sent: 0, last_reminder: null, customer_block: null });
  const d: Dashboard = { today: '2026-11-08', totals: {} as Dashboard['totals'], invoices: [row(1), row(2), row(3), row(4)] };
  const m = fromDashboard(d, [
    { id: 7, invoice_id: 1, invoice_ids: [1, 2, 3], block_reason: null, invoice_count: 3, total_text: '1,200 ₪ + $500' },
    { id: 8, invoice_id: 4, invoice_ids: [4], block_reason: null, invoice_count: 1, total_text: '24.90 ₪' },
    ]);
  assert.deepEqual(m.pendingBy.get('1'), { reminderId: 7, block: null, count: 3, totalText: '1,200 ₪ + $500' });
  // חשבונית אחת ⇒ בדיוק כמו קודם (אין count ⇒ הממשק מציג את סכום החשבונית)
  assert.deepEqual(m.pendingBy.get('4'), { reminderId: 8, block: null });
  // שרת ישן בלי השדות ⇒ כמו קודם
  assert.deepEqual(fromDashboard(d, [{ id: 7, invoice_id: 1, block_reason: null }]).pendingBy.get('1'), { reminderId: 7, block: null });
  const mp = readFileSync(new URL('../src/components/MessagePreview.tsx', import.meta.url), 'utf8');
  assert.match(mp, /pv\?\.needs_confirm_open \?\? invoice\.source === 'csv'/);
  assert.doesNotMatch(mp, /cta\} · \{fmtMoney\(invoice\.amount/);
  const main = readFileSync(new URL('../../app/main.py', import.meta.url), 'utf8');
  assert.match(main, /"invoice_ids": ids, \*\*svc\.reminder_totals\(/);
});

test('הפעלה 136: עמוד החשבוניות — חשבונית שכלולה בתזכורת מאוחדת ואינה העוגן מסומנת ומפנה לעוגן', () => {
  const row = (id: number): Dashboard['invoices'][0] => ({
    invoice_id: id, number: String(2000 + id), customer: 'גל', phone: '053-0000007', email: '', amount_agorot: 2490, currency: 'ILS',
    due: '2026-10-01', status: 'open', days_overdue: 38, reminders_sent: 0, last_reminder: null, customer_block: null });
  const d: Dashboard = { today: '2026-11-08', totals: {} as Dashboard['totals'], invoices: [row(1), row(2), row(3), row(4)] };
  const m = fromDashboard(d, [
    { id: 7, invoice_id: 1, invoice_ids: [1, 2, 3], block_reason: null, invoice_count: 3, total_text: '74.70 ₪' },
    { id: 8, invoice_id: 4, invoice_ids: [4], block_reason: null, invoice_count: 1, total_text: '24.90 ₪' },
  ]);
  // 2 ו-3 מפנות לעוגן 1; העוגן עצמו וחשבונית יחידה לא מסומנים
  assert.deepEqual([...m.mergedBy], [['2', '1'], ['3', '1']]);
  // שרת ישן בלי invoice_ids ⇒ אין סימון, כמו קודם
  assert.equal(fromDashboard(d, [{ id: 7, invoice_id: 1, block_reason: null }]).mergedBy.size, 0);
  const page = readFileSync(new URL('../src/pages/Invoices.tsx', import.meta.url), 'utf8');
  assert.match(page, /live \? mergedAnchorOf\(i\.id\)/);          // רק בחי: במוק אין תזכורות מאוחדות
  assert.match(page, /data-testid="in-merged" onClick=\{\(\) => setOpen\(anchor\)\}/);   // הלחיצה פותחת את תזכורת העוגן
});

const page0 = () => readFileSync(new URL('../src/pages/Invoices.tsx', import.meta.url), 'utf8');
test('הפעלה 137: עמודת «תזכורות» — המועד והערוץ של מה שיצא בפועל, לא של הטיוטה שבתור', async () => {
  const { sentChannels } = await import('../src/lib/stats.ts');
  const row = (id: number, extra: Partial<Dashboard['invoices'][0]>): Dashboard['invoices'][0] => ({
    invoice_id: id, number: String(1000 + id), customer: 'דנה', phone: '050-1234567', email: 'd@example.com', amount_agorot: 120000, currency: 'ILS',
    due: '2026-10-01', status: 'open', days_overdue: 45, reminders_sent: 1, customer_block: null,
    last_reminder: { id: 9, step: 1, status: 'pending_approval', template_key: 'plan_offer', sent_at: null, block_reason: null }, ...extra });
  const d: Dashboard = { today: '2026-11-15', totals: {} as Dashboard['totals'], invoices: [
    row(1, { last_sent: { sent_at: '2026-11-08T10:00:00+02:00', channels: ['email'] } }),
    row(2, { last_sent: { sent_at: '2026-11-08T10:00:00+02:00', channels: ['email', 'sms'] } }),
    row(3, { last_sent: { sent_at: null, channels: [], unknown: true } }), // send_unknown: נספרת, המועד לא ידוע
    row(4, {}),                                                       // שרת ישן בלי last_sent
  ] };
  const [a, b, c, old] = fromDashboard(d, []).invoices;
  // הבאג: שלב 2 בתור (sent_at ריק) ⇒ «אחרונה 15.11» (היום). עכשיו: מועד השליחה של שלב 1
  assert.equal(a.reminders.at(-1)?.at, '2026-11-08');
  assert.deepEqual(sentChannels(a), ['email']);                       // לא 📱 ללקוח שקיבל מייל בלבד
  assert.deepEqual(sentChannels(b), ['email', 'sms']);
  assert.equal(c.reminders.at(-1)?.at, '');                           // לא ממציאים תאריך
  assert.deepEqual(c.lastSent, { at: null, channels: [], unknown: true });
  // critic סבב 53: ניסיון שנקטע ⇒ לא ממציאים 📱 (נפילה ל-reminders.at(-1).channel = 'sms')
  assert.deepEqual(sentChannels(c), []);
  assert.match(page0(), /lastSent\?\.unknown \? <span[^>]*>\{i\.reminders\.length\} · אחרונה: לא ידוע אם יצאה/);
  assert.equal(old.reminders.at(-1)?.at, '2026-11-15');               // שרת ישן: בלי שינוי
  assert.equal(old.lastSent, undefined);
  assert.deepEqual(sentChannels(old), ['sms']);
  const page = readFileSync(new URL('../src/pages/Invoices.tsx', import.meta.url), 'utf8');
  assert.match(page, /last\.at && <> · אחרונה/);                       // בלי מועד ⇒ בלי «אחרונה»
});

// הפעלה 140: מצב המוק מספר את אותו סיפור כמו ההדגמה של השרת — לקוח בחו״ל שילם $500, והדולר מוצג ליד ה-₪ ולא מחובר אליו
import { mockOtherCurrency } from '../src/lib/stats.ts';
test('מוק: mockOtherCurrency = מראה של _other_currency בשרת (פתוח/באיחור/בסיכון/נגבה, לכל מטבע בנפרד)', () => {
  const mk = (id: string, amount: number, currency: string | undefined, dueAt: string, status: 'open' | 'paid'): (typeof demoInvoices)[number] =>
    ({ ...demoInvoices[0], id, amount, dueAt, status, reminders: [], ...(currency ? { currency } : {}) }) as (typeof demoInvoices)[number];
  const list = [
    mk('a', 1000, undefined, '2026-10-01', 'open'),      // ₪ ⇒ לא נכנס
    mk('b', 500, 'USD', '2026-10-12', 'paid'),            // נגבה
    mk('c', 200.5, 'USD', '2026-11-01', 'open'),          // באיחור 5 ימים
    mk('d', 300, 'USD', '2026-08-01', 'open'),            // 97 ימים ⇒ גם בסיכון
    mk('e', 20.5, 'EUR', '2026-12-01', 'open'),           // עוד לא הגיע מועד
  ];
  assert.deepEqual(mockOtherCurrency(list, DEMO_TODAY), [
    { currency: 'EUR', open_invoices: 1, open_agorot: 2050, overdue_agorot: 0, at_risk_agorot: 0, collected_agorot: 0 },
    { currency: 'USD', open_invoices: 2, open_agorot: 50050, overdue_agorot: 50050, at_risk_agorot: 30000, collected_agorot: 50000 },
  ]);
  assert.deepEqual(mockOtherCurrency([list[0]], DEMO_TODAY), []);
  // בדיוק 60 יום איחור אינו «בסיכון» (השרת: days_overdue > 60)
  assert.equal(mockOtherCurrency([mk('f', 10, 'USD', '2026-09-07', 'open')], DEMO_TODAY)[0].at_risk_agorot, 0);
});
test('מוק: נתוני הדמו כוללים את הלקוח בדולר, ו-$500 לא מחובר לשום סכום ב-₪', () => {
  const usd = demoInvoices.find(i => i.number === '2010')!;
  assert.equal(usd.currency, 'USD'); assert.equal(usd.status, 'paid');
  const cust = demoCustomers.find(c => c.id === usd.customerId)!;
  assert.ok(cust.email && !cust.phone, 'לקוח בחו״ל: מייל בלבד, כמו בהדגמה של השרת');
  assert.ok(usd.reminders.every(r => r.channel === 'email'), 'בלי טלפון אין SMS');
  const oc = mockOtherCurrency(demoInvoices, DEMO_TODAY);
  assert.deepEqual(oc, [{ currency: 'USD', open_invoices: 0, open_agorot: 0, overdue_agorot: 0, at_risk_agorot: 0, collected_agorot: 50000 }]);
  assert.equal(plusOther(oc, 'collected_agorot'), 'ועוד $500');
  assert.equal(plusOther(oc, 'open_agorot'), '');
  // ה-KPI והגיול ב-₪ לא זזו מהוספת החשבונית בדולר
  const without = demoInvoices.filter(i => i !== usd);
  assert.deepEqual(kpis(demoInvoices, DEMO_TODAY), kpis(without, DEMO_TODAY));
  assert.deepEqual(agingBuckets(demoInvoices, DEMO_TODAY), agingBuckets(without, DEMO_TODAY));
  const dash = readFileSync(new URL('../src/pages/Dashboard.tsx', import.meta.url), 'utf8');
  assert.match(dash, /live \? t\?\.other_currency : mockOtherCurrency\(invoices, today\)/);
});
test('הפעלה 140: בזמן טעינה (mode=loading) המסכים לא מציגים את נתוני המוק', () => {
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  assert.match(app, /mode === 'loading' \? <div role="status" data-testid="app-loading"/);
  // דף הנחיתה, ההרשמה ומסך הכניסה לא ממתינים לשרת
  assert.match(app, /r === 'landing' \? <Landing \/> : r === 'signup' \? <Signup \/> : r === 'login' \|\| mode === 'locked' \? <Login \/>/);
});
test('הפעלה 141: טעינה שנכשלה ⇒ מצב error עם «נסו שוב», לא נפילה שקטה לנתוני המוק', () => {
  const store = readFileSync(new URL('../src/store.tsx', import.meta.url), 'utf8');
  // אחרי ש-/health ענה: כשל שאינו 401 ⇒ error (היה: mock)
  assert.match(store, /set\(e instanceof AuthError \? 'locked' : 'error'\)/);
  assert.doesNotMatch(store, /AuthError \? 'locked' : 'mock'/);
  // אין שרת: מוק רק כשאין כניסה שמורה בלשונית
  assert.match(store, /if \(!h\) \{ set\(tok \? 'error' : 'mock'\); return; \}/);
  // התור של המוק (התג בניווט) רק במצב מוק
  assert.match(store, /mode === 'mock' \? needsReminder\(invoices, today\) : \[\]/);
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  assert.match(app, /: mode === 'error' \? <LoadError \/>\s*: r === 'dashboard'/);
  assert.match(app, /role="alert" data-testid="app-error"/);
  const shell = readFileSync(new URL('../src/components/Shell.tsx', import.meta.url), 'utf8');
  assert.match(shell, /mode === 'loading' \|\| mode === 'error' \? '…'/);
});
test('הפעלה 142: רענון שנכשל במצב חי ⇒ stale ופס «הנתונים לא עודכנו»; קוד גישה מבחין בין 401 לכשל שרת', () => {
  const store = readFileSync(new URL('../src/store.tsx', import.meta.url), 'utf8');
  // רענון מוצלח מנקה את הסימון; כשל שאינו 401 במצב חי מדליק אותו
  assert.match(store, /if \(await load\(\)\) \{ setStale\(false\); setDataSeq\(n => n \+ 1\); \}/);
  assert.match(store, /else if \(modeRef\.current === 'live' && seq === loadSeq\.current\) setStale\(true\);/);
  // הפעלה 143: תשובה של רענון ישן לא דורסת רענון חדש יותר
  assert.match(store, /if \(my !== loadSeq\.current\) return false;/);
  // יציאה / סשן שפג ⇒ הסימון לא נשאר למסך הכניסה
  assert.match(store, /setStale\(false\); setMode\('locked'\)/);
  // unlock: רק 401 הוא «קוד שגוי»
  assert.match(store, /return e instanceof AuthError \? 'bad' : 'down';/);
  const shell = readFileSync(new URL('../src/components/Shell.tsx', import.meta.url), 'utf8');
  assert.match(shell, /\{mode === 'live' && stale && <StaleBanner \/>\}\{children\}/);
  assert.match(shell, /role="status" data-testid="stale-banner"/);
  const login = readFileSync(new URL('../src/pages/Login.tsx', import.meta.url), 'utf8');
  assert.match(login, /r === 'down'\) setErr\('השרת לא זמין כרגע/);
  // /ui: כשל טעינה לא נבלע
  const ui = readFileSync(new URL('../../app/ui.html', import.meta.url), 'utf8');
  assert.doesNotMatch(ui, /loadDash\(\)\.catch\(\(\)=>\{\}\)/);
  assert.match(ui, /Promise\.allSettled\(\[loadDash\(ask\),api\("\/reminders",\{\},ask\)\]\)/);
  assert.match(ui, /id="loaderr" role="alert" hidden/);
});

test('הפעלה 143: הודעת כשל בעברית בלי קוד HTTP גולמי; כניסה שהטעינה אחריה נכשלה ⇒ מסך השגיאה; רענון שנכשל אחרי פעולה אינו «לא בוצע»', async () => {
  const { failureText, NO_CONNECTION, SERVER_DOWN } = await import('../src/lib/failure.ts');
  assert.equal(failureText(0), NO_CONNECTION);
  for (const [st, d] of [[500, 'Internal Server Error'], [502, ''], [503, 'down'], [504, undefined]] as const) {
    assert.equal(failureText(st, d), SERVER_DOWN);
    assert.doesNotMatch(failureText(st, d), /\d{3}|[A-Za-z]{4,}/, 'בלי קוד או אנגלית');
  }
  // הסבר בעברית מהשרת נשמר, גם ב-5xx
  assert.equal(failureText(503, 'אין מפתח הצפנה (COLLECT_MASTER_KEYS)'), 'אין מפתח הצפנה (COLLECT_MASTER_KEYS)');
  assert.equal(failureText(409, 'התזכורת כבר אושרה'), 'התזכורת כבר אושרה');
  assert.equal(failureText(422, 'payment_link: קישור התשלום חייב להיות בדומיין הספק'), 'payment_link: קישור התשלום חייב להיות בדומיין הספק');
  assert.match(failureText(429, 'Too Many Requests'), /יותר מדי בקשות/);
  assert.match(failureText(404, ''), /הבקשה נכשלה \(שגיאה 404\)/);
  const api = readFileSync(new URL('../src/api.ts', import.meta.url), 'utf8');
  assert.match(api, /throw new ApiError\(failureText\(0, null, write\), 0\); \}/, 'כשל רשת ⇒ ApiError בעברית');
  assert.match(api, /const msg = failureText\(r\.status, detail, write\);/);
  const store = readFileSync(new URL('../src/store.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(store, /return 'הכניסה הצליחה אך הטעינה נכשלה/);
  assert.match(store, /setAuthNote\(null\); setMode\('error'\); return null;/);
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  assert.match(app, /r === 'login' && \(mode === 'live' \|\| mode === 'error'\)\) go\('dashboard'\)/);
  // פעולה שהצליחה: כשל ברענון שאחריה לא נכנס ל-catch של הפעולה
  for (const f of ['pages/Dashboard.tsx', 'pages/Inbox.tsx', 'pages/Settings.tsx']) {
    const src = readFileSync(new URL('../src/' + f, import.meta.url), 'utf8');
    assert.doesNotMatch(src, /await reload\(\);/, f + ': reload בלי catch אחרי פעולה');
  }
  // הגדרות בחי: הטעינה מהשרת לא תלויה ב-mockForm (רענון ברקע דרס הקלדה)
  const st = readFileSync(new URL('../src/pages/Settings.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(st, /api\.settings\(\)[^]*?\}, \[live, mockForm\]\);/);
  assert.match(st, /return \(\) => \{ on = false; \};\n  \}, \[live, dataSeq\]\);/);
  const ui = readFileSync(new URL('../../app/ui.html', import.meta.url), 'utf8');
  assert.match(ui, /id="pverr" role="alert"/);
  assert.doesNotMatch(ui, /throw new Error\(j\.detail\|\|r\.status\)/);
});

test('הפעלה 144: כתיבה שנקטעה ⇒ «לא ידוע אם נרשמה» + רענון אוטומטי; 401 באמצע פעולה ⇒ מסך הכניסה; הגדרות מתמזגות מול השרת', async () => {
  const { failureText, failPrefix, writeOutcomeUnknown, retryDelayMs, WRITE_UNKNOWN, NO_CONNECTION, SERVER_DOWN } = await import('../src/lib/failure.ts');
  // קריאה (GET) נשארת כמו ב-143; כתיבה בלי הסבר מהשרת ⇒ «לא ידוע אם הפעולה נרשמה», בלי «נסו שוב» עיוור
  assert.equal(failureText(0, null, false), NO_CONNECTION);
  assert.equal(failureText(502, '', false), SERVER_DOWN);
  for (const [st, d] of [[0, null], [500, 'Internal Server Error'], [502, ''], [504, undefined]] as const) {
    const m = failureText(st, d, true);
    assert.ok(m.includes(WRITE_UNKNOWN), `${st}: ${m}`);
    assert.doesNotMatch(m, /\d{3}|[A-Za-z]{4,}/, 'בלי קוד או אנגלית');
    assert.equal(writeOutcomeUnknown(st, d), true);
  }
  assert.match(failureText(0, null, true), /^אין חיבור לשרת גבי\. /);
  assert.match(failureText(502, '', true), /^השרת לא זמין כרגע\. /);
  // סירוב מפורש של השרת (עברית / 4xx) = תוצאה ידועה: ההודעה כמו שהיא, בלי «לא ידוע»
  assert.equal(failureText(503, 'אין מפתח הצפנה (COLLECT_MASTER_KEYS)', true), 'אין מפתח הצפנה (COLLECT_MASTER_KEYS)');
  assert.equal(failureText(409, 'התזכורת כבר אושרה', true), 'התזכורת כבר אושרה');
  for (const [st, d] of [[503, 'אין מפתח הצפנה'], [409, 'x'], [422, ''], [404, ''], [429, '']] as const) assert.equal(writeOutcomeUnknown(st, d), false, String(st));
  // «לא בוצע:» לא נכתב כשלא ידוע אם בוצע
  assert.equal(failPrefix('לא בוצע', 'התזכורת כבר אושרה'), 'לא בוצע: התזכורת כבר אושרה');
  assert.equal(failPrefix('לא בוצע', failureText(0, null, true)), failureText(0, null, true));
  assert.doesNotMatch(failPrefix('לא נשמר', failureText(502, '', true)), /לא נשמר/);
  // המתנה גדלה וחסומה (לא מציפים שרת שנפל, ולא מחכים יותר מ-15 שניות)
  assert.deepEqual([0, 1, 2, 3, 4, 99].map(retryDelayMs), [2000, 4000, 8000, 15000, 15000, 15000]);
  assert.equal(retryDelayMs(-1), 2000); assert.equal(retryDelayMs(NaN), 2000);

  const api = readFileSync(new URL('../src/api.ts', import.meta.url), 'utf8');
  assert.match(api, /const write = \(init\?\.method \?\? 'GET'\)\.toUpperCase\(\) !== 'GET';/);
  assert.match(api, /if \(tok\) apiEvents\.authLost\?\.\(\);/, '401 על בקשה עם טוקן ⇒ אירוע ל-store');
  assert.match(api, /catch \{ if \(write\) apiEvents\.writeUnknown\?\.\(\);/);
  assert.match(api, /if \(write && writeOutcomeUnknown\(r\.status, detail\)\) apiEvents\.writeUnknown\?\.\(\);/);
  const store = readFileSync(new URL('../src/store.tsx', import.meta.url), 'utf8');
  // 401 רק במצב חי מפיל את הסשן (לפני כניסה זה «קוד שגוי»); כתיבה לא ידועה מבטלת רענון שבאוויר ומדליקה את הפס
  assert.match(store, /apiEvents\.authLost = \(\) => \{ if \(modeRef\.current === 'live'\) dropSession\(/);
  assert.match(store, /apiEvents\.writeUnknown = \(\) => \{ if \(modeRef\.current === 'live'\) \{ loadSeq\.current\+\+; setStale\(true\); \} \};/);
  assert.match(store, /if \(mode !== 'live' \|\| !stale\) return;/);
  assert.match(store, /window\.addEventListener\('online', now\);/);
  assert.match(store, /if \(off \|\| running\) return;/, 'אין שני רענונים אוטומטיים במקביל');
  for (const f of ['pages/Dashboard.tsx', 'pages/Settings.tsx', 'components/MessagePreview.tsx']) {
    const src = readFileSync(new URL('../src/' + f, import.meta.url), 'utf8');
    assert.doesNotMatch(src, /`לא (בוצע|נשלח|אושר|נשמר): \$\{/, f + ': קידומת «לא בוצע» בלי failPrefix');
  }

  const { mergeServerForm, diffPatch } = await import('../src/lib/settings.ts');
  const base = { business_name: 'סטודיו', owner_name: 'נועה', vat_id: '', reply_email: '', sender: 'Studio', pay_provider: 'greeninvoice', pay_url: '', source_system: 'greeninvoice' } as const;
  // טופס שלא נערך ⇒ מתרענן כולו מהשרת
  const srv = { ...base, owner_name: 'רות', source_system: 'csv' } as const;
  assert.deepEqual(mergeServerForm(base, base, srv), { orig: srv, f: srv });
  // שדה שנערך נשאר; שדה שלא נערך מקבל את ערך השרת; נשלח רק מה שהמשתמש שינה
  const edited = { ...base, reply_email: 'a@example.com' };
  const m = mergeServerForm(base, edited, srv);
  assert.equal(m.f.reply_email, 'a@example.com'); assert.equal(m.f.owner_name, 'רות'); assert.equal(m.f.source_system, 'csv');
  assert.deepEqual(diffPatch(m.orig, m.f), { reply_email: 'a@example.com' });
  // מה שהוקלד כבר נמצא בשרת (כתיבה שהתשובה שלה אבדה) ⇒ אין מה לשמור
  const typed = { ...base, owner_name: 'רות' };
  assert.deepEqual(diffPatch(...Object.values(mergeServerForm(base, typed, { ...base, owner_name: 'רות' })) as [typeof base, typeof base]), {});
  const st = readFileSync(new URL('../src/pages/Settings.tsx', import.meta.url), 'utf8');
  assert.match(st, /if \(!on \|\| my !== reqSeq\.current\) return;/, 'תשובה ישנה לא נכתבת לטופס');
  assert.match(st, /reqSeq\.current\+\+;[^\n]*\n\s*const s = await api\.saveSettings\(patch\);\n\s*reqSeq\.current\+\+;/);
});

test('הפעלה 145: טיוטת ההגדרות שורדת סשן שפג (בזיכרון בלבד) ונמחקת ביציאה יזומה; ה-toast בהגדרות לא על סרגל השמירה', async () => {
  const { formDiff, restoreDraft, settingsDraft, diffPatch } = await import('../src/lib/settings.ts');
  const base = { business_name: 'סטודיו', owner_name: 'דנה', vat_id: '', reply_email: 'a@example.com', sender: 'Studio', pay_provider: 'greeninvoice' as const, pay_url: '', source_system: 'greeninvoice' as const };
  assert.equal(formDiff(base, base), null);
  const edited = { ...base, owner_name: 'רות', pay_url: 'https://pay.example/x' };
  assert.deepEqual(formDiff(base, edited), { owner_name: 'רות', pay_url: 'https://pay.example/x' });
  // השרת השתנה בינתיים: שדה שלא נערך = ערך השרת; שדה מהטיוטה = מה שהוקלד, ונשלח לבדו בשמירה
  const srv = { ...base, business_name: 'סטודיו חדש' };
  const back = restoreDraft(srv, formDiff(base, edited));
  assert.deepEqual(back, { ...srv, owner_name: 'רות', pay_url: 'https://pay.example/x' });
  assert.deepEqual(Object.keys(diffPatch(srv, back)).sort(), ['owner_name', 'pay']);
  assert.deepEqual(restoreDraft(srv, null), srv);
  // מפתח לא מוכר או ערך שאינו מחרוזת לא נכנסים לטופס
  assert.deepEqual(restoreDraft(srv, { owner_name: 5, evil: 'x' } as never), srv);
  assert.deepEqual(settingsDraft, { value: null, keep: false, owner: null });
  const fs = await import('node:fs');
  const store = fs.readFileSync(new URL('../src/store.tsx', import.meta.url), 'utf8');
  assert.match(store, /if \(note\) settingsDraft\.keep = settingsDraft\.value !== null; else \{ settingsDraft\.value = null; settingsDraft\.keep = false; settingsDraft\.owner = null; \}/);
  const lib = fs.readFileSync(new URL('../src/lib/settings.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(lib, /sessionStorage|localStorage/, 'הטיוטה לא נכתבת ל-storage');
  const page = fs.readFileSync(new URL('../src/pages/Settings.tsx', import.meta.url), 'utf8');
  assert.match(page, /if \(mine\) \{ m\.f = restoreDraft\(m\.f, mine\); setRestored\(true\); \}/);
  assert.match(page, /if \(!settingsDraft\.keep\) settingsDraft\.value = null/);
  const app = fs.readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  // הפעלה 148: לא עוד «למעלה בהגדרות» (כיסה את הכותרת) — ה-toast בתחתית ומורם מעל הסרגל הדביק
  assert.doesNotMatch(app, /top-5/);
  assert.match(app, /style=\{\{ bottom: toastAt \}\}/);
  assert.match(app, /querySelector\('\[data-sticky-bar\]'\)/);
  assert.match(readFileSync(new URL('../src/pages/Settings.tsx', import.meta.url), 'utf8'), /data-sticky-bar[^>]*sticky bottom-4/);
  const { toastBottom, TOAST_BOTTOM, TOAST_GAP } = await import('../src/lib/toast.ts');
  assert.equal(toastBottom(null, 800), TOAST_BOTTOM, 'אין סרגל ⇒ המיקום הרגיל');
  assert.equal(toastBottom(728, 800), 72 + TOAST_GAP, 'סרגל דביק ⇒ מעליו, עם רווח');
  assert.equal(toastBottom(600, 800), 200 + TOAST_GAP, 'סרגל גבוה (שורת שגיאה שנשברה לשורות) ⇒ עדיין מעליו');
  assert.equal(toastBottom(900, 800), TOAST_BOTTOM, 'סרגל מתחת לחלון ⇒ המיקום הרגיל');
  assert.equal(toastBottom(-40, 800), TOAST_BOTTOM, 'סרגל שנגלל מעל החלון ⇒ המיקום הרגיל');
  assert.equal(toastBottom(795, 800), TOAST_BOTTOM, 'לעולם לא נמוך מהמיקום הרגיל');
  assert.equal(toastBottom(NaN, 800), TOAST_BOTTOM);
  // טיימר אחד ל-toast: הודעה חדשה מבטלת את הטיימר של הקודמת
  const { toastMs } = await import('../src/lib/toast.ts');
  assert.equal(toastMs('קצר'), 3600); assert.equal(toastMs('א'.repeat(100)), 6000);
  const storeSrc148 = readFileSync(new URL('../src/store.tsx', import.meta.url), 'utf8');
  assert.match(storeSrc148, /window\.clearTimeout\(toastTimer\.current\);\s*setToast\(t\); toastTimer\.current = window\.setTimeout/);
  // /ui (app/ui.html): אותו נוסח «לא ידוע אם נרשמה» כמו ב-/app/, כתיבה שנכשלה לא מציגה «נסו שוב», ו-401 מנקה את המסך
  const { WRITE_UNKNOWN } = await import('../src/lib/failure.ts');
  const ui = fs.readFileSync(new URL('../../app/ui.html', import.meta.url), 'utf8');
  assert.ok(ui.includes(`const WRITE_UNKNOWN="${WRITE_UNKNOWN}";`), 'הנוסח ב-/ui שונה מהנוסח ב-/app/');
  assert.match(ui, /catch\(e\)\{throw write\?unknown\("אין חיבור לשרת גבי"\)/);
  assert.match(ui, /if\(r\.status>=500&&!he&&write\)throw unknown\(/);
  assert.match(ui, /function lock\(had\)\{[^}]*sessionStorage\.removeItem\(TOK\)/);
  assert.match(ui, /RETRY_MS=\[2000,4000,8000,15000\]/);
  assert.match(ui, /if\(!stale\|\|locked\|\|document\.hidden\)return/, 'לשונית ברקע או מסך נעול לא שולחים רענון');
});

test('הפעלה 146: טיוטת ההגדרות מוחזרת רק למי שהקליד אותה; אישור שכבר נרשם (409 + X-Gabi-Already) אינו כשל', async () => {
  const { draftFor } = await import('../src/lib/settings.ts');
  const v = { owner_name: 'רות' };
  assert.deepEqual(draftFor({ value: v, keep: true, owner: 'user:1' }, 'user:1'), v);
  // עובד אחר באותה לשונית, זהות לא ידועה (בהקלדה או בכניסה), או טיוטה שלא סומנה לשמירה ⇒ לא מחזירים
  assert.equal(draftFor({ value: v, keep: true, owner: 'user:1' }, 'user:2'), null);
  assert.equal(draftFor({ value: v, keep: true, owner: 'user:1' }, null), null);
  assert.equal(draftFor({ value: v, keep: true, owner: null }, null), null);
  assert.equal(draftFor({ value: v, keep: true, owner: null }, 'user:1'), null);
  assert.equal(draftFor({ value: v, keep: false, owner: 'user:1' }, 'user:1'), null);
  assert.equal(draftFor({ value: null, keep: true, owner: 'user:1' }, 'user:1'), null);
  const fs = await import('node:fs');
  const page = fs.readFileSync(new URL('../src/pages/Settings.tsx', import.meta.url), 'utf8');
  assert.match(page, /const mine = loaded\.current \? null : draftFor\(settingsDraft, actor\.current\);/);
  assert.match(page, /if \(!loaded\.current && !mine\) settingsDraft\.value = null;/, 'טיוטה של משתמש אחר נמחקת');
  assert.match(page, /settingsDraft\.owner = actor\.current;/);

  const { alreadyDone, ALREADY_APPROVED } = await import('../src/lib/failure.ts');
  assert.equal(alreadyDone({ status: 409, already: 'approved' }, 'approved'), true);
  assert.equal(alreadyDone({ status: 409, already: 'rejected' }, 'approved'), false, 'נדחתה ≠ כבר אושרה');
  assert.equal(alreadyDone({ status: 409, already: null }, 'approved'), false, '409 רגיל (חסימה) נשאר סירוב');
  assert.equal(alreadyDone({ status: 200, already: 'approved' }, 'approved'), false);
  assert.equal(alreadyDone(new Error('x'), 'approved'), false);
  assert.equal(alreadyDone(null, 'approved'), false);
  assert.ok(ALREADY_APPROVED.includes('כבר אושרה'));
  const api = fs.readFileSync(new URL('../src/api.ts', import.meta.url), 'utf8');
  assert.match(api, /new ApiError\(msg, r\.status, r\.status === 409 \? r\.headers\.get\('X-Gabi-Already'\) : null,/);   // הפעלה 149: נוסף פרמטר stale
  const store = fs.readFileSync(new URL('../src/store.tsx', import.meta.url), 'utf8');
  assert.match(store, /catch \(e\) \{ if \(!alreadyDone\(e, 'approved'\)\) throw e; already = true; \}/);
  // /ui: אותה כותרת; כפתורי הכותרת כבויים כשהמסך נעול; אין alert
  const ui = fs.readFileSync(new URL('../../app/ui.html', import.meta.url), 'utf8');
  assert.match(ui, /r\.headers\.get\("X-Gabi-Already"\)/);
  assert.doesNotMatch(ui, /alert\(/, 'ב-/ui לא נשאר alert');
  assert.match(ui, /function hdr\(\)\{/);
});

test('הפעלה 147: «כבר אושרה» גם להצעת פריסה ולטיוטת מענה', async () => {
  const f = await import('../src/lib/failure.ts');
  const fs = await import('node:fs');
  assert.ok(f.ALREADY_PLAN.includes('כבר אושרה') && f.ALREADY_DRAFT.includes('כבר אושר') && f.ALREADY_DRAFT_CLOSED.includes('כבר נסגר'));
  const dash = fs.readFileSync(new URL('../src/pages/Dashboard.tsx', import.meta.url), 'utf8');
  assert.match(dash, /if \(!already \|\| !alreadyDone\(e, already\.want\)\) \{ showFail\(failPrefix\('לא בוצע'/, 'רק 409 עם הכותרת המתאימה אינו כשל');
  assert.match(dash, /api\.approvePlan\([^\n]*\{ want: 'approved', msg: ALREADY_PLAN \}/);
  // חידוש לקוח / סגירת הודעה לא מקבלים את ההקלה (אין להם כותרת)
  assert.equal((dash.match(/msg: ALREADY_/g) ?? []).length, 1);
  const inbox = fs.readFileSync(new URL('../src/pages/Inbox.tsx', import.meta.url), 'utf8');
  assert.match(inbox, /if \(!already \|\| !alreadyDone\(e, already\.want\)\) \{ setErr\(/);
  assert.match(inbox, /api\.approveDraft\([^\n]*\{ want: 'approved', msg: ALREADY_DRAFT \}/);
  assert.match(inbox, /api\.rejectDraft\([^\n]*\{ want: 'rejected', msg: ALREADY_DRAFT_CLOSED \}/);
});

test('הפעלה 149: אישור על נוסח ישן ⇒ התצוגה נטענת מחדש עם מה שהשתנה (המלצת critic סבב 56)', async () => {
  const f = await import('../src/lib/failure.ts');
  const fs = await import('node:fs');
  assert.equal(f.stalePreview({ status: 409, stale: true }), true);
  assert.equal(f.stalePreview({ status: 409, stale: false }), false, '409 רגיל (חסימה, כבר אושרה) נשאר סירוב');
  assert.equal(f.stalePreview({ status: 409 }), false);
  assert.equal(f.stalePreview({ status: 500, stale: true }), false);
  assert.equal(f.stalePreview(new Error('x')), false);
  assert.equal(f.stalePreview(null), false);
  assert.equal(f.staleChangeText('1,200 ₪', '1,500 ₪'), 'הסכום השתנה מ-1,200 ₪ ל-1,500 ₪. זה הנוסח המעודכן. שום דבר לא נשלח. בדקו ואשרו שוב');
  // אותו סכום (השתנה רק הנוסח) או סכום חסר ⇒ לא ממציאים «הסכום השתנה»
  for (const [a, b] of [['1,200 ₪', '1,200 ₪'], [undefined, '1,500 ₪'], ['1,200 ₪', null], ['', ''], [' 1,200 ₪ ', '1,200 ₪']] as const) {
    const t = f.staleChangeText(a, b);
    assert.ok(t.startsWith('הנוסח השתנה מאז שפתחתם.') && !t.includes('הסכום השתנה'), `${a} ⇒ ${b}: ${t}`);
    assert.ok(t.includes('שום דבר לא נשלח') && t.includes('בדקו ואשרו שוב'));
  }
  const api = fs.readFileSync(new URL('../src/api.ts', import.meta.url), 'utf8');
  assert.match(api, /r\.status === 409 && r\.headers\.get\('X-Gabi-Stale'\) === 'preview'\)/);
  const mp = fs.readFileSync(new URL('../src/components/MessagePreview.tsx', import.meta.url), 'utf8');
  assert.match(mp, /if \(stalePreview\(e\) && pending\) \{/);
  assert.match(mp, /setPv\(fresh\); setConfirmOpen\(false\); setConfirmAmount\(false\); setBusy\(false\);/, 'התיבות סומנו על הסכום הישן ⇒ מתנקות');
  assert.match(mp, /if \(fresh\.status === 'pending_approval'\) \{/, 'תזכורת שכבר לא ממתינה ⇒ ההודעה הרגילה');
  assert.match(mp, /role="alert" data-testid="mp-stale"/);
  // /ui: אותו כלל, והנוסח זהה לזה של /app/
  const ui = fs.readFileSync(new URL('../../app/ui.html', import.meta.url), 'utf8');
  const m = /const staleText=\(was,now\)=>(.+);\n/.exec(ui);
  assert.ok(m, 'staleText ב-ui.html');
  const staleText = new Function('was', 'now', `return ${m![1]}`) as (a?: string, b?: string) => string;
  for (const [a, b] of [['1,200 ₪', '1,500 ₪'], ['1,200 ₪', '1,200 ₪'], [undefined, '1,500 ₪']] as const)
    assert.equal(staleText(a, b), f.staleChangeText(a, b), 'נוסח /ui ≠ נוסח /app/');
});
test('הפעלה 150: שלד טעינה ב-/app/ וב-/ui — צורות בלבד, מוסתר מקורא מסך, בלי נתונים בזמן טעינה', () => {
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  assert.match(app, /mode === 'loading' \? <div role="status" data-testid="app-loading"><LoadingSkeleton \/><\/div>/);
  const sk = app.slice(app.indexOf('function LoadingSkeleton'), app.indexOf('function Routed'));
  assert.match(sk, /<span className="sr-only">טוען נתונים…<\/span>/);
  assert.match(sk, /<div aria-hidden="true" data-testid="app-skeleton"/);
  // הכלל של 140: בשלד אין שום נתון או רכיב שמציג נתונים (גם לא מהמוק)
  assert.doesNotMatch(sk, /useApp|invoices|customers|demo|₪|\$\d/);
  const ui = readFileSync(new URL('../../app/ui.html', import.meta.url), 'utf8');
  // השלד מוצג רק בטעינה שהמשתמש יזם (ask) ורק בחלק שעוד לא נטען; רענון רקע לא מחליף נתונים בשלד
  assert.match(ui, /async function load\(ask=true\)\{\n {2}if\(ask&&!locked\)skel\(\);/);
  assert.match(ui, /function skel\(\)\{if\(got\.d&&got\.q\)return;/);
  // מסך נעול ⇒ got מתאפס (אחרי כניסה מחדש שוב שלד), ו-aria-busy יורד
  assert.match(ui, /function lock\(had\)\{[^\n]*got=\{d:false,q:false\};busyOff\(\);/);
  // טעינה ראשונה שנכשלה ⇒ «לא נטענו», לא שלד ולא טבלה ריקה; והפס לא טוען «מה שמוצג» כשאין דבר על המסך
  assert.match(ui, /else if\(!got\.d\)\{\$\("#kpis"\)\.innerHTML="";/);
  assert.match(ui, /got\.d\|\|got\.q\?"מה שמוצג כאן אולי לא עדכני\.":"עדיין אין נתונים להצגה\."/);
  assert.match(ui, /@media \(prefers-reduced-motion:reduce\)\{\.sk\{animation:none\}\}/);
});

test('הפעלה 151: הודעת כשל ב-/app/ נשארת עד סגירה ידנית (✕ נגיש / Escape); הודעת הצלחה עדיין נעלמת לבד', () => {
  const store = readFileSync(new URL('../src/store.tsx', import.meta.url), 'utf8');
  // showFail: בלי טיימר. הטיימר של הודעה קודמת מבוטל, אחרת הוא היה מוחק את הודעת הכשל
  const fail = store.match(/const showFail = useCallback\(\(t: string\) => \{([^\n]*)\}, \[\]\);/);
  assert.ok(fail, 'showFail לא נמצא');
  assert.match(fail![1], /window\.clearTimeout\(toastTimer\.current\)/);
  assert.doesNotMatch(fail![1], /setTimeout/, 'הודעת כשל לא נעלמת בטיימר');
  assert.match(fail![1], /setSticky\(true\)/);
  // הודעה רגילה שבאה אחרי כשל מחליפה אותו ואינה «דביקה»
  assert.match(store, /toastTimer\.current = window\.setTimeout\(\(\) => setToast\(null\), toastMs\(t\)\);\s*setSticky\(false\);/);
  // יציאה / סשן שפג: הודעת כשל (עם שם לקוח או סכום) לא נשארת מעל מסך הכניסה
  assert.match(store, /closeToast\(\);[^\n]*\n\s*setMe\(null\)/);
  assert.match(store, /if \(mode === 'locked' && toastSticky\) closeToast\(\)/);
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  assert.match(app, /data-sticky role="alert"/);
  assert.match(app, /data-testid="toast-close" aria-label="סגירת ההודעה" onClick=\{closeToast\}/);
  assert.match(app, /size-11/, 'יעד מגע של 44px');
  assert.match(app, /e\.stopImmediatePropagation\(\); closeToast\(\)/, 'Escape סוגר את ההודעה לפני החלון');
  assert.match(app, /addEventListener\('keydown', k, true\)/);
  // כל הודעת «לא …:» של פעולה שנכשלה עוברת דרך showFail, לא דרך showToast
  for (const f of ['../src/components/MessagePreview.tsx', '../src/pages/Dashboard.tsx', '../src/pages/Inbox.tsx', '../src/pages/Settings.tsx']) {
    const src = readFileSync(new URL(f, import.meta.url), 'utf8');
    assert.doesNotMatch(src, /showToast\(failPrefix\(/, f + ': הודעת כשל שנעלמת לבד');
  }
  assert.equal((readFileSync(new URL('../src/pages/Dashboard.tsx', import.meta.url), 'utf8').match(/showFail\(failPrefix\(/g) ?? []).length, 2);
  assert.match(readFileSync(new URL('../src/components/MessagePreview.tsx', import.meta.url), 'utf8'), /showFail\(failPrefix\('לא אושר'/);
});
