#!/usr/bin/env node
/** 🥇 רתמת-זהב · ייצוא-השמות — הישן (maor csvx.ts+config.isAdminUser, מתורגם-חי) ≡ החדש
 *  (Genesis new/boxes/names-export.mjs) על קורפוס-LCG: שורות עם הזרקות-CSV/פסיקים/
 *  גרשיים/שורות-חדשות/עברית × מיילים/רשימות-מנהלים. אפס-סטייה. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert';

const require = createRequire('/home/user/maor-system/');
const ts = require('typescript');
const tdir = fs.mkdtempSync(path.join(os.tmpdir(), 'nx-'));
// csvx בלי הצד-DOM: מחלצים csvEscape+toCsv בלבד (downloadCsv=גבול-IO, לא ברתמה)
const csvxLines = fs.readFileSync('/home/user/maor-system/src/lib/csvx.ts', 'utf8').split('\n');
const csvxSrc = csvxLines.slice(8, 24).join('\n'); // type Cell + csvEscape + toCsv
fs.writeFileSync(path.join(tdir, 'csvx.mjs'), ts.transpileModule(csvxSrc, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText);
const cfgLines = fs.readFileSync('/home/user/maor-system/src/lib/config.ts', 'utf8').split('\n');
const adminSrc = cfgLines.slice(672, 679).join('\n');
fs.writeFileSync(path.join(tdir, 'admin.mjs'), ts.transpileModule(adminSrc, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText);
const OLDX = await import(pathToFileURL(path.join(tdir, 'csvx.mjs')).href);
const OLDA = await import(pathToFileURL(path.join(tdir, 'admin.mjs')).href);
const NEW = await import('/home/user/-ai-chat-server/new/boxes/names-export.mjs');

let s = 20260824;
const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const pick = (a) => a[Math.floor(rnd() * a.length)];
const cells = ['שם רגיל', '=SUM(A1)', '+972501234', '-5', '@cmd', 'עם,פסיק', 'עם"גרש', 'שתי\nשורות', '\tטאב', '', 0, 42, 'רגיל2'];
const emails = [null, '', 'a@b.co', 'ADMIN@ORG.CO', ' admin@org.co '];
const adminLists = [undefined, [], ['admin@org.co'], ['x@y.z', 'Admin@Org.Co']];

let n = 0;
for (let i = 0; i < 300; i++) {
  const rows = Array.from({ length: 1 + Math.floor(rnd() * 5) }, () =>
    Array.from({ length: 1 + Math.floor(rnd() * 6) }, () => pick(cells)));
  const userEmail = pick(emails), adminEmails = pick(adminLists);
  const res = NEW.exportNames({ rows, userEmail, adminEmails });
  // 1) שער-המנהל ≡ isAdminUser הישן
  const oldAllowed = OLDA.isAdminUser({ adminEmails }, userEmail);
  assert.strictEqual(res.allowed, oldAllowed, `gate: ${userEmail} vs ${JSON.stringify(adminEmails)}`);
  n++;
  // 2) התוכן ≡ toCsv הישן (BOM + בריחות + הגנת-הזרקה) — תו-בתו
  if (res.allowed) {
    assert.strictEqual(res.content, OLDX.toCsv(rows), 'csv תוכן');
    n++;
  }
}
fs.rmSync(tdir, { recursive: true, force: true });
console.log(`🥇 זהב-ייצוא-השמות: ישן≡חדש על ${n} השוואות (300 סבבים: שער-מנהל + CSV תו-בתו כולל הזרקות)`);
