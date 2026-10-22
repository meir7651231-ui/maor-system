import { describe, expect, it } from 'vitest';
import { ORBIT_OWNER_WHATSAPP, countNewSince, latestAt, leadNotesWithStore, leadOwnerText, ownerWaLink, parseStoreParams, signupOwnerText } from './signupNotify';

describe('signupNotify — הודעת-בעלים בוואטסאפ + הקשר-חנות (22.10)', () => {
  it('פרמטרי-החנות: רק עם signup=1; מזהים לא-בטוחים נזרקים, כפולים מאוחדים', () => {
    expect(parseStoreParams('?v=shop')).toBeNull();
    expect(parseStoreParams('?signup=1&v=shop&picks=12,34,12,<x>,')).toEqual({ vertical: 'shop', picks: ['12', '34'] });
    expect(parseStoreParams('?signup=1&v=a%20b')).toEqual({});
    const many = Array.from({ length: 50 }, (_, i) => String(i)).join(',');
    expect(parseStoreParams('?signup=1&picks=' + many)?.picks).toHaveLength(30);
  });

  it('נוסח-ההרשמה כולל את כל הפרטים ובחירות-החנות', () => {
    const t = signupOwnerText({
      orgName: ' בוטיק לדוגמה ',
      contactName: 'ישראל ישראלי',
      phone: '050-0000000',
      email: 'a@b.co',
      industry: 'shop',
      needs: [],
      store: { picks: ['12', '34'] },
    });
    expect(t).toContain('ארגון: בוטיק לדוגמה');
    expect(t).toContain('טלפון: 050-0000000');
    expect(t).toContain('נבחר בחנות: 12, 34');
    expect(t).not.toContain('חשוב לנו');
  });

  it('קישור wa.me למספר-הבעלים; בלי מספר ⇒ null (אין כפתור — ביט-זהה להיום)', () => {
    const t = leadOwnerText({ contactName: 'דנה', phone: '050-0000000', preferredTime: 'ערב', notes: '' });
    expect(ownerWaLink(t, '')).toBeNull();
    const href = ownerWaLink(t, '050-0000000');
    expect(href).toMatch(/^https:\/\/wa\.me\/972500000000\?text=/);
    expect(decodeURIComponent(href!.split('text=')[1])).toContain('נוח לי: בערב');
  });

  it('הקשר-החנות נכנס ל-notes של הליד (Rules: 5 שדות, ≤500 תווים)', () => {
    expect(leadNotesWithStore(' שלום ', null)).toBe('שלום');
    expect(leadNotesWithStore('', { picks: ['12'] })).toBe('🛒 מהחנות · נבחר: 12');
    expect(leadNotesWithStore('x'.repeat(600), { picks: ['1'] }).length).toBe(500);
  });

  it('מספר-הבעלים ברירת-מחדל ⇒ wa.me תקין', () => {
    expect(ownerWaLink('שלום', ORBIT_OWNER_WHATSAPP)).toMatch(/^https:\/\/wa\.me\/972555043749\?text=/);
  });

  it('ספירת חדשים מאז הצפייה + חותמת אחרונה', () => {
    const items = [{ at: '2026-10-20T10:00:00Z' }, { at: '2026-10-22T09:00:00Z' }, {}];
    expect(countNewSince(items, '')).toBe(2);
    expect(countNewSince(items, '2026-10-21T00:00:00Z')).toBe(1);
    expect(latestAt(items)).toBe('2026-10-22T09:00:00Z');
  });
});
