/// <reference types="node" />
/**
 * ratchet — איזון-עמודות במסך הבית (בקשת-בעלים "מסך הבית בלגן", 23.8). הבאג:
 * פריסת שתי-העמודות הייתה פיצול-קבוע (colA/colB), וכשווידג'ט סונן (למשל
 * "המשימות שלי" ריקה) עמודה התכווצה בעוד השנייה נשאה 3 פאנלים גבוהים ⇒
 * חצי-לוח-ריק ענק ("בלגן") — נמדד בכל 4 הערכות ברוחב ~1080 (הפרשי-גובה
 * 384–1665px). התיקון: masonry דו-טורי (CSS columns) שמאזן גבהים-בפועל בדפדפן.
 * ‏css?raw ריק תחת vitest ⇒ קוראים global.css ב-fs.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import homeViewSrc from '../HomeView.tsx?raw';

const CSS = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../../styles/global.css'), 'utf8');

describe('🧩 ratchet — מסך-הבית מאוזן (masonry, אפס חצי-לוח-ריק)', () => {
  it('HomeView מרנדר masonry דו-טורי מכלל ווידג\'טי-התבנית הגלויים (לא פיצול-קבוע)', () => {
    expect(homeViewSrc).toContain('const mainIds = [...tpl.colA, ...tpl.colB].filter(visible)');
    expect(homeViewSrc).toContain('className="hm-masonry"');
    expect(homeViewSrc).toContain('className="hm-ma-item"');
    // הפיצול-הקבוע הישן (colA/colB בנפרד לשני .hm-col) לא יחזור
    expect(homeViewSrc).not.toContain('<div className="hm-col">');
  });

  it('CSS: ‏.hm-masonry = columns:2 (מאזן-גובה) + טור-יחיד ≤900, פריט לא-נחתך', () => {
    expect(CSS).toMatch(/\.hm-masonry \{[^}]*columns: 2/);
    expect(CSS).toMatch(/\.hm-ma-item \{[^}]*break-inside: avoid/);
    expect(CSS).toMatch(/@media \(max-width: 900px\) \{\s*\.hm-masonry \{\s*columns: 1/);
  });
});
