/**
 * ratchet · דגלי-opt-in באשף (20.8.2026, שאלת-בעלים "כמה מהאפשרויות נמצא באשף"):
 *
 * הבאג שנתפס: ארבעת מסכי-התורמים החדשים (קוקפיט/מודיעין/גלקסיה/ריברנד) נגדרו
 * בקוד כ-opt-in מפורש (`features[key] === true` — חסר=כבוי, הפוך מחוזה-הדגלים)
 * אבל (א) לא הופיעו כלל ב-FEATURES ⇒ לא היו באשף בכלל, ו-(ב) מנגנון-ההדלקה של
 * האשף (setFeatures) "מדליק" ע"י מחיקת-המפתח — מה שמשאיר דגל-opt-in כבוי לנצח,
 * וגם featureEffectiveOn הציג אותם כ"דלוקים" כשהם חסרים. כלומר: הבעלים לא יכול
 * היה להדליק את המסכים מהאשף בשום דרך.
 */
import { describe, it, expect } from 'vitest';
import { FEATURES } from '../../../types/features';
import { featureEffectiveOn } from '../sections';
import { DEFAULT_CONFIG } from '../../../types/config';
import type { OrgConfig } from '../../../types/config';
import wizardSrc from '../BuilderWizard.tsx?raw';

const OPT_IN_KEYS = [
  'supporters.cockpit',
  'supporters.intel',
  'supporters.galaxy',
  'supporters.rebrand',
  'supporters.card',
  'courses.cockpit',
  // גל ה׳ — מסכי-החוגים החדשים מגודרים `=== true` בקוד ⇒ חייבים optIn:true באשף
  'courses.teacherapp',
  'courses.parentcard',
  'courses.ai',
  // שער-הצטרפות בעמוד-השיווק — opt-in מפורש
  'shell.portal',
];

function cfg(features: Record<string, boolean>): OrgConfig {
  return { ...DEFAULT_CONFIG, modules: { ...DEFAULT_CONFIG.modules }, features };
}

describe('דגלי-opt-in חשופים באשף עם הסמנטיקה הנכונה', () => {
  it('כל מסכי-ה-opt-in מוגדרים ב-FEATURES עם optIn:true', () => {
    for (const k of OPT_IN_KEYS) {
      const def = FEATURES.find((f) => f.key === k);
      expect(def, k + ' חסר ב-FEATURES — לא יופיע באשף').toBeTruthy();
      expect(def!.optIn, k + ' בלי optIn:true — האשף יציג/יכתוב הפוך').toBe(true);
    }
  });

  it('optIn חסר = כבוי (לא "דלוק" כמו דגל רגיל); true מפורש = דלוק; false = כבוי', () => {
    const def = FEATURES.find((f) => f.key === 'supporters.cockpit')!;
    expect(featureEffectiveOn(cfg({}), def)).toBe(false);
    expect(featureEffectiveOn(cfg({ 'supporters.cockpit': true }), def)).toBe(true);
    expect(featureEffectiveOn(cfg({ 'supporters.cockpit': false }), def)).toBe(false);
  });

  it('דגל רגיל שומר על החוזה הישן — חסר = דלוק', () => {
    const def = FEATURES.find((f) => f.key === 'supporters.rfm')!;
    expect(featureEffectiveOn(cfg({}), def)).toBe(true);
    expect(featureEffectiveOn(cfg({ 'supporters.rfm': false }), def)).toBe(false);
  });

  it('הגנת-מקור: setFeatures כותב true מפורש לדגלי-opt-in (לא מוחק את המפתח)', () => {
    expect(wizardSrc).toContain('optIn.has(k)');
    expect(wizardSrc).toContain('features[k] = true');
  });

  it('הגנת-מקור: תצוגת-המתג (on=) ומונה-היכולות נהוגים מ-featureEffectiveOn (לא !== false)', () => {
    // אחרת דגל-opt-in חסר מוצג ✅ דלוק בעוד הקוד קורא אותו ככבוי — הבעלים מבולבל
    // ולחיצה-אחת לא מדליקה (צריך לכבות-ואז-להדליק). המתג חייב להתחיל כבוי.
    expect(wizardSrc).toContain('on={featureEffectiveOn(config, f)}');
    expect(wizardSrc).toContain('feats.filter((f) => featureEffectiveOn(config, f)).length');
    expect(wizardSrc).not.toContain('on={config.features?.[f.key] !== false}');
  });
});
