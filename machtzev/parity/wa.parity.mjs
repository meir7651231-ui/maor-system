#!/usr/bin/env node
/** 🥇 רתמת-זהב · וואטסאפ — הישן (maor src/lib/wa.ts + src/lib/templates.ts, מתורגם-חי)
 *  ≡ החדש (Genesis new/boxes/wa.mjs) על קורפוס-LCG: טלפונים בכל הפורמטים (מקומי/
 *  +972/00/שבור/עברית/ריק) × טקסטים (עברית/אימוג׳י/URL/רווחים) × ארגונים ×
 *  דריסות-תבניות × יתרות. אפס-סטייה, בלי Date.now. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert';

const require = createRequire('/home/user/maor-system/');
const ts = require('typescript');
const tdir = fs.mkdtempSync(path.join(os.tmpdir(), 'wa-'));
const opts = { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } };
// templates.ts כולו (import type נמחק בתרגום) ⇒ templates.mjs
const tplSrc = fs.readFileSync('/home/user/maor-system/src/lib/templates.ts', 'utf8');
fs.writeFileSync(path.join(tdir, 'templates.mjs'), ts.transpileModule(tplSrc, opts).outputText);
// wa.ts כולו — רק תיקון-הסיומת של import-הערך './templates' ל-ESM של Node
const waSrc = fs.readFileSync('/home/user/maor-system/src/lib/wa.ts', 'utf8');
fs.writeFileSync(path.join(tdir, 'wa.mjs'),
  ts.transpileModule(waSrc, opts).outputText.replace("'./templates'", "'./templates.mjs'"));
const OLD = await import(pathToFileURL(path.join(tdir, 'wa.mjs')).href);
const NEW = await import('/home/user/-ai-chat-server/new/boxes/wa.mjs');

let s = 20260824;
const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const pick = (a) => a[Math.floor(rnd() * a.length)];

const phones = ['050-123-4567', '+972 50-123-4567', '+972 050-123-4567', '00972501234567',
  '0044 20 7946 0958', '501234567', '05012', '', 'אין טלפון', '123', '026543210',
  'טל: 050.111.2222', '9999999999999999', '00 1 (212) 555-0100', '072-2501234'];
const texts = ['', '   ', 'שלום', '  היי  ', 'hi there', 'קישור: https://x.co/?a=1&b=2',
  'אימוג׳י 🚚🙏', '{org} טריק', 'שורה\nשנייה'];
const orgs = ['', '  ', 'מאור החסד', 'עמותה עם "גרש"', 'Org-EN', 'ל'];
const names = ['כהן', '', 'לוי-מזרחי', 'דנה', 'א', 'בית {org}'];
const cfgs = [undefined, {}, { templates: {} },
  { templates: { 'wa.delivery': 'היי {name} מ{org}', 'wa.payment': '', 'wa.birthday': '   ' } },
  { templates: { 'wa.delivery': '{name}{name}', 'wa.payment': 'חוב {amount} על {what} ({org})', 'wa.birthday': 'מזל״ט {first}' } }];
const balances = [0, 1, 999.4, 1234.6, -250, 1000000, 0.5, -0.5, 123456.78];

let n = 0;
for (let i = 0; i < 400; i++) {
  const phone = pick(phones), text = pick(texts), org = pick(orgs);
  const name = pick(names), cfg = pick(cfgs), bal = pick(balances);
  assert.strictEqual(NEW.waDigits(phone), OLD.waDigits(phone), `waDigits(${phone})`); n++;
  assert.strictEqual(NEW.waLink(phone, text), OLD.waLink(phone, text), `waLink(${phone},${text})`); n++;
  assert.strictEqual(NEW.waDeliveryText(org, name, cfg), OLD.waDeliveryText(org, name, cfg), `delivery(${org},${name})`); n++;
  assert.strictEqual(NEW.waPaymentText(org, name, bal, cfg), OLD.waPaymentText(org, name, bal, cfg), `payment(${org},${bal})`); n++;
  assert.strictEqual(NEW.waBirthdayText(org, name, cfg), OLD.waBirthdayText(org, name, cfg), `birthday(${org},${name})`); n++;
}
// ברירת-מחדל של text ב-waLink (חתימה בת-פרמטר-אחד) — גם היא ≡
for (const p of phones) { assert.strictEqual(NEW.waLink(p), OLD.waLink(p), `waLink(${p}) default`); n++; }
fs.rmSync(tdir, { recursive: true, force: true });
console.log(`🥇 זהב-וואטסאפ: ישן≡חדש על ${n} השוואות (400 סבבי-LCG × 5 פונקציות + ברירת-מחדל-text)`);
