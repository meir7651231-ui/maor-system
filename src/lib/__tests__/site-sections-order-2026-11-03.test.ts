/**
 * רצ'ט — 🧱 סדר-חלקי-האתר (3.11.2026, בקשת-בעלים «יש אפשרות לעלות ולהוריד את הסדר» ⇒ «1»).
 * ננעל: חסר ⇒ בדיוק הסדר של היום (הוכח גם בדפדפן: ה-DOM זהה תו-בתו לפני/אחרי הרה-ארגון) · מפתח חדש נכנס
 * אחרי שכנו (לא קופץ לסוף) · מוסתר יורד מהאתר ומהניווט · חיטוי allowlist · כל מפתח = בלוק באתר.
 */
import { describe, expect, it } from 'vitest';
import { SITE_SECTION_KEYS } from '../../types/config';
import { SITE_SECTION_LABELS, siteSectionOrder } from '../publicSite';
import { normalizeConfig } from '../config';
import type { OrgConfig } from '../../types/config';
import siteSrc from '../../components/public/PublicSite.tsx?raw';
import editorSrc from '../../components/builder/SiteContentEditor.tsx?raw';

describe('🧱 siteSectionOrder', () => {
  it('חסר ⇒ הסדר של היום', () => {
    expect(siteSectionOrder(undefined)).toEqual([...SITE_SECTION_KEYS]);
    expect(siteSectionOrder({})).toEqual([...SITE_SECTION_KEYS]);
    expect(SITE_SECTION_KEYS.slice(0, 6)).toEqual(['marquee', 'transparency', 'services', 'numbers', 'live', 'story']);
  });
  it('סדר שנקבע נשמר; חלק שנוסף בעתיד (חסר בסדר השמור) נכנס אחרי השכן-הקודם שלו — לא קופץ לסוף', () => {
    const saved = ['live', ...SITE_SECTION_KEYS.filter((k) => k !== 'live' && k !== 'gallery')]; // כאילו gallery «חדש»
    const o = siteSectionOrder({ sections: { order: saved as never } });
    expect(o[0]).toBe('live');
    expect(o).toHaveLength(SITE_SECTION_KEYS.length);
    expect(new Set(o).size).toBe(SITE_SECTION_KEYS.length);
    expect(o.indexOf('gallery')).toBe(o.indexOf('donate') + 1);
  });
  it('מוסתר יורד', () => {
    const o = siteSectionOrder({ sections: { hidden: ['calc', 'gallery'] } });
    expect(o).not.toContain('calc');
    expect(o).not.toContain('gallery');
    expect(o).toHaveLength(SITE_SECTION_KEYS.length - 2);
  });
});

describe('🧹 חיטוי site.sections', () => {
  const norm = (sections: unknown) => (normalizeConfig({ slug: 'x', orgName: 'א', theme: 'or-rishon', site: { sections } }) as OrgConfig).site?.sections;
  it('רק מפתחות-מוכרים, בלי כפילויות; ריק ⇒ נזרק', () => {
    expect(norm({ order: ['live', 'evil', 'live', 'faq'], hidden: ['calc', 'x'] })).toEqual({ order: ['live', 'faq'], hidden: ['calc'] });
    expect(norm({ order: [], hidden: 'calc' })).toBeUndefined();
    expect(norm('x')).toBeUndefined();
  });
});

describe('🔌 חיווט', () => {
  it('האתר מרנדר לפי הסדר, וכל מפתח הוא בלוק', () => {
    expect(siteSrc).toContain('{sectionOrder.map((k) => <Fragment key={k}>{sectionBlocks[k]}</Fragment>)}');
    for (const k of SITE_SECTION_KEYS) expect(siteSrc).toMatch(new RegExp(`\\n    ${k}: \\(<>`));
  });
  it('קישור-ניווט לחלק מוסתר יורד (דסקטופ ומובייל)', () => {
    expect(siteSrc).toContain('.filter(([k]) => shown(k))');
    expect((siteSrc.match(/navItems\.map\(/g) ?? []).length).toBe(2);
  });
  it('לכל חלק יש שם בעורך, והעורך שומר ב-site.sections', () => {
    for (const k of SITE_SECTION_KEYS) expect(SITE_SECTION_LABELS[k]).toBeTruthy();
    expect(editorSrc).toContain('<SectionOrderEditor site={wsite} onChange={(sections) => setSite({ sections })} />');
    expect(editorSrc).toContain('↺ חזרה לסדר המקורי');
  });
});
