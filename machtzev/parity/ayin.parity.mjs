#!/usr/bin/env node
/** 🥇 רתמת-זהב · ayin — הישן (maor/src/lib/ayin.ts, מתורגם-חי עם השכנים termOf/normSearch/
 *  emptyAyin/isoToday מוזרקים מהמקור החי) ≡ החדש (Genesis new/boxes/ayin.mjs) על קורפוס-LCG
 *  דטרמיניסטי seed=20260824. תאריכים קבועים (בלי Date.now). אפס-סטייה על כל 30 החוטים. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert';

const require = createRequire('/home/user/maor-system/');
const ts = require('typescript');
const tdir = fs.mkdtempSync(path.join(os.tmpdir(), 'ayin-'));
const M = '/home/user/maor-system/src';
const rd = (p) => fs.readFileSync(p, 'utf8').split('\n');

// ── בניית מודול-הישן: ayin.ts בלי בלוק-הייבוא + השכנים החיים מוזרקים כפרמבל ──
const FIXED_TODAY = '2026-08-24';
const termOfSrc   = rd(`${M}/lib/config.ts`).slice(118, 126).join('\n');     // termOf כלשונו (119-126)
const normSrc     = rd(`${M}/lib/validate.ts`).slice(50, 58).join('\n');     // normSearch כלשונו (51-58)
const emptySrc    = rd(`${M}/types/domain.ts`).slice(598, 614).join('\n');   // emptyAyin כלשונו (599-614)
const ayinLines   = rd(`${M}/lib/ayin.ts`);
const ayinBody    = ayinLines.slice(0, 9).concat(ayinLines.slice(15)).join('\n'); // מסירים שורות 10-15 (הייבוא)
const oldTs = [
  termOfSrc,
  normSrc,
  emptySrc,
  `const isoToday = () => '${FIXED_TODAY}';`,
  ayinBody,
].join('\n\n');
fs.writeFileSync(path.join(tdir, 'ayin-old.mjs'),
  ts.transpileModule(oldTs, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText);

const OLD = await import(pathToFileURL(path.join(tdir, 'ayin-old.mjs')).href);
const NEW = await import('/home/user/-ai-chat-server/new/boxes/ayin.mjs');
// השכנים שהקופסה מזריקה — הזרקה זהה לשני הצדדים (המקור החי לתוך OLD, המפעל לתוך NEW):
const emptyAyin = OLD.emptyAyin;          // מפעל-domain החי (העתק שקוף)
const isoToday = () => FIXED_TODAY;
const nextId = (i) => `nid-${i}`;

// ── קורפוס-LCG דטרמיניסטי ──
let s = 20260824;
const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const pick = (a) => a[Math.floor(rnd() * a.length)];
const STAGES = ['new', 'lead', 'eyes', 'answer', 'done'];
const HEB = ['כהן', 'לוי', 'בן דוד', 'משפחת שטרן', 'אברהם', 'ישראל ישראלי', 'רבקה', '  רווח  ', ''];
const EYES = [0, 1, 5, '', '3', 12, null, '  '];
const TERMS = [
  {}, { 'ayin.stage.lead': 'טיוטה' }, { 'nav.ayin': 'פרויקטים', 'entity.ayinItem': 'משימה', 'entity.ayinUnit': 'שעות' },
  { 'ayin.stage.done': '   ' }, { 'entity.ayinUnit': 'עיניים' },
];
const NOTES = ['', 'תשובה חשובה', 'עם,פסיק', 'כן', 'שורה'];

function randName(i) {
  return {
    id: `n${i}-${Math.floor(rnd() * 1e6)}`,
    name: pick(HEB),
    eyes: pick(EYES),
    done: rnd() < 0.4,
    ...(rnd() < 0.5 ? { rate: pick([0, 5, 12.5, 100]) } : {}),
    ...(rnd() < 0.4 ? { note: pick(NOTES) } : {}),
  };
}
function randAyin(allowPartial = false) {
  const names = Array.from({ length: Math.floor(rnd() * 4) }, (_, i) => randName(i));
  const answers = Array.from({ length: Math.floor(rnd() * 3) }, () => ({ date: FIXED_TODAY, note: pick(NOTES) }));
  const log = Array.from({ length: Math.floor(rnd() * 3) }, () => ({ date: pick([FIXED_TODAY, '2026-08-19']), eyes: Math.floor(rnd() * 9), name: pick(HEB) }));
  const full = {
    stage: pick(STAGES), names, answers, log, answerPushed: rnd() < 0.5, paid: rnd() < 0.5,
    note: pick(NOTES), answeredNote: pick(NOTES),
    nextTalk: rnd() < 0.5 ? FIXED_TODAY : '', nextTalkTime: '',
    lastTouch: rnd() < 0.5 ? FIXED_TODAY : (rnd() < 0.5 ? '2026-08-20' : ''),
    time: Array.from({ length: Math.floor(rnd() * 3) }, () => ({ hours: pick([0, 1, 2.5, '3']), rate: pick([0, 50, 120]) })),
    mat: Array.from({ length: Math.floor(rnd() * 3) }, () => ({ qty: pick([0, 1, '2']), cost: pick([0, 10, 33.3]) })),
  };
  // "לגאסי/ענן חלקי" (רק באוכלוסיית-הדוחות): שומר את המערכים (המקור ניגש ל-a.answers/a.names
  // ישירות ב-ayinSheetRows/applyAyinSheet) אך משמיט את הסקלרים+time/mat — מפעיל את מיזוג-
  // emptyAyin שבשלושת-הדוחות (ayin.ts:261/301/339, הגנת-הקריסה של נחיל-13.8) בלי לקרוס.
  if (allowPartial && rnd() < 0.4) {
    return { stage: full.stage, names, answers, log, answerPushed: full.answerPushed, paid: full.paid };
  }
  return full;
}
function randSup(i) {
  const hasAyin = rnd() < 0.85; // 15% בלי ayin כלל (null-safe)
  return { id: `s${i}`, name: pick(HEB) || `תומך${i}`, phone: rnd() < 0.5 ? '0501234567' : '', ...(hasAyin ? { ayin: randAyin(true) } : {}) };
}

let n = 0;
const cmp = (label, av, bv) => { assert.deepStrictEqual(av, bv, label); n++; };

for (let it = 0; it < 400; it++) {
  const cfg = { terms: pick(TERMS) };
  const a = randAyin();
  const stage = pick(STAGES);
  const name = pick(HEB) || 'x';

  // תוויות (termOf מוזרק בשני הצדדים)
  cmp('stageLabel', OLD.stageLabel(cfg, stage), NEW.stageLabel(cfg, stage));
  cmp('featLabel', OLD.featLabel(cfg), NEW.featLabel(cfg));
  cmp('itemLabel', OLD.itemLabel(cfg), NEW.itemLabel(cfg));
  cmp('unitLabel', OLD.unitLabel(cfg), NEW.unitLabel(cfg));
  // סדר-שלבים
  cmp('stageIndex', OLD.stageIndex(stage), NEW.stageIndex(stage));
  cmp('nextStage', OLD.nextStage(stage), NEW.nextStage(stage));
  cmp('revertPatch', OLD.revertPatch(stage), NEW.revertPatch(stage));
  // נרמול-שם (normSearch מוזרק)
  cmp('normName', OLD.normName(name), NEW.normName(name));
  // אגרגטים
  cmp('ayinActive', OLD.ayinActive(a), NEW.ayinActive(a));
  cmp('eyesTotal', OLD.eyesTotal(a), NEW.eyesTotal(a));
  cmp('boqTotal', OLD.boqTotal(a), NEW.boqTotal(a));
  cmp('timeHoursTotal', OLD.timeHoursTotal(a), NEW.timeHoursTotal(a));
  cmp('timeCostTotal', OLD.timeCostTotal(a), NEW.timeCostTotal(a));
  cmp('matCostTotal', OLD.matCostTotal(a), NEW.matCostTotal(a));
  for (const nm of a.names) cmp('boqLineAmount', OLD.boqLineAmount(nm), NEW.boqLineAmount(nm));
  // תבניות (nextId מוזרק)
  const tl = OLD.namesToTemplateLines(a.names);
  cmp('namesToTemplateLines', tl, NEW.namesToTemplateLines(a.names));
  cmp('templateLinesToNames', OLD.templateLinesToNames(tl, nextId), NEW.templateLinesToNames(tl, nextId));
  // כפתור-חכם
  cmp('ayinActionVisible', OLD.ayinActionVisible(a), NEW.ayinActionVisible(a));
  cmp('ayinAdvanceLabel', OLD.ayinAdvanceLabel(cfg, a), NEW.ayinAdvanceLabel(cfg, a));
  cmp('planAyinAdvance', OLD.planAyinAdvance(cfg, name, a), NEW.planAyinAdvance(cfg, name, a));
  // הוספת-שם (isoToday מוזרק בשני הצדדים; OLD אופה את הקבוע, NEW מקבל שקע)
  const eyesArg = pick(EYES);
  cmp('planAddName', OLD.planAddName(a, name, eyesArg, 'id-x'), NEW.planAddName(a, name, eyesArg, 'id-x', isoToday));
}

// ── דוחות + גיליון על אוכלוסיית-תומכים (emptyAyin מוזרק) ──
for (let it = 0; it < 120; it++) {
  const cfg = { terms: pick(TERMS) };
  const sups = Array.from({ length: Math.floor(rnd() * 6) }, (_, i) => randSup(i));
  const today = pick([FIXED_TODAY, '2026-08-19']);
  cmp('ayinDailyRows', OLD.ayinDailyRows(cfg, sups, today), NEW.ayinDailyRows(cfg, sups, today, emptyAyin));
  cmp('ayinAllRows', OLD.ayinAllRows(cfg, sups), NEW.ayinAllRows(cfg, sups, emptyAyin));
  cmp('ayinBoardItems', OLD.ayinBoardItems(sups), NEW.ayinBoardItems(sups, emptyAyin));
  const board = NEW.ayinBoardItems(sups, emptyAyin);
  const q = pick([...HEB, '', 'פלוני']);
  const st = pick([null, 'wait', 'done']);
  const sg = pick([null, ...STAGES]);
  cmp('filterAyinBoard', OLD.filterAyinBoard(board, q, st, sg), NEW.filterAyinBoard(board, q, st, sg));
  // גיליון round-trip
  const rows = OLD.ayinSheetRows(sups);
  cmp('ayinSheetRows', rows, NEW.ayinSheetRows(sups));
  // מלכלכים את הגיליון קצת ומפענחים
  for (let r = 1; r < rows.length; r++) if (rnd() < 0.5) rows[r][4] = pick(['כן', 'לא', '']);
  const pOld = OLD.parseAyinSheet(rows, sups);
  cmp('parseAyinSheet', pOld, NEW.parseAyinSheet(rows, sups));
  cmp('applyAyinSheet', OLD.applyAyinSheet(sups, pOld.upds, today), NEW.applyAyinSheet(sups, pOld.upds, today));
}

fs.rmSync(tdir, { recursive: true, force: true });
console.log(`🥇 זהב-ayin: ישן≡חדש על ${n} השוואות (400 סבבי-תיק + 120 סבבי-אוכלוסייה · 30 חוטים · דוחות+גיליון round-trip · תאריכים-קבועים)`);
