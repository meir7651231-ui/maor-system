import { describe, expect, it } from 'vitest';
import { mergeSupporterInto } from '../dedup';
import type { Supporter } from '../../types/domain';

/**
 * 🐛 בליעה-שקטה (13.9.2026): `mergeSupporterInto` איחד ת"ז ב-`keep.idNum || drop.idNum`.
 * כששני כרטיסי-הכפילות נושאים ת"ז *שונה* (אדם אחר שקובץ בטעות, או טעות-הקלדה),
 * הת"ז של הנמחק **נזרקה בשקט** — למקבל-קבלת-§46 זה איבוד-מידע קריטי.
 * התיקון (אפס-השפעה על קבלות): הת"ז-הראשית לא משתנה, אבל הת"ז-הנמחקת נשמרת בהערות.
 * מאותה משפחה כמו התיקונים המתועדים 21.8 (photos/hist "לא נזרק בשקט").
 * זוהה ע"י מחולל-הסיכונים (deepfiles · גלאי "בליעה-שקטה", שדה-קריטי idNum).
 */
function sp(id: string, over: Partial<Supporter> = {}): Supporter {
  return {
    id, name: 'תומך ' + id, phone: '', email: '', address: '', idNum: '',
    cat: '', forWho: '', notes: '', count: 0, ils: 0, usd: 0,
    first: '', last: '', nextDate: '', donations: [], ...over,
  };
}

describe('🛡 ratchet — מיזוג-תורמים: ת"ז-נמחקת לא נבלעת בשקט', () => {
  it('ת"ז שונה בין הכרטיסים — הראשית נשמרת, הנמחקת עוברת להערות', () => {
    const merged = mergeSupporterInto(
      sp('keep', { idNum: '311111118' }),
      sp('drop', { idNum: '322222226' }),
    );
    expect(merged.idNum).toBe('311111118'); // הראשית — ללא שינוי (קבלות לא מושפעות)
    expect(merged.notes).toContain('322222226'); // הנמחקת — נשמרה, לא אבדה
  });

  it('אותה ת"ז — אין הערה מיותרת', () => {
    const merged = mergeSupporterInto(
      sp('keep', { idNum: '311111118' }),
      sp('drop', { idNum: '311111118' }),
    );
    expect(merged.idNum).toBe('311111118');
    expect(merged.notes).not.toContain('ת"ז נוספת');
  });

  it('לנמחק אין ת"ז — אין הערה, מאמצים את של-השומר', () => {
    const merged = mergeSupporterInto(
      sp('keep', { idNum: '311111118' }),
      sp('drop', { idNum: '' }),
    );
    expect(merged.idNum).toBe('311111118');
    expect(merged.notes).not.toContain('ת"ז נוספת');
  });

  it('הו"ק שונה בין הכרטיסים — של-השומר נשמרת, של-הנמחק עוברת להערות', () => {
    const hokA = { amount: 100, cur: '₪' as const, day: 5, method: 'bank', note: '', active: true, startedAt: '2020-01-01' };
    const hokB = { amount: 250, cur: '₪' as const, day: 10, method: 'card', note: '', active: true, startedAt: '2021-01-01' };
    const merged = mergeSupporterInto(sp('keep', { hok: hokA }), sp('drop', { hok: hokB }));
    expect(merged.hok?.amount).toBe(100); // הראשית ללא שינוי
    expect(merged.notes).toContain('250'); // הנמחקת נשמרה
    // הו"ק זהה ⇒ אין הערה מיותרת
    const same = mergeSupporterInto(sp('k', { hok: hokA }), sp('d', { hok: { ...hokA } }));
    expect(same.notes).not.toContain('הו"ק נוספת');
  });
});
