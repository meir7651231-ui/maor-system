/**
 * 👤 ratchet — פרופילי-תפקיד בקליק (VISION-LIGHT ‏#2, 23.8.2026).
 *
 * הבעיה: המנהל דפדף קיר-מודולים פר-עובדת. הפתרון: פרופיל בקליק שמלביש
 * מפת-מודולים שלמה — **באותה סמנטיקת הגבלה-בלבד** של כרטיס-העובד:
 * ‏false רק בתוך תקרת-הארגון, כל השאר בירושה. אפס אובדן-יכולת.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { presetMatches, presetModules, ROLE_PRESETS } from '../rolePresets';
import type { ModuleKey } from '../../../types/config';

const SCOPE: ModuleKey[] = ['families', 'courses', 'calendar', 'diary', 'supporters', 'reports'];

describe('👤 פרופילי-תפקיד — המנוע הטהור', () => {
  it('הפרופיל כותב false רק למוסתרים שבתקרת-הארגון; השאר בירושה', () => {
    const sec = ROLE_PRESETS.find((r) => r.key === 'secretary')!;
    const m = presetModules(sec, SCOPE);
    expect(m.supporters).toBe(false);
    expect(m.reports).toBe(false);
    // מודול מוסתר-בפרופיל שהבעלים לא הדליק בכלל — לא נכתב (אין מה להגביל)
    expect('tzedaka' in m).toBe(false);
    // מודול שהפרופיל משאיר — לא נכתב כלל (ירושה, לא true מפורש)
    expect('families' in m).toBe(false);
    expect('courses' in m).toBe(false);
  });

  it('"גישה מלאה" = מפה ריקה — הכול חוזר לירושת-הארגון', () => {
    const full = ROLE_PRESETS.find((r) => r.key === 'full')!;
    expect(presetModules(full, SCOPE)).toEqual({});
  });

  it('presetMatches מדגיש את הפרופיל הפעיל — ורגיש לכוונון-ידני', () => {
    const sec = ROLE_PRESETS.find((r) => r.key === 'secretary')!;
    const applied = presetModules(sec, SCOPE);
    expect(presetMatches(sec, applied, SCOPE)).toBe(true);
    // המנהל כוונן ידנית (הדליק חזרה תורמים) ⇒ כבר לא "מזכירה" טהורה
    expect(presetMatches(sec, { ...applied, supporters: true }, SCOPE)).toBe(false);
    // כרטיס ריק = גישה-מלאה
    const full = ROLE_PRESETS.find((r) => r.key === 'full')!;
    expect(presetMatches(full, undefined, SCOPE)).toBe(true);
    expect(presetMatches(full, applied, SCOPE)).toBe(false);
  });

  it('כל פרופיל משאיר לפחות מודול-עבודה אחד (לא מייצרים עובדת בלי מסכים)', () => {
    for (const r of ROLE_PRESETS) {
      const left = SCOPE.filter((m) => !r.hide.includes(m));
      expect(left.length, r.key).toBeGreaterThan(0);
    }
  });

  it('🔒 הגנת-מקור: הפאנל מחיל דרך נתיב-הכתיבה הקיים של כרטיס-העובד', () => {
    const src = readFileSync('src/components/platform/ManagerPanel.tsx', 'utf8');
    expect(src).toContain('applyRolePreset');
    // אותו צינור בדיוק כמו הצ'יפים — לא נתיב-כתיבה חדש
    expect(src).toMatch(/applyRolePreset[\s\S]{0,400}setEmployeeOverride\(org, email, \{ \.\.\.ov, modules: presetModules\(preset, scope\) \}\)/);
    expect(src).toContain('presetMatches(r, ov.modules, scope)');
  });
});
