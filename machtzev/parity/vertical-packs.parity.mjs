#!/usr/bin/env node
/** 🥇 רתמת-זהב · ורטיקלים — הישן (maor/src/lib/verticalPacks.ts, מתורגם-חי) ≡ החדש
 *  (Genesis new/boxes/vertical-packs.mjs) על קורפוס דטרמיניסטי: קונפיגים מחוללי-LCG
 *  × כל 13 החבילות × מזהים-זרים. אפס-סטייה מותרת. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert';

const require = createRequire('/home/user/maor-system/');
const ts = require('typescript');
const src = fs.readFileSync('/home/user/maor-system/src/lib/verticalPacks.ts', 'utf8');
const js = ts.transpileModule(src, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
const tmp = path.join(os.tmpdir(), 'vp-old-' + process.pid + '.mjs');
fs.writeFileSync(tmp, js);
const OLD = await import(pathToFileURL(tmp).href);
const NEW = await import('/home/user/-ai-chat-server/new/boxes/vertical-packs.mjs');

// LCG דטרמיניסטי (seed קבוע — L: בלי Math.random ברתמות)
let s = 20260824;
const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];

const themes = ['or-rishon', 'tsohar', 'kehila', 'heichal', undefined];
const motions = ['calm', 'snappy', 'bold', undefined];
const genCfg = () => {
  const c = { slug: pick(['root', 'demo', 'org-x']), name: 'ארגון ' + Math.floor(rnd() * 1000), terms: {}, modules: {}, features: {} };
  if (rnd() > 0.5) c.terms = { member: pick(['ותיק', 'לקוח', 'תלמידה']) };
  if (rnd() > 0.5) c.modules = { shop: rnd() > 0.5, tzedaka: rnd() > 0.5 };
  if (rnd() > 0.5) c.features = { 'core.taxreceipt': rnd() > 0.5 };
  const th = pick(themes); if (th) c.theme = th;
  const mo = pick(motions); if (mo) c.motion = mo;
  if (rnd() > 0.5) c.emoji = pick(['🕎', '🏗️', '💇']);
  if (rnd() > 0.4) { c.accent = '#' + Math.floor(rnd() * 0xffffff).toString(16).padStart(6, '0'); if (rnd() > 0.5) c.accentCustom = true; }
  if (rnd() > 0.6) c.firebase = { apiKey: 'K' + Math.floor(rnd() * 100) };
  return c;
};

const ids = [...OLD.VERTICAL_PACKS.map((p) => p.id), 'none', '', 'CHESED'];
let n = 0;
// 1) אטום-הנתונים ≡ המקור המוערך
assert.deepStrictEqual(JSON.parse(JSON.stringify(NEW.PACKS)), JSON.parse(JSON.stringify(OLD.VERTICAL_PACKS)), 'PACKS≠מקור');
assert.deepStrictEqual(NEW.COMMERCIAL_OFF, OLD.COMMERCIAL_OFF, 'COMMERCIAL_OFF≠מקור');
// 2) התנהגות-ההחלה זהה על הקורפוס
for (let i = 0; i < 500; i++) {
  const cfg = genCfg();
  for (const id of ids) {
    const a = OLD.applyVerticalPack(structuredClone(cfg), id);
    const b = NEW.applyPack(structuredClone(cfg), id);
    assert.deepStrictEqual(b, a, `סטייה: pack=${id} cfg=${JSON.stringify(cfg)}`);
    n++;
  }
}
fs.unlinkSync(tmp);
console.log(`🥇 זהב-ורטיקלים: ישן≡חדש על ${n} השוואות (500 קונפיגים × ${ids.length} מזהים) + נתונים ביט-זהים`);
