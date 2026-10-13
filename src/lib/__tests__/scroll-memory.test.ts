/**
 * ratchet — זיכרון-גלילה (בקשת-בעלים 5.9): חזרה מכרטיס/ממסך למיקום הקודם, לא לראש העמוד.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { _resetScrollMemory, forgetScroll, recallScroll, rememberScroll } from '../scrollMemory';

const src = (p: string) => readFileSync(new URL(p, import.meta.url), 'utf8');

describe('scrollMemory — ליבה טהורה', () => {
  it('שומר/מחזיר/שוכח; מעגל ומקצץ לאפס', () => {
    _resetScrollMemory();
    expect(recallScroll('x')).toBeUndefined();
    rememberScroll('x', 412.6);
    expect(recallScroll('x')).toBe(413);
    rememberScroll('x', -5);
    expect(recallScroll('x')).toBe(0);
    forgetScroll('x');
    expect(recallScroll('x')).toBeUndefined();
  });
});

describe('חיווט — שלוש הרשימות + ↩ חזרה בין מסכים', () => {
  it('SupportersView/FamiliesView/CoursesView קוראים ל-useListScrollRestore לפני כל return מוקדם', () => {
    for (const [p, key, flag] of [
      ['../../components/supporters/SupportersView.tsx', 'supporters', '!!selId'],
      ['../../components/families/FamiliesView.tsx', 'families', '!!selFamilyId'],
      ['../../components/courses/CoursesView.tsx', 'courses', '!!selCourseId'],
    ] as const) {
      const s = src(p);
      // סדר-ה-hooks נבדק ע"י hooks-order-guard.test.ts (React #300); כאן רק החיווט.
      expect(s.indexOf(`useListScrollRestore('${key}', ${flag});`), p).toBeGreaterThan(0);
    }
  });
  it('App מפעיל useViewScrollMemory(view) ומשחזר בשתי מסגרות', () => {
    expect(src('../../App.tsx')).toContain('useViewScrollMemory(view);');
    expect(src('../scrollMemory.ts')).toContain('requestAnimationFrame(() => requestAnimationFrame(');
  });
});
