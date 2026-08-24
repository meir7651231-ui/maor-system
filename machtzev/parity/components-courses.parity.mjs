#!/usr/bin/env node
/** 🥇 רתמת-זהב · מודול-החוגים — הישן (maor/src/components/courses/lib.ts, מתורגם-חי
 *  עם normSearch/termOf/isoLocal האמיתיים) ≡ החדש (Genesis new/boxes/components-courses.mjs)
 *  על קורפוס-LCG דטרמיניסטי seed=20260824. אפס-סטייה · בלי Date.now (שעון-קפוא/מוזרק). */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert';

const require = createRequire('/home/user/maor-system/');
const ts = require('typescript');
const M = '/home/user/maor-system/src';
const tdir = fs.mkdtempSync(path.join(os.tmpdir(), 'crs-'));
const opt = { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } };
const emit = (name, src) => fs.writeFileSync(path.join(tdir, name), ts.transpileModule(src, opt).outputText);
const lines = (p) => fs.readFileSync(p, 'utf8').split('\n');

// ── שקעי-הריצה האמיתיים של lib.ts (חתכי-מקור צרים, ביט-זהים לאטומים) ──
emit('validate.mjs', lines(`${M}/lib/validate.ts`).slice(50, 59).join('\n'));   // normSearch
emit('config.mjs',   lines(`${M}/lib/config.ts`).slice(118, 126).join('\n'));   // termOf
emit('dateutil.mjs', lines(`${M}/lib/date-util.ts`).slice(8, 17).join('\n'));   // isoToday+isoLocal
// lib.ts המלא — ייבוא-types נמחק; ייבוא-הריצה מנותב לחתכים
emit('lib.mjs', fs.readFileSync(`${M}/components/courses/lib.ts`, 'utf8')
  .replace("from '../../lib/validate'", "from './validate.mjs'")
  .replace("from '../../lib/config'", "from './config.mjs'")
  .replace("from '../../lib/date-util'", "from './dateutil.mjs'"));

const OLD = await import(pathToFileURL(path.join(tdir, 'lib.mjs')).href);
const NEW = await import('/home/user/-ai-chat-server/new/boxes/components-courses.mjs');

// ── שעון-קפוא ל-ageOf/isoToday של המקור (הקוראים new Date() ישירות) ──
const FIXED = new Date('2026-08-24T12:00:00');
const RealDate = Date;
const freeze = () => { global.Date = class extends RealDate { constructor(...a) { if (a.length === 0) super(FIXED.getTime()); else super(...a); } static now() { return FIXED.getTime(); } }; };
const unfreeze = () => { global.Date = RealDate; };

// ── קורפוס-LCG ──
let s = 20260824;
const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const pick = (a) => a[Math.floor(rnd() * a.length)];
const J = (x) => JSON.stringify(x);

const DATES = ['2000-06-15', '2010-12-31', '2018-02-28', '2026-08-24', '2025-09-01', '2027-07-31', '1999-01-01', ''];
const MODELS = ['month', 'punch', 'half_year', 'year'];
const TERMS = ['once', 'weekly', 'biweekly', 'monthly', 'months', 'half_year', 'year'];
const TIERS = ['', '1', '2', '3'];
const UNITS = ['week', 'month'];
const STATUS = ['active', 'paused', 'ended', 'wait'];
const GRADES = ['גן', 'א', 'ד', 'כיתה ג׳', 'יב', 'ה', '', 'לא-מזוהה', undefined];
const GENDERS = ['m', 'f', 'all', undefined];
const AUD = ['4 קבוצות', '2 פעמים', '1 קבוצות', '20 קבוצות', 'ללא', '', undefined];
const NAMES = ['כהן', 'בן דוד', 'בןדוד', 'לוי', 'מזרחי', '', 'abramov'];
const QUERIES = ['', ' ', 'a', 'כהן', 'בן דוד', 'בןדוד', 'לוי', 'זז'];

const genSession = (i) => ({ day: Math.floor(rnd() * 6), time: pick(['17:00', '10:30', '18:15', '']), label: rnd() < 0.3 ? 'ק' + i : '' });
const genCourse = (id) => {
  const model = pick(MODELS);
  const c = {
    id, name: pick(['גיטרה', 'ציור', '']), weekday: Math.floor(rnd() * 6), time: pick(['17:00', '', '09:00']),
    model, size: 1 + Math.floor(rnd() * 20), roomId: 'r' + Math.floor(rnd() * 3),
    lessonPrice: Math.floor(rnd() * 120), perLesson: rnd() < 0.6,
  };
  if (rnd() < 0.4) c.sessions = Array.from({ length: 1 + Math.floor(rnd() * 3) }, (_, i) => genSession(i));
  if (rnd() < 0.4) c.lessonPrice1 = Math.floor(rnd() * 100);
  if (rnd() < 0.3) { c.lessonPrice2 = Math.floor(rnd() * 100); c.price2Name = pick(['נזקק', '']); }
  if (rnd() < 0.2) c.lessonPrice3 = Math.floor(rnd() * 100);
  if (rnd() < 0.5) { c.gradeMin = pick(GRADES); c.gradeMax = pick(GRADES); }
  if (rnd() < 0.5) { c.ageMin = Math.floor(rnd() * 10); c.ageMax = 10 + Math.floor(rnd() * 10); }
  if (rnd() < 0.5) c.gender = pick(GENDERS);
  if (rnd() < 0.4) c.teacherId = 't' + Math.floor(rnd() * 3);
  return c;
};
const genEnroll = (id, courseId, memberId) => {
  const e = {
    id, courseId, memberId, status: pick(STATUS), plan: pick(MODELS), purchased: Math.floor(rnd() * 20),
    absences: Array.from({ length: Math.floor(rnd() * 3) }, () => ({ date: pick(DATES.filter(Boolean)), reason: pick(['מחלה', '']), makeup: rnd() < 0.5, ...(rnd() < 0.3 ? { makeupDate: pick(DATES.filter(Boolean)) } : {}) })),
    payments: Array.from({ length: Math.floor(rnd() * 3) }, () => ({ amount: rnd() < 0.2 ? NaN : Math.floor(rnd() * 300) })),
    presents: Array.from({ length: Math.floor(rnd() * 4) }, () => pick(DATES.filter(Boolean))),
    totalDue: Math.floor(rnd() * 400), enrolledAt: pick(DATES),
  };
  if (rnd() < 0.3) e.paidFull = true;
  if (rnd() < 0.5) { e.freq = 1 + Math.floor(rnd() * 4); e.freqUnit = pick(UNITS); e.term = pick(TERMS); e.tier = pick(TIERS); }
  if (rnd() < 0.3) e.termMonths = 1 + Math.floor(rnd() * 10);
  return e;
};
const genDb = () => {
  const nFam = 1 + Math.floor(rnd() * 3);
  const families = Array.from({ length: nFam }, (_, i) => ({ id: 'f' + i, name: pick(NAMES), members: Array.from({ length: 1 + Math.floor(rnd() * 3) }, (_, j) => ({ id: `f${i}m${j}`, first: pick(['בני', 'שרה']) })) }));
  const members = families.flatMap((f) => f.members.map((m) => m.id));
  const rooms = Array.from({ length: 1 + Math.floor(rnd() * 3) }, (_, i) => ({ id: 'r' + i, active: rnd() < 0.8, slot: rnd() < 0.5 ? 60 : 45, name: 'חדר' + i }));
  const courses = Array.from({ length: 1 + Math.floor(rnd() * 4) }, (_, i) => genCourse('c' + i));
  const enrollments = Array.from({ length: Math.floor(rnd() * 8) }, (_, i) => genEnroll('e' + i, pick(courses).id, pick(members)));
  return { families, members, rooms, courses, enrollments };
};

let n = 0;
for (let iter = 0; iter < 300; iter++) {
  const db = genDb();
  const NOW = new RealDate(2026, 7, 24, 17, 30); // שני 2026-08-24 17:30 (מוזרק לשני הצדדים)

  // 1) תאריכים / גיל (שעון קפוא ל-OLD, מוזרק ל-NEW)
  for (const iso of DATES) {
    assert.strictEqual(NEW.fmtDate(iso), OLD.fmtDate(iso), 'fmtDate ' + iso); n++;
    freeze(); const oa = OLD.ageOf(iso); unfreeze();
    assert.strictEqual(NEW.ageOf(iso, FIXED), oa, 'ageOf ' + iso); n++;
  }
  { const t = pick(['2026-08-24', '2026-07-15', '2026-09-01', '2026-01-01', '2025-12-31']);
    assert.strictEqual(J(NEW.defaultCourseDates(t)), J(OLD.defaultCourseDates(t)), 'defaultCourseDates ' + t); n++; }
  { freeze(); const oi = OLD.isoToday(); unfreeze();
    assert.strictEqual(NEW.isoToday(FIXED), oi, 'isoToday'); n++; }
  for (const [a, b] of [['2026-09-01', '2026-08-01'], ['2026-01-01', '2026-02-01'], ['', ''], ['2026-05-01', '2026-05-01']]) {
    const cfg = rnd() < 0.5 ? { terms: { 'entity.course': pick(['חוגון', '', '  ']) } } : undefined;
    assert.strictEqual(NEW.courseDateError(a, b, cfg), OLD.courseDateError(a, b, cfg), 'courseDateError ' + a + '|' + b); n++;
  }

  // 2) פר-חוג
  for (const c of db.courses) {
    assert.strictEqual(J(NEW.sessionsOf(c)), J(OLD.sessionsOf(c)), 'sessionsOf'); n++;
    assert.strictEqual(J(NEW.groupOptionsOf(c)), J(OLD.groupOptionsOf(c)), 'groupOptionsOf'); n++;
    assert.strictEqual(NEW.priceSuffix(c.model), OLD.priceSuffix(c.model), 'priceSuffix'); n++;
    assert.strictEqual(NEW.planWord(c.model), OLD.planWord(c.model), 'planWord'); n++;
    assert.strictEqual(J(NEW.modelMeta(c)), J(OLD.modelMeta(c)), 'modelMeta'); n++;
    assert.strictEqual(J(NEW.lessonTierOptions(c)), J(OLD.lessonTierOptions(c)), 'lessonTierOptions'); n++;
    for (const tier of TIERS) { assert.strictEqual(NEW.lessonPriceForTier(c, tier), OLD.lessonPriceForTier(c, tier), 'lessonPriceForTier'); n++; }
    // התאמת-חבר (מגדר/גיל/כיתה)
    const g = pick(GENDERS), age = rnd() < 0.3 ? null : Math.floor(rnd() * 20), grade = pick(GRADES);
    assert.strictEqual(NEW.courseFitsMember(c, g, age, grade), OLD.courseFitsMember(c, g, age, grade), 'courseFitsMember'); n++;
    assert.strictEqual(NEW.gradeFits(c, grade), OLD.gradeFits(c, grade), 'gradeFits'); n++;
    // מפגש-הבא (now מוזרק לשני הצדדים)
    assert.strictEqual(J(NEW.nextSessionDate(c, NOW)), J(OLD.nextSessionDate(c, NOW)), 'nextSessionDate'); n++;
    // תמחור-משוקלל
    const opts = { freq: 1 + Math.floor(rnd() * 4), unit: pick(UNITS), term: pick(TERMS), months: 1 + Math.floor(rnd() * 8), tier: pick(TIERS) };
    assert.strictEqual(J(NEW.weightedQuote(c, opts)), J(OLD.weightedQuote(c, opts)), 'weightedQuote'); n++;
    // enrollCount + duplicateCourse
    assert.strictEqual(NEW.enrollCount(db, c.id), OLD.enrollCount(db, c.id), 'enrollCount'); n++;
    assert.strictEqual(J(NEW.duplicateCourse(c, 'dup', { start: '2027-09-01', end: '2028-07-31' })), J(OLD.duplicateCourse(c, 'dup', { start: '2027-09-01', end: '2028-07-31' })), 'duplicateCourse'); n++;
    // רשימות פר-חוג
    assert.strictEqual(J(NEW.waitlistFor(db.enrollments, c.id)), J(OLD.waitlistFor(db.enrollments, c.id)), 'waitlistFor'); n++;
    assert.strictEqual(J(NEW.sheetRoster(db.enrollments, c.id)), J(OLD.sheetRoster(db.enrollments, c.id)), 'sheetRoster'); n++;
    const roster = NEW.sheetRoster(db.enrollments, c.id);
    const sDate = pick(DATES.filter(Boolean));
    assert.strictEqual(J(NEW.sheetSummary(roster, sDate)), J(OLD.sheetSummary(roster, sDate)), 'sheetSummary'); n++;
  }

  // 3) פר-שיבוץ (כספים/סטטוס/תוויות/תמחור-משיבוץ)
  for (const e of db.enrollments) {
    assert.strictEqual(NEW.paidOf(e), OLD.paidOf(e), 'paidOf'); n++;
    assert.strictEqual(NEW.payBal(e), OLD.payBal(e), 'payBal'); n++;
    assert.strictEqual(NEW.enrollmentPaidStatus(e), OLD.enrollmentPaidStatus(e), 'enrollmentPaidStatus'); n++;
    assert.strictEqual(J(NEW.enrollStatusMeta(e)), J(OLD.enrollStatusMeta(e)), 'enrollStatusMeta'); n++;
    assert.strictEqual(NEW.planLabelOf(e), OLD.planLabelOf(e), 'planLabelOf'); n++;
    const c = db.courses.find((x) => x.id === e.courseId) || db.courses[0];
    assert.strictEqual(J(NEW.enrollmentQuote(c, e)), J(OLD.enrollmentQuote(c, e)), 'enrollmentQuote'); n++;
  }

  // 4) db-רמה: roomsNow (now מוזרק) · pendingMakeups · scheduleClash · coursesOfTeacher
  assert.strictEqual(J(NEW.roomsNow(db, NOW)), J(OLD.roomsNow(db, NOW)), 'roomsNow'); n++;
  assert.strictEqual(J(NEW.pendingMakeups(db.enrollments)), J(OLD.pendingMakeups(db.enrollments)), 'pendingMakeups'); n++;
  assert.strictEqual(J(NEW.pendingMakeups(db.enrollments, db.courses[0].id)), J(OLD.pendingMakeups(db.enrollments, db.courses[0].id)), 'pendingMakeups פר-חוג'); n++;
  { const tid = rnd() < 0.5 ? 't1' : null; assert.strictEqual(J(NEW.coursesOfTeacher(db.courses, tid)), J(OLD.coursesOfTeacher(db.courses, tid)), 'coursesOfTeacher'); n++; }
  { const mid = pick(db.members), course = pick(db.courses);
    assert.strictEqual(NEW.scheduleClashText(db, mid, course), OLD.scheduleClashText(db, mid, course), 'scheduleClashText'); n++; }

  // 5) groupRemapOnRemoval (Map ⇒ מערך-כניסות)
  { const ss = Array.from({ length: 2 + Math.floor(rnd() * 3) }, (_, i) => genSession(i));
    const idx = Math.floor(rnd() * ss.length);
    const nr = NEW.groupRemapOnRemoval(ss, idx), or = OLD.groupRemapOnRemoval(ss, idx);
    assert.strictEqual(nr.removed, or.removed, 'groupRemap removed'); n++;
    assert.strictEqual(J([...nr.remap.entries()]), J([...or.remap.entries()]), 'groupRemap remap'); n++;
    for (let i = 0; i < ss.length; i++) { assert.strictEqual(NEW.groupLabelOf(ss[i], i), OLD.groupLabelOf(ss[i], i), 'groupLabelOf'); n++; } }

  // 6) שיבוץ-חדש: offerNewFamily / resolveEnrollFamily (normName)
  for (const q of QUERIES) {
    assert.strictEqual(NEW.offerNewFamily(db.families, q), OLD.offerNewFamily(db.families, q), 'offerNewFamily ' + q); n++;
    const sel = pick(['__new', db.families[0].id, 'nope']), nfn = pick(NAMES);
    assert.strictEqual(J(NEW.resolveEnrollFamily(db.families, sel, nfn)), J(OLD.resolveEnrollFamily(db.families, sel, nfn)), 'resolveEnrollFamily'); n++;
  }

  // 7) סקלרים/עזרים חסרי-מצב
  for (const aud of AUD) { assert.strictEqual(NEW.groupsHintFromAudience(aud), OLD.groupsHintFromAudience(aud), 'groupsHintFromAudience'); n++; }
  { const pres = Array.from({ length: Math.floor(rnd() * 5) }, () => pick(DATES.filter(Boolean)));
    assert.strictEqual(NEW.presentsInMonth(pres, '2026-08-24'), OLD.presentsInMonth(pres, '2026-08-24'), 'presentsInMonth'); n++; }
  { const term = pick(TERMS), months = 1 + Math.floor(rnd() * 12);
    assert.strictEqual(NEW.termLabel(term, months), OLD.termLabel(term, months), 'termLabel'); n++;
    const lFreq = 1 + Math.floor(rnd() * 4), lUnit = pick(UNITS);
    assert.strictEqual(NEW.lessonsInTerm(lFreq, lUnit, term, months), OLD.lessonsInTerm(lFreq, lUnit, term, months), 'lessonsInTerm'); n++; }
  { const rot = Math.floor(rnd() * 720) - 360, cnt = 1 + Math.floor(rnd() * 8);
    assert.strictEqual(NEW.wheelIndexUnderPointer(rot, cnt), OLD.wheelIndexUnderPointer(rot, cnt), 'wheelIndexUnderPointer'); n++; }
  { const confirmOn = rnd() < 0.7, armed = rnd() < 0.5 ? { id: pick(['x', 'y']), armedAt: Math.floor(rnd() * 5000) } : null, pNow = Math.floor(rnd() * 8000);
    assert.strictEqual(J(NEW.punchConfirmStep(confirmOn, armed, 'x', pNow)), J(OLD.punchConfirmStep(confirmOn, armed, 'x', pNow)), 'punchConfirmStep'); n++; }
  { const gr = pick(GRADES); assert.strictEqual(NEW.gradeIndex(gr), OLD.gradeIndex(gr), 'gradeIndex'); n++; }
  assert.strictEqual(J(NEW.chipStyle('#fff', '#000')), J(OLD.chipStyle('#fff', '#000')), 'chipStyle'); n++;
}

// 8) קבועי-המילון — ביט-זהים
for (const k of ['DAY_NAMES', 'DAY_LETTERS', 'WEEKS_PER_MONTH', 'PRICING_TERMS', 'GRADE_ORDER', 'OTHER', 'OTHER_LABEL', 'ADD_TEACHER', 'CAT_OPTIONS', 'SEMESTER_OPTIONS', 'PAY_METHODS', 'TINTS', 'ENROLL_NEW_FAMILY', 'PUNCH_CONFIRM_MS']) {
  assert.strictEqual(J(NEW[k]), J(OLD[k]), 'const ' + k); n++;
}

fs.rmSync(tdir, { recursive: true, force: true });
console.log(`🥇 זהב-מודול-החוגים: ישן≡חדש על ${n} השוואות (300 סבבי-LCG · ~50 חוטים · normSearch/termOf/isoLocal אמיתיים · שעון-קפוא)`);
