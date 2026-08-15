/**
 * ratchet — קופה רושמת גל-2: משמרת / סגירת-קופה (Z). הגנת-מקור על החיווט.
 * הכל מבודד (localStorage פר-ארגון nsLsKey) — אפס נגיעה בכספי-האמת.
 */
import { describe, expect, it } from 'vitest';
import src from '../CashRegister.tsx?raw';

describe('🗂 ratchet — קופה רושמת גל-2: משמרת/סגירה (הגנת-מקור)', () => {
  it('פתיחת-משמרת + סגירה-בספירה + דוח-Z', () => {
    expect(src).toContain('function openShift');
    expect(src).toContain('function doClose');
    expect(src).toContain('פתיחת משמרת');
    expect(src).toContain('סגירת קופה (ספירה)');
    expect(src).toContain('דוח סגירת-קופה (Z)');
  });

  it('מתמטיקת-המשמרת מהמנוע הטהור (expectedDrawer/drawerDiff/countsTotal)', () => {
    expect(src).toContain('expectedDrawer(shift.float, sales)');
    expect(src).toContain('drawerDiff(counted, expected)');
    expect(src).toContain('countsTotal(drawerCounts)');
  });

  it('בידוד: מפתחות-משמרת פר-ארגון (nsLsKey) — לא נוגע ב-DB/כספי-האמת', () => {
    expect(src).toContain('nsLsKey(LS_SHIFT)');
    expect(src).toContain('nsLsKey(LS_SHIFT_LOG)');
    // לוח-ההקשה המשותף (תשלום + ספירת-מגירה) נשאר רכיב אחד
    expect(src).toContain('function DenomPad');
    expect(src).toContain('<DenomPad counts={drawerCounts}');
    expect(src).toContain('<DenomPad counts={counts}');
  });
});
