/**
 * ratchet — כרטיסי הקטלוג (חנות 4).
 * הגנות-מקור: מוסכמת "➕ הוספת <termOf>" (חוזה ה-e2e) + ratchet-בידוד:
 * ProductForm לא מייבא כלום מעולם הקבלות/התרומות (שווי ≠ קבלה).
 */
import { describe, expect, it } from 'vitest';
import catalogSrc from '../CatalogTab.tsx?raw';
import productSrc from '../ProductForm.tsx?raw';
import storesSrc from '../StoresPanel.tsx?raw';
import criteriaSrc from '../CriteriaPanel.tsx?raw';

describe('🛍 ratchet — חנות 4: הקטלוג', () => {
  it('כפתורי ההוספה במוסכמת "➕ הוספת <termOf>" (חוזה ה-e2e)', () => {
    expect(catalogSrc).toMatch(/➕ הוספת \{termOf\(config, 'entity\.shopProduct', 'מוצר'\)\}/);
    expect(storesSrc).toMatch(/➕ הוספת ' \+ termOf\(config, 'entity\.shopStore', 'חנות'\)/);
    expect(criteriaSrc).toMatch(/➕ הוספת ' \+ termOf\(config, 'entity\.shopCriterion', 'קריטריון'\)/);
  });

  it('🛡 בידוד: ProductForm לא נוגע בעולם התרומות/הקבלות (הכרעת בעלים 30.7)', () => {
    for (const src of [productSrc, catalogSrc, storesSrc, criteriaSrc]) {
      expect(src).not.toMatch(/from '.*supporters/);
      expect(src).not.toMatch(/from '.*receipt/);
      expect(src).not.toContain('addDonation');
      expect(src).not.toContain('downloadReceipt');
    }
    expect(productSrc).toContain('upsertShopProduct');
  });

  it('CriteriaPanel: כפתורי ההוספה-המהירה של הבעלים ממלאים טופס בלבד', () => {
    expect(criteriaSrc).toContain('יתום מאם');
    expect(criteriaSrc).toContain('יתום מאבא');
    // ההוספה-המהירה קוראת ל-setF (מילוי טופס) — לא ל-upsertShopCriterion ישירות
    expect(criteriaSrc).toMatch(/QUICK_FILL\.map[\s\S]{0,200}setF\(\{ name: q\.name/);
  });

  it('מחיקות הפאנלים ב-useArmed (shell.armdel)', () => {
    expect(storesSrc).toContain("confirmTwice('shs-' + s.id");
    expect(criteriaSrc).toContain("confirmTwice('shc-' + c.id");
    expect(catalogSrc).toContain("confirmTwice('shp-' + p.id");
  });
});
