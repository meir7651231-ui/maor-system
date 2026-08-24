#!/usr/bin/env node
/** 🥇 רתמת-זהב · תומכים — הישן (maor/src/components/supporters/lib.ts, מתורגם-חי
 *  עם ה-typescript של מאור) ≡ החדש (Genesis new/boxes/supporters.mjs) על קורפוס-
 *  LCG דטרמיניסטי (seed=20260824). אפס-סטייה. שני-הצדדים חולקים בדיוק את אותם
 *  אטומים-חיצוניים (shim ⇒ new/atoms) כך שכל פער = בלוגיקת-התומכים עצמה.
 *  Date.now מקובע (בלי שעון-אמת — תאריכים קבועים). */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert';

const require = createRequire('/home/user/maor-system/');
const ts = require('typescript');
const ATOMS = '/home/user/-ai-chat-server/new/atoms';
const FIXED_ISO = '2026-08-24';
const FIXED_MS = new Date(FIXED_ISO + 'T12:00:00').getTime();
Date.now = () => FIXED_MS; // קיבוע-שעון: supScore/supScoreBins דטרמיניסטיים משני-הצדדים

const tdir = fs.mkdtempSync(path.join(os.tmpdir(), 'sup-'));

// ── shim: אטומים-חיצוניים משותפים לשני-הצדדים (זהים ⇒ פער = לוגיקת-התומכים) ──
const shim = `
import { termOf } from '${ATOMS}/term-of.mjs';
import { normSearch } from '${ATOMS}/norm-search.mjs';
import { formatIsraeliPhone } from '${ATOMS}/format-israeli-phone.mjs';
import { parseAnyDate } from '${ATOMS}/parse-any-date.mjs';
import { parseCsv } from '${ATOMS}/parse-csv.mjs';
import { planAddName as _plan } from '${ATOMS}/plan-add-name.mjs';
export { termOf, normSearch, formatIsraeliPhone, parseAnyDate, parseCsv };
export const isoTodayLocal = () => '${FIXED_ISO}';
export const planAddName = (a, rawName, eyes, id) =>
  _plan(a, rawName, eyes, id, (s) => normSearch(s).replace(/\\s/g, ''), () => '${FIXED_ISO}');
export function emptyAyin() {
  return { stage: 'new', note: '', answeredNote: '', answerPushed: false,
    nextTalk: '', nextTalkTime: '', lastTouch: '',
    names: [], answers: [], log: [], time: [], mat: [] };
}
`;
fs.writeFileSync(path.join(tdir, 'shim.mjs'), shim);

// ── מתרגמים-חי את המקור, ומחליפים את בלוק-הייבוא ל-shim ──
let libSrc = fs.readFileSync('/home/user/maor-system/src/components/supporters/lib.ts', 'utf8');
libSrc = libSrc.replace(/^import[^\n]*\n/gm, '');
libSrc =
  `import { emptyAyin, termOf, normSearch, formatIsraeliPhone, isoTodayLocal, planAddName, parseAnyDate, parseCsv } from './shim.mjs';\n` +
  libSrc;
fs.writeFileSync(
  path.join(tdir, 'old.mjs'),
  ts.transpileModule(libSrc, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText,
);

const OLD = await import(pathToFileURL(path.join(tdir, 'old.mjs')).href);
const NEW = await import('/home/user/-ai-chat-server/new/boxes/supporters.mjs');

// ── קורפוס-LCG דטרמיניסטי ──
let s = 20260824;
const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const pick = (a) => a[Math.floor(rnd() * a.length)];
const p2 = (n) => String(n).padStart(2, '0');
const isoOf = (y, m, d) => `${y}-${p2(m)}-${p2(d)}`;
const randIso = () => isoOf(2022 + Math.floor(rnd() * 5), 1 + Math.floor(rnd() * 12), 1 + Math.floor(rnd() * 28));
const names = ['כהן משה', 'לוי רחל', 'בן דוד', 'רחל בן צבי', 'אברהם', '', 'מזרחי דנה', 'פרץ יוסי'];
const phones = ['0501234567', '972521111111', '03-1234567', '', '+972-50-9998887', '12345'];
const purposes = ['', 'עבודה', 'מלגה', 'כללי'];
const clearers = [undefined, 'נדרים', 'סולה', 'אשראית'];

function mkHist() {
  const n = Math.floor(rnd() * 4);
  return Array.from({ length: n }, () => {
    const h = { d: randIso(), a: Math.floor(rnd() * 5000), c: rnd() < 0.2 ? '$' : '₪' };
    const cl = pick(clearers);
    if (cl) h.clearer = cl;
    if (rnd() < 0.3) h.receipt = 'K' + Math.floor(rnd() * 999);
    if (rnd() < 0.3) h.pays = 1 + Math.floor(rnd() * 6);
    return h;
  });
}
function mkDon() {
  const n = Math.floor(rnd() * 4);
  return Array.from({ length: n }, (_, i) => ({
    date: randIso(), amount: Math.floor(rnd() * 3000), cur: rnd() < 0.2 ? '$' : '₪',
    rid: 'R-' + Math.floor(rnd() * 9999), purpose: pick(purposes),
  }));
}
function mkHok() {
  if (rnd() < 0.5) return undefined;
  return { active: rnd() < 0.8, amount: 50 + Math.floor(rnd() * 500), cur: rnd() < 0.2 ? '$' : '₪',
    day: 1 + Math.floor(rnd() * 28), method: pick(['bank', 'card', 'cash', '']),
    ...(rnd() < 0.4 ? { kevaId: 'kv' + Math.floor(rnd() * 99) } : {}) };
}
function mkAyin() {
  if (rnd() < 0.6) return undefined;
  return { stage: 'new', note: '', answeredNote: '', answerPushed: false, nextTalk: rnd() < 0.3 ? randIso() : '',
    nextTalkTime: '', lastTouch: '', names: [], answers: rnd() < 0.3 ? [{ date: randIso(), note: 'הערה' }] : [],
    log: rnd() < 0.3 ? [{ date: randIso(), eyes: 1, name: 'x' }] : [], time: [], mat: [] };
}
function mkSup(i) {
  const last = rnd() < 0.85 ? randIso() : '';
  return {
    id: 's' + i, name: pick(names), phone: pick(phones), email: rnd() < 0.5 ? 'a@b.co' : '',
    idNum: '', address: '', cat: '', forWho: pick(purposes),
    count: Math.floor(rnd() * 12), ils: Math.floor(rnd() * 8000), usd: Math.floor(rnd() * 400),
    first: rnd() < 0.7 ? randIso() : '', last, nextDate: rnd() < 0.3 ? randIso() : '',
    donations: mkDon(), hist: mkHist(), hok: mkHok(), ayin: mkAyin(),
  };
}

const supporters = Array.from({ length: 240 }, (_, i) => mkSup(i));
const configs = [undefined, { terms: {} }, { terms: { 'entity.donation': 'מתנה', 'entity.donations': 'מתנות' } }];
const allowedSets = [null, [], ['עבודה'], ['עבודה', 'מלגה'], ['כללי']];

let n = 0;
const eq = (label, a, b) => { assert.deepStrictEqual(a, b, label); n++; };

// ── פר-תומך ──
for (const sp of supporters) {
  eq('supIls', NEW.supIls(sp), OLD.supIls(sp));
  eq('supUsd', NEW.supUsd(sp), OLD.supUsd(sp));
  eq('supCount', NEW.supCount(sp), OLD.supCount(sp));
  eq('supLast', NEW.supLast(sp), OLD.supLast(sp));
  eq('supTotalIls', NEW.supTotalIls(sp), OLD.supTotalIls(sp));
  eq('supScore', NEW.supScore(sp), OLD.supScore(sp));
  eq('supTier', NEW.supTier(NEW.supScore(sp)), OLD.supTier(OLD.supScore(sp)));
  eq('totalLabel', NEW.totalLabel(sp), OLD.totalLabel(sp));
  eq('fmtDate', NEW.fmtDate(sp.last), OLD.fmtDate(sp.last));
  eq('normName', NEW.normName(sp.name), OLD.normName(sp.name));
  eq('fixPhone', NEW.fixPhone(sp.phone), OLD.fixPhone(sp.phone));
  eq('supporterPurposes', NEW.supporterPurposes(sp), OLD.supporterPurposes(sp));
  eq('supLastInPeriod', NEW.supLastInPeriod(sp, 2025, 8), OLD.supLastInPeriod(sp, 2025, 8));
  eq('personalCalEntries', NEW.personalCalEntries(sp), OLD.personalCalEntries(sp));
  eq('hokEffectivelyActive', NEW.hokEffectivelyActive(sp, FIXED_ISO), OLD.hokEffectivelyActive(sp, FIXED_ISO));
  eq('hokRecordedThisMonth', NEW.hokRecordedThisMonth(sp, FIXED_ISO), OLD.hokRecordedThisMonth(sp, FIXED_ISO));
  for (const cfg of configs) eq('supDonEvents', NEW.supDonEvents(sp, cfg), OLD.supDonEvents(sp, cfg));
  for (const al of allowedSets) eq('supVisible', NEW.supporterVisibleForDesignations(sp, al), OLD.supporterVisibleForDesignations(sp, al));
}

// ── רשימתי ──
eq('allDonationPurposes', NEW.allDonationPurposes(supporters), OLD.allDonationPurposes(supporters));
eq('supScoreBins', NEW.supScoreBins(supporters), OLD.supScoreBins(supporters));
eq('supAvgDon', NEW.supAvgDon(supporters), OLD.supAvgDon(supporters));
eq('sup12m', NEW.sup12m(supporters, FIXED_ISO), OLD.sup12m(supporters, FIXED_ISO));
eq('orgCalEntries', NEW.orgCalEntries(supporters), OLD.orgCalEntries(supporters));
eq('hokDue', NEW.hokDue(supporters, FIXED_ISO), OLD.hokDue(supporters, FIXED_ISO));
eq('hokMonthlyTotal', NEW.hokMonthlyTotal(supporters, 3.7, FIXED_ISO), OLD.hokMonthlyTotal(supporters, 3.7, FIXED_ISO));
eq('hokMonthlyTotal-noToday', NEW.hokMonthlyTotal(supporters, 3.7), OLD.hokMonthlyTotal(supporters, 3.7));
for (const al of allowedSets) eq('visibleList', NEW.visibleSupportersForDesignations(supporters, al), OLD.visibleSupportersForDesignations(supporters, al));

// ── שורת-סיכום-החודש (predicate inMonth זהה משני-הצדדים) ──
const inMonth = (iso) => iso.slice(0, 7) === '2025-08';
for (const cfg of configs) {
  const entries = NEW.orgCalEntries(supporters);
  eq('donCalMonthLine', NEW.donCalMonthLine(entries, inMonth, cfg), OLD.donCalMonthLine(entries, inMonth, cfg));
}

// ── ייבוא: CSV/רשת/מיזוג ──
const csvSamples = [
  'שם,טלפון,אימייל\nכהן משה,0501234567,a@b.co\nלוי רחל,972521111111,',
  'כותרת דוח\nטווח\nשם,סכום,תאריך,מטבע,חברה סולקת\nבן דוד,1200,09/08/26 00:36,₪,נדרים\nבן דוד,50,45900,דולר,',
  'name,phone\nx,y', '', 'שם\nאברהם\n\nיוסי',
];
for (const txt of csvSamples) {
  eq('parseSupporterCsv', NEW.parseSupporterCsv(txt), OLD.parseSupporterCsv(txt));
  const grid = txt.split('\n').map((r) => r.split(','));
  eq('parseSupporterGrid', NEW.parseSupporterGrid(grid), OLD.parseSupporterGrid(grid));
}
for (let i = 0; i < 40; i++) {
  const serial = Math.floor(rnd() * 60000) - 100;
  eq('excelSerialToIso', NEW.excelSerialToIso(serial), OLD.excelSerialToIso(serial));
  const ex = mkHist();
  const inc = mkHist();
  eq('mergeHist', NEW.mergeHist(ex, inc), OLD.mergeHist(ex, inc));
}
// planSupporterImport / mergeSupporterRow / newSupporterFromRow
const rowsForImport = supporters.slice(0, 30).map((sp) => ({
  name: sp.name, phone: sp.phone, email: sp.email, idNum: '', address: '', cat: '', forWho: sp.forWho,
  ...(sp.hist?.length ? { hist: sp.hist } : {}),
}));
eq('planSupporterImport', NEW.planSupporterImport(rowsForImport, supporters.slice(10, 40)), OLD.planSupporterImport(rowsForImport, supporters.slice(10, 40)));
for (let i = 0; i < 30; i++) {
  const sp = supporters[i];
  const row = rowsForImport[i];
  eq('mergeSupporterRow', NEW.mergeSupporterRow(sp, row), OLD.mergeSupporterRow(sp, row));
  eq('newSupporterFromRow', NEW.newSupporterFromRow('nid' + i, row), OLD.newSupporterFromRow('nid' + i, row));
}
// applyAyinNames — mkId דטרמיניסטי, clockIso קבוע (eyes='' ⇒ לא נקרא)
for (let i = 0; i < 30; i++) {
  const sp = supporters[i];
  const nm = [pick(names), pick(names)].filter(Boolean);
  let a = 0, b = 0;
  const newRes = NEW.applyAyinNames(sp, nm, () => 'x' + ++a, () => FIXED_ISO);
  const oldRes = OLD.applyAyinNames(sp, nm, () => 'x' + ++b);
  eq('applyAyinNames', newRes, oldRes);
}
// קבועים
eq('TIER_ORDER', [...NEW.TIER_ORDER], [...OLD.TIER_ORDER]);
eq('SUP_NAME_KEYS', [...NEW.SUP_NAME_KEYS], [...OLD.SUP_NAME_KEYS]);
eq('HOK_CAT', NEW.HOK_CAT, OLD.HOK_CAT);
for (const m of ['bank', 'card', 'cash', '', 'xyz']) eq('hokMethodLabel', NEW.hokMethodLabel(m), OLD.hokMethodLabel(m));
for (const [bg, c] of [['#fff', '#000'], ['#fdf3dd', '#9a6414']]) eq('chipStyle', NEW.chipStyle(bg, c), OLD.chipStyle(bg, c));

fs.rmSync(tdir, { recursive: true, force: true });
console.log(`🥇 זהב-תומכים: ישן≡חדש על ${n} השוואות (240 תומכים × RFM/הו"ק/לוח/ראוּת + ייבוא-CSV/מיזוג/תיק-מעקב — אפס-סטייה)`);
