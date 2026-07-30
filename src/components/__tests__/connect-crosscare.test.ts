/**
 * ratchet — CONNECT חיבור 3: מונה "דורש טיפול" של העמודות במסך הבית.
 * מונה-עם-קפיצה בלבד (חריג-תצוגה מבוקר, הכרעת בעלים) — אין פירוט פריטים
 * במסך הבית; דגל home.crosscare + moduleOn; כבוי ⇒ 0 ⇒ אפס צ'יפים.
 */
import { describe, expect, it } from 'vitest';
import { careCounts } from '../home/homeData';
import { DEFAULT_CONFIG } from '../../types/config';
import { emptyDb, type Db } from '../../types/domain';
import widgetsSrc from '../home/widgets.tsx?raw';

// קופה ישנה (stale) + פריט חנות שאזל — פריט טיפול אחד בכל עמודה
const db: Db = {
  ...emptyDb(),
  tzBoxes: [
    { id: 'tzb1', num: '1', coordinatorId: 'tzc1', famId: 'f1', holderKind: '', since: '2026-01-01', status: 'home', notes: '', collections: [] } as unknown as Db['tzBoxes'][number],
  ],
  shopItems: [
    { id: 'shi1', name: 'מתנה', kind: 'gift', storeId: '', value: 100, basePrice: 0, stock: 0, active: true, notes: '' } as unknown as Db['shopItems'][number],
  ],
};

describe('🔌 ratchet — חיבור 3: מונה טיפול חוצה-עמודות', () => {
  it('careCounts סופר את needsCare של שתי העמודות', () => {
    const counts = careCounts(db, '2026-07-30', DEFAULT_CONFIG);
    expect(counts.tzedaka).toBeGreaterThan(0);
    expect(counts.shop).toBeGreaterThan(0);
  });

  it('דגל כבוי ⇒ אפס; מודול כבוי ⇒ אפס לאותה עמודה בלבד', () => {
    const flagOff = { ...DEFAULT_CONFIG, features: { 'home.crosscare': false } };
    expect(careCounts(db, '2026-07-30', flagOff)).toEqual({ tzedaka: 0, shop: 0 });
    const tzOff = { ...DEFAULT_CONFIG, modules: { ...DEFAULT_CONFIG.modules, tzedaka: false } };
    const counts = careCounts(db, '2026-07-30', tzOff);
    expect(counts.tzedaka).toBe(0);
    expect(counts.shop).toBeGreaterThan(0);
  });

  it('הגנת-מקור: צ\'יפים רק כשהמונה חיובי, לחיצה = קפיצה לעמודה — בלי פירוט', () => {
    expect(widgetsSrc).toContain('crossCare.tzedaka > 0');
    expect(widgetsSrc).toContain('crossCare.shop > 0');
    expect(widgetsSrc).toMatch(/go\('tzedaka'\)/);
    expect(widgetsSrc).toMatch(/go\('shop'\)/);
    // אין פירוט פריטי עמודות במסך הבית — הווידג'ט לא קורא needsCare ישירות
    expect(widgetsSrc).not.toContain('needsCare(');
  });
});
