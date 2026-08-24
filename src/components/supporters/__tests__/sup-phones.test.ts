/**
 * ratchet · ריבוי-טלפונים לתורם + סיווג ישראל/חו"ל (בקשת-שטח 22–24.8).
 *
 * הבקשה: לתורם רק שדה-טלפון אחד; צריך כמה מספרים (וואטסאפ/בית/עבודה) עם הערה
 * "ממי זה", וסינון שמפריד מספרי-חו"ל ממספרי-ישראל.
 *
 * שימור-התנהגות שהבדיקה נועלת:
 *  1. phoneRegion מסווג נכון: 0-מוביל/972 = ישראל · +/00 אחר, ו-11 ספרות US = חו"ל.
 *  2. allSupPhones מחזיר את הראשי (primary) ואז הנוספים, מסונן-ריקים, עם אזור.
 *  3. supHasRegion לסינון חול/ישראל.
 */
import { describe, expect, it } from 'vitest';
import type { Supporter } from '../../../types/domain';
import { allSupPhones, cleanSupPhones, phoneRegion, supHasRegion } from '../lib';

function mkSup(over: Partial<Supporter> = {}): Supporter {
  return {
    id: 's1', name: 'אסתי סגל', phone: '', email: '', address: '', idNum: '', cat: '',
    forWho: '', notes: '', count: 0, ils: 0, usd: 0, first: '', last: '', nextDate: '',
    donations: [], ...over,
  } as Supporter;
}

describe('📞 ratchet — ריבוי-טלפונים + סיווג ישראל/חו"ל', () => {
  it('1. phoneRegion — ישראל מול חו"ל', () => {
    expect(phoneRegion('050-123-4567')).toBe('il');
    expect(phoneRegion('0501234567')).toBe('il');
    expect(phoneRegion('972501234567')).toBe('il');
    expect(phoneRegion('+972-50-1234567')).toBe('il');
    expect(phoneRegion('00972501234567')).toBe('il');
    expect(phoneRegion('531234567')).toBe('il'); // נייד בלי 0 מוביל
    // חו"ל:
    expect(phoneRegion('19178335161')).toBe('intl'); // ארה"ב (מהשטח)
    expect(phoneRegion('+1 917 833 5161')).toBe('intl');
    expect(phoneRegion('001718...'.replace(/\./g, '0'))).toBe('intl');
    expect(phoneRegion('+44 20 7946 0958')).toBe('intl');
    // ריק ⇒ ברירת-מחדל ישראל:
    expect(phoneRegion('')).toBe('il');
  });

  it('2. allSupPhones — ראשי ואז נוספים, עם אזור וסימוני-וואטסאפ', () => {
    const sp = mkSup({
      phone: '050-1234567',
      phones: [
        { id: 'p1', num: '03-9999999', label: 'בית', note: 'אבא' },
        { id: 'p2', num: '19178335161', label: 'וואטסאפ', wa: true, note: 'הבן בניו-יורק' },
        { id: 'p3', num: '' }, // ריק — מסונן
      ],
    });
    const rows = allSupPhones(sp);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({ num: '050-1234567', primary: true, region: 'il' });
    expect(rows[1]).toMatchObject({ label: 'בית', note: 'אבא', region: 'il', primary: false });
    expect(rows[2]).toMatchObject({ label: 'וואטסאפ', wa: true, region: 'intl' });
  });

  it('3. supHasRegion — לסינון חול/ישראל', () => {
    const ilOnly = mkSup({ phone: '0501234567' });
    const withIntl = mkSup({ phone: '0501234567', phones: [{ id: 'p1', num: '19178335161' }] });
    expect(supHasRegion(ilOnly, 'il')).toBe(true);
    expect(supHasRegion(ilOnly, 'intl')).toBe(false);
    expect(supHasRegion(withIntl, 'intl')).toBe(true);
    expect(supHasRegion(withIntl, 'il')).toBe(true);
  });

  it('4. cleanSupPhones — fixPhone + סינון ריקים', () => {
    const cleaned = cleanSupPhones([
      { id: 'p1', num: ' 0501234567 ', label: 'נייד' },
      { id: 'p2', num: '   ' },
    ]);
    expect(cleaned).toHaveLength(1);
    expect(cleaned[0].num).toBe('050-1234567');
    expect(cleaned[0].label).toBe('נייד');
  });
});
