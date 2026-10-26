/**
 * רצ'ט — ניווט-מובייל באתר-הציבורי (26.10.2026).
 * הבאג: ברוחב טלפון (390px) שישה קישורים + בורר-שפה + כפתור-תרומה בשורה אחת ⇒ הקישורים
 * נחתכו מחוץ למסך (נצפה חי ב-meorhachessed.com). התיקון: ≤860px הקישורים מתקפלים ל-☰,
 * כפתור-התרומה נשאר גלוי; בדסקטופ ההמבורגר והתפריט מוסתרים ⇒ ביט-זהה.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import siteSrc from '../PublicSite.tsx?raw';

const css = readFileSync(new URL('../public-site.css', import.meta.url), 'utf8'); // ?raw של css ריק תחת vitest

describe('☰ ניווט-מובייל — האתר-הציבורי', () => {
  it('כל קישורי-הניווט העליון + כניסה + שפה מסומנים ps-nav-full (מוסתרים במובייל)', () => {
    for (const id of ['#pillars', '#story', '#numbers', '#calc', '#faq']) {
      expect(siteSrc).toMatch(new RegExp(`href="${id}" className="ps-navlink ps-nav-full"`));
    }
    expect(siteSrc).toMatch(/className="ps-nav-full" onClick=\{onEnter\}/);
    expect(siteSrc).toMatch(/dir="ltr" className="ps-nav-full"/);
  });

  it('כפתור ☰ נגיש + תפריט עם אותם יעדים + כניסה-למערכת', () => {
    expect(siteSrc).toMatch(/className="ps-burger" aria-label=[^\n]*aria-expanded=\{menuOpen\}[^\n]*aria-controls="ps-mobile-menu"/);
    expect(siteSrc).toMatch(/id="ps-mobile-menu"/);
    for (const id of ['#pillars', '#story', '#numbers', '#calc', '#faq']) expect(siteSrc).toContain(`['${id}', `);
    expect(siteSrc).toMatch(/setMenuOpen\(false\); onEnter\(\);/);
  });

  it('CSS: בדסקטופ ההמבורגר מוסתר; ≤860px הקישורים מוסתרים וההמבורגר מוצג; התרומה לא מוסתרת', () => {
    expect(css).toMatch(/\.ps-burger, \.ps-mobile-menu \{ display: none !important; \}/);
    const m = css.match(/@media \(max-width: 860px\) \{\n  \.ps-nav-full \{ display: none !important; \}[\s\S]*?\n\}/);
    expect(m).toBeTruthy();
    expect(m![0]).toMatch(/\.ps-burger \{ display: inline-flex !important;/);
    expect(m![0]).not.toMatch(/\.ps-nav-cta \{[^}]*display: none/);
  });
});
