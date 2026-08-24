#!/usr/bin/env node
/** 🥇 רתמת-זהב · מודול-החנות — הישן (maor/src/components/shop/lib.ts, מתורגם-חי עם
 *  התלויות האמיתיות config/calLib/hebrew/search/date-util) ≡ החדש (Genesis new/boxes/shop.mjs)
 *  על קורפוס-LCG דטרמיניסטי seed=20260824. אפס-סטייה · בלי Date.now (תאריכים קבועים).
 *  שקעי-הקופסה (holidayOf/smartFilter/featureOn) מוזרקים מהמנועים-הישנים עצמם. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert';

const require = createRequire('/home/user/maor-system/');
const ts = require('typescript');
const M = '/home/user/maor-system/src';
const tdir = fs.mkdtempSync(path.join(os.tmpdir(), 'shop-'));
const opt = { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } };
const emit = (name, src) => fs.writeFileSync(path.join(tdir, name), ts.transpileModule(src, opt).outputText);
const lines = (p) => fs.readFileSync(p, 'utf8').split('\n');

// config.mjs — moduleOn + NAV_MODULE_KEYS + featureOn (15-52) + termOf (119-126)
const cfgL = lines(`${M}/lib/config.ts`);
emit('config.mjs', cfgL.slice(14, 52).join('\n') + '\n' + cfgL.slice(118, 126).join('\n'));
// date-util.mjs — isoLocal (13-17) + dateInRange (30-33)
const duL = lines(`${M}/lib/date-util.ts`);
emit('date-util.mjs', duL.slice(12, 17).join('\n') + '\n' + duL.slice(29, 33).join('\n'));
// calLib.mjs — isoOf = isoLocal (החור-היחיד ששופ/lib קורא מ-calLib)
fs.writeFileSync(path.join(tdir, 'calLib.mjs'), "export { isoLocal as isoOf } from './date-util.mjs';\n");
// hebrew.mjs — עצמאי (Intl בלבד): hebParts + holidayOf
emit('hebrew.mjs', fs.readFileSync(`${M}/lib/hebrew.ts`, 'utf8'));
// validate.mjs — normSearch (51-58)
emit('validate.mjs', lines(`${M}/lib/validate.ts`).slice(50, 58).join('\n'));
// search.mjs — המלא, ניתוב validate
emit('search.mjs', fs.readFileSync(`${M}/lib/search.ts`, 'utf8').replace("from './validate'", "from './validate.mjs'"));
// shop/lib.ts — המלא; types נמחקים בטרנספילציה, שאר הייבוא מנותב לתלויות-הזמן
emit('shop.mjs', fs.readFileSync(`${M}/components/shop/lib.ts`, 'utf8')
  .replace("from '../../lib/config'", "from './config.mjs'")
  .replace("from '../calendar/calLib'", "from './calLib.mjs'")
  .replace("from '../../lib/hebrew'", "from './hebrew.mjs'")
  .replace("from '../../lib/search'", "from './search.mjs'")
  .replace("from '../../lib/date-util'", "from './date-util.mjs'"));

const OLD = await import(pathToFileURL(path.join(tdir, 'shop.mjs')).href);
const OHEB = await import(pathToFileURL(path.join(tdir, 'hebrew.mjs')).href);
const OSEARCH = await import(pathToFileURL(path.join(tdir, 'search.mjs')).href);
const OCFG = await import(pathToFileURL(path.join(tdir, 'config.mjs')).href);
const NEW = await import('/home/user/-ai-chat-server/new/boxes/shop.mjs');

// שקעי-הקופסה = המנועים-הישנים עצמם
const HOL = OHEB.holidayOf, SF = OSEARCH.smartFilter, FO = OCFG.featureOn;

// ── קורפוס-LCG ──
let s = 20260824;
const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const pick = (a) => a[Math.floor(rnd() * a.length)];
const chance = (p) => rnd() < p;
const KINDS = ['meeting', 'coupon', 'gift', 'holidayGift'];
const HOLN = ['פורים', 'חנוכה', 'פסח', '', 'סוכות'];
const NAMES = ['כהן', 'לוי', 'משה', 'שרה', 'בן דוד', '', 'מזרחי לוי'];
const FIRST = ['דוד', 'רבקה', 'יוסי', 'מרים'];
const CITIES = ['ירושלים', 'בני ברק', '', 'פתח תקווה'];
const ADDRS = ['הרצל 5', 'ויצמן 12', '', 'בן גוריון 3'];
const DATES = ['2026-01-05', '2026-03-01', '2026-06-10', '2026-08-01', '2026-09-10', '2026-12-10', '2025-07-01', ''];
const CRITS = [{ id: 'x1', discountPct: 10 }, { id: 'x2', discountPct: 25 }, { id: 'x3', discountPct: 150 }, { id: 'x4', discountPct: -5 }, { id: 'x5', discountPct: NaN }];
const CRITIDS = CRITS.map((c) => c.id);
const CONFIGS = [undefined, { modules: {}, features: {}, terms: {} }, { modules: {}, features: { 'shop.expiry': false } }, { modules: {}, features: { shop: false } }, { modules: { shop: false } }, { modules: {}, terms: { 'entity.familyOf': 'בית', 'entity.family': 'בית-אב' } }];
const QUERIES = ['', '  ', 'כהן', 'משה', 'סל', 'zzz', 'לוי כהן'];
const SORTS = ['pending', 'name', 'progress'];
const STOCKST = ['', 'out', 'low', 'untracked'];
const subset = (arr) => arr.filter(() => chance(0.4));

function genDb() {
  const nIt = 1 + Math.floor(rnd() * 3);
  const shopItems = Array.from({ length: nIt }, (_, i) => ({
    id: 'it' + i, name: pick(NAMES), kind: pick(KINDS), storeId: '',
    value: pick([0, 10, 50]), basePrice: pick([0, 20, 100]),
    stock: chance(0.5) ? Math.floor(rnd() * 4) : undefined,
    minStock: chance(0.3) ? 1 : undefined,
    validDays: chance(0.4) ? pick([0, 5, 10]) : undefined,
    holidays: chance(0.3) ? [pick(HOLN)] : undefined,
    waits: chance(0.3) ? ['w1'] : undefined,
    active: chance(0.85),
  }));
  const nP = 1 + Math.floor(rnd() * 3);
  const shopProducts = Array.from({ length: nP }, (_, p) => {
    const nc = 1 + Math.floor(rnd() * 3);
    return {
      id: 'p' + p, name: pick(NAMES), desc: pick(['', 'תיאור']), active: chance(0.85),
      components: Array.from({ length: nc }, (_, c) => ({
        id: 'cmp' + p + '_' + c, kind: pick(KINDS), label: pick(NAMES), storeId: '',
        itemId: chance(0.6) ? 'it' + Math.floor(rnd() * nIt) : '',
        value: chance(0.5) ? pick([0, 10]) : undefined,
        basePrice: chance(0.5) ? pick([0, 20]) : undefined,
        stock: chance(0.4) ? Math.floor(rnd() * 3) : undefined,
        validDays: chance(0.4) ? pick([0, 5, 10]) : undefined,
      })),
    };
  });
  const nF = 1 + Math.floor(rnd() * 4);
  const families = Array.from({ length: nF }, (_, i) => ({
    id: 'f' + i, name: pick(NAMES), status: chance(0.8) ? 'active' : 'inactive',
    address: pick(ADDRS), city: pick(CITIES), phone: pick(['050', '', '03']),
    members: Array.from({ length: Math.floor(rnd() * 3) }, (_, m) => ({ id: 'm' + i + '_' + m, first: pick(FIRST) })),
  }));
  const nA = Math.floor(rnd() * 6);
  const shopAssignments = Array.from({ length: nA }, (_, i) => {
    const prod = pick(shopProducts), fam = pick(families);
    const compIds = prod.components.map((c) => c.id);
    return {
      id: 'a' + i, productId: prod.id, famId: fam.id,
      memberId: fam.members.length && chance(0.4) ? pick(fam.members).id : undefined,
      status: chance(0.75) ? 'active' : 'inactive', since: pick(DATES),
      criterionIds: subset(CRITIDS),
      redemptions: Array.from({ length: Math.floor(rnd() * 4) }, (_, r) => ({
        componentId: pick(compIds), value: pick([0, 10, 50]), paid: pick([0, 5, 20]),
        voidedAt: chance(0.3) ? pick(DATES.filter(Boolean)) : undefined,
        holiday: chance(0.4) ? pick(HOLN) : undefined,
        date: pick(DATES.filter(Boolean)), rid: chance(0.5) ? 'S-' + i + r : undefined,
      })),
    };
  });
  const shopIntakes = Array.from({ length: Math.floor(rnd() * 4) }, (_, i) => ({
    id: 'in' + i, itemId: 'it' + Math.floor(rnd() * nIt),
    expiry: chance(0.6) ? pick(DATES) : '', qty: Math.floor(rnd() * 10),
    date: pick(DATES.filter(Boolean)), cost: pick([0, 5, 20]),
  }));
  const shopEvents = Array.from({ length: Math.floor(rnd() * 4) }, (_, i) => ({
    id: 'ev' + i, kind: chance(0.7) ? 'meeting' : 'other', done: chance(0.4),
    date: pick(DATES.filter(Boolean)), time: pick(['', '09:00', '14:30']),
    roomId: chance(0.4) ? 'r1' : undefined,
    assignmentId: nA && chance(0.7) ? 'a' + Math.floor(rnd() * nA) : '',
    title: pick(NAMES),
  }));
  return { shopItems, shopProducts, families, shopAssignments, shopIntakes, shopEvents, rooms: [{ id: 'r1', name: 'חדר א' }] };
}

const J = (x) => JSON.stringify(x);
let n = 0;

// קבועים
assert.strictEqual(NEW.SHOP_HOLIDAY_DUE_DAYS, OLD.SHOP_HOLIDAY_DUE_DAYS, 'SHOP_HOLIDAY_DUE_DAYS'); n++;
assert.strictEqual(NEW.SHOP_EXPIRY_WARN_DAYS, OLD.SHOP_EXPIRY_WARN_DAYS, 'SHOP_EXPIRY_WARN_DAYS'); n++;
// holidayNames — memoized במקור, מחושב-מחדש בחדש; זהה
assert.strictEqual(J(NEW.holidayNames(HOL)), J(OLD.holidayNames()), 'holidayNames'); n++;
// effectivePrice/maxDiscountPct — כולל non-finite/clamp
for (const bp of [100, 0, 250, Infinity, NaN, -50]) for (let k = 0; k < 6; k++) {
  const ids = subset(CRITIDS);
  assert.strictEqual(NEW.maxDiscountPct(ids, CRITS), OLD.maxDiscountPct(ids, CRITS), 'maxDiscountPct'); n++;
  assert.strictEqual(NEW.effectivePrice(bp, ids, CRITS), OLD.effectivePrice(bp, ids, CRITS), 'effectivePrice'); n++;
}
// holidayAllowed — ריק/חסר/כולל
for (const ri of [{}, { holidays: [] }, { holidays: ['פורים'] }]) for (const h of HOLN) {
  assert.strictEqual(NEW.holidayAllowed(ri, h), OLD.holidayAllowed(ri, h), 'holidayAllowed'); n++;
}
// upcomingHolidays — טווחים סביב חגים אמיתיים
for (const from of ['2026-03-01', '2026-09-10', '2026-12-01']) for (const days of [10, 45, 120]) {
  assert.strictEqual(J(NEW.upcomingHolidays(from, days, HOL)), J(OLD.upcomingHolidays(from, days)), 'upcomingHolidays'); n++;
}

for (let iter = 0; iter < 300; iter++) {
  const db = genDb();
  const today = pick(DATES.filter(Boolean));

  // חוטי-db טהורים
  assert.strictEqual(J(NEW.intakeLog(db)), J(OLD.intakeLog(db)), 'intakeLog'); n++;
  for (const p of db.shopProducts) {
    assert.strictEqual(J(NEW.componentCounts(p)), J(OLD.componentCounts(p)), 'componentCounts'); n++;
    for (const c of p.components) {
      assert.strictEqual(J(NEW.itemOf(db, c)), J(OLD.itemOf(db, c)), 'itemOf'); n++;
      assert.strictEqual(NEW.componentRemaining(c.id, p.id, db.shopAssignments, c.stock),
        OLD.componentRemaining(c.id, p.id, db.shopAssignments, c.stock), 'componentRemaining'); n++;
    }
    assert.strictEqual(J(NEW.productAssignments(db.shopAssignments, p.id)), J(OLD.productAssignments(db.shopAssignments, p.id)), 'productAssignments'); n++;
  }
  for (const it of db.shopItems) {
    assert.strictEqual(NEW.itemRemaining(db, it.id), OLD.itemRemaining(db, it.id), 'itemRemaining'); n++;
  }
  // סכומים + liveRedemptions/couponExpiry/assignmentRedeemed
  assert.strictEqual(NEW.givenValue(db.shopAssignments), OLD.givenValue(db.shopAssignments), 'givenValue'); n++;
  assert.strictEqual(NEW.collectedPaid(db.shopAssignments), OLD.collectedPaid(db.shopAssignments), 'collectedPaid'); n++;
  assert.strictEqual(NEW.subsidyTotal(db.shopAssignments), OLD.subsidyTotal(db.shopAssignments), 'subsidyTotal'); n++;
  for (const a of db.shopAssignments) {
    assert.strictEqual(J(NEW.liveRedemptions(a)), J(OLD.liveRedemptions(a)), 'liveRedemptions'); n++;
    const prod = db.shopProducts.find((p) => p.id === a.productId);
    for (const c of prod.components) {
      assert.strictEqual(NEW.couponExpiry(a, NEW.itemOf(db, c)), OLD.couponExpiry(a, OLD.itemOf(db, c)), 'couponExpiry'); n++;
      assert.strictEqual(NEW.assignmentRedeemed(a, c.id), OLD.assignmentRedeemed(a, c.id), 'assignmentRedeemed'); n++;
      const h = { iso: today, name: pick(HOLN) };
      assert.strictEqual(NEW.assignmentRedeemed(a, c.id, h), OLD.assignmentRedeemed(a, c.id, h), 'assignmentRedeemed-holiday'); n++;
      const hols = NEW.upcomingHolidays(today, 30, HOL);
      assert.strictEqual(NEW.componentRedeemedNow(db, a, c, hols), OLD.componentRedeemedNow(db, a, c, hols), 'componentRedeemedNow'); n++;
      assert.strictEqual(NEW.componentRedeemedNow(db, a, c), OLD.componentRedeemedNow(db, a, c), 'componentRedeemedNow-nohol'); n++;
    }
    for (const from of ['', today]) for (const to of ['', '2026-12-31']) for (const inc of [true, false]) {
      assert.strictEqual(J(NEW.filterRedemptions(a, from, to, inc)), J(OLD.filterRedemptions(a, from, to, inc)), 'filterRedemptions'); n++;
    }
  }
  // expiringIntakes + upcomingMeetings
  for (const w of [undefined, 7, 30]) {
    assert.strictEqual(J(NEW.expiringIntakes(db, today, w)), J(OLD.expiringIntakes(db, today, w)), 'expiringIntakes'); n++;
  }
  for (const cfg of CONFIGS) {
    assert.strictEqual(J(NEW.upcomingMeetings(db, today, 2, cfg)), J(OLD.upcomingMeetings(db, today, 2, cfg)), 'upcomingMeetings'); n++;
    assert.strictEqual(J(NEW.needsCare(db, today, cfg, HOL, FO)), J(OLD.needsCare(db, today, cfg)), 'needsCare ' + J(cfg)); n++;
    assert.strictEqual(J(NEW.redemptionsCsvRows(db, cfg)), J(OLD.redemptionsCsvRows(db, cfg)), 'redemptionsCsvRows'); n++;
    for (const a of db.shopAssignments) {
      assert.strictEqual(NEW.beneficiaryLabel(db, a, cfg), OLD.beneficiaryLabel(db, a, cfg), 'beneficiaryLabel'); n++;
    }
    for (const p of db.shopProducts) {
      assert.strictEqual(J(NEW.distributionListLines(db, p.id, cfg)), J(OLD.distributionListLines(db, p.id, cfg)), 'distributionListLines'); n++;
    }
  }
  // eligibleFamilies
  for (const p of db.shopProducts) {
    const crit = subset(CRITIDS);
    assert.strictEqual(J(NEW.eligibleFamilies(db, crit, p.id)), J(OLD.eligibleFamilies(db, crit, p.id)), 'eligibleFamilies'); n++;
  }
  // סינון — smartFilter/holidayOf מוזרקים
  for (const q of QUERIES) {
    const oa = chance(0.5);
    assert.strictEqual(J(NEW.filterProducts(db.shopProducts, q, oa, SF)), J(OLD.filterProducts(db.shopProducts, q, oa)), 'filterProducts'); n++;
    for (const st of STOCKST) {
      assert.strictEqual(J(NEW.filterItems(db, q, st, SF)), J(OLD.filterItems(db, q, st)), 'filterItems'); n++;
    }
    for (const sort of SORTS) for (const td of [undefined, today]) {
      const po = chance(0.4);
      assert.strictEqual(J(NEW.filterAssignments(db, q, '', po, '', sort, td, HOL, SF)),
        J(OLD.filterAssignments(db, q, '', po, '', sort, td)), 'filterAssignments'); n++;
    }
  }
}

// ── עדשה-עוינת (CURRICULUM #6): קלטי-קצה שהמקור מטפל בהם ──
const empty = { shopItems: [], shopProducts: [], families: [], shopAssignments: [], shopIntakes: [], shopEvents: [], rooms: [] };
const ghostA = { id: 'g', productId: 'nope', famId: 'nope', status: 'active', since: '', criterionIds: [], redemptions: [] };
const orphanCfg = { modules: {}, terms: { 'entity.familyOf': 'בית', 'entity.family': 'שבט' } };
const EDGE = [
  ['needsCare-ריק', () => J(NEW.needsCare(empty, '2026-08-01', undefined, HOL, FO)), () => J(OLD.needsCare(empty, '2026-08-01'))],
  ['beneficiaryLabel-משפחה-לא-ידועה', () => NEW.beneficiaryLabel(empty, ghostA, orphanCfg), () => OLD.beneficiaryLabel(empty, ghostA, orphanCfg)],
  ['beneficiaryLabel-בלי-config', () => NEW.beneficiaryLabel(empty, ghostA), () => OLD.beneficiaryLabel(empty, ghostA)],
  ['beneficiaryLabel-חבר-לא-נמצא', () => NEW.beneficiaryLabel({ families: [{ id: 'f', name: 'כהן', members: [] }] }, { famId: 'f', memberId: 'ghost' }), () => OLD.beneficiaryLabel({ families: [{ id: 'f', name: 'כהן', members: [] }] }, { famId: 'f', memberId: 'ghost' })],
  ['distributionList-מוצר-לא-קיים', () => J(NEW.distributionListLines(empty, 'nope', undefined)), () => J(OLD.distributionListLines(empty, 'nope', undefined))],
  ['upcomingHolidays-days0', () => J(NEW.upcomingHolidays('2026-03-05', 0, HOL)), () => J(OLD.upcomingHolidays('2026-03-05', 0))],
  ['couponExpiry-since-ריק', () => NEW.couponExpiry({ since: '' }, { validDays: 10 }), () => OLD.couponExpiry({ since: '' }, { validDays: 10 })],
  ['itemRemaining-פריט-לא-קיים', () => NEW.itemRemaining(empty, 'nope'), () => OLD.itemRemaining(empty, 'nope')],
  ['expiringIntakes-ריק', () => J(NEW.expiringIntakes(empty, '2026-08-01')), () => J(OLD.expiringIntakes(empty, '2026-08-01'))],
  ['upcomingMeetings-ריק', () => J(NEW.upcomingMeetings(empty, '2026-08-01', 2, undefined)), () => J(OLD.upcomingMeetings(empty, '2026-08-01', 2, undefined))],
  ['filterRedemptions-קצוות-ריקים', () => J(NEW.filterRedemptions({ redemptions: [{ date: '2026-08-01', voidedAt: 'x' }] }, '', '', false)), () => J(OLD.filterRedemptions({ redemptions: [{ date: '2026-08-01', voidedAt: 'x' }] }, '', '', false))],
];
for (const [name, a, b] of EDGE) { assert.strictEqual(a(), b(), 'edge ' + name); n++; }

fs.rmSync(tdir, { recursive: true, force: true });
console.log(`🥇 זהב-מודול-החנות: ישן≡חדש על ${n} השוואות (300 סבבים + ${EDGE.length} קצוות-עוינים · 31 חוטים · holidayOf/smartFilter/featureOn אמיתיים · תו-בתו)`);
