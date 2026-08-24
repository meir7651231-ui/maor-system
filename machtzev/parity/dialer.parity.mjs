#!/usr/bin/env node
/** 🥇 רתמת-זהב · מנוע-החייגן — הישן (maor/src/lib/dialer.ts, מתורגם-חי) ≡ החדש
 *  (Genesis new/boxes/dialer.mjs) על קורפוס-LCG: קמפיינים אקראיים × רצפי-תוצאות ×
 *  יומני-שיחות (כולל טבעת 200+) × הערות עברית/רווחים. אפס-סטייה. בלי Date.now —
 *  חותמות-זמן קבועות מהקורפוס. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert';

const require = createRequire('/home/user/maor-system/');
const ts = require('typescript');
const tdir = fs.mkdtempSync(path.join(os.tmpdir(), 'dial-'));
// dialer.ts הוא lib טהור — import type בלבד (נמחק בטרנספילציה), אפס תלות-ריצה.
const src = fs.readFileSync('/home/user/maor-system/src/lib/dialer.ts', 'utf8');
const js = ts.transpileModule(src, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
fs.writeFileSync(path.join(tdir, 'dialer.mjs'), js);
const OLD = await import(pathToFileURL(path.join(tdir, 'dialer.mjs')).href);
const NEW = await import('/home/user/-ai-chat-server/new/boxes/dialer.mjs');

let s = 20260824;
const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const pick = (a) => a[Math.floor(rnd() * a.length)];

const OUTCOMES = ['donated', 'noanswer', 'refused', 'callback', 'done', 'skip'];
const NOTES = ['', '   ', 'תרם 100', '  עם רווחים  ', 'הערה', 'שתי\nשורות'];
// חותמות-זמן קבועות (בלי Date.now) — נבחרות מהקורפוס
const ISOS = ['2026-01-01', '2026-02-15', '2026-03-30', '2026-07-04', '2026-12-31'];
const idPool = ['a', 'b', 'c', 'd', 'e', '', 'a', 'ש', 'משפחה-1'];

// קבועים — צילום תו-בתו
assert.deepStrictEqual([...NEW.REQUEUE_OUTCOMES], [...OLD.REQUEUE_OUTCOMES], 'REQUEUE_OUTCOMES');
assert.deepStrictEqual([...NEW.TERMINAL_OUTCOMES], [...OLD.TERMINAL_OUTCOMES], 'TERMINAL_OUTCOMES');
assert.deepStrictEqual(NEW.OUTCOME_LABELS, OLD.OUTCOME_LABELS, 'OUTCOME_LABELS');
assert.strictEqual(NEW.CALL_LOG_CAP, OLD.CALL_LOG_CAP, 'CALL_LOG_CAP');

const nameOf = (id) => 'שם-' + id;
let n = 4;
for (let i = 0; i < 400; i++) {
  const iso0 = pick(ISOS);
  const ids = Array.from({ length: 1 + Math.floor(rnd() * 6) }, () => pick(idPool));
  // 1) startCampaign זהה
  const oC = OLD.startCampaign('קמפ' + i, ids, iso0);
  const nC = NEW.startCampaign('קמפ' + i, ids, iso0);
  assert.deepStrictEqual(nC, oC, 'startCampaign');
  n++;

  // 2) רצף תוצאות: מריצים אותו רצף על שני המנועים במקביל
  let oc = oC, nc = nC;
  const steps = 3 + Math.floor(rnd() * 10);
  for (let k = 0; k < steps; k++) {
    const outcome = pick(OUTCOMES), note = pick(NOTES), iso = pick(ISOS);
    assert.strictEqual(NEW.currentId(nc), OLD.currentId(oc), 'currentId');
    assert.strictEqual(NEW.isDone(nc), OLD.isDone(oc), 'isDone');
    assert.deepStrictEqual(NEW.progress(nc), OLD.progress(oc), 'progress');
    oc = OLD.applyOutcome(oc, outcome, note, iso);
    nc = NEW.applyOutcome(nc, outcome, note, iso);
    assert.deepStrictEqual(nc, oc, 'applyOutcome');
    n += 4;
    // 3) undoLast מדי-פעם (הפיך — בודקים ואז ממשיכים מהלא-מבוטל)
    if (rnd() > 0.6) {
      assert.deepStrictEqual(NEW.undoLast(nc), OLD.undoLast(oc), 'undoLast');
      n++;
    }
  }
  // 4) campaignCsvRows על היומן שהצטבר
  assert.deepStrictEqual(NEW.campaignCsvRows(nc, nameOf), OLD.campaignCsvRows(oc, nameOf), 'campaignCsvRows');
  n++;

  // 5) יומן-שיחות עמיד — כולל חריגת-טבעת (200+)
  let oCalls, nCalls;
  const both = rnd() > 0.5;
  oCalls = both ? undefined : [];
  nCalls = both ? undefined : [];
  const calls = Math.floor(rnd() * 260); // חלק חוצים 200 ⇒ בודק טבעת
  for (let k = 0; k < calls; k++) {
    const outcome = pick(OUTCOMES), iso = pick(ISOS);
    oCalls = OLD.appendCall(oCalls, outcome, iso);
    nCalls = NEW.appendCall(nCalls, outcome, iso);
  }
  assert.deepStrictEqual(nCalls, oCalls, 'appendCall ring');
  assert.deepStrictEqual(NEW.callStats(nCalls), OLD.callStats(oCalls), 'callStats');
  assert.deepStrictEqual(NEW.popCall(nCalls), OLD.popCall(oCalls), 'popCall');
  n += 3;
}

fs.rmSync(tdir, { recursive: true, force: true });
console.log(`🥇 זהב-חייגן: ישן≡חדש על ${n} השוואות (400 קמפיינים × רצפי-תוצאות/undo/CSV + יומני-שיחות עם טבעת-200)`);
