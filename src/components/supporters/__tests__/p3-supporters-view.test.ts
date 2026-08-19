/**
 * ratchet — מסך התומכות P3 (פריטים 12, 13, 14).
 * פריט 12: supScoreBins (10 סלים של 100) · supAvgDon (‎$×3.7‎) · sup12m —
 * הנוסחאות verbatim מהלגאסי (script:3018-3025).
 * פריט 13: פילטרים פר-עמודה בתחביר numMatch (scf:2809-2811) — כולל
 * ה-₪-שקול ×3.7 בעמודת הסה"כ.
 * פריט 14: סינון עם/בלי מונה + עודכן-היום + עמודת "שולם".
 */
import { describe, expect, it } from 'vitest';
import { sup12m, supAvgDon, supScoreBins } from '../lib';
import { numMatch } from '../../families/lib';
import viewSrc from '../SupportersView.tsx?raw';
import type { Supporter } from '../../../types/domain';

function sup(over: Partial<Supporter>): Supporter {
  return {
    id: 's' + Math.random().toString(36).slice(2, 6), name: 'x', phone: '', email: '', address: '',
    idNum: '', cat: '', forWho: '', notes: '', count: 0, ils: 0, usd: 0, first: '', last: '',
    nextDate: '', donations: [], ...over,
  };
}

describe('💛 ratchet — P3 מסך התומכות', () => {
  it('פריט 12: supAvgDon = סה"כ ₪-שקול (×3.7) / מספר תרומות; ריק = null', () => {
    expect(supAvgDon([sup({ ils: 300, count: 2 }), sup({ usd: 100, count: 1 })])).toBe(Math.round(670 / 3));
    expect(supAvgDon([sup({})])).toBeNull();
  });

  it('פריט 12: sup12m סופר last בתוך 365 יום; supScoreBins — 10 סלים', () => {
    const sups = [sup({ last: '2026-07-01' }), sup({ last: '2024-01-01' }), sup({})];
    expect(sup12m(sups, '2026-07-30')).toBe(1);
    const bins = supScoreBins(sups);
    expect(bins).toHaveLength(10);
    expect(bins.reduce((a, b) => a + b, 0)).toBe(3);
  });

  it('פריט 13: תחביר numMatch — N / N+ / N-M, וה-₪-שקול מסונן לפי השער העריך (הגנת-מקור)', () => {
    expect(numMatch('3+', 5)).toBe(true);
    expect(numMatch('3+', 2)).toBe(false);
    expect(numMatch('1-5', 3)).toBe(true);
    expect(numMatch('7', 7)).toBe(true);
    expect(viewSrc).toContain('numMatch(colF.total, Math.round(supTotalIls(sp, rate)))');
    // הכרעת 9.8 "לכולל": המונה בסינון כולל את ההיסטוריה (supCount, לא sp.count)
    expect(viewSrc).toContain('numMatch(colF.count, supCount(sp))');
    expect(viewSrc).toContain('numMatch(colF.score, supScore(sp, rate))');
    expect(viewSrc).toContain('const rate = db.usdRate');
  });

  // ANALYSIS §5 — שער-דולר עריך (הכרעת בעלים). השער מוזרק לחישובים; ברירת-מחדל 3.7.
  it('שער-דולר עריך: supTotalIls/supAvgDon מכבדים את השער שהוזרק', () => {
    const sups = [sup({ ils: 300, count: 2 }), sup({ usd: 100, count: 1 })];
    expect(supAvgDon(sups)).toBe(Math.round(670 / 3)); // ברירת-מחדל 3.7
    expect(supAvgDon(sups, 4)).toBe(Math.round(700 / 3)); // שער 4: 300 + 100*4 = 700
    expect(supAvgDon(sups, 3.5)).toBe(Math.round(650 / 3)); // שער 3.5: 300 + 350
  });

  it('פריט 14: צ׳יפי עם/בלי מונה ועודכן-היום + עמודת שולם (הגנת-מקור)', () => {
    expect(viewSrc).toContain('עם מונה');
    expect(viewSrc).toContain('בלי מונה');
    expect(viewSrc).toContain('עודכן היום');
    expect(viewSrc).toMatch(/key: 'paid', label: 'שולם'/);
    expect(viewSrc).toMatch(/sp\.ayin\?\.paid \? '✓' : '—'/);
    // 🐛 כותרת "כמות" (eyes) עברה דרך unitLabel — לא קשיחה (עוקבת אחרי מונח-הורטיקל)
    expect(viewSrc).toContain("case 'eyes':\n        return unitLabel(config);");
  });

  // באג "הסך תרומות לא מתעדכן" (19.8.2026, אחרי ייבוא/סנכרון נדרים): סה"כ-הכותרת
  // סכם את sp.ils/sp.usd השמורים (קבלות-בלבד) בעוד כל שורה מציגה supIls/supUsd
  // (כולל hist) ⇒ עסקאות-הסליקה נעלמו מהכותרת. הנעילה: הכותרת דרך supIls/supUsd.
  it('🛡 סה"כ-הכותרת כולל hist — supIls/supUsd, לא sp.ils/sp.usd השמורים (הגנת-מקור)', () => {
    expect(viewSrc).toContain('const tIls = visibleBase.reduce((a, x) => a + supIls(x), 0)');
    expect(viewSrc).toContain('const tUsd = visibleBase.reduce((a, x) => a + supUsd(x), 0)');
    // אסור שיחזור לצורה השמורה (קבלות-בלבד) שהקפיאה את הכותרת
    expect(viewSrc).not.toContain('(a, x) => a + (x.ils || 0)');
    expect(viewSrc).not.toContain('(a, x) => a + (x.usd || 0)');
  });

  it('🛡 תצוגת-גריד לתורמים (5.8, בקשת-בעלים) — כמו המשפחות, נשמרת ב-db.ui.supView', () => {
    // מובייל: הטבלה הרחבה דורשת גלילה-צידית; הגריד = כרטיסים ידידותיים-למגע.
    // UX סבב-ד׳: ברירת-מחדל חכמה — מסך-צר בלי העדפה ⇒ גריד; בחירה מפורשת גוברת
    expect(viewSrc).toContain("db.ui.supView ?? (typeof window !== 'undefined' && window.matchMedia('(max-width: 760px)').matches ? 'grid' : 'list')");
    expect(viewSrc).toContain("supView === 'grid' ?");
    expect(viewSrc).toContain("repeat(auto-fill, minmax(220px, 1fr))");
    // המונח דינמי (ורטיקלים!) והסכום דרך totalLabel (₪+$ — לא ils בלבד)
    expect(viewSrc).toMatch(/termOf\(config, 'entity\.donations', 'תרומות'\)[\s\S]{0,60}totalLabel\(sp\)/);
  });

  // 🐛 ratchet — טבלת-14-עמודות גולשת אופקית בלי רמז: המשתמש לא ידע שיש עוד
  // עמודות. הפתרון: מחלקת scroll-shadow משותפת (.hscroll) על מיכל-הגלילה —
  // צל בקצה רק כשיש תוכן מוסתר. אומת בצילום (עודף 452px, הצל מתהפך בין הקצוות).
  it('🛡 טבלת-התורמים נושאת רמז-גלילה (hscroll) על מיכל ה-overflowX', () => {
    // המיכל הרחב חייב את מחלקת-הצל, לצד overflowX:auto (מלכודת-הגלגלת נשמרת)
    expect(viewSrc).toContain('className="card hscroll"');
    expect(viewSrc).toMatch(/className="card hscroll"[\s\S]{0,80}overflowX: 'auto', overflowY: 'hidden'/);
  });

  // פאנל-סינון מתקדם (בקשת-בעלים) — עוטף דרגות/הו״ק/מעקב לפאנל מתקפל; החיפוש
  // והקטגוריה גלויים תמיד. אפס אובדן: כל הצ׳יפים והסינון נשמרים, רק מתקפלים.
  it('🛡 פאנל-סינון מתקדם עוטף את הצ׳יפים (הסינון נשמר, רק מתקפל)', () => {
    expect(viewSrc).toContain('🔎 סינון מתקדם');
    // העטיפה: מוצג רק כשיש תוכן-מתקדם ורק כשפתוח; באדג׳ של מספר-הפעילים
    expect(viewSrc).toContain('{hasAdvFilters && advOpen && (');
    expect(viewSrc).toContain('const advActive = (tierF ? 1 : 0) + (hokF ? 1 : 0) + (ayinF ? 1 : 0)');
    // הצ׳יפים עצמם עדיין קיימים בתוך הפאנל (אפס אובדן-יכולת)
    expect(viewSrc).toContain('דרגות (לחיצה מסננת):');
    expect(viewSrc).toContain('עם מונה');
    // מחלקת-ה-CSS (.hscroll) מוגדרת ב-global.css עם background-attachment
    // local+scroll (אומת ידנית בצילום; global.css מיובא-גלובלי ולא ניתן-raw בבדיקה).
  });

  // 🔁 חשיפת זיהוי-הו"ק-מהיסטוריה מחוץ לשער-הענן — המנוע (detectRecurringHok)
  // מקומי-טהור, נבדק ב-nedarim-hok.test; הכפתור היה קבור ב-NedarimSyncModal שנעול
  // payments+ענן. נוסף לבלוק-הו"ק, מוצג רק כשיש חיובי-נדרים ב-hist.
  it('🛡 כפתור "זהה הו״ק מהיסטוריה" חשוף (detectNedarimHok, מגודר hasNedarimHist)', () => {
    expect(viewSrc).toContain('🔁 זהה הו״ק מהיסטוריה');
    expect(viewSrc).toContain('detectNedarimHok()');
    expect(viewSrc).toContain("(sp.hist ?? []).some((h) => h.clearer === 'נדרים')");
  });
});
