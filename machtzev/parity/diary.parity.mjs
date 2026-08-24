#!/usr/bin/env node
/** 🥇 רתמת-זהב · יומן-החדרים — הישן (maor/src/components/diary/lib.ts, מתורגם-חי עם
 *  שכניו האמיתיים) ≡ החדש (Genesis new/boxes/diary.mjs) על קורפוס-LCG seed=20260824.
 *  אפס-סטייה, תאריכים קבועים (בלי Date.now). isoToday מדולג במכוון — הוא isoLocal(new Date())
 *  ונבחן טרנזיטיבית דרך localIso (השוואת-now אינה דטרמיניסטית). */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert';

const require = createRequire('/home/user/maor-system/');
const ts = require('typescript');
const M = '/home/user/maor-system';
const tdir = fs.mkdtempSync(path.join(os.tmpdir(), 'diary-'));
const tr = (src) => ts.transpileModule(src, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
const write = (name, src) => fs.writeFileSync(path.join(tdir, name), tr(src));
const slice = (file, a, b) => fs.readFileSync(path.join(M, file), 'utf8').split('\n').slice(a, b).join('\n');

// ── שכני-המקור האמיתיים (OLD) ──
write('date-util.mjs', fs.readFileSync(path.join(M, 'src/lib/date-util.ts'), 'utf8'));   // עצמאי
write('hebrew.mjs', fs.readFileSync(path.join(M, 'src/lib/hebrew.ts'), 'utf8'));         // עצמאי (fmtParts+hebParts+HOLIDAYS)
write('config.mjs', slice('src/lib/config.ts', 118, 126));                               // termOf (119-126)
// courses/lib: sessionsOf (84-86) + planWord (184-192) + stub nextSessionDate
write('courses.mjs', slice('src/components/courses/lib.ts', 83, 86) + '\n' +
  slice('src/components/courses/lib.ts', 183, 192) + '\nexport function nextSessionDate() { return null; }\n');
// diary/lib.ts עם נתיבי-הייבוא ממופים לשכנים-המקומיים
let diarySrc = fs.readFileSync(path.join(M, 'src/components/diary/lib.ts'), 'utf8')
  .replace("'../../lib/config'", "'./config.mjs'")
  .replace(/'\.\.\/\.\.\/lib\/hebrew'/g, "'./hebrew.mjs'")
  .replace(/'\.\.\/courses\/lib'/g, "'./courses.mjs'")
  .replace("'../../lib/date-util'", "'./date-util.mjs'");
write('diary.mjs', diarySrc);

const OLD = await import(pathToFileURL(path.join(tdir, 'diary.mjs')).href);
const NEW = await import('/home/user/-ai-chat-server/new/boxes/diary.mjs');

// ── קורפוס-LCG דטרמיניסטי ──
let s = 20260824;
const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const ri = (n) => Math.floor(rnd() * n);
const pick = (a) => a[ri(a.length)];
const noon = (y, m, d) => new Date(y, m, d, 12, 0, 0);

const isos = ['2026-08-24', '', 'bad', '2020-02-29', '2026-13-40', '2022-08-07', 'עברית', '2026-1-1'];
const times = ['09:30', 'bad', ' 8:05 ', '23:59', '00:00', '25:00', '', '7:7', '12:00'];
const ints = [0, 5, 59, 60, 570, 900, 959, 1200, 1439, -1];
const plans = ['punch', 'month', 'half_year', 'year', 'week'];
const statuses = ['active', 'paused', 'ended', 'wait', undefined];
const cfgs = [{ terms: {} }, { terms: { 'entity.course': 'שיעור', 'entity.room': 'אולם' } }, {}];

let n = 0;
const same = (fn, args, label) => { assert.deepStrictEqual(NEW[fn](...args), OLD[fn](...args), `${label}: ${JSON.stringify(args)}`); n++; };

// חוטים-קבועים (פעם אחת)
assert.deepStrictEqual([...NEW.DAY_NAMES], [...OLD.DAY_NAMES], 'DAY_NAMES'); n++;
assert.deepStrictEqual([...NEW.ABSENCE_REASON_CHIPS], [...OLD.ABSENCE_REASON_CHIPS], 'CHIPS'); n++;

for (let i = 0; i < 400; i++) {
  same('fmtDate', [pick(isos)], 'fmtDate');
  same('localIso', [noon(2018 + ri(12), ri(12), 1 + ri(28))], 'localIso');
  same('pad2', [pick(ints)], 'pad2');
  same('timeToMin', [pick(times)], 'timeToMin');
  same('minToHM', [pick(ints.filter((x) => x >= 0))], 'minToHM');
  same('groupLabelOf', [{ label: pick(['', 'א', 'בוקר']) }, ri(4)], 'groupLabelOf');
  same('makeupEligibility', [pick(['cancel', 'noshow']), pick([true, false]), pick([null, 0, 10, 48, 72, 999])], 'makeupEligibility');
  same('blockReason', [noon(2018 + ri(12), ri(12), 1 + ri(28)), pick([true, false, undefined])], 'blockReason');
  const e = { plan: pick(plans), purchased: ri(20), used: ri(25), status: pick(statuses) };
  same('planLabelOf', [e], 'planLabelOf');
  same('enrollStatusMeta', [e], 'enrollStatusMeta');
  same('chipStyle', [pick(['#fff', '#e7edf5', 'red']), pick(['#000', '#3a5a86'])], 'chipStyle');
  const room = { id: 'r1', name: pick(['אולם', 'חדר 2']), from: pick(times), to: pick(times), slot: pick([0, 30, 45, 60]), cap: ri(30), access: pick([true, false]), active: pick([true, false]), eq: pick([{}, { מקרן: true, מזגן: false }, { שולחנות: true }]) };
  same('roomInfoLabel', [room], 'roomInfoLabel');

  // מבנה-DB לחיווטי-האגרגציה
  const iso = pick(isos.filter((x) => /^\d{4}-\d\d?-\d\d?$/.test(x)));
  const wd = ri(7);
  const courses = Array.from({ length: 1 + ri(3) }, (_, k) => ({
    id: 'c' + k, name: pick(['ציור', 'ריקוד']), roomId: pick(['r1', 'r2', '']),
    weekday: ri(7), time: pick(times), start: pick(['', '2020-01-01', '2027-01-01']),
    end: pick(['', '2019-01-01', '2030-01-01']),
    sessions: pick([[], [{ day: wd, time: '09:00', label: '' }], [{ day: wd, time: '09:00', label: 'א' }, { day: wd, time: '10:00', label: 'ב' }]]),
  }));
  const enrollments = Array.from({ length: ri(4) }, (_, k) => ({ id: 'e' + k, courseId: pick(['c0', 'c1']), group: pick(['', 'א', 'ב']) }));
  const events = Array.from({ length: ri(3) }, (_, k) => ({ id: 'ev' + k, roomId: pick(['r1', 'r2']), date: iso, time: pick(times), title: 'מפגש', done: pick([true, false]) }));
  const rooms = [room, { id: 'r2', name: 'ספרייה', active: pick([true, false]) }];
  const db = { courses, enrollments, events, rooms };
  const cfg = pick(cfgs);
  same('buildSlots', [db, room, iso, pick([null, 'שבת']), cfg, pick([true, false])], 'buildSlots');
  same('weeklyRoomSessions', [db, pick(['r1', 'r2']), iso], 'weeklyRoomSessions');
  same('inactiveRoomCourses', [db, iso, cfg], 'inactiveRoomCourses');
  same('enrollmentsForSession', [db, courses[0], ri(3)], 'enrollmentsForSession');
}

fs.rmSync(tdir, { recursive: true, force: true });
console.log(`🥇 זהב-יומן: ישן≡חדש על ${n} השוואות (400 סבבים × 18 חוטים + 2 קבועים) — אפס-סטייה`);
