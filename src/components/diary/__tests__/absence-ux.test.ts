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
