/**
 * ratchet · סינון תזכורות-יומן פר-עובדת (בקשת-שטח 24.8).
 *
 * הבקשה: "אני מסננת לייעוד לאסתי סגל... בתזכורות בלוח-טיפול שישארו לה אנשי-הקשר
 * אבל רק שלה. עכשיו היא מקבלת ביומן תזכורות של כולם — ואני רוצה שתקבל רק את שלה".
 *
 * שימור: תזכורת מקושרת-לתורם (spId) נראית לעובד/ת רק אם התורם בייעודה; אירוע
 * לא-מקושר (חוג/כללי) נשאר; allowed=null (מנהל/בעלים) ⇒ הכל, ביט-זהה.
 */
import { describe, expect, it } from 'vitest';
import { visibleEventsForDesignations } from '../lib';

const supporters = [
  { id: 's1', forWho: 'אסתי סגל' },
  { id: 's2', forWho: 'קרן אחרת' },
  { id: 's3', forWho: '' }, // בלי ייעוד
];
const events = [
  { id: 'e1', spId: 's1' }, // תורם של אסתי
  { id: 'e2', spId: 's2' }, // תורם של ייעוד אחר
  { id: 'e3', spId: 's3' }, // תורם בלי ייעוד
  { id: 'e4' }, // אירוע כללי (חוג/משפחה) — בלי spId
  { id: 'e5', spId: 'ghost' }, // תורם שנמחק
];

describe('🔐 ratchet — סינון תזכורות-יומן פר-עובדת', () => {
  it('עובדת מוגבלת לאסתי — רואה רק את e1 (שלה) + e4 (כללי)', () => {
    const out = visibleEventsForDesignations(events, supporters, ['אסתי סגל']).map((e) => e.id);
    expect(out).toEqual(['e1', 'e4']);
    // לא רואה תורם-של-ייעוד-אחר, לא תורם-בלי-ייעוד (הכרעת 19.8 — עובד-סגור), לא תורם-רפאים
    expect(out).not.toContain('e2');
    expect(out).not.toContain('e3');
    expect(out).not.toContain('e5');
  });

  it('מנהל/בעלים (allowed=null) — רואה הכל, ביט-זהה', () => {
    expect(visibleEventsForDesignations(events, supporters, null).map((e) => e.id)).toEqual(['e1', 'e2', 'e3', 'e4', 'e5']);
    expect(visibleEventsForDesignations(events, supporters, []).length).toBe(5);
  });
});
