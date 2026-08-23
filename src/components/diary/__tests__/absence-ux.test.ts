/**
 * ratchet — UX סבב-ה׳ (השלמות, 6.8.2026): איחוד חוויית שני מודאלי-החיסור.
 * 1. צ'יפי-הנימוק המשותפים (ABSENCE_REASON_CHIPS) — מקור-אמת אחד בשני המודאלים;
 *    קליק ממלא את השדה, ההקלדה החופשית נשארת (הצ'יפ לא מחליף את ה-TextInput).
 * 2. מיזוג-תורמים חמוש בשני שלבים ("לאשר מיזוג סופי?") — אותה רשת-ביטחון
 *    כמו DedupModal של המשפחות; קליק בודד לא ממזג.
 */
import { describe, expect, it } from 'vitest';
import { ABSENCE_REASON_CHIPS } from '../lib';
import courseSrc from '../../courses/AbsenceModal.tsx?raw';
import diarySrc from '../DiaryAbsenceModal.tsx?raw';
import supDedupSrc from '../../supporters/SupDedupModal.tsx?raw';
import attnPanelSrc from '../AttendancePanel.tsx?raw';

describe('📋 ratchet — צ׳יפי-נימוק משותפים לשני מודאלי-החיסור', () => {
  it('מקור-אמת אחד (diary/lib) ושני הצרכנים מייבאים ממנו', () => {
    expect(ABSENCE_REASON_CHIPS.length).toBeGreaterThanOrEqual(4);
    expect(ABSENCE_REASON_CHIPS).toContain('מחלה');
    expect(courseSrc).toContain('ABSENCE_REASON_CHIPS');
    expect(diarySrc).toContain('ABSENCE_REASON_CHIPS');
  });

  it('הצ׳יפ ממלא את השדה — TextInput החופשי נשאר בשני המודאלים', () => {
    for (const src of [courseSrc, diarySrc]) {
      expect(src).toContain('onClick={() => setReason(c)}');
      expect(src).toMatch(/TextInput value={reason} onChange={setReason}/);
    }
  });
});

describe('🔗 ratchet — מיזוג-תורמים חמוש בשני שלבים (כמו המשפחות)', () => {
  it('קליק ראשון חומש, שני ממזג; יש כפתור-ביטול', () => {
    expect(supDedupSrc).toMatch(/if \(armed !== gi\) \{\s*setArmed\(gi\);\s*return;/);
    expect(supDedupSrc).toContain("armed === gi ? 'לאשר מיזוג סופי?'");
    expect(supDedupSrc).toMatch(/armed === gi && <Btn sm onClick=\{\(\) => setArmed\(null\)\}>ביטול<\/Btn>/);
  });
});

describe('📅 ratchet — החיסור מהיומן נחתם על תאריך-המפגש הנצפה, לא על "היום"', () => {
  // הבאג: DiaryAbsenceModal כתב date: isoToday() בעוד הפאנל כולו (AttendancePanel)
  // ממוקד ב-props.date — תאריך-המפגש הנצפה (הנוכחות נרשמת עליו). רישום-חיסור-בדיעבד
  // ממסך של יום אחר נחת על "היום" ולא הופיע בדוח-היומי של המפגש עצמו.
  // שעון-הזכאות (48ש׳ עד המפגש הבא) לא שונה במעבר הזה.
  it('DiaryAbsenceModal: prop ‏date + החתמה עליו (isoToday רק כנפילה)', () => {
    expect(diarySrc).toContain('date?: string;');
    expect(diarySrc).toContain('date: props.date || isoToday(),');
  });
  it('AttendancePanel מזרים את תאריך-המפגש למודאל', () => {
    expect(attnPanelSrc).toContain('date={props.date}');
  });
  it('AbsenceModal (חוגים): prop ‏date אופציונלי לסימטריה — זרימות-"היום" נשארות ברירת-מחדל', () => {
    expect(courseSrc).toContain('date?: string;');
    expect(courseSrc).toContain('date: props.date || isoToday(),');
  });
});
