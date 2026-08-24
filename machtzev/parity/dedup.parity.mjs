#!/usr/bin/env node
/** 🥇 רתמת-זהב · dedup — הישן (maor src/lib/dedup.ts + validate.nameSortKey +
 *  supporters/lib.mergeHist + photoGallery.PHOTO_MAX, מתורגם-חי) ≡ החדש
 *  (Genesis new/boxes/dedup.mjs) על קורפוס-LCG דטרמיניסטי seed=20260824:
 *  משפחות/תורמים עם טלפוני-972/00/מציין-מקום · ת"ז מרופדות · שמות-עבריים חסיני-סדר ·
 *  ערים · תרומות (תאריך/סכום/מטבע) · hist · photos · סטטוסים. אפס-סטייה. בלי Date.now. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert';

const require = createRequire('/home/user/maor-system/');
const ts = require('typescript');
const tdir = fs.mkdtempSync(path.join(os.tmpdir(), 'dedup-'));
const M = '/home/user/maor-system/src';

// ── בונים מודול-מקור יחיד: deps אמיתיים + dedup.ts בלי שורות-הייבוא ──
const L = (p) => fs.readFileSync(p, 'utf8').split('\n');
const valSrc = L(`${M}/lib/validate.ts`).slice(50, 91).join('\n');       // normSearch·normName·NAME_TITLES·nameSortKey (51-91)
const histSrc = L(`${M}/components/supporters/lib.ts`).slice(556, 591).join('\n'); // mergeHist (557-591)
const dedupLines = L(`${M}/lib/dedup.ts`);
const dedupBody = [...dedupLines.slice(0, 7), ...dedupLines.slice(11)].join('\n'); // מסירים import type + 3 value-imports (8-11)
const combined = [
  'type HistEntry = any; type Family = any; type Member = any; type FamilyDoc = any; type Supporter = any;',
  valSrc,
  histSrc,
  'const PHOTO_MAX = 5;',
  dedupBody,
].join('\n');
fs.writeFileSync(path.join(tdir, 'old.mjs'),
  ts.transpileModule(combined, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText);
const OLD = await import(pathToFileURL(path.join(tdir, 'old.mjs')).href);
const NEW = await import('/home/user/-ai-chat-server/new/boxes/dedup.mjs');

// ── קורפוס-LCG דטרמיניסטי ──
let s = 20260824;
const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const pick = (a) => a[Math.floor(rnd() * a.length)];
const maybe = (v) => (rnd() < 0.5 ? v : undefined);

const phones = ['0501112222', '972501112222', '00972501112222', '0000000000', '052-333-4444', '', '03', '972-3-9998887', undefined];
const ids = ['123456789', '00000012345', '000000020', '123', '000000000', '', '58001234', undefined];
const hebNames = ['כהן', 'לוי', 'בן צבי רחל', 'רחל בן צבי', 'הרב דוד', 'דוד', 'משפחת אזולאי', 'אזולאי משפחת', 'מרים', '', undefined];
const cities = ['ירושלים', 'בני ברק', 'חיפה', '', undefined];
const emails = ['a@b.co', 'A@B.CO', ' a@b.co ', '', undefined];
const statuses = ['active', 'pending', 'inactive', undefined];
const dates = ['2024-01-01', '2024-02-15', '2023-11-30', '2024-02-15', '2022-06-06'];
const curs = ['₪', '$', undefined];

const mkDon = () => ({ date: pick(dates), amount: Math.floor(rnd() * 500), cur: pick(curs) });
const mkHist = () => ({ d: pick(dates), a: Math.floor(rnd() * 300), c: pick(curs), ...(rnd() < 0.3 ? { txn: 'T' + Math.floor(rnd() * 9) } : {}) });
const mkFam = (i) => ({
  id: 'f' + i, name: pick(hebNames), city: pick(cities), phone: pick(phones), phone2: pick(phones),
  email: pick(emails), status: pick(statuses), father: maybe(pick(hebNames)), mother: maybe(pick(hebNames)),
  motherId: pick(ids), fatherId: pick(ids), community: maybe('קהילה'), language: maybe('עברית'),
  maritalStatus: maybe('נשוי'), kidsHome: maybe(Math.floor(rnd() * 8)), kidsMarried: maybe(Math.floor(rnd() * 5)),
  fullSefach: maybe(rnd() < 0.5), notes: maybe('הערה' + i), createdAt: pick(dates),
  members: Array.from({ length: Math.floor(rnd() * 3) }, (_, k) => ({ id: 'm' + i + '_' + k, first: pick(hebNames) })),
  docs: Array.from({ length: Math.floor(rnd() * 2) }, (_, k) => ({ id: 'd' + i + '_' + k })),
});
const mkSup = (i) => ({
  id: 's' + i, name: pick(hebNames), city: pick(cities), phone: pick(phones), email: pick(emails),
  idNum: pick(ids), extId: maybe('E' + Math.floor(rnd() * 5)), cat: maybe('קטגוריה'), forWho: maybe('ייעוד'),
  notes: maybe('הע' + i), nextDate: maybe(pick(dates)), nextNote: maybe('תזכורת'),
  donations: Array.from({ length: Math.floor(rnd() * 4) }, mkDon),
  hist: rnd() < 0.5 ? Array.from({ length: Math.floor(rnd() * 3) }, mkHist) : undefined,
  photos: rnd() < 0.3 ? Array.from({ length: Math.floor(rnd() * 7) }, (_, k) => 'p' + k) : undefined,
  hok: maybe({ amount: 100 }), ayin: maybe({ x: 1 }),
});

const clone = (o) => JSON.parse(JSON.stringify(o));
let n = 0;
const cmp = (a, b, m) => { assert.deepStrictEqual(a, b, m); n++; };

for (let r = 0; r < 400; r++) {
  // 1) normPhone · normId — מחרוזות-קצה
  const ps = pick(phones) ?? '', is = pick(ids) ?? '';
  cmp(NEW.normPhone(ps), OLD.normPhone(ps), `normPhone(${ps})`);
  cmp(NEW.normId(is), OLD.normId(is), `normId(${is})`);

  // 2) findDuplicateGroups — משפחות
  const fams = Array.from({ length: 2 + Math.floor(rnd() * 6) }, (_, i) => mkFam(r * 10 + i));
  cmp(NEW.findDuplicateGroups(clone(fams)), OLD.findDuplicateGroups(clone(fams)), 'findDuplicateGroups');

  // 3) mergeFamilies — keeper + losers
  cmp(NEW.mergeFamilies(clone(fams[0]), clone(fams.slice(1, 3))),
      OLD.mergeFamilies(clone(fams[0]), clone(fams.slice(1, 3))), 'mergeFamilies');

  // 4) dupFieldValue + mergeFamiliesByFields — pick/edit אקראיים
  const fpick = {}, fedit = {};
  for (const d of NEW.DUP_FIELDS) { if (rnd() < 0.3) fpick[d.key] = Math.floor(rnd() * fams.length); if (rnd() < 0.2) fedit[d.key] = 'X' + r; }
  const someDef = pick(NEW.DUP_FIELDS);
  cmp(NEW.dupFieldValue(clone(fams), someDef, fpick, fedit),
      OLD.dupFieldValue(clone(fams), OLD.DUP_FIELDS.find((x) => x.key === someDef.key), fpick, fedit), 'dupFieldValue');
  cmp(NEW.mergeFamiliesByFields(clone(fams), fpick, fedit),
      OLD.mergeFamiliesByFields(clone(fams), fpick, fedit), 'mergeFamiliesByFields');

  // 5) findSupporterDupGroups — תורמים
  const sups = Array.from({ length: 2 + Math.floor(rnd() * 6) }, (_, i) => mkSup(r * 10 + i));
  cmp(NEW.findSupporterDupGroups(clone(sups)), OLD.findSupporterDupGroups(clone(sups)), 'findSupporterDupGroups');

  // 6) mergeSupporterInto · mergeSupportersGroup
  cmp(NEW.mergeSupporterInto(clone(sups[0]), clone(sups[1])),
      OLD.mergeSupporterInto(clone(sups[0]), clone(sups[1])), 'mergeSupporterInto');
  cmp(NEW.mergeSupportersGroup(clone(sups[0]), clone(sups.slice(1, 3))),
      OLD.mergeSupportersGroup(clone(sups[0]), clone(sups.slice(1, 3))), 'mergeSupportersGroup');

  // 7) supDupFieldValue + mergeSupportersByFields
  const spick = {}, sedit = {};
  for (const d of NEW.SUP_DUP_FIELDS) { if (rnd() < 0.3) spick[d.key] = Math.floor(rnd() * sups.length); if (rnd() < 0.2) sedit[d.key] = 'Y' + r; }
  const sDef = pick(NEW.SUP_DUP_FIELDS);
  cmp(NEW.supDupFieldValue(clone(sups), sDef, spick, sedit),
      OLD.supDupFieldValue(clone(sups), OLD.SUP_DUP_FIELDS.find((x) => x.key === sDef.key), spick, sedit), 'supDupFieldValue');
  cmp(NEW.mergeSupportersByFields(clone(sups), spick, sedit),
      OLD.mergeSupportersByFields(clone(sups), spick, sedit), 'mergeSupportersByFields');
}

fs.rmSync(tdir, { recursive: true, force: true });
console.log(`🥇 זהב-dedup: ישן≡חדש על ${n} השוואות (400 סבבים × 11 שערים: normPhone/normId · find/merge משפחות · find/merge תורמים · שדה-שדה)`);
