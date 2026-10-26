/**
 * רצ'ט — סבב-ליטוש האתר-הציבורי (26.10.2026, «תסתכל באתר הציבורי טוב מה עדיין לא תקין» ⇒ «כן תתקן את הכל»).
 * באגים שנמצאו באתר החי (meorhachessed.com):
 *  🔴 "24/7" הוצג "247/" — האנימציה פירקה כל ערך עם ספרה למספר + שארית. 🔴 "30+" הוצג "+30" (RTL).
 *  🔴 מובייל: השירותים (3 טורים) והמספרים (4) לא קרסו — מילה-לשורה ונחתך מחוץ למסך.
 *  🟠 לשונית "<ארגון> — מערכת הניהול שלכם" + סמל-אורביט באתר-הציבורי · "מופעל על-ידי מאור" (שם-פלטפורמה ישן)
 *  🟠 חץ הפוך באנגלית ("Donate ₪500 ←") · הבטחת "עדכון חודשי" בלי מערכת-ניוזלטר · שדה-מייל בלי תווית
 *  🟡 "₪1000" בלי פסיק · "1 × חודשי…" · טלפוני-חו״ל בלי מדינה · "עושות/מבטיחות" קבוע בקוד
 *  🟡 באשף: שדה-הטלפונים בלע את הפסיק (אי אפשר היה להקליד טלפון שני).
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { normalizeConfig } from '../../../lib/config';
import { siteUi } from '../../../lib/publicSite';
import siteSrc from '../PublicSite.tsx?raw';
import appSrc from '../../../App.tsx?raw';
import wizardSrc from '../../builder/BuilderWizard.tsx?raw';
import maor from '../../../../public/c/maor-hachesed/config.json';
import type { OrgConfig } from '../../../types/config';

const css = readFileSync(new URL('../public-site.css', import.meta.url), 'utf8');
const code = siteSrc.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

describe('✨ ליטוש האתר-הציבורי', () => {
  it('מספרים: רק ערך-נקי מונפש ("24/7" כמות-שהוא) ובכיוון LTR', () => {
    const m = siteSrc.match(/const hasNum = (\/.*?\/)\.test\(s\.value\.trim\(\)\);/);
    expect(m).toBeTruthy();
    const re = new RegExp(m![1].slice(1, -1));
    for (const v of ['600', '2,000', '30+', '92%']) expect(re.test(v)).toBe(true);
    for (const v of ['24/7', '1:1', '3-5']) expect(re.test(v)).toBe(false);
    expect(siteSrc).toMatch(/unicodeBidi: 'isolate', direction: 'ltr'[^\n]*\{hasNum \?/);
  });

  it('מובייל: השירותים והמספרים קורסים', () => {
    expect(siteSrc).toContain('className="ps-svc3"');
    expect(siteSrc).toContain('className="ps-stats4"');
    expect(css).toMatch(/\.ps-svc3, \.ps-stats4 \{ grid-template-columns: 1fr 1fr !important; \}/);
    expect(css).toMatch(/max-width: 560px\) \{\n  \.ps-svc3 \{ grid-template-columns: 1fr !important; \}/);
  });

  it('לשונית+סמל של האתר-הציבורי; "מופעל על-ידי אורביט"', () => {
    expect(appSrc).toMatch(/if \(!siteRequested \|\| !publicSiteOn\(config\)\) return;[\s\S]{0,400}document\.title = [\s\S]{0,300}applyFavicon\(s\?\.icon \|\| config\.emoji\)/);
    for (const l of ['he', 'en', 'yi'] as const) expect(siteUi(l, 'poweredBy')).not.toMatch(/מאור|Maor/);
  });

  it('אנגלית: חץ נכון; ניוזלטר בלי הבטחה; תווית לשדה; "עושים"; סכומים עם פסיק', () => {
    expect(code).toContain('`Donate ₪${fmt(amt)}${mode === \'monthly\' ? \' monthly\' : \'\'} →`');
    expect(code).not.toContain('עדכון חודשי קצר');
    expect(code).not.toMatch(/מבטיחות|עושות/);
    expect(code).toMatch(/type="email" aria-label=/);
    expect(code).toContain('>₪{fmt(a)}</button>');
  });

  it('תוויות-טלפון: חיטוי + תצוגה + אשף; שדה-הטלפונים לא בולע פסיק', () => {
    const c = (normalizeConfig({ slug: 'x', orgName: 'א', theme: 'or-rishon', site: { contact: { phones: ['02-1234567'], phoneLabels: ['ישראל', 5, { he: 'ארה״ב', en: 'USA' }] } } }) as OrgConfig).site?.contact;
    expect(c?.phoneLabels).toEqual(['ישראל', '', { he: 'ארה״ב', en: 'USA' }]);
    expect(code).toContain('t(contact.phoneLabels?.[i])');
    expect(wizardSrc).toMatch(/<input key=\{phonesText\} dir="ltr" defaultValue=\{phonesText\} onBlur=/);
    expect(wizardSrc).toContain('phoneLabels:');
  });

  it('מאור: אנגלית מלאה — אין טקסט עברי-בלבד באתר', () => {
    const heOnly: string[] = [];
    const walk = (v: unknown, path: string): void => {
      if (Array.isArray(v)) return v.forEach((x, i) => walk(x, `${path}[${i}]`));
      if (v && typeof v === 'object') {
        const o = v as Record<string, unknown>;
        if ('he' in o && Object.keys(o).every((k) => ['he', 'en', 'yi'].includes(k)) && !o.en) heOnly.push(path);
        return Object.entries(o).forEach(([k, x]) => walk(x, `${path}.${k}`));
      }
      if (typeof v === 'string' && /[֐-׿]/.test(v) && !/\.(he|yi)$/.test(path)) heOnly.push(path);
    };
    walk((maor as { site: unknown }).site, 'site');
    expect(heOnly).toEqual([]);
  });
});
