/**
 * ratchet — 🔙 כפתור-חזרה מרחף קבוע בתחתית כל מסכי-הכרטיס (19.8, בקשת-בעלים
 * "כפתור מרחף למטה — לא צריך לגלול חזרה למעלה כדי לחזור"). רכיב משותף
 * `StickyBackBar` (ui.tsx, position:sticky bottom) מוטמע בכרטיס משפחה/חוג/תורם.
 */
import { describe, expect, it } from 'vitest';
import uiSrc from '../ui.tsx?raw';
import famSrc from '../families/FamilyDetail.tsx?raw';
import crsSrc from '../courses/CourseDetail.tsx?raw';
import supSrc from '../supporters/SupporterDetail.tsx?raw';

describe('🔙 ratchet — StickyBackBar מרחף בתחתית', () => {
  it('הרכיב המשותף קיים עם sticky bottom', () => {
    expect(uiSrc).toContain('export function StickyBackBar');
    expect(uiSrc).toMatch(/position: 'sticky',\s*bottom: 0/);
  });

  it('שלושת מסכי-הכרטיס משתמשים בו', () => {
    expect(famSrc).toContain('<StickyBackBar onBack={() => selectFamily(null)}');
    expect(crsSrc).toContain('<StickyBackBar onBack={() => selectCourse(null)}');
    expect(supSrc).toContain('<StickyBackBar onBack={props.onBack}');
  });
});
