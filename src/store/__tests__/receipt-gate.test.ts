/**
 * ratchet — קבלה רק כשה-store קיבל (P1-א׳2, באג ידוע #5 ב-ANALYSIS).
 *
 * הבאג: DonationModal/ManageModal ניחשו את ה-rid מהמונה והורידו קבלה גם כשה-store
 * דחה את הרישום (השיבוץ/התומכת נמחקו בסנכרון בעוד הטופס פתוח) — קבלה עם מספר
 * שמעולם לא הונפק, פוגם ברציפות קבלות המס.
 *
 * הכלל הנעול: addPayment/addDonation מחזירים {ok, rid} — דחייה = ok:false בלי
 * לצרוך מונה; הצלחה = rid שהונפק בפועל וזהה לזה שנשמר על הרשומה.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { useApp } from '../useApp';
import { emptyDb, emptyFamily } from '../../types/domain';
import type { Db, Enrollment, Member, Supporter } from '../../types/domain';

function member(id: string): Member {
  return {
    id, first: 'רוני', gender: 'm', birth: '', idNum: '', phone: '', phone2: '',
    school: '', grade: '', health: '', mSefach: false, mInvite: false, mRecommend: false,
    mPhotos: false, mVideos: false, notes: '',
  };
}
function enr(id: string): Enrollment {
  return {
    id, memberId: 'm1', courseId: 'c1', plan: 'monthly', purchased: 0, used: 0, group: '',
    absences: [], payments: [], totalDue: 0, dueDate: '', status: 'active', note: '',
    enrolledAt: '2026-01-01',
  };
}
function sup(id: string): Supporter {
  return {
    id, name: 'גולדשטיין', phone: '', email: '', address: '', idNum: '', cat: '', forWho: '',
    notes: '', count: 0, ils: 0, usd: 0, first: '', last: '', nextDate: '', donations: [],
  };
}

function seed(): Db {
  return {
    ...emptyDb(),
    families: [{ ...emptyFamily(), id: 'f1', createdAt: '2026-01-01', name: 'כהן', members: [member('m1')] }],
    enrollments: [enr('e1')],
    supporters: [sup('sp1')],
    receiptSeq: 7,
    donationSeq: 4,
  };
}

beforeEach(() => {
  useApp.getState().setDb(() => seed());
});

describe('🧾 ratchet — addPayment מחזיר {ok,rid} אמיתיים', () => {
  it('הצלחה: rid=R-7 חוזר וזהה לרשומה; המונה מתקדם', () => {
    const res = useApp.getState().addPayment('e1', { date: '2026-07-29', amount: 120, method: 'מזומן' });
    expect(res).toEqual({ ok: true, rid: 'R-7' });
    const db = useApp.getState().db;
    expect(db.enrollments[0].payments[0].rid).toBe('R-7');
    expect(db.receiptSeq).toBe(8);
  });

  it('דחייה (שיבוץ נעלם): ok:false, בלי rid, המונה לא נצרך ואין תשלום', () => {
    const res = useApp.getState().addPayment('missing', { date: '2026-07-29', amount: 120, method: 'מזומן' });
    expect(res.ok).toBe(false);
    expect(res.rid).toBeUndefined();
    const db = useApp.getState().db;
    expect(db.receiptSeq).toBe(7);
    expect(db.enrollments[0].payments).toHaveLength(0);
  });
});

describe('🧾 ratchet — addDonation מחזיר {ok,rid} אמיתיים', () => {
  it('הצלחה: rid=D-4 חוזר וזהה לרשומה; המונה מתקדם', () => {
    const res = useApp.getState().addDonation('sp1', { date: '2026-07-29', amount: 500, cur: '₪', cat: '' });
    expect(res).toEqual({ ok: true, rid: 'D-4' });
    const db = useApp.getState().db;
    expect(db.supporters[0].donations[0].rid).toBe('D-4');
    expect(db.donationSeq).toBe(5);
  });

  it('דחייה (תומכת נעלמה): ok:false, בלי rid, המונה לא נצרך ואין תרומה', () => {
    const res = useApp.getState().addDonation('missing', { date: '2026-07-29', amount: 500, cur: '₪', cat: '' });
    expect(res.ok).toBe(false);
    expect(res.rid).toBeUndefined();
    const db = useApp.getState().db;
    expect(db.donationSeq).toBe(4);
    expect(db.supporters[0].donations).toHaveLength(0);
  });
});
