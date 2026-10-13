/**
 * ratchet — כפילויות לפי *כל* הטלפונים + מיזוג שלא מוחק אף טלפון (בקשת-בעלים 13.10).
 *
 * 🐛 1 (זיהוי): findSupporterDupGroups בדק רק sp.phone; findDuplicateGroups רק phone/phone2 —
 *    כפילות על מספר מתוך phones[] (וואטסאפ/בית/עבודה) לא זוהתה.
 * 🐛 2 (מיזוג-תורמים): `keep.phone || drop.phone` זרק את טלפון-הנמחק כשלשניהם טלפון,
 *    ו-phones[] של הנמחק לא עבר בכלל.
 * 🐛 3 (מיזוג-משפחות): רק phone/phone2 שרדו — מספר שלישי ואילך נזרק.
 * 🐛 4 (מיזוג שדה-שדה): טלפון שלא נבחר לשדה-הראשי נזרק.
 * בקשת-הבעלים: "כפילות צריך גם את כל הטלפונים וגם במיזוג שישאר כל הטלפונים ולא שאחד ימחק".
 */
import { describe, expect, it } from 'vitest';
import {
  findDuplicateGroups,
  findSupporterDupGroups,
  mergeExtraPhones,
  mergeFamilies,
  mergeFamiliesByFields,
  mergeSupporterInto,
  mergeSupportersByFields,
  normPhone,
} from '../dedup';
import { emptyFamily, type Family, type Supporter } from '../../types/domain';

function sp(id: string, over: Partial<Supporter> = {}): Supporter {
  return {
    id, name: 'תומך ' + id, phone: '', email: '', address: '', idNum: '',
    cat: '', forWho: '', notes: '', count: 0, ils: 0, usd: 0,
    first: '', last: '', nextDate: '', donations: [], ...over,
  };
}
function fam(id: string, over: Partial<Family> = {}): Family {
  return { ...emptyFamily(), id, name: 'משפחת ' + id, createdAt: '2026-01-01', ...over };
}
/** כל המספרים המנורמלים שיש לרשומה אחרי מיזוג (ראשיים + נוספים). */
const allNorm = (r: { phone: string; phone2?: string; phones?: { num: string }[] }) =>
  [r.phone, r.phone2 ?? '', ...(r.phones ?? []).map((p) => p.num)].map(normPhone).filter(Boolean).sort();

describe('🔍 זיהוי-כפילות לפי כל הטלפונים', () => {
  it('תורמים: מספר שיושב רק ב-phones[] של אחד ⇒ אותה קבוצה', () => {
    const g = findSupporterDupGroups([
      sp('a', { name: 'ישראל', phone: '050-1111111' }),
      sp('b', { name: 'משה', phone: '052-9999999', phones: [{ id: 'p1', num: '050-1111111', label: 'וואטסאפ' }] }),
    ]);
    expect(g).toHaveLength(1);
    expect(new Set(g[0])).toEqual(new Set(['a', 'b']));
  });

  it('משפחות: מספר שיושב רק ב-phones[] של אחת ⇒ אותה קבוצה', () => {
    const g = findDuplicateGroups([
      fam('a', { phone: '050-1111111' }),
      fam('b', { phone: '052-9999999', phones: [{ id: 'p1', num: '050-1111111' }] }),
    ]);
    expect(g).toHaveLength(1);
  });

  it('בלי מספר משותף — אין קבוצה (אין מיזוג-שווא)', () => {
    expect(findSupporterDupGroups([sp('a', { name: 'א', phone: '050-1111111' }), sp('b', { name: 'ב', phones: [{ id: 'p', num: '052-2222222' }] })])).toHaveLength(0);
  });
});

describe('🔗 מיזוג תורמים — אף טלפון לא נמחק', () => {
  it('טלפון-הנמחק + phones[] שלו עוברים לנוספים; הראשי של השומר לא זז', () => {
    const m = mergeSupporterInto(
      sp('k', { phone: '050-1111111', phones: [{ id: 'k1', num: '053-3333333', label: 'בית' }] }),
      sp('d', { name: 'דוד', phone: '052-2222222', phones: [{ id: 'd1', num: '054-4444444', label: 'עבודה' }] }),
    );
    expect(m.phone).toBe('050-1111111');
    expect(allNorm(m)).toEqual(['0501111111', '0522222222', '0533333333', '0544444444']);
    // טלפון-הראשי של הנמחק מסומן מאיפה הגיע; התווית של מספר-נוסף נשמרת
    expect(m.phones!.find((p) => normPhone(p.num) === '0522222222')!.note).toBe('מכרטיס: דוד');
    expect(m.phones!.find((p) => normPhone(p.num) === '0544444444')!.label).toBe('עבודה');
  });

  it('אותו מספר בשני הכרטיסים (בפורמט שונה) — נשמר פעם אחת בלבד', () => {
    const m = mergeSupporterInto(sp('k', { phone: '050-1111111' }), sp('d', { phone: '+972501111111' }));
    expect(m.phone).toBe('050-1111111');
    expect('phones' in m).toBe(false); // אין כפילות ⇒ אין נוספים ⇒ המפתח לא נוצר (ביט-זהה)
  });

  it('מיזוג שדה-שדה: בוחרים טלפון מהכרטיס השני ⇒ הטלפון של הראשון נשמר כנוסף', () => {
    const m = mergeSupportersByFields([sp('a', { phone: '050-1111111' }), sp('b', { phone: '052-2222222' })], { phone: 1 }, {});
    expect(m.phone).toBe('052-2222222');
    expect(allNorm(m)).toEqual(['0501111111', '0522222222']);
  });
});

describe('🔗 מיזוג משפחות — אף טלפון לא נמחק', () => {
  it('4 מספרים שונים ⇒ 2 בשדות-הראשיים + 2 בנוספים', () => {
    const m = mergeFamilies(fam('k', { phone: '050-1111111', phone2: '052-2222222' }), [
      fam('l', { name: 'כהן', phone: '053-3333333', phone2: '054-4444444' }),
    ]);
    expect(m.phone).toBe('050-1111111');
    expect(m.phone2).toBe('052-2222222');
    expect(allNorm(m)).toEqual(['0501111111', '0522222222', '0533333333', '0544444444']);
    expect(m.phones!.every((p) => p.note === 'מכרטיס: כהן')).toBe(true);
  });

  it('phones[] של המשפחה-הנבלעת עובר במלואו', () => {
    const m = mergeFamilies(fam('k', { phone: '050-1111111' }), [fam('l', { phones: [{ id: 'x', num: '055-5555555', label: 'סבתא' }] })]);
    expect(m.phones!.map((p) => p.label)).toContain('סבתא');
  });

  it('מיזוג שדה-שדה: מספר שלא נבחר נשמר כנוסף', () => {
    const m = mergeFamiliesByFields(
      [fam('a', { phone: '050-1111111', phone2: '' }), fam('b', { phone: '052-2222222', phone2: '053-3333333' })],
      { phone: 1, phone2: 1 },
      {},
    );
    expect(m.phone).toBe('052-2222222');
    expect(m.phone2).toBe('053-3333333');
    expect(allNorm(m)).toEqual(['0501111111', '0522222222', '0533333333']);
  });

  it('בלי מספרים עודפים ⇒ אין מפתח phones (ביט-זהה למיזוג הקודם)', () => {
    const m = mergeFamilies(fam('k', { phone: '050-1111111' }), [fam('l', { phone: '050-1111111' })]);
    expect('phones' in m).toBe(false);
  });
});

describe('🧩 mergeExtraPhones — טהור ודטרמיניסטי', () => {
  it('אותו קלט ⇒ אותו פלט (כולל מזהים)', () => {
    const src = [{ id: 'a', name: 'א', mains: ['050-1111111'] }, { id: 'b', name: 'ב', mains: ['052-2222222'] }];
    expect(mergeExtraPhones(['050-1111111'], src)).toEqual(mergeExtraPhones(['050-1111111'], src));
    expect(mergeExtraPhones(['050-1111111'], src)[0].id).toBe('ph-m-b-0');
  });

  it('רשומה פגומה (phones שאינו מערך) לא מפילה', () => {
    expect(() => mergeExtraPhones([], [{ id: 'a', name: 'א', mains: [], phones: 'x' as never }])).not.toThrow();
  });
});
