#!/usr/bin/env node
/** 🥇 רתמת-זהב · מנוע-האתר-הציבורי — הישן (maor src/lib/publicSite.ts, מתורגם-חי)
 *  ≡ החדש (Genesis new/boxes/public-site.mjs) על קורפוס-LCG seed=20260824.
 *  11 חוטים, אפס-סטייה תו-בתו. בלי Date.now — שקע-הזמן מוזרק קבוע לשני-הצדדים. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert';

const require = createRequire('/home/user/maor-system/');
const ts = require('typescript');
const tdir = fs.mkdtempSync(path.join(os.tmpdir(), 'ps-'));

// זמן-קבוע (בלי Date.now) — מוזרק זהה לשני הצדדים; חצות-מקומי (TZ-סימטרי)
const NOW = Date.parse('2026-09-01T00:00:00');

// ── הישן: publicSite.ts בלי שורות-הייבוא; SITE_LANGS (types/config:65) מוזרק פנימה ──
const srcLines = fs.readFileSync('/home/user/maor-system/src/lib/publicSite.ts', 'utf8').split('\n');
const body = srcLines.filter((l) => !/^import\s/.test(l)).join('\n');
const shim = `const SITE_LANGS = ['he', 'en', 'yi'];\n`;
fs.writeFileSync(path.join(tdir, 'old.mjs'),
  ts.transpileModule(shim + body, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText);
const OLD = await import(pathToFileURL(path.join(tdir, 'old.mjs')).href);
const NEW = await import('/home/user/-ai-chat-server/new/boxes/public-site.mjs');

// ── קורפוס-LCG דטרמיניסטי ──
let s = 20260824;
const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const pick = (a) => a[Math.floor(rnd() * a.length)];

const langs = ['he', 'en', 'yi', 'zz', '', null, undefined];
const uiKeys = ['donate', 'contact', 'enter', 'goal', 'raised', 'daysLeft', 'poweredBy', 'dir', 'nope', ''];
const accents = ['#3366cc', '#abc', 'EC9C9C', ' #d97f7f ', '#zzzzzz', 'לא-צבע', '', '   ', null, undefined, '#000', '#ffffff', '#123456'];
const strs = ['שלום עולם', 'Hello', 'שפּענדן', '   ', '', 'x'];
const localizedVals = () => {
  const r = rnd();
  if (r < 0.15) return pick(strs);
  if (r < 0.25) return null;
  if (r < 0.32) return undefined;
  const o = {};
  for (const k of ['he', 'en', 'yi']) if (rnd() < 0.6) o[k] = pick(strs);
  if (rnd() < 0.1) o.zz = pick(strs);
  return o;
};
const nums = [1000, 500, 0, -5, 250, 1500, 333, 335, NaN, Infinity, 0.5, 999, undefined];
const ends = ['2026-09-11', '2026-09-01', '2026-08-01', '2027-01-01', '2026-09-11T18:30:00', '', 'זבל', '2026-13-40', undefined, null];
const currencies = ['₪', '$', '€', '', undefined];
const campaignObj = () => {
  const r = rnd();
  if (r < 0.08) return undefined;
  return { goal: pick(nums), raised: pick(nums), end: pick(ends), currency: pick(currencies) };
};
const siteObj = () => {
  const r = rnd();
  if (r < 0.1) return undefined;
  const o = {};
  if (rnd() < 0.85) o.langs = Array.from({ length: Math.floor(rnd() * 5) }, () => pick(langs));
  if (rnd() < 0.5) o.enabled = rnd() < 0.5;
  if (rnd() < 0.5) o.donateUrl = pick(['https://pay.me/x', '', 5, null, undefined]);
  return o;
};
const configObj = () => {
  const o = {};
  if (rnd() < 0.8) o.site = siteObj();
  if (rnd() < 0.6) o.integrations = { payments: rnd() < 0.8 ? { payUrl: pick(['https://p.io/q', '', 7, null, undefined]) } : undefined };
  return o;
};

let n = 0;
const cmp = (a, b, m) => { assert.deepStrictEqual(a, b, m); n++; };

// קבועים
cmp(NEW.UI_LABELS, OLD.SITE_UI, 'SITE_UI');
cmp(NEW.CORAL, OLD.CORAL_PALETTE, 'CORAL_PALETTE');

for (let i = 0; i < 500; i++) {
  const lang = pick(langs);
  cmp(NEW.isRtl(lang), OLD.isRtlLang(lang), 'isRtl ' + lang);

  const accent = pick(accents);
  cmp(NEW.palette(accent), OLD.sitePalette(accent), 'palette ' + accent);

  const commercial = rnd() < 0.5;
  cmp(NEW.vocab(commercial, lang), OLD.siteVocab(commercial, lang), 'vocab ' + commercial + ' ' + lang);

  const t = localizedVals();
  cmp(NEW.localize(t, lang), OLD.resolveLocalized(t, lang), 'localize ' + JSON.stringify(t) + ' ' + lang);

  const site = siteObj();
  cmp(NEW.langs(site), OLD.siteLangs(site), 'langs ' + JSON.stringify(site));

  const key = pick(uiKeys);
  cmp(NEW.ui(lang, key), OLD.siteUi(lang, key), 'ui ' + lang + ' ' + key);

  const c = campaignObj();
  cmp(NEW.campaign(c, NOW), OLD.campaignProgress(c, NOW), 'campaign ' + JSON.stringify(c));

  const cfg = configObj();
  cmp(NEW.hasSite(cfg), OLD.hasPublicSite(cfg), 'hasSite ' + JSON.stringify(cfg));
  cmp(NEW.donateUrl(cfg), OLD.siteDonateUrl(cfg), 'donateUrl ' + JSON.stringify(cfg));
}

fs.rmSync(tdir, { recursive: true, force: true });
console.log(`🥇 זהב-אתר-ציבורי: ישן≡חדש על ${n} השוואות (500 סבבים × 11 חוטים + 2 קבועים, כולל ריק/NaN/שבור/עברית/null/accent-לא-תקין)`);
