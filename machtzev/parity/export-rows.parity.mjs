#!/usr/bin/env node
/** 🥇 רתמת-זהב · שורות-הייצוא — הישן (maor src/lib/exportRows.ts מתורגם-חי, עם
 *  config.termOf + hebrew.hebDateFull + eventMeta.EV_META האמיתיים) ≡ החדש
 *  (Genesis new/boxes/export-rows.mjs) על קורפוס-LCG דטרמיניסטי seed=20260824:
 *  משפחות/תומכות/אירועים עם עברית/ריקים/undefined/נו״ן-סופית/עדיפויות-זרות/
 *  תאריכים-קבועים (בלי Date.now). אפס-סטייה, deepStrictEqual תא-בתא. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert';

const require = createRequire('/home/user/maor-system/');
const ts = require('typescript');
const tdir = fs.mkdtempSync(path.join(os.tmpdir(), 'xr-'));
const opts = { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } };
const emit = (name, src) =>
  fs.writeFileSync(path.join(tdir, name), ts.transpileModule(src, opts).outputText
    .replace(/from '\.\/(config|hebrew|eventMeta)'/g, "from './$1.mjs'"));

// המקור המלא, חי — import type נמחק בטרנספילציה; ייבואי-הריצה מנותבים לשכנים המקומיים
emit('exportRows.mjs', fs.readFileSync('/home/user/maor-system/src/lib/exportRows.ts', 'utf8'));
// hebrew.ts — אפס ייבואים (Intl בלבד) ⇒ הקובץ כולו כלשונו
emit('hebrew.mjs', fs.readFileSync('/home/user/maor-system/src/lib/hebrew.ts', 'utf8'));
// eventMeta.ts — ייבוא-טיפוסים בלבד ⇒ הקובץ כולו כלשונו
emit('eventMeta.mjs', fs.readFileSync('/home/user/maor-system/src/lib/eventMeta.ts', 'utf8'));
// config.ts — רק termOf (שאר הקובץ גורר ייבואים); config.ts:119-126 כלשונו
const cfgLines = fs.readFileSync('/home/user/maor-system/src/lib/config.ts', 'utf8').split('\n');
const termSrc = cfgLines.slice(118, 126).join('\n');
if (!/^export function termOf/.test(termSrc)) throw new Error('עוגן config.ts:119 זז — termOf לא במקום');
emit('config.mjs', termSrc);

const OLD = await import(pathToFileURL(path.join(tdir, 'exportRows.mjs')).href);
const NEW = await import('/home/user/-ai-chat-server/new/boxes/export-rows.mjs');

// ── קורפוס-LCG דטרמיניסטי ──
let s = 20260824;
const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const pick = (a) => a[Math.floor(rnd() * a.length)];
const maybe = (v) => (rnd() < 0.25 ? undefined : v);

const strs = ['כהן', 'בן-דוד', '', 'עם,פסיק', 'עם"גרש', 'א', 'O\'Brien', '  רווחים  '];
const marital = ['אלמן', 'אלמנה', 'נשוי', 'אלמן שכול', '', undefined];
const dates = ['2026-08-24', '2026-03-03', '2025-09-23', '2024-02-29', '2026-01-01', '', '2026-12-31', undefined, '2026-13-45'];
const evTypes = ['reminder', 'call', 'wedding', 'memorial', 'anniversary', 'bday', 'org', 'custom'];
const priorities = ['green', 'orange', 'red', 'x', ''];
const terms = [undefined, {}, { terms: {} }, { terms: { 'entity.family': 'בית אב' } }, { terms: { 'entity.family': '   ' } }, { terms: { 'entity.family': '' } }];

const mkFam = (i) => ({ id: 'f' + i, name: pick(strs), fatherId: maybe(pick(strs)), phone: maybe('05' + i), mother: maybe(pick(strs)), motherId: maybe('' + i), phone2: maybe('02'), city: maybe(pick(strs)), address: maybe(pick(strs)), maritalStatus: pick(marital), community: maybe(pick(strs)), notes: maybe(pick(strs)) });
const mkSup = () => ({ name: pick(strs), phone: maybe('054'), email: maybe('a@b.co'), idNum: maybe('123456782'), address: maybe(pick(strs)), cat: maybe(pick(strs)), forWho: maybe(pick(strs)) });
const mkEv = (famCount) => {
  const type = pick(evTypes);
  return { title: pick(strs), type, customType: rnd() < 0.3 ? pick(strs) : undefined, date: pick(dates), time: maybe('1' + Math.floor(rnd() * 10) + ':00'), famId: rnd() < 0.5 ? 'f' + Math.floor(rnd() * (famCount + 2)) : undefined, priority: pick(priorities), notes: maybe(pick(strs)), done: rnd() < 0.5 };
};

let n = 0;
for (let i = 0; i < 300; i++) {
  const famCount = Math.floor(rnd() * 5);
  const db = {
    families: Array.from({ length: famCount }, (_, j) => mkFam(j)),
    supporters: Array.from({ length: Math.floor(rnd() * 5) }, mkSup),
    events: Array.from({ length: Math.floor(rnd() * 6) }, () => mkEv(famCount)),
  };
  const config = pick(terms);
  assert.deepStrictEqual(NEW.familiesImportFormatRows(db), OLD.familiesImportFormatRows(db), `families #${i}`);
  n++;
  assert.deepStrictEqual(NEW.supportersImportFormatRows(db), OLD.supportersImportFormatRows(db), `supporters #${i}`);
  n++;
  assert.deepStrictEqual(NEW.eventsCsvRows(db, config), OLD.eventsCsvRows(db, config), `events #${i}`);
  n++;
}
fs.rmSync(tdir, { recursive: true, force: true });
console.log(`🥇 זהב-שורות-הייצוא: ישן≡חדש על ${n} השוואות (300 סבבים × 3 יצרנים, תא-בתא כולל עברי/termOf/נו״ן-סופית)`);
