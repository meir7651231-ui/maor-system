#!/usr/bin/env node
/** 🥇 רתמת-זהב · רישום-לשנה-הבאה — הישן (maor/src/components/courses/reenroll-lib.ts,
 *  מתורגם-חי עם payBal/paidOf האמיתיים מ-courses/lib.ts) ≡ החדש
 *  (Genesis new/boxes/reenroll.mjs) על קורפוס-LCG דטרמיניסטי seed=20260824.
 *  אפס-סטייה · בלי Date.now (תאריכים קבועים). */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert';

const require = createRequire('/home/user/maor-system/');
const ts = require('typescript');
const M = '/home/user/maor-system/src';
const tdir = fs.mkdtempSync(path.join(os.tmpdir(), 'reenroll-'));
const opt = { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } };
const emit = (name, src) => fs.writeFileSync(path.join(tdir, name), ts.transpileModule(src, opt).outputText);

// paidOf+payBal בלבד (lib.ts:304-311) — עצמאיים, תלויים רק זה-בזה. שאר-lib.ts
// נושא runtime-imports (normSearch/termOf/isoToday) שאינם ברתמה, לכן חותכים צר.
emit('lib.mjs', fs.readFileSync(`${M}/components/courses/lib.ts`, 'utf8').split('\n').slice(303, 311).join('\n'));
// reenroll-lib.ts המלא — ייבוא-types נמחק בטרנספילציה; ./lib מנותב לחיתוך-הזמן
emit('reenroll.mjs', fs.readFileSync(`${M}/components/courses/reenroll-lib.ts`, 'utf8')
  .replace("from './lib'", "from './lib.mjs'"));

const OLD = await import(pathToFileURL(path.join(tdir, 'reenroll.mjs')).href);
const NEW = await import('/home/user/-ai-chat-server/new/boxes/reenroll.mjs');

// ── קורפוס-LCG ──
let s = 20260824;
const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const pick = (a) => a[Math.floor(rnd() * a.length)];
const J = (x) => JSON.stringify(x);

const FIRST = ['בני', 'אבי', 'גדי', 'שרה', 'רות', 'דן', 'מוריה', '', 'yossi'];
const FAM = ['כהן', 'לוי', 'מזרחי', 'בן דוד', '', 'abramov'];
const CNAME = ['גיטרה', 'ציור', 'כדורגל', 'מתמטיקה', ''];
const DATES = ['2024-09-01', '2025-06-30', '2025-09-01', '2026-06-30', '2026-01-05', '2026-08-24', '2027-06-30', ''];
const RENEW = ['yes', 'no', 'hold', '', undefined];
const STATUS = ['active', 'paused', 'ended', 'wait'];
const PLANS = ['punch', 'term', 'free'];
const QUERIES = ['', '  ', 'בני', 'כהן', 'גיטרה', 'בני כהן', 'שרה לוי', 'zzz', 'לוי מזרחי'];
const DECISIONS = [undefined, {}, { decision: 'yes' }, { decision: 'no' }, { decision: 'undecided' }, { includeRenewed: false }, { courseId: 'c0' }];

function genDb() {
  const nFam = 1 + Math.floor(rnd() * 4);
  const families = Array.from({ length: nFam }, (_, i) => ({
    id: 'f' + i, name: pick(FAM),
    members: Array.from({ length: 1 + Math.floor(rnd() * 3) }, (_, j) => ({ id: `f${i}m${j}`, first: pick(FIRST) })),
  }));
  const allMembers = families.flatMap((f) => f.members.map((m) => m.id));
  const nC = 1 + Math.floor(rnd() * 4);
  const courses = Array.from({ length: nC }, (_, i) => ({
    id: 'c' + i, name: pick(CNAME), start: pick(DATES), end: pick(DATES),
    ...(rnd() < 0.5 ? { year: pick(['2024/25', '2025/26', '']) } : {}),
    ...(rnd() < 0.3 ? { room: 'R' + i } : {}),
  }));
  const nE = Math.floor(rnd() * 8);
  const ids = [];
  const enrollments = Array.from({ length: nE }, (_, i) => {
    const id = 'e' + i; ids.push(id);
    return {
      id, memberId: pick(allMembers), courseId: 'c' + Math.floor(rnd() * nC),
      plan: pick(PLANS), status: pick(STATUS),
      renew: pick(RENEW),
      presents: Array.from({ length: Math.floor(rnd() * 4) }, () => pick(DATES.filter(Boolean))),
      absences: Array.from({ length: Math.floor(rnd() * 3) }, () => (rnd() < 0.5 ? { date: pick(DATES), noshow: true } : { date: pick(DATES) })),
      payments: Array.from({ length: Math.floor(rnd() * 3) }, () => ({ amount: rnd() < 0.2 ? NaN : Math.floor(rnd() * 300) })),
      totalDue: Math.floor(rnd() * 400),
      enrolledAt: pick(DATES),
      group: pick(['ג1', 'ג2', '']),
      ...(rnd() < 0.4 ? { renewedToId: 'e' + Math.floor(rnd() * (nE + 1)) } : {}),
      ...(rnd() < 0.3 ? { renewNote: pick(['הערה', '', 'לבדוק']) } : {}),
      ...(rnd() < 0.4 ? { freq: 1 + Math.floor(rnd() * 3) } : {}),
      ...(rnd() < 0.3 ? { freqUnit: pick(['week', 'month']) } : {}),
      ...(rnd() < 0.3 ? { term: pick(['a', 'b']) } : {}),
      ...(rnd() < 0.2 ? { termMonths: 1 + Math.floor(rnd() * 10) } : {}),
      ...(rnd() < 0.3 ? { tier: pick(['A', 'B']) } : {}),
    };
  });
  return { families, courses, enrollments, allMembers };
}

let n = 0;
for (let iter = 0; iter < 300; iter++) {
  const db = genDb();

  // 1) תאריכים
  for (const iso of DATES.filter(Boolean)) {
    assert.strictEqual(NEW.academicYearLabel(iso), OLD.academicYearLabel(iso), 'academicYearLabel ' + iso); n++;
  }
  {
    const a = pick(DATES.filter(Boolean)), b = pick(DATES.filter(Boolean));
    assert.strictEqual(J(NEW.nextYearDates(a, b)), J(OLD.nextYearDates(a, b)), 'nextYearDates'); n++;
  }

  // 2) פר-שיבוץ: renewOf/isRenewed/enrollSummary
  for (const e of db.enrollments) {
    assert.strictEqual(NEW.renewOf(e), OLD.renewOf(e), 'renewOf'); n++;
    assert.strictEqual(NEW.isRenewed(e), OLD.isRenewed(e), 'isRenewed'); n++;
    assert.strictEqual(J(NEW.enrollSummary(e)), J(OLD.enrollSummary(e)), 'enrollSummary'); n++;
  }

  // 3) buildReenrollRows על מגוון-פילטרים (+ courseId אמיתי + q)
  const filters = [...DECISIONS, { courseId: 'c' + Math.floor(rnd() * db.courses.length) }, { q: pick(QUERIES) }, { decision: 'yes', includeRenewed: false }];
  for (const filter of filters) {
    const nrows = NEW.buildReenrollRows(db, filter);
    const orows = OLD.buildReenrollRows(db, filter);
    assert.strictEqual(J(nrows), J(orows), 'buildReenrollRows ' + J(filter)); n++;
    // 4) גזירות-מעל-השורות
    assert.strictEqual(J(NEW.reenrollCounts(nrows)), J(OLD.reenrollCounts(orows)), 'reenrollCounts'); n++;
    assert.strictEqual(J(NEW.renewTargets(nrows)), J(OLD.renewTargets(orows)), 'renewTargets'); n++;
    assert.strictEqual(J(NEW.reenrollCsvRows(nrows)), J(OLD.reenrollCsvRows(orows)), 'reenrollCsvRows'); n++;
    assert.strictEqual(NEW.reenrollListText(nrows), OLD.reenrollListText(orows), 'reenrollListText'); n++;
  }

  // 5) freshNextYearEnrollment (+ groupOverride) · nextYearCourseDraft
  for (const e of db.enrollments) {
    const cid = 'c' + Math.floor(rnd() * db.courses.length), nid = 'nn' + iter, today = pick(DATES.filter(Boolean));
    const grp = rnd() < 0.5 ? pick(['ג9', undefined]) : undefined;
    assert.strictEqual(J(NEW.freshNextYearEnrollment(e, cid, nid, today, grp)), J(OLD.freshNextYearEnrollment(e, cid, nid, today, grp)), 'freshNextYearEnrollment'); n++;
  }
  for (const c of db.courses) {
    assert.strictEqual(J(NEW.nextYearCourseDraft(c, 'nc' + iter)), J(OLD.nextYearCourseDraft(c, 'nc' + iter)), 'nextYearCourseDraft'); n++;
  }

  // 6) studentHistory + studentHistoryText (חוצה-שנים)
  for (const mid of db.allMembers) {
    const nh = NEW.studentHistory(db, mid), oh = OLD.studentHistory(db, mid);
    assert.strictEqual(J(nh), J(oh), 'studentHistory'); n++;
    assert.strictEqual(NEW.studentHistoryText(nh), OLD.studentHistoryText(oh), 'studentHistoryText'); n++;
  }
}

fs.rmSync(tdir, { recursive: true, force: true });
console.log(`🥇 זהב-רישום-לשנה-הבאה: ישן≡חדש על ${n} השוואות (300 סבבי-LCG · 14 חוטים · payBal/paidOf אמיתיים)`);
