#!/usr/bin/env node
/** 🥇 רתמת-זהב · המדריך המהיר — הישן (maor src/lib/guide.ts + termOf מ-config.ts,
 *  מתורגם-חי) ≡ החדש (Genesis new/boxes/guide.mjs) על קורפוס-LCG seed=20260824:
 *  מצבי-מודולים אקראיים × מילוני-terms (ריק/null/רווחים/עברית/לא-מחרוזת). אפס-סטייה.
 *  דטרמיניסטי — בלי Date.now, בלי אקראיות-אמת. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert';

const require = createRequire('/home/user/maor-system/');
const ts = require('typescript');
const tdir = fs.mkdtempSync(path.join(os.tmpdir(), 'gd-'));
const opts = { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } };
// termOf בלבד מ-config.ts (שורות 119-126) — שאר הקובץ גורר imports של הצד-IO
const cfgLines = fs.readFileSync('/home/user/maor-system/src/lib/config.ts', 'utf8').split('\n');
fs.writeFileSync(path.join(tdir, 'config.mjs'), ts.transpileModule(cfgLines.slice(118, 126).join('\n'), opts).outputText);
// guide.ts בשלמותו — import-הטיפוסים נמחק בטרנספילציה; import-הריצה מנותב לקובץ המקומי
const guideOut = ts.transpileModule(fs.readFileSync('/home/user/maor-system/src/lib/guide.ts', 'utf8'), opts)
  .outputText.replace("from './config'", "from './config.mjs'");
fs.writeFileSync(path.join(tdir, 'guide.mjs'), guideOut);
const OLD = await import(pathToFileURL(path.join(tdir, 'guide.mjs')).href);
const NEW = await import('/home/user/-ai-chat-server/new/boxes/guide.mjs');

let n = 0;
// 1) הקבועים — ביט-זהה
for (const k of ['GUIDE_INTRO_LABEL', 'GUIDE_INTRO', 'GUIDE_RECIPES_LABEL', 'GUIDE_RECIPES', 'GUIDE_FOOT']) {
  assert.strictEqual(NEW[k], OLD[k], `קבוע ${k}`); n++;
}
assert.deepStrictEqual(NEW.GUIDE_SECTIONS, OLD.GUIDE_SECTIONS, 'GUIDE_SECTIONS'); n++;

// 2) קורפוס-LCG: מודולים × מילונים
let s = 20260824;
const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const pick = (a) => a[Math.floor(rnd() * a.length)];
const MODULES = ['families', 'courses', 'supporters', 'calendar', 'tzedaka', 'shop'];
const TERM_KEYS = ['entity.family', 'entity.rooms', 'entity.room', 'entity.course',
  'entity.teacher', 'entity.donation', 'entity.enrollment', 'nav.courses'];
const VALUES = ['לקוח', 'קורס', 'מדריכה', 'עסקה', 'רישום', 'סטודיו', 'סטודיואים',
  '', '  ', ' חדר טיפולים ', 'client', 0, null, undefined];
const mkConfig = () => {
  const kind = rnd();
  if (kind < 0.15) return undefined;
  if (kind < 0.25) return {};
  if (kind < 0.3) return { terms: null };
  const terms = {};
  for (const k of TERM_KEYS) if (rnd() < 0.6) terms[k] = pick(VALUES);
  return { terms };
};
for (let i = 0; i < 500; i++) {
  const on = new Set(MODULES.filter(() => rnd() < 0.6));
  const isModuleOn = (m) => on.has(m);
  const config = mkConfig();
  assert.deepStrictEqual(NEW.guideSections(isModuleOn, config), OLD.guideSections(isModuleOn, config),
    `guideSections סבב ${i}: on=${[...on]} cfg=${JSON.stringify(config)}`);
  n++;
  assert.strictEqual(NEW.guideRecipes(config), OLD.guideRecipes(config),
    `guideRecipes סבב ${i}: cfg=${JSON.stringify(config)}`);
  n++;
}
fs.rmSync(tdir, { recursive: true, force: true });
console.log(`🥇 זהב-המדריך: ישן≡חדש על ${n} השוואות (6 קבועים + 500 סבבים × סעיפים+מתכונים)`);
