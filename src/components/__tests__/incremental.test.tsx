/**
 * ⚡ ratchet — ציור-מדורג + חיפוש-נדחה (VISION-LIGHT ‏#15+#4, 23.8.2026).
 *
 * הבאג: רשימות התורמים/המשפחות ציירו את כל השורות בבת-אחת — נמדד 23.7 שניות
 * רינדור / 57K צמתי-DOM על 3,000 תורמים בטאבלט; וכל תו-חיפוש הריץ סינון+מיון
 * מלאים בעדיפות-סינכרונית (ההקלדה "נתקעה"). התיקון: useIncCap/incSlice —
 * חלון-שגדל-בגלילה (סנטינל IntersectionObserver), ו-useDeferredValue על q.
 * החוזה: הלוגיקה (בחירה-מרובה/CSV/סיכומים/מונים) נשארת על הרשימה המלאה.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { incSlice, INC_CHUNK } from '../incremental';

describe('⚡ ציור-מדורג — incSlice', () => {
  it('רשימה קצרה מהחלון חוזרת כמו-שהיא (אותה רפרנס — אפס עבודה)', () => {
    const l = [1, 2, 3];
    expect(incSlice(l, 120)).toBe(l);
  });

  it('רשימה ארוכה נחתכת לחלון; INC_CHUNK = מסך-וחצי', () => {
    const l = Array.from({ length: 500 }, (_, i) => i);
    const s = incSlice(l, INC_CHUNK);
    expect(s).toHaveLength(INC_CHUNK);
    expect(s[0]).toBe(0);
    expect(INC_CHUNK).toBeGreaterThanOrEqual(60); // חלון קטן-מדי = הבהוב-טעינה מורגש
  });
});

describe('🔒 הגנת-מקור — החיווט בתורמים ובמשפחות', () => {
  const sup = readFileSync('src/components/supporters/SupportersView.tsx', 'utf8');
  const fam = readFileSync('src/components/families/FamiliesView.tsx', 'utf8');

  it('התורמים: הציור על החלון, הלוגיקה על הרשימה המלאה, חיפוש-נדחה', () => {
    expect(sup).toContain('const dq = useDeferredValue(q)');
    expect(sup).toContain('const shownRows = incSlice(list, inc.cap)');
    // שני המשטחים (גריד+טבלה) מציירים מהחלון
    expect(sup).toContain('{shownRows.map((sp) => {');
    expect(sup).toContain('{shownRows.map((sp) => (');
    // סנטינלים בשני המשטחים — עם total מהרשימה המלאה
    expect(sup).toContain('<IncMoreCard shown={shownRows.length} total={list.length}');
    expect(sup).toContain('<IncMoreRow shown={shownRows.length} total={list.length}');
    // אפס-אובדן-יכולת: בחר-הכול נשאר על הרשימה המלאה (לא על החלון!)
    expect(sup).toContain('setSelSet(new Set(list.map((sp) => sp.id)))');
    // הסינון עצמו רץ על הערך-הנדחה — ההקלדה לא חוסמת
    expect(sup).toContain('const nq = normSearch(dq)');
    expect(sup).toContain("if (!dq.trim()) return true;");
  });

  it('המשפחות: אותו חוזה — חלון-ציור + חיפוש-נדחה + לוגיקה-מלאה', () => {
    expect(fam).toContain('const dq = useDeferredValue(q)');
    expect(fam).toContain('const shownFams = incSlice(filtered, inc.cap)');
    expect(fam).toContain('{shownFams.map((f) => {');
    expect(fam).toContain('<IncMoreCard shown={shownFams.length} total={filtered.length}');
    expect(fam).toContain('<IncMoreRow shown={shownFams.length} total={filtered.length}');
    // החיפוש-החכם רץ על dq; מונה-הילדים בכותרת נשאר על filtered המלאה
    expect(fam).toContain('smartFilter(dq, prefiltered');
    expect(fam).toContain('const totalKids = filtered.reduce');
  });

  it('הסנטינל מתמחזר בכל צמיחה (key על shown) — גלילה מהירה לא נתקעת', () => {
    const inc = readFileSync('src/components/incremental.tsx', 'utf8');
    expect(inc).toContain("key={'inc' + props.shown}");
    expect(inc).toContain("rootMargin: '600px'");
    // בלי IntersectionObserver (סביבת-בדיקה ישנה) — פשוט אין הרחבה, אין קריסה
    expect(inc).toContain("typeof IntersectionObserver === 'undefined'");
  });
});
