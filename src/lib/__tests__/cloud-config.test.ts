/**
 * ratchet — קונפיג-בענן (CLOUD2 ענן 2): מיזוג עדיפויות ענן>סטטי>ברירת-מחדל
 * כפונקציה טהורה; מטמון maor_cloudcfg:{slug} נכתב/נקרא ונפרד מדריסת-האשף;
 * בלי ענן — אפס שינוי (resolveOrgConfig מחזיר את הסטטי כמות-שהוא).
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { cloudCfgCacheKey, readCloudConfigCache, resolveOrgConfig, writeCloudConfigCache } from '../config';
import { DEFAULT_CONFIG, type OrgConfig } from '../../types/config';
import useAppSrc from '../../store/useApp.ts?raw';

// localStorage מדומה בזיכרון — כמו persist-crypto (סביבת node, אין DOM)
class MemStorage {
  private m = new Map<string, string>();
  getItem(k: string): string | null {
    return this.m.get(k) ?? null;
  }
  setItem(k: string, v: string): void {
    this.m.set(k, String(v));
  }
  removeItem(k: string): void {
    this.m.delete(k);
  }
  clear(): void {
    this.m.clear();
  }
  key(i: number): string | null {
    return [...this.m.keys()][i] ?? null;
  }
  get length(): number {
    return this.m.size;
  }
}
(globalThis as unknown as { localStorage: MemStorage }).localStorage = new MemStorage();

const staticCfg: OrgConfig = {
  ...DEFAULT_CONFIG,
  slug: 'test-demo',
  orgName: 'סטטי',
  theme: 'or-rishon',
  firebase: { apiKey: 'k', authDomain: 'a', projectId: 'p', appId: 'x' },
};

describe('☁️ ratchet — ענן 2: קונפיג חי מהענן', () => {
  beforeEach(() => localStorage.clear());

  it('הענן גובר על הסטטי; slug מהכתובת ו-firebase מהסטטי נשמרים', () => {
    const merged = resolveOrgConfig(staticCfg, {
      slug: 'אחר', orgName: 'מהענן', theme: 'heichal', modules: { courses: false },
    });
    expect(merged.orgName).toBe('מהענן');
    expect(merged.theme).toBe('heichal');
    expect(merged.modules.courses).toBe(false);
    expect(merged.slug).toBe('test-demo'); // הכתובת קובעת את הזהות
    expect(merged.firebase?.projectId).toBe('p'); // ה-credentials מהסטטי
  });

  it('🛡 בלי ענן — אפס שינוי: cloudRaw לא-שמיש מחזיר את הסטטי כמות-שהוא', () => {
    expect(resolveOrgConfig(staticCfg, null)).toBe(staticCfg);
    expect(resolveOrgConfig(staticCfg, undefined)).toBe(staticCfg);
    expect(resolveOrgConfig(staticCfg, 'זבל')).toBe(staticCfg);
    expect(resolveOrgConfig(staticCfg, {})).toBe(staticCfg); // normalizeConfig ⇒ null
  });

  it('מטמון: נכתב תחת maor_cloudcfg:{slug}, נקרא רק לאותו slug, פגום ⇒ null', () => {
    writeCloudConfigCache('test-demo', { ...staticCfg, orgName: 'ממוטמן' });
    expect(cloudCfgCacheKey('test-demo')).toBe('maor_cloudcfg:test-demo');
    expect(readCloudConfigCache('test-demo')?.orgName).toBe('ממוטמן');
    expect(readCloudConfigCache('slug-אחר')).toBeNull();
    localStorage.setItem(cloudCfgCacheKey('bad'), '{זבל');
    expect(readCloudConfigCache('bad')).toBeNull();
  });

  it('הגנת-מקור: snapshot מהענן לא נשמר כדריסת-אשף; הלקוח הקיים (cloudRoot) לא מאזין', () => {
    // בנתיב ה-snapshot: writeCloudConfigCache — כן; saveConfigOverride — לא
    const watchBlock = useAppSrc.slice(useAppSrc.indexOf('watchOrgCloudConfig'), useAppSrc.indexOf('startCloudSync'));
    expect(watchBlock).toContain('writeCloudConfigCache');
    expect(watchBlock).not.toContain('saveConfigOverride');
    expect(useAppSrc).toContain("cfg.cloudRoot !== true");
  });
});
