/**
 * ratchet — דמו ציבורי (?org=demo): ארגז-חול ללא הרשמה (1.8.2026).
 *
 * דרישת הבעלים: לינק דמו ציבורי שפרוספקט משחק בו לבד. המנגנון:
 *  1. public/c/demo/config.json — **בלי firebase** ⇒ אין שער-ענן/מסך-התחברות
 *     (loadOrgConfig מושך אותו כש-?org=demo; config.slug נשאר 'demo').
 *  2. App זורע אוטומטית את demo.json פעם בכל סשן (sessionStorage) כשהמערכת ריקה.
 *  3. DemoRibbon מבהיר "מצב הדגמה" + CTA לפתיחת אתר אמיתי + התחל-מחדש.
 */
import { describe, expect, it } from 'vitest';
import { normalizeConfig } from '../../lib/config';
import demoCfg from '../../../public/c/demo/config.json';
import appSrc from '../../App.tsx?raw';
import ribbonSrc from '../DemoRibbon.tsx?raw';

describe('🧪 ratchet — דמו ציבורי (?org=demo)', () => {
  it('קונפיג הדמו: slug=demo ו**בלי firebase** ⇒ אין שער-ענן/התחברות', () => {
    expect(demoCfg.slug).toBe('demo');
    expect('firebase' in demoCfg).toBe(false); // הקריטי — cloud off ⇒ אין LoginScreen
    const norm = normalizeConfig(demoCfg);
    expect(norm).not.toBeNull();
    expect(norm!.slug).toBe('demo');
  });

  it('App זורע אוטומטית את demo.json למצב-דמו ריק, פעם בכל סשן', () => {
    // מגודר על slug=demo, מדלג כשכבר יש נתונים, וקורא ל-restoreDb מ-demo.json
    expect(appSrc).toContain("config.slug !== 'demo'");
    expect(appSrc).toMatch(/famCount > 0/);
    expect(appSrc).toContain("sessionStorage.getItem('maor_demo_seeded')");
    expect(appSrc).toContain("fetch(`${import.meta.env.BASE_URL}demo.json`");
    // הדמו מרוענן-תאריכים לפני restoreDb (freshenDemoDb — הכרעת בעלים "תאריכים קרובים")
    expect(appSrc).toContain('restoreDb(freshenDemoDb(parseBackupFile(');
  });

  it('הסרט מוצג רק במצב-דמו', () => {
    expect(appSrc).toContain("config.slug === 'demo' && <DemoRibbon />");
  });

  it('הסרט: CTA לשורש (מסך ההרשמה) + התחל-דמו-מחדש', () => {
    expect(ribbonSrc).toContain('פתחו אתר משלכם');
    expect(ribbonSrc).toContain('import.meta.env.BASE_URL'); // ה-CTA חוזר לשורש
    expect(ribbonSrc).toContain('התחל דמו מחדש');
    expect(ribbonSrc).toContain('demo.json'); // איפוס = משיכה מחדש
  });
});
