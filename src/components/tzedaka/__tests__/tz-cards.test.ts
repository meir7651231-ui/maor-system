/**
 * ratchet — כרטיסי הרכזים והקופות (קופות 4).
 * הגנות-מקור: מוסכמת "➕ הוספת <termOf>" (חוזה ה-e2e) + ratchet-בידוד:
 * CollectModal לא מייבא כלום מ-supporters/receipt (הכסף לא הופך קבלה).
 */
import { describe, expect, it } from 'vitest';
import tabSrc from '../CoordinatorsTab.tsx?raw';
import cardSrc from '../CoordinatorCard.tsx?raw';
import collectSrc from '../CollectModal.tsx?raw';

describe('🪙 ratchet — קופות 4: כרטיסים', () => {
  it('כפתורי ההוספה במוסכמת "➕ הוספת <termOf>" (חוזה ה-e2e)', () => {
    expect(tabSrc).toMatch(/➕ הוספת \{termOf\(config, 'entity\.tzCoordinator', 'רכז'\)\}/);
    expect(cardSrc).toMatch(/➕ הוספת \{termOf\(config, 'entity\.tzBox', 'קופה'\)\}/);
  });

  it('🛡 בידוד: CollectModal לא נוגע בעולם התרומות/הקבלות (הכרעת בעלים 30.7)', () => {
    expect(collectSrc).not.toMatch(/from '.*supporters/);
    expect(collectSrc).not.toMatch(/from '.*receipt/);
    expect(collectSrc).not.toContain('addDonation');
    expect(collectSrc).not.toContain('downloadReceipt');
    expect(collectSrc).toContain('addTzCollection');
  });

  it('החזרה למשרד משנה סטטוס בלבד (ההיסטוריה נשארת) והמחיקה ב-useArmed', () => {
    expect(cardSrc).toContain("upsertTzBox({ ...b, status: 'office' })");
    expect(cardSrc).not.toMatch(/famId:\s*''.*status:\s*'office'/);
    expect(cardSrc).toContain("confirmTwice('tzb-' + b.id");
  });
});
