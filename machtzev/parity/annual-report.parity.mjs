#!/usr/bin/env node
/** 🥇 רתמת-זהב · דוח-שנתי-לתורם — הישן (maor src/lib/annualReport.ts, מתורגם-חי)
 *  ≡ החדש (Genesis new/boxes/annual-report.mjs) על קורפוס-LCG: תרומות עם תאריכים
 *  תקינים/שבורים/ריקים/עבריים × סכומים (סופי/NaN/Infinity/שלילי/0) × מטבע ₪/$ ×
 *  rid/ייעוד × שדות-ארגון. אפס-סטייה. בלי Date.now (תאריכים קבועים).
 *  ההורדה (downloadAnnualReport) = גבול-IO (DOM/setTimeout) — לא ברתמה, כמו names-export. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert';

const require = createRequire('/home/user/maor-system/');
const ts = require('typescript');
const tdir = fs.mkdtempSync(path.join(os.tmpdir(), 'anr-'));

// המקור בלי import ל-exportGate ובלי downloadAnnualReport (גבול-DOM):
// חותכים שורות 11-106 (interfaces + donationYears/donationsOfYear/money/
// annualReportLines/annualAllLines — כולן טהורות, אפס guardExport/DOM).
const srcLines = fs.readFileSync('/home/user/maor-system/src/lib/annualReport.ts', 'utf8').split('\n');
const pureSrc = srcLines.slice(10, 106).join('\n');
fs.writeFileSync(
  path.join(tdir, 'annual.mjs'),
  ts.transpileModule(pureSrc, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText,
);
const OLD = await import(pathToFileURL(path.join(tdir, 'annual.mjs')).href);
const NEW = await import('/home/user/-ai-chat-server/new/boxes/annual-report.mjs');

let s = 20260824;
const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const pick = (a) => a[Math.floor(rnd() * a.length)];

const dates = ['2026-03-01', '2026-01-15', '2025-12-31', '2026-12-31', '2024-06-06', '', 'שבור', '2026', '2026-07', '2027-02-29'];
const amounts = [180, 100, 999, 0, -5, 12345.67, NaN, Infinity, 1000000, 42];
const curs = [undefined, '₪', '$'];
const rids = [undefined, 'D-7', 'R-11', ''];
const desigs = [undefined, 'מלגה', 'ריהוט', ''];
const orgNames = ['מאור', 'עמותת חסד', ''];
const taxIds = [undefined, '580123456', ''];
const names = ['דוד לוי', 'שרה כהן', ''];
const payerIds = [undefined, '012345678', ''];
const years = ['2026', '2025', '2027', '2024'];
const sites = [undefined, 'maor.org', ''];

const mkDon = () => ({ date: pick(dates), amount: pick(amounts), cur: pick(curs), rid: pick(rids), designation: pick(desigs) });

let n = 0;
for (let i = 0; i < 400; i++) {
  const donations = Array.from({ length: Math.floor(rnd() * 6) }, mkDon);
  const year = pick(years);

  // 1) years ≡ donationYears
  assert.deepStrictEqual(NEW.years(donations), OLD.donationYears(donations), 'years');
  n++;
  // 2) ofYear ≡ donationsOfYear
  assert.deepStrictEqual(NEW.ofYear(donations, year), OLD.donationsOfYear(donations, year), 'ofYear');
  n++;
  // 3) reportLines ≡ annualReportLines (money+ofYear מחווטים) — שורה-שורה
  const inp = { orgName: pick(orgNames), orgTaxId: pick(taxIds), supporterName: pick(names), payerId: pick(payerIds), year, donations, site: pick(sites) };
  assert.deepStrictEqual(NEW.reportLines(inp), OLD.annualReportLines(inp), 'reportLines');
  n++;
  // 4) allLines ≡ annualAllLines — מפרידי-עמוד ודילוגים
  const supporters = Array.from({ length: Math.floor(rnd() * 4) }, () => ({
    name: pick(names), idNum: pick(payerIds), donations: Array.from({ length: Math.floor(rnd() * 4) }, mkDon),
  }));
  assert.deepStrictEqual(
    NEW.allLines(inp.orgName, inp.orgTaxId, year, supporters, inp.site),
    OLD.annualAllLines(inp.orgName, inp.orgTaxId, year, supporters, inp.site),
    'allLines',
  );
  n++;
}
fs.rmSync(tdir, { recursive: true, force: true });
console.log(`🥇 זהב-דוח-שנתי: ישן≡חדש על ${n} השוואות (400 סבבים: years+ofYear+reportLines+allLines תו-בתו)`);
