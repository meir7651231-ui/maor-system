import { test } from 'node:test';
import assert from 'node:assert/strict';
import { daysOverdue, fmtIls, fmtPhone, isIlMobile, agingOf } from '../src/lib/format.ts';
import { buildSms, buildEmail, smsSegments, nextStep, requiresApproval, demoUnsubUrl, TEMPLATES } from '../src/lib/message.ts';
import { readFileSync } from 'node:fs';
import { canSendAt, nextAllowed } from '../src/lib/policy.ts';
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

test('כל SMS בכל שלב כולל קישור תשלום ושורת הסרה, ובלי מילות שיווק', () => {
  for (const step of ['friendly', 'second', 'plan_offer', 'final'] as const) {
    const s = buildSms(inv, cust, demoBusiness, step);
    assert.ok(s.includes(inv.payUrl), step);
    assert.ok(s.endsWith(demoUnsubUrl(cust)), step);
    assert.ok(s.startsWith(demoBusiness.name + ':'), 'מזהה את העסק');
    assert.doesNotMatch(s, /מבצע|הנחה|הטבה|מתנה|קופון|הזדמנות|הוצאה לפועל|תביעה|משטרה|עו"ד|עורך דין/, step);
    assert.ok(smsSegments(s).segments <= 4, `${step}: ${smsSegments(s).chars} תווים`);
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
  assert.equal(nextStep(inv), 'plan_offer'); // 2 נשלחו
  const auto = { ...demoBusiness, autoApprove: true };
  assert.ok(requiresApproval('final', auto, false), 'אחרונה תמיד באישור');
  assert.ok(requiresApproval('friendly', auto, true), 'ראשונה ללקוח תמיד באישור');
  assert.ok(!requiresApproval('second', auto, false));
});

test('מדיניות שעות — תואם policy.py', () => {
  const d = (s: string) => new Date(s);
  assert.ok(canSendAt(d('2026-11-08T10:00'))); // ראשון
  assert.ok(!canSendAt(d('2026-11-08T19:00')));
  assert.ok(canSendAt(d('2026-11-13T11:59'))); // שישי
  assert.ok(!canSendAt(d('2026-11-13T12:00')));
  assert.ok(!canSendAt(d('2026-11-14T10:00'))); // שבת
  assert.equal(+nextAllowed(d('2026-11-13T15:00')), +d('2026-11-15T09:00')); // שישי אחה"צ ⇒ ראשון 9:00
  assert.equal(+nextAllowed(d('2026-11-09T07:30')), +d('2026-11-09T09:00'));
  assert.ok(!canSendAt(d('2026-11-09T10:00'), new Set(['2026-11-09'])), 'חג');
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
  assert.equal(steps.length, 4);
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
