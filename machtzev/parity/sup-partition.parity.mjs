#!/usr/bin/env node
/** 🥇 רתמת-זהב · פירוק-התומכים — הישן (maor src/lib/supporterPartition.ts מתורגם-חי,
 *  בשלמותו; import type בלבד ⇒ נמחק בתרגום) ≡ החדש (Genesis new/boxes/sup-partition.mjs)
 *  על קורפוס-LCG: ייעודים עבריים/ריקים/רווחים/null × אוספים נאכפים/לא-נאכפים ×
 *  spId מחרוזת/מספר/חסר/לא-במפה × רשימות-הרשאה עם כפילויות/ריקים/גלישת-29 ×
 *  מסמכים עם/בלי skey ו-audit. אפס-סטייה. דטרמיניסטי — seed=20260824, בלי Date.now. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert';

const require = createRequire('/home/user/maor-system/');
const ts = require('typescript');
const tdir = fs.mkdtempSync(path.join(os.tmpdir(), 'supp-'));
const engineSrc = fs.readFileSync('/home/user/maor-system/src/lib/supporterPartition.ts', 'utf8');
fs.writeFileSync(path.join(tdir, 'sp.mjs'), ts.transpileModule(engineSrc, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText);
const OLD = await import(pathToFileURL(path.join(tdir, 'sp.mjs')).href);
const NEW = await import('/home/user/-ai-chat-server/new/boxes/sup-partition.mjs');

let s = 20260824;
const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const pick = (a) => a[Math.floor(rnd() * a.length)];

let n = 0;
// 1) הקבועים ≡ תו-בתו
assert.strictEqual(NEW.SHARED_SUP_KEY, OLD.SHARED_SUP_KEY, 'SHARED_SUP_KEY'); n++;
assert.strictEqual(NEW.SUP_KEYED_COLS.join('|'), OLD.SUP_KEYED_COLS.join('|'), 'SUP_KEYED_COLS'); n++;

const forWhos = ['רפואה', 'חינוך', 'משפחת כהן', '  מרווח  ', '   ', '', null, undefined, 'רפואה'];
const cols = ['supporters', 'events', 'families', 'donations', ''];
const spIds = ['s1', 's2', 's3', 'sX', '', 123, null, undefined];

// 2) supKeyOf ≡ + מפה נבנית ל-docSkey
for (let i = 0; i < 400; i++) {
  const sp = { forWho: pick(forWhos) };
  assert.strictEqual(NEW.supKeyOf(sp), OLD.supKeyOf(sp), `supKeyOf ${JSON.stringify(sp)}`); n++;
}

// 3) supKeyMapOf ≡ (כמערך זוגות — סדר נשמר)
for (let i = 0; i < 200; i++) {
  const list = Array.from({ length: Math.floor(rnd() * 6) }, (_, j) => ({ id: `s${j}`, forWho: pick(forWhos) }));
  const oldMap = [...OLD.supKeyMapOf(list)];
  const newMap = [...NEW.supKeyMapOf(list)];
  assert.strictEqual(JSON.stringify(newMap), JSON.stringify(oldMap), `supKeyMapOf ${JSON.stringify(list)}`); n++;
}

// 4) docSkey ≡ (אוסף × spId × מפה)
for (let i = 0; i < 400; i++) {
  const list = Array.from({ length: Math.floor(rnd() * 4) }, (_, j) => ({ id: `s${j}`, forWho: pick(forWhos) }));
  const map = OLD.supKeyMapOf(list);
  const col = pick(cols);
  const data = col === 'supporters' ? { forWho: pick(forWhos) } : { spId: pick(spIds), forWho: pick(forWhos) };
  assert.strictEqual(NEW.docSkey(col, data, map), OLD.docSkey(col, data, map), `docSkey col=${col} data=${JSON.stringify(data)}`); n++;
}

// 5) supAllowedKeys ≡ (כפילויות/ריקים/גלישת-29)
const allowedPool = ['רפואה', 'חינוך', '  רפואה  ', '', '   ', 'a', 'b', 'רפואה', 'ג', 'ד'];
for (let i = 0; i < 300; i++) {
  const len = Math.floor(rnd() * 40); // עד 39 ⇒ בודק גם גלישה מעל 29
  const allowed = Array.from({ length: len }, () => rnd() < 0.5 ? pick(allowedPool) : `k${Math.floor(rnd() * 60)}`);
  assert.strictEqual(NEW.supAllowedKeys(allowed).join('|'), OLD.supAllowedKeys(allowed).join('|'), `supAllowedKeys len=${len}`); n++;
}

// 6) stripSupKey / stripAuditMeta ≡ (עם/בלי המפתח)
for (let i = 0; i < 200; i++) {
  const base = { a: Math.floor(rnd() * 5), forWho: pick(forWhos) };
  const withKey = rnd() < 0.5 ? { ...base, skey: pick(forWhos) } : { ...base };
  assert.strictEqual(JSON.stringify(NEW.stripSupKey(withKey)), JSON.stringify(OLD.stripSupKey(withKey)), 'stripSupKey'); n++;
  const meta = rnd() < 0.5 ? { seq: i, audit: [1, 2, 3] } : { seq: i };
  assert.strictEqual(JSON.stringify(NEW.stripAuditMeta(meta)), JSON.stringify(OLD.stripAuditMeta(meta)), 'stripAuditMeta'); n++;
}

fs.rmSync(tdir, { recursive: true, force: true });
console.log(`🥇 זהב-פירוק-התומכים: ישן≡חדש על ${n} השוואות (קבועים + supKeyOf/Map/docSkey/allowedKeys/strip על קורפוס-קצה)`);
