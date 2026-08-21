/**
 * אימות מחיקה-מדורגת (cascade) מקצה לקצה דרך ה-store האמיתי:
 * מחיקת חוג/משפחה/בן-משפחה חייבת לנקות את השיבוצים התלויים כדי שלא
 * יישארו "יתומים" שדולפים לספירות (enrollCount · homeStats · attention).
 * כל פעולה כזו נבדקת מול המצב שאחריה — בלי זליגה ובלי חריגה.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { useApp } from '../useApp';
import { migrate } from '../persist';
import { emptyDb, emptyFamily, DB_VERSION } from '../../types/domain';
import type { Course, Db, Enrollment, Family, Member } from '../../types/domain';
import { enrollCount } from '../../components/courses/lib';
import { homeStats } from '../../components/home/homeData';
import { supTotalIls } from '../../components/supporters/lib';

function member(id: string, first: string): Member {
  return {
    id, first, gender: 'm', birth: '2015-05-05', idNum: '', phone: '', phone2: '',
    school: '', grade: '', health: '', mSefach: false, mInvite: false, mRecommend: false,
    mPhotos: false, mVideos: false, notes: '',
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

/** שני משפחות (m1,m2), שני חוגים, שני שיבוצים — אחד לכל צירוף. */
function seed(): Db {
  return {
    ...emptyDb(),
    families: [fam('f1', 'כהן', [member('m1', 'רוני')]), fam('f2', 'לוי', [member('m2', 'דני')])],
    courses: [course('c1', 'ציור'), course('c2', 'גיטרה')],
    enrollments: [enr('e1', 'm1', 'c1'), enr('e2', 'm2', 'c2')],
  };
}

const db = () => useApp.getState().db;

beforeEach(() => {
  useApp.getState().setDb(() => seed());
});

describe('🧹 מחיקת חוג — מנקה את שיבוציו, בלי לגעת בחוג/שיבוץ האחר', () => {
  it('deleteCourse(c1): e1 נעלם, e2 נשאר', () => {
    useApp.getState().deleteCourse('c1');
    expect(db().courses.map((c) => c.id)).toEqual(['c2']);
    expect(db().enrollments.map((e) => e.id)).toEqual(['e2']);
  });
  it('אין שיבוץ יתום — enrollCount(c1)=0, לא נספר בבית', () => {
    useApp.getState().deleteCourse('c1');
    expect(enrollCount(db(), 'c1')).toBe(0);
    const s = homeStats(db(), new Date('2026-07-22T12:00:00'));
    expect(s.enrollTotal).toBe(1);
    expect(s.activeEnrollments).toBe(1);
  });
});

describe('🧹 מחיקת משפחה — מנקה שיבוצים + אירועים, בלי לגעת במשפחה השנייה', () => {
  it('deleteFamily(f1): המשפחה + שיבוץ בנה נעלמים, f2/e2 נשארים', () => {
    useApp.getState().deleteFamily('f1');
    expect(db().families.map((f) => f.id)).toEqual(['f2']);
    expect(db().enrollments.map((e) => e.id)).toEqual(['e2']);
    const s = homeStats(db(), new Date('2026-07-22T12:00:00'));
    expect(s.enrollTotal).toBe(1);
    expect(s.famTotal).toBe(1);
  });
  it('אירוע שמשויך למשפחה נמחק יחד איתה', () => {
    useApp.getState().setDb(() => ({
      events: [
        { id: 'ev1', type: 'reminder', title: 'ת', date: '2026-07-22', time: '', famId: 'f1', done: false, priority: 'gray', customType: '', notes: '', price: 0, roomId: '' },
        { id: 'ev2', type: 'reminder', title: 'ת', date: '2026-07-22', time: '', famId: 'f2', done: false, priority: 'gray', customType: '', notes: '', price: 0, roomId: '' },
      ] as unknown as Db['events'],
    }));
    useApp.getState().deleteFamily('f1');
    expect(db().events.map((e) => e.id)).toEqual(['ev2']);
  });
});

describe('🧹 🐛 swarm-audit — deleteFamily: cascade מלא גם במודולי-הרוחב', () => {
  // הבאג: המחיקה דירגה רק families/enrollments/events והשאירה יתומים —
  // שיוכי-חנות (המשיכו לצרוך מלאי ולהיספר בסבסוד), מסירות-חלוקה על שיוך מת,
  // קופות/רכזי-צדקה עם famId תלוי, waits עם famId מת, ומשימות עם עוגן-משפחה.
  function seedWide() {
    useApp.getState().setDb(() => ({
      ...seed(),
      shopAssignments: [
        { id: 'a1', productId: 'p1', famId: 'f1', memberId: '', criterionIds: [], status: 'active', redemptions: [] },
        { id: 'a2', productId: 'p1', famId: 'f2', memberId: '', criterionIds: [], status: 'active', redemptions: [] },
      ] as unknown as Db['shopAssignments'],
      deliveries: [
        { id: 'd1', dayId: 'dd1', assignmentId: 'a1', volunteerId: 'v1', familyId: 'f1', status: 'pickup' },
        { id: 'd2', dayId: 'dd1', assignmentId: 'a2', volunteerId: 'v1', familyId: 'f2', status: 'pickup' },
      ] as unknown as Db['deliveries'],
      tzBoxes: [
        { id: 'b1', num: '1', coordinatorId: 'tc1', famId: 'f1', holderKind: 'supported', since: '', status: 'home', collections: [], notes: '' },
      ] as unknown as Db['tzBoxes'],
      tzCoordinators: [
        { id: 'tc1', name: 'רכזת', famId: 'f1', memberId: 'm1', phone: '', notes: '', score: 0, scoreLog: [] },
      ] as unknown as Db['tzCoordinators'],
      shopItems: [
        { id: 'i1', name: 'פריט', kind: 'coupon', storeId: '', active: true, notes: '',
          waits: [{ famId: 'f1', date: '2026-08-01', note: '' }, { famId: 'f2', date: '2026-08-02', note: '' }] },
      ] as unknown as Db['shopItems'],
      tasks: [
        { id: 't1', assignee: 'a@b.c', by: 'מקומי', title: 'טיפול', ref: { kind: 'family', id: 'f1' }, pri: 2, createdAt: '2026-08-01T10:00:00Z' },
        { id: 't2', assignee: 'a@b.c', by: 'מקומי', title: 'אחר', ref: { kind: 'family', id: 'f2' }, pri: 2, createdAt: '2026-08-01T10:00:00Z' },
      ] as unknown as Db['tasks'],
    }));
  }

  it('שיוכי-חנות ומסירות של המשפחה נמחקים; של משפחה אחרת נשארים', () => {
    seedWide();
    useApp.getState().deleteFamily('f1');
    expect(db().shopAssignments.map((a) => a.id)).toEqual(['a2']);
    expect(db().deliveries.map((d) => d.id)).toEqual(['d2']);
  });

  it('מסירה שמצביעה על שיוך שנמחק מוסרת גם כשה-familyId שלה שונה (אין מסירה יתומה)', () => {
    seedWide();
    // מסירה עם familyId לא-תואם אך assignmentId של המשפחה הנמחקת — עדיין יתומה
    useApp.getState().setDb((cur) => ({
      deliveries: [...cur.deliveries,
        { id: 'd3', dayId: 'dd1', assignmentId: 'a1', volunteerId: 'v1', familyId: 'f2', status: 'pickup' } as unknown as Db['deliveries'][number]],
    }));
    useApp.getState().deleteFamily('f1');
    expect(db().deliveries.map((d) => d.id)).toEqual(['d2']);
  });

  it('קופה/רכז-צדקה: הקישור מתנתק (famId/memberId ריקים) — הישות עצמה נשארת', () => {
    seedWide();
    useApp.getState().deleteFamily('f1');
    expect(db().tzBoxes).toHaveLength(1);
    expect(db().tzBoxes[0].famId).toBe('');
    expect(db().tzCoordinators).toHaveLength(1);
    expect(db().tzCoordinators[0].famId).toBe('');
    expect(db().tzCoordinators[0].memberId).toBe('');
  });

  it('רשימת-המתנה (waits) מנוקה מהמשפחה שנמחקה בלבד', () => {
    seedWide();
    useApp.getState().deleteFamily('f1');
    expect(db().shopItems[0].waits?.map((w) => w.famId)).toEqual(['f2']);
  });

  it('משימת-עבודה נשארת אך העוגן התלוי (ref) מוסר; משימת משפחה אחרת לא נגעה', () => {
    seedWide();
    useApp.getState().deleteFamily('f1');
    const t1 = db().tasks.find((t) => t.id === 't1')!;
    const t2 = db().tasks.find((t) => t.id === 't2')!;
    expect(t1.ref).toBeUndefined();
    expect(t1.title).toBe('טיפול'); // העבודה עצמה לא אבדה
    expect(t2.ref).toEqual({ kind: 'family', id: 'f2' });
  });
});

describe('🧹 מחיקת בן-משפחה — מנקה את שיבוציו בלבד', () => {
  it('deleteMember(f1,m1): m1 יורד מהמשפחה, e1 נמחק, e2 נשאר', () => {
    useApp.getState().deleteMember('f1', 'm1');
    expect(db().families.find((f) => f.id === 'f1')!.members.length).toBe(0);
    expect(db().enrollments.map((e) => e.id)).toEqual(['e2']);
    expect(enrollCount(db(), 'c1')).toBe(0);
  });
});

describe('🔔 ניקוי תזכורות יתומות: מחיקת ישות מנקה את אירוע היומן המקושר', () => {
  const evOf = (id: string, over: Record<string, unknown> = {}) =>
    ({ id, type: 'reminder', title: 'ת', date: '2026-07-22', time: '', famId: '', done: false,
      priority: 'orange', customType: '', notes: '', price: 0, roomId: '', ...over }) as unknown as Db['events'][number];

  it('deleteEnrollment מנקה את תזכורת התשלום (dueEventId)', () => {
    useApp.getState().setDb(() => ({
      ...emptyDb(),
      enrollments: [enr('e1', 'm1', 'c1', { dueEventId: 'due1' } as Partial<Enrollment>)],
      events: [evOf('due1'), evOf('keep')],
    }));
    useApp.getState().deleteEnrollment('e1');
    expect(db().events.map((e) => e.id)).toEqual(['keep']);
  });

  it('deleteCourse מנקה תזכורות תשלום של כל שיבוציו', () => {
    useApp.getState().setDb(() => ({
      ...emptyDb(),
      courses: [course('c1', 'ציור'), course('c2', 'גיטרה')],
      enrollments: [
        enr('e1', 'm1', 'c1', { dueEventId: 'due1' } as Partial<Enrollment>),
        enr('e2', 'm2', 'c2', { dueEventId: 'due2' } as Partial<Enrollment>),
      ],
      events: [evOf('due1'), evOf('due2')],
    }));
    useApp.getState().deleteCourse('c1');
    expect(db().events.map((e) => e.id)).toEqual(['due2']); // due1 נוקה, due2 (חוג אחר) נשאר
  });

  it('deleteSupporter מנקה את תזכורת יעד-הקשר (nextEventId)', () => {
    useApp.getState().setDb(() => ({
      ...emptyDb(),
      supporters: [
        { id: 's1', name: 'פרידמן', phone: '', email: '', address: '', idNum: '', cat: '', forWho: '',
          notes: '', count: 0, ils: 0, usd: 0, first: '', last: '', nextDate: '2026-08-01',
          nextEventId: 'call1', donations: [] },
      ] as Db['supporters'],
      events: [evOf('call1', { type: 'call' }), evOf('keep')],
    }));
    useApp.getState().deleteSupporter('s1');
    expect(db().events.map((e) => e.id)).toEqual(['keep']);
  });

  it('deleteMember מנקה תזכורות תשלום של שיבוציו', () => {
    useApp.getState().setDb(() => ({
      ...emptyDb(),
      families: [fam('f1', 'כהן', [member('m1', 'רוני')])],
      enrollments: [enr('e1', 'm1', 'c1', { dueEventId: 'due1' } as Partial<Enrollment>)],
      events: [evOf('due1')],
    }));
    useApp.getState().deleteMember('f1', 'm1');
    expect(db().events.length).toBe(0);
  });
});

describe('💱 סיווג מטבע אחיד: תרומה עם cur ריק/₪ = שקל בכל המשטחים', () => {
  function seedWithSupporter() {
    useApp.getState().setDb(() => ({
      ...emptyDb(),
      supporters: [
        { id: 's1', name: 'פרידמן', phone: '', email: '', address: '', idNum: '', cat: '',
          forWho: '', notes: '', count: 0, ils: 0, usd: 0, first: '', last: '', nextDate: '',
          donations: [] },
      ] as Db['supporters'],
    }));
  }
  it('cur ריק → נספר כשקל בצבירה ובבית (זהים)', () => {
    seedWithSupporter();
    // עוקפים את הטופס (שמגביל ל-₪/$) כדי לדמות נתון מיובא/legacy עם cur ריק
    useApp.getState().addDonation('s1', { date: '2026-07-22', amount: 300, cur: '' as never, cat: '' });
    const sp = db().supporters[0];
    expect(sp.ils).toBe(300); // הצבירה סופרת אותו כשקל (cur !== '$')
    const s = homeStats(db(), new Date('2026-07-22T12:00:00'));
    expect(s.donIls).toBe(300);
    expect(supTotalIls(sp)).toBe(s.donIls); // כרטיס = בית, בלי פער
  });
  it('cur=$ → נספר כדולר, לא כשקל', () => {
    seedWithSupporter();
    useApp.getState().addDonation('s1', { date: '2026-07-22', amount: 100, cur: '$', cat: '' });
    const sp = db().supporters[0];
    expect(sp.usd).toBe(100);
    expect(sp.ils).toBe(0);
  });
});

describe('🛡️ הגנת דליפה חוצה-משפחות: id כפול אחרי migrate לא גורם למחיקה שגויה', () => {
  it('deleteMember במשפחה השנייה לא מוחק את שיבוץ הראשונה', () => {
    // migrate מבטיח id ייחודי: לשתי המשפחות היה m1; השנייה קיבלה id חדש
    const migrated = migrate({
      v: DB_VERSION,
      families: [
        { id: 'f1', name: 'כהן', members: [{ id: 'm1', first: 'רוני' }] },
        { id: 'f2', name: 'לוי', members: [{ id: 'm1', first: 'דני' }] },
      ],
      // השיבוץ מפנה ל-m1 (של המשפחה הראשונה, שנשמר)
      enrollments: [
        { id: 'e1', memberId: 'm1', courseId: 'c1', plan: 'monthly', status: 'active',
          enrolledAt: '2024-02-01', group: '', totalDue: 0, purchased: 0, used: 0,
          payments: [], absences: [], dueDate: '', note: '' },
      ],
    })!;
    useApp.getState().setDb(() => migrated);
    const f2mid = db().families[1].members[0].id; // ה-id החדש שהוקצה
    expect(f2mid).not.toBe('m1');
    useApp.getState().deleteMember('f2', f2mid);
    // שיבוץ המשפחה הראשונה שרד — אין דליפה
    expect(db().enrollments.map((e) => e.id)).toEqual(['e1']);
  });
});
