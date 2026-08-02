/**
 * ratchet — מבט הנהלה (SHOP10 מדדי-הנהלה). אגרגציה טהורה חוצה-מודולים,
 * קריאה בלבד (אפס כתיבה/כסף חדש — רק סיכום קיים).
 */
import { describe, expect, it } from 'vitest';
import { emptyDb } from '../../../types/domain';
import type { Db } from '../../../types/domain';
import { managementMetrics } from '../management';
import mgmtSrc from '../management.tsx?raw';

function db(): Db {
  return {
    ...emptyDb(),
    families: [
      { status: 'active' } as Db['families'][number],
      { status: 'active' } as Db['families'][number],
      { status: 'pending' } as Db['families'][number],
    ],
    volunteers: [
      { id: 'v1', active: true } as Db['volunteers'][number],
      { id: 'v2', active: false } as Db['volunteers'][number],
    ],
    distributionDays: [{ id: 'd1' } as Db['distributionDays'][number]],
    deliveries: [
      { id: 'x1', familyId: 'f1', status: 'delivered' } as Db['deliveries'][number],
      { id: 'x2', familyId: 'f1', status: 'pickup' } as Db['deliveries'][number],
      { id: 'x3', familyId: 'f2', status: 'delivered' } as Db['deliveries'][number],
    ],
    shopAssignments: [
      { status: 'active', redemptions: [{ voidedAt: undefined, value: 100, paid: 30 }, { voidedAt: '2026-01-01', value: 50, paid: 0 }] } as Db['shopAssignments'][number],
      { status: 'done', redemptions: [{ voidedAt: undefined, value: 80, paid: 80 }] } as Db['shopAssignments'][number],
    ],
    shopIntakes: [{ cost: 40 } as Db['shopIntakes'][number], { cost: 10 } as Db['shopIntakes'][number]],
    tzBoxes: [
      { collections: [{ amount: 100 }, { amount: 50 }] } as Db['tzBoxes'][number],
      { collections: [{ amount: 25 }] } as Db['tzBoxes'][number],
    ],
    supporters: [
      { id: 's1', donations: [
        { rid: 'D-1', date: '', amount: 500, cur: '₪', cat: '', designation: 'אמץ משפחת כהן' },
        { rid: 'D-2', date: '', amount: 300, cur: '₪', cat: '', designation: 'אמץ משפחת כהן' },
        { rid: 'D-3', date: '', amount: 100, cur: '₪', cat: 'כללי' }, // בלי ייעוד — לא נספר
      ] } as Db['supporters'][number],
    ],
  };
}

const val = (groups: ReturnType<typeof managementMetrics>, title: string, metric: string) =>
  groups.find((g) => g.title === title)?.rows.find((r) => r[0] === metric)?.[1];

describe('📊 ratchet — מבט הנהלה', () => {
  const g = managementMetrics(db());

  it('חלוקה: ימים/מסירות/נמסרו/משפחות/מתנדבים', () => {
    expect(val(g, '🚚 חלוקה', 'ימי חלוקה')).toBe(1);
    expect(val(g, '🚚 חלוקה', 'מסירות סה"כ')).toBe(3);
    expect(val(g, '🚚 חלוקה', 'נמסרו')).toBe(2);
    expect(val(g, '🚚 חלוקה', 'משפחות שקיבלו')).toBe(2); // f1,f2 ייחודיים
    expect(val(g, '🚚 חלוקה', 'מתנדבים פעילים')).toBe(1); // v2 לא-פעיל
  });

  it('חנות: שיוכים פעילים + מימושים לא-מבוטלים', () => {
    expect(val(g, '🛍 חנות', 'שיוכים פעילים')).toBe(1);
    expect(val(g, '🛍 חנות', 'מימושים')).toBe(2); // המבוטל (voidedAt) לא נספר
  });

  it('קופות: ריקונים + סה"כ נאסף', () => {
    expect(val(g, '🪙 קופות צדקה', 'ריקונים')).toBe(3);
    expect(val(g, '🪙 קופות צדקה', 'סה"כ נאסף (₪)')).toBe(175);
  });

  it('משפחות פעילות', () => {
    expect(val(g, '👨‍👩‍👧 משפחות', 'משפחות פעילות')).toBe(2);
  });

  it('אימוצים (אמץ חתן) — קיבוץ פר-ייעוד; תרומה בלי ייעוד לא נספרת', () => {
    expect(val(g, '🤝 אימוצים (אמץ חתן)', 'אמץ משפחת כהן')).toContain('2 תרומות');
    expect(val(g, '🤝 אימוצים (אמץ חתן)', 'אמץ משפחת כהן')).toContain('800'); // 500+300
    expect(val(g, '🤝 אימוצים (אמץ חתן)', 'סה"כ אימוצים (₪)')).toBe(800);
  });

  it('התחשבנות (SHOP9) — שווי/נגבה/סבסוד/עלות-מלאי/מימון (מבוטל מוחרג)', () => {
    // given = 100 (active) + 80 (done) = 180; המבוטל (50) מוחרג
    expect(val(g, '💰 התחשבנות', 'שווי שחולק למוטבים')).toBe('₪180');
    expect(val(g, '💰 התחשבנות', 'נגבה מהמוטבים')).toBe('₪110'); // 30+80
    expect(val(g, '💰 התחשבנות', 'סבסוד נטו (העמותה ספגה)')).toBe('₪70'); // 180-110
    expect(val(g, '💰 התחשבנות', 'עלות רכש מלאי')).toBe('₪50'); // 40+10
    expect(val(g, '💰 התחשבנות', 'מימון אימוצים (הכנסה מיועדת)')).toBe('₪800');
  });

  it('🛡 קריאה-בלבד — אין כתיבה/מוני-קבלות במקור', () => {
    for (const kw of ['setDb', 'upsert', 'receiptSeq', 'donationSeq']) {
      expect(mgmtSrc).not.toContain(kw);
    }
  });
});
