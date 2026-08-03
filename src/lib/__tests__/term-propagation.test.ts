/**
 * ratchet — הכרעת בעלים "שהמונח ישתנה לכל אורך הדרך": מודולי-ההגדרות של חדרים
 * ומורים תייגו הכול קשיח ("חדר"/"מורה") ולכן שינוי-מונח באשף לא הגיע אליהם. אחרי
 * התיקון הם עוברים דרך termOf. הגנת-מקור: הכותרות/כפתורים כבר לא מחרוזות-קשיחות,
 * וה-termOf של המפתחות קיים. סטייה חזרה למחרוזת קשיחה תשבור את הבדיקה.
 */
import { describe, it, expect } from 'vitest';
import roomsSrc from '../../components/settings/RoomsSection.tsx?raw';
import teachersSrc from '../../components/settings/TeachersSection.tsx?raw';
import attendSrc from '../../components/diary/AttendancePanel.tsx?raw';
import wheelSrc from '../../components/wheel/CourseWheel.tsx?raw';

describe('✓ ratchet — מונחים עוברים דרך termOf (לכל אורך הדרך)', () => {
  it('RoomsSection מתייג חדר/חדרים דרך termOf — לא כותרת קשיחה', () => {
    expect(roomsSrc).toContain("termOf(config, 'entity.room'");
    expect(roomsSrc).toContain("termOf(config, 'entity.rooms'");
    expect(roomsSrc).not.toContain('title="🚪 חדרים"'); // הכותרת הקשיחה הישנה
    expect(roomsSrc).not.toContain('+ חדר חדש'); // הכפתור הקשיח הישן
  });

  it('TeachersSection מתייג מורה דרך termOf — לא כותרת קשיחה', () => {
    expect(teachersSrc).toContain("termOf(config, 'entity.teacher'");
    expect(teachersSrc).not.toContain('title="👩‍🏫 מורים"');
  });

  it('AttendancePanel מתייג תלמיד/ה דרך termOf (כותרת הטבלה)', () => {
    expect(attendSrc).toContain("termOf(config, 'entity.student'");
    expect(attendSrc).not.toContain('<th>תלמיד/ה</th>');
  });

  it('CourseWheel מתייג חוג/חוגים דרך termOf', () => {
    expect(wheelSrc).toContain("termOf(config, 'entity.course'");
    expect(wheelSrc).not.toContain('🎡 גלגל החוגים</h2>'); // הכותרת הקשיחה הישנה
  });
});
