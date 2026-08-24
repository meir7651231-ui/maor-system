#!/usr/bin/env node
/** 🥇 רתמת-זהב · דו"ח מותאם — הישן (maor/src/lib/customExport.ts + כל שרשרת-התלויות,
 *  מתורגם-חי בעץ-מראה) ≡ החדש (Genesis new/boxes/custom-export.mjs) על קורפוס-LCG
 *  דטרמיניסטי seed=20260824: קונפיגים (דגלים/מונחים/מודולים) × מסדי-נתונים
 *  (חוגים/אירועים-עבריים-חוזרים/תומכות-עם-עין) × 3 יעדים × טווחים × תתי-שדות.
 *  אפס-סטייה (deepStrictEqual). בלי Date.now בקורפוס — כל התאריכים קבועים
 *  ≤2025-06 (סל-הטריות של supScore יציב: תמיד >365 יום ⇒ R=40 בשני הצדדים). */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert';

const require = createRequire('/home/user/maor-system/');
const ts = require('typescript');
const ROOT = '/home/user/maor-system/src';
const tdir = fs.mkdtempSync(path.join(os.tmpdir(), 'cx-'));
// סגירת-התלויות של customExport.ts (ערכים בלבד; import type נמחק בתרגום)
const FILES = [
  'types/domain.ts', 'types/config.ts', 'lib/templates.ts', 'lib/validate.ts',
  'lib/date-util.ts', 'lib/exportGate.ts', 'lib/config.ts', 'lib/csvx.ts',
  'lib/eventMeta.ts', 'lib/hebrew.ts', 'lib/ayin.ts',
  'components/courses/lib.ts', 'components/supporters/lib.ts', 'lib/customExport.ts',
];
for (const rel of FILES) {
  const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  let js = ts.transpileModule(src, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
  // מפרטי-ייבוא יחסיים ⇒ ‎.mjs (ESM של node דורש סיומת)
  js = js.replace(/(from\s*['"])(\.\.?\/[^'"]+)(['"])/g, '$1$2.mjs$3');
  const out = path.join(tdir, rel.replace(/\.ts$/, '.mjs'));
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, js);
}
const OLD = await import(pathToFileURL(path.join(tdir, 'lib/customExport.mjs')).href);
const NEW = await import('/home/user/-ai-chat-server/new/boxes/custom-export.mjs');

// LCG דטרמיניסטי (seed קבוע — בלי Math.random/Date.now ברתמות)
let s = 20260824;
const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const pick = (a) => a[Math.floor(rnd() * a.length)];
const maybe = (v, p = 0.5) => (rnd() < p ? v : undefined);
const int = (n) => Math.floor(rnd() * n);

// ── מחוללי-קורפוס: הכול מתאריכים קבועים 2023-01..2025-06 ──
const DATES = ['2023-02-11', '2023-08-30', '2024-02-25', '2024-03-24', '2024-10-03', '2024-12-31', '2025-01-05', '2025-01-20', '2025-03-14', '2025-06-15', ''];
const genCfg = () => {
  const c = { slug: 'root', name: 'ארגון', terms: {}, modules: {}, features: {} };
  if (rnd() < 0.4) c.terms = { 'entity.donations': pick(['נדבות', ' ', '']), 'entity.students': 'חניכים', 'nav.ayin': 'פרויקטים', 'ayin.stage.eyes': pick(['מדידה', '']), 'entity.course': 'סדנה' };
  if (rnd() < 0.5) c.features['reports.custom.full'] = rnd() < 0.5;
  if (rnd() < 0.5) c.features['supporters.ayin'] = rnd() < 0.5;
  if (rnd() < 0.3) c.modules.supporters = rnd() < 0.5;
  if (rnd() < 0.3) c.modules.reports = rnd() < 0.5;
  return c;
};
const genDb = () => {
  const families = Array.from({ length: 1 + int(2) }, (_, i) => ({
    id: 'f' + i, name: 'משפחה' + i, phone: maybe('02-624') ?? '',
    members: Array.from({ length: 1 + int(2) }, (_, j) => ({ id: 'f' + i + 'm' + j, first: 'ילד' + j, phone: maybe('050-1') ?? '' })),
  }));
  const teachers = [{ id: 't0', name: 'מורה', phone: maybe('052-2') ?? '' }];
  const rooms = [{ id: 'r0', name: 'אולם' }];
  const courses = Array.from({ length: 1 + int(2) }, (_, i) => ({
    id: 'c' + i, name: 'חוג' + i, teacherId: pick(['t0', 'זר']), roomId: pick(['r0', '']),
    weekday: int(6), time: pick(['16:00', '']), sessions: maybe([{ day: int(6), time: '17:30', label: '' }, { day: int(6), time: '', label: '' }], 0.3),
    model: pick(['punch', 'half_year', 'year', 'monthly']), price: pick([0, 120, undefined]),
    maxStudents: pick([0, 10]), gradeMin: pick(['', 'ג']), gradeMax: pick(['', 'ו']), audience: pick(['', 'בנות']), notes: pick(['', 'הערה']),
  }));
  const enrollments = Array.from({ length: int(4) }, (_, i) => ({
    id: 'e' + i, courseId: 'c' + int(2), memberId: pick(families.flatMap((f) => f.members.map((m) => m.id)).concat('זר')),
    status: pick([undefined, 'ended', 'wait']), totalDue: pick([0, 400]),
    payments: Array.from({ length: int(3) }, () => ({ date: pick(DATES), amount: pick([0, 50, 100, undefined]) })),
    absences: Array.from({ length: int(3) }, () => ({ date: pick(DATES) })),
  }));
  const events = Array.from({ length: int(4) }, (_, i) => ({
    id: 'v' + i, type: pick(['memorial', 'anniversary', 'bday', 'reminder', 'call', 'wedding', 'org', 'custom']),
    title: 'אירוע' + i, date: pick(DATES), time: pick(['', '18:00']), famId: pick(['f0', '']),
    customType: maybe('סוג מותאם', 0.2), notes: pick(['', 'עם,פסיק']), done: rnd() < 0.5,
  }));
  const supporters = Array.from({ length: int(4) }, (_, i) => ({
    id: 's' + i, name: 'תורם' + i, phone: maybe('054-3') ?? '', email: maybe('a@b.co') ?? '',
    address: pick(['', 'הרצל 1']), city: pick(['', 'צפת']), cat: pick(['', 'VIP']), forWho: pick(['', 'נכד']), notes: pick(['', 'הערת תורם']),
    donations: Array.from({ length: int(3) }, () => ({ date: pick(DATES), amount: pick([0, 50, 200, '75']), cur: pick(['₪', '$']) })),
    count: pick([0, 3, undefined]), ils: pick([0, 1199, undefined]), usd: pick([0, 50, undefined]), last: pick(DATES),
    hist: maybe([{ d: '2023-05-01', a: pick([0, 100, -20]), c: pick(['₪', '$']) }], 0.5),
    ayin: maybe({
      stage: pick(['new', 'lead', 'eyes', 'answer', 'done']), paid: rnd() < 0.5,
      names: Array.from({ length: int(3) }, (_, j) => ({ name: 'שם' + j, eyes: pick([5, 0, '', null, '7']), done: rnd() < 0.5 })),
      answers: Array.from({ length: int(2) }, () => ({ date: pick(DATES), note: pick(['כן', 'עם"גרש']) })),
      log: Array.from({ length: int(2) }, () => ({ date: pick(DATES) })),
      lastTouch: pick(DATES), nextTalk: pick(DATES), nextTalkTime: pick(['', '10:00']),
    }, 0.6),
  }));
  return { families, teachers, rooms, courses, enrollments, events, supporters, usdRate: pick([3.7, 3.2]) };
};
const RANGES = [
  { from: '2025-01-01', to: '2025-01-31' }, { from: '2025-03-01', to: '2025-03-31' },
  { from: '2024-02-01', to: '2024-04-15' }, { from: '2023-01-01', to: '2023-06-30' },
  { from: '', to: '' }, { from: '2024-01-01', to: '' }, { from: '', to: '2024-06-30' },
  { from: '2025-06-30', to: '2025-01-01' }, // הפוך — המקור פשוט מסנן הכול
];
const KEYS = ['name', 'teacher', 'grade', 'audience', 'room', 'schedule', 'model', 'occ', 'students', 'studentsFull', 'pays', 'revenue', 'abs', 'notes',
  'title', 'type', 'hdate', 'gdate', 'time', 'fam', 'done',
  'phone', 'email', 'address', 'city', 'cat', 'forWho', 'dons', 'donsAll', 'tier', 'stage', 'names', 'eyesTotal', 'paid', 'answers', 'next', 'לא-קיים'];
const genKeys = () => (rnd() < 0.3 ? KEYS : KEYS.filter(() => rnd() < 0.5));

let n = 0;
for (let i = 0; i < 120; i++) {
  const cfg = genCfg();
  const db = genDb();
  for (const target of ['courses', 'events', 'supporters']) {
    // 1) הגדרות-השדות ביט-זהות
    assert.deepStrictEqual(NEW.expFieldDefs(cfg, target), OLD.expFieldDefs(cfg, target), `defs: ${target} cfg=${JSON.stringify(cfg)}`);
    n++;
    // 2) בניית-הדו"ח ביט-זהה
    const range = pick(RANGES);
    const keys = genKeys();
    const a = OLD.buildCustomExport(structuredClone(cfg), structuredClone(db), target, range, keys);
    const b = NEW.buildCustomExport(structuredClone(cfg), structuredClone(db), target, range, keys);
    assert.deepStrictEqual(b, a, `build: ${target} range=${JSON.stringify(range)} keys=${keys.length}`);
    n++;
    // 3) דריסת-עמודה ביט-זהה על השורות שנבנו
    const colIdx = int(6) - 1; // כולל 1- (כניסה-כיציאה)
    const overrides = { 0: 'לא-ייכנס', 1: 'דריסה', [1 + int(4)]: 'עוד' };
    assert.deepStrictEqual(NEW.overrideColumn(b, colIdx, overrides), OLD.overrideColumn(a, colIdx, overrides), 'override');
    n++;
  }
}
// ── עדשה-עוינת (CURRICULUM #6): קצוות שהמקור מטפל בהם במפורש ──
const hcfg = genCfg();
// יעד-זר — במקור אין ענף-ברירת-מחדל: נופל לענף-התומכות
assert.deepStrictEqual(NEW.expFieldDefs(hcfg, 'foo'), OLD.expFieldDefs(hcfg, 'foo'), 'defs יעד-זר');
n++;
const hostileEvents = [
  { id: 'h1', type: 'memorial', title: 'תקרה', date: '2024-03-24', time: '', famId: '', notes: '', done: false },
  { id: 'h2', type: 'bday', title: 'ל׳-אדר-א', date: '2024-03-10', time: '', famId: '', notes: '', done: true }, // 30 אדר-א tsh"d ⇒ א׳ ניסן בפשוטה
];
const hdb = { ...genDb(), events: hostileEvents };
// תקרת-CAP_DAYS=4000 על טווח-ענק (16 שנים) — בלי הקפאה, ביט-זהה
const capRange = { from: '2024-01-01', to: '2040-01-01' };
assert.deepStrictEqual(
  NEW.buildCustomExport(hcfg, hdb, 'events', capRange, ['title', 'gdate', 'hdate', 'done']),
  OLD.buildCustomExport(hcfg, hdb, 'events', capRange, ['title', 'gdate', 'hdate', 'done']),
  'CAP_DAYS + כלל-ל׳',
);
n++;
fs.rmSync(tdir, { recursive: true, force: true });
console.log(`🥇 זהב-הדו"ח-המותאם: ישן≡חדש על ${n} השוואות (120 סבבים × 3 יעדים: defs + build + override; אירועים-עבריים-חוזרים, עין, hist, טווחים פתוחים/הפוכים + עוינים: יעד-זר, CAP_DAYS, כלל-ל׳-אדר-א)`);
