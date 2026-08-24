#!/usr/bin/env node
/** 🥇 רתמת-זהב · מודול-המשפחות — הישן (maor src/components/families/lib.ts, מתורגם-חי
 *  עם typescript של maor) ≡ החדש (Genesis new/boxes/families.mjs) על קורפוס-LCG
 *  (seed=20260824). אפס-סטייה. השעון קפוא (בלי Date.now) — תאריך-קבוע גלובלי כדי
 *  ששני-הצדדים (new Date() במקור · ברירת-מחדל-הקופסה) יראו אותו רגע. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert';

const require = createRequire('/home/user/maor-system/');
const ts = require('typescript');
const tp = (src) => ts.transpileModule(src, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
const tdir = fs.mkdtempSync(path.join(os.tmpdir(), 'fam-'));

// ── בניית מודול-המקור: מסירים ייבואים + reexport, מזריקים תלויות-אמת ──
const MAOR = '/home/user/maor-system/src';
const libSrc = fs.readFileSync(`${MAOR}/components/families/lib.ts`, 'utf8')
  .split('\n')
  .filter((l) => !/^\s*import\b/.test(l) && !/export\s*\{\s*EV_META/.test(l))
  .join('\n');
// termOf האמיתי (config.ts:119-126) · isoLocal האמיתי (date-util.ts:13-17) ·
// isoTodayLocal=isoLocal(new Date()) (date-util.ts:9-11) · DEFAULT_CONFIG={} (config.ts:404-410 בלי terms).
const cfgLines = fs.readFileSync(`${MAOR}/lib/config.ts`, 'utf8').split('\n');
const termSrc = cfgLines.slice(118, 126).join('\n'); // export function termOf …
const duLines = fs.readFileSync(`${MAOR}/lib/date-util.ts`, 'utf8').split('\n');
const isoLocalSrc = duLines.slice(13, 17).join('\n'); // export function isoLocal(d) …
const prelude = `
${termSrc}
${isoLocalSrc}
const isoTodayLocal = () => isoLocal(new Date());
const DEFAULT_CONFIG = {};
`;
fs.writeFileSync(path.join(tdir, 'old.mjs'), tp(prelude + '\n' + libSrc));

// ── הקפאת-השעון (גלובלית) לפני ייבוא שני-הצדדים ──
const FIXED = new Date('2026-08-24T12:00:00');
const RealDate = Date;
class FrozenDate extends RealDate {
  constructor(...a) { super(...(a.length ? a : [FIXED.getTime()])); }
  static now() { return FIXED.getTime(); }
}
globalThis.Date = FrozenDate;

const OLD = await import(pathToFileURL(path.join(tdir, 'old.mjs')).href);
const NEW = await import('/home/user/-ai-chat-server/new/boxes/families.mjs');

// ── קורפוס-LCG דטרמיניסטי ──
let s = 20260824;
const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const pick = (a) => a[Math.floor(rnd() * a.length)];
const ri = (n) => Math.floor(rnd() * n);

const isoStrs = ['', 'bad', '2000-01-15', '2000-12-31', '2026-08-24', '1999-02-28', '2010-06-15', '2024-11-05', 'not-a-date', '2020-08-24T09:00:00'];
const statuses = ['active', 'pending', 'inactive'];
const enrStatuses = ['active', 'frozen', 'ended', 'wait'];
const maritals = ['נשואים', 'גרושים', 'אלמן/ה', 'פרודים', '', 'לא-מוכר'];
const langs = ['עברית', 'יידיש', 'רוסית', '', 'אנגלית'];
const cities = ['ירושלים', 'בני-ברק', '', 'צפת'];
const comms = ['גור', 'ויז׳ניץ', ''];
const axesKeys = ['city', 'comm', 'marital', 'status', 'cred', 'kids', 'enrolled', 'sefach', 'lang', 'zzz'];
const numQ = ['', '3', '3+', '2-4', '0', '10+', '1-1', 'abc', '  5  ', null, undefined];
const termDicts = [undefined, {}, { terms: {} }, { terms: { 'entity.cred': 'מהימנות', 'nav.courses': 'שיעורים', 'entity.family': 'חמולה', 'entity.enrollment': 'רישום' } }];

const mkFam = (i) => {
  const nMembers = 1 + ri(3);
  const members = Array.from({ length: nMembers }, (_, k) => ({ id: `m${i}_${k}`, first: pick(['שרה', 'דוד', 'רבקה', '']), isParent: k === 0 }));
  const nLog = ri(3);
  return {
    id: `f${i}`, city: pick(cities), community: pick(comms), maritalStatus: pick(maritals),
    status: pick(statuses), language: pick(langs), fullSefach: rnd() < 0.5,
    createdAt: pick(isoStrs),
    cred: rnd() < 0.2 ? undefined : { score: ri(1100), log: Array.from({ length: nLog }, () => ({ date: pick(isoStrs), reason: pick(['נוכחות', 'ביטול', '']), delta: ri(41) - 20 })) },
    docs: Array.from({ length: ri(2) }, (_, k) => ({ addedAt: pick(isoStrs), name: `מסמך${k}` })),
    members,
  };
};

const mkDb = () => {
  const nFam = 1 + ri(4);
  const families = Array.from({ length: nFam }, (_, i) => mkFam(i));
  const allMembers = families.flatMap((f) => f.members.map((m) => m.id));
  const courses = Array.from({ length: 1 + ri(3) }, (_, i) => ({ id: `c${i}`, name: pick(['אנגלית', 'ציור', 'חשבון', '']) }));
  const enrollments = Array.from({ length: ri(8) }, () => ({
    memberId: rnd() < 0.85 ? pick(allMembers) : 'ghost', courseId: pick(courses).id,
    status: pick(enrStatuses), enrolledAt: pick(isoStrs), group: pick(['', 'א', 'ב']),
    payments: Array.from({ length: ri(2) }, () => ({ date: pick(isoStrs), amount: ri(500), method: pick(['מזומן', 'אשראי']), rid: `R-${ri(999)}` })),
    absences: Array.from({ length: ri(2) }, () => ({ date: pick(isoStrs), noshow: rnd() < 0.5, reason: pick(['מחלה', '']), makeup: rnd() < 0.5 })),
  }));
  const events = Array.from({ length: ri(4) }, () => ({ famId: pick(families).id, date: pick(isoStrs), title: pick(['ביקור', 'שיחה', '']), time: pick(['', '10:00']), done: rnd() < 0.5 }));
  return { families, courses, enrollments, events };
};

const J = (x) => JSON.stringify(x);
let n = 0;
const cmp = (a, b, m) => { assert.strictEqual(J(a), J(b), m); n++; };

// קבועים — צילום-זהות
cmp(NEW.STATUS_META, OLD.STATUS_META, 'STATUS_META');
cmp(NEW.CRED_RED_THRESHOLD, OLD.CRED_RED_THRESHOLD, 'CRED_RED_THRESHOLD');
cmp(NEW.CRED_HELP_TEXT, OLD.CRED_HELP_TEXT, 'CRED_HELP_TEXT');
cmp(NEW.MARITAL_OPTIONS, OLD.MARITAL_OPTIONS, 'MARITAL_OPTIONS');
cmp(NEW.LANGUAGE_OPTIONS, OLD.LANGUAGE_OPTIONS, 'LANGUAGE_OPTIONS');
cmp(NEW.OTHER, OLD.OTHER, 'OTHER');
cmp(NEW.OTHER_LABEL, OLD.OTHER_LABEL, 'OTHER_LABEL');

for (let i = 0; i < 400; i++) {
  // fmtDate / isoToday / ageOf (שעון-קפוא)
  const iso = pick(isoStrs);
  cmp(NEW.fmtDate(iso), OLD.fmtDate(iso), `fmtDate ${iso}`);
  cmp(NEW.ageOf(iso), OLD.ageOf(iso), `ageOf ${iso}`);
  if (i === 0) cmp(NEW.isoToday(), OLD.isoToday(), 'isoToday');
  // tierOf
  const score = ri(1100);
  cmp(NEW.tierOf(score), OLD.tierOf(score), `tierOf ${score}`);
  // chipStyle / maritalChipStyle
  cmp(NEW.chipStyle('#abc', '#123'), OLD.chipStyle('#abc', '#123'), 'chipStyle');
  const mar = pick(maritals);
  cmp(NEW.maritalChipStyle(mar), OLD.maritalChipStyle(mar), `maritalChip ${mar}`);
  // numMatch
  const q = pick(numQ), num = ri(12);
  cmp(NEW.numMatch(q, num), OLD.numMatch(q, num), `numMatch ${q}/${num}`);
  // finderAxes (עם/בלי מילון)
  const cfg = pick(termDicts);
  cmp(NEW.finderAxes(cfg || {}), OLD.finderAxes(cfg || {}), 'finderAxes');
  // db-תלויים
  const db = mkDb();
  const fam = pick(db.families);
  cmp(NEW.famEnrollments(db, fam), OLD.famEnrollments(db, fam), 'famEnrollments');
  cmp(NEW.famLiveEnrollments(db, fam), OLD.famLiveEnrollments(db, fam), 'famLiveEnrollments');
  const axis = pick(axesKeys);
  cmp(NEW.finderAxisValue(db, fam, axis, cfg), OLD.finderAxisValue(db, fam, axis, cfg), `finderAxisValue ${axis}`);
  // finderMatches — נעילה על ציר-אקראי בערך-של-משפחה-קיימת
  const lockAxis = pick(axesKeys);
  const locks = { [lockAxis]: OLD.finderAxisValue(db, fam, lockAxis) };
  cmp(NEW.finderMatches(db, locks), OLD.finderMatches(db, locks), `finderMatches ${lockAxis}`);
  // famHistoryOf (עם/בלי config)
  cmp(NEW.famHistoryOf(db, fam), OLD.famHistoryOf(db, fam), 'famHistoryOf default');
  cmp(NEW.famHistoryOf(db, fam, cfg || {}), OLD.famHistoryOf(db, fam, cfg || {}), 'famHistoryOf cfg');
}

globalThis.Date = RealDate;
fs.rmSync(tdir, { recursive: true, force: true });
console.log(`🥇 זהב-משפחות: ישן≡חדש על ${n} השוואות (400 סבבים · 20 חוטים · שעון-קפוא · fmtDate/ageOf/tierOf/finder*/famHistory תו-בתו)`);
