/**
 * ratchet — ריפוי-גרסה + באנר "יש גרסה חדשה" (5.8.2026 → 31.8.2026):
 * לקוחות עם לשונית פתוחה ימים ראו גרסה עתיקה (מסך-Passkey שנמחק). היה רענון-שקט
 * אוטומטי; בקשת-בעלים 31.8 — במקומו באנר עדין עם "רענן עכשיו" (הלקוח בשליטה,
 * יודע שיצאה גרסה). המנוע-הטהור נבדק ביחידה; הגנת-מקור מוודאת שהחיווט חי.
 */
import { describe, expect, it } from 'vitest';
import appSrc from '../../App.tsx?raw';
import bannerSrc from '../UpdateBanner.tsx?raw';
import viteCfg from '../../../vite.config.ts?raw';
import { FEATURES } from '../../types/features';
import { isNewVersion, versionSeenKey } from '../../lib/version';

describe('🔄 מנוע-גרסה טהור (isNewVersion)', () => {
  it('id שונה ולא-ריק ⇒ גרסה חדשה; שווה/חסר/לא-מחרוזת ⇒ לא (חסין-לולאה)', () => {
    expect(isNewVersion('a', 'b')).toBe(true);
    expect(isNewVersion('a', 'a')).toBe(false); // אותה גרסה — אין רענון
    expect(isNewVersion('', 'b')).toBe(false);
    expect(isNewVersion('a', '')).toBe(false);
    expect(isNewVersion('a', undefined)).toBe(false); // version.json פגום/חסר
    expect(isNewVersion(null, 'b')).toBe(false);
    expect(isNewVersion('a', 123)).toBe(false);
  });
  it('מפתח-שומר פר-גרסה', () => {
    expect(versionSeenKey('2026-08-31T10')).toBe('maor_ver_seen:2026-08-31T10');
  });
});

describe('🔄 ratchet — ריפוי-גרסה: build + באנר', () => {
  it('ה-build מטביע מזהה וכותב version.json', () => {
    expect(viteCfg).toContain('__BUILD_ID__');
    expect(viteCfg).toContain("'version.json'");
  });

  it('הבאנר בודק version.json (no-store + cache-bust) בחזרה-ללשונית, מגודר-דגל', () => {
    expect(bannerSrc).toContain("import.meta.env.BASE_URL + 'version.json?t='");
    expect(bannerSrc).toContain("cache: 'no-store'");
    expect(bannerSrc).toContain("document.addEventListener('visibilitychange', check)");
    expect(bannerSrc).toContain('isNewVersion(__BUILD_ID__, v.id)');
    expect(bannerSrc).toContain("featureOn(config, 'shell.update')");
  });

  it('🛡 באנר עם "רענן עכשיו" — הלקוח מרענן ביודעין (לא רענון-שקט-פתע)', () => {
    // הרענון קורה רק בקליק המפורש — לא אוטומטית (מונע איבוד-עבודה + חוסר-ידיעה)
    expect(bannerSrc).toContain('רענן עכשיו');
    expect(bannerSrc).toContain('window.location.reload()');
    expect(bannerSrc).toMatch(/onClick=\{\(\) => window\.location\.reload\(\)\}/);
    // האפליקציה מרכיבה את הבאנר; אין יותר רענון-שקט אוטומטי ב-App
    expect(appSrc).toContain('<UpdateBanner />');
    expect(appSrc).not.toContain('maor_ver_reload:');
  });

  it('🛡 דחייה נזכרת פר-גרסה (sessionStorage) — לא חוזר על אותו build', () => {
    expect(bannerSrc).toContain('versionSeenKey(v.id)');
    expect(bannerSrc).toContain('sessionStorage.setItem(versionSeenKey(newId)');
  });

  it('הדגל shell.update רשום ב-FEATURES (מודול shell) — חשוף באשף', () => {
    const f = FEATURES.find((x) => x.key === 'shell.update');
    expect(f).toBeTruthy();
    expect(f?.module).toBe('shell');
  });
});
