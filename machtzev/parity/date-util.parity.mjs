#!/usr/bin/env node
/** 🥇 רתמת-זהב · כלי-התאריך — הישן (maor/src/lib/date-util.ts, מתורגם-חי) ≡ החדש
 *  (Genesis new/boxes/date-util.mjs) על קורפוס-LCG דטרמיניסטי seed=20260824:
 *  isoLocal · isoToday · isoDaysAgo · dateInRange. אפס Date.now — שעון-קפוא
 *  מוזרק-גלובלית (הישן והחדש רואים אותם רגעים קבועים). אפס-סטייה. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert';

const require = createRequire('/home/user/maor-system/');
const ts = require('typescript');
const src = fs.readFileSync('/home/user/maor-system/src/lib/date-util.ts', 'utf8');
const js = ts.transpileModule(src, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
const tmp = path.join(os.tmpdir(), 'date-util-old-' + process.pid + '.mjs');
fs.writeFileSync(tmp, js);
const OLD = await import(pathToFileURL(tmp).href);
const NEW = await import('/home/user/-ai-chat-server/new/boxes/date-util.mjs');

let s = 20260824;
const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
let n = 0;

// ── שעון-קפוא: new Date() בלי ארגומנטים ⇒ רגע קבוע (בלי Date.now בקורפוס) ──
const RealDate = globalThis.Date;
const freeze = (ts0, fn) => {
  class Frozen extends RealDate {
    constructor(...a) { a.length ? super(...a) : super(ts0); }
    static now() { return ts0; }
  }
  globalThis.Date = Frozen;
  try { fn(); } finally { globalThis.Date = RealDate; }
};

// 1) isoLocal ≡ — ‏400 רגעים אקראיים-דטרמיניסטיים 1970–2100 + נבנים-מקומית
for (let i = 0; i < 400; i++) {
  const d = new RealDate(Math.floor(rnd() * 4102444800000)); // 1970..2100
  assert.strictEqual(NEW.isoLocal(d), OLD.isoLocal(d), 'isoLocal: ' + d.toISOString());
  n++;
}
for (let i = 0; i < 100; i++) {
  const d = new RealDate(1970 + Math.floor(rnd() * 130), Math.floor(rnd() * 12),
    1 + Math.floor(rnd() * 31), Math.floor(rnd() * 24), Math.floor(rnd() * 60));
  assert.strictEqual(NEW.isoLocal(d), OLD.isoLocal(d), 'isoLocal(y,m,d): ' + d);
  n++;
}

// 2) isoToday ≡ — רגעים קבועים רגישים: אחרי-חצות מקומי, מעברי-DST ישראל, קצות-שנה
const INSTANTS = [
  new RealDate(2026, 7, 24, 0, 30).getTime(),   // אחרי-חצות מקומי (פער-ה-UTC מהמקור)
  new RealDate(2026, 7, 24, 12, 0).getTime(),
  new RealDate(2026, 11, 31, 23, 59).getTime(), // ערב-השנה-החדשה
  new RealDate(2026, 0, 1, 0, 0).getTime(),
  new RealDate(2026, 2, 27, 2, 30).getTime(),   // סביב כניסת שעון-קיץ (ישראל 2026)
  new RealDate(2026, 9, 25, 1, 30).getTime(),   // סביב יציאת שעון-קיץ
  new RealDate(2028, 1, 29, 6, 0).getTime(),    // שנה מעוברת לועזית
];
for (const t of INSTANTS) {
  freeze(t, () => {
    assert.strictEqual(NEW.isoToday(), OLD.isoToday(), 'isoToday@' + t);
    n++;
    // הזרקה מפורשת ≡ אותו רגע (שקע-השעון של הקופסה)
    assert.strictEqual(NEW.isoToday(new RealDate(t)), OLD.isoToday(), 'isoToday(now)@' + t);
    n++;
  });
}

// 3) isoDaysAgo ≡ — רגעים קפואים × ימים מה-LCG (כולל שלילי, אפס, גלישות שנה)
for (const t of INSTANTS) {
  freeze(t, () => {
    for (let i = 0; i < 30; i++) {
      const days = Math.floor(rnd() * 4000) - 1000; // ‎-1000..2999
      assert.strictEqual(NEW.isoDaysAgo(days), OLD.isoDaysAgo(days), `isoDaysAgo(${days})@${t}`);
      n++;
    }
    for (const days of [0, 1, 7, 31, 365, -1]) {
      assert.strictEqual(NEW.isoDaysAgo(days), OLD.isoDaysAgo(days), `isoDaysAgo(${days})@${t}`);
      n++;
    }
  });
}

// 4) dateInRange ≡ — מחרוזות-ISO אקראיות + קצוות ריקים/זהים/הפוכים
const isoRnd = () => `${1990 + Math.floor(rnd() * 50)}-${String(1 + Math.floor(rnd() * 12)).padStart(2, '0')}-${String(1 + Math.floor(rnd() * 28)).padStart(2, '0')}`;
for (let i = 0; i < 500; i++) {
  const iso = isoRnd();
  const from = rnd() < 0.25 ? '' : isoRnd();
  const to = rnd() < 0.25 ? '' : isoRnd();
  assert.strictEqual(NEW.dateInRange(iso, from, to), OLD.dateInRange(iso, from, to), `dateInRange(${iso},${from},${to})`);
  n++;
}
for (const args of [['2026-08-24', '2026-08-24', '2026-08-24'], ['', '', ''],
  ['2026-08-24', '2026-08-25', '2026-08-01'], ['0000-00-00', '', '']]) {
  assert.strictEqual(NEW.dateInRange(...args), OLD.dateInRange(...args), 'dateInRange קצה: ' + args);
  n++;
}

fs.unlinkSync(tmp);
console.log(`🥇 זהב-כלי-התאריך: ישן≡חדש על ${n} השוואות (isoLocal 500 · isoToday 7 רגעים×2 · isoDaysAgo 7×36 · dateInRange 504) — שעון-קפוא, אפס Date.now`);
