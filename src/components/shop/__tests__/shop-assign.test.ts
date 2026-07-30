/**
 * ratchet — מוטבים ומימוש (חנות 5).
 * הגנות-מקור: אפס import מעולם הקבלות/התרומות ב-AssignmentsTab/RedeemModal;
 * RedeemModal מציג ומאכלס מ-effectivePrice; טופס השיוך במוסכמת ➕ הוספת.
 */
import { describe, expect, it } from 'vitest';
import tabSrc from '../AssignmentsTab.tsx?raw';
import formSrc from '../AssignmentForm.tsx?raw';
import redeemSrc from '../RedeemModal.tsx?raw';

describe('🛍 ratchet — חנות 5: מוטבים ומימוש', () => {
  it('🛡 בידוד: אפס נגיעה בעולם התרומות/הקבלות (הכרעת בעלים 30.7)', () => {
    for (const src of [tabSrc, formSrc, redeemSrc]) {
      expect(src).not.toMatch(/from '.*supporters/);
      expect(src).not.toMatch(/from '.*receipt/);
      expect(src).not.toContain('addDonation');
      expect(src).not.toContain('downloadReceipt');
    }
    expect(redeemSrc).toContain('addShopRedemption');
  });

  it('RedeemModal: המחיר מאוכלס מ-effectivePrice ומוצג פירוק "מחיר מלא − הנחה"', () => {
    expect(redeemSrc).toContain('effectivePrice(c.basePrice, a.criterionIds, criteria)');
    expect(redeemSrc).toContain('מחיר מלא ');
    expect(redeemSrc).toContain('נרשם מימוש — שולם ');
  });

  it('כפתור ההוספה במוסכמת "➕ הוספת <termOf>" (חוזה ה-e2e) והנחה אפקטיבית בטופס', () => {
    expect(tabSrc).toMatch(/➕ הוספת \{termOf\(config, 'entity\.shopAssignment', 'שיוך'\)\}/);
    expect(formSrc).toContain('הנחה אפקטיבית: ');
    // inline-create בדפוס הקופות — רשומות CRM אמיתיות דרך ה-store הקיים
    expect(formSrc).toContain('upsertFamily');
    expect(formSrc).toContain('upsertMember');
    expect(formSrc).toContain("featureOn(config, 'shop.inlinecreate')");
  });
});
