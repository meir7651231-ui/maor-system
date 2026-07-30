/**
 * ratchet — הלוח הייעודי והראווה (חנות 7). הגנת-מקור בידוד: CalendarTab
 * קורא db.shopEvents בלבד — אין upsertEvent/db.events; הצבעים מיובאים
 * מ-calLib; ShowcaseTab בלי hash ובלי לוח מובילים (אין גיימיפיקציה —
 * הכרעת בעלים 8).
 */
import { describe, expect, it } from 'vitest';
import calSrc from '../CalendarTab.tsx?raw';
import modalSrc from '../ShopEventModal.tsx?raw';
import showSrc from '../ShowcaseTab.tsx?raw';

describe('🛍 ratchet — חנות 7: הלוח הייעודי והראווה', () => {
  it('🛡 בידוד: אין upsertEvent/db.events; רק shopEvents', () => {
    expect(calSrc).not.toContain('upsertEvent');
    expect(calSrc).not.toContain('db.events');
    expect(calSrc).toContain('s.db.shopEvents');
    expect(modalSrc).toContain('upsertShopEvent');
    expect(modalSrc).not.toMatch(/\bupsertEvent\b/);
  });

  it('נפתח בעברי + צבעי calLib (לא שכפול) + צ׳יפ מתנות ממתינות בתאי חג', () => {
    expect(calSrc).toContain('useState(true)'); // heb ברירת מחדל
    expect(calSrc).toContain("from '../calendar/calLib'");
    expect(calSrc).toContain('SESSION_META');
    expect(calSrc).toContain('PRIORITY_COLOR');
    // מאז UX סינון 2 הלוח מסונן-סוגים לפני הבנייה (טהור) — shownEvents
    expect(calSrc).toContain('buildMonthGrid(shownEvents');
    expect(calSrc).toContain('ממתינות');
  });

  it('ShowcaseTab: overlay פנימי בלי hash, בלי לוח מובילים (הכרעה 8)', () => {
    expect(showSrc).not.toContain('location.hash');
    expect(showSrc).not.toContain('leaderboard');
    expect(showSrc).toContain('Escape');
    expect(showSrc).toContain('🖥 מסך מלא');
  });
});
