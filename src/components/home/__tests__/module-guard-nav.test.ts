/**
 * ratchet · ניווט ממוגן-מודולים + טריות-קונפיג (swarm-audit 21.8.2026):
 *
 * #4  🎯 המשימות שלי (widgets) — הקפיצה-לכרטיס בדקה moduleOn? לא: טאפ נחת על
 *     מסך של מודול כבוי (בלי כניסת-ניווט, בלי דרך-חזרה). עכשיו: מגודר moduleOn
 *     פר-ענף + טוסט 'המודול כבוי' במקום ניווט.
 * #11 🔍 בדיקת-תקינות (AuditSection) — אותה מחלקה: לחיצת-ממצא ניווטה
 *     למשפחות/תורמים בלי moduleOn.
 * #8  ⌘K (App) — ה-effect קרא featureOn(config,'shell.palette') אבל התלויות היו
 *     [setPalette] בלבד ⇒ דחיפת-קונפיג חיה מהענן לא הגיעה ל-listener (closure ישן).
 * #10 מניפסט-בלוב (pwa) — נוצר blob-URL חדש בכל שינוי-קונפיג בלי לשחרר את
 *     הקודם ⇒ דליפה בטאב ארוך-חיים. עכשיו: revoke לפני יצירה (רק URL שלנו).
 */
import { describe, expect, it } from 'vitest';
import widgetsSrc from '../widgets.tsx?raw';
import auditSrc from '../../settings/AuditSection.tsx?raw';
import appSrc from '../../../App.tsx?raw';
import pwaSrc from '../../../lib/pwa.ts?raw';

describe('🛡 ratchet · ניווט ממוגן-מודולים + טריות-קונפיג (swarm-audit)', () => {
  it('#4 המשימות-שלי: הקפיצה מגודרת moduleOn עם טוסט "המודול כבוי"', () => {
    // הגנת-מקור: ה-jump גוזר את המודול מה-ref ובודק moduleOn לפני כל ניווט
    expect(widgetsSrc).toMatch(/const mod: ModuleKey = t\.ref\.kind === 'supporter' \? 'supporters' : t\.ref\.kind === 'family' \? 'families' : 'courses';/);
    expect(widgetsSrc).toContain("if (!moduleOn(ctx.config, mod)) {");
    expect(widgetsSrc).toContain("toast('המודול כבוי')");
  });

  it('#11 בדיקת-תקינות: לחיצת-ממצא מגודרת moduleOn (משפחות/תורמים) עם טוסט', () => {
    expect(auditSrc).toContain("if (moduleOn(config, 'families')) selectFamily(it.famId);");
    expect(auditSrc).toContain("if (moduleOn(config, 'supporters')) go('supporters');");
    expect(auditSrc).toContain("toast('המודול כבוי')");
    // הדפוס הישן — ניווט ישיר ב-ternary בלי גידור — לא חוזר
    expect(auditSrc).not.toContain("it.famId ? selectFamily(it.famId) : it.spId ? go('supporters') : undefined");
  });

  it('#8 ⌘K: ה-effect תלוי גם ב-config — דחיפת-קונפיג חיה מכבה/מדליקה את הפלטה', () => {
    expect(appSrc).toContain('}, [config, setPalette]);');
  });

  it('#10 מניפסט-בלוב: ה-URL הקודם משוחרר לפני יצירת חדש (אין דליפה)', () => {
    expect(pwaSrc).toContain('if (orgManifestUrl) URL.revokeObjectURL(orgManifestUrl);');
    expect(pwaSrc).toContain('orgManifestUrl = URL.createObjectURL(');
    // ה-href מקבל רק את ה-URL שאנחנו עוקבים אחריו — לא blob אנונימי שאי-אפשר לשחרר
    expect(pwaSrc).toContain("link.setAttribute('href', orgManifestUrl);");
    expect(pwaSrc).not.toContain("link.setAttribute('href', URL.createObjectURL(");
  });
});
