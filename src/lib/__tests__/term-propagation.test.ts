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
import wallSrc from '../../components/wall/ImpactWall.tsx?raw';
import { buildWallData } from '../../components/wall/wallData';
import { emptyDb } from '../../types/domain';
import { DEFAULT_CONFIG } from '../../types/config';

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

  it('ImpactWall מעביר config ל-buildWallData ומתייג דרך termOf (הקיר הציבורי)', () => {
    expect(wallSrc).toContain('buildWallData(db, now, config)');
    expect(wallSrc).toContain("termOf(config, 'nav.families'");
    // הקיר כבר לא נועל את "המשפחות" ואת שורת-הפעימה כמחרוזת קשיחה
    expect(wallSrc).not.toContain('שיבוצים, תשלומים ותרומות — מדד משוקלל');
  });

  it('buildWallData(config) — שינוי-מונח מגיע לתוויות ה-KPI ולטיקר', () => {
    const db = emptyDb();
    const cfg = {
      ...DEFAULT_CONFIG,
      terms: { 'nav.families': 'לקוחות', 'nav.courses': 'סדנאות', 'entity.enrollments': 'רישומים' },
    };
    const data = buildWallData(db, new Date('2026-08-03T12:00:00'), cfg);
    const labels = [...data.kpisRight, ...data.kpisLeft].map((k) => k.label).join(' | ');
    expect(labels).toContain('לקוחות'); // "לקוחות בליווי קבוע" (היה "משפחות")
    expect(labels).toContain('סדנאות'); // "ילדים וילדות בסדנאות" (היה "בחוגים")
    // ובלי config — נופל למונחי ברירת-המחדל (התנהגות היום, ביט-זהה)
    const def = buildWallData(db, new Date('2026-08-03T12:00:00'));
    expect(def.kpisRight[0].label).toBe('משפחות בליווי קבוע');
  });
});
