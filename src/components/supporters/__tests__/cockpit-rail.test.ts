/**
 * ratchet — רצועת-הקוקפיט: סגמנטים-שמורים (segments.ts) + פעילות-חיה (cockpitFeed).
 * שניהם נגזרות טהורות של db.supporters הקיים — אפס שינוי-סכמה, קריאה-בלבד.
 */
import { describe, expect, it } from 'vitest';
import { SEGMENTS, matchSegment, segmentCounts } from '../segments';
import { cockpitFeed } from '../cockpit';
import cockpitSrc from '../SupportersCockpit.tsx?raw';
import viewSrc from '../SupportersView.tsx?raw';
import type { Donation, Hok, Supporter } from '../../../types/domain';

const TODAY = '2026-08-19';

function don(over: Partial<Donation>): Donation {
  return { rid: 'D-1', date: '2026-08-01', amount: 100, cur: '₪', cat: '', ...over };
}
function hok(over: Partial<Hok>): Hok {
  return { amount: 200, cur: '₪', day: 5, method: 'bank', note: '', active: true, startedAt: '2026-01-01', ...over };
}
function sup(over: Partial<Supporter>): Supporter {
  return {
    id: 's' + Math.random().toString(36).slice(2, 7),
    name: 'תורם', phone: '', email: '', address: '', idNum: '', cat: '', forWho: '', notes: '',
    count: 0, ils: 0, usd: 0, first: '', last: '', nextDate: '', donations: [], ...over,
  };
}

describe('💛 ratchet — סגמנטים שמורים', () => {
  it('segmentCounts: מונה-חי לכל חמשת הסגמנטים', () => {
    const data = [
      // זהב-שקט: ils 6000, שקט ~110 יום, בלי יעד ⇒ גם atrisk, גם goldsilent, גם ללא-אימייל
      sup({ id: 'gold', ils: 6000, count: 4, last: '2026-05-01' }),
      // הו״ק פעילה + אימייל + תרם החודש (12m)
      sup({ id: 'hok', email: 'a@b.c', count: 1, last: TODAY, donations: [don({ date: TODAY })], hok: hok({}) }),
      // תרם לפני שנתיים — לא 12m, בלי אימייל
      sup({ id: 'old', count: 1, last: '2024-01-01' }),
    ];
    const counts = segmentCounts(data, TODAY, 3.7);
    const by = Object.fromEntries(counts.map((c) => [c.key, c.count]));
    expect(by.goldsilent).toBe(1); // gold בלבד
    expect(by.hok).toBe(1); // hok בלבד
    expect(by.gave12m).toBe(2); // gold(מאי) + hok(היום); old מ-2024 בחוץ
    expect(by.noemail).toBe(2); // gold + old
    expect(by.atrisk).toBe(2); // gold + old — שניהם נתנו-בעבר, שקטים, בלי יעד
    // כל חמשת המפתחות מיוצגים
    expect(counts.map((c) => c.key).sort()).toEqual(['atrisk', 'gave12m', 'goldsilent', 'hok', 'noemail']);
  });

  it('matchSegment: פרדיקט-בודד — atrisk עוטף את מנוע-הקוקפיט', () => {
    const gold = sup({ id: 'g', ils: 6000, count: 3, last: '2026-05-01' });
    const fresh = sup({ id: 'f', email: 'x@y.z', count: 1, last: TODAY });
    const all = [gold, fresh];
    expect(matchSegment(gold, 'atrisk', all, TODAY)).toBe(true);
    expect(matchSegment(fresh, 'atrisk', all, TODAY)).toBe(false);
    expect(matchSegment(fresh, 'noemail', all, TODAY)).toBe(false);
    expect(matchSegment(gold, 'noemail', all, TODAY)).toBe(true);
  });

  it('הגדרות-הסגמנט יציבות (5 מובנות, מפתחות ייחודיים)', () => {
    expect(SEGMENTS.length).toBe(5);
    expect(new Set(SEGMENTS.map((s) => s.key)).size).toBe(5);
  });
});

describe('💛 ratchet — פעילות-חיה (cockpitFeed)', () => {
  it('מחזיר את האירועים האחרונים מהחדש לישן, עם שם וסכום', () => {
    const data = [
      sup({ id: 'a', name: 'אבי', count: 1, last: '2026-08-18', donations: [don({ date: '2026-08-18', amount: 500 })] }),
      sup({ id: 'b', name: 'בני', count: 1, last: '2026-08-10', donations: [don({ date: '2026-08-10', amount: 90 })] }),
    ];
    const feed = cockpitFeed(data, 8);
    expect(feed.length).toBeGreaterThanOrEqual(2);
    // החדש ראשון
    expect(feed[0].date >= feed[feed.length - 1].date).toBe(true);
    const avi = feed.find((f) => f.who === 'אבי');
    expect(avi?.what).toContain('₪500');
    expect(avi?.spId).toBe('a');
  });

  it('מכבד את מגבלת-האורך', () => {
    const data = Array.from({ length: 20 }, (_, i) =>
      sup({ id: 's' + i, name: 'n' + i, count: 1, last: '2026-08-01', donations: [don({ date: '2026-08-0' + (i % 9 || 1), amount: 10 })] }),
    );
    expect(cockpitFeed(data, 5).length).toBe(5);
  });
});

describe('💛 ratchet — חיווט הרצועה בקוקפיט', () => {
  it('🛡 הקוקפיט מציג סגמנטים ופעילות-חיה מהמנוע הטהור', () => {
    expect(cockpitSrc).toContain('segmentCounts(');
    expect(cockpitSrc).toContain('cockpitFeed(');
    expect(cockpitSrc).toContain('סגמנטים שמורים');
    expect(cockpitSrc).toContain('פעילות חיה');
  });

  it('🛡 לחיצה על סגמנט מנתבת למסך-הנתונים (onExit ⇐ setWorkMode(false))', () => {
    expect(cockpitSrc).toContain('onExit');
    expect(viewSrc).toContain('onExit={() => setWorkMode(false)}');
  });
});
