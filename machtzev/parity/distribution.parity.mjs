#!/usr/bin/env node
/** 🥇 רתמת-זהב · חלוקה (SHOP7) — הישן (maor/src/components/shop7/lib.ts, מתורגם-חי
 *  עם התלויות האמיתיות termOf+smartFilter) ≡ החדש (Genesis new/boxes/distribution.mjs)
 *  על קורפוס-LCG דטרמיניסטי seed=20260824. אפס-סטייה · בלי Date.now (תאריכים קבועים). */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert';

const require = createRequire('/home/user/maor-system/');
const ts = require('typescript');
const M = '/home/user/maor-system/src';
const tdir = fs.mkdtempSync(path.join(os.tmpdir(), 'shop7-'));
const opt = { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } };
const emit = (name, src) => fs.writeFileSync(path.join(tdir, name), ts.transpileModule(src, opt).outputText);

// normSearch (validate.ts:51-58) — עצמאי
emit('validate.mjs', fs.readFileSync(`${M}/lib/validate.ts`, 'utf8').split('\n').slice(50, 58).join('\n'));
// termOf (config.ts:119-126) — עצמאי
emit('config.mjs', fs.readFileSync(`${M}/lib/config.ts`, 'utf8').split('\n').slice(118, 126).join('\n'));
// search.ts המלא — רק החלפת נתיב-הייבוא ל-normSearch המתורגם
emit('search.mjs', fs.readFileSync(`${M}/lib/search.ts`, 'utf8').replace("from './validate'", "from './validate.mjs'"));
// shop7/lib.ts המלא — ייבוא-types נמחק בטרנספילציה; termOf/smartFilter מנותבים לתלויות-הזמן
emit('shop7.mjs', fs.readFileSync(`${M}/components/shop7/lib.ts`, 'utf8')
  .replace("from '../../lib/config'", "from './config.mjs'")
  .replace("from '../../lib/search'", "from './search.mjs'"));

const OLD = await import(pathToFileURL(path.join(tdir, 'shop7.mjs')).href);
const OSEARCH = await import(pathToFileURL(path.join(tdir, 'search.mjs')).href);
const NEW = await import('/home/user/-ai-chat-server/new/boxes/distribution.mjs');

// ── קורפוס-LCG ──
let s = 20260824;
const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const pick = (a) => a[Math.floor(rnd() * a.length)];
const STATUSES = ['pickup', 'enroute', 'delivered'];
const DATES = ['2026-08-10', '2026-08-18', '2026-08-20', '2026-08-24', '2026-08-30'];
const NAMES = ['כהן', 'לוי', 'משה', 'שרה', 'בן דוד', 'abramov', '', 'מזרחי לוי'];
const CITIES = ['ירושלים', 'בני ברק', '', 'פתח תקווה'];
const ADDRS = ['הרצל 5', 'ויצמן 12', '', 'בן גוריון 3'];
const TERMS = [undefined, { terms: {} }, { terms: { 'entity.family': 'בית-אב' } }, { terms: { 'entity.family': '   ' } }];
const QUERIES = ['', '  ', 'כהן', 'cohen', 'משה', 'איסוף', 'בדרך', 'נמסר', 'שרה', 'zzz', 'בני ברק', 'לוי כהן'];

function genDb() {
  const nFam = 1 + Math.floor(rnd() * 5), nVol = 1 + Math.floor(rnd() * 4);
  const nDay = 1 + Math.floor(rnd() * 4), nAsg = Math.floor(rnd() * 6);
  const families = Array.from({ length: nFam }, (_, i) => ({ id: 'f' + i, name: pick(NAMES), address: pick(ADDRS), city: pick(CITIES) }));
  const volunteers = Array.from({ length: nVol }, (_, i) => ({
    id: 'v' + i, name: pick(NAMES), phone: pick(['050' + i, '', '03-1234']),
    area: rnd() < 0.5 ? pick(CITIES) : undefined, maxDeliveries: rnd() < 0.5 ? Math.floor(rnd() * 4) : undefined,
  }));
  const distributionDays = Array.from({ length: nDay }, (_, i) => ({ id: 'day' + i, date: pick(DATES), closed: rnd() < 0.3 }));
  const shopAssignments = Array.from({ length: nAsg }, (_, i) => ({ id: 'a' + i, status: rnd() < 0.7 ? 'active' : 'inactive' }));
  const nDel = Math.floor(rnd() * 8);
  const deliveries = Array.from({ length: nDel }, (_, i) => ({
    id: 'd' + i, dayId: 'day' + Math.floor(rnd() * nDay), assignmentId: 'a' + Math.floor(rnd() * (nAsg + 1)),
    volunteerId: 'v' + Math.floor(rnd() * nVol), familyId: 'f' + Math.floor(rnd() * nFam),
    status: pick(STATUSES), note: pick(['', 'קומה 3', 'דלת שמאל']),
  }));
  return { families, volunteers, distributionDays, shopAssignments, deliveries };
}

const J = (x) => JSON.stringify(x);
let n = 0;
for (let iter = 0; iter < 300; iter++) {
  const db = genDb();
  const today = pick(DATES);

  // 1) advanceStatus + statusLabel (כולל קלט-קצה 'zzz')
  for (const st of [...STATUSES, 'zzz', '']) {
    assert.strictEqual(NEW.advanceStatus(st), OLD.advanceStatus(st), 'advanceStatus ' + st); n++;
    assert.strictEqual(NEW.statusLabel(st), OLD.statusLabel(st), 'statusLabel ' + st); n++;
  }

  // 2) גזירות מסד
  for (const day of db.distributionDays) {
    assert.strictEqual(J(NEW.deliveriesOfDay(db, day.id)), J(OLD.deliveriesOfDay(db, day.id)), 'ofDay'); n++;
    assert.strictEqual(J(NEW.progressOfDay(db, day.id)), J(OLD.dayProgress(db, day.id)), 'dayProgress'); n++;
    assert.strictEqual(J(NEW.eligibleAssignmentsForDay(db, day.id)), J(OLD.eligibleAssignmentsForDay(db, day.id)), 'eligible'); n++;
  }
  for (const vol of db.volunteers) {
    assert.strictEqual(J(NEW.deliveriesOfVolunteer(db, vol.id)), J(OLD.deliveriesOfVolunteer(db, vol.id)), 'ofVol'); n++;
    const day = pick(db.distributionDays).id;
    assert.strictEqual(J(NEW.loadHint(db, vol, day)), J(OLD.volunteerLoadHint(db, vol, day)), 'loadHint'); n++;
    assert.strictEqual(J(NEW.volunteerRouteStops(db, day, vol.id)), J(OLD.volunteerRouteStops(db, day, vol.id)), 'route'); n++;
  }
  for (const fam of db.families) {
    assert.strictEqual(J(NEW.deliveriesOfFamily(db, fam.id)), J(OLD.deliveriesOfFamily(db, fam.id)), 'ofFam'); n++;
  }
  assert.strictEqual(J(NEW.pendingDeliveriesToday(db, today)), J(OLD.pendingDeliveriesToday(db, today)), 'pending'); n++;

  // 3) CSV (כולל termOf-מותאם/ריק/undefined)
  for (const cfg of TERMS) {
    assert.strictEqual(J(NEW.csvRows(db, cfg)), J(OLD.deliveriesCsvRows(db, cfg)), 'csv ' + J(cfg)); n++;
  }

  // 4) תדפיס — rows מועשרים (familyName/volunteerName/address)
  const rows = db.deliveries.map((d) => ({
    ...d, familyName: db.families.find((f) => f.id === d.familyId)?.name ?? '',
    volunteerName: db.volunteers.find((v) => v.id === d.volunteerId)?.name ?? '',
    address: rnd() < 0.5 ? pick(ADDRS) : undefined,
  }));
  assert.strictEqual(J(NEW.listLines(rows)), J(OLD.deliveryListLines(rows)), 'listLines'); n++;

  // 5) סינון — smartFilter האמיתי (מהמנוע הישן) מוזרק לקופסה; הישן משתמש בו פנימית
  for (const q of QUERIES) {
    assert.strictEqual(J(NEW.filterVolunteers(db.volunteers, q, OSEARCH.smartFilter)),
      J(OLD.filterVolunteers(db.volunteers, q)), 'filterVol ' + q); n++;
    assert.strictEqual(J(NEW.filterDeliveries(rows, q, OSEARCH.smartFilter)),
      J(OLD.filterDeliveries(rows, q)), 'filterDel ' + q); n++;
  }
}

fs.rmSync(tdir, { recursive: true, force: true });
console.log(`🥇 זהב-חלוקה (SHOP7): ישן≡חדש על ${n} השוואות (300 סבבים · 14 חוטים · smartFilter/termOf אמיתיים)`);
