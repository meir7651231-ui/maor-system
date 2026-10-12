/**
 * ⚡ ratchet — ביצועי ההתמדה (12.10.2026): migrate ללא-הקצאות על נתונים נקיים.
 *
 * המדידה: אצל הלקוח האמיתי (16,000 תורמים · 34MB JSON) migrate רץ בכל טעינה ובכל
 * משיכת-ענן, ושכפל **כל** תורם פעמיים (פס-הריפוי + פס-המצבורים), כל מערך-תרומות
 * (filter+map) וכל שורת-hist ({...rest, c}) — גם כשאין מה לרפא. על מסמך סינתטי
 * של 16k תורמים (5 תרומות + 8 hist כל אחד, 19M תווים): 138ms ⇒ 91ms במכונת-הפיתוח
 * (×4 האטת-CPU אצל הלקוח). הכלל: רשומה נקייה ⇒ **אותה הפניה**; רשומה פגומה ⇒
 * מרופאת בדיוק כמו קודם (האורקל: בדיקות-המיגרציה הקיימות + המקרים כאן).
 */
import { describe, expect, it } from 'vitest';
import { migrate } from '../persist';
import { emptyAyin, emptyDb, type Db, type Supporter } from '../../types/domain';

const PNG = 'data:image/png;base64,iVBORw0KGgo=';

function sup(id: string, over: Partial<Supporter> = {}): Supporter {
  return {
    id, name: 'תורם ' + id, phone: '', email: '', address: '', idNum: '', cat: '', forWho: '', notes: '',
    count: 2, ils: 100, usd: 50, first: '2025-01-01', last: '2025-02-01', nextDate: '',
    donations: [
      { rid: 'D-1', date: '2025-01-01', amount: 100, cur: '₪', cat: 'כללי' },
      { rid: 'D-2', date: '2025-02-01', amount: 50, cur: '$', cat: 'כללי' },
    ],
    hist: [{ d: '2024-01-01', a: 30 }, { d: '2024-02-01', a: 40, c: '$', ref: 'r1' } as NonNullable<Supporter['hist']>[number]],
    ...over,
  } as Supporter;
}

/** מסמך v6 "נקי" — כפי שהוא נקרא מהאחסון (JSON round-trip ⇒ אובייקטים טריים, בלי undefined). */
function cleanDoc(): Db & { supporters: Supporter[] } {
  const db: Db = {
    ...emptyDb(),
    donationSeq: 4,
    receiptSeq: 2,
    supporters: [
      sup('spA', { ayin: { ...emptyAyin(), stage: 'eyes' }, photos: [PNG] }),
      sup('spB', { donations: [{ rid: 'D-3', date: '2025-02-01', amount: 50, cur: '$', cat: 'כללי' }], count: 1, ils: 0, usd: 50, first: '2025-02-01', last: '2025-02-01', hist: undefined }),
    ],
    enrollments: [{ id: 'e1', memberId: 'm1', courseId: 'c1', plan: 'monthly', status: 'active', payments: [{ rid: 'R-1', date: '2025-01-01', amount: 100, method: 'מזומן' }], absences: [] } as unknown as Db['enrollments'][number]],
    courses: [{ id: 'c1', name: 'חוג', roomId: 'r1', sessions: [] } as unknown as Db['courses'][number]],
  };
  return JSON.parse(JSON.stringify(db));
}

describe('⚡ ratchet — migrate מחזיר את אותן ההפניות כשאין מה לרפא', () => {
  it('מסמך v6 נקי: supporters[i] / donations / hist / ayin / enrollments / courses — אותה הפניה', () => {
    const raw = cleanDoc();
    const m = migrate(raw)!;
    expect(m).not.toBeNull();
    for (let i = 0; i < raw.supporters.length; i++) {
      expect(m.supporters[i]).toBe(raw.supporters[i]);
      expect(m.supporters[i].donations).toBe(raw.supporters[i].donations);
      expect(m.supporters[i].hist).toBe(raw.supporters[i].hist);
    }
    expect(m.supporters[0].ayin).toBe(raw.supporters[0].ayin);
    expect(m.supporters[0].photos).toBe(raw.supporters[0].photos);
    expect(m.enrollments[0]).toBe(raw.enrollments[0]);
    expect(m.courses[0]).toBe(raw.courses[0]);
    // המונים לא זזו (אין כפילויות ⇒ planRidRenumber no-op)
    expect(m.donationSeq).toBe(4);
    expect(m.receiptSeq).toBe(2);
  });

  it('אידמפוטנטי: migrate(migrate(x)) — אותן הפניות ואותו תוכן', () => {
    const raw = cleanDoc();
    const once = migrate(raw)!;
    const twice = migrate(once)!;
    expect(twice.supporters[0]).toBe(once.supporters[0]);
    expect(twice).toEqual(once);
  });

  it('תוכן זהה לריפוי-מלא: migrate(נקי) שווה-ערך ל-JSON של הקלט (אפס שינוי נתונים)', () => {
    const raw = cleanDoc();
    const m = migrate(raw)!;
    expect(JSON.parse(JSON.stringify(m.supporters))).toEqual(JSON.parse(JSON.stringify(raw.supporters)));
  });
});

describe('⚡ ratchet — רשומה פגומה עדיין מרופאת בדיוק כמו קודם (האורקל)', () => {
  it('hist: איבר בלי d / a לא-מספרי נזרקים; מטבע זר מוסר; מטא-דאטה נשמרת; תורם זה משוכפל', () => {
    const raw = cleanDoc();
    raw.supporters[0].hist = [
      { d: '2024-01-01', a: 30, c: 'EUR', ref: 'keep' },
      { a: 100 },
      { d: '2024-03-01', a: 'x' },
      { d: '2024-04-01', a: 5, c: '$' },
    ] as unknown as Supporter['hist'];
    const m = migrate(raw)!;
    expect(m.supporters[0]).not.toBe(raw.supporters[0]);
    expect(m.supporters[0].hist).toEqual([{ d: '2024-01-01', a: 30, ref: 'keep' }, { d: '2024-04-01', a: 5, c: '$' }]);
    expect(m.supporters[1]).toBe(raw.supporters[1]); // השכן הנקי — לא נגעו
  });

  it('hist עם c:undefined מפורש — המפתח מוסר (כמו קודם); hist לא-מערך ⇒ undefined', () => {
    const raw = cleanDoc();
    raw.supporters[0].hist = [{ d: '2024-01-01', a: 30, c: undefined }] as unknown as Supporter['hist'];
    raw.supporters[1].hist = 'לא-מערך' as unknown as Supporter['hist'];
    const m = migrate(raw)!;
    expect('c' in m.supporters[0].hist![0]).toBe(false);
    expect(m.supporters[1].hist).toBeUndefined();
  });

  it('donations: null נזרק, date חסר ⇒ "" (ה-rid נשמר)', () => {
    const raw = cleanDoc();
    raw.supporters[0].donations = [null, { rid: 'D-9', amount: 10, cur: '₪', cat: '' }] as unknown as Supporter['donations'];
    const m = migrate(raw)!;
    expect(m.supporters[0].donations).toEqual([{ rid: 'D-9', date: '', amount: 10, cur: '₪', cat: '' }]);
  });

  it('ayin חלקי (לגאסי) ⇒ מיזוג emptyAyin + שלב זר ⇒ new; ayin מלא ⇒ אותה הפניה', () => {
    const raw = cleanDoc();
    raw.supporters[1].ayin = { stage: 'zzz', note: 'x' } as unknown as Supporter['ayin'];
    const m = migrate(raw)!;
    expect(m.supporters[1].ayin).toEqual({ ...emptyAyin(), stage: 'new', note: 'x' });
    expect(m.supporters[0].ayin).toBe(raw.supporters[0].ayin);
  });

  it('photos: ערך לא-תקין מסונן ⇒ מערך חדש; מערך תקין ⇒ אותה הפניה', () => {
    const raw = cleanDoc();
    raw.supporters[0].photos = [PNG, 'javascript:alert(1)'];
    const m = migrate(raw)!;
    expect(m.supporters[0].photos).toEqual([PNG]);
  });

  it('מצבורים שגויים (count/ils/usd/first/last) מרופאים — רק אצל התורם השגוי', () => {
    const raw = cleanDoc();
    raw.supporters[0].ils = 999;
    raw.supporters[1].count = NaN as unknown as number;
    const m = migrate(raw)!;
    expect(m.supporters[0]).not.toBe(raw.supporters[0]);
    expect(m.supporters[0].ils).toBe(100);
    expect(m.supporters[1].count).toBe(1);
  });

  it('דדופ-D- (copy-on-write): הקבלה הכפולה ממוספרת מחדש — ומערך-הקלט לא נכתב לתוכו', () => {
    const raw = cleanDoc();
    // spB מקבל D-1 כפול (קיים אצל spA בתאריך מוקדם יותר ⇒ spA שומר, spB ממוספר מחדש)
    raw.supporters[1].donations = [{ rid: 'D-1', date: '2025-05-05', amount: 7, cur: '₪', cat: '' }];
    raw.supporters[1].ils = 7; raw.supporters[1].usd = 0; raw.supporters[1].first = '2025-05-05'; raw.supporters[1].last = '2025-05-05';
    const inputDons = raw.supporters[1].donations;
    const m = migrate(raw)!;
    expect(m.supporters[0].donations[0].rid).toBe('D-1');
    expect(m.supporters[1].donations[0].rid).toBe('D-4');
    expect(m.donationSeq).toBe(5);
    expect(inputDons[0].rid).toBe('D-1'); // הקלט לא שונה (לפני: כתיבה ישירה לתוך המערך)
  });

  it('enrollment בלי payments / course בלי sessions ⇒ מרופאים; תקינים ⇒ אותה הפניה', () => {
    const raw = cleanDoc();
    raw.enrollments.push({ id: 'e2', memberId: 'm1', courseId: 'c1', plan: 'monthly', status: 'active' } as unknown as Db['enrollments'][number]);
    raw.courses.push({ id: 'c2', name: 'חוג 2', roomId: 'r1' } as unknown as Db['courses'][number]);
    const m = migrate(raw)!;
    expect(m.enrollments[0]).toBe(raw.enrollments[0]);
    expect(m.enrollments[1].payments).toEqual([]);
    expect(m.enrollments[1].absences).toEqual([]);
    expect(m.courses[0]).toBe(raw.courses[0]);
    expect(m.courses[1].sessions).toEqual([]);
  });
});
