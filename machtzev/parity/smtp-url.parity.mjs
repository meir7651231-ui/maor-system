#!/usr/bin/env node
/** 🥇 רתמת-זהב · חשבון-המייל — הישן (maor lib/smtpUrl.ts מתורגם-חי + חיווט-הטופס
 *  OrgSecretsSection.tsx:45,61-71 המשוחזר-מעוגן) ≡ החדש (Genesis new/boxes/smtp-url.mjs)
 *  על קורפוס-LCG: מיילים (מוכר/לא-מוכר/עברית/בלי-@/רווחים/אותיות-גדולות) ×
 *  סיסמאות (תווים-מיוחדים/עברית/ריק) × שרתים-ידניים (465/587/ריק/רווח). אפס-סטייה.
 *  דטרמיניסטי — seed=20260824, בלי Date.now. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert';

const require = createRequire('/home/user/maor-system/');
const ts = require('typescript');
const tdir = fs.mkdtempSync(path.join(os.tmpdir(), 'smtp-'));
// המנוע כולו טהור — מתורגם חי, בשלמותו
const engineSrc = fs.readFileSync('/home/user/maor-system/src/lib/smtpUrl.ts', 'utf8');
fs.writeFileSync(path.join(tdir, 'smtpUrl.mjs'), ts.transpileModule(engineSrc, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText);
const OLD = await import(pathToFileURL(path.join(tdir, 'smtpUrl.mjs')).href);
const NEW = await import('/home/user/-ai-chat-server/new/boxes/smtp-url.mjs');

// חיווט-הטופס חי בתוך רכיב-React — משוחזר כאן שורה-בשורה, ומעוגן במקור:
// סטייה בקובץ-החי (שורות 45/61/62/66/67) מפילה את הרתמה מיד.
const secSrc = fs.readFileSync('/home/user/maor-system/src/components/settings/OrgSecretsSection.tsx', 'utf8');
for (const anchor of [
  'const knownHost = smtpHostFor(mailUser);',                       // שורה 45
  'if (mailUser.trim() || mailPass.trim()) {',                      // שורה 61 — שער-הדילוג
  'composeSmtpUrl(mailUser, mailPass, knownHost || mailHost)',      // שורה 62 — קדימות
  "? 'מייל: מלאו גם כתובת וגם סיסמת-אפליקציה'",                     // שורה 66
  ": 'מייל: הספק לא מוכר — מלאו את שדה שרת-היציאה (host:port)',",   // שורה 67
]) assert.ok(secSrc.includes(anchor), `עוגן-מקור נעלם מ-OrgSecretsSection: ${anchor}`);

/** שחזור מדויק של save() בקטע-המייל (שורות 45+61-71): skip / toast / patch.smtpUrl */
function oldOutcome(mailUser, mailPass, mailHost) {
  const knownHost = OLD.smtpHostFor(mailUser);
  if (mailUser.trim() || mailPass.trim()) {
    const url = OLD.composeSmtpUrl(mailUser, mailPass, knownHost || mailHost);
    if (!url) {
      return {
        toast: knownHost || mailHost
          ? 'מייל: מלאו גם כתובת וגם סיסמת-אפליקציה'
          : 'מייל: הספק לא מוכר — מלאו את שדה שרת-היציאה (host:port)',
      };
    }
    return { smtpUrl: url };
  }
  return { skip: true };
}

let s = 20260824;
const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const pick = (a) => a[Math.floor(rnd() * a.length)];
const emails = ['receipts@gmail.com', 'a@GMAIL.com', 'x@Outlook.Com', 'y@hotmail.com',
  'z@yahoo.com', 'w@walla.co.il', 'x@shem-haamuta.org', ' padded@gmail.com ', 'a@gmail.com ',
  'בלי-שטרודל', '@nofront.com', 'two@@gmail.com', '', ' ', 'a@b@gmail.com', 'קבלות@gmail.com'];
const passwords = ['p', 'p@ss:w/rd', 'עם עברית ורווח', 'a"b\'c&d?', '  ', '', '1234 5678 9012'];
const hosts = ['', ' ', 'mail.org.il:587', 'mail.org.il:465', 'h:25', 'smtp.gmail.com:465', 'בלי-נקודתיים'];

let n = 0;
// 1) טבלת-הספקים ≡ (מפתחות, פעם אחת)
assert.strictEqual(NEW.KNOWN_SMTP_DOMAINS.join('|'), Object.keys(OLD.SMTP_HOSTS).join('|'), 'רשימת-הדומיינים');
n++;
for (let i = 0; i < 500; i++) {
  const email = pick(emails), password = pick(passwords), manualHost = pick(hosts);
  // 2) זיהוי-חי ≡ smtpHostFor הישן
  assert.strictEqual(NEW.detectSmtpHost(email), OLD.smtpHostFor(email), `detect: "${email}"`);
  n++;
  // 3) תוצאת-השמירה ≡ חיווט-הטופס הישן — מצב+נוסח+URL תו-בתו
  const oldR = oldOutcome(email, password, manualHost);
  const newR = NEW.buildSmtpAccount({ email, password, manualHost });
  const tag = `"${email}" / "${password}" / "${manualHost}"`;
  if (oldR.skip) assert.strictEqual(newR.state, 'empty', `skip: ${tag}`);
  else if (oldR.toast) {
    assert.strictEqual(newR.state, 'error', `error-state: ${tag}`);
    assert.strictEqual(newR.message, oldR.toast, `error-msg: ${tag}`);
  } else {
    assert.strictEqual(newR.state, 'ok', `ok-state: ${tag}`);
    assert.strictEqual(newR.url, oldR.smtpUrl, `url: ${tag}`);
  }
  n++;
}
fs.rmSync(tdir, { recursive: true, force: true });
console.log(`🥇 זהב-חשבון-המייל: ישן≡חדש על ${n} השוואות (500 סבבים: זיהוי-ספק + skip/שגיאה/URL תו-בתו + 5 עוגני-מקור)`);
