#!/usr/bin/env node
/** 🥇 רתמת-זהב · מודול קופות-הצדקה — הישן (maor src/components/tzedaka/lib.ts,
 *  מתורגם-חי) ≡ החדש (Genesis new/boxes/tzedaka.mjs) על קורפוס-LCG seed=20260824.
 *  19 חוטים, אפס-סטייה עמוקה. בלי Date.now — הלוגיקה כולה תלוית-קלט (todayIso param).
 *  שני מנועי-קופסה-אחרת (smartFilter · buildMonthGrid) מוזרקים כפולים דטרמיניסטיים
 *  זהים לשני-הצדדים — הרתמה מוכיחה את החיווט, לא את המנוע (שנבדק ברתמות שלו). */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert';

const require = createRequire('/home/user/maor-system/');
const ts = require('typescript');
const tdir = fs.mkdtempSync(path.join(os.tmpdir(), 'tz-'));

// ── שקעים משותפים (זהים לשני הצדדים; מיושמים כמקור) ──
const p2 = (n) => String(n).padStart(2, '0');
const isoOf = (d) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;      // date-util.ts:14-17
const dateInRange = (iso, from, to) => (!from || iso >= from) && (!to || iso <= to);        // date-util.ts:30-33
const termOf = (cfg, key, fb) => { const v = cfg?.terms?.[key]; if (typeof v === 'string') { const t = v.trim(); if (t) return t; } return fb; }; // config.ts:119-126
const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];              // calLib.ts:61
// כפיל-מנוע smartFilter: q ריק ⇒ הכל; אחרת סינון תת-מחרוזת על אחד המונחים (דטרמיניסטי, זהה לשני-הצדדים)
const smartFilter = (q, items, getTerms) => !q ? items.slice() : items.filter((it) => getTerms(it).some((t) => String(t).includes(q)));
// כפיל-מנוע buildMonthGrid: זקיף-האצלה
const buildMonthGrid = (events, anchorIso, hebMode) => ({ n: events.length, anchorIso, hebMode });

// ── הישן: lib.ts בלי שורות-ה-import (value-imports מוזרקות כ-shim; type-imports נמחקות בטרנספיל) ──
const libSrc = fs.readFileSync('/home/user/maor-system/src/components/tzedaka/lib.ts', 'utf8');
const body = libSrc.split('\n').filter((l) => !/^import\s/.test(l)).join('\n');
const shim = `
const p2 = (n) => String(n).padStart(2, '0');
const isoOf = (d) => \`\${d.getFullYear()}-\${p2(d.getMonth() + 1)}-\${p2(d.getDate())}\`;
const dateInRange = (iso, from, to) => (!from || iso >= from) && (!to || iso <= to);
const termOf = (cfg, key, fb) => { const v = cfg?.terms?.[key]; if (typeof v === 'string') { const t = v.trim(); if (t) return t; } return fb; };
const DAY_NAMES = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
const smartFilter = (q, items, getTerms) => !q ? items.slice() : items.filter((it) => getTerms(it).some((t) => String(t).includes(q)));
const buildMonthGrid = (events, anchorIso, hebMode) => ({ n: events.length, anchorIso, hebMode });
`;
fs.writeFileSync(path.join(tdir, 'old.mjs'),
  ts.transpileModule(shim + body, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText);
const OLD = await import(pathToFileURL(path.join(tdir, 'old.mjs')).href);
const NEW = await import('/home/user/-ai-chat-server/new/boxes/tzedaka.mjs');

// ── קורפוס-LCG דטרמיניסטי ──
let s = 20260824;
const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const pick = (a) => a[Math.floor(rnd() * a.length)];
const dates = ['2026-01-01', '2026-06-15', '2026-07-10', '2026-08-01', '2026-08-20', '2025-12-31', '2026-08-24', ''];
const amounts = [100, 50, 40, 0, -5, 12.5, NaN, Infinity, 999.99, 300];
const statuses = ['home', 'office', 'lost'];
const names = ['שרה', 'רבקה', 'לאה', 'מרים כהן', 'דבורה', ''];
const famNames = ['כהן', 'לוי', 'ישראלי', ''];
const cities = ['ירושלים', 'בני ברק', ''];
const campIds = ['p1', 'p2', '', undefined];
const terms = [undefined, { terms: {} }, { terms: { 'entity.tzBox': 'קופסת-צדקה' } }, { terms: { 'entity.family': 'בית-אב', 'entity.familyOf': 'בית' } }];
const sorts4 = ['name', 'score', 'total', 'stale'];
const sorts3 = ['num', 'lastCollection', 'total'];
const boxStatusFilter = ['', 'home', 'office', 'lost'];

let n = 0;
const cmp = (a, b, m) => { assert.deepStrictEqual(a, b, m); n++; };

for (let i = 0; i < 400; i++) {
  // — בניית db אקראי —
  const nFam = Math.floor(rnd() * 4);
  const families = Array.from({ length: nFam }, (_, fi) => ({
    id: 'f' + fi, name: pick(famNames), address: pick(['הרצל 1', 'ויצמן 3', '']), city: pick(cities), phone: pick(['050-1', '', '03-9']),
  }));
  const nCoord = 1 + Math.floor(rnd() * 4);
  const tzCoordinators = Array.from({ length: nCoord }, (_, ci) => ({
    id: 'c' + ci, name: pick(names), active: rnd() < 0.7, score: Math.floor(rnd() * 100),
  }));
  const nCamp = Math.floor(rnd() * 3);
  const tzCampaigns = Array.from({ length: nCamp }, (_, pi) => ({
    id: 'p' + pi, name: pick(['פסח', 'חנוכה', '']), active: rnd() < 0.6,
    end: pick(['2026-08-30', '2026-09-05', '2026-12-01', '', undefined]), goal: pick([1000, 500, 0, undefined]),
  }));
  const nBox = Math.floor(rnd() * 5);
  const tzBoxes = Array.from({ length: nBox }, (_, bi) => ({
    id: 'b' + bi, num: String(1 + Math.floor(rnd() * 20)), coordinatorId: 'c' + Math.floor(rnd() * nCoord),
    status: pick(statuses), since: pick(dates) || '2026-01-01', famId: nFam ? 'f' + Math.floor(rnd() * nFam) : '',
    collections: Array.from({ length: Math.floor(rnd() * 4) }, () => ({ date: pick(dates), amount: pick(amounts), campaignId: pick(campIds) })),
  }));
  const db = { families, tzCoordinators, tzCampaigns, tzBoxes };
  const today = pick(['2026-08-24', '2026-09-01', '2026-06-01']);
  const cfg = pick(terms);

  // — חוטים חד-קופתיים —
  for (const b of tzBoxes) {
    cmp(NEW.lastCollectionIso(b), OLD.lastCollectionIso(b), 'lastCollectionIso');
    cmp(NEW.boxTotal(b), OLD.boxTotal(b), 'boxTotal');
    const d = pick(dates) || '2026-08-01', amt = pick(amounts);
    cmp(NEW.collectionScoreDelta(b, d, amt), OLD.collectionScoreDelta(b, d, amt), 'collectionScoreDelta default');
    const rules = { emptyPts: 0, ilsPerPoint: 10, streakDays: 30, streakPts: 3 };
    cmp(NEW.collectionScoreDelta(b, d, amt, rules), OLD.collectionScoreDelta(b, d, amt, rules), 'collectionScoreDelta rules');
    // filterCollections
    const fr = pick(dates), to = pick(dates), cid = pick(campIds) || '';
    cmp(NEW.filterCollections(b, fr, to, cid), OLD.filterCollections(b, fr, to, cid), 'filterCollections');
  }

  // — סכומי-רכז/קמפיין —
  for (const c of tzCoordinators) {
    cmp(NEW.coordinatorBoxes(tzBoxes, c.id), OLD.coordinatorBoxes(tzBoxes, c.id), 'coordinatorBoxes');
    cmp(NEW.coordinatorTotal(tzBoxes, c.id), OLD.coordinatorTotal(tzBoxes, c.id), 'coordinatorTotal');
    cmp(NEW.coordinatorPrintLines(db, c.id, cfg), OLD.coordinatorPrintLines(db, c.id, cfg), 'coordinatorPrintLines');
  }
  cmp(NEW.coordinatorPrintLines(db, 'zzz', cfg), OLD.coordinatorPrintLines(db, 'zzz', cfg), 'coordinatorPrintLines missing');
  cmp(NEW.grandTotal(tzBoxes), OLD.grandTotal(tzBoxes), 'grandTotal');
  for (const cid of ['p0', 'p1', 'nope']) cmp(NEW.campaignTotal(tzBoxes, cid), OLD.campaignTotal(tzBoxes, cid), 'campaignTotal ' + cid);
  for (const p of tzCampaigns) cmp(NEW.campaignProgress(p, tzBoxes), OLD.campaignProgress(p, tzBoxes), 'campaignProgress');

  // — טיפול / מובילים —
  const days = pick([90, 30, 0, 365]);
  cmp(NEW.staleBoxes(tzBoxes, today, days), OLD.staleBoxes(tzBoxes, today, days), 'staleBoxes ' + days);
  cmp(NEW.staleBoxes(tzBoxes, today), OLD.staleBoxes(tzBoxes, today), 'staleBoxes default');
  cmp(NEW.needsCare(db, today, cfg), OLD.needsCare(db, today, cfg), 'needsCare');
  cmp(NEW.needsCare(db, today), OLD.needsCare(db, today), 'needsCare no-config');
  cmp(NEW.leaderboard(tzCoordinators, tzBoxes), OLD.leaderboard(tzCoordinators, tzBoxes), 'leaderboard');

  // — חיפוש/סינון/מיון (smartFilter מוזרק לחדש; במקור הוא shim מודולרי) —
  const q = pick(['', 'שרה', 'כהן', '1', 'רבקה', 'זzz']);
  for (const so of sorts4) cmp(NEW.filterCoordinators(tzCoordinators, tzBoxes, q, false, so, smartFilter), OLD.filterCoordinators(tzCoordinators, tzBoxes, q, false, so), 'filterCoordinators ' + so);
  // onlyActive true/false — נבדק בנפרד כדי לשמור עקביות דגל בשני-הצדדים
  for (const oa of [true, false]) cmp(NEW.filterCoordinators(tzCoordinators, tzBoxes, q, oa, 'name', smartFilter), OLD.filterCoordinators(tzCoordinators, tzBoxes, q, oa, 'name'), 'filterCoordinators oa=' + oa);
  const st = pick(boxStatusFilter);
  for (const so of sorts3) cmp(NEW.boxesOverview(db, q, st, so, smartFilter), OLD.boxesOverview(db, q, st, so), 'boxesOverview ' + so);

  // — ייצוא / גריד —
  cmp(NEW.collectionsCsvRows(db, cfg), OLD.collectionsCsvRows(db, cfg), 'collectionsCsvRows');
  const evs = tzBoxes.map(() => ({ date: pick(dates) }));
  const heb = rnd() < 0.5; // hebMode יחיד — זהה לשני-הצדדים
  cmp(NEW.buildTzGrid(evs, today, heb, buildMonthGrid), OLD.buildTzGrid(evs, today, heb), 'buildTzGrid');
}

// — קבועים —
cmp(NEW.TZ_SCORE_RULES, OLD.TZ_SCORE_RULES, 'TZ_SCORE_RULES');
cmp(NEW.TZ_STALE_DAYS, OLD.TZ_STALE_DAYS, 'TZ_STALE_DAYS');
cmp(NEW.DAY_NAMES, OLD.DAY_NAMES, 'DAY_NAMES');

fs.rmSync(tdir, { recursive: true, force: true });
console.log(`🥇 זהב-צדקה: ישן≡חדש על ${n} השוואות (400 סבבים × 19 חוטים, כולל ריק/NaN/עברית/status/מבצע/מיון)`);
