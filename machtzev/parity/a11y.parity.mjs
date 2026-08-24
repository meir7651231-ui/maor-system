#!/usr/bin/env node
/** 🥇 רתמת-זהב · נגישות — הישן (maor src/lib/a11y.ts מתורגם-חי, טהור כולו) ≡ החדש
 *  (Genesis new/boxes/a11y.mjs) על קורפוס-LCG seed=20260824: קבועים + 4 המתגים
 *  verbatim · clampScale/stepScale על מספרים/NaN/±Infinity/מחרוזות/עברית ·
 *  שרשראות-צעדים · parseAcc על JSON תקין/חלקי/שבור/עברית. אפס-סטייה. בלי Date.now. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert';

const require = createRequire('/home/user/maor-system/');
const ts = require('typescript');
const tdir = fs.mkdtempSync(path.join(os.tmpdir(), 'a11y-'));
// המקור כולו טהור (a11y.ts:8-9) — מתורגם כמות-שהוא (interface נמחק ע"י הטרנספיילר)
const src = fs.readFileSync('/home/user/maor-system/src/lib/a11y.ts', 'utf8');
fs.writeFileSync(path.join(tdir, 'a11y.mjs'),
  ts.transpileModule(src, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText);
const OLD = await import(pathToFileURL(path.join(tdir, 'a11y.mjs')).href);
const NEW = await import('/home/user/-ai-chat-server/new/boxes/a11y.mjs');

let n = 0;
// ── קבועים + מילון-המתגים — verbatim ──
for (const k of ['SCALE_MIN', 'SCALE_MAX', 'SCALE_STEP']) {
  assert.strictEqual(NEW[k], OLD[k], k); n++;
}
assert.deepStrictEqual(NEW.A11Y_FAB_TOGGLES, OLD.A11Y_FAB_TOGGLES, 'A11Y_FAB_TOGGLES'); n++;

let seed = 20260824;
const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const pick = (a) => a[Math.floor(rnd() * a.length)];

// ── clampScale + stepScale: קורפוס ערכים עוין ──
const scaleEdge = [NaN, Infinity, -Infinity, 0, -1, 0.7999999, 0.8, 1, 1.6, 1.6000001, 99, -0.5,
  1.2000000000000002, 0.30000000000000004, '1.2', 'עברית', null, undefined, true, 7e300];
for (let i = 0; i < 400; i++) {
  const v = i % 4 === 0 ? pick(scaleEdge) : SCALE_RND();
  assert.strictEqual(NEW.clampScale(v), OLD.clampScale(v), `clampScale(${String(v)})`); n++;
  const dir = rnd() < 0.5 ? 1 : -1;
  assert.strictEqual(NEW.stepScale(v, dir), OLD.stepScale(v, dir), `stepScale(${String(v)}, ${dir})`); n++;
}
function SCALE_RND() { return Math.round((rnd() * 3 - 0.5) * 1000) / 1000; }

// ── שרשראות-צעדים (הצטברות-float היא לב-הבאג שהעיגול פותר) ──
for (let round = 0; round < 50; round++) {
  let o = pick(scaleEdge), w = o;
  for (let step = 0; step < 25; step++) {
    const dir = rnd() < 0.5 ? 1 : -1;
    o = OLD.stepScale(o, dir);
    w = NEW.stepScale(w, dir);
    assert.strictEqual(w, o, `שרשרת round ${round} step ${step}`); n++;
  }
}

// ── parseAcc: קורפוס JSON עוין ──
const keys = ['contrast', 'noanim', 'links', 'spacing', 'זר', 'extra'];
const vals = [true, false, 1, 0, '', 'כן', null, [], {}];
const rawFixed = [null, '', '{}', 'null', '0', '"עברית"', '[1,2]', 'לא-JSON{', '{"contrast":true',
  '{"contrast":true,"noanim":true,"links":true,"spacing":true}', '  ', '{"CONTRAST":true}', 'undefined'];
for (let i = 0; i < 400; i++) {
  let raw;
  if (i % 3 === 0) raw = pick(rawFixed);
  else {
    const o = {};
    const kn = Math.floor(rnd() * 5);
    for (let k = 0; k < kn; k++) o[pick(keys)] = pick(vals);
    raw = JSON.stringify(o);
  }
  assert.deepStrictEqual(NEW.parseAcc(raw), OLD.parseAcc(raw), `parseAcc(${String(raw)})`); n++;
}

fs.rmSync(tdir, { recursive: true, force: true });
console.log(`🥇 זהב-הנגישות: ישן≡חדש על ${n} השוואות (קבועים+מתגים verbatim · clamp/step 800 · שרשראות 1250 · parseAcc 400), אפס-סטייה`);
