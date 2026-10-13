/**
 * ratchet — 📒 פרנסה׳לע · עיצוב 6ב: האווירה של המקור.
 *  (א) "רגע הפושקע" (intro) — פעם אחת בסשן; לא בתנועה-מופחתת ולא בדפדפן-אוטומציה (הבדיקות לא נחסמות); מסלול ה-CSS
 *      של המקור (בלי three.js מ-CDN): הפושקע, האותיות הנוחתות, הגרש-יהלום, השורה, "הקישו לדילוג".
 *  (ב) "אבק הזהב" (dust) — קנבס קבוע מאחורי הדף, כבוי בתנועה-מופחתת ובשבת/חג; פרצי-ניצוצות בפתיחה.
 *  (ג) הגנות-מקור: הסקין (CSS) — שכבות, prefers-reduced-motion; החיווט ב-ParnasaView.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { claimIntro, GoldDust, PnIntro } from '../Ambient';
import viewSrc from '../ParnasaView.tsx?raw';

const css = readFileSync(fileURLToPath(new URL('../parnasa.css', import.meta.url)), 'utf8');

afterEach(() => {
  vi.unstubAllGlobals();
});

function fakeSession(seed: Record<string, string> = {}) {
  const m = new Map(Object.entries(seed));
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), m };
}

describe('📒 (א) רגע הפושקע', () => {
  it('פעם אחת בסשן; לא בתנועה-מופחתת, לא באוטומציה, לא ברינדור-שרת', () => {
    expect(claimIntro(false)).toBe(false); // אין window (רינדור-שרת)
    const ss = fakeSession();
    vi.stubGlobal('window', {});
    vi.stubGlobal('sessionStorage', ss);
    vi.stubGlobal('navigator', { webdriver: false });
    expect(claimIntro(true)).toBe(false); // תנועה-מופחתת
    expect(claimIntro(false)).toBe(true);
    expect(ss.m.get('maor_pn_intro')).toBe('1');
    expect(claimIntro(false)).toBe(false); // כבר הוצג בסשן
    vi.stubGlobal('sessionStorage', fakeSession());
    vi.stubGlobal('navigator', { webdriver: true });
    expect(claimIntro(false)).toBe(false); // Playwright ⇒ לא חוסם בדיקות
    vi.stubGlobal('navigator', { webdriver: false });
    vi.stubGlobal('sessionStorage', {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {},
    });
    expect(claimIntro(false)).toBe(false); // אחסון חסום ⇒ בלי פתיחה (לעולם לא חוסם)
    // העדפת-המכשיר נקראת ישירות (useReducedMotion מתעדכן רק אחרי הרינדור הראשון)
    vi.stubGlobal('sessionStorage', fakeSession());
    vi.stubGlobal('window', { matchMedia: (q: string) => ({ matches: q.includes('reduce') }) });
    expect(claimIntro(false)).toBe(false);
  });

  it('מסלול ה-CSS של המקור: הפושקע, האותיות הנוחתות, הגרש-יהלום, השורה, "הקישו לדילוג"', () => {
    const h = renderToStaticMarkup(createElement(PnIntro, { brand: 'פרנסה׳לע', onBurst: () => {}, onDone: () => {} }));
    expect(h).toMatch(/<div class="pn-intro" aria-hidden="true">/); // קו-האור קודם; מסלול ה-CSS (pn-fb) אחרי 600ms
    expect(h).toContain('<span class="pn-pm pn-i-pm"></span>');
    expect(h.match(/<span style="--pn-i:\d">/g)?.length).toBe(7); // פ ר נ ס ה · ל ע (הגרש = יהלום)
    expect(h).toContain('<span style="--pn-i:4">ה</span><i class="pn-gm"></i><span style="--pn-i:5">ל</span>');
    expect(h).toContain('<div class="pn-i-tag">א פרנסה׳לע פאר יעדן איד</div>');
    expect(h).toContain('<div class="pn-iskip">הקישו לדילוג</div>');
    expect(h).toContain('<canvas class="pn-dust pn-over" aria-hidden="true"></canvas>'); // הניצוצות מעל הפתיחה (dust.over)
  });
});

describe('📒 (ב) אבק הזהב', () => {
  it('קנבס מאחורי הדף, מוסתר כשכבוי', () => {
    expect(renderToStaticMarkup(createElement(GoldDust, { on: true, dark: false, burst: 0 }))).toBe('<canvas class="pn-dust" aria-hidden="true"></canvas>');
    expect(renderToStaticMarkup(createElement(GoldDust, { on: false, dark: false, burst: 0 }))).toContain('hidden=""');
  });
});

describe('📒 (ג) הגנות-מקור', () => {
  it('הסקין: האבק מאחורי התוכן (‎.pn-wrap z1) ובלי תנועה-מופחתת; הפתיחה מעל הכול', () => {
    expect(css).toContain('.pn .pn-dust{position:fixed;inset:0;width:100%;height:100%;z-index:0;pointer-events:none}');
    expect(css).toContain('@media (prefers-reduced-motion:reduce){.pn .pn-dust{display:none}}');
    expect(css).toContain('.pn .pn-wrap{position:relative;z-index:1;');
    expect(css).toContain('.pn .pn-intro{position:fixed;inset:0;z-index:1000;');
  });
  it('החיווט: האבק כבוי בשבת/חג ובתנועה-מופחתת; הפתיחה רק דרך claimIntro', () => {
    expect(viewSrc).toContain('<GoldDust on={!reduced && !calm} dark={dark} burst={dustBurst} />');
    expect(viewSrc).toContain('useState(() => claimIntro(reduced))');
  });
});
