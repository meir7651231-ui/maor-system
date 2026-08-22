/**
 * ratchet — שדרוג מנוע דדופ-תורמים ("ללמוד ממשפחות ולהתאים לתורמים", 19.8.2026).
 *
 * שומר:
 *  1. זיהוי-כפילות מתרחב למפתחות-חזקים — ת"ז (idNum) ו-מזהה-חיצוני (extId/ToremId)
 *     — כך שהתאמה קורית גם כששם/טלפון שונים (זיהוי-100% מול נדרים).
 *  2. מפתח-חלש לבדו לא מקבץ בטעות: ת"ז אפסים ("000000000") / קצרה מדי מדולגת.
 *  3. mergeSupportersGroup — מיזוג-קבוצה אטומי: כל הכסף (donations+hist, ה-rid)
 *     נשמר, הצבירה מחושבת-מחדש; פאריטי עם mergeFamilies.
 *  4. mergeSupportersByFields — בחירת-ערך פר-שדה סקלרי; הכסף לעולם לא נבחר-ידנית.
 */
import { describe, expect, it } from 'vitest';
import {
  findSupporterDupGroups,
  mergeSupportersGroup,
  mergeSupportersByFields,
  SUP_DUP_FIELDS,
} from '../dedup';
import type { Donation, Supporter } from '../../types/domain';

function don(over: Partial<Donation> = {}): Donation {
  return { rid: 'D-1', date: '2020-01-01', amount: 100, cur: '₪', cat: '', ...over };
}

function sp(id: string, over: Partial<Supporter> = {}): Supporter {
  return {
    id,
    name: 'תומך ' + id,
    phone: '',
    email: '',
    address: '',
    idNum: '',
    cat: '',
    forWho: '',
    notes: '',
    count: 0,
    ils: 0,
    usd: 0,
    first: '',
    last: '',
    nextDate: '',
    donations: [],
    ...over,
  };
}

describe('🔗 ratchet — מפתחות-זיהוי חזקים (ת"ז / מזהה-חיצוני)', () => {
  it('ת"ז זהה ⇒ אותה קבוצה גם כששם וטלפון שונים', () => {
    const groups = findSupporterDupGroups([
      sp('a', { name: 'ישראל כהן', idNum: '312345678', phone: '050-1111111' }),
      sp('b', { name: 'י. כהן', idNum: '312345678', phone: '052-2222222' }),
    ]);
    expect(groups).toHaveLength(1);
    expect(new Set(groups[0])).toEqual(new Set(['a', 'b']));
  });

  it('מזהה-חיצוני (ToremId נדרים) זהה ⇒ אותה קבוצה', () => {
    const groups = findSupporterDupGroups([
      sp('a', { name: 'רחל', extId: '492787' }),
      sp('b', { name: 'רחל בן צבי', extId: '492787' }),
    ]);
    expect(groups).toHaveLength(1);
  });

  it('ת"ז אפסים / קצרה מדי אינה מפתח (מציין-מקום נדרים) — לא מקבץ בטעות', () => {
    const groups = findSupporterDupGroups([
      sp('a', { name: 'א', idNum: '000000000' }),
      sp('b', { name: 'ב', idNum: '000000000' }),
      sp('c', { name: 'ג', idNum: '123' }),
      sp('d', { name: 'ד', idNum: '123' }),
    ]);
    expect(groups).toHaveLength(0);
  });

  it('מזהה-חיצוני ריק אינו מפתח', () => {
    const groups = findSupporterDupGroups([sp('a', { extId: '' }), sp('b', { extId: '' })]);
    expect(groups).toHaveLength(0);
  });
});

describe('🔒 ratchet — mergeSupportersGroup (מיזוג-קבוצה אטומי, אפס אובדן כסף)', () => {
  it('כל התרומות וה-hist עוברים; הצבירה מחושבת-מחדש; ה-rid נשמר', () => {
    const keep = sp('a', {
      name: 'שומר',
      donations: [don({ rid: 'D-1', date: '2021-05-01', amount: 200 })],
      hist: [{ d: '2019-01-01', a: 50, c: '₪', txn: 'T1' }],
    });
    const l1 = sp('b', {
      phone: '050-9', // שדה-ריק-בשומר מתמלא
      donations: [don({ rid: 'D-2', date: '2020-03-01', amount: 80, cur: '$' })],
      hist: [{ d: '2018-06-01', a: 30, c: '₪', txn: 'T2' }],
    });
    const l2 = sp('c', { donations: [don({ rid: 'D-3', date: '2022-11-01', amount: 20 })] });

    const merged = mergeSupportersGroup(keep, [l1, l2]);
    const rids = merged.donations.map((d) => d.rid).sort();
    expect(rids).toEqual(['D-1', 'D-2', 'D-3']); // כל ה-rid נשמרו
    expect(merged.count).toBe(3);
    expect(merged.ils).toBe(220); // 200 + 20 (הדולר לא נספר בשקלים)
    expect(merged.usd).toBe(80);
    expect(merged.hist).toHaveLength(2); // שני ה-hist אוחדו
    expect(merged.phone).toBe('050-9'); // שדה-ריק בשומר מולא מהנמחק
    expect(merged.first).toBe('2020-03-01'); // המוקדמת
    expect(merged.last).toBe('2022-11-01'); // המאוחרת
  });
});

describe('🔒 ratchet — mergeSupportersByFields (בחירת-ערך פר-שדה)', () => {
  it('בוחר ערך-שדה מרשומה נבחרת + עריכה ידנית; הכסף עדיין ממוזג-בטוח', () => {
    const s0 = sp('a', { name: 'שם-א', city: 'ירושלים', donations: [don({ rid: 'D-1', amount: 100 })] });
    const s1 = sp('b', { name: 'שם-ב', city: 'בני ברק', donations: [don({ rid: 'D-2', amount: 40 })] });
    // pick: name מרשומה 1 (index 1); city — עריכה ידנית
    const merged = mergeSupportersByFields([s0, s1], { name: 1 }, { city: 'אלעד' });
    expect(merged.name).toBe('שם-ב');
    expect(merged.city).toBe('אלעד');
    // הכסף לא הושפע מהבחירה — שתי התרומות נשמרו
    expect(merged.donations.map((d) => d.rid).sort()).toEqual(['D-1', 'D-2']);
    expect(merged.ils).toBe(140);
  });

  it('SUP_DUP_FIELDS אינו כולל שדות-כסף (הגנת-מקור)', () => {
    const keys = SUP_DUP_FIELDS.map((f) => f.key);
    for (const money of ['donations', 'hist', 'count', 'ils', 'usd', 'first', 'last']) {
      expect(keys).not.toContain(money);
    }
  });
});

describe('🐛 ratchet — mergeSupporterInto: hist אידמפוטנטי + photos/nextNote ניצלים (swarm-audit 21.8)', () => {
  // 🐛 באג א': ההיסטוריה שורשרה כמו-שהיא במיזוג — אותו חיוב-סליקה שיובא לשני
  // כרטיסי-הכפילות נספר פעמיים ב-supIls לנצח. עכשיו דרך mergeHist האידמפוטנטי
  // (מפתח d|a|c, כמות=max) — אותו-כלל כמו ייבוא-חוזר.
  it('אותו חיוב על שני הכרטיסים ⇒ נספר פעם-אחת; עסקאות שונות נשמרות', async () => {
    const { mergeSupporterInto } = await import('../dedup');
    const charge = { d: '2026-05-01', a: 180, c: '₪' as const, clearer: 'נדרים', txn: 'T-9' };
    const keep = sp('k', { hist: [charge, { d: '2026-06-01', a: 50, c: '₪' }] });
    const drop = sp('d', { hist: [{ ...charge }] }); // אותה עסקה יובאה גם לכרטיס-הכפול
    const m = mergeSupporterInto(keep, drop);
    expect(m.hist).toHaveLength(2); // לא 3 — החיוב-הכפול התמזג
    expect(m.hist!.filter((h) => h.d === '2026-05-01')).toHaveLength(1);
    // מטא-דאטת-הסליקה שרדה (mergeHist משמר את כל שדות-הרשומה)
    expect(m.hist!.find((h) => h.d === '2026-05-01')!.txn).toBe('T-9');
  });

  it('עסקת-אמת כפולה בתוך אותו כרטיס (אותו יום/סכום פעמיים) לא נבלעת', async () => {
    const { mergeSupporterInto } = await import('../dedup');
    const keep = sp('k', { hist: [{ d: '2026-05-01', a: 100, c: '₪' }, { d: '2026-05-01', a: 100, c: '₪' }] });
    const m = mergeSupporterInto(keep, sp('d'));
    expect(m.hist).toHaveLength(2); // כמות=max — הכפל-האמיתי בכרטיס נשמר
  });

  // 🐛 באג ב': photos ו-nextNote של הנמחק נזרקו בשקט — כל שדה-תוכן אחר ניצל.
  it('photos מאוחדים עד תקרת PHOTO_MAX; nextNote — של השומר גובר, ריק ⇒ של הנמחק', async () => {
    const { mergeSupporterInto } = await import('../dedup');
    const img = (i: number) => 'data:image/jpeg;base64,PIC' + i;
    const keep = sp('k', { photos: [img(1), img(2)], nextNote: '' });
    const drop = sp('d', { photos: [img(2), img(3), img(4), img(5), img(6)], nextNote: 'להתקשר אחרי החג' });
    const m = mergeSupporterInto(keep, drop);
    // איחוד בלי כפילויות, של-השומר קודם, קטום לתקרת האפליקציה (5)
    expect(m.photos).toEqual([img(1), img(2), img(3), img(4), img(5)]);
    expect(m.photos!.length).toBeLessThanOrEqual(5);
    expect(m.nextNote).toBe('להתקשר אחרי החג'); // ריק אצל השומר ⇒ ניצל מהנמחק

    const both = mergeSupporterInto(sp('k2', { nextNote: 'של השומר' }), sp('d2', { nextNote: 'של הנמחק' }));
    expect(both.nextNote).toBe('של השומר'); // שניהם ⇒ השומר גובר
  });

  it('בלי photos/nextNote בשני הצדדים ⇒ המפתחות לא מומצאים (ביט-זהה)', async () => {
    const { mergeSupporterInto } = await import('../dedup');
    const m = mergeSupporterInto(sp('k'), sp('d'));
    expect('photos' in m).toBe(false);
    expect('nextNote' in m).toBe(false);
  });
});
