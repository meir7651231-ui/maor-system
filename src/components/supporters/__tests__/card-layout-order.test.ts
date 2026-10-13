/**
 * ratchet · פריסת כרטיס-התומך (בקשת-בעלים 30.8):
 * 1. "כל התרומות" הועלתה למעלה (במקום שהיתה הוראת-הקבע); הוראת-הקבע ירדה למטה.
 * 2. כפתור-החזרה עבר ל-inset-inline-end (הצד הנגדי לטוסטים שהסתירו אותו).
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import detailSrc from '../SupporterDetail.tsx?raw';
// ‏?raw על CSS מוחזר ריק ב-vitest (CSS מנוטרל) — קוראים דרך fs.
const globalCss = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../../styles/global.css'), 'utf8');

describe('🗂 ratchet — פריסת כרטיס-התומך', () => {
  it('"כל התרומות" מופיעה לפני "הוראת קבע" במקור (עלתה למעלה, הו״ק ירדה)', () => {
    const donIdx = detailSrc.indexOf('היסטוריית תרומות — הועלתה לראש הכרטיס');
    const hokIdx = detailSrc.indexOf('הוראת קבע — למטה');
    expect(donIdx).toBeGreaterThan(-1);
    expect(hokIdx).toBeGreaterThan(-1);
    expect(donIdx).toBeLessThan(hokIdx); // התרומות קודם, הו״ק אחריהן
    // הו״ק כבר לא בגריד-העליון (הוסרה משם והושארה הערת-הפניה)
    expect(detailSrc).toContain('הוראת-קבע הועברה לתחתית הכרטיס');
  });

  it('כפתור-החזרה (.sticky-back) ב-inset-inline-end — בצד הנגדי לטוסטים', () => {
    // הטוסטים ב-inset-inline-start; החזרה עברה ל-end כדי שלא תוסתר
    expect(globalCss).toMatch(/\.sticky-back\s*\{[^}]*inset-inline-end:\s*18px/);
    expect(globalCss).toMatch(/\.toasts\s*\{[^}]*inset-inline-start:\s*20px/);
  });
});
