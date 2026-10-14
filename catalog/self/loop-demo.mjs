#!/usr/bin/env node
/**
 * 🔁 ההדגמות של הלולאה (SELF-LOOP, 14.10.2026) — הוכחה שהמכונה עצמה מתקנת/משפרת/מסרבת, בלי עזרה ידנית.
 *
 * כל הדגמה: עותק של הריפו ⇒ **ההכנה בלבד** (שבירה / האטה / חלופה-פתיון — שינוי-טקסט אחד, כתוב כאן) ⇒
 * `node <עותק>/catalog/self/loop.mjs --apply --only <נבדק>` — הלולאה של העותק מוצאת, מחפשת, מחליפה, בודקת ומחליטה לבד ⇒
 * בודקים את הפנקס ואת הקוד שבעותק.
 *
 *   fix    — «מטביע חותם» נשבר: `fnv` (מימוש-הייחוס, lib/verbs.mjs) מאבד את הריפוד ⇒ החוק fingerprint.fixed נכשל ⇒
 *            הלולאה מחליפה בחלק המוכח ⇒ חוקים n/n · rebuild ביט-זהה · vitest ⇒ נשאר.
 *   speed  — `fnv` הופך ל-O(n²) (מחשב מחדש את הטביעה של כל תחילית) — אותם פלטים ⇒ חוק-המהירות: חלק מוכח, אותם פלטים, פחות צעדים ⇒ מוחלף.
 *   revert — `fnvHex` עצמו הופך ל-O(n²) ⇒ הלולאה בוחרת את fnvHexPoints (זהה על כל קלטי-הקורא, מהיר) ⇒ על העותק rebuild
 *            לא ביט-זהה (אמוג'י בשמות-חלקים — נקודות-קוד מול יחידות UTF-16) ⇒ הלולאה מחזירה ורושמת למה.
 *   refuse — חלופה-פתיון מהירה (צעד אחד פחות לכל קריאה) שעוברת את חוקי «מטביע חותם» n/n — אבל נותנת פלט אחר על קלט אחד ⇒
 *            הלולאה מסרבת ורושמת למה; הנבדק נשאר כמו שהוא.
 *
 *   node catalog/self/loop-demo.mjs [--quick] [--only fix,speed,revert,refuse] [--out <קובץ>]
 *   (--quick: בלי rebuild/vitest על עותק-הבדיקה של הלולאה — לבדיקות-השימור; בלי --quick: כל השערים)
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { makeCopy, subjectInputs } from './loop.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const VERBS = 'catalog/lib/verbs.mjs';
const FNV = 'machine:catalog/lib/verbs.mjs#fnv·fingerprint';
const ORIGINAL = "const fnv = fnvHex; // 🧩 SELF: חלק-המכונה המוכח (catalog/self/parts.mjs) — היה כאן העתק של FNV-1a";

const edit = (W, rel, from, to) => {
  const f = path.join(W, rel); const t = fs.readFileSync(f, 'utf8');
  if (!t.includes(from)) throw new Error('ההכנה לא מצאה את הטקסט ב-' + rel);
  fs.writeFileSync(f, t.replace(from, to));
};

export const DEMOS = {
  fix: {
    he: 'תיקון — חוק שנשבר',
    // המוטנט הידוע של fingerprint.fixed: בלי ריפוד ⇒ 7 או 8 תווים (היה באג אמיתי במכונה — SELF באג 2)
    setup: async (W) => edit(W, VERBS, ORIGINAL, "const fnv = (s) => fnvHex(s).replace(/^0+/, ''); // הדגמה: נשבר (בלי ריפוד)"),
    expect: (row) => row.decision === 'הוחלף' && /^✗ fingerprint\.fixed/.test(row.laws) && row.found.some((f) => f.startsWith('באג')),
  },
  speed: {
    he: 'מהירות — גרסה איטית',
    setup: async (W) => edit(W, VERBS, ORIGINAL, 'const fnv = (s) => { let h = fnvHex(s); for (let i = 1; i <= s.length; i++) h = fnvHex(s.slice(0, i)); return h; }; // הדגמה: O(n²)'),
    expect: (row) => row.decision === 'הוחלף' && row.found.some((f) => f.startsWith('חלופה זולה')),
  },
  revert: {
    he: 'החזרה — שווה על הקלטים של הקורא, לא על הקטלוג',
    subject: 'machine:catalog/self/parts.mjs#fnvHex·fingerprint',
    // fnvHex (החלק עצמו) הופך ל-O(n²) — אותם פלטים. החלופה הזולה שהלולאה מוצאת: fnvHexPoints — זהה על כל הקלטים שהקורא
    // נותן (אין בהם אמוג'י), אבל שונה על תווים מחוץ ל-BMP. העותק מגלה: ה-ref של המפקדים (content@<fnvHex>) על חלקים
    // שבשמם יש אמוג'י משתנה ⇒ rebuild לא ביט-זהה ⇒ הלולאה מחזירה ורושמת למה.
    setup: async (W) => edit(W, 'catalog/self/parts.mjs', "export const fnvHex = (s) => fnv1a(s).toString(16).padStart(8, '0');", "export const fnvHex = (s) => { let h = ''; for (let i = 0; i <= s.length; i++) h = fnv1a(s.slice(0, i)).toString(16).padStart(8, '0'); return h; }; // הדגמה: O(n²)"),
    expect: (row, quick) => (quick ? row.decision === 'הוחלף' : row.decision === 'הוחזר' && row.attempts.some((a) => !a.ok && /פלטי-הקטלוג השתנו/.test(a.why))) && row.found.some((f) => f.startsWith('חלופה זולה')),
  },
  refuse: {
    he: 'סירוב — חלופה מהירה שטועה בקלט אחד',
    setup: async (W) => {
      // הפתיון: FNV-1a בתוך הגוף (בלי הקריאה ל-fnv1a ⇒ צעד אחד פחות לכל קריאה), וטעות על קלט אחד — הראשון שהקורא נותן ל-fnv
      const x = (await subjectInputs(W, FNV))[0][0];
      edit(W, 'catalog/self/parts.mjs', '/** איפה כל חלק היה כתוב', [
        '/** הדגמה (loop-demo refuse): חלופה-פתיון — מהירה, עוברת את חוקי «מטביע חותם», טועה בקלט אחד. */',
        'export function fnvHexBait(s) {',
        '  if (s === ' + JSON.stringify(x) + ') s += "·";',
        '  let h = 0x811c9dc5;',
        '  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;',
        "  return h.toString(16).padStart(8, '0');",
        '}',
        '',
        '/** איפה כל חלק היה כתוב',
      ].join('\n'));
      edit(W, 'catalog/self/roles.mjs', "  { path: 'catalog/self/parts.mjs', symbol: 'fnvHexPoints',", "  { path: 'catalog/self/parts.mjs', symbol: 'fnvHexBait', verb: 'fingerprint', role: 'הדגמה — פתיון', takes: [{ name: 's', d: STR }] },\n  { path: 'catalog/self/parts.mjs', symbol: 'fnvHexPoints',");
    },
    expect: (row) => row.decision === 'נשאר' && row.tried.some((t) => t.cand.endsWith('#fnvHexBait') && /^נדחה — פלט אחר על קלט אחד/.test(t.verdict)),
  },
};

/** הדגמה אחת ⇒ {demo, ok, row, diff} (בלי נתיבים זמניים). */
export async function runDemo(name, { quick = false, tmp = null } = {}) {
  const D = DEMOS[name];
  const base = tmp ?? fs.mkdtempSync(path.join(os.tmpdir(), 'loop-demo-'));
  const W = makeCopy(ROOT, path.join(base, name));
  await D.setup(W);
  const subject = D.subject ?? FNV;
  const file = subject.split(':')[1].split('#')[0];
  const before = fs.readFileSync(path.join(W, file), 'utf8');
  const r = spawnSync(process.execPath, [path.join(W, 'catalog/self/loop.mjs'), '--apply', '--only', subject, ...(quick ? ['--quick'] : [])], { cwd: W, encoding: 'utf8', maxBuffer: 1 << 28, env: { ...process.env, TMPDIR: base } });
  if (r.status !== 0) throw new Error('הלולאה נכשלה בהדגמה ' + name + ':\n' + String(r.stderr).slice(-2000));
  const ledger = JSON.parse(fs.readFileSync(path.join(W, 'catalog/self/loop-ledger.json'), 'utf8'));
  const row = ledger.rows.find((x) => x.subject === subject);
  const after = fs.readFileSync(path.join(W, file), 'utf8');
  const sym = subject.split('#')[1].split('·')[0];
  const line = (t) => t.split('\n').find((l) => new RegExp('^(export )?const ' + sym + ' =').test(l)) ?? '';
  const out = { demo: name, he: D.he, ok: D.expect(row, quick), checks: ledger.checks, before: line(before), after: line(after), loopWrote: before !== after, row };
  if (!tmp) fs.rmSync(base, { recursive: true, force: true });
  return out;
}

async function main() {
  const argv = process.argv.slice(2);
  const val = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
  const quick = argv.includes('--quick');
  const names = (val('--only') ?? Object.keys(DEMOS).join(',')).split(',');
  const res = [];
  for (const n of names) { const r = await runDemo(n, { quick }); res.push(r); console.log((r.ok ? '✓ ' : '✗ ') + n + ' — ' + r.he + ': ' + r.row.decision + (r.row.by ? ' ב-' + r.row.by : '') + ' · ' + (r.row.why ?? '')); }
  const out = val('--out');
  if (out) fs.writeFileSync(path.resolve(out), JSON.stringify({ quick, demos: res }, null, 1) + '\n');
  if (res.some((r) => !r.ok)) process.exit(1);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) await main();
