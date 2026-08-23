/// <reference types="node" />
/**
 * ratchet — התאמת חלונות-קופצים במסך-נמוך (בקשת-בעלים "תבדוק חלונות קופצים
 * מתאים הכל", סביבת-הבעלים: קהילה בנוף/landscape בטלפון, גובה ~390px). הבעיה:
 * ‏.modal-back‎ ריפד 48px אנכית ⇒ ברוחב-נוף (גובה מצומצם) הבזבוז היה 25%
 * מהמסך, וטופס גבוה (הוספת-תומך 660px) נדחף כך שכפתור-השמירה הרחיק מתחת-לקיפול.
 * התיקון: ב-‏max-height:620‎ הריפוד יורד ל-10px ⇒ המודאל מנצל את הגובה, פחות
 * גלילה. הרקע נשאר overflow-y:auto ⇒ אפס-אובדן-הישג (כל שדה/כפתור נגיש בגלילה).
 * ‏css?raw ריק תחת vitest ⇒ קוראים fs.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const CSS = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../styles/global.css'), 'utf8');

describe('🪟 ratchet — חלונות-קופצים מתאימים במסך-נמוך (נוף)', () => {
  it('‏@media(max-height:620) מקטין את ריפוד-הרקע ל-10px', () => {
    expect(CSS).toMatch(/@media \(max-height: 620px\) \{\s*\.modal-back \{\s*padding: 10px 16px;/);
  });
  it('הרקע נשאר גליל (overflow-y:auto) ⇒ טפסים גבוהים עדיין נגישים במלואם', () => {
    expect(CSS).toMatch(/\.modal-back \{[^}]*overflow-y: auto/);
  });
});
