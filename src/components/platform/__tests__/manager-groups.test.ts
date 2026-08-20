/**
 * ratchet · כרטיס-העובד באשף-המנהל (20.8, בקשת-בעלים "למה אין ❓ לעובדת"):
 * הבאג — צ'יפי-קבוצות-היכולות הוצגו כמזהי-מודול גולמיים באנגלית ('shell',
 * 'home'…), כך שמנהל שחיפש את "עזרה" (❓ — shell.guide) לא מצא אותה תחת שום
 * צ'יפ קריא. הנעילה: (1) לכל מודול של FEATURES יש מקטע-אשף עם תווית עברית —
 * אין מזהה-גולמי שיכול לדלוף; (2) ManagerPanel עובר דרך groupLabelOf + מסביר
 * את חוזה-ההגבלה-בלבד.
 */
import { describe, it, expect } from 'vitest';
import { FEATURES } from '../../../types/features';
import { WIZARD_SECTIONS } from '../../builder/sections';
import panelSrc from '../ManagerPanel.tsx?raw';

describe('כרטיס-עובד — קבוצות-יכולות קריאות', () => {
  it('לכל מודול ב-FEATURES יש מקטע-אשף עם תווית עברית (אין דליפת-מזהה)', () => {
    const sectionIds = new Set(WIZARD_SECTIONS.map((s) => s.id as string));
    const missing = [...new Set(FEATURES.map((f) => f.module as string))].filter((m) => !sectionIds.has(m));
    expect(missing).toEqual([]);
  });

  it('הגנת-מקור: הצ׳יפים עוברים דרך groupLabelOf + הסבר חוזה-ההגבלה', () => {
    expect(panelSrc).toContain('{groupLabelOf(g)}');
    expect(panelSrc).toContain("WIZARD_SECTIONS.find((s) => s.id === m)");
    expect(panelSrc).toContain('הגבלה בלבד');
  });
});
