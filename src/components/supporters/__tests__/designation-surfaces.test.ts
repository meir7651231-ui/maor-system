/**
 * ratchet (הגנת-מקור) — נחיל-עמוק #2 (13.8): שלוש זליגות-ייעוד שהתיקון הראשון
 * (#127) לא כיסה, כולן בתוך מסך-התורמים ולא ברשימה הראשית:
 *   1. AyinBoard (לוח מעקב-הטיפול) — חשף שמות כל התורמים.
 *   2. דוח-יומי 📋 CSV — ייצא שם+טלפון של כל מטופל היום.
 *   3. OrgDonationCalendar (הלוח הכלל-ארגוני) — צבירת-תרומות מכל הייעודים.
 * הנעילה: כל שלושתם עוברים דרך מסנן-הייעוד (supporterVisibleForDesignations /
 * visibleSupportersForDesignations) לפני התצוגה/הייצוא.
 */
import { describe, expect, it } from 'vitest';
import ayinBoardSrc from '../AyinBoard.tsx?raw';
import donCalSrc from '../DonationCalendar.tsx?raw';
import viewSrc from '../SupportersView.tsx?raw';

describe('זליגות-ייעוד — הגנת-מקור על שלושת המשטחים', () => {
  it('AyinBoard מסנן את התור לפי מסנן-הייעוד', () => {
    expect(ayinBoardSrc).toContain('supporterVisibleForDesignations(sp, desigLimit)');
    expect(ayinBoardSrc).toContain("featureOn(cfg, 'supporters.purpose')");
  });

  it('OrgDonationCalendar עוטף את הכניסות ב-visibleSupportersForDesignations', () => {
    expect(donCalSrc).toContain('orgCalEntries(visibleSupportersForDesignations(supporters, desigLimit))');
  });

  it('הדוח-היומי מייצא רק תורמים גלויים (לא db.supporters הגולמי)', () => {
    expect(viewSrc).toContain('ayinDailyRows(config, visibleSupportersForDesignations(db.supporters, desigLimit)');
  });
});
