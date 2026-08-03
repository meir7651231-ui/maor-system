/**
 * ratchet — ANALYSIS low: "4 (בפועל 6) מימושי normName לא כבולים בבדיקה". כל
 * מסלולי-ההתאמה (dedup תומכות/משפחות/עי"ן/ייבוא/קורסים) מנרמלים שם באותה נוסחה
 * בדיוק — `normSearch(s).replace(/\s/g, '')`. אם אחד יסטה, שם יתאים במסלול אחד
 * ולא באחר (כפילויות שקטות / דילוגים). הבדיקה כובלת את כולם: התנהגותית לשלושת
 * המיוצאים, והגנת-מקור לכל ששת המימושים.
 */
import { describe, it, expect } from 'vitest';
import { normName as nnValidate, normSearch } from '../validate';
import { normName as nnSupporters } from '../../components/supporters/lib';
import { normName as nnAyin } from '../ayin';

// הגנות-מקור על המימושים המקומיים (לא-מיוצאים) — הגוף חייב להישאר זהה.
import supportersSrc from '../../components/supporters/lib.ts?raw';
import importSectionSrc from '../../components/settings/ImportSection.tsx?raw';
import coursesSrc from '../../components/courses/lib.ts?raw';
import familiesImportSrc from '../familiesImport.ts?raw';
import validateSrc from '../validate.ts?raw';
import ayinSrc from '../ayin.ts?raw';

const SAMPLES = ['משפחת כהן', 'כ"ץ', "לוי ", '  אברהם   בן דוד ', 'Cohen', 'or rishon', 'א ב ג', ''];

describe('✓ ratchet — עקביות normName בין כל מסלולי-ההתאמה', () => {
  it('שלושת המיוצאים מסכימים זה עם זה ועם הנוסחה normSearch+הסרת-רווחים', () => {
    for (const s of SAMPLES) {
      const expected = normSearch(s).replace(/\s/g, '');
      expect(nnValidate(s)).toBe(expected);
      expect(nnSupporters(s)).toBe(expected);
      expect(nnAyin(s)).toBe(expected);
    }
  });

  it('כל ששת המימושים משתמשים בגוף הזהה normSearch(...).replace(/\\s/g, "")', () => {
    const BODY = /normSearch\([^)]*\)\.replace\(\/\\s\/g, ''\)/;
    for (const [name, src] of [
      ['supporters/lib', supportersSrc],
      ['settings/ImportSection', importSectionSrc],
      ['courses/lib', coursesSrc],
      ['familiesImport', familiesImportSrc],
      ['validate', validateSrc],
      ['ayin', ayinSrc],
    ] as const) {
      expect(BODY.test(src), name + ' — גוף normName סטה מהנוסחה המשותפת').toBe(true);
    }
  });
});
