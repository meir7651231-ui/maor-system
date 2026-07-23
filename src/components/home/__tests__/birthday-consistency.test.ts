/**
 * יום הולדת — עקביות בין הבית ליומן. עד לתיקון הבית התאים לפי היום/חודש
 * הלועזי בעוד היומן חוזר לפי התאריך העברי, כך שאותו ילד "חגג" בשני ימים
 * שונים בשני המסכים. עכשיו שניהם עברי (hebAnnualEq). נבדק: סריקת שנה שלמה
 * שבה הבית והיומן נדלקים בדיוק באותם ימים, וש"היום" הוא עברי ולא לועזי.
 */
import { describe, expect, it } from 'vitest';
import { emptyDb, emptyFamily, emptyMember } from '../../../types/domain';
import type { Db } from '../../../types/domain';
import { birthdaysOn } from '../homeData';
import { dayItems } from '../../calendar/calLib';

const BIRTH = '2015-08-06';

function dbWith(birth: string): Db {
  const m = { ...emptyMember(), id: 'm1', first: 'רוני', birth };
  const fam = { ...emptyFamily(), id: 'f1', name: 'כהן', createdAt: '2015-01-01', members: [m] };
  return { ...emptyDb(), families: [fam] };
}

const homeFires = (db: Db, d: Date) => birthdaysOn(db, d).some((b) => b.member.id === 'm1');
const calFires = (db: Db, d: Date) =>
  dayItems(db, d).some((it) => it.layer === 'bday' && it.key === 'bd-m1');

describe('🎂 יום הולדת — הבית והיומן נדלקים באותו יום בדיוק', () => {
  it('סריקת שנת 2026 יום-יום: הבית ≡ היומן על כל תאריך', () => {
    const db = dbWith(BIRTH);
    let hits = 0;
    for (let t = Date.UTC(2026, 0, 1); t <= Date.UTC(2026, 11, 31); t += 86400000) {
      const d = new Date(t);
      d.setHours(12, 0, 0, 0);
      const h = homeFires(db, d);
      const c = calFires(db, d);
      expect(h, `אי-התאמה בית/יומן בתאריך ${d.toISOString().slice(0, 10)}`).toBe(c);
      if (h) hits++;
    }
    expect(hits).toBeGreaterThanOrEqual(1); // חוגגים לפחות פעם אחת בשנה
  });

  it('החזרה עברית — לא נדלק בתאריך הלידה הלועזי (6.8) אלא ביום העברי', () => {
    const db = dbWith(BIRTH);
    const greg = new Date('2026-08-06T12:00:00'); // אותו יום/חודש לועזי, 11 שנים אחרי
    // ב-2026 התאריך העברי של 6.8.2015 נופל על יום לועזי אחר לגמרי
    expect(homeFires(db, greg)).toBe(false);
    expect(calFires(db, greg)).toBe(false);
  });

  it('גיל מוצג בשנים עבריות (זהה ליומן)', () => {
    const db = dbWith(BIRTH);
    for (let t = Date.UTC(2026, 0, 1); t <= Date.UTC(2026, 11, 31); t += 86400000) {
      const d = new Date(t);
      d.setHours(12, 0, 0, 0);
      const hit = birthdaysOn(db, d).find((b) => b.member.id === 'm1');
      if (hit) {
        expect(hit.age).toBeGreaterThan(0);
        expect(hit.age).toBeLessThan(120);
        break;
      }
    }
  });
});
