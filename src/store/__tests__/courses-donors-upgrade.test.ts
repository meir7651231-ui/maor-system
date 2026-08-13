/**
 * ratchet — שרידות שדות additive של שדרוג-החוגים-והתורמים (בקשת-בעלים 13.8):
 *  א' Course.files · ב' Course.perLesson/lessonPrice + Enrollment.freq/term/tier
 *  ג' Donation.purpose. כולם additive — שורדים round-trip דרך ה-store.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { useApp } from '../useApp';
import { emptyDb } from '../../types/domain';
import type { Course, Supporter } from '../../types/domain';

beforeEach(() => {
  useApp.getState().setDb(() => ({ ...emptyDb() }));
});

const baseCourse = (over: Partial<Course> = {}): Course =>
  ({
    id: 'c1', name: 'ציור', teacherId: '', roomId: 'r1', description: '',
    price: 0, price1: 0, price2: 0, price1Name: '', price2Name: '',
    model: 'monthly', size: 0, start: '', end: '', weekday: 0, time: '17:00', maxStudents: 12,
    gender: 'all', ageMin: 0, ageMax: 0, cat: '', semester: '', sector: '', sessions: [], notes: '',
    ...over,
  }) as Course;

describe('א׳ + ב׳ — Course.files + תמחור פר-שיעור שורדים upsertCourse', () => {
  it('קבצים מצורפים + מחירי-לשיעור נשמרים ונקראים חזרה', () => {
    useApp.getState().upsertCourse(
      baseCourse({
        perLesson: true,
        lessonPrice: 50,
        lessonPrice1: 40,
        files: [{ id: 'f1', name: 'חוברת.pdf', kind: 'file', data: 'data:application/pdf;base64,AAA', mime: 'application/pdf', size: 1234 }],
      }),
    );
    const c = useApp.getState().db.courses[0];
    expect(c.perLesson).toBe(true);
    expect(c.lessonPrice).toBe(50);
    expect(c.lessonPrice1).toBe(40);
    expect(c.files).toHaveLength(1);
    expect(c.files?.[0]).toMatchObject({ name: 'חוברת.pdf', kind: 'file' });
  });

  it('חוג ישן בלי השדות = ביט-זהה (undefined, לא קורס)', () => {
    useApp.getState().upsertCourse(baseCourse());
    const c = useApp.getState().db.courses[0];
    expect(c.perLesson).toBeUndefined();
    expect(c.files).toBeUndefined();
  });
});

describe('ג׳ — Donation.purpose שורד addDonation', () => {
  it('ייעוד התרומה נשמר על הקבלה', () => {
    const sp = { ...({} as Supporter), id: 's1', name: 'כהן', phone: '', email: '', address: '', idNum: '', cat: '', forWho: '', notes: '', count: 0, ils: 0, usd: 0, first: '', last: '', nextDate: '', donations: [] } as Supporter;
    useApp.getState().setDb((db) => ({ ...db, supporters: [sp] }));
    const res = useApp.getState().addDonation('s1', { date: '2026-08-13', amount: 100, cur: '₪', cat: 'כללי', purpose: 'חתונות' });
    expect(res.ok).toBe(true);
    const saved = useApp.getState().db.supporters[0].donations.at(-1);
    expect(saved?.purpose).toBe('חתונות');
  });
});
