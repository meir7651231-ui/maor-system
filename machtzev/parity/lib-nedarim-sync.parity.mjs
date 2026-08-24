#!/usr/bin/env node
/** 🥇 רתמת-זהב · lib-nedarim-sync — הישן (maor/src/lib/nedarimSync.ts, מתורגם-חי עם
 *  typescript של מאור) ≡ החדש (Genesis new/boxes/lib-nedarim-sync.mjs) על קורפוס-LCG
 *  דטרמיניסטי (seed=20260824): תורמים/עסקאות/תומכים עם מפתחות-שיוך שונים · עברית ·
 *  ביטולים/זיכויים · kevaId/סולה · txn/ref חסרים. אפס-סטייה. בלי Date.now (todayIso קבוע). */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert';

const require = createRequire('/home/user/maor-system/');
const ts = require('typescript');
const tdir = fs.mkdtempSync(path.join(os.tmpdir(), 'ned-'));
const tp = (src) => ts.transpileModule(src, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;

// validate.ts — בלי imports (normSearch + nameSortKey + NAME_TITLES module-private)
fs.writeFileSync(path.join(tdir, 'validate.mjs'), tp(fs.readFileSync('/home/user/maor-system/src/lib/validate.ts', 'utf8')));
// dedup.ts — רק normPhone + normId (שאר-הקובץ מייבא רכיבים; החתכים עצמאיים)
const dd = fs.readFileSync('/home/user/maor-system/src/lib/dedup.ts', 'utf8').split('\n');
fs.writeFileSync(path.join(tdir, 'dedup.mjs'), tp([dd.slice(14, 21).join('\n'), dd.slice(271, 280).join('\n')].join('\n')));
// nedarimSync.ts — מפנים את שני ה-imports למודולים-המקומיים (סיומת .mjs ל-ESM)
const nedSrc = fs.readFileSync('/home/user/maor-system/src/lib/nedarimSync.ts', 'utf8')
  .replace("from './dedup'", "from './dedup.mjs'")
  .replace("from './validate'", "from './validate.mjs'");
fs.writeFileSync(path.join(tdir, 'nedarimSync.mjs'), tp(nedSrc));

const OLD = await import(pathToFileURL(path.join(tdir, 'nedarimSync.mjs')).href);
const NEW = await import('/home/user/-ai-chat-server/new/boxes/lib-nedarim-sync.mjs');

let s = 20260824;
const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const pick = (a) => a[Math.floor(rnd() * a.length)];
const maybe = (v) => (rnd() < 0.5 ? v : undefined);

const NAMES = ['רחל בן צבי', 'בן צבי רחל', 'משה כהן', 'שרה לוי', 'הרב דוד ישראלי', 'מרים', 'תורם נדרים', '', 'לוי יצחק בן שלמה', 'אברהם'];
const CITIES = ['ירושלים', 'בני ברק', '', 'צפת'];
const PHONES = ['0501112233', '972521234567', '0000000000', '123', '', '03-9998877', '0587776655'];
const IDS = ['000000000', '039485762', '12345', '000000020', '', '204050607'];
const EXTS = ['55', '77', '900', '', '12'];
const EMAILS = ['a@b.co', 'X@Y.CO', '', 'donor@org.il'];
const CURS = ['₪', '$', '1', '2', 'USD', 'דולר', ''];
const KEVAS = ['K1', 'K9', '', ''];
const PROVS = ['sola', 'nedarim', '', undefined];
const AMTS = [100, 50, 0, -30, 250, 18, -100, 1];
const DATES = ['2026-01-10', '2026-02-02', '2026-03-05', '2026-06-01', '2025-12-31', ''];

const mkSup = (i) => ({
  id: 's' + i, name: pick(NAMES), phone: pick(PHONES), email: pick(EMAILS),
  address: '', city: pick(CITIES), idNum: maybe(pick(IDS)) || '', extId: maybe(pick(EXTS)) || '',
  cat: '', forWho: '', notes: '', count: 0, ils: 0, usd: 0, first: '', last: '', nextDate: '',
  donations: [], hist: rnd() < 0.3 ? [{ d: pick(DATES) || '2026-01-01', a: pick(AMTS) || 10, c: '₪', clearer: pick(['נדרים', 'סולה']), ...(rnd() < 0.5 ? { txn: 'H' + i } : {}) }] : undefined,
});
const mkDonor = (i) => ({
  toremId: pick(EXTS) || String(1000 + i), zeout: maybe(pick(IDS)), name: pick(NAMES) || 'תורם ' + i,
  address: maybe('רחוב ' + i), phone: maybe(pick(PHONES)), phone2: maybe(pick(PHONES)), phone3: maybe(pick(PHONES)),
  email: maybe(pick(EMAILS)), notes: maybe('הערה'),
});
const mkCharge = (i) => ({
  id: 'c' + i, amount: pick(AMTS), currency: pick(CURS), name: maybe(pick(NAMES)),
  phone: maybe(pick(PHONES)), email: maybe(pick(EMAILS)), zeout: maybe(pick(IDS)), toremId: maybe(pick(EXTS)),
  txnId: maybe('T' + i), reference: maybe('R' + i), d: pick(DATES), at: maybe(pick(DATES) + 'T09:00:00'),
  receipt: maybe('rc' + i), last4: maybe('1234'), category: maybe('חג'), kevaId: maybe(pick(KEVAS)), provider: pick(PROVS),
});

const TODAY = '2026-07-15';
let n = 0;
for (let r = 0; r < 300; r++) {
  const existing = Array.from({ length: Math.floor(rnd() * 6) }, (_, i) => mkSup(i));
  const donors = Array.from({ length: Math.floor(rnd() * 5) }, (_, i) => mkDonor(i));
  const charges = Array.from({ length: Math.floor(rnd() * 7) }, (_, i) => mkCharge(i));
  const attachOnly = rnd() < 0.4;

  // 1) planNedarimSync — התוכנית המלאה (העוגן)
  assert.deepStrictEqual(
    NEW.planNedarimSync(existing, donors, charges, { attachOnly }),
    OLD.planNedarimSync(existing, donors, charges, { attachOnly }),
    'planNedarimSync r=' + r);
  n++;

  // 2) חוטים-פומביים בודדים על אותו קורפוס
  for (const c of charges) {
    assert.deepStrictEqual(NEW.chargeToHist(c), OLD.chargeToHist(c), 'chargeToHist');
    assert.strictEqual(NEW.chargeDedupKey(c), OLD.chargeDedupKey(c), 'chargeDedupKey');
    assert.strictEqual(NEW.providerClearer(c.provider), OLD.providerClearer(c.provider), 'providerClearer');
    assert.deepStrictEqual(NEW.strongMatchForCharge(c, existing), OLD.strongMatchForCharge(c, existing), 'strongMatch');
    assert.deepStrictEqual(NEW.candidateSupportersForCharge(c, existing), OLD.candidateSupportersForCharge(c, existing), 'candidates');
    n++;
  }
  assert.deepStrictEqual(NEW.autoMatchCharges(charges, existing), OLD.autoMatchCharges(charges, existing), 'autoMatch');
  assert.deepStrictEqual(NEW.detectRecurringHok(existing, TODAY), OLD.detectRecurringHok(existing, TODAY), 'detectRecurringHok');
  const txns = charges.map((c) => c.txnId || c.reference || '').filter(Boolean);
  assert.deepStrictEqual(NEW.relabelHistByTxn(existing, txns, 'סולה'), OLD.relabelHistByTxn(existing, txns, 'סולה'), 'relabel');
  assert.deepStrictEqual(NEW.repairCardsFromRows(existing, charges, 'סולה'), OLD.repairCardsFromRows(existing, charges, 'סולה'), 'repair');
  const items = NEW.autoMatchCharges(charges, existing);
  assert.deepStrictEqual(NEW.attachChargesBulk(existing, items), OLD.attachChargesBulk(existing, items), 'bulk');
  if (existing[0]) assert.deepStrictEqual(NEW.attachChargeTo(existing, existing[0].id, charges[0] || { amount: 5, txnId: 'Z' }), OLD.attachChargeTo(existing, existing[0].id, charges[0] || { amount: 5, txnId: 'Z' }), 'attachOne');
  n += 5;
}
fs.rmSync(tdir, { recursive: true, force: true });
console.log(`🥇 זהב-lib-nedarim-sync: ישן≡חדש על ${n} השוואות (300 סבבים: plan מלא + 13 חוטים פומביים, אפס-סטייה)`);
