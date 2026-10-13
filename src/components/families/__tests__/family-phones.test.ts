/**
 * ratchet — טלפונים נוספים למשפחות (בקשת-בעלים 13.10: "תוסיף אפשרות לעוד מספרים").
 *
 * רקע: למשפחה היו רק שני שדות-טלפון (phone/phone2). במיזוג שתי משפחות עם 3–4 מספרים
 * שונים לא היה איפה לשמור את העודפים ⇒ מספרים אבדו. נוסף `Family.phones?` (additive,
 * אותו מבנה SupPhone כמו בתורמים) ו-`allFamilyPhones` כמקור-אמת אחד לכל הטלפונים.
 */
import { describe, expect, it } from 'vitest';
import { allFamilyPhones } from '../lib';
import formSrc from '../FamilyForm.tsx?raw';
import detailSrc from '../FamilyDetail.tsx?raw';
import supFormSrc from '../../supporters/SupporterForm.tsx?raw';

describe('📞 allFamilyPhones — כל הטלפונים של משפחה', () => {
  it('ראשי, נוסף ואז phones[] — בסדר יציב', () => {
    expect(
      allFamilyPhones({
        phone: '050-1111111',
        phone2: '052-2222222',
        phones: [
          { id: 'ph1', num: '053-3333333' },
          { id: 'ph2', num: '054-4444444', label: 'עבודה' },
        ],
      }),
    ).toEqual(['050-1111111', '052-2222222', '053-3333333', '054-4444444']);
  });

  it('ריקים מסוננים; בלי phones ⇒ רק שני השדות', () => {
    expect(allFamilyPhones({ phone: '050-1111111', phone2: '' })).toEqual(['050-1111111']);
    expect(allFamilyPhones({ phone: '', phone2: '', phones: [{ id: 'x', num: '  ' }] })).toEqual([]);
  });

  it('רשומה פגומה (phones שאינו מערך) לא מפילה — מתעלמים ממנה', () => {
    const bad = { phone: '050-1111111', phone2: '', phones: 'garbage' } as unknown as Parameters<typeof allFamilyPhones>[0];
    expect(allFamilyPhones(bad)).toEqual(['050-1111111']);
  });
});

describe('🛡 הגנות-מקור — העורך והתצוגה מחווטים', () => {
  it('טופס-המשפחה משתמש בעורך המשותף ושומר דרך cleanSupPhones', () => {
    expect(formSrc).toContain('<PhonesEditor phones={phones} onChange={setPhones} />');
    expect(formSrc).toContain('cleanSupPhones(phones)');
  });

  it('משפחה בלי טלפונים-נוספים — המפתח phones לא נכתב (ביט-זהה לנתונים הקיימים)', () => {
    expect(formSrc).toContain('return extraPhones.length ? { ...rest, phones: extraPhones } : rest;');
  });

  it('כרטיס-המשפחה מציג כל מספר נוסף עם כפתורי-הקשר', () => {
    expect(detailSrc).toContain('(fam.phones ?? []).map((p) => (');
    expect(detailSrc).toContain('action={commsAction(p.num)}');
  });

  it('טופס-התורם עבר לאותו עורך משותף (אין שכפול-markup)', () => {
    expect(supFormSrc).toContain('<PhonesEditor phones={phones} onChange={setPhones} />');
    expect(supFormSrc).not.toContain('const addPhone =');
  });
});
