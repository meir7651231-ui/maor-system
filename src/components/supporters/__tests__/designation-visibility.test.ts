/**
 * ratchet — ייעוד-תרומה כמסנן-הרשאה פר-עובד (בקשת-בעלים 13.8 ג'): "עובד x רואה
 * רק את ייעוד v... אני לא רוצה שאחר יראה את התרומות של השני".
 * הנעילה: supporterVisibleForDesignations (טהור) + allowedDesignationsFor
 * (מנהל=הכל; עובד=רק ייעודיו). הכרעת-בעלים 19.8 (היפוך): עובד-סגור רואה **רק**
 * את ייעודו — תורם בלי ייעוד אינו נראה לו (אכיפה-מלאה בשרת = עדכון Rules).
 */
import { describe, expect, it } from 'vitest';
import type { Supporter } from '../../../types/domain';
import { allDonationPurposes, supporterPurposes, supporterVisibleForDesignations, visibleSupportersForDesignations } from '../lib';
import { allowedDesignationsFor, canIssueReceipt } from '../../platform/lib';
import useAppSrc from '../../../store/useApp.ts?raw';
import formSrc from '../SupporterForm.tsx?raw';
import viewSrc from '../SupportersView.tsx?raw';
import type { OrgCloudDoc } from '../../../lib/cloudConfig';

const sup = (purposes: string[]): Pick<Supporter, 'donations'> =>
  ({ donations: purposes.map((p, i) => ({ rid: 'D-' + i, date: '2026-08-13', amount: 100, cur: '₪', cat: '', purpose: p })) }) as Pick<
    Supporter,
    'donations'
  >;

// הכרעת-בעלים 16.8 (#8 "דרך א׳"): ראוּת נקבעת לפי forWho בלבד = skey בשרת.
describe('supporterVisibleForDesignations — מסנן פר-עובד (forWho בלבד)', () => {
  it('allowed=null (מנהל) → הכל גלוי', () => {
    expect(supporterVisibleForDesignations({ forWho: 'חתונות' }, null)).toBe(true);
  });

  it('עובד עם ייעוד "חתונות" רואה רק תורמי-חתונות (לפי forWho)', () => {
    expect(supporterVisibleForDesignations({ forWho: 'חתונות' }, ['חתונות'])).toBe(true);
    expect(supporterVisibleForDesignations({ forWho: 'כללי' }, ['חתונות'])).toBe(false);
  });

  // הכרעת-בעלים 19.8 (היפוך): עובד-סגור רואה רק את ייעודו; תורם בלי ייעוד — לא נראה לו.
  it('תורם בלי forWho — מוסתר מעובד-סגור (הכרעת-בעלים 19.8)', () => {
    expect(supporterVisibleForDesignations({ forWho: '' }, ['חתונות'])).toBe(false);
    expect(supporterVisibleForDesignations({ forWho: '  ' }, ['חתונות'])).toBe(false);
    expect(supporterVisibleForDesignations({}, ['חתונות'])).toBe(false);
    // אבל למנהל (allowed=null) הכל עדיין גלוי
    expect(supporterVisibleForDesignations({ forWho: '' }, null)).toBe(true);
  });

  it('הייעוד-פר-תרומה (purpose) אינו קובע ראוּת-תורם — רק forWho', () => {
    // תורם בלי forWho ⇒ מוסתר מעובד-סגור (הכרעת-בעלים 19.8)
    expect(supporterVisibleForDesignations({ ...sup(['חתונות']), forWho: '' }, ['כללי'])).toBe(false);
    // forWho="חתונות" ⇒ מוסתר מעובד-כללי גם אם יש תרומת-"כללי"
    expect(supporterVisibleForDesignations({ ...sup(['כללי']), forWho: 'חתונות' }, ['כללי'])).toBe(false);
  });
});

describe('visibleSupportersForDesignations — נקודת-חנק למשטחים המצטברים', () => {
  // 🐛 נחיל-9×9 (13.8): הסינון היה רק ב-SupportersView+פלטה; מבט-הנהלה, מסך-הבית,
  // קיר-ההשפעה, הדוחות, הדוח-השנתי-לכולם והייצוא-המותאם צרכו db.supporters הגולמי
  // ⇒ עובדת מוגבלת ראתה שמות/סכומים/ייעודים אסורים. כעת מסננים כאן פעם-אחת.
  // forWho = ראוּת-התורם (skey); purposes = תרומות (מסוננות בנפרד, כמו pkey).
  const named = (id: string, forWho: string, purposes: string[]): Supporter =>
    ({ id, name: id, forWho, donations: purposes.map((p, i) => ({ rid: 'D-' + id + i, date: '2026-08-13', amount: 100, cur: '₪', cat: '', purpose: p })) }) as unknown as Supporter;

  it('allowed=null (מנהל) → אותה רשימה בדיוק (בלי הקצאת-עותק)', () => {
    const sups = [named('a', 'חתונות', ['חתונות'])];
    expect(visibleSupportersForDesignations(sups, null)).toBe(sups);
  });

  it('מסתיר תורמים לפי forWho — כולל תורם בלי-ייעוד (הכרעת-בעלים 19.8), ומקלף תרומות אסורות', () => {
    const sups = [
      named('a', 'חתונות', ['חתונות', 'כללי']), // גלוי (forWho=חתונות) — אך תרומת "כללי" תיקלף
      named('b', 'כללי', ['כללי']), // מוסתר (forWho=כללי)
      named('c', '', ['']), // בלי forWho — עכשיו מוסתר מעובד-סגור
    ];
    const out = visibleSupportersForDesignations(sups, ['חתונות']);
    expect(out.map((s) => s.id)).toEqual(['a']);
    // התורם הגלוי — רק תרומת-החתונות נשארה (כללי נקלף כדי שלא ידלוף סכום/ייעוד אסור)
    expect(out[0].donations.map((d) => d.purpose)).toEqual(['חתונות']);
  });

  it('תורם בלי forWho ⇒ מוסתר לגמרי מעובד-סגור (הכרעת-בעלים 19.8)', () => {
    const sups = [named('x', '', ['חתונות'])];
    const out = visibleSupportersForDesignations(sups, ['כללי']);
    expect(out.map((s) => s.id)).toEqual([]); // מוסתר
  });
});

describe('allDonationPurposes / supporterPurposes', () => {
  it('distinct + ממויין; ריקים מושמטים', () => {
    expect(supporterPurposes(sup(['א', 'א', '', 'ב']))).toEqual(['א', 'ב']);
    expect(allDonationPurposes([sup(['ב']), sup(['א']), sup([''])])).toEqual(['א', 'ב']);
  });
});

describe('ייעוד פר-תורם (forWho) — בקשת-בעלים 15.8 "פר תורם"', () => {
  // 🐛 באג: הסינון קרא רק את הייעוד-פר-תרומה (donations[].purpose); הייעוד שעל
  // כרטיס-התורם (forWho, "ייעוד התרומה (עבור)") — שם הבעלים בעצם רושם — לא חובר
  // כלל למסנן ⇒ "לא קורא נכון את הייעוד". כעת forWho הוא מקור-האמת פר-תורם.
  it('supporterPurposes כולל את forWho (הייעוד-שעל-הכרטיס)', () => {
    expect(supporterPurposes({ forWho: 'חתונות', donations: [] })).toEqual(['חתונות']);
    // איחוד forWho + ייעוד-פר-תרומה, distinct
    expect(supporterPurposes({ forWho: 'חתונות', donations: [{ rid: 'D-1', date: '2026-08-15', amount: 50, cur: '₪', cat: '', purpose: 'כללי' }] as Supporter['donations'] }).sort()).toEqual(['חתונות', 'כללי']);
    // forWho ריק ⇒ מתעלמים
    expect(supporterPurposes({ forWho: '  ', donations: [] })).toEqual([]);
  });

  it('תורם שהוקצה לו ייעוד בכרטיס נראה רק לעובד המורשה לאותו ייעוד', () => {
    const kohen = { forWho: 'חתונות' };
    expect(supporterVisibleForDesignations(kohen, ['חתונות'])).toBe(true);
    expect(supporterVisibleForDesignations(kohen, ['קמחא'])).toBe(false);
    // בלי ייעוד בכרטיס ⇒ מוסתר מעובד-סגור (הכרעת-בעלים 19.8)
    expect(supporterVisibleForDesignations({ forWho: '' }, ['חתונות'])).toBe(false);
  });

  it('allDonationPurposes מציג ערכי-forWho (כדי שהמנהל יבחר מהם בכרטיס-העובד)', () => {
    expect(allDonationPurposes([{ forWho: 'קמחא דפסחא', donations: [] }, { forWho: 'חתונות', donations: [] }])).toEqual(['קמחא דפסחא', 'חתונות'].sort((a, b) => a.localeCompare(b)));
  });

  it('הגנת-מקור: טופס-התורם מציג רמז-הרשאה + צ׳יפים כשהיכולת דלוקה', () => {
    expect(formSrc).toContain("featureOn(config, 'supporters.purpose')");
    expect(formSrc).toContain('הייעוד קובע אילו עובדות רואות את התורם/ת');
  });

  it('הגנת-מקור: רשימת-התורמים מסננת לפי ייעוד-הכרטיס (forWho)', () => {
    expect(viewSrc).toContain("(sp.forWho || '').trim() !== purposeF");
    expect(viewSrc).toContain('purposeOn && purposeOptions.length > 0');
  });

  // פריט ד' (19.8): עובד-סגור — בורר בלי "כל הייעודים" + ננעל לייעודו
  it('הגנת-מקור: בורר-הייעוד מסיר "כל הייעודים" לעובד-סגור + coercion', () => {
    expect(viewSrc).toContain("...(desigLimit ? [] : [{ value: 'all', label: 'כל הייעודים' }])");
    expect(viewSrc).toContain("if (desigLimit && desigLimit.length && purposeF === 'all') setPurposeF(desigLimit[0])");
  });

  // פריט ד' (19.8): שיוך-ייעוד בבחירה-מרובה (המנהל)
  it('הגנת-מקור: פעולת-store setSupportersPurpose + כפתור בחירה-מרובה', () => {
    expect(useAppSrc).toContain('setSupportersPurpose(ids, purpose)');
    expect(useAppSrc).toMatch(/idSet\.has\(s\.id\) \? \{ \.\.\.s, forWho: p \}/);
    expect(viewSrc).toContain('🏷 שיוך ייעוד · ');
    expect(viewSrc).toContain('setSupportersPurpose(ids, assignVal)');
  });

  // פריט ד' (19.8): תיוג-אוטומטי בהוספה — עובד-סגור מוסיף תורם ⇒ ייעודו מוצמד
  it('הגנת-מקור: upsertSupporter מתייג תורם-חדש בייעוד-העובד אוטומטית', () => {
    expect(useAppSrc).toMatch(/isNew && allowed && allowed\.length && !\(s\.forWho \|\| ''\)\.trim\(\)[\s\S]{0,60}forWho: allowed\[0\]/);
  });

  it('הגנת-מקור: לקוח-שורש (מאור) קורא ייעודים-פר-עובד (בקשת-בעלים "חבר את מאור")', () => {
    // הבאג: הענף rootOk (cloudRoot/default) דילג על קריאת memberConfigs ⇒
    // allowedDesignations לא נקבע ⇒ עובדת-מוגבלת ראתה הכל. כעת גם השורש קורא.
    const rootBlock = useAppSrc.slice(useAppSrc.indexOf('if (rootOk) {'), useAppSrc.indexOf('if (rootOk) {') + 1400);
    expect(rootBlock).toContain('mod.fetchOrgCloudConfig(cfg.slug)');
    expect(rootBlock).toContain('allowedDesignationsFor(user.email, orgDoc)');
    expect(rootBlock).toContain('mod.setAllowedPurposes(allowed)');
    // אינווריאנט-שורש: נכנס תמיד כ-member (בלי שער-חברות)
    expect(rootBlock).toContain("setCloud({ membership: 'member' })");
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

describe('canIssueReceipt — רק המנהל מנפיק קבלות (הכרעת-בעלים 14.8)', () => {
  // מקצה-יחיד ל-donationSeq (מונע מרוץ) + כלל-עסקי. ברירת-מחדל מתירה (לא שוברת קיים).
  it('מייל-על / מנהל / לקוח-שורש / עבודה-מקומית ⇒ מותר', () => {
    expect(canIssueReceipt({ superAdmin: true, isManager: false, cloudRoot: false, cloudConnected: true })).toBe(true);
    expect(canIssueReceipt({ superAdmin: false, isManager: true, cloudRoot: false, cloudConnected: true })).toBe(true);
    expect(canIssueReceipt({ superAdmin: false, isManager: false, cloudRoot: true, cloudConnected: true })).toBe(true); // לקוח-השורש = הבעלים
    expect(canIssueReceipt({ superAdmin: false, isManager: false, cloudRoot: false, cloudConnected: false })).toBe(true); // מקומי/לא-מחובר
  });
  it('עובד/ת בארגון-פלטפורמה (מחובר, לא-מנהל, לא-שורש) ⇒ חסום', () => {
    expect(canIssueReceipt({ superAdmin: false, isManager: false, cloudRoot: false, cloudConnected: true })).toBe(false);
  });
  it('הגנת-מקור: addDonation אוכף canIssueReceipt לפני צריכת המונה', () => {
    expect(useAppSrc).toContain('if (!canIssueReceipt(');
    // הגידור לפני הקצאת ה-rid (donationSeq)
    const gateIdx = useAppSrc.indexOf('canIssueReceipt({ superAdmin:');
    const ridIdx = useAppSrc.indexOf("const rid = 'D-' + get().db.donationSeq");
    expect(gateIdx).toBeGreaterThan(0);
    expect(gateIdx).toBeLessThan(ridIdx);
  });
});
