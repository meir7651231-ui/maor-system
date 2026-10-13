/**
 * ratchet — שמות לתפילה: קובץ מסודר להורדה/הדפסה (בקשת-בעלים 13.10 "שמות לתפילה להורדה" · "קובץ מסודר").
 *
 * עד היום היה רק "📋 העתקת הרשימה" פר-תורם. נוספו: מסמך-HTML מסודר (כותרת · תאריך · ספירה ·
 * רשימה ממוספרת תחת כל תורם) להדפסה/שמירה-כ-PDF — פר-תורם בכרטיס, וכל-הארגון בתפריט-התורמים.
 */
import { describe, expect, it } from 'vitest';
import { prayerDocHtml, prayerGroups } from '../prayer';
import type { PrayerName } from '../../../types/domain';
import viewSrc from '../SupportersView.tsx?raw';
import cardSrc from '../PrayerNames.tsx?raw';
import printSrc from '../../../lib/printDoc.ts?raw';

const pn = (id: string, name: string, note = '', done = false): PrayerName => ({ id, name, note, addedAt: '2026-10-13', done });

describe('🙏 prayerGroups — רק שמות פעילים, מקובצים לפי תורם', () => {
  it('שמות שהוזכרו (done) לא נכללים; תורם בלי פעילים לא נכלל; ממוין לפי שם-התורם', () => {
    const g = prayerGroups([
      { id: 's2', name: 'משה', prayerNames: [pn('a', 'אהרן בן שרה'), pn('b', 'דוד בן רחל', '', true)] },
      { id: 's1', name: 'אברהם', prayerNames: [pn('c', 'יוסף בן לאה', 'לרפואה')] },
      { id: 's3', name: 'גד', prayerNames: [pn('d', 'שמעון', '', true)] },
      { id: 's4', name: 'זבולון' },
    ]);
    expect(g.map((x) => x.supName)).toEqual(['אברהם', 'משה']);
    expect(g[1].names.map((p) => p.name)).toEqual(['אהרן בן שרה']);
  });

  it('רשומה פגומה (prayerNames שאינו מערך) לא מפילה', () => {
    expect(prayerGroups([{ id: 's', name: 'א', prayerNames: 'x' as never }])).toEqual([]);
  });
});

describe('🖨 prayerDocHtml — מסמך מסודר ובטוח', () => {
  it('כותרת, תאריך, ספירה, ורשימה ממוספרת "שם — הערה" תחת כל תורם', () => {
    const html = prayerDocHtml([{ supId: 's1', supName: 'אברהם', names: [pn('c', 'יוסף בן לאה', 'לרפואה')] }], { title: 'שמות לתפילה', dateLabel: '13/10/2026' });
    expect(html).toContain('dir="rtl"');
    expect(html).toContain('<h1>שמות לתפילה</h1>');
    expect(html).toContain('13/10/2026 · 1 שמות');
    expect(html).toContain('<h2>אברהם</h2><ol><li>יוסף בן לאה<span class="note"> — לרפואה</span></li></ol>');
  });

  it('escaping מלא — שם/הערה עם HTML לא מוזרק', () => {
    const html = prayerDocHtml([{ supId: 's', supName: '<b>x</b>', names: [pn('a', '<img src=x onerror=alert(1)>', '"q"')] }], { title: 't', dateLabel: 'd' });
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(html).toContain('&lt;b&gt;x&lt;/b&gt;');
  });

  it('אין שמות ⇒ הודעה ברורה במסמך', () => {
    expect(prayerDocHtml([], { title: 't', dateLabel: 'd' })).toContain('אין שמות לתפילה.');
  });
});

describe('🛡 הגנות-מקור — חיווט, פרטיות, שער-ייצוא', () => {
  it('כרטיס-התורם: כפתור "🖨 הורדה / הדפסה" ליד ההעתקה', () => {
    expect(cardSrc).toContain('🖨 הורדה / הדפסה');
    expect(cardSrc).toContain('printHtmlDoc(html)');
  });

  it('כל-הארגון: רק תורמים גלויים לעובד/ת (ייעוד-הרשאה), מגודר supporters.prayernames', () => {
    expect(viewSrc).toContain('prayerGroups(visibleSupportersForDesignations(db.supporters, desigLimit))');
    expect(viewSrc).toContain("featureOn(config, 'supporters.prayernames') && { label: '🙏 שמות לתפילה — קובץ מסודר'");
  });

  it('ההדפסה עוברת בשער יציאת-המידע (core.export)', () => {
    expect(printSrc).toContain('if (!guardExport()) return false;');
  });
});
