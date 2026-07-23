/**
 * אימות חוצה-משטחים (כפול/משולש/מרובע):
 * פעולה אחת שאמורה להירשם בכמה מקומות — חייבת להגיע לכולם, בלי לדלוף
 * לישות אחרת ובלי חריגה. בודק שהנתון עקבי בין כל הנגזרות של אותו מקור.
 */
import { describe, expect, it } from 'vitest';
import { emptyDb, emptyFamily, emptyAyin } from '../../types/domain';
import type { Db, Family, Member, Enrollment, Supporter, Course, AyinCase } from '../../types/domain';
import { enrollCount, paidOf, payBal } from '../../components/courses/lib';
import { famEnrollments, famHistoryOf } from '../../components/families/lib';
import { paidInRange, balanceOf } from '../../components/reports/lib';
import { supTotalIls } from '../../components/supporters/lib';
import { tierOf } from '../../components/families/lib';
import { homeStats, monthDonationSum, credSummary, attentionItems } from '../../components/home/homeData';
import { ayinDailyRows } from '../../lib/ayin';
import { runAudit } from '../audit';
import { DEFAULT_CONFIG } from '../../types/config';

const TODAY = '2026-07-22';

function member(id: string, first: string, over: Partial<Member> = {}): Member {
  return {
    id, first, gender: 'm', birth: '2015-05-05', idNum: '', phone: '', phone2: '',
    school: '', grade: '', health: '', mSefach: false, mInvite: false, mRecommend: false,
    mPhotos: false, mVideos: false, notes: '', ...over,
  };
}
function fam(id: string, name: string, members: Member[]): Family {
  return { ...emptyFamily(), id, createdAt: '2024-01-01', name, members };
}
function course(id: string, name: string): Course {
  return {
    id, name, teacherId: '', roomId: '', cat: '', audience: '', semester: 'שנתי',
    model: 'monthly', size: 0, price: 100, price1: 0, price2: 0, price1Name: '', price2Name: '',
    maxStudents: 20, ageMin: 0, ageMax: 99, gender: 'all', weekday: 1, time: '16:00',
    start: '2024-01-01', end: '2027-01-01', sessions: [], img: '', active: true, notes: '',
    description: '', sector: '',
  } as Course;
}
function enr(id: string, memberId: string, courseId: string, over: Partial<Enrollment> = {}): Enrollment {
  return {
    id, memberId, courseId, plan: 'monthly', purchased: 0, used: 0, group: '',
    absences: [], payments: [], totalDue: 0, dueDate: '', status: 'active', note: '',
    enrolledAt: '2024-02-01', ...over,
  };
}
function supporter(id: string, name: string, over: Partial<Supporter> = {}): Supporter {
  return {
    id, name, phone: '', email: '', address: '', idNum: '', cat: '', forWho: '', notes: '',
    count: 0, ils: 0, usd: 0, first: '', last: '', nextDate: '', donations: [], ...over,
  };
}

/** בונה DB עם 2 משפחות, 2 חוגים, 2 תומכים — בסיס לבדיקות בידוד. */
function baseDb(): Db {
  const m1 = member('m1', 'רוני');
  const m2 = member('m2', 'דני');
  return {
    ...emptyDb(),
    families: [fam('f1', 'כהן', [m1]), fam('f2', 'לוי', [m2])],
    courses: [course('c1', 'ציור'), course('c2', 'גיטרה')],
    supporters: [supporter('s1', 'פרידמן'), supporter('s2', 'ברוכים')],
    enrollments: [],
  };
}

describe('💳 תשלום — נרשם בשיבוץ + יתרה + היסטוריית משפחה + דוחות, בלי לדלוף', () => {
  const db = baseDb();
  db.enrollments = [
    enr('e1', 'm1', 'c1', { totalDue: 300, payments: [{ rid: 'R-1', amount: 120, date: TODAY, method: 'מזומן' }] }),
  ];
  const E = db.enrollments[0];
  const F1 = db.families[0];
  const F2 = db.families[1];

  it('1️⃣ שיבוץ: paidOf רואה את התשלום', () => expect(paidOf(E)).toBe(120));
  it('2️⃣ יתרה: payBal = 300-120', () => expect(payBal(E)).toBe(180));
  it('2️⃣ יתרה (דוחות): balanceOf זהה ל-payBal', () => expect(balanceOf(E)).toBe(payBal(E)));
  it('3️⃣ דוחות: paidInRange כולל את התשלום', () =>
    expect(paidInRange(E, { from: '2026-01-01', to: '2026-12-31' })).toBe(120));
  it('4️⃣ היסטוריית משפחה f1: יש רשומת תשלום', () =>
    expect(famHistoryOf(db, F1).some((h) => h.tag === 'תשלום')).toBe(true));
  it('🚫 אין דליפה: היסטוריית f2 בלי תשלום', () =>
    expect(famHistoryOf(db, F2).some((h) => h.tag === 'תשלום')).toBe(false));
});

describe('💳 יתרת תשלום — אזהרת החוב בבית עקבית עם מסך הקורסים (אותו payBal)', () => {
  it('תשלום פגום (NaN) לא מסתיר חוב אמיתי מאזהרת הבית', () => {
    const db = baseDb();
    db.enrollments = [
      enr('e1', 'm1', 'c1', {
        totalDue: 300, dueDate: '2026-01-01', // עבר המועד
        payments: [{ rid: 'R', amount: NaN, date: '2026-01-01', method: 'מזומן' } as never],
      }),
    ];
    const e = db.enrollments[0];
    // מסך הקורסים: יתרה חיובית אמיתית (NaN מנוטרל)
    expect(payBal(e)).toBe(300);
    // לוח הבית: פריט "תשלום" מופיע (אותו חישוב) — לא נבלע בגלל NaN
    const items = attentionItems(db, new Date(TODAY + 'T12:00:00'), {});
    expect(items.some((it) => it.tag === 'תשלום')).toBe(true);
  });
});

describe('🎓 שיבוץ — נספר בחוג + בכרטיס משפחה + בסטטיסטיקת הבית, בלי לדלוף לחוג אחר', () => {
  const db = baseDb();
  db.enrollments = [enr('e1', 'm1', 'c1')];

  it('1️⃣ תפוסת החוג c1 = 1', () => expect(enrollCount(db, 'c1')).toBe(1));
  it('🚫 החוג c2 לא הושפע = 0', () => expect(enrollCount(db, 'c2')).toBe(0));
  it('2️⃣ כרטיס משפחה f1: שיבוץ אחד', () => expect(famEnrollments(db, db.families[0]).length).toBe(1));
  it('🚫 כרטיס משפחה f2: אפס', () => expect(famEnrollments(db, db.families[1]).length).toBe(0));
  it('3️⃣ סטטיסטיקת הבית: activeEnrollments=1, enrollTotal=1', () => {
    const s = homeStats(db, new Date(TODAY + 'T12:00:00'));
    expect(s.activeEnrollments).toBe(1);
    expect(s.enrollTotal).toBe(1);
  });
  it('4️⃣ שיבוץ מוקפא לא נספר כפעיל אך כן בסה"כ', () => {
    const db2 = baseDb();
    db2.enrollments = [enr('e1', 'm1', 'c1', { status: 'paused' })];
    const s = homeStats(db2, new Date(TODAY + 'T12:00:00'));
    expect(s.activeEnrollments).toBe(0);
    expect(s.enrollTotal).toBe(1);
  });
});

describe('💛 תרומה — נספרת בכרטיס התומך + בסטטיסטיקת הבית, בלי לדלוף לתומך אחר', () => {
  const db = baseDb();
  db.supporters[0] = supporter('s1', 'פרידמן', {
    count: 1, ils: 500, last: TODAY, donations: [{ rid: 'D-1', amount: 500, cur: '₪', date: TODAY, cat: 'כללי' }],
  });

  it('1️⃣ סה"כ התומך s1 = 500', () => expect(supTotalIls(db.supporters[0])).toBe(500));
  it('🚫 התומך s2 לא הושפע = 0', () => expect(supTotalIls(db.supporters[1])).toBe(0));
  it('2️⃣ סטטיסטיקת הבית: donIls כולל 500', () => {
    const s = homeStats(db, new Date(TODAY + 'T12:00:00'));
    expect(s.donIls).toBe(500);
    expect(s.supportersTotal).toBe(2);
  });
  it('3️⃣ עקביות שני-מקורות: כרטיס (מצבור sp.ils) = לוח הבית (סכום sp.donations)', () => {
    // הכרטיס קורא sp.ils; הבית סוכם את המערך — כשהנתונים עקביים הם חייבים להיות זהים
    const s = homeStats(db, new Date(TODAY + 'T12:00:00'));
    expect(supTotalIls(db.supporters[0])).toBe(s.donIls);
  });
  it('4️⃣ צ׳יפ המגמה החודשית סוכם את אותה תרומה', () =>
    expect(monthDonationSum(db, new Date(TODAY + 'T12:00:00'))).toBe(500));
  it('🔎 ביקורת: נתונים עקביים → אין ממצא אי-התאמה', () =>
    expect(runAudit(db).some((i) => i.title.includes('לא תואם את פירוט התרומות'))).toBe(false));
});

describe('🧮 ביקורת תופסת פער מצבור↔פירוט (מקור אחד סוטה מהשני)', () => {
  it('sp.ils מנופח מעל סכום התרומות → ממצא לוגיקה', () => {
    const db = baseDb();
    // מצבור אומר ₪900 אבל בפירוט רק ₪500 — בדיוק המצב שגורם לכרטיס ולבית לא להסכים
    db.supporters[0] = supporter('s1', 'פרידמן', {
      count: 1, ils: 900, last: TODAY,
      donations: [{ rid: 'D-1', amount: 500, cur: '₪', date: TODAY, cat: 'כללי' }],
    });
    const found = runAudit(db).filter((i) => i.spId === 's1' && i.title.includes('לא תואם את פירוט התרומות'));
    expect(found.length).toBe(1);
  });
  it('count שגוי (2 רשום, תרומה אחת בפירוט) → ממצא', () => {
    const db = baseDb();
    db.supporters[0] = supporter('s1', 'פרידמן', {
      count: 2, ils: 500, last: TODAY,
      donations: [{ rid: 'D-1', amount: 500, cur: '₪', date: TODAY, cat: 'כללי' }],
    });
    expect(runAudit(db).some((i) => i.spId === 's1' && i.title.includes('לא תואם'))).toBe(true);
  });
  it('🚫 בלי תרומות בכלל (מצבור 0, מערך ריק) → אין ממצא כוזב', () => {
    const db = baseDb();
    expect(runAudit(db).some((i) => i.title.includes('לא תואם את פירוט התרומות'))).toBe(false);
  });
});

describe('🏅 מדד אמינות — משפחה ללא נתוני cred נכנסת לאותה דרגה בכל משטח (ברירת מחדל 700)', () => {
  const db = baseDb();
  // מדמים נתון ישן/מיובא בלי אובייקט cred כלל
  const legacy: Record<string, unknown> = { ...db.families[0] };
  delete legacy.cred;
  db.families[0] = legacy as unknown as Family;

  it('1️⃣ ברירת המחדל הקנונית 700 → דרגת "טעון שיפור" (pale)', () =>
    expect(tierOf(700).key).toBe('pale'));
  it('2️⃣ סיכום הבית סופר את המשפחה חסרת-cred כ-pale (אותה ברירת מחדל)', () => {
    const s = credSummary(db, (score) => tierOf(score).key);
    expect(s.counts.pale).toBeGreaterThanOrEqual(1);
    expect(s.total).toBe(2);
  });
  it('🚫 לא מסווגת בטעות כ"סיכון" (red) — 700 ולא 0', () => {
    const s = credSummary(db, (score) => tierOf(score).key);
    expect(s.counts.red).toBe(0);
  });
});

describe('📉 היעדרות — נרשמת בשיבוץ + בהיסטוריית המשפחה', () => {
  const db = baseDb();
  db.enrollments = [enr('e1', 'm1', 'c1', { absences: [{ date: TODAY, reason: 'מחלה', noshow: false }] })];
  it('1️⃣ בשיבוץ: absence אחת', () => expect(db.enrollments[0].absences.length).toBe(1));
  it('2️⃣ בהיסטוריית f1: תג היעדרות', () =>
    expect(famHistoryOf(db, db.families[0]).some((h) => h.tag === 'היעדרות' || h.tag === 'No-Show')).toBe(true));
});

describe('🧿 מעקב טיפול — מגיע לדוח היומי כשטופל היום, בלי לכלול תומך שלא טופל', () => {
  const db = baseDb();
  const a: AyinCase = { ...emptyAyin(), stage: 'eyes', lastTouch: TODAY, names: [{ id: 'n1', name: 'שרה בת רבקה', eyes: 3, done: false }] };
  db.supporters[0] = supporter('s1', 'פרידמן', { ayin: a });
  const rows = ayinDailyRows(DEFAULT_CONFIG, db.supporters, TODAY);

  it('1️⃣ הדוח כולל את s1 (טופל היום)', () => expect(rows.some((r) => r[0] === 'פרידמן')).toBe(true));
  it('🚫 הדוח לא כולל את s2 (בלי טיפול)', () => expect(rows.some((r) => r[0] === 'ברוכים')).toBe(false));
  it('🚫 תומך שטופל אתמול לא נכנס לדוח היום', () => {
    const db2 = baseDb();
    db2.supporters[0] = supporter('s1', 'פרידמן', { ayin: { ...emptyAyin(), lastTouch: '2026-07-21' } });
    expect(ayinDailyRows(DEFAULT_CONFIG, db2.supporters, TODAY).length).toBe(1); // כותרת בלבד
  });
});
