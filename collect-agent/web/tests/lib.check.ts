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
  const steps = [...py.matchAll(/Step\("(\w+)",([\s\S]*?)\)(?:,\n|\n\))/g)];
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
import { roi, GABI_PRICE } from '../src/lib/roi.ts';
import { toBars, cumulative, areaPath } from '../src/lib/series.ts';
import { takeTokenFromHash, payCodeOf, TOKEN_KEY } from '../src/lib/auth.ts';

test('מחשבון החזר: שקוף, מוגבל, ומול ₪119', () => {
  const r = roi({ monthlyInvoiced: 40000, latePct: 25, hoursChasing: 4 });
  assert.equal(r.lateAmount, 10000); assert.equal(r.recovered, 3000); assert.equal(r.timeSaved, 600);
  assert.equal(r.net, 3000 + 600 - GABI_PRICE); assert.equal(r.multiple, 30.3);
  const z = roi({ monthlyInvoiced: -5, latePct: 500, hoursChasing: 0 });
  assert.equal(z.lateAmount, 0); assert.ok(z.net < 0, 'בלי חוב — לא ממציאים החזר');
  assert.equal(roi({ monthlyInvoiced: NaN, latePct: NaN }).recovered, 0);
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
  assert.ok(['bit:', 'apple_pay:', 'card:'].every(k => pay.includes(k)), 'Bit · Apple Pay · כרטיס');
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

import { BRAND as LOGO_BRAND, GLYPH, PUBLIC_FILES, markInner } from '../src/brand/logo.ts';
import { readdirSync } from 'node:fs';
test('לוגו: מקור יחיד, עין navy תמיד, אריח קרם על רקע כהה, קבצים ציבוריים מסונכרנים', () => {
  // עין navy בלבד — גם בגרסת האריח (הכרעת מאיר: לא מחליפים לקרם על רקע כהה)
  assert.match(GLYPH, new RegExp(`<circle[^>]*fill="${LOGO_BRAND.navy}"`));
  assert.ok(!GLYPH.includes(LOGO_BRAND.cream), 'הסמל עצמו לא משתמש בקרם');
  assert.ok(markInner(true).startsWith(`<rect`) && markInner(true).includes(LOGO_BRAND.cream), 'אריח קרם');
  assert.ok(!markInner(false).includes('<rect'));
  // הקבצים ב-public = מה שהמקור מייצר (npm run logo)
  for (const [name, svg] of Object.entries(PUBLIC_FILES))
    assert.equal(readFileSync(new URL(`../public/${name}`, import.meta.url), 'utf8'), svg, `public/${name} סטה מ-brand/logo.ts — הריצו npm run logo`);
  // אין עותק שני של הצורה בקוד
  const walk = (d: URL): string[] => readdirSync(d, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? walk(new URL(`${e.name}/`, d)) : [new URL(e.name, d).pathname]);
  const copies = walk(new URL('../src/', import.meta.url)).filter(f => !f.endsWith('brand/logo.ts'))
    .filter(f => readFileSync(f, 'utf8').includes('M22 13h12'));
  assert.deepEqual(copies, [], 'עותק נוסף של הלוגו: ' + copies.join(', '));
});
