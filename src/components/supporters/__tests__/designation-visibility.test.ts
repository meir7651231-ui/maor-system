/**
 * ratchet — ייעוד-תרומה כמסנן-הרשאה פר-עובד (בקשת-בעלים 13.8 ג'): "עובד x רואה
 * רק את ייעוד v... אני לא רוצה שאחר יראה את התרומות של השני".
 * הנעילה: supporterVisibleForDesignations (טהור) + allowedDesignationsFor
 * (מנהל=הכל; עובד=רק ייעודיו). תורם בלי ייעוד = משותף.
 */
import { describe, expect, it } from 'vitest';
import type { Supporter } from '../../../types/domain';
import { allDonationPurposes, supporterPurposes, supporterVisibleForDesignations } from '../lib';
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
