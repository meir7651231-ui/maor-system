/**
 * ratchet — סידור כרטיס-התורם (5.10.2026, בקשת-בעלים "אפשרות לעריכת מיקום ויגדטים בתוך התורם").
 * הגנת-מקור: הכרטיס מרנדר רשימת-קוביות אחת דרך המנוע המשותף, הדגל קיים (חסר=פעיל), והשדה ב-UiPrefs אופציונלי (ביט-זהה).
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { FEATURES } from '../../../types/features';
import { featureOn } from '../../../lib/config';
import type { OrgConfig } from '../../../types/config';

const src = readFileSync(new URL('../SupporterDetail.tsx', import.meta.url), 'utf8');

describe('כרטיס-התורם · סידור קוביות', () => {
  it('הדגל supporters.cardlayout רשום באשף ו"חסר = פעיל" (חוזה-הדגלים)', () => {
    const f = FEATURES.find((x) => x.key === 'supporters.cardlayout');
    expect(f?.module).toBe('supporters');
    expect(featureOn({ modules: {}, features: {} } as unknown as OrgConfig, 'supporters.cardlayout')).toBe(true);
    expect(featureOn({ modules: {}, features: { 'supporters.cardlayout': false } } as unknown as OrgConfig, 'supporters.cardlayout')).toBe(false);
  });
  it('תשע הקוביות רשומות פעם אחת, והרינדור עובר דרך db.ui.supCardLayout + המנוע המשותף', () => {
    for (const id of ['details', 'hok', 'planned', 'next', 'segula', 'photos', 'ayin', 'doncal', 'history']) {
      expect(src.match(new RegExp(`id: '${id}'`, 'g'))?.length, id).toBe(1);
    }
    expect(src).toContain("s.db.ui.supCardLayout");
    expect(src).toContain("sanitizeIds(supCardLayout, allIds, allIds, { fallbackIfEmpty: true })");
    expect(src).toContain('persistLayout(layoutDraft, savedLayout, isVisible, allIds.filter(isVisible))');
    // אין רינדור ישיר של קובייה מחוץ לרשימה — הישנים נעלמו
    expect(src).not.toMatch(/\{hokOn && \(/);
    expect(src).not.toMatch(/\{photosOn && \(/);
  });
  it('העורך מגודר בדגל ושומר דרך setDb (לארגון, מסתנכרן עם הנתונים)', () => {
    expect(src).toContain("const layoutOn = featureOn(config, 'supporters.cardlayout')");
    expect(src).toContain('{layoutOn && !layoutEdit && (');
    expect(src).toContain('ui: { ...cur.ui, supCardLayout: supCardLayoutNext }');
  });
});
