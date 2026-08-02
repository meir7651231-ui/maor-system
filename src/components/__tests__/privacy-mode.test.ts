/**
 * ratchet — מצב צנעה (SHOP10 · shell.privacy). כפתור-כותרת שמסתיר מסכי
 * מקבלי-צדקה (פאנלי קופות/חנות/חלוקה + מוני-הבית) מעיון מזדמן. Runtime,
 * לא נשמר; אפס נגיעה בנתונים.
 */
import { describe, expect, it } from 'vitest';
import { useApp } from '../../store/useApp';
import appSrc from '../../App.tsx?raw';
import famDetailSrc from '../families/FamilyDetail.tsx?raw';
import widgetsSrc from '../home/widgets.tsx?raw';

describe('🕶️ ratchet — מצב צנעה', () => {
  it('togglePrivacy מחליף את המצב (runtime)', () => {
    const start = useApp.getState().privacyMode;
    useApp.getState().togglePrivacy();
    expect(useApp.getState().privacyMode).toBe(!start);
    useApp.getState().togglePrivacy();
    expect(useApp.getState().privacyMode).toBe(start);
  });

  it('הכפתור מגודר shell.privacy ופותח togglePrivacy', () => {
    expect(appSrc).toContain("featureOn(config, 'shell.privacy')");
    expect(appSrc).toContain('privacyGearBtn');
    expect(appSrc).toContain('privacySideBtn');
    expect(appSrc).toContain('onClick={togglePrivacy}');
  });

  it('כרטיס המשפחה מסתיר את פאנלי מקבלי-הצדקה במצב צנעה', () => {
    expect(famDetailSrc).toContain('privacyMode ? (');
    // הפאנלים חיים רק בענף ה-else (לא-צנעה)
    expect(famDetailSrc).toMatch(/privacyMode[\s\S]*מצב צנעה פעיל[\s\S]*TzFamilyPanel/);
  });

  it('מוני-הבית החוצי-עמודות מתאפסים במצב צנעה', () => {
    expect(widgetsSrc).toContain('privacyMode ? { tzedaka: 0, shop: 0, shop7: 0 }');
  });
});
