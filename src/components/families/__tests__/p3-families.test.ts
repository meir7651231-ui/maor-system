/**
 * ratchet — שאריות משפחות/בית P3 (פריטים 7, 8, 9).
 * פריט 7: איפוס גורף של סימוני "טופל" (לגאסי careReset, 'הסימונים אופסו').
 * פריט 8: "איך משפרים?" — כללי הניקוד מילה-במילה מהלגאסי (markup:961).
 * פריט 9: אירועי הלוח של המשפחה נשזרים בציר הזמן, כולל ✓ בוצע.
 */
import { describe, expect, it } from 'vitest';
import { CRED_HELP_TEXT, famHistoryOf } from '../lib';
import panelsSrc from '../FamilyPanels.tsx?raw';
import widgetsSrc from '../../home/widgets.tsx?raw';
import { emptyDb, emptyFamily, type Db } from '../../../types/domain';

describe('👨‍👩‍👧 ratchet — P3 פריטי משפחות ובית', () => {
  it('פריט 8: כללי הניקוד מילה-במילה + הכפתור בפאנל', () => {
    expect(CRED_HELP_TEXT).toBe(
      'נוכחות +5 · דיוק +2 · פעולה קהילתית +15 · ביטול מוקדם 0 · ' +
        'ביטול מאוחר (‎<48ש׳) ‎-10 · No-Show ‎-20 · אי-פעילות ‎-2/יום · ' +
        'מוכפל ב-TrendFactor (0.8–1.2) לפי 3 הפעולות האחרונות',
    );
    expect(panelsSrc).toContain('איך משפרים?');
    expect(panelsSrc).toContain('CRED_HELP_TEXT');
  });

  it('פריט 9: אירוע לוח עם famId נשזר בציר הזמן, ✓ בוצע מסומן; של משפחה אחרת לא', () => {
    const fam = { ...emptyFamily(), id: 'f1', createdAt: '2025-01-01', name: 'כהן' };
    const db: Db = {
      ...emptyDb(),
      families: [fam],
      events: [
        { id: 'e1', title: 'אזכרה', date: '2026-01-15', time: '19:00', type: 'memorial', customType: '', notes: '', price: 0, roomId: '', famId: 'f1', priority: 'green', done: true },
        { id: 'e2', title: 'של אחרים', date: '2026-02-01', time: '', type: 'org', customType: '', notes: '', price: 0, roomId: '', famId: 'f2', priority: 'green', done: false },
      ],
    };
    const hist = famHistoryOf(db, fam);
    const evRow = hist.find((h) => h.tag === 'אירוע');
    expect(evRow?.text).toBe('אזכרה · 19:00 · ✓ בוצע');
    expect(hist.some((h) => h.text.includes('של אחרים'))).toBe(false);
  });

  it('פריט 7: איפוס גורף בווידג\'ט — שתי לחיצות + הטוסט מהלגאסי (הגנת-מקור)', () => {
    expect(widgetsSrc).toContain('איפוס סימוני טופל');
    expect(widgetsSrc).toContain("toast('הסימונים אופסו')");
    expect(widgetsSrc).toMatch(/attnDone: \{\}/);
    expect(widgetsSrc).toContain('resetArmed'); // דו-קליק, לא מחיקה בלחיצה אחת
  });
});
