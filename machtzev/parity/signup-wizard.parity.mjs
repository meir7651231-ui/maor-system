#!/usr/bin/env node
/** 🥇 רתמת-זהב · אשף-ההרשמה — הישן (maor/src/lib/signupWizard.ts, מתורגם-חי עם
 *  שכניו config.signUpError + verticalPacks) ≡ החדש (Genesis new/boxes/signup-wizard.mjs)
 *  על קורפוס-LCG דטרמיניסטי (seed=20260824): מצבי-אשף × שלבים −1..6 + קבועים
 *  ביט-זהים + תוויות. אפס-סטייה. בלי Date.now — הקלט כולו סטטי. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert';

const require = createRequire('/home/user/maor-system/');
const ts = require('typescript');
const opts = { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } };
const tdir = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-'));

// verticalPacks.ts — עצמאי (רק import type) ⇒ מתורגם במלואו
const vpSrc = fs.readFileSync('/home/user/maor-system/src/lib/verticalPacks.ts', 'utf8');
fs.writeFileSync(path.join(tdir, 'verticalPacks.mjs'), ts.transpileModule(vpSrc, opts).outputText);

// config.ts — מחלצים את signUpError בלבד (config.ts:739-756; שאר הקובץ = גבול-SDK/ענן)
const cfgLines = fs.readFileSync('/home/user/maor-system/src/lib/config.ts', 'utf8').split('\n');
const start = cfgLines.findIndex((l) => l.startsWith('export function signUpError'));
assert.ok(start > 0, 'grep signUpError ב-config.ts החזיר ריק');
const end = cfgLines.indexOf('}', start);
const cfgSrc = cfgLines.slice(start, end + 1).join('\n');
fs.writeFileSync(path.join(tdir, 'config.mjs'), ts.transpileModule(cfgSrc, opts).outputText);

// signupWizard.ts — במלואו; מפני-Node-ESM: מפנים את ייבואי-השכנים לקבצים המתורגמים
const swSrc = fs.readFileSync('/home/user/maor-system/src/lib/signupWizard.ts', 'utf8');
const swJs = ts.transpileModule(swSrc, opts).outputText
  .replace("'./config'", "'./config.mjs'")
  .replace("'./verticalPacks'", "'./verticalPacks.mjs'");
fs.writeFileSync(path.join(tdir, 'signupWizard.mjs'), swJs);

const OLD = await import(pathToFileURL(path.join(tdir, 'signupWizard.mjs')).href);
const NEW = await import('/home/user/-ai-chat-server/new/boxes/signup-wizard.mjs');

// LCG דטרמיניסטי (seed קבוע — L: בלי Math.random ברתמות)
let s = 20260824;
const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const pick = (a) => a[Math.floor(rnd() * a.length)];

let n = 0;
// 1) הקבועים ביט-זהים
assert.deepStrictEqual(NEW.WIZARD_INDUSTRIES, OLD.WIZARD_INDUSTRIES, 'WIZARD_INDUSTRIES≠מקור'); n++;
assert.deepStrictEqual(NEW.ORG_SIZES, OLD.ORG_SIZES, 'ORG_SIZES≠מקור'); n++;
assert.deepStrictEqual(NEW.ORG_NEEDS, OLD.ORG_NEEDS, 'ORG_NEEDS≠מקור'); n++;
assert.strictEqual(NEW.WIZARD_STEPS, OLD.WIZARD_STEPS, 'WIZARD_STEPS≠מקור'); n++;
assert.deepStrictEqual(NEW.EMPTY_WIZARD, OLD.EMPTY_WIZARD, 'EMPTY_WIZARD≠מקור'); n++;

// 2) קורפוס מצבי-אשף: ריק/רווחים/עברית/פורמטים-שבורים × כל השלבים −1..6
const industries = ['', 'chesed', 'clinic', 'digital', 'none', 'עברית'];
const sizes = ['', 'small', 'medium', 'large', 'XL'];
const needsArr = [[], ['crm'], ['crm', 'backup'], ['zzz']];
const names = ['', '   ', 'אור ראשון', 'a', '\t'];
const phones = ['', '   ', '050-1234567', '+972 50 123 4567', '12', 'abcdefgh', '05a1234567', '0501234567'];
const emails = ['', 'x', 'a@b.co', 'a@b', ' a@b.co ', 'שם@דומיין.קום', 'a b@c.co'];
const passwords = ['', '12345', '123456', 'סיסמה123', 'abcdef'];
const steps = [-1, 0, 1, 2, 3, 4, 5, 6];
for (let i = 0; i < 600; i++) {
  const st = {
    industry: pick(industries), size: pick(sizes), needs: pick(needsArr),
    orgName: pick(names), contactName: pick(names), phone: pick(phones),
    email: pick(emails), password: pick(passwords),
    password2: rnd() > 0.4 ? undefined : pick(passwords),
  };
  if (st.password2 === undefined) st.password2 = st.password; // רוב הזוגות תואמים
  for (const step of steps) {
    const a = OLD.wizardStepError(step, st);
    const b = NEW.wizardStepError(step, st);
    assert.strictEqual(b, a, `סטייה: step=${step} state=${JSON.stringify(st)}`);
    n++;
  }
}

// 3) תוויות — כל ה-ids + לא-מוכר + undefined
for (const id of [...OLD.WIZARD_INDUSTRIES.map((i) => i.id), 'zzz', '', undefined]) {
  assert.strictEqual(NEW.industryLabel(id), OLD.industryLabel(id), `industryLabel(${id})`); n++;
}
for (const id of [...OLD.ORG_SIZES.map((x) => x.id), 'XL', '', undefined]) {
  assert.strictEqual(NEW.sizeLabel(id), OLD.sizeLabel(id), `sizeLabel(${id})`); n++;
}
for (const id of [...OLD.ORG_NEEDS.map((x) => x.id), 'zzz', '']) {
  assert.strictEqual(NEW.needLabel(id), OLD.needLabel(id), `needLabel(${id})`); n++;
}

fs.rmSync(tdir, { recursive: true, force: true });
console.log(`🥇 זהב-אשף-ההרשמה: ישן≡חדש על ${n} השוואות (600 מצבים × 8 שלבים + קבועים ביט-זהים + 34 תוויות)`);
