/**
 * ratchet — נחיל-עמוק אשכול C (13.8): אובדן-נתונים + קריסות.
 *  · #8  ayinDailyRows/מסך-התורמים קרסו על ayin חלקי (חסר log) — עתה ממוזג emptyAyin.
 *  · #9  restoreDb/resetAll עקפו את דגל dirty ⇒ שער ריבוי-הטאבים דרס שחזור/איפוס טרי.
 *  · #11 scheduleSave ניקה dirty אחרי await גם כשעריכה חדשה נכנסה תוך-כדי.
 */
import { describe, expect, it } from 'vitest';
import type { Supporter } from '../../types/domain';
import { ayinDailyRows } from '../../lib/ayin';
import { DEFAULT_CONFIG } from '../../types/config';
import useAppSrc from '../useApp.ts?raw';

describe('#8 — ayinDailyRows לא קורס על ayin חלקי (חסר log/names/answers)', () => {
  it('תומך עם ayin.lastTouch=היום אך בלי log → שורה נבנית בלי לזרוק', () => {
    const today = '2026-08-13';
    const sup = {
      id: 'sp1', name: 'כהן', phone: '0500000000',
      donations: [],
      ayin: { stage: 'new', lastTouch: today }, // ayin חלקי — בלי log/names/answers
    } as unknown as Supporter;
    expect(() => ayinDailyRows(DEFAULT_CONFIG, [sup], today)).not.toThrow();
    const rows = ayinDailyRows(DEFAULT_CONFIG, [sup], today);
    expect(rows.length).toBe(2); // כותרת + שורת-התומך
    expect(rows[1][0]).toBe('כהן');
  });
});

describe('#9/#11 — הגנת-מקור על סימון-dirty', () => {
  it('restoreDb ו-resetAll מסמנים dirty=true אחרי set', () => {
    // שני המופעים: אחד ב-restoreDb ואחד ב-resetAll
    // ביקורת-עומק 2.9: ה-set עוטף ב-withRemovalTombstones (מצבות למחיקות-שחזור) — הסימון נשאר מיד אחריו
    const marks = useAppSrc.match(/set\(\{ db: withRemovalTombstones\(prev, db\) \}\);[^\n]*\n\s*dirty = true;/g) ?? [];
    expect(marks.length).toBeGreaterThanOrEqual(2);
  });

  it('scheduleSave מנקה dirty רק אם ה-db לא השתנה תוך-כדי (השוואת-הפניה)', () => {
    expect(useAppSrc).toContain('const saving = get().db;');
    expect(useAppSrc).toContain('if (ok && get().db === saving) dirty = false;');
  });
});
