#!/usr/bin/env node
/** 🥇 רתמת-זהב · ביקורת-תקינות — הישן (maor src/lib/audit.ts מתורגם-חי, עם שכניו
 *  האמיתיים termOf/validate/supporterAgg/ageOf מתורגמים-חיים אף הם) ≡ החדש
 *  (Genesis new/boxes/audit.mjs) על קורפוס-LCG ‏seed=20260824: משפחות/ילדים/
 *  שיבוצים/תומכים עם ת"ז-שבורות/טלפונים-חריגים/ניקוד/סופיות/null/לא-מערך ×
 *  config/todayIso/extra. אפס-סטייה. בלי Date.now — שעון קבוע 2026-08-24T12:00
 *  (ה-ageOf הישן קורא new Date() ⇒ Date גלובלי מקובע לרתמה; לחדש מוזרק now). */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert';

const require = createRequire('/home/user/maor-system/');
const ts = require('typescript');
const OPT = { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } };
const tdir = fs.mkdtempSync(path.join(os.tmpdir(), 'audit-'));
const emit = (name, src) => fs.writeFileSync(path.join(tdir, name), ts.transpileModule(src, OPT).outputText);
const lines = (p) => fs.readFileSync('/home/user/maor-system/src/' + p, 'utf8').split('\n');

// השכנים האמיתיים — מתורגמים-חיים מהמקור (לא העתקים):
emit('shim-validate.mjs', lines('lib/validate.ts').join('\n')); // קובץ טהור ללא ייבוא-ערכים
emit('shim-supporterAgg.mjs', lines('lib/supporterAgg.ts').join('\n')); // ייבוא-type בלבד — נמחק בתרגום
emit('shim-config.mjs', lines('lib/config.ts').slice(118, 126).join('\n')); // termOf (config.ts:119-126)
emit('shim-families.mjs', lines('components/families/lib.ts').slice(23, 35).join('\n')); // ageOf (families/lib.ts:24-35)
// audit.ts עצמו — כלשונו, רק מפרטי-הייבוא מופנים לשים-ים:
emit('audit.mjs', lines('lib/audit.ts').join('\n')
  .replace("'./config'", "'./shim-config.mjs'")
  .replace("'./validate'", "'./shim-validate.mjs'")
  .replace("'./supporterAgg'", "'./shim-supporterAgg.mjs'")
  .replace("'../components/families/lib'", "'./shim-families.mjs'"));

// שעון קבוע: ה-ageOf הישן קורא new Date() בגוף-הפונקציה — מקבעים את ה-Date הגלובלי
// (בנאי-עם-ארגומנטים מתנהג רגיל; בנאי-ריק ⇒ 2026-08-24T12:00 מקומי). בלי Date.now.
const RealDate = Date;
const FIXED = [2026, 7, 24, 12, 0, 0];
class FixedDate extends RealDate {
  constructor(...a) { a.length ? super(...a) : super(...FIXED); }
  static now() { return new RealDate(...FIXED).getTime(); }
}
globalThis.Date = FixedDate;
const OLD = await import(pathToFileURL(path.join(tdir, 'audit.mjs')).href);
const NEW = await import('/home/user/-ai-chat-server/new/boxes/audit.mjs');
const NOW = new RealDate(...FIXED);

let s = 20260824;
const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const pick = (a) => a[Math.floor(rnd() * a.length)];
const maybe = (v) => (rnd() < 0.5 ? v : undefined);

const names = ['כהן', 'בן דוד', 'בןדוד', 'לוי', ' לוי ', 'שָׁלוֹם', "ד'ר חץ", 'מזרחי-דיין', '', 'Smith'];
const mothers = ['רחל', 'רָחֵל', '', undefined, 'לאה'];
const phones = ['0501234567', '050-123-4567', '03-5551234', '12345678', '123456', '972501234567', '05012345678', '', '-', undefined, '05x'];
const ids = ['123456782', '123456789', '000000018', '111111118', '12345', '1234', '', undefined, '00000', 'אבג'];
const emails = ['ok@mail.org', 'bad@', 'x@y.c', 'שם@דומיין.קום', '', undefined, 'a@b.co'];
const cities = ['צפת', '', undefined];
const addrs = ['רח 1', '', undefined];
const statuses = ['active', 'inactive', undefined];
const marital = ['נשואים', 'אלמן/ה', 'גרושים', 'פרודים', 'רווק/ה', undefined];
const births = ['2015-06-10', '1990-01-01', '2030-01-01', 'bad-date', '', undefined, '2020-02-29'];
const dates = ['2026-01-01', '2027-01-01', '2026-08-24', '', undefined];
const configs = [undefined, { terms: { 'nav.families': 'לקוחות', 'entity.familyOf': 'תיק', 'entity.donations': 'עסקאות', 'entity.donation': 'עסקה' } }, { terms: { 'nav.families': '  ' } }, {}];

let mid = 0;
const mkMember = () => ({
  id: 'm' + ++mid, first: pick(names) || 'פלוני', birth: pick(births), idNum: maybe(pick(ids)),
  phone: maybe(pick(phones)), isParent: rnd() < 0.25,
});
const mkFamily = (i) => ({
  id: 'f' + i, name: pick(names), mother: maybe(pick(mothers)), father: maybe(pick(names)),
  phone: maybe(pick(phones)), phone2: maybe(pick(phones)), fatherId: maybe(pick(ids)), motherId: maybe(pick(ids)),
  email: maybe(pick(emails)), city: pick(cities), address: pick(addrs), status: pick(statuses),
  maritalStatus: pick(marital),
  members: rnd() < 0.1 ? 'לא-מערך' : Array.from({ length: Math.floor(rnd() * 4) }, mkMember),
});
const mkDonation = () => ({ amount: pick([100, 50, 0, -5, 36.5]), cur: pick(['₪', '$', '', undefined]), date: pick(dates), rid: 'D-' + Math.floor(rnd() * 9) });
const mkSupporter = (i) => ({
  id: 's' + i, name: pick(names), idNum: maybe(pick(ids)), phone: maybe(pick(phones)), email: maybe(pick(emails)),
  ils: maybe(pick([0, 50, 100, 136.5])), usd: maybe(pick([0, 20])), count: maybe(pick([0, 1, 2])),
  nextDate: maybe(pick(dates)),
  donations: rnd() < 0.1 ? null : Array.from({ length: Math.floor(rnd() * 3) }, mkDonation),
});
const mkDb = (i) => i === 0 ? {} : i === 1 ? { families: 'לא-מערך', enrollments: null, supporters: undefined } : {
  families: Array.from({ length: Math.floor(rnd() * 6) }, (_, j) => mkFamily(j)),
  enrollments: Array.from({ length: Math.floor(rnd() * 4) }, () => ({
    memberId: 'm' + Math.max(1, Math.floor(rnd() * (mid + 2))), totalDue: pick([0, 100, undefined]),
    payments: pick([undefined, [], [{ amount: 80 }], [{ amount: 80 }, { amount: 40 }]]),
  })),
  supporters: Array.from({ length: Math.floor(rnd() * 5) }, (_, j) => mkSupporter(j)),
};

let n = 0;
for (let i = 0; i < 300; i++) {
  const db = mkDb(i);
  const todayIso = pick(['', '2026-08-24', undefined]);
  const extra = pick([true, false, undefined]);
  const config = pick(configs);
  // 1) runAudit ≡ — כל הממצאים, סדר+נוסח תו-בתו (ל-ageOf הישן: Date גלובלי מקובע; לחדש: now מוזרק)
  const oldIssues = OLD.runAudit(db, todayIso, extra, config);
  const newIssues = NEW.runAudit(db, todayIso, extra, config, NOW);
  assert.deepStrictEqual(newIssues, oldIssues, 'runAudit סבב ' + i);
  n++;
  // 2) phoneIssue ≡ על קלט-הסבב
  const p = pick(phones);
  assert.strictEqual(NEW.phoneIssue(p), OLD.phoneIssue(p), 'phoneIssue: ' + p);
  n++;
  // 3) auditReportLines ≡ על ממצאי-הסבב (nowLabel קבוע — בלי שעון)
  const org = pick(['', 'אור ראשון', undefined]);
  assert.deepStrictEqual(
    NEW.auditReportLines(org, newIssues, '24.8.2026, 12:00:00'),
    OLD.auditReportLines(org, oldIssues, '24.8.2026, 12:00:00'), 'reportLines סבב ' + i);
  n++;
}
// 4) קבועי-התצוגה ≡
assert.deepStrictEqual(NEW.AUDIT_CATEGORIES, OLD.AUDIT_CATEGORIES, 'AUDIT_CATEGORIES');
assert.deepStrictEqual(NEW.AUDIT_CAT_COLORS, OLD.AUDIT_CAT_COLORS, 'AUDIT_CAT_COLORS');
n += 2;

globalThis.Date = RealDate;
fs.rmSync(tdir, { recursive: true, force: true });
console.log(`🥇 זהב-הביקורת: ישן≡חדש על ${n} השוואות (300 סבבים: runAudit מלא + phoneIssue + דוח + קבועים; שעון קבוע 2026-08-24)`);
