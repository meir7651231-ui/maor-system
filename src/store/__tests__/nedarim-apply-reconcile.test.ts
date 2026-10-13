/**
 * ביקורת-עומק 2.9 (כסף #2): סנכרון-נדרים הידני חישב תוכנית מתצלום-הכרטיסים ברגע
 * פתיחת-המודאל וכתב אותה גורפת ב-apply. תרומה/קבלה שנרשמה בזמן שהמודאל פתוח
 * (טאב אחר / ענן) הייתה נדרסת — קבלת-מס בלי רשומה. עכשיו ה-apply ממזג מול המאגר-החי.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { reconcileNedarimApply } from '../useApp';
import type { Supporter } from '../../types/domain';

const sup = (id: string, extra: Partial<Supporter> = {}): Supporter =>
  ({ id, name: 'תורם ' + id, donations: [], count: 0, ils: 0, usd: 0, ...extra }) as unknown as Supporter;
const don = (rid: string, amount = 100) => ({ rid, amount, currency: '₪', date: '2026-09-01', category: 'כללי' }) as unknown as Supporter['donations'][number];

describe('reconcileNedarimApply — מיזוג מול המאגר-החי ברגע-הלחיצה', () => {
  it('תרומה (rid) שנרשמה אחרי התצלום נשמרת; המונים לא יורדים', () => {
    const planned = [sup('a', { hist: [{ d: '2026-09-01', a: 50, txn: 't1' }] })];
    const live = [sup('a', { donations: [don('D-000123')], count: 1, ils: 100 })];
    const out = reconcileNedarimApply(live, planned);
    expect(out).toHaveLength(1);
    expect(out[0].donations.map((d) => d.rid)).toEqual(['D-000123']);
    expect(out[0].count).toBe(1);
    expect(out[0].ils).toBe(100);
    expect(out[0].hist?.map((h) => h.txn)).toEqual(['t1']);
  });

  it('רשומת-hist שנוספה בחי (חיבור-חי) ולא בתוכנית — מצורפת, בלי כפילות-txn', () => {
    const planned = [sup('a', { hist: [{ d: '2026-09-01', a: 50, txn: 't1' }, { d: '2026-09-02', a: 60, txn: 't2' }] })];
    const live = [sup('a', { hist: [{ d: '2026-09-01', a: 50, txn: 't1' }, { d: '2026-09-03', a: 70, txn: 't3' }] })];
    const out = reconcileNedarimApply(live, planned);
    expect(out[0].hist?.map((h) => h.txn).sort()).toEqual(['t1', 't2', 't3']);
  });

  it('כרטיס שנולד אחרי התצלום נשאר; כרטיס-חדש מהתוכנית נכנס', () => {
    const planned = [sup('a'), sup('new-from-plan')];
    const live = [sup('a'), sup('born-meanwhile')];
    const out = reconcileNedarimApply(live, planned);
    expect(out.map((s) => s.id).sort()).toEqual(['a', 'born-meanwhile', 'new-from-plan']);
  });

  it('ללא שינוי-בזמן-הפתיחה — התוכנית נכתבת כמות-שהיא (אותן הפניות)', () => {
    const a = sup('a', { hist: [{ d: '2026-09-01', a: 50, txn: 't1' }] });
    const planned = [a];
    const live = [sup('a')];
    const out = reconcileNedarimApply(live, planned);
    expect(out).toHaveLength(1);
    expect(out[0].hist).toBe(a.hist);
  });

  it('הגנת-מקור: applyNedarimSync עובר דרך reconcileNedarimApply מול db.supporters', () => {
    const src = readFileSync(new URL('../useApp.ts', import.meta.url), 'utf8');
    const body = src.match(/applyNedarimSync\(supporters, note\) \{([\s\S]*?)\n    \},/)?.[1] ?? '';
    expect(body).toContain('setDb((db) => ({ supporters: reconcileNedarimApply(db.supporters, supporters) }));');
    expect(body).not.toContain('setDb(() => ({ supporters }));');
  });
});
