#!/usr/bin/env node
/** 🥇 רתמת-זהב · receipt — הישן (maor/src/lib/receipt.ts, מתורגם-חי) ≡ החדש
 *  (Genesis new/boxes/receipt.mjs) על קורפוס-LCG דטרמיניסטי (seed=20260824):
 *  קבלות §46/רגילות/אישורי-חנות-S-/תאריכים-שבורים × מטבע/סיכום/verify/copy/mark,
 *  ו-receiptFmtOf על קונפיגים אקראיים. אפס-סטייה תו-בתו. בלי Date.now — תאריכים קבועים.
 *
 *  שכני-המודול מוחזקים-קבועים בשני הצדדים כדי לבודד את מבנה-receipt.ts מול חיווט-הקופסה:
 *  · amountInWords — מתורגם-חי מ-hebrewNumber.ts (מקור-אמת) ומוזרק לשני הצדדים (הקופסה
 *    מגדירה אותו כשקע-שכן; ראה כותרת receipt.mjs — אטום amount-in-words שבור/חסר-agorot).
 *  · hebDateFull/featureOn — הישן מקבל חיווט-מאטומים זהה לקופסה (heb-date-full/feature-on
 *    הם חילוץ-כלשונו של hebrew.ts/config.ts), כך שהדלתא היחידה הנבחנת = מבנה-receipt.ts. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert';

const require = createRequire('/home/user/maor-system/');
const ts = require('typescript');
const ATOMS = '/home/user/-ai-chat-server/new/atoms';
const tdir = fs.mkdtempSync(path.join(os.tmpdir(), 'rx-'));
const transpile = (src, name) => {
  const out = ts.transpileModule(src, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
  const p = path.join(tdir, name);
  fs.writeFileSync(p, out);
  return pathToFileURL(p).href;
};

// amountInWords אמיתי — מתורגם-חי מ-hebrewNumber.ts (import-free, טהור)
const hnUrl = transpile(fs.readFileSync('/home/user/maor-system/src/lib/hebrewNumber.ts', 'utf8'), 'hn.mjs');
const { amountInWords } = await import(hnUrl);

// receipt.ts הישן — פשיטת 5 שורות-הייבוא (5-9) והזרקת השכנים מאטומים + amountInWords האמיתי
const receiptLines = fs.readFileSync('/home/user/maor-system/src/lib/receipt.ts', 'utf8').split('\n');
receiptLines.splice(4, 5); // מסיר את שורות 5..9 (הייבואים)
const inject = `
import { gem } from '${ATOMS}/gematria.mjs';
import { gemYear as gemYearA } from '${ATOMS}/gem-year.mjs';
import { hebParts } from '${ATOMS}/heb-parts.mjs';
import { hebDateFull as hebDateFullA } from '${ATOMS}/heb-date-full.mjs';
import { featureOn as featureOnA } from '${ATOMS}/feature-on.mjs';
import { moduleOn } from '${ATOMS}/module-on.mjs';
import { amountInWords } from '${hnUrl}';
const NAV_MODULE_KEYS = ['families','courses','calendar','diary','supporters','reports','tzedaka','shop','shop7'];
const hebDateFull = (iso) => hebDateFullA(iso, gem, (y) => gemYearA(y, gem), hebParts);
const featureOn = (cfg, key) => featureOnA(cfg, key, NAV_MODULE_KEYS, moduleOn);
const guardExport = () => true;
`;
const OLD = await import(transpile(inject + '\n' + receiptLines.join('\n'), 'old-receipt.mjs'));
const NEW = await import('/home/user/-ai-chat-server/new/boxes/receipt.mjs');

// ── קורפוס-LCG דטרמיניסטי ──
let s = 20260824;
const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const pick = (a) => a[Math.floor(rnd() * a.length)];
const maybe = (v) => (rnd() < 0.5 ? v : undefined);
const rids = ['D-0007', 'R-0042', 'S-0003', 'D-100', 'R-1', 'X-9', 'S-77', 'D-0'];
const amounts = [0, 1, 2, 5, 18, 400, 1234, 999.99, 5.995, 1000000, 123456789, 25.5, 0.5];
const currencies = ['₪', '$', '', undefined];
const dates = ['2026-08-05', '2026-09-01', '2025-03-14', '2026-08-05T09:00:00', 'שטויות', '', '2026-13-40'];
const names = ['דוד לוי', 'רות', 'משפחת <כהן>', 'a&b', '', 'ישראל ישראלי', 'O\'Brien'];
const purposes = ['תרומה כללית', 'כרטיסייה', 'מימוש קופון', 'עבור & <עוד>', ''];
const orgs = ['מאור', '', 'עמותת אור', undefined];
const methods = ['מזומן', 'אשראי', '', undefined];

const buildO = () => {
  const o = {
    rid: pick(rids), amount: pick(amounts), date: pick(dates), payer: pick(names),
    forWhat: pick(purposes), currency: pick(currencies), orgName: pick(orgs),
    taxReceipt: rnd() < 0.4, copy: maybe(true), mark: maybe(false), verify: maybe(true),
    orgTaxId: maybe('580123456'), payerId: maybe('012345678'), method: pick(methods),
    signatory: maybe('הרב כהן'), site: maybe('maor.org'),
  };
  if (rnd() < 0.4) {
    o.summary = { totalDue: pick(amounts), paidSoFar: pick(amounts), balance: pick(amounts), nextDate: maybe(pick(dates)) };
  }
  return o;
};

let n = 0;
for (let i = 0; i < 500; i++) {
  const o = buildO();
  // 1) receiptVerifyCode — תו-בתו
  const cur = o.currency || '₪';
  assert.strictEqual(NEW.receiptVerifyCode(o.rid, o.amount, cur, o.date), OLD.receiptVerifyCode(o.rid, o.amount, cur, o.date), 'verifyCode');
  n++;
  // 2) receiptLines — מערך תו-בתו (amountInWords מוזרק בחדש; קבוע-בישן)
  assert.deepStrictEqual(NEW.receiptLines(o, amountInWords), OLD.receiptLines(o), 'receiptLines:\n' + JSON.stringify(o));
  n++;
  // 3) receiptHtml — מחרוזת תו-בתו
  assert.strictEqual(NEW.receiptHtml(o, amountInWords), OLD.receiptHtml(o), 'receiptHtml:\n' + JSON.stringify(o));
  n++;
  // 4) receiptFmtOf — קונפיג+ui אקראיים
  const cfg = { features: { 'core.receipt.pdf': pick([true, false, undefined]) }, modules: { core: pick([true, false, undefined]) } };
  const ui = { receiptFmt: pick(['txt', 'pdf', undefined]) };
  assert.strictEqual(NEW.receiptFmtOf(cfg, ui), OLD.receiptFmtOf(cfg, ui), 'receiptFmtOf');
  n++;
}
fs.rmSync(tdir, { recursive: true, force: true });
console.log(`🥇 זהב-receipt: ישן≡חדש על ${n} השוואות (500 קבלות: verifyCode + receiptLines + receiptHtml + receiptFmtOf, תו-בתו כולל §46/S-/שבור/סיכום)`);
