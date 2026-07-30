/**
 * ratchet — armDel + קיצורי משפחות (P3 פריטים 19, 18).
 * פריט 19: useArmed — חלון 3.5ש׳ (ARM_DEL_MS) כמו armDel בלגאסי; הדגל
 * shell.armdel כבוי ⇒ window.confirm; כל ארבע המחיקות עברו לדפוס.
 * פריט 18: "⬆ ייבוא" + "✓ בדיקת נתונים" במסך המשפחות מאחורי families.shortcuts.
 */
import { describe, expect, it } from 'vitest';
import { ARM_DEL_MS } from '../useArmed';
import armedSrc from '../useArmed.ts?raw';
import famDetailSrc from '../families/FamilyDetail.tsx?raw';
import famPanelsSrc from '../families/FamilyPanels.tsx?raw';
import crsDetailSrc from '../courses/CourseDetail.tsx?raw';
import famViewSrc from '../families/FamiliesView.tsx?raw';

describe('🗑 ratchet — P3 armDel + קיצורים', () => {
  it('פריט 19: חלון 3.5ש׳ + fallback ל-confirm כשהדגל כבוי', () => {
    expect(ARM_DEL_MS).toBe(3500);
    expect(armedSrc).toMatch(/if \(!enabled\) return window\.confirm\(fallbackMsg\);/);
    expect(armedSrc).toMatch(/setTimeout\(\(\) => setArmed\(null\), ARM_DEL_MS\)/);
  });

  it('פריט 19: ארבע המחיקות עברו ל-confirmTwice (משפחה, בן משפחה, חוג, שיבוץ)', () => {
    expect(famDetailSrc).toContain("confirmTwice('fam-' + fam.id");
    expect(famDetailSrc).toContain("confirmTwice('mem-' + m.id");
    expect(crsDetailSrc).toContain("confirmTwice('crs-' + c.id");
    expect(famPanelsSrc).toContain("confirmTwice('enr-' + e.id");
    // אין window.confirm שנשאר במחיקות האלה
    expect(famDetailSrc).not.toContain('window.confirm');
    expect(famPanelsSrc).not.toContain('window.confirm');
    expect(crsDetailSrc).not.toContain('window.confirm');
  });

  it('פריט 18: הקיצורים במסך המשפחות מאחורי families.shortcuts, מנווטים לסקשן', () => {
    expect(famViewSrc).toContain("featureOn(config, 'families.shortcuts')");
    expect(famViewSrc).toContain('⬆ ייבוא');
    expect(famViewSrc).toContain('✓ בדיקת נתונים');
    expect(famViewSrc).toContain("goSettingsSection('sec-import')");
    expect(famViewSrc).toContain("goSettingsSection('sec-audit')");
  });
});
