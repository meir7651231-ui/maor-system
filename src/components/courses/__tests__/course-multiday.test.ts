/**
 * ratchet — 📅 בחירת ימים-מרובים לחוג (19.8, בקשת-בעלים פריט ה': "מורה
 * שבאה בכמה ימים, לא ביום קבוע אחד"). הטופס בונה מפגש (session) ליום נבחר;
 * המודל, היומן והנוכחות כבר עוברים על sessionsOf — לכן זו שינוי-טופס בלבד.
 * weekday = היום הראשון (fallback + תאימות-לאחור). שומר label של מפגש-קיים.
 */
import { describe, expect, it } from 'vitest';
import formSrc from '../CourseForm.tsx?raw';

describe('📅 ratchet — ימים-מרובים לחוג', () => {
  it('מצב-הטופס כולל days: number[]; init עורך גוזר ימים מ-sessions', () => {
    expect(formSrc).toMatch(/days:\s*number\[\]/);
    expect(formSrc).toMatch(/days:\s*course\.sessions\?\.length[\s\S]{0,120}new Set\(course\.sessions\.map/);
  });

  it('בורר-ימים מרובה: לחיצה מוסיפה/מסירה יום', () => {
    expect(formSrc).toContain('ימי מפגש');
    expect(formSrc).toMatch(/days: on \? f\.days\.filter\(\(x\) => x !== i\) : \[\.\.\.f\.days, i\]/);
  });

  it('שמירה: מפגש ליום נבחר, weekday=הראשון, שומר label קיים; לפחות יום אחד', () => {
    expect(formSrc).toContain('const weekday = selDays[0]');
    expect(formSrc).toContain('בחרו לפחות יום מפגש אחד');
    expect(formSrc).toMatch(/selDays\.map\(\(day\) => \{[\s\S]{0,200}prev \? \{ \.\.\.prev, day, time \}/);
  });
});
