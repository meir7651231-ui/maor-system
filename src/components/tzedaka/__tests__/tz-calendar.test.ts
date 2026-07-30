/**
 * ratchet — הלוח הייעודי (קופות 6). הגנת-מקור בידוד: CalendarTab קורא
 * db.tzEvents בלבד — אין upsertEvent/db.events; הצבעים מיובאים מ-calLib.
 */
import { describe, expect, it } from 'vitest';
import calSrc from '../CalendarTab.tsx?raw';
import modalSrc from '../TzEventModal.tsx?raw';

describe('🪙 ratchet — קופות 6: הלוח הייעודי', () => {
  it('🛡 בידוד: אין upsertEvent/db.events; רק tzEvents', () => {
    expect(calSrc).not.toContain('upsertEvent');
    expect(calSrc).not.toContain('db.events');
    expect(calSrc).toContain('s.db.tzEvents');
    expect(modalSrc).toContain('upsertTzEvent');
    expect(modalSrc).not.toMatch(/\bupsertEvent\b/);
  });

  it('נפתח בעברי + צבעי calLib (לא שכפול)', () => {
    expect(calSrc).toContain('useState(true)'); // heb ברירת מחדל
    expect(calSrc).toContain("from '../calendar/calLib'");
    expect(calSrc).toContain('SESSION_META');
    expect(calSrc).toContain('PRIORITY_COLOR');
  });
});
