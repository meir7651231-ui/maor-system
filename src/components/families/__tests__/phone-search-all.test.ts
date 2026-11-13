/**
 * ratchet — חיפוש לפי **כל** הטלפונים של המשפחה/התורם (לילה 13.11.2026).
 *
 * 🐛 הבאג: ב-13.10 נוספו "טלפונים נוספים" למשפחות (`Family.phones[]`) — הכפילויות, המיזוג
 * וזיהוי-המתקשר עודכנו, אבל **החיפוש נשכח**: מסך-המשפחות (חיפוש-חכם + סינון-עמודת-טלפון),
 * פלטת-הפקודות ושיבוץ-לחוג הכירו רק phone/phone2; הפלטה הכירה רק את הטלפון-הראשי של תורם.
 * ⇒ מספר שנשמר כ"נוסף" (או שהגיע ממיזוג-כפולים, שמעביר עודפים ל-phones[]) לא מצא את הכרטיס.
 * התיקון: `familyPhoneDigits`/`familyPhoneMatches` טהורים מעל `allFamilyPhones` (מקור-אמת אחד).
 */
import { describe, expect, it } from 'vitest';
import { familyPhoneDigits, familyPhoneMatches } from '../lib';
import { smartFilter } from '../../../lib/search';
import viewSrc from '../FamiliesView.tsx?raw';
import paletteSrc from '../../palette/CommandPalette.tsx?raw';
import enrollSrc from '../../courses/EnrollModal.tsx?raw';

const fam = {
  phone: '050-1111111',
  phone2: '052-2222222',
  phones: [
    { id: 'ph1', num: '053-3333333', label: 'עבודה' },
    { id: 'ph2', num: '+972 54 444 4444' },
  ],
};

describe('📞 familyPhoneDigits — מונחי-חיפוש מכל הטלפונים', () => {
  it('ראשי + נוסף + phones[] כספרות-בלבד, בסדר יציב', () => {
    expect(familyPhoneDigits(fam)).toEqual(['0501111111', '0522222222', '0533333333', '972544444444']);
  });

  it('בלי phones[] ⇒ בדיוק שני השדות (ביט-זהה להתנהגות הקודמת)', () => {
    expect(familyPhoneDigits({ phone: '050-1111111', phone2: '02 555 1234' })).toEqual(['0501111111', '025551234']);
    expect(familyPhoneDigits({ phone: '', phone2: '' })).toEqual([]);
  });

  it('אותו מספר בשני שדות ⇒ פעם אחת; ערך בלי ספרות מסונן', () => {
    expect(
      familyPhoneDigits({ phone: '050-1111111', phone2: 'אין', phones: [{ id: 'x', num: '0501111111' }] }),
    ).toEqual(['0501111111']);
  });

  it('רשומה פגומה (phones שאינו מערך) לא מפילה', () => {
    const bad = { phone: '050-1111111', phone2: '', phones: 'garbage' } as unknown as Parameters<typeof familyPhoneDigits>[0];
    expect(familyPhoneDigits(bad)).toEqual(['0501111111']);
  });
});

describe('🔎 familyPhoneMatches — סינון-עמודת-הטלפון', () => {
  it('מוצא לפי מספר-נוסף (phones[]) — הבאג', () => {
    expect(familyPhoneMatches(fam, '053-333')).toBe(true);
    expect(familyPhoneMatches(fam, '4444444')).toBe(true);
  });

  it('ממשיך למצוא לפי ראשי/נוסף, עם או בלי מקפים', () => {
    expect(familyPhoneMatches(fam, '0501111111')).toBe(true);
    expect(familyPhoneMatches(fam, '052-22')).toBe(true);
  });

  it('שאילתה בלי ספרות / מספר אחר ⇒ לא', () => {
    expect(familyPhoneMatches(fam, 'אבג')).toBe(false);
    expect(familyPhoneMatches(fam, '')).toBe(false);
    expect(familyPhoneMatches(fam, '0599')).toBe(false);
  });

  it('לא מתאים רצף שחוצה גבול בין שני מספרים (השרשור הישן התאים בטעות)', () => {
    // סוף הראשי "…1111" + תחילת הנוסף "0522…" — לא מספר של אף אחד
    expect(familyPhoneMatches(fam, '11110522')).toBe(false);
  });
});

describe('🧭 החיפוש-החכם מוצא משפחה לפי מספר-נוסף', () => {
  it('smartFilter עם familyPhoneDigits כמונחים', () => {
    const fams = [
      { name: 'כהן', ...fam },
      { name: 'לוי', phone: '058-9999999', phone2: '' },
    ];
    const hit = smartFilter('0533333333', fams, (f) => [f.name, ...familyPhoneDigits(f)]);
    expect(hit.map((f) => f.name)).toEqual(['כהן']);
  });
});

describe('🛡 הגנות-מקור — שלושת משטחי-החיפוש מחווטים לכל הטלפונים', () => {
  it('מסך-המשפחות: חיפוש-חכם וסינון-עמודה דרך העזרים, בלי phone2 ידני', () => {
    expect(viewSrc).toMatch(/\.\.\.familyPhoneDigits\(f\)/);
    expect(viewSrc).toMatch(/familyPhoneMatches\(f, colF\.phone\)/);
    expect(viewSrc).not.toMatch(/f\.phone2/);
  });

  it('פלטת-הפקודות: משפחה לפי כל טלפוניה, תורם לפי allSupPhones', () => {
    expect(paletteSrc).toMatch(/\.\.\.familyPhoneDigits\(f\)/);
    expect(paletteSrc).toMatch(/allSupPhones\(sp\)\.map\(\(r\) => digits\(r\.num\)\)/);
    expect(paletteSrc).not.toMatch(/digits\(f\.phone2?\)/);
  });

  it('שיבוץ-לחוג: מונחי-החיפוש כוללים את כל טלפוני-המשפחה', () => {
    expect(enrollSrc).toMatch(/familyPhoneDigits\(fam\)/);
  });
});
