/**
 * ratchet — כותרת כרטיס-החוג לא נמעכת (ממצא-נחיל 23.8, ערכת-הבעלים קהילה):
 * שורת-הכותרת הייתה flex יחיד עם צביר 7 כפתורי-פעולה בלי הגבלת-רוחב ⇒ הכפתורים
 * בלעו את הרוחב ושם-החוג נדחס לעמודה צרה שגלשה מילה-בכל-שורה. התיקון: השורה
 * עוטפת (flexWrap) וגוש-הכותרת שומר רוחב-מינימום (flex:1 1 240px) ⇒ הכפתורים
 * יורדים לשורה שנייה במקום למעוך את הכותרת.
 */
import { describe, expect, it } from 'vitest';
import src from '../CourseDetail.tsx?raw';

describe('🎨 ratchet — כותרת כרטיס-החוג שומרת רוחב (אפס מעיכה)', () => {
  it('שורת-הכותרת עוטפת + גוש-הכותרת עם flex-basis (הכפתורים לא מועכים את השם)', () => {
    expect(src).toContain("gap: 15, marginBottom: 14, flexWrap: 'wrap'");
    expect(src).toContain("flex: '1 1 240px', minWidth: 200");
  });
});
