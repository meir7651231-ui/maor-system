#!/usr/bin/env node
/** 🥇 רתמת-זהב · תבניות-ההודעה — הישן (maor src/lib/templates.ts מתורגם-חי, בשלמותו)
 *  ≡ החדש (Genesis new/boxes/templates.mjs) על קורפוס-LCG: מפתחות מוכרים/לא-מוכרים/
 *  ריקים × דריסות-ארגון (ריק/רווחים/עם-{משתנים}/עברית/רב-שורתי/undefined/null) ×
 *  משתנים (חסרים/עודפים/ערך-ריק/ערך-שמכיל-{משתנה-אחר} — החלפה סדרתית). אפס-סטייה.
 *  דטרמיניסטי — seed=20260824, בלי Date.now. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert';

const require = createRequire('/home/user/maor-system/');
const ts = require('typescript');
const tdir = fs.mkdtempSync(path.join(os.tmpdir(), 'tpl-'));
// המנוע כולו טהור (import type בלבד — נמחק בתרגום) — מתורגם חי, בשלמותו
const engineSrc = fs.readFileSync('/home/user/maor-system/src/lib/templates.ts', 'utf8');
fs.writeFileSync(path.join(tdir, 'templates.mjs'), ts.transpileModule(engineSrc, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText);
const OLD = await import(pathToFileURL(path.join(tdir, 'templates.mjs')).href);
const NEW = await import('/home/user/-ai-chat-server/new/boxes/templates.mjs');

let s = 20260824;
const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const pick = (a) => a[Math.floor(rnd() * a.length)];

let n = 0;
// 1) המילון ≡ תו-בתו (key·label·vars·def — הנוסחים ההיסטוריים)
assert.strictEqual(JSON.stringify(NEW.TEMPLATE_DEFS), JSON.stringify(OLD.TEMPLATE_DEFS), 'TEMPLATE_DEFS');
n++;
// 2) רשימת-המפתחות ≡ (סדר נשמר)
assert.strictEqual(NEW.TEMPLATE_KEYS.join('|'), OLD.TEMPLATE_KEYS.join('|'), 'TEMPLATE_KEYS');
n++;

// 3) רינדור ≡ על הקורפוס
const keys = [...OLD.TEMPLATE_KEYS, 'wa.unknown', '', 'wa.delivery '];
const overrideTexts = ['', '   ', '\t\n', 'היי {name} מ{org}!', '{org}{org} · {link}',
  'טקסט בלי משתנים', '{lo} לא-מוכר נשאר', 'שתי\nשורות {name}', '₪{amount} — {what}',
  ' מרופד {name} ', '🚚🙏 {first}'];
const varNames = ['name', 'org', 'what', 'amount', 'first', 'link', 'extra'];
const varValues = ['דנה', '', 'מאור החסד', '120', '{org}', 'x{name}x', '—', 'חוג ציור', ' ', 'wa.me/1'];
const mkVars = () => {
  const v = {};
  const count = Math.floor(rnd() * 6); // 0–5 משתנים
  for (let j = 0; j < count; j++) v[pick(varNames)] = pick(varValues);
  return v;
};
const mkCfg = () => {
  const kind = Math.floor(rnd() * 6);
  if (kind === 0) return undefined;
  if (kind === 1) return {};
  if (kind === 2) return { templates: undefined };
  if (kind === 3) return { templates: {} };
  const t = {};
  const count = 1 + Math.floor(rnd() * 3);
  for (let j = 0; j < count; j++) t[pick(keys)] = pick(overrideTexts);
  return { templates: t };
};

for (let i = 0; i < 600; i++) {
  const cfg = mkCfg(), key = pick(keys), vars = mkVars();
  const tag = `key="${key}" cfg=${JSON.stringify(cfg)} vars=${JSON.stringify(vars)}`;
  assert.strictEqual(NEW.renderTemplate(cfg, key, vars), OLD.renderTemplate(cfg, key, vars), tag);
  n++;
}
fs.rmSync(tdir, { recursive: true, force: true });
console.log(`🥇 זהב-תבניות: ישן≡חדש על ${n} השוואות (מילון+מפתחות תו-בתו + 600 רינדורים: דריסות/ריקים/משתנים-סדרתיים)`);
