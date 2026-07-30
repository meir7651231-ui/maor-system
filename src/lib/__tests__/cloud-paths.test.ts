/**
 * ratchet — נתיבים פר-ארגון בענן (CLOUD2 ענן 1).
 * ‏cloudRoot=true חייב להפיק את נתיבי-השורש של היום **בדיוק** — זו ההגנה על
 * הלקוח החי (maor-hachesed): שום שינוי נתיב = שום סיכון לנתונים. ארגון-
 * פלטפורמה מקבל orgs/{slug}/; ‏normalizeConfig שומר רק true מפורש.
 */
import { describe, expect, it } from 'vitest';
import { ENTITY_COLLECTIONS, colPath, metaPath } from '../cloud-diff';
import { normalizeConfig } from '../config';

describe('☁️ ratchet — ענן 1: נתיבים פר-ארגון', () => {
  it('🛡 הלקוח החי: cloudRoot=true ⇒ נתיבי השורש של היום, ביט-זהה, לכל 18 האוספים', () => {
    for (const col of ENTITY_COLLECTIONS) {
      expect(colPath('maor-hachesed', true, col)).toBe(col);
    }
    expect(metaPath('maor-hachesed', true)).toBe('meta/org');
  });

  it('ארגון-פלטפורמה: orgs/{slug}/{col} + orgs/{slug}/meta/org', () => {
    expect(colPath('test-demo', false, 'families')).toBe('orgs/test-demo/families');
    expect(colPath('test-demo', false, 'shopIntakes')).toBe('orgs/test-demo/shopIntakes');
    expect(metaPath('test-demo', false)).toBe('orgs/test-demo/meta/org');
    // מספר מקטעים תקין ל-Firestore: אוסף=אי-זוגי, מסמך=זוגי
    expect(colPath('x', false, 'families').split('/')).toHaveLength(3);
    expect(metaPath('x', false).split('/')).toHaveLength(4);
  });

  it('normalizeConfig: רק cloudRoot:true מפורש נשמר — כל השאר מוסר', () => {
    const base = { slug: 'a', orgName: 'א', theme: 'or-rishon' };
    expect(normalizeConfig({ ...base, cloudRoot: true })?.cloudRoot).toBe(true);
    expect(normalizeConfig({ ...base })?.cloudRoot).toBeUndefined();
    expect(normalizeConfig({ ...base, cloudRoot: false })?.cloudRoot).toBeUndefined();
    expect(normalizeConfig({ ...base, cloudRoot: 'true' })?.cloudRoot).toBeUndefined();
  });

  it('🛡 קונפיג הלקוח החי מסומן cloudRoot:true (השינוי היחיד המותר בקובץ)', async () => {
    const cfg = (await import('../../../public/c/maor-hachesed/config.json')).default as Record<string, unknown>;
    expect(cfg.cloudRoot).toBe(true);
    expect(cfg.slug).toBe('maor-hachesed');
  });
});
