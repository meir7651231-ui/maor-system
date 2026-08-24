#!/usr/bin/env node
/** 🥇 רתמת-זהב · donation-partition — הישן (maor src/lib/donationPartition.ts,
 *  מתורגם-חי עם typescript של מאור) ≡ החדש (Genesis new/boxes/donation-partition.mjs)
 *  על קורפוס-LCG דטרמיניסטי seed=20260824: תומכים עם תרומות (rid/purpose/date/
 *  amount/cur) · ייעודים-עבריים · ריקים/undefined · hist · מעבר-תומך/ייעוד ·
 *  רשימות-ייעוד ל-donAllowedKeys. אפס-סטייה. בלי Date.now (תאריכים קבועים). */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert';

const require = createRequire('/home/user/maor-system/');
const ts = require('typescript');
const tdir = fs.mkdtempSync(path.join(os.tmpdir(), 'donpart-'));
const M = '/home/user/maor-system/src';

// ── מקור יחיד: donationPartition.ts בלי שורת-ה-import type (15) ──
const L = (p) => fs.readFileSync(p, 'utf8').split('\n');
const dpLines = L(`${M}/lib/donationPartition.ts`);
const dpBody = [...dpLines.slice(0, 14), ...dpLines.slice(15)].join('\n'); // מסירים 'import type ...' בשורה 15
const combined = [
  'type Donation = any; type Supporter = any;',
  dpBody,
].join('\n');
fs.writeFileSync(path.join(tdir, 'old.mjs'),
  ts.transpileModule(combined, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText);
const OLD = await import(pathToFileURL(path.join(tdir, 'old.mjs')).href);
const NEW = await import('/home/user/-ai-chat-server/new/boxes/donation-partition.mjs');

// ── קורפוס-LCG דטרמיניסטי ──
let s = 20260824;
const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const pick = (a) => a[Math.floor(rnd() * a.length)];
const maybe = (v) => (rnd() < 0.5 ? v : undefined);

const purposes = ['חינוך', 'רפואה', ' חינוך ', '', '   ', undefined, null, 'בניין', 'a', 'a', 'ב\tג'];
const dates = ['2024-01-01', '2024-02-15', '2023-11-30', '2024-02-15', '2022-06-06', '2025-12-31'];
const curs = ['₪', '$', undefined];
const rids = ['D-1', 'D-2', 'D-3', 'D-10', 'D-100', 'D-2', 'D-abc'];
const clone = (o) => JSON.parse(JSON.stringify(o));

const mkDon = (i) => ({
  rid: 'D-' + i + '_' + Math.floor(rnd() * 5), date: pick(dates),
  amount: Math.floor(rnd() * 1000), cur: pick(curs), purpose: pick(purposes),
  designation: maybe('חתן'), note: maybe('הע' + i),
});
const mkSup = (i) => ({
  id: 's' + i, name: pick(['כהן', 'לוי', 'מרים', '']),
  donations: rnd() < 0.85 ? Array.from({ length: Math.floor(rnd() * 5) }, (_, k) => mkDon(i * 10 + k)) : undefined,
  hist: rnd() < 0.4 ? Array.from({ length: Math.floor(rnd() * 3) }, () => ({ d: pick(dates), a: Math.floor(rnd() * 300) })) : undefined,
});

let n = 0;
const cmp = (a, b, m) => { assert.deepStrictEqual(a, b, m); n++; };

// SHARED_PURPOSE_KEY — קבוע
cmp(NEW.SHARED_PURPOSE_KEY, OLD.SHARED_PURPOSE_KEY, 'SHARED_PURPOSE_KEY');

for (let r = 0; r < 400; r++) {
  // 1) purposeKeyOf — ייעודים עם רווחים/ריק/null
  const d = { purpose: pick(purposes) };
  cmp(NEW.purposeKeyOf(clone(d)), OLD.purposeKeyOf(clone(d)), `purposeKeyOf(${JSON.stringify(d.purpose)})`);

  // 2) donAllowedKeys — רשימות-ייעוד (כולל >29, כפולים, ריקים)
  const allowed = Array.from({ length: Math.floor(rnd() * 35) }, () => pick([...purposes, ' ', 'k' + Math.floor(rnd() * 40)]))
    .map((x) => (x == null ? '' : String(x)));
  cmp(NEW.donAllowedKeys(clone(allowed)), OLD.donAllowedKeys(clone(allowed)), 'donAllowedKeys');

  // 3) explodeSupporter — פירוק תומך
  const sp = mkSup(r);
  cmp(NEW.explodeSupporter(clone(sp)), OLD.explodeSupporter(clone(sp)), 'explodeSupporter');

  // 4) reassembleDonations — מסמכים מעורבים (כולל זרים) + מיון
  const sups = Array.from({ length: 1 + Math.floor(rnd() * 3) }, (_, i) => mkSup(r * 100 + i));
  const docs = sups.flatMap((x) => NEW.explodeSupporter(clone(x)));
  const base = clone(sups[0]);
  delete base.donations; // base = בסיס בלי תרומות (כמו במסלול-B)
  cmp(NEW.reassembleDonations(clone(base), clone(docs)),
      OLD.reassembleDonations(clone(base), clone(docs)), 'reassembleDonations');

  // 5) donationPartitionDiff — prev/next עם שינויים/הסרות/מעברים
  const prev = Array.from({ length: 1 + Math.floor(rnd() * 3) }, (_, i) => mkSup(r * 7 + i));
  const next = clone(prev).map((x) => {
    if (rnd() < 0.3 && x.donations && x.donations.length) x.donations[0].amount = 9999; // שינוי
    if (rnd() < 0.2 && x.donations && x.donations.length > 1) x.donations.pop();          // הסרה
    if (rnd() < 0.2) x.id = x.id + '_moved';                                              // מעבר-תומך
    return x;
  });
  if (rnd() < 0.3) next.push(mkSup(r * 7 + 50)); // תומך חדש
  cmp(NEW.donationPartitionDiff(clone(prev), clone(next)),
      OLD.donationPartitionDiff(clone(prev), clone(next)), 'donationPartitionDiff');

  // 6) round-trip (אינווריאנט): reassemble(sp, explode(sp)) ≡ sp על שני המנועים
  const rt = mkSup(r * 3);
  const rtBase = clone(rt); delete rtBase.donations;
  cmp(NEW.reassembleDonations(clone(rtBase), NEW.explodeSupporter(clone(rt))),
      OLD.reassembleDonations(clone(rtBase), OLD.explodeSupporter(clone(rt))), 'round-trip');
}

fs.rmSync(tdir, { recursive: true, force: true });
console.log(`🥇 זהב-donation-partition: ישן≡חדש על ${n} השוואות (400 סבבים × 6 שערים: purposeKeyOf · donAllowedKeys · explode · reassemble · diff · round-trip)`);
