/**
 * ratchet — סבב-חיווט (בקשת-בעלים):
 * 1. בורר-הלוח תומך בשעה: HebDateInput מעביר time/onTime ל-CalendarPicker,
 *    ו-EventModal מחווט את השעה (תאריך+שעה משולב).
 * 2. הטלפון בכרטיס-השיבוץ הוא קישור tel: (חיוג בלחיצה).
 * 3. כפתור "הצג כרטיס מלא" בכרטיס-השיבוץ → selectFamily(m.famId).
 * 4. תפריט-⋯ במסך-החיצוני של החוגים → מודאל הערות (c.description).
 */
import { describe, expect, it } from 'vitest';
import hebInputSrc from '../HebDateInput.tsx?raw';
import eventSrc from '../calendar/EventModal.tsx?raw';
import manageSrc from '../courses/ManageModal.tsx?raw';
import coursesSrc from '../courses/CoursesView.tsx?raw';

describe('🔌 ratchet — שעה בבורר + טלפון-חיוג + כרטיס-מלא + ⋯-הערות (בקשת-בעלים)', () => {
  it('בורר-הלוח תומך שעה, מחווט ב-EventModal', () => {
    // HebDateInput מעביר time/onTime לבורר כשמסופק onTime
    expect(hebInputSrc).toMatch(/props\.onTime \?[\s\S]{0,80}time: props\.time/);
    // EventModal מחווט תאריך+שעה לאותו שדה
    expect(eventSrc).toMatch(/time=\{f\.time\}[\s\S]{0,60}onTime=\{\(t\) => set\('time', t\)\}/);
  });

  it('הטלפון בכרטיס-השיבוץ = קישור tel: (חיוג)', () => {
    expect(manageSrc).toContain("'tel:' + p.replace(/[^\\d+]/g, '')");
    expect(manageSrc).toMatch(/href=\{b\.href\}/);
  });

  it('"הצג כרטיס מלא" → selectFamily(m.famId)', () => {
    expect(manageSrc).toContain('הצג כרטיס מלא');
    expect(manageSrc).toContain('selectFamily(m.famId)');
  });

  it('⋯ במסך-החיצוני של החוגים → מודאל הערות (description)', () => {
    expect(coursesSrc).toContain('setNotesCourse(c)');
    expect(coursesSrc).toContain('notesCourse.description');
    expect(coursesSrc).toMatch(/📝 הערות/);
  });
});
