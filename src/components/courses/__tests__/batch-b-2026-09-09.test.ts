/**
 * ratchet — בקשות-בעלים 9.9 (חבילה ב׳ · חוגים):
 * (3) סינון חוגים לפי יום-בשבוע · (5) סינון לפי מורה כמו שאר הסינון ·
 * (6) מצב-משפחתי ליד כל משובץ/ת ("אין" כשריק) · (7) שמירה-אחת בניהול-שיבוץ (הכפתור ליד ההערה ירד).
 * הגנות-מקור — הרכיבים הם JSX; ההיגיון עצמו נבדק בסמוק e2e/courses-filters-smoke.mjs.
 */
import { describe, expect, it } from 'vitest';
import viewSrc from '../CoursesView.tsx?raw';
import detailSrc from '../CourseDetail.tsx?raw';
import manageSrc from '../ManageModal.tsx?raw';

describe('(3)+(5) סינון יום/מורה במסך-החוגים', () => {
  it('בוררים + סינון ב-shown + תלויות-memo', () => {
    expect(viewSrc).toContain('ariaLabel="יום"');
    expect(viewSrc).toContain("if (dayF !== 'all' && !c.sessions.some((x) => x.day === dayF)) return false;");
    expect(viewSrc).toContain("if (teacherF !== 'all' && c.teacherId !== teacherF) return false;");
    expect(viewSrc).toContain('db, q, cat, sem, dayF, teacherF, colF');
    expect(viewSrc).toContain("db.teachers.map((t) => ({ value: t.id, label: t.name }))");
    // 0=ראשון … 5=שישי — כמו Weekday (אין שבת)
    expect(viewSrc).toContain("[[0, 'ראשון'], [1, 'שני'], [2, 'שלישי'], [3, 'רביעי'], [4, 'חמישי'], [5, 'שישי']]");
  });
});

describe('(6) מצב-משפחתי בטבלת-המשובצים', () => {
  it('עמודה אחרי משפחה; ריק ⇒ "אין"; בלי חבר ⇒ —', () => {
    expect(detailSrc).toContain('<th>מצב משפחתי</th>');
    expect(detailSrc.indexOf('<th>מצב משפחתי</th>')).toBeGreaterThan(detailSrc.indexOf("<th>{termOf(cfg, 'entity.family', 'משפחה')}</th>"));
    expect(detailSrc).toContain("<td>{m ? maritalByFam.get(m.famId) || 'אין' : '—'}</td>");
    expect(detailSrc).toContain("new Map(db.families.map((f) => [f.id, (f.maritalStatus || '').trim()]))");
  });
});

describe('(7) שמירה-אחת בניהול-שיבוץ', () => {
  it('אין כפתור-שמירה ליד ההערה; הכפתור התחתון שומר-וסוגר רק אם ההערה השתנתה', () => {
    expect(manageSrc).not.toMatch(/placeholder="לדוגמה: רגישות[^]*?<Btn[^]*?שמירה\s*<\/Btn>/);
    expect(manageSrc).toContain('💾 שמירה וסגירה');
    expect(manageSrc).toContain("if (note.trim() !== (en.note ?? '').trim()) {");
    expect((manageSrc.match(/upsertEnrollment\(\{ \.\.\.en, note: note\.trim\(\) \}\)/g) || []).length).toBe(1);
  });
});
