#!/usr/bin/env node
/** 🥇 רתמת-זהב · ייבוא-vCard — הישן (maor src/lib/vcardImport.ts, מתורגם-חי) ≡ החדש
 *  (Genesis new/boxes/vcard-import.mjs) על קורפוס-LCG דטרמיניסטי (seed=20260824):
 *  קבצי-vCard מורכבים אקראית — כרטיסים עם שמות-QP-עברית, טלפונים+תוויות (CELL/HOME/
 *  X-CUSTOM), מייל/ארגון/כתובת/הערה, קיפולי-שורה, PHOTO-base64 (מלכודת-הגבול), זבל
 *  קצר, כרטיסים-בלי-שם, ורעשי-פורמט. אפס-סטייה על parseVcards/isJunkContact/
 *  importableContacts/contactToRow/decodeQuotedPrintable. בלי Date.now. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert';

const require = createRequire('/home/user/maor-system/');
const ts = require('typescript');
const tdir = fs.mkdtempSync(path.join(os.tmpdir(), 'vcp-'));
const src = fs.readFileSync('/home/user/maor-system/src/lib/vcardImport.ts', 'utf8');
fs.writeFileSync(
  path.join(tdir, 'vc.mjs'),
  ts.transpileModule(src, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText,
);
const OLD = await import(pathToFileURL(path.join(tdir, 'vc.mjs')).href);
const NEW = await import('/home/user/-ai-chat-server/new/boxes/vcard-import.mjs');

let s = 20260824;
const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const pick = (a) => a[Math.floor(rnd() * a.length)];

// QP-קידוד של מחרוזת-UTF8 (לבניית שמות-עברית אמיתיים בקורפוס)
const qp = (str) => Array.from(new TextEncoder().encode(str)).map((b) => '=' + b.toString(16).toUpperCase().padStart(2, '0')).join('');
const HEB = ['כהן', 'לוי', 'מאיר', 'שרה', 'אברהם', 'רחל', 'תל אביב', 'רחוב הרצל', 'חסד', 'ניצן'];
const LABELS = ['CELL', 'HOME', 'WORK', 'FAX', 'MAIN', 'VOICE', 'PREF', 'X-CUSTOM', ''];
const PHONES = ['050-1234567', '03-9998888', '100', '+972501112222', '12', '', 'לא-מספר', '0509999999'];
const EMAILS = ['a@b.co', 'MAOR@EXAMPLE.COM', '', ' x@y.z '];
const rawPhoto = 'PHOTO;ENCODING=BASE64:/9j/4AAQSkZJRgABAQAAAQ==';

function randCard() {
  const L = [];
  L.push('BEGIN:VCARD');
  if (rnd() < 0.8) L.push('VERSION:' + pick(['2.1', '3.0', '4.0']));
  // N / FN — לעיתים QP-עברי, לעיתים ASCII, לעיתים חסר
  if (rnd() < 0.7) {
    const fam = pick(HEB), giv = pick(HEB);
    if (rnd() < 0.6) L.push('N;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:' + qp(fam) + ';' + qp(giv) + ';;;');
    else L.push('N:' + fam + ';' + giv + ';;;');
  }
  if (rnd() < 0.6) {
    const nm = pick(HEB) + ' ' + pick(HEB);
    if (rnd() < 0.6) L.push('FN;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:' + qp(nm));
    else L.push('FN:' + nm);
  }
  // טלפונים
  const nTel = Math.floor(rnd() * 4);
  for (let i = 0; i < nTel; i++) {
    const lab = pick(LABELS);
    let param = '';
    if (lab === 'X-CUSTOM') param = ';X-CUSTOM(CHARSET=UTF-8,ENCODING=QUOTED-PRINTABLE,' + qp(pick(HEB)) + ')';
    else if (lab) param = ';' + lab;
    L.push('TEL' + param + ':' + pick(PHONES));
  }
  if (rnd() < 0.5) L.push('EMAIL:' + pick(EMAILS));
  if (rnd() < 0.4) {
    const org = pick(HEB);
    if (rnd() < 0.5) L.push('ORG;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:' + qp(org) + ';');
    else L.push('ORG:' + org + (rnd() < 0.3 ? ';;' : ''));
  }
  if (rnd() < 0.3) L.push('TITLE:' + pick(['Manager', 'Dev', '']));
  if (rnd() < 0.3) L.push('ADR;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:;;' + qp(pick(HEB)) + ';' + qp(pick(HEB)) + ';;;');
  if (rnd() < 0.25) L.push('NOTE:' + pick(['hello', pick(HEB), '']));
  if (rnd() < 0.3) L.push(rawPhoto); // מלכודת-הגבול: base64 שנגמר ב-'=' לא יבלע END/BEGIN
  L.push('END:VCARD');
  return L.join(rnd() < 0.5 ? '\r\n' : '\n');
}

let n = 0;
for (let iter = 0; iter < 400; iter++) {
  // קובץ = 0..4 כרטיסים + רעשי-פורמט מסביב
  const cards = Array.from({ length: Math.floor(rnd() * 5) }, randCard);
  const junk = rnd() < 0.3 ? '\n\n  \n' : '';
  const text = junk + cards.join('\n') + (rnd() < 0.5 ? '\n' : '');

  const oldP = OLD.parseVcards(text);
  const newP = NEW.parseVcards(text);
  assert.strictEqual(JSON.stringify(newP), JSON.stringify(oldP), 'parseVcards @' + iter);
  n++;

  assert.strictEqual(
    JSON.stringify(NEW.importableContacts(text)),
    JSON.stringify(OLD.importableContacts(text)),
    'importableContacts @' + iter,
  );
  n++;

  for (const c of oldP) {
    assert.strictEqual(NEW.isJunkContact(c), OLD.isJunkContact(c), 'isJunkContact @' + iter);
    assert.strictEqual(JSON.stringify(NEW.contactToRow(c)), JSON.stringify(OLD.contactToRow(c)), 'contactToRow @' + iter);
    n += 2;
  }
}

// שכבת decodeQuotedPrintable ישירות — כולל רצפי-QP (הנתיב שהאטום-הישן זרק עליו HEX2)
const qpCorpus = ['', 'Abc', qp('קיר'), qp('שלום עולם'), '=D7', '=ZZ', 'a=D7=A7b', '=3D', '50%off', qp('מאיר כהן')];
for (const inp of qpCorpus) {
  assert.strictEqual(NEW.decodeQuotedPrintable(inp), OLD.decodeQuotedPrintable(inp), 'decodeQP ' + JSON.stringify(inp));
  n++;
}

fs.rmSync(tdir, { recursive: true, force: true });
console.log(`🥇 זהב-vcard-import: ישן≡חדש על ${n} השוואות (400 קבצי-LCG: parse/importable/junk/row + decodeQP תו-בתו כולל QP-עברית)`);
