/**
 * ratchet — ייעוד-תרומה כמסנן-הרשאה פר-עובד (בקשת-בעלים 13.8 ג'): "עובד x רואה
 * רק את ייעוד v... אני לא רוצה שאחר יראה את התרומות של השני".
 * הנעילה: supporterVisibleForDesignations (טהור) + allowedDesignationsFor
 * (מנהל=הכל; עובד=רק ייעודיו). תורם בלי ייעוד = משותף.
 */
import { describe, expect, it } from 'vitest';
import type { Supporter } from '../../../types/domain';
import { allDonationPurposes, supporterPurposes, supporterVisibleForDesignations, visibleSupportersForDesignations } from '../lib';
import { allowedDesignationsFor } from '../../platform/lib';
import type { OrgCloudDoc } from '../../../lib/cloudConfig';

const sup = (purposes: string[]): Pick<Supporter, 'donations'> =>
  ({ donations: purposes.map((p, i) => ({ rid: 'D-' + i, date: '2026-08-13', amount: 100, cur: '₪', cat: '', purpose: p })) }) as Pick<
    Supporter,
    'donations'
  >;

describe('supporterVisibleForDesignations — מסנן פר-עובד', () => {
  it('allowed=null (מנהל) → הכל גלוי', () => {
    expect(supporterVisibleForDesignations(sup(['חתונות']), null)).toBe(true);
  });

  it('עובד עם ייעוד "חתונות" רואה רק תורמי-חתונות', () => {
    expect(supporterVisibleForDesignations(sup(['חתונות']), ['חתונות'])).toBe(true);
    expect(supporterVisibleForDesignations(sup(['כללי']), ['חתונות'])).toBe(false);
  });

  it('תורם בלי ייעוד כלל = משותף (גלוי לכל עובד)', () => {
    expect(supporterVisibleForDesignations(sup([]), ['חתונות'])).toBe(true);
    expect(supporterVisibleForDesignations(sup(['']), ['חתונות'])).toBe(true);
  });

  it('תורם עם כמה ייעודים — גלוי אם יש חיתוך אחד', () => {
    expect(supporterVisibleForDesignations(sup(['חתונות', 'כללי']), ['כללי'])).toBe(true);
    expect(supporterVisibleForDesignations(sup(['חתונות', 'בית']), ['כללי'])).toBe(false);
  });
});

describe('visibleSupportersForDesignations — נקודת-חנק למשטחים המצטברים', () => {
  // 🐛 נחיל-9×9 (13.8): הסינון היה רק ב-SupportersView+פלטה; מבט-הנהלה, מסך-הבית,
  // קיר-ההשפעה, הדוחות, הדוח-השנתי-לכולם והייצוא-המותאם צרכו db.supporters הגולמי
  // ⇒ עובדת מוגבלת ראתה שמות/סכומים/ייעודים אסורים. כעת מסננים כאן פעם-אחת.
  const named = (id: string, purposes: string[]): Supporter =>
    ({ id, name: id, donations: purposes.map((p, i) => ({ rid: 'D-' + id + i, date: '2026-08-13', amount: 100, cur: '₪', cat: '', purpose: p })) }) as unknown as Supporter;

  it('allowed=null (מנהל) → אותה רשימה בדיוק (בלי הקצאת-עותק)', () => {
    const sups = [named('a', ['חתונות'])];
    expect(visibleSupportersForDesignations(sups, null)).toBe(sups);
  });

  it('מסתיר תורמים אסורים, ומקלף מהגלויים תרומות בייעוד אסור', () => {
    const sups = [
      named('a', ['חתונות', 'כללי']), // גלוי (חיתוך) — אך "כללי" ייקלף
      named('b', ['כללי']), // מוסתר
      named('c', ['']), // תרומה חסרת-ייעוד = משותפת, גלוי
    ];
    const out = visibleSupportersForDesignations(sups, ['חתונות']);
    expect(out.map((s) => s.id)).toEqual(['a', 'c']);
    // התורם הגלוי — רק תרומת-החתונות נשארה (כללי נקלף כדי שלא ידלוף סכום/ייעוד אסור)
    expect(out[0].donations.map((d) => d.purpose)).toEqual(['חתונות']);
    // תורם משותף — תרומתו חסרת-הייעוד נשמרת (משותפת לכל עובד)
    expect(out[1].donations.length).toBe(1);
  });
});

describe('allDonationPurposes / supporterPurposes', () => {
  it('distinct + ממויין; ריקים מושמטים', () => {
    expect(supporterPurposes(sup(['א', 'א', '', 'ב']))).toEqual(['א', 'ב']);
    expect(allDonationPurposes([sup(['ב']), sup(['א']), sup([''])])).toEqual(['א', 'ב']);
  });
});

describe('allowedDesignationsFor — מנהל vs עובד', () => {
  const org: OrgCloudDoc = {
    manager: 'boss@x.com',
    memberConfigs: {
      'worker@x.com': { designations: ['חתונות'] },
      'nolimit@x.com': { designations: [] },
    },
  };
  it('מנהל → null (הכל)', () => {
    expect(allowedDesignationsFor('boss@x.com', org)).toBeNull();
  });
  it('עובד עם ייעודים → הרשימה; עובד בלי הגבלה → null', () => {
    expect(allowedDesignationsFor('worker@x.com', org)).toEqual(['חתונות']);
    expect(allowedDesignationsFor('nolimit@x.com', org)).toBeNull();
    expect(allowedDesignationsFor('unknown@x.com', org)).toBeNull();
  });
});
