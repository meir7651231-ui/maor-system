#!/usr/bin/env node
/** 🥇 רתמת-זהב · שער-יציאת-המידע — הישן (maor src/lib/exportGate.ts שלם, מתורגם-חי)
 *  ≡ החדש (Genesis new/boxes/export-gate.mjs) על רצף-פעולות אקראי דטרמיניסטי
 *  (LCG seed=20260824): set(blocked×notify-חסר/קיים/null) · exportAllowed ·
 *  guardExport — השוואת כל ערך-חוזר + מוני-קריאות-toast בכל צעד. אפס-סטייה.
 *  שני הצדדים סינגלטון-מודול ⇒ רצף אחד ארוך, אותה פקודה לשניהם. בלי Date.now. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert';

const require = createRequire('/home/user/maor-system/');
const ts = require('typescript');
const tdir = fs.mkdtempSync(path.join(os.tmpdir(), 'xg-'));
const src = fs.readFileSync('/home/user/maor-system/src/lib/exportGate.ts', 'utf8');
fs.writeFileSync(path.join(tdir, 'exportGate.mjs'), ts.transpileModule(src, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText);
const OLD = await import(pathToFileURL(path.join(tdir, 'exportGate.mjs')).href);
const NEW = await import('/home/user/-ai-chat-server/new/boxes/export-gate.mjs');

let s = 20260824;
const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const pick = (a) => a[Math.floor(rnd() * a.length)];
const spyMake = () => { const f = () => { f.calls++; }; f.calls = 0; return f; };

let n = 0, sets = 0, guards = 0;
let oldSpy = null, newSpy = null; // הזוג-הפעיל (מוני-toast מקבילים)
for (let i = 0; i < 1000; i++) {
  const op = pick(['set', 'set', 'allowed', 'guard', 'guard', 'guard']);
  if (op === 'set') {
    const blocked = pick([true, false]);
    const notifyKind = pick(['spy', 'undefined', 'null']);
    if (notifyKind === 'spy') { oldSpy = spyMake(); newSpy = spyMake(); }
    else { oldSpy = null; newSpy = null; }
    const oldArg = notifyKind === 'spy' ? oldSpy : notifyKind === 'null' ? null : undefined;
    const newArg = notifyKind === 'spy' ? newSpy : notifyKind === 'null' ? null : undefined;
    OLD.setExportBlocked(blocked, oldArg);
    NEW.setExportBlocked(blocked, newArg);
    sets++;
  } else if (op === 'allowed') {
    assert.strictEqual(NEW.exportAllowed(), OLD.exportAllowed(), `allowed @${i}`);
    n++;
  } else {
    assert.strictEqual(NEW.guardExport(), OLD.guardExport(), `guard @${i}`);
    n++;
    guards++;
  }
  if (oldSpy) { assert.strictEqual(newSpy.calls, oldSpy.calls, `toast-count @${i}`); n++; }
  // אינווריאנט-הצלבה: guard מסכים עם allowed בכל צעד, בשני הצדדים
  assert.strictEqual(NEW.exportAllowed(), OLD.exportAllowed(), `cross @${i}`);
  n++;
}
fs.rmSync(tdir, { recursive: true, force: true });
console.log(`🥇 זהב-שער-הייצוא: ישן≡חדש על ${n} השוואות (1000 צעדים: ${sets} set · ${guards} guard · ערכים+מוני-toast תו-בתו)`);
