/**
 * 🔁 SELF-LOOP (14.10.2026) — ratchet.
 *
 * מיזוג · «מנרמל» (lib/blank.mjs): הוספת הערה בסוף שורה קיימת (`// x` אחרי `const i = ORDER.indexOf(status);`
 * ב-src/components/shop7/lib.ts:16, בלי שורה חדשה) שינתה את הטביעה — ההערה הוחלפה ברווח, והרווח שלפניה נשאר ⇒
 * `x;  ` ≠ `x;` ⇒ open/probe/prove/combine רצו (38.7 שנ׳) ושני קבצי-חותמות השתנו. עכשיו הערה + הרווחים שסביבה ⇒ כלום
 * בקצה-שורה, ורווח רק כשבלעדיו שני אסימונים מתמזגים. מוטנט: הגרסה הישנה (רווח קבוע במקום כל הערה).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { blankComments } from '../lib/blank.mjs';

const ROOT = join(__dirname, '..', '..');

/** המוטנט: הנרמול של SELF-V2 (רווח אחד במקום כל הערה). */
function oldBlank(text: string, file: string) {
  // אותם טווחים — רק ההחלפה הישנה; משוחזר מההבדל: כל הערה ⇒ ' ' (או סופי-השורה שבתוכה)
  const stripped = blankComments(text, file);
  return { stripped, legacy: text.replace(/[ \t]*\/\/[^\n]*$/gm, (m) => m.replace(/\/\/[^\n]*$/, ' ')) };
}

describe('SELF-LOOP · מיזוג — הערה בלי שינוי במספר השורות ⇒ אותה טביעה', () => {
  const f = 'src/components/shop7/lib.ts';
  const t = readFileSync(join(ROOT, f), 'utf8');
  const lines = t.split('\n');
  const at = lines.findIndex((l) => l.includes('const i = ORDER.indexOf(status);'));
  const withLine = (s: string) => lines.map((l, k) => (k === at ? s : l)).join('\n');
  it('הוספה · עריכה · מחיקה של הערה בסוף שורה / הערת-בלוק באמצע ⇒ אותו טקסט מנורמל', () => {
    expect(at).toBeGreaterThan(0);
    const base = blankComments(t, f);
    const variants = [
      withLine(lines[at] + ' // x'),
      withLine(lines[at] + '   // הערה ארוכה יותר'),
      withLine(lines[at] + '\t/* בלוק */'),
      withLine(lines[at].replace('const i =', 'const i = /* באמצע */')),
      withLine(lines[at] + '// צמוד'),
    ];
    for (const v of variants) {
      expect(v.split('\n').length).toBe(lines.length);
      expect(blankComments(v, f)).toBe(base);
    }
    // ומחיקה של הערה שכבר קיימת בקובץ (בלי למחוק את השורה)
    const k = lines.findIndex((l) => /\S.*\/\/ /.test(l) && !l.includes('://') && !/['"`]/.test(l));
    if (k >= 0) {
      const removed = lines.map((l, j) => (j === k ? l.replace(/\s*\/\/.*$/, '') : l)).join('\n');
      expect(blankComments(removed, f)).toBe(base);
    }
  });
  it('המוטנט (רווח קבוע במקום ההערה) — נתפס: הוספת `// x` בסוף השורה משנה את הטקסט', () => {
    const { legacy } = oldBlank(withLine(lines[at] + ' // x'), f);
    expect(legacy).not.toBe(oldBlank(t, f).legacy);
  });
  it('אסימונים לא מתמזגים: `a/*x*/b` ⇒ `a b` · `+/*x*/+` ⇒ `+ +` · `(/*x*/a)` ⇒ `(a)`', () => {
    expect(blankComments('f(a/*x*/b)', 'x.ts')).toBe('f(a b)');
    expect(blankComments('x = y +/*x*/+ z', 'x.ts')).toBe('x = y + + z');
    expect(blankComments('f(/*x*/a)', 'x.ts')).toBe('f(a)');
    expect(blankComments('a; // x\n  // שורה מלאה\nb', 'x.ts')).toBe('a;\n\nb');
  });
});

/* ═══════════════ 🔁 הלולאה — catalog/self/loop.mjs ═══════════════ */

import { SPEED_LAW, speedLaw, distinguishing, makePatch, findDecl, loop } from '../self/loop.mjs';
import { runDemo } from '../self/loop-demo.mjs';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';

const INNER = !!process.env.SELF_LOOP_INNER; // הלולאה מריצה את הבדיקות האלה על העותק שלה — שם לא מריצים אותה שוב

describe('SELF-LOOP · חוק-המהירות («יותר טוב» כחוק)', () => {
  const A = { outs: ['1', '2', '3'], steps: 30 };
  it('אותם פלטים + פחות צעדים ⇒ עובר; שוויון ⇒ לא מחליפים; פלט אחר ⇒ נכשל ואומר על איזה קלט', () => {
    expect(speedLaw(A, { outs: ['1', '2', '3'], steps: 29 }).ok).toBe(true);
    const eq = speedLaw(A, { outs: ['1', '2', '3'], steps: 30 });
    expect(eq.ok).toBe(false);
    expect(eq.laws['speed.fewer'].why).toMatch(/שוויון.*לא מחליפים/);
    const d = speedLaw(A, { outs: ['1', 'x', '3'], steps: 1 });
    expect(d.ok).toBe(false);
    expect(d.laws['speed.same'].why).toBe('פלט אחר על קלט אחד (#1)');
  });
  it('המוטנטים שהחוק תופס: «לא-יותר-צעדים» (≤ במקום <) · «רוב הפלטים זהים» (סובל פלט אחד שונה)', () => {
    const fewer = SPEED_LAW.laws.find((l) => l.id === 'speed.fewer')!;
    const same = SPEED_LAW.laws.find((l) => l.id === 'speed.same')!;
    const mutFewer = (a: typeof A, b: typeof A) => ({ ok: b.steps <= a.steps });
    const mutSame = (a: typeof A, b: typeof A) => ({ ok: a.outs.filter((o, k) => o !== b.outs[k]).length <= 1 });
    const tie = { outs: A.outs, steps: 30 }; const off = { outs: ['1', 'x', '3'], steps: 1 };
    expect(mutFewer(A, tie).ok).not.toBe(fewer.check(A, tie).ok); // המוטנט מחליף על שוויון — החוק לא
    expect(mutSame(A, off).ok).not.toBe(same.check(A, off).ok); // המוטנט מקבל פלט אחר — החוק לא
  });
  it('«קלטים מבחינים»: פרדיקט שכמעט תמיד false לא "שווה" לשום דבר על סמך הקלטים האלה', () => {
    expect(distinguishing(['false', 'false', 'false', 'true'])).toBe(true); // 75% — הגבול
    expect(distinguishing(['false', 'false', 'false', 'false', 'true'])).toBe(false);
    expect(distinguishing(['"a"', '"b"', '"c"'])).toBe(true);
    expect(distinguishing([])).toBe(false);
  });
});

describe('SELF-LOOP · השינוי המכני', () => {
  it('פונקציה · const = פונקציה · כינוי ⇒ קריאה לחלק + import אחד; חלק לא-מיוצא מקבל export; שם תפוס ⇒ כינוי', async () => {
    const R = mkdtempSync(join(tmpdir(), 'loop-patch-'));
    try {
      mkdirSync(join(R, 'catalog/lib'), { recursive: true }); mkdirSync(join(R, 'catalog/self'), { recursive: true });
      writeFileSync(join(R, 'catalog/self/parts.mjs'), 'function fast(a, b) { return a + b; }\nexport const other = 1;\n');
      writeFileSync(join(R, 'catalog/lib/x.mjs'), "import { y } from './y.mjs';\n/** doc */\nexport function slow(a, b) {\n  let s = 0; for (let i = 0; i < b; i++) s++; return a + s;\n}\nconst arrow = ({ a }, b = 2) => a + b; // ישן\nconst alias = slow;\nconst fast = 3;\n");
      const p1 = await makePatch(R, { path: 'catalog/lib/x.mjs', symbol: 'slow' }, { path: 'catalog/self/parts.mjs', symbol: 'fast' }, 'בדיקה');
      expect(p1.files!['catalog/self/parts.mjs']).toMatch(/^export function fast/);
      const t1 = p1.files!['catalog/lib/x.mjs'];
      expect(t1).toContain("import { fast as fast2 } from '../self/parts.mjs';"); // `fast` כבר תפוס בקובץ
      expect(t1).toMatch(/export function slow\(a, b\) \{\n {2}\/\/ 🔁 הלולאה \(SELF-LOOP\): בדיקה\n {2}return fast2\(a, b\);\n\}/);
      expect(t1).toContain('/** doc */');
      const p2 = await makePatch(R, { path: 'catalog/lib/x.mjs', symbol: 'arrow' }, { path: 'catalog/self/parts.mjs', symbol: 'fast' }, 'בדיקה');
      expect(p2.files!['catalog/lib/x.mjs']).toContain('const arrow = (...args) => fast2(...args);\n'); // פרמטרים לא-פשוטים ⇒ ...args; ההערה הישנה ירדה
      const p3 = await makePatch(R, { path: 'catalog/lib/x.mjs', symbol: 'alias' }, { path: 'catalog/lib/x.mjs', symbol: 'slow' }, 'בדיקה');
      expect(p3.files!['catalog/lib/x.mjs']).toContain('// 🔁 הלולאה (SELF-LOOP): בדיקה\nconst alias = slow;'); // אותו קובץ ⇒ בלי import
      expect((await findDecl(t1, 'slow'))!.line).toBeGreaterThan(1);
    } finally { rmSync(R, { recursive: true, force: true }); }
  });
});

describe.skipIf(INNER)('SELF-LOOP · ההדגמות — המכונה עושה את זה לבד (מהיר: חוקים · פלטים · צעדים; השערים המלאים: catalog/self/loop-demo.json)', () => {
  it('תיקון: fnv נשבר (בלי ריפוד) ⇒ fingerprint.fixed נכשל ⇒ הוחלף בחלק המוכח ⇒ n/n', async () => {
    const r = await runDemo('fix', { quick: true });
    expect(r.ok).toBe(true);
    expect(r.after).toBe('const fnv = (s) => fnvHex(s);');
    expect(r.row.attempts[0].checks.laws).toMatch(/^(\d+)\/\1$/);
  }, 300_000);
  it('מהירות: fnv איטי (O(n²), אותם פלטים) ⇒ חלק מוכח עם פחות צעדים ⇒ הוחלף', async () => {
    const r = await runDemo('speed', { quick: true });
    expect(r.ok).toBe(true);
    const [after, before] = r.row.attempts[0].checks.steps.split(' מול ').map(Number);
    expect(after).toBeLessThan(before);
  }, 300_000);
  it('סירוב: פתיון מהיר שעובר את החוקים אבל טועה בקלט אחד ⇒ לא מוחלף, ונרשם למה', async () => {
    const r = await runDemo('refuse', { quick: true });
    expect(r.ok).toBe(true);
    expect(r.loopWrote).toBe(false);
  }, 300_000);
  it('דטרמיניזם: שתי הרצות על אותו קוד ⇒ אותו פנקס, ביט-אחר-ביט', async () => {
    const only = ['machine:catalog/lib/verbs.mjs#fnv·fingerprint', 'machine:catalog/self/parts.mjs#rankCounts·sort'];
    const a = JSON.stringify(await loop({ only, quick: true }));
    const b = JSON.stringify(await loop({ only, quick: true }));
    expect(a).toBe(b);
    expect(a).not.toMatch(/\/tmp\/|self-loop-|"\d{13}"/); // בלי נתיבים זמניים ובלי שעון
  }, 300_000);
});

describe('SELF-LOOP · ההדגמות בשערים המלאים (catalog/self/loop-demo.json — `node catalog/self/loop-demo.mjs --out …`)', () => {
  const d = JSON.parse(readFileSync(join(ROOT, 'catalog/self/loop-demo.json'), 'utf8'));
  const by = (n: string) => d.demos.find((x: { demo: string }) => x.demo === n);
  it('ארבע ההדגמות עברו, בלי --quick (rebuild + vitest על העותק)', () => {
    expect(d.quick).toBe(false);
    expect(d.demos.map((x: { demo: string; ok: boolean }) => [x.demo, x.ok])).toEqual([['fix', true], ['speed', true], ['revert', true], ['refuse', true]]);
    for (const n of ['fix', 'speed']) {
      const a = by(n).row.attempts.find((x: { ok: boolean }) => x.ok);
      expect(a.checks.rebuild, n).toBe('ביט-זהה');
      expect(a.checks.vitest, n).toMatch(/^✓ Tests\s+\d+ passed/);
    }
  });
  it('החזרה: מה שזהה על קלטי-הקורא (fnvHexPoints ≡ fnvHex בלי אמוג׳י) נתפס ב-rebuild על העותק — והלולאה החזירה', () => {
    const r = by('revert').row;
    expect(r.decision).toBe('הוחזר');
    expect(r.attempts[0].cand).toBe('machine:catalog/self/parts.mjs#fnvHexPoints');
    expect(r.attempts[0].checks.outputs).toMatch(/^זהים/);
    expect(r.attempts[0].checks.rebuild).toMatch(/^✗ \d+ פלטים השתנו/);
    expect(by('revert').loopWrote).toBe(false);
  });
});

describe('SELF-LOOP · מטמון-«מנרמל» לפי טביעת-הקוד (הערת-המנהל על a57cc9c)', () => {
  it('מפתח-המטמון של blank נגזר מהקוד של lib/blank.mjs עצמו — לא מתג ידני (היה: "blank-v3" ⇒ שתי גרסאות-אלגוריתם חלקו מפתחות ⇒ שכפול טרי לא תאם לחותמות)', async () => {
    const { blankAlgoKey } = await import('../lib/blank.mjs');
    const { fingerprint } = await import('../lib/cache.mjs');
    const ts = (await import('typescript')).default;
    const src = readFileSync(join(ROOT, 'catalog/lib/blank.mjs'), 'utf8');
    expect(blankAlgoKey()).toBe(fingerprint('blank-algo', ts.version, src));
    expect(src).not.toMatch(/fingerprint\('blank-v\d/); // המוטנט: תג-גרסה ידני
    expect(fingerprint('blank-algo', ts.version, src + ' ')).not.toBe(blankAlgoKey()); // שינוי בקובץ ⇒ מפתח אחר
  });
});

describe('SELF-LOOP · שער השכפול-הטרי (catalog/self/fresh-gate.mjs)', () => {
  it.runIf(!!process.env.CATALOG_FULL)('worktree של HEAD + מטמון ריק ⇒ rebuild --check ✓ ו-git status נקי אחרי rebuild', async () => {
    const { freshGate } = await import('../self/fresh-gate.mjs');
    const r = freshGate({ log: () => {} });
    expect(r.dirty).toBe('');
    expect(r.checkOk).toBe(true);
  }, 1_800_000);
});
