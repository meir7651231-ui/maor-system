/// <reference types="node" />
/**
 * ratchet — סוף חצאי-הלוח-הריקים בטלפון-לרוחב (ממצא-בעלים 23.8, צילום-פרודקשן).
 *
 * שני באגים שנחשפו רק על האתר החי (קונפיג-מותאם + נתונים אמיתיים + מסך ~900px,
 * הדמו הסתיר אותם) — שניהם "חצי-לוח-ריק" שנראה כ"בלגן":
 *
 * 1) מסלול-הפריסה-הגנרי (db.ui.homeLayout מותאם): ווידג'טי-"חצי" סמוכים רונדרו
 *    בגריד עם align-items ברירת-מחדל = stretch ⇒ הכרטיס הנמוך (למשל "תורמים ·
 *    יעדי קשר" עם 5 שורות) **נמתח לגובה השכן הגבוה** ("שווה לטפל" עם 92) ⇒ פנים-
 *    כרטיס ריק ענק. התיקון: alignItems:'start' ⇒ כל כרטיס בגובה-תוכנו.
 *
 * 2) רצועת-הכרטיסים (.hm-stats): 5 כרטיסים בטלפון-לרוחב ⇒ 4+1; הכרטיס-הבודד
 *    בשורה-השנייה השאיר חצי-שורה-ריקה לצדו. grid/auto-fit לא פותר (מקפל רק מסילות
 *    ריקות-לגמרי). התיקון: flex-wrap + flex:1 1 185px ⇒ הכרטיס-הבודד גדל לרוחב-מלא.
 *    היכל נשאר גריד (רצועה-מחוברת) במפורש.
 *
 * ‏css?raw ריק תחת vitest ⇒ קוראים global.css ב-fs.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import homeViewSrc from '../HomeView.tsx?raw';

const CSS = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../../styles/global.css'), 'utf8');

describe('🧩 ratchet — סוף חצאי-הלוח-הריקים (טלפון-לרוחב)', () => {
  it('HomeView: גריד-ווידג׳טי-החצי מיושר-לראש (alignItems:start) — לא נמתח לגובה השכן', () => {
    // שני המקומות (extras-בתבנית + מסלול-גנרי) חייבים alignItems:'start'
    const hits = homeViewSrc.match(/gridTemplateColumns: 'repeat\(auto-fit, minmax\(320px, 1fr\)\)', gap: 14, alignItems: 'start'/g) ?? [];
    expect(hits.length).toBeGreaterThanOrEqual(2);
    // אין יותר גריד-חצי בלי alignItems (הדפוס הישן שגרם למתיחה)
    expect(homeViewSrc).not.toContain("minmax(320px, 1fr))', gap: 14 }}");
  });

  it('CSS: ‏.hm-stats = flex-wrap (כרטיס-בודד גדל לרוחב-מלא) + .hm-stat flex:1 1 185px', () => {
    expect(CSS).toMatch(/\.hm-stats \{[^}]*display: flex;[^}]*flex-wrap: wrap/s);
    expect(CSS).toMatch(/\.hm-stat \{[^}]*flex: 1 1 185px/s);
    // היכל (רצועה-מחוברת) נשאר גריד למרות בסיס-ה-flex
    expect(CSS).toMatch(/\[data-theme="heichal"\] \.hm-stats \{[^}]*display: grid/s);
  });
});
