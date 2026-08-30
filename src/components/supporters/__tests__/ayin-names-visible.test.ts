/**
 * ratchet · 🩺 מעקב-טיפול — השמות נשארים על המסך עד 'הושלם' (בקשת-בעלים 30.8:
 * "שמות ישאר על המסך עד שלב המסירה ורק כשהושלם זה יורד להיסטוריה").
 *
 * קודם: showNames = new|lead|eyes ⇒ השמות נעלמו כבר בשלב 'מסירה' (answer).
 * אחרי: showNames = stage !== 'done' ⇒ נשארים גם ב'מסירה', יורדים רק ב'הושלם'.
 */
import { describe, expect, it } from 'vitest';
import cardSrc from '../AyinCard.tsx?raw';

describe('🩺 ratchet — שמות מעקב-הטיפול נשארים עד הושלם', () => {
  it('showNames = stage !== done (לא רק new/lead/eyes)', () => {
    expect(cardSrc).toContain("const showNames = a.stage !== 'done';");
    // הדפוס הישן שהעלים את השמות במסירה חייב להיעלם
    expect(cardSrc).not.toContain("a.stage === 'new' || a.stage === 'lead' || a.stage === 'eyes'");
  });
});
