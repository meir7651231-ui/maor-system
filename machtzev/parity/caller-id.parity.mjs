#!/usr/bin/env node
/** 🥇 רתמת-זהב · זיהוי-שיחה — הישן (maor/src/lib/callerId.ts, מתורגם-חי; ‏termOf האמיתי
 *  משורשר) ≡ החדש (Genesis new/boxes/caller-id.mjs) על קורפוס-LCG: ‏db-ים אקראיים ×
 *  מספרים בכל הצורות (מקומי/‎+972‎/00972/רעש) × דריסות-מונחים. אפס-סטייה. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert';

const require = createRequire('/home/user/maor-system/');
const ts = require('typescript');
const tdir = fs.mkdtempSync(path.join(os.tmpdir(), 'cid-'));
const src = fs.readFileSync('/home/user/maor-system/src/lib/callerId.ts', 'utf8');
const js = ts.transpileModule(src, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } })
  .outputText.replace("from './config'", "from './config.mjs'");
fs.writeFileSync(path.join(tdir, 'callerId.mjs'), js);
// ‏termOf האמיתי (verbatim מהמקור) — כדי שהישן ירוץ שלם
const cfgLines = fs.readFileSync('/home/user/maor-system/src/lib/config.ts', 'utf8').split('\n');
const termSrc = cfgLines.slice(118, 126).join('\n');
fs.writeFileSync(path.join(tdir, 'config.mjs'), ts.transpileModule(termSrc, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText);
const OLD = await import(pathToFileURL(path.join(tdir, 'callerId.mjs')).href);
const NEW = await import('/home/user/-ai-chat-server/new/boxes/caller-id.mjs');

let s = 20260824;
const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const pick = (a) => a[Math.floor(rnd() * a.length)];
const digits = (n) => Array.from({ length: n }, () => Math.floor(rnd() * 10)).join('');
const somePhone = () => pick(['05' + digits(8), '+972-5' + digits(1) + '-' + digits(7), '00972' + digits(9), '', '123', '02-' + digits(7)]);

const genDb = () => ({
  families: Array.from({ length: 1 + Math.floor(rnd() * 4) }, (_, i) => ({
    id: 'F' + i, name: 'משפחה' + i, phone: somePhone(), phone2: rnd() > 0.7 ? somePhone() : undefined,
    members: rnd() > 0.5 ? [{ id: 'M' + i, first: 'חבר' + i, phone: somePhone() }] : [],
  })),
  supporters: [{ id: 'S0', name: 'תורם', phone: somePhone() }],
  volunteers: rnd() > 0.5 ? [{ id: 'V0', name: 'מתנדבת', phone: somePhone() }] : undefined,
  tzCoordinators: rnd() > 0.5 ? [{ id: 'C0', name: 'רכזת', phone: somePhone() }] : undefined,
});
const kinds = ['family', 'member', 'supporter', 'volunteer', 'coordinator'];
const cfgs = [{ terms: {} }, { terms: { 'entity.family': 'לקוח', 'entity.supporter': 'ליד', 'entity.member': 'איש-קשר' } }];

let n = 0;
for (let i = 0; i < 400; i++) {
  const db = genDb();
  // מספרים: גם כאלה שבטוח קיימים ב-db וגם רעש
  const probes = [db.families[0].phone, db.supporters[0].phone, somePhone(), '05' + digits(8)];
  for (const raw of probes) {
    assert.deepStrictEqual(NEW.identifyCaller(db, raw), OLD.findCaller(db, raw), `findCaller: ${raw}`);
    n++;
  }
  for (const cfg of cfgs) for (const k of kinds) {
    assert.strictEqual(NEW.kindLabel(cfg, k), OLD.callerKindLabel(cfg, k), `label:${k}`);
    n++;
  }
  const fam = db.families[0].id;
  assert.deepStrictEqual(NEW.familyContext({ ...db, deliveries: [], shopAssignments: [] }, fam), OLD.familyContext({ ...db, deliveries: [], shopAssignments: [] }, fam));
  n++;
}
fs.rmSync(tdir, { recursive: true, force: true });
console.log(`🥇 זהב-זיהוי-שיחה: ישן≡חדש על ${n} השוואות (400 db-ים × מספרים/תוויות/הקשר)`);
