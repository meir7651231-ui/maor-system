/**
 * ratchet — punchConfirm: אישור כפול לניקוב (P1.3, feature courses.punch.confirm).
 *
 * מקור האמת: legacy-main-script.js:330-342 (punch) — כשהאישור דלוק (בקובץ החי
 * punchConfirm=true): לחיצה ראשונה מזיינת את השיבוץ (confirmingId) עם timeout
 * ‏3000ms; לחיצה שנייה על אותו שיבוץ בתוך החלון מבצעת; לחיצה על שיבוץ אחר
 * מזיינת אותו במקומו. דגל כבוי = ביצוע מיידי (הכרעת משתמש #2: דגל, דלוק כברירת
 * מחדל). המכונה טהורה — הרכיבים (CourseDetail / AttendancePanel / כרטיס המשפחה)
 * רק מחזיקים את הזריון ואת ה-timeout הוויזואלי.
 */
import { describe, expect, it } from 'vitest';
import { punchConfirmStep, PUNCH_CONFIRM_MS } from '../lib';
import panelsSrc from '../../families/FamilyPanels.tsx?raw';
import courseSrc from '../CourseDetail.tsx?raw';
import attendSrc from '../../diary/AttendancePanel.tsx?raw';

const T0 = 1_000_000;

describe('🎫 ratchet — מכונת האישור הכפול (legacy:330-342)', () => {
  it('דגל כבוי → ביצוע מיידי בלי זריון', () => {
    expect(punchConfirmStep(false, null, 'e1', T0)).toEqual({ fire: true, next: null });
  });

  it('לחיצה ראשונה מזיינת (לא מבצעת); שנייה בתוך 3ש׳ מבצעת ומנקה', () => {
    const first = punchConfirmStep(true, null, 'e1', T0);
    expect(first.fire).toBe(false);
    expect(first.next).toEqual({ id: 'e1', armedAt: T0 });
    const second = punchConfirmStep(true, first.next, 'e1', T0 + 1500);
    expect(second).toEqual({ fire: true, next: null });
  });

  it('החלון הוא בדיוק 3000ms — על הגבול מבצע, אחריו מזיין מחדש', () => {
    const armed = { id: 'e1', armedAt: T0 };
    expect(punchConfirmStep(true, armed, 'e1', T0 + PUNCH_CONFIRM_MS).fire).toBe(true);
    const late = punchConfirmStep(true, armed, 'e1', T0 + PUNCH_CONFIRM_MS + 1);
    expect(late.fire).toBe(false);
    expect(late.next).toEqual({ id: 'e1', armedAt: T0 + PUNCH_CONFIRM_MS + 1 });
  });

  it('לחיצה על שיבוץ אחר בזמן זריון — מזיינת את האחר, לא מבצעת', () => {
    const armed = { id: 'e1', armedAt: T0 };
    const other = punchConfirmStep(true, armed, 'e2', T0 + 500);
    expect(other.fire).toBe(false);
    expect(other.next).toEqual({ id: 'e2', armedAt: T0 + 500 });
  });
});

describe('🛡 הגנות-מקור — האישור הכפול מחווט בכל שלוש נקודות הניקוב', () => {
  for (const [name, src] of [
    ['CourseDetail', courseSrc],
    ['FamilyPanels (כרטיס המשפחה)', panelsSrc],
    ['AttendancePanel (יומן)', attendSrc],
  ] as const) {
    it(name + ': punchConfirmStep מגודר בדגל courses.punch.confirm + תווית "לאשר ניקוב?"', () => {
      expect(src).toMatch(/featureOn\((?:cfg|config), 'courses\.punch\.confirm'\)/);
      expect(src).toMatch(/punchConfirmStep\(/);
      expect(src).toContain('לאשר ניקוב?');
    });
  }
});
