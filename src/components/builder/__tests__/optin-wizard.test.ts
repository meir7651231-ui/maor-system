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
import { removedFeatures } from '../handoff';
import { DEFAULT_CONFIG } from '../../../types/config';
import type { OrgConfig } from '../../../types/config';
import wizardSrc from '../BuilderWizard.tsx?raw';
import platformPanelSrc from '../../platform/PlatformPanel.tsx?raw';
// הרשימה חולצה ל-optin-keys.ts (21.8) — משותפת לראצ'ט-הסריקה הדו-צדדי optin-registry
import { OPT_IN_KEYS } from './optin-keys';

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

  it('דף-המסירה: דגל-opt-in חסר = "הוסר מהחבילה" (removedFeatures דרך featureEffectiveOn)', () => {
    // הבאג (21.8, ממצא-נחיל): removedFeatures קרא גולמית `=== false` ⇒ לקוח בלי
    // המפתח supporters.cockpit קיבל דף-מסירה שמרמז שהקוקפיט **נמסר** לו.
    const missing = removedFeatures(cfg({})).map((f) => f.key);
    expect(missing).toContain('supporters.cockpit'); // חסר ⇒ כבוי ⇒ לא-נמסר
    expect(missing).toContain('supporters.hokbulk');
    expect(missing).not.toContain('supporters.rfm'); // דגל-רגיל חסר = דלוק = נמסר
    const withCockpit = removedFeatures(cfg({ 'supporters.cockpit': true })).map((f) => f.key);
    expect(withCockpit).not.toContain('supporters.cockpit'); // הודלק ⇒ נמסר
  });

  it('הגנת-מקור: גם צ׳יפי-הדגלים בלוח-הבקרה (PlatformPanel) עוברים featureEffectiveOn', () => {
    // הבאג (21.8, ממצא-נחיל): הצ'יפ קרא `!== false` וכתב `=== false` — לכל 13
    // דגלי-ה-opt-in הצ'יפ היה הפוך: ארגון-חדש (all-off) הציג 🟢 על מסך כבוי,
    // ולחיצת-"הדלקה" כתבה ערך שאינו true ⇒ הבעלים לא יכול היה להדליק מהלוח.
    expect(platformPanelSrc).toContain('on={featureEffectiveOn(cfg, f)}');
    expect(platformPanelSrc).not.toContain('on={cfg.features?.[f.key] !== false}');
    // הדלקת-opt-in חייבת לכתוב true מפורש (שיקוף setFeatures של האשף)
    expect(platformPanelSrc).toContain('features[f.key] = true');
  });
});
