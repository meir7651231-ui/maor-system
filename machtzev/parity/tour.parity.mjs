#!/usr/bin/env node
/** 🥇 רתמת-זהב · הסיור-המודרך — הישן (maor src/lib/tour.ts + termOf מ-config.ts,
 *  מתורגם-חי) ≡ החדש (Genesis new/boxes/tour.mjs) על קורפוס-LCG ‏seed=20260824:
 *  תסריט+כפתור-עצירה תו-בתו · tourSteps על צירופי-מודולים×קונפיגים (כולל דריסות
 *  ריקות/רווחים/עברית) · tourAdvance על גבולות · spotlightBox על מלבנים/viewport/pad.
 *  אפס-סטייה. בלי Date.now — הכול דטרמיניסטי. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert';

const require = createRequire('/home/user/maor-system/');
const ts = require('typescript');
const tdir = fs.mkdtempSync(path.join(os.tmpdir(), 'tour-'));

// המקור-החי: termOf (config.ts:119-126) + tour.ts בלי שורות-הייבוא (1-13 = הערות+imports)
const cfgLines = fs.readFileSync('/home/user/maor-system/src/lib/config.ts', 'utf8').split('\n');
const termSrc = cfgLines.slice(118, 126).join('\n');
assert.ok(termSrc.includes('export function termOf'), 'עוגן: termOf זז מ-config.ts:119');
const tourLines = fs.readFileSync('/home/user/maor-system/src/lib/tour.ts', 'utf8').split('\n');
assert.ok(tourLines[12].includes("import { termOf }"), 'עוגן: import termOf זז מ-tour.ts:13');
const tourSrc = tourLines.slice(13).join('\n');
assert.ok(tourSrc.includes('export const TOUR_STEPS'), 'עוגן: TOUR_STEPS לא בחיתוך');
const old = ts.transpileModule(termSrc + '\n' + tourSrc, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText;
fs.writeFileSync(path.join(tdir, 'tour-old.mjs'), old);
const OLD = await import(pathToFileURL(path.join(tdir, 'tour-old.mjs')).href);
const NEW = await import('/home/user/-ai-chat-server/new/boxes/tour.mjs');

let s = 20260824;
const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const pick = (a) => a[Math.floor(rnd() * a.length)];
let n = 0;
const eq = (a, b, msg) => { assert.deepStrictEqual(a, b, msg); n++; };

// 1) הקבועים — תו-בתו
eq(NEW.TOUR_STOP_LABEL, OLD.TOUR_STOP_LABEL, 'כפתור-העצירה');
eq(JSON.parse(JSON.stringify(NEW.TOUR_STEPS)), JSON.parse(JSON.stringify(OLD.TOUR_STEPS)), 'התסריט');

// 2) tourSteps — צירופי-מודולים × קונפיגים
const MODULES = ['families', 'courses', 'calendar', 'tzedaka', 'shop'];
const configs = [
  undefined,
  {},
  { terms: {} },
  { terms: { 'nav.courses': 'סדנאות', 'entity.course': 'סדנה' } },
  { terms: { 'nav.families': 'לקוחות' } },
  { terms: { 'nav.courses': '   ' } },
  { terms: { 'nav.courses': '' } },
  { terms: { 'nav.courses': 'קורסים', 'nav.families': 'בתים', 'entity.course': 'קורס' } },
  { terms: { 'entity.course': ' סדנה ' } },
];
for (let i = 0; i < 300; i++) {
  const on = new Set(MODULES.filter(() => rnd() < 0.6));
  const isOn = (m) => on.has(m);
  const config = pick(configs);
  eq(
    JSON.parse(JSON.stringify(NEW.steps(isOn, config))),
    JSON.parse(JSON.stringify(OLD.tourSteps(isOn, config))),
    `steps: on=${[...on]} cfg=${JSON.stringify(config)}`
  );
}

// 3) tourAdvance — גבולות: לפני-ההתחלה/אחרי-הסוף/ריק
for (let i = 0; i < 300; i++) {
  const index = Math.floor(rnd() * 24) - 4;
  const delta = pick([-2, -1, 0, 1, 2]);
  const length = pick([0, 1, 5, 12, 14]);
  eq(NEW.advance(index, delta, length), OLD.tourAdvance(index, delta, length),
    `advance(${index},${delta},${length})`);
}

// 4) spotlightBox — מלבנים (כולל null/מידות-0/שליליים) × viewport × pad
for (let i = 0; i < 300; i++) {
  const rect = pick([
    null,
    { left: 0, top: 0, width: 0, height: 0 },
    { left: rnd() * 200 - 20, top: rnd() * 200 - 20, width: rnd() * 300, height: rnd() * 200 },
    { left: rnd() * 50, top: rnd() * 50, width: -5, height: rnd() * 40 },
    { left: 95, top: 95, width: 60, height: 60 },
  ]);
  const vw = pick([320, 768, 1024, 1920]);
  const vh = pick([480, 800, 1080]);
  const pad = pick([undefined, 0, 4, 10, 25]);
  const a = pad === undefined ? NEW.spotlight(rect, vw, vh) : NEW.spotlight(rect, vw, vh, pad);
  const b = pad === undefined ? OLD.spotlightBox(rect, vw, vh) : OLD.spotlightBox(rect, vw, vh, pad);
  eq(a, b, `spotlight(${JSON.stringify(rect)},${vw},${vh},${pad})`);
}

fs.rmSync(tdir, { recursive: true, force: true });
console.log(`🥇 זהב-הסיור: ישן≡חדש על ${n} השוואות (קבועים תו-בתו + 300×steps + 300×advance + 300×spotlight)`);
