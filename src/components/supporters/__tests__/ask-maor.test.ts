/**
 * 🤖 ratchet — "שאל את מאור" (VISION-LIGHT ‏#30, 23.8.2026).
 *
 * פרשן-כוונות אופליין ודטרמיניסטי מעל המנועים הטהורים — שום נתון לא עוזב
 * את המכשיר, קריאה-בלבד מוחלט (התשובות מנווטות, לעולם לא רושמות כסף).
 * שאלה לא-מזוהה ⇒ null (הממשק מציג דוגמאות — לא מנחש).
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { askMaor, ASK_EXAMPLES } from '../askMaor';
import { emptyDb } from '../../../types/domain';
import type { Db, Supporter } from '../../../types/domain';

const TODAY = '2026-08-23';

function withSup(...sups: Partial<Supporter>[]): Db {
  const db = emptyDb();
  for (const [i, s] of sups.entries()) {
    db.supporters.push({
      id: 's' + i, name: 'תורם' + i, phone: '', email: '', address: '', idNum: '', cat: '', forWho: '', notes: '',
      count: 0, ils: 0, usd: 0, first: '', last: '', nextDate: '', donations: [],
      ...s,
    } as Supporter);
  }
  return db;
}

describe('🤖 שאל-את-מאור — הפרשן', () => {
  it('"מי לא תרם השנה" — נותני-עבר בלבד, ממוין לפי סה"כ, קטום עם total', () => {
    // supIls נשען על מונה-הקבלות השמור (ils) + hist — הפיקסצ'רים מזינים גם אותו
    const db = withSup(
      { name: 'ותיק', ils: 500, count: 1, last: '2024-05-01', donations: [{ rid: 'D1', date: '2024-05-01', amount: 500, cur: '₪', cat: '', method: '' }] as never },
      { name: 'טרי', ils: 100, count: 1, last: '2026-02-01', donations: [{ rid: 'D2', date: '2026-02-01', amount: 100, cur: '₪', cat: '', method: '' }] as never },
      { name: 'ריק' }, // בלי-נתינה-מעולם — לא נספר (אין ממה "להפסיק")
    );
    const a = askMaor('מי לא תרם השנה?', db, TODAY, 3.7)!;
    expect(a.title).toContain('1');
    expect(a.lines[0]).toContain('ותיק');
    expect(a.lines.join()).not.toContain('טרי');
    expect(a.lines.join()).not.toContain('ריק');
    expect(a.view).toBe('supporters');
  });

  it('"כמה תרמו השנה/החודש" — סכום שקלי (דולר לפי השער), נדחים מוחרגים', () => {
    const db = withSup({
      donations: [{ rid: 'D1', date: '2026-08-01', amount: 100, cur: '₪', cat: '', method: '' }] as never,
      hist: [
        { d: '2026-08-10', a: 100, c: '$', status: 'אושר' },
        { d: '2026-08-11', a: 999, c: '₪', status: 'נדחה' },
      ] as never,
    });
    const a = askMaor('כמה תרמו החודש?', db, TODAY, 4)!;
    expect(a.title).toContain('₪500'); // 100 + 100$×4
    const y = askMaor('כמה תרמו השנה?', db, TODAY, 4)!;
    expect(y.title).toContain('2026');
  });

  it('"מי התורמים הגדולים" ממוין יורד; "כמה תורמים יש" סופר', () => {
    const db = withSup(
      { name: 'קטן', ils: 10, donations: [{ rid: 'D1', date: '2024-01-01', amount: 10, cur: '₪', cat: '', method: '' }] as never },
      { name: 'גדול', ils: 1000, donations: [{ rid: 'D2', date: '2024-01-01', amount: 1000, cur: '₪', cat: '', method: '' }] as never },
    );
    const top = askMaor('מי התורמים הגדולים?', db, TODAY, 3.7)!;
    expect(top.lines[0]).toContain('גדול');
    const cnt = askMaor('כמה תורמים יש?', db, TODAY, 3.7)!;
    expect(cnt.lines[0]).toContain('2');
  });

  it('שאלה לא-מזוהה ⇒ null (לא מנחשים); ריק ⇒ null; יש דוגמאות לכל כוונה', () => {
    const db = withSup();
    expect(askMaor('מה מזג האוויר?', db, TODAY, 3.7)).toBeNull();
    expect(askMaor('   ', db, TODAY, 3.7)).toBeNull();
    // כל דוגמה שמוצגת למשתמש חייבת באמת להחזיר תשובה (לא null מביך)
    for (const ex of ASK_EXAMPLES) {
      expect(askMaor(ex, db, TODAY, 3.7), 'הדוגמה "' + ex + '" לא מזוהה').not.toBeNull();
    }
  });

  it('🔒 קריאה-בלבד + opt-in: אין כתיבה במנוע/מודאל; הכפתור מגודר === true', () => {
    const engine = readFileSync('src/components/supporters/askMaor.ts', 'utf8');
    expect(engine).not.toMatch(/setDb|addDonation|addPayment|Date\.now\(/);
    const modal = readFileSync('src/components/AskMaor.tsx', 'utf8');
    expect(modal).not.toMatch(/setDb|addDonation|fetch\(/);
    const app = readFileSync('src/App.tsx', 'utf8');
    expect(app).toContain("config.features?.['shell.askmaor'] === true");
    expect(app).toContain('askOpen && askMaorOn &&');
    // עצל — לא חוזר לבנדל הראשי
    expect(app).toMatch(/AskMaorModal = lazy\(/);
  });
});
