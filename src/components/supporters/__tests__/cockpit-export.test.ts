/**
 * ratchet — ייצוא תור-המשימות של הקוקפיט (CSV + טקסט-להעתקה). נגזרת טהורה של
 * cockpitQueue; קריאה-בלבד. הייצוא בפועל עובר דרך downloadCsv (שער-core.export קיים).
 */
import { describe, expect, it } from 'vitest';
import { cockpitCsvRows, cockpitQueue, cockpitWorkListText } from '../cockpit';
import cockpitSrc from '../SupportersCockpit.tsx?raw';
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

describe('💛 ratchet — ייצוא תור-המשימות', () => {
  const data = [
    sup({ id: 'o', name: 'עוברת', phone: '050-1', nextDate: '2026-08-01' }),
    sup({ id: 't', name: 'תודה', count: 1, donations: [don({ date: TODAY, amount: 80 })] }),
    sup({ id: 'h', name: 'הוק', hok: hok({ amount: 120, day: 2 }) }),
  ];
  const q = cockpitQueue(data, TODAY);

  it('cockpitCsvRows: כותרת + שורה למשימה, בסדר-ההצגה', () => {
    const rows = cockpitCsvRows(q);
    expect(rows[0]).toEqual(['קבוצה', 'שם', 'טלפון', 'סיבה']);
    expect(rows.length).toBe(q.total + 1);
    // שורה ראשונה = שיחה (סדר-ההצגה: call→thanks→hok)
    expect(rows[1][0]).toBe('שיחה');
    expect(rows[1][1]).toBe('עוברת');
    expect(rows[1][2]).toBe('050-1');
  });

  it('cockpitWorkListText: שורה למשימה עם אייקון-קבוצה, שם, טלפון וסיבה', () => {
    const text = cockpitWorkListText(q);
    const lines = text.split('\n');
    expect(lines.length).toBe(q.total);
    expect(lines[0]).toContain('📞 שיחה');
    expect(lines[0]).toContain('עוברת');
    expect(text).toContain('💛 תודה');
    expect(text).toContain('🔁 הו״ק');
  });

  it('תור ריק ⇒ CSV כותרת-בלבד, טקסט ריק', () => {
    const empty = cockpitQueue([], TODAY);
    expect(cockpitCsvRows(empty).length).toBe(1);
    expect(cockpitWorkListText(empty)).toBe('');
  });

  it('🛡 הקוקפיט מחווט ל-CSV/העתקה דרך המנוע + downloadCsv (שער-export)', () => {
    expect(cockpitSrc).toContain('cockpitCsvRows(queue)');
    expect(cockpitSrc).toContain('cockpitWorkListText(queue)');
    expect(cockpitSrc).toContain('downloadCsv(');
    expect(cockpitSrc).toContain('⬇ CSV');
    expect(cockpitSrc).toContain('📋 העתקה');
  });
});
