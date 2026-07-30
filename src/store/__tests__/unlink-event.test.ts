/**
 * ratchet — יעד קשר בלי confirm + ניקוי בלי יתומים (P1.9).
 *
 * שני כללים נעולים:
 * 1. legacy saveSupNext (legacy-main-script.js:1432-1444): קביעת תאריך יעד
 *    יוצרת/מעדכנת את תזכורת ה'שיחה' בלוח **אוטומטית, בלי window.confirm** —
 *    הגנת-מקור על SupporterDetail (ה-confirm הישן הוסר).
 * 2. באג ידוע #6: ניקוי nextDate (תומכת) / dueDate (שיבוץ) השאיר אירוע יתום
 *    בלוח — unlinkEvent מוחק את האירוע המקושר ומנקה את השדות אטומית.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { useApp } from '../useApp';
import { emptyDb } from '../../types/domain';
import type { Db, Enrollment, OrgEvent, Supporter } from '../../types/domain';
import detailSrc from '../../components/supporters/SupporterDetail.tsx?raw';
import manageSrc from '../../components/courses/ManageModal.tsx?raw';

function ev(id: string): OrgEvent {
  return {
    id, title: 'תזכורת', date: '2026-08-05', time: '', type: 'call', customType: '',
    notes: '', price: 0, roomId: '', famId: '', priority: 'orange', done: false,
  };
}
function sup(): Supporter {
  return {
    id: 'sp1', name: 'גולדשטיין', phone: '', email: '', address: '', idNum: '', cat: '',
    forWho: '', notes: '', count: 0, ils: 0, usd: 0, first: '', last: '',
    nextDate: '2026-08-05', nextEventId: 'ev1', donations: [],
  };
}
function enr(): Enrollment {
  return {
    id: 'e1', memberId: 'm1', courseId: 'c1', plan: 'monthly', purchased: 0, used: 0,
    group: '', absences: [], payments: [], totalDue: 300, dueDate: '2026-08-05',
    dueEventId: 'ev2', status: 'active', note: '', enrolledAt: '2026-01-01',
  };
}

function seed(): Db {
  return { ...emptyDb(), supporters: [sup()], enrollments: [enr()], events: [ev('ev1'), ev('ev2'), ev('ev9')] };
}

beforeEach(() => {
  useApp.getState().setDb(() => seed());
});

describe('🎯 ratchet — unlinkEvent מנקה בלי להשאיר יתומים (באג #6)', () => {
  it('supporterNext: nextDate/nextEventId מתנקים והאירוע המקושר נמחק; אחרים לא', () => {
    useApp.getState().unlinkEvent('supporterNext', 'sp1');
    const db = useApp.getState().db;
    expect(db.supporters[0].nextDate).toBe('');
    expect(db.supporters[0].nextEventId).toBeUndefined();
    expect(db.events.map((e) => e.id)).toEqual(['ev2', 'ev9']);
  });

  it('enrollmentDue: dueDate/dueEventId מתנקים והאירוע המקושר נמחק', () => {
    useApp.getState().unlinkEvent('enrollmentDue', 'e1');
    const db = useApp.getState().db;
    expect(db.enrollments[0].dueDate).toBe('');
    expect(db.enrollments[0].dueEventId).toBeUndefined();
    expect(db.events.map((e) => e.id)).toEqual(['ev1', 'ev9']);
  });

  it('ללא אירוע מקושר / מזהה לא קיים — ניקוי שקט בלי קריסה', () => {
    useApp.getState().setDb((db) => ({
      supporters: db.supporters.map((s) => ({ ...s, nextEventId: undefined })),
    }));
    useApp.getState().unlinkEvent('supporterNext', 'sp1');
    useApp.getState().unlinkEvent('supporterNext', 'missing');
    useApp.getState().unlinkEvent('enrollmentDue', 'missing');
    expect(useApp.getState().db.events).toHaveLength(3);
    expect(useApp.getState().db.supporters[0].nextDate).toBe('');
  });
});

describe('🛡 הגנות-מקור — התזכורת נוצרת בלי confirm והניקויים עוברים unlinkEvent', () => {
  it('SupporterDetail: אין window.confirm (legacy saveSupNext — יצירה אוטומטית)', () => {
    expect(detailSrc).not.toContain('window.confirm');
    expect(detailSrc).toMatch(/unlinkEvent\('supporterNext', sp\.id\)/);
  });

  it('ManageModal: ניקוי תאריך התשלום הבא עובר unlinkEvent', () => {
    expect(manageSrc).toMatch(/unlinkEvent\('enrollmentDue', en\.id\)/);
  });
});
