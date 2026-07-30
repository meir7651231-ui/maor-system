/**
 * ratchet — ביקורת מורחבת (P2 פער 22, feature settings.audit.extra).
 *
 * שתי בדיקות חדשות במנוע runAudit, בקטגוריות הקיימות:
 * - קשר: יעד-קשר של תומכ/ת שכבר עבר (nextDate < todayIso).
 * - לוגיקה: תרומה בסכום אפס/שלילי (מזוהה לפי rid).
 * todayIso מוזרק (טוהר — בלי שעון פנימי); extra=false מכבה את שתיהן.
 */
import { describe, expect, it } from 'vitest';
import { runAudit } from '../audit';
import { emptyDb, type Db, type Supporter } from '../../types/domain';

const TODAY = '2026-07-30';

function supporter(id: string, name: string, over: Partial<Supporter> = {}): Supporter {
  return {
    id,
    name,
    phone: '',
    email: '',
    address: '',
    idNum: '',
    cat: '',
    forWho: '',
    notes: '',
    count: 0,
    ils: 0,
    usd: 0,
    first: '',
    last: '',
    nextDate: '',
    donations: [],
    ...over,
  };
}

function db(supporters: Supporter[]): Db {
  return { ...emptyDb(), supporters };
}

describe('🔍 ratchet — ביקורת מורחבת (settings.audit.extra)', () => {
  it('יעד-קשר שעבר מדווח בקטגוריית קשר; עתידי והיום עצמו — לא', () => {
    const d = db([
      supporter('s1', 'פרידמן', { nextDate: '2026-07-01' }),
      supporter('s2', 'ברוכים', { nextDate: '2026-08-15' }),
      supporter('s3', 'כהן', { nextDate: TODAY }),
    ]);
    const found = runAudit(d, TODAY).filter((i) => i.cat === 'קשר' && i.title.includes('עבר יעד הקשר'));
    expect(found).toHaveLength(1);
    expect(found[0].title).toBe('עבר יעד הקשר של "פרידמן" (2026-07-01)');
    expect(found[0].spId).toBe('s1');
  });

  it('בלי todayIso (קריאה ישנה) — בדיקת יעד-הקשר מדולגת', () => {
    const d = db([supporter('s1', 'פרידמן', { nextDate: '2026-07-01' })]);
    expect(runAudit(d).some((i) => i.title.includes('עבר יעד הקשר'))).toBe(false);
  });

  it('תרומה בסכום 0 ושלילי מדווחות בלוגיקה; חיובית לא', () => {
    const d = db([
      supporter('s1', 'פרידמן', {
        count: 3,
        ils: 100,
        donations: [
          { rid: 'D-1', date: '2026-01-01', amount: 100, cur: '₪', cat: 'כללי' },
          { rid: 'D-2', date: '2026-02-01', amount: 0, cur: '₪', cat: 'כללי' },
          { rid: 'D-3', date: '2026-03-01', amount: -50, cur: '₪', cat: 'כללי' },
        ],
      }),
    ]);
    const found = runAudit(d, TODAY).filter((i) => i.cat === 'לוגיקה' && i.title.includes('תרומה בסכום'));
    expect(found).toHaveLength(2);
    expect(found[0].title).toBe('תרומה בסכום 0 אצל "פרידמן" (D-2)');
    expect(found[1].title).toBe('תרומה בסכום -50 אצל "פרידמן" (D-3)');
    expect(found.every((i) => i.spId === 's1')).toBe(true);
  });

  it('extra=false (הדגל כבוי) — שתי הבדיקות החדשות לא רצות', () => {
    const d = db([
      supporter('s1', 'פרידמן', {
        nextDate: '2026-07-01',
        donations: [{ rid: 'D-1', date: '2026-01-01', amount: 0, cur: '₪', cat: 'כללי' }],
      }),
    ]);
    const found = runAudit(d, TODAY, false);
    expect(found.some((i) => i.title.includes('עבר יעד הקשר'))).toBe(false);
    expect(found.some((i) => i.title.includes('תרומה בסכום'))).toBe(false);
  });
});
