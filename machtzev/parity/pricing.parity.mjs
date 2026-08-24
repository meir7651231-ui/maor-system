#!/usr/bin/env node
/** 🥇 רתמת-זהב · תמחור — הישן (maor src/lib/pricing.ts, מתורגם-חי עם typescript של מאור)
 *  ≡ החדש (Genesis new/boxes/pricing.mjs) על קורפוס-LCG seed=20260824:
 *  shekel · normalize (raw מזוהם) · computeQuote (cfg/גודל/הרחבות/mode) · DEFAULT_PRICES ·
 *  SIZE_LABELS · readPrices/writePrices (שקעי-localStorage מוזרקים). אפס-סטייה. בלי Date.now. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert';

const require = createRequire('/home/user/maor-system/');
const ts = require('typescript');
const tdir = fs.mkdtempSync(path.join(os.tmpdir(), 'px-'));

// המקור המלא, בניכוי שורות-ה-import (type בלבד + ALL_MODULES השכן) ⇒ מזריקים ALL_MODULES verbatim.
const srcLines = fs.readFileSync('/home/user/maor-system/src/lib/pricing.ts', 'utf8').split('\n');
const body = srcLines.filter((l) => !/^import\s/.test(l)).join('\n');
const ALL_MODULES_DECL =
  "const ALL_MODULES = ['families','courses','calendar','diary','supporters','reports','tzedaka','shop','shop7'];\n";
const outText = ts.transpileModule(ALL_MODULES_DECL + body, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText;
fs.writeFileSync(path.join(tdir, 'pricing.mjs'), outText);
const OLD = await import(pathToFileURL(path.join(tdir, 'pricing.mjs')).href);
const NEW = await import('/home/user/-ai-chat-server/new/boxes/pricing.mjs');

let s = 20260824;
const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const pick = (a) => a[Math.floor(rnd() * a.length)];
const nameOf = (m) => 'ש_' + m;
let n = 0;

// 0) קבועים: DEFAULT_PRICES + SIZE_LABELS ≡
assert.deepStrictEqual(NEW.DEFAULT_PRICES, OLD.DEFAULT_PRICES, 'DEFAULT_PRICES'); n++;
assert.deepStrictEqual(NEW.sizeLabels, OLD.SIZE_LABELS, 'SIZE_LABELS'); n++;

const MODS = ['families', 'courses', 'calendar', 'diary', 'supporters', 'reports', 'tzedaka', 'shop', 'shop7'];
const INTG = ['receipts', 'payments', 'whatsapp', 'sms', 'phone', 'gcal', 'drive', 'sheets', 'maps', 'esign', 'ai', 'campaign', 'zzz'];
const SIZES = ['small', 'medium', 'large', 'huge', ''];
const NUMISH = [() => Math.floor(rnd() * 1e6), () => -Math.floor(rnd() * 500), () => rnd() * 10, () => NaN, () => '100', () => null, () => 0];
const numish = () => pick(NUMISH)();

// בונה raw מזוהם לנירמול
const rawTable = () => {
  const r = {};
  if (rnd() < 0.85) r.base = numish();
  if (rnd() < 0.85) { r.modules = {}; for (const m of MODS) if (rnd() < 0.6) r.modules[m] = numish(); if (rnd() < 0.3) r.modules.junk = 5; }
  if (rnd() < 0.85) { r.integrations = {}; for (const k of INTG.slice(0, 12)) if (rnd() < 0.6) r.integrations[k] = numish(); if (rnd() < 0.3) r.integrations.junk = 9; }
  if (rnd() < 0.7) { r.sizeMult = {}; for (const g of ['small', 'medium', 'large']) if (rnd() < 0.6) r.sizeMult[g] = numish(); }
  if (rnd() < 0.6) r.setup = numish();
  if (rnd() < 0.5) { r.enterprise = {}; if (rnd() < 0.7) r.enterprise.oneTime = numish(); if (rnd() < 0.7) r.enterprise.annualMaintenance = numish(); }
  return r;
};

for (let i = 0; i < 400; i++) {
  // 1) shekel ≡ (מספרים + לא-מספרי)
  const sv = rnd() < 0.8 ? (rnd() < 0.5 ? Math.floor(rnd() * 5e6) : rnd() * 1000) : pick(['אבג', 'abc', '', '2026-08-24']);
  assert.strictEqual(NEW.shekel(sv), OLD.shekel(sv), `shekel(${sv})`); n++;

  // 2) normalize ≡ (raw מזוהם/null/לא-אובייקט)
  const raw = rnd() < 0.1 ? pick([null, undefined, 42, 'x', []]) : rawTable();
  assert.deepStrictEqual(NEW.normalize(raw), OLD.normalizePrices(raw), 'normalize'); n++;

  // 3) computeQuote ≡ (cfg/גודל/הרחבות/mode/טבלה מגוונת)
  const cfg = { modules: {} };
  for (const m of MODS) { const r = rnd(); if (r < 0.33) cfg.modules[m] = false; else if (r < 0.66) cfg.modules[m] = true; }
  const size = pick(SIZES);
  const addons = Array.from({ length: Math.floor(rnd() * 4) }, () => ({ key: pick(INTG), label: 'ל_' + pick(INTG) }));
  const mode = rnd() < 0.5 ? 'subscription' : 'enterprise';
  const prices = rnd() < 0.5 ? OLD.DEFAULT_PRICES : OLD.normalizePrices(rawTable());
  const oldQ = OLD.computeQuote(cfg, size, prices, nameOf, addons, mode);
  const newQ = NEW.quote(cfg, size, prices, nameOf, addons, mode);
  assert.deepStrictEqual(newQ, oldQ, 'computeQuote'); n++;

  // 4) readPrices/writePrices ≡ (שקעי-localStorage — OLD דרך global, NEW דרך הזרקה)
  const p = OLD.normalizePrices(rawTable());
  const oldStore = {};
  global.localStorage = { getItem: (k) => (k in oldStore ? oldStore[k] : null), setItem: (k, v) => { oldStore[k] = v; } };
  OLD.writePrices(p);
  const newStore = {};
  NEW.writePrices((k, v) => { newStore[k] = v; }, p);
  assert.deepStrictEqual(newStore, oldStore, 'writePrices bytes'); n++;
  assert.deepStrictEqual(NEW.readPrices((k) => (k in newStore ? newStore[k] : null)), OLD.readPrices(), 'readPrices roundtrip'); n++;
  // קריאה ריקה + JSON-שבור ≡ ברירת-מחדל
  global.localStorage = { getItem: () => (rnd() < 0.5 ? null : 'שבור{'), setItem: () => {} };
  const badGet = global.localStorage.getItem;
  assert.deepStrictEqual(NEW.readPrices(badGet), OLD.readPrices(), 'readPrices empty/broken'); n++;
}

fs.rmSync(tdir, { recursive: true, force: true });
delete global.localStorage;
console.log(`🥇 זהב-תמחור: ישן≡חדש על ${n} השוואות (400 סבבים: shekel · normalize · computeQuote · read/writePrices + קבועים)`);
