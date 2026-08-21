/**
 * ratchet — סינון 'בסיכון נטישה' במסך-הנתונים (swarm-audit 21.8).
 *
 * 🐛 הבאג: matchSegment('atrisk') הריץ את cockpitAtRisk — סינון+מיון מלא עם
 * פרסור-תאריכים — **פר-תורם** בתוך filter של SupportersView ⇒ O(n²) על כל
 * הקשה/רנדר. התיקון: atRiskIdSet מחושב פעם-אחת (useMemo ברכיב) ומוזרק
 * ל-matchSegment. הבדיקות נועלות: (א) שקילות מלאה בין המסלול הממומאז למסלול
 * הישיר; (ב) הגנת-מקור — הרכיב באמת ממאמן ומזריק, ולא חוזר לחישוב-פר-פריט.
 */
import { describe, expect, it } from 'vitest';
import viewSrc from '../SupportersView.tsx?raw';
import { atRiskIdSet, matchSegment } from '../segments';
import { cockpitAtRisk } from '../cockpit';
import type { Supporter } from '../../../types/domain';

const TODAY = '2026-08-21';

function sup(id: string, over: Partial<Supporter> = {}): Supporter {
  return {
    id, name: 'תורם ' + id, phone: '', email: '', address: '', idNum: '', cat: '', forWho: '',
    notes: '', count: 0, ils: 0, usd: 0, first: '', last: '', nextDate: '', donations: [], ...over,
  };
}

const DATA: Supporter[] = [
  // שקט 100 יום, בלי יעד ⇒ בסיכון
  sup('risk', { count: 2, last: '2026-05-13', donations: [{ rid: 'D-1', date: '2026-05-13', amount: 100, cur: '₪', cat: '' }] }),
  // טרי ⇒ לא בסיכון
  sup('fresh', { count: 1, last: '2026-08-15', donations: [{ rid: 'D-2', date: '2026-08-15', amount: 100, cur: '₪', cat: '' }] }),
  // שקט אבל עם יעד-קשר ⇒ מטופל דרך השיחות, לא בסיכון
  sup('nexted', { count: 1, last: '2026-01-01', nextDate: '2026-09-01', donations: [{ rid: 'D-3', date: '2026-01-01', amount: 100, cur: '₪', cat: '' }] }),
  // לא נתן מעולם ⇒ לא בסיכון
  sup('never'),
];

describe('🐛 ratchet — atrisk: Set ממומאז ≡ המסלול הישיר (שקילות מלאה)', () => {
  it('matchSegment עם atRiskIdSet מחזיר בדיוק את אותה תשובה כמו בלעדיו', () => {
    const ids = atRiskIdSet(DATA, TODAY);
    for (const sp of DATA) {
      const direct = matchSegment(sp, 'atrisk', DATA, TODAY, 3.7);
      const viaSet = matchSegment(sp, 'atrisk', DATA, TODAY, 3.7, ids);
      expect(viaSet).toBe(direct);
    }
  });

  it('atRiskIdSet ≡ מזהי cockpitAtRisk (מקור-אמת יחיד — אין אוכלוסייה שנייה)', () => {
    const ids = atRiskIdSet(DATA, TODAY);
    expect([...ids].sort()).toEqual(cockpitAtRisk(DATA, TODAY).map((s) => s.id).sort());
    expect(ids.has('risk')).toBe(true);
    expect(ids.has('fresh')).toBe(false);
    expect(ids.has('nexted')).toBe(false);
    expect(ids.has('never')).toBe(false);
  });
});

describe('🛡 הגנת-מקור — SupportersView ממאמן פעם-אחת ולא מחשב פר-פריט', () => {
  it('ה-Set מחושב ב-useMemo ומוזרק ל-matchSegment', () => {
    expect(viewSrc).toContain('atRiskIdSet(db.supporters, today)');
    expect(viewSrc).toContain('matchSegment(sp, segF, visibleBase, today, rate, atRiskIds)');
  });

  it('אין קריאה ישירה ל-cockpitAtRisk בתוך גוף-הסינון של המסך (החישוב נשאר במנוע)', () => {
    // הרכיב לא אמור לייבא/לקרוא cockpitAtRisk בעצמו — הכול דרך segments.atRiskIdSet
    expect(viewSrc).not.toContain('cockpitAtRisk(');
  });
});
