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
