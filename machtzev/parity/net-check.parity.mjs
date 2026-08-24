#!/usr/bin/env node
/** 🥇 רתמת-זהב · net-check — הישן (maor/src/lib/netcheck.ts, מתורגם-חי) ≡ החדש
 *  (Genesis new/boxes/net-check.mjs) על קורפוס-LCG: origins × firebase-configs ×
 *  results. Math.random מוזרק-קבוע פר-סבב (cache-bust = IO) ⇒ דטרמיניזם מלא.
 *  משווים netCheckTargets (תו-בתו) + netCheckScript. השקע checkOne=fetch=גבול-IO,
 *  מחוץ לרתמה (תקדים names-export: downloadCsv). אפס-סטייה. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert';

const require = createRequire('/home/user/maor-system/');
const ts = require('typescript');
const tdir = fs.mkdtempSync(path.join(os.tmpdir(), 'nc-'));
// טרנספילציה-חיה של המקור המלא (import type נמחק ⇒ מודול עצמאי, checkOne פנימי לא-נקרא)
const oldSrc = fs.readFileSync('/home/user/maor-system/src/lib/netcheck.ts', 'utf8');
const oldOut = ts.transpileModule(oldSrc, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
fs.writeFileSync(path.join(tdir, 'old.mjs'), oldOut);
const OLD = await import(pathToFileURL(path.join(tdir, 'old.mjs')).href);
const NEW = await import('/home/user/-ai-chat-server/new/boxes/net-check.mjs');

let s = 20260824;
const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const pick = (a) => a[Math.floor(rnd() * a.length)];

const origins = ['https://a.co', 'https://sub.b.org', 'https://c.co:8443/base', 'http://d.local:3000', 'https:// x.co'.replace(' ', ''), 'https://עמותה.org'];
const firebases = [
  null, undefined, {},
  { projectId: 'p1', apiKey: 'k1' },
  { projectId: 'proj/2', apiKey: 'AIza&key=x' },
  { projectId: 'p3' },            // חסר apiKey ⇒ 'netcheck'
  { apiKey: 'k4' },               // חסר projectId ⇒ 'netcheck'
  { projectId: '', apiKey: '' },  // ריקים ⇒ 'netcheck' (|| falsy)
  { projectId: 'עברית', apiKey: 'a b' },
];
const domains = [undefined, '', 'a.co', 'firestore.googleapis.com', 'עמותה.org', 'x.co:8443'];

let n = 0;
const realRandom = Math.random;
try {
  for (let i = 0; i < 300; i++) {
    // ── חלק א׳: netCheckTargets תו-בתו (Math.random מוזרק-קבוע) ──
    const origin = pick(origins), firebase = pick(firebases);
    const mr = rnd();
    const token = mr.toString(36).slice(2);
    Math.random = () => mr;             // הישן קורא Math.random פנימית
    const oldT = OLD.netCheckTargets(origin, firebase);
    Math.random = realRandom;
    const newT = NEW.targets(origin, firebase, token);
    assert.deepStrictEqual(newT, oldT, `targets: origin=${origin} fb=${JSON.stringify(firebase)}`);
    n++;

    // ── חלק ב׳: netCheckScript ≡ script ──
    const results = Array.from({ length: Math.floor(rnd() * 5) }, () => ({
      ok: rnd() < 0.5,
      domain: pick(domains),
      ms: Math.floor(rnd() * 9000),
    }));
    assert.strictEqual(NEW.script(results), OLD.netCheckScript(results), 'script');
    n++;
  }
} finally {
  Math.random = realRandom;
  fs.rmSync(tdir, { recursive: true, force: true });
}
console.log(`🥇 זהב-net-check: ישן≡חדש על ${n} השוואות (300 סבבים: netCheckTargets תו-בתו + netCheckScript)`);
