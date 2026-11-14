/**
 * ratchet — שיוך תשלום-נכנס לפי "טלפונים נוספים" (phones[]) (לילה 14.11.2026).
 *
 * הבאג: מסך שיוך-התשלום בדק רק phone/phone2 של המשפחה ואת הטלפון-הראשי של התורם ⇒
 *  - תשלום-חוג ממספר-נוסף של המשפחה: אין "📞 טלפון תואם" ואין הצעת-שיבוץ;
 *  - חיפוש תורם לפי ספרות של מספר-נוסף: לא נמצא;
 *  - כרטיס שהותאם לפי מספר-נוסף הציג "טלפון" לא-תואם (השוואה מול הראשי בלבד).
 */
import { describe, expect, it } from 'vitest';
import { enrollPhoneDigits, supPhoneContains, supPhoneVsPay } from '../incomingMatch';
import type { Supporter } from '../../../types/domain';

function sp(over: Partial<Supporter> = {}): Supporter {
  return {
    id: 's', name: 'ש', phone: '', email: '', address: '', idNum: '', cat: '', forWho: '',
    notes: '', count: 0, ils: 0, usd: 0, first: '', last: '', nextDate: '', donations: [], ...over,
  };
}

describe('📞 ratchet — התאמת תשלום-נכנס לפי טלפונים-נוספים', () => {
  it('enrollPhoneDigits כולל את phones[] של המשפחה (ומסנן קצרים/ריקים)', () => {
    const fam = { phone: '02-5000000', phone2: '', phones: [{ id: 'x', num: '054-2222222' }, { id: 'y', num: '12' }] };
    expect(enrollPhoneDigits({ phone: '' }, fam)).toEqual(['025000000', '0542222222']);
    expect(enrollPhoneDigits({ phone: '050-1111111' }, undefined)).toEqual(['0501111111']);
  });

  it('enrollPhoneDigits חסין ל-phones פגום (לא מערך)', () => {
    const fam = { phone: '02-5000000', phone2: '', phones: 'garbage' as unknown as [] };
    expect(enrollPhoneDigits({ phone: '' }, fam)).toEqual(['025000000']);
  });

  it('supPhoneContains מוצא תורם לפי ספרות של מספר-נוסף', () => {
    const s = sp({ phone: '050-1111111', phones: [{ id: 'p', num: '052-7654321' }] });
    expect(supPhoneContains(s, '7654')).toBe(true);
    expect(supPhoneContains(s, '1111')).toBe(true);
    expect(supPhoneContains(s, '9999')).toBe(false);
    expect(supPhoneContains(s, '76')).toBe(false); // פחות מ-3 ספרות ⇒ לא מחפשים
  });

  it('supPhoneVsPay מציג את המספר-הנוסף התואם עם ✓', () => {
    const s = sp({ phone: '050-1111111', phones: [{ id: 'p', num: '052-7654321' }] });
    expect(supPhoneVsPay(s, '0527654321')).toEqual({ num: '052-7654321', match: true });
    expect(supPhoneVsPay(s, '050-1111111')).toEqual({ num: '050-1111111', match: true });
    expect(supPhoneVsPay(s, '0539999999')).toEqual({ num: '050-1111111', match: false });
    expect(supPhoneVsPay(s, '')).toEqual({ num: '050-1111111', match: false });
  });
});
