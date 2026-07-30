/**
 * ratchet — תיקוני הצילומים (חנות 16, הכרעת בעלים 15).
 * RedeemModal מותאם-סוג: פגישה בלי שדות כסף; קופון בלי שדה שווי;
 * בורר השנה העברית בלי סוגריים + unicode-bidi; שורת הפעולות עם wrap.
 */
import { describe, expect, it } from 'vitest';
import redeemSrc from '../RedeemModal.tsx?raw';
import hebDateSrc from '../../HebDateInput.tsx?raw';
import tabSrc from '../AssignmentsTab.tsx?raw';

describe('🛍 ratchet — חנות 16: תיקוני שטח', () => {
  it('RedeemModal מסתעף לפי kind — פגישה בלי כסף (paid/value=0), קופון בלי שדה שווי', () => {
    expect(redeemSrc).toContain("kind === 'meeting'");
    // שדות הכסף ושורת המחיר מגודרים !isMeeting; השווי מגודר גם !isCoupon
    expect(redeemSrc).toMatch(/\{!isMeeting && \(\s*<Field label='לתשלום/);
    expect(redeemSrc).toMatch(/\{!isMeeting && !isCoupon && \(\s*<Field label='שווי שנמסר/);
    expect(redeemSrc).toMatch(/const paid = isMeeting \? 0 :/);
    expect(redeemSrc).toMatch(/const value = isMeeting \? 0 : isCoupon \? c\.value :/);
    expect(redeemSrc).toMatch(/\{!isMeeting && \(\s*<div[^>]*>\s*\{'מחיר מלא/);
  });

  it('בורר השנה העברית: תווית בלי סוגריים (RLM + ·) ו-unicode-bidi על ה-select', () => {
    expect(hebDateSrc).toContain('unicodeBidi');
    expect(hebDateSrc).toContain("' · ' + yy");
    expect(hebDateSrc).not.toContain("' (' + yy + ')'");
  });

  it('מובייל: שורת הפעולות בכרטיס השיוך עם flexWrap + gap אחיד', () => {
    expect(tabSrc).toMatch(/marginInlineStart: 'auto', display: 'flex', flexWrap: 'wrap', gap: 6/);
  });
});
