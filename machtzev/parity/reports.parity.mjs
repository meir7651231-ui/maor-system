#!/usr/bin/env node
/** 🥇 רתמת-זהב · מסך-הדוחות — הישן (maor src/components/reports/lib.ts, מתורגם-חי)
 *  ≡ החדש (Genesis new/boxes/reports.mjs) על קורפוס-LCG seed=20260824.
 *  13 חוטים, אפס-סטייה תו-בתו. בלי Date.now — שקע-הזמן מוזרק קבוע לשני-הצדדים. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert';

const require = createRequire('/home/user/maor-system/');
const ts = require('typescript');
const tdir = fs.mkdtempSync(path.join(os.tmpdir(), 'rp-'));

// זמן-קבוע (בלי Date.now) — מוזרק זהה לשני הצדדים
const FIXED = new Date(2026, 7, 24, 12, 0, 0);
const p2 = (n) => String(n).padStart(2, '0');
const isoLocal = (d) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;

// ── הישן: reports/lib.ts בלי-שורות-הייבוא (1-6); השקעים allMembers+isoTodayLocal מוזרקים ──
const libLines = fs.readFileSync('/home/user/maor-system/src/components/reports/lib.ts', 'utf8').split('\n');
const body = libLines.slice(6).join('\n'); // מ-line 7 (interface DateRange נמחק בטרנספילציה)
const shim = `
const isoTodayLocal = () => (${JSON.stringify(isoLocal(FIXED))});
function allMembers(db){const out=[];for(const f of db.families){for(const m of f.members)out.push({...m,famId:f.id,famName:f.name});}return out;}
`;
const oldSrc = shim + body;
fs.writeFileSync(path.join(tdir, 'reports.mjs'),
  ts.transpileModule(oldSrc, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText);
const OLD = await import(pathToFileURL(path.join(tdir, 'reports.mjs')).href);
const NEW = await import('/home/user/-ai-chat-server/new/boxes/reports.mjs');
const allMembers = (db) => { const out = []; for (const f of db.families) { for (const m of f.members) out.push({ ...m, famId: f.id, famName: f.name }); } return out; };

// ── קורפוס-LCG דטרמיניסטי ──
let s = 20260824;
const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const pick = (a) => a[Math.floor(rnd() * a.length)];
const isos = ['2026-08-24', '2026-08-24T12:00:00', '2026-01-01', '2025-12-31', '', 'שטויות', '2026-08', '2026-13-40', '1999-02-28', null, undefined, '2026-06-15T09:30:00Z'];
const amounts = [100, 50, 0, -5, 12.5, NaN, Infinity, 0.1, 0.2, 999.999, 3.005];
const keys = ['2026-08', '2026-01', '1999-12', '2026-08-24'];
const statuses = ['active', 'pending', 'inactive', 'unknown'];

let n = 0;
const cmp = (a, b, m) => { assert.deepStrictEqual(a, b, m); n++; };

for (let i = 0; i < 400; i++) {
  // isoToday — שקע-הזמן קבוע
  cmp(NEW.isoToday(isoLocal, FIXED), OLD.isoToday(), 'isoToday');

  // fmtDate / monthKey — פונקציות תאריך חד-ארגומנטיות (כולל ריק/שבור/null/עברית)
  const iso = pick(isos);
  cmp(NEW.fmtDate(iso ?? ''), OLD.fmtDate(iso ?? ''), 'fmtDate ' + iso);
  if (iso) cmp(NEW.monthKey(iso), OLD.monthKey(iso), 'monthKey ' + iso);

  // monthLabel
  const k = pick(keys);
  cmp(NEW.monthLabel(k), OLD.monthLabel(k), 'monthLabel ' + k);

  // inRange — קורפוס טווחים
  const r = { from: pick(isos) ?? '', to: pick(isos) ?? '' };
  cmp(NEW.inRange(iso ?? '', r), OLD.inRange(iso ?? '', r), 'inRange');

  // rangeLabel
  cmp(NEW.rangeLabel(r), OLD.rangeLabel(r), 'rangeLabel ' + JSON.stringify(r));

  // round2
  const x = pick(amounts) + rnd();
  cmp(NEW.round2(x), OLD.round2(x), 'round2 ' + x);

  // enrollment — paidOf/paidInRange/balanceOf
  const pays = Array.from({ length: Math.floor(rnd() * 4) }, () => ({ amount: pick(amounts), date: pick(isos) ?? '' }));
  const e = { payments: rnd() < 0.15 ? undefined : pays, totalDue: pick(amounts) };
  cmp(NEW.paidOf(e), OLD.paidOf(e), 'paidOf');
  cmp(NEW.paidInRange(e, r), OLD.paidInRange(e, r), 'paidInRange');
  cmp(NEW.balanceOf(e), OLD.balanceOf(e), 'balanceOf');

  // nameIndex — db.families אקראי
  const fams = Array.from({ length: Math.floor(rnd() * 3) }, (_, fi) => ({
    id: 'f' + fi, name: pick(['כהן', 'לוי', 'ישראלי', '']),
    members: Array.from({ length: 1 + Math.floor(rnd() * 3) }, (_, mi) => ({ id: 'm' + fi + '_' + mi, name: pick(['דוד', 'שרה']) })),
  }));
  const db = { families: fams };
  const on = OLD.nameIndex(db), nn = NEW.nameIndex(db, allMembers);
  cmp([...nn.keys()].sort(), [...on.keys()].sort(), 'nameIndex keys');
  for (const key of on.keys()) cmp(nn.get(key), on.get(key), 'nameIndex val ' + key);

  // countBy — פריטים אקראיים
  const items = Array.from({ length: Math.floor(rnd() * 8) }, () => ({ st: pick(statuses) }));
  cmp(NEW.countBy(items, (t) => t.st), OLD.countBy(items, (t) => t.st), 'countBy');

  // STATUS_LABEL — קבוע
  cmp(NEW.STATUS_LABEL, OLD.STATUS_LABEL, 'STATUS_LABEL');
}

fs.rmSync(tdir, { recursive: true, force: true });
console.log(`🥇 זהב-דוחות: ישן≡חדש על ${n} השוואות (400 סבבים × 13 חוטים, כולל ריק/NaN/שבור/עברית/null)`);
