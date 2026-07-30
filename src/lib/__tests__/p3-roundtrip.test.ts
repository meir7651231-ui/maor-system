/**
 * ratchet — ייצוא בפורמט הייבוא (P3 פריט 4; לגאסי exportImportFormat).
 * round-trip אמיתי: הקובץ שיורד נקלט חזרה בייבוא ומזוהה כעדכון לקיימות —
 * לא כמשפחות חדשות. תומכות: העמודות זהות ל-HEADERS של SupporterImport.
 */
import { describe, expect, it } from 'vitest';
import { familiesImportFormatRows, supportersImportFormatRows } from '../exportRows';
import { parseFamiliesCsv } from '../familiesImport';
import { emptyDb, emptyFamily, type Db } from '../../types/domain';
import importSrc from '../../components/supporters/SupporterImport.tsx?raw';

describe('🔁 ratchet — round-trip פורמט ייבוא (P3 פריט 4)', () => {
  it('משפחות: הייצוא נקלט חזרה כעדכון (0 חדשות) — אותן 13 עמודות', () => {
    const db: Db = {
      ...emptyDb(),
      families: [
        { ...emptyFamily(), id: 'f1', createdAt: '2025-01-01', name: 'כהן', mother: 'רבקה', phone: '050-1111111', city: 'ירושלים', address: 'הרצל 1', community: 'חסידי', notes: 'הערה' },
      ],
    };
    const rows = familiesImportFormatRows(db) as string[][];
    expect(rows[0]).toHaveLength(13);
    const plan = parseFamiliesCsv(rows, db.families);
    expect(plan.news).toHaveLength(0);
    expect(plan.upds).toHaveLength(1);
    expect(plan.upds[0].id).toBe('f1');
    expect(plan.upds[0].obj.city).toBe('ירושלים');
  });

  it('משפחה אלמנה מסומנת בעמודת הרמז ונקלטת כאלמן/ה', () => {
    const db: Db = {
      ...emptyDb(),
      families: [{ ...emptyFamily(), id: 'f1', createdAt: '2025-01-01', name: 'לוי', maritalStatus: 'אלמן/ה', phone: '050-2222222' }],
    };
    const rows = familiesImportFormatRows(db) as string[][];
    expect(rows[1][9]).toBe('אלמן');
    const plan = parseFamiliesCsv(rows, []);
    expect(plan.news[0].maritalStatus).toBe('אלמן/ה');
  });

  it('תומכות: הכותרות זהות בדיוק ל-HEADERS של הייבוא (הצלבה לפי שם)', () => {
    const rows = supportersImportFormatRows(emptyDb());
    expect(rows[0]).toEqual(['שם', 'טלפון', 'אימייל', 'ת"ז', 'כתובת', 'קטגוריה', 'עבור']);
    // הגנת-מקור: אותן עמודות מוגדרות בייבוא עצמו
    expect(importSrc).toContain("['שם', 'טלפון', 'אימייל', 'ת\"ז', 'כתובת', 'קטגוריה', 'עבור']");
  });
});
