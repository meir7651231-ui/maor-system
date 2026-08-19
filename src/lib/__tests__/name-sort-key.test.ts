/**
 * ratchet — התאמת-שם חסין-סדר (אבחון-הנחיל 19.8.2026): נדרים כותב שם משפחה-קודם
 * ("בן צבי רחל") ומאור פרטי-קודם ("רחל בן צבי") ⇒ נוצרו ~895 כפילויות. nameSortKey
 * ממיין את מילות-השם + מנקה תארים, כך ששני הסדרים מתלכדים. + חיזוק normPhone/normId
 * (סינון מספרי-דמה ות"ז-מציין-מקום של נדרים), + מפתח-שם-ממויין ב-findSupporterDupGroups.
 */
import { describe, expect, it } from 'vitest';
import { nameSortKey } from '../validate';
import { normId, normPhone, findSupporterDupGroups } from '../dedup';
import type { Supporter } from '../../types/domain';

const sp = (id: string, over: Partial<Supporter> = {}): Supporter => ({
  id, name: 'x', phone: '', email: '', address: '', idNum: '', cat: '', forWho: '',
  notes: '', count: 0, ils: 0, usd: 0, first: '', last: '', nextDate: '', donations: [], ...over,
});

describe('🎯 ratchet — nameSortKey (חסין-סדר + תארים)', () => {
  it('סדר-שם הפוך מתלכד', () => {
    expect(nameSortKey('בן צבי רחל')).toBe(nameSortKey('רחל בן צבי'));
    expect(nameSortKey('גאביזון דוד ישראל')).toBe(nameSortKey('דוד ישראל גאביזון'));
  });
  it('תארים מוסרים (ר׳/הרב/מרת) — אך רק כטוקן-שלם', () => {
    expect(nameSortKey('הרב דוד ישראל גאביזון')).toBe(nameSortKey('גאביזון דוד ישראל'));
    expect(nameSortKey('ר׳ משה כהן')).toBe(nameSortKey('כהן משה'));
    // "מרים" לא נחתך ל-"מר" (התואר מוסר כטוקן-שלם בלבד) ⇒ נשארות 2 מילים
    expect(nameSortKey('מרים לוי').split(' ')).toHaveLength(2);
    // ואילו התואר "מר" כטוקן-שלם כן מוסר
    expect(nameSortKey('מר לוי').split(' ')).toHaveLength(1);
  });
  it('גרשיים ואות-סופית מנורמלים (דרך normSearch)', () => {
    expect(nameSortKey('משה כ״ץ')).toBe(nameSortKey('משה כץ')); // ״ מוסר, ץ→צ
    expect(nameSortKey("רחל בן'צבי")).toBe(nameSortKey('רחל בןצבי')); // אפוסטרוף מוסר
  });
  it('שם-בודד ⇒ מפתח בלי רווח (לא מקבץ בטעות ב-dedup)', () => {
    expect(nameSortKey('כהן').includes(' ')).toBe(false);
  });
});

describe('☎️ ratchet — normPhone חיזוק', () => {
  it('מספרי-דמה (אפסים/ספרה-חוזרת) ⇒ ריק', () => {
    expect(normPhone('0000000000')).toBe('');
    expect(normPhone('1111111')).toBe('');
  });
  it('צורה בינ"ל 00972 / 972 ⇒ 0-מקומי', () => {
    expect(normPhone('00972533142342')).toBe('0533142342');
    expect(normPhone('972533142342')).toBe('0533142342');
  });
  it('טלפון רגיל עם מקפים ⇒ ספרות בלבד', () => {
    expect(normPhone('053-314-2342')).toBe('0533142342');
  });
});

describe('🆔 ratchet — normId (מציין-מקום נדרים)', () => {
  it('ת"ז-מרופדת סדרתית "000000020"/"000000065" ⇒ ריק (לא מפתח)', () => {
    expect(normId('000000020')).toBe('');
    expect(normId('000000065')).toBe('');
    expect(normId('000000000')).toBe('');
  });
  it('ת"ז אמיתית נשמרת', () => {
    expect(normId('312345678')).toBe('312345678');
    expect(normId('023456789')).toBe('023456789'); // 8 ספרות-משמעותיות
  });
});

describe('🔗 ratchet — findSupporterDupGroups מזהה סדר-שם הפוך', () => {
  it('שני כרטיסים אותו-שם בסדר הפוך מקובצים לאיחוד (בלי עיר/ת"ז)', () => {
    const groups = findSupporterDupGroups([
      sp('a', { name: 'רחל בן צבי' }),
      sp('b', { name: 'בן צבי רחל' }),
    ]);
    expect(groups).toHaveLength(1);
    expect(new Set(groups[0])).toEqual(new Set(['a', 'b']));
  });
  it('שם-בודד זהה אינו מקבץ (דורש ≥2 מילים)', () => {
    const groups = findSupporterDupGroups([sp('a', { name: 'כהן' }), sp('b', { name: 'כהן' })]);
    expect(groups).toHaveLength(0);
  });
});
