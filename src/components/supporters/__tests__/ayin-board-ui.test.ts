/**
 * ratchet — 🩺 לוח מעקב-הטיפול · תצוגה (ביקורת-עומק 3.9.2026, שלוש עדשות: מפרט/חיווט/ריצה).
 * הגנות-מקור (?raw) על התיקונים שאומתו מול הלגאסי (markup:1412-1414, script:2920-2921,
 * 2957, 2973) ומול ריצת-Playwright (ממצאים F2/F4/F6):
 *  - שורת-כותרות לעמודות (שני התאריכים היו בלי תווית — אי-אפשר להבדיל יעד מעדכון);
 *  - מתג-קיפול פנימי כפול הוסר (העוטף ב-SupportersView הוא השער, הכרעת-בעלים 19.8);
 *  - מונה "N מתוך M" תחת סינון-שלב; ריק-בגלל-סינון ≠ "אין פריטים פעילים";
 *  - יעד שעבר מסומן (אדום · ⚠ · title) + השעה נלווית לתאריך; מונה 0 לא מודפס;
 *  - צ'יפ "💰 שולם" רק כשהשער opt-in (=== true) — כבוי ⇒ ביט-זהה;
 *  - מובייל: className לשורה + כללי-CSS מתחת ל-760px (הכפתור-החכם היה ב-x≈−65);
 *  - כרטיס: באנר-סיום ב'הושלם' + "🔁 שוב" מנוטרל בלי תאריך;
 *  - דליפות-מונח: th "תורם/ת", כותרת-הלוח, "כל השמות", טוסטים — דרך termOf/featLabel;
 *  - מוני-הטיפול על visibleBase (לא db.supporters) + מונה על מתג-ההצגה + "(N)" בדוח-היומי.
 * הלוח נשאר סגור כברירת-מחדל — מחרוזות-הרטצ'ט '▲ הסתרה'/'▼ הצגה' נשמרות verbatim.
 */
/// <reference types="node" />
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import boardSrc from '../AyinBoard.tsx?raw';
import cardSrc from '../AyinCard.tsx?raw';
import namesSrc from '../AyinNamesBoard.tsx?raw';
import viewSrc from '../SupportersView.tsx?raw';

// ‏global.css?raw חוזר ריק תחת vitest (עיבוד-CSS של vite) ⇒ קוראים את הקובץ ישירות.
const CSS = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../../styles/global.css'), 'utf8');

describe('🩺 AyinBoard — שורת-כותרות, מונה, יעד-שעבר, צ׳יפ-שולם, מובייל', () => {
  it('שורת-כותרות (לגאסי markup:1412-1414) — 6 תוויות, המונה דרך unitLabel', () => {
    expect(boardSrc).toContain('className="ayin-row ayin-head"');
    expect(boardSrc).toContain('<span>שם</span>');
    expect(boardSrc).toContain('<span>שלב הטיפול</span>');
    expect(boardSrc).toContain("'שמות + ' + unitLabel(cfg)");
    expect(boardSrc).toContain('<span>🎯 יעד</span>');
    expect(boardSrc).toContain('<span>עדכון אחרון</span>');
    expect(boardSrc).toContain('<span>הפעולה הבאה</span>');
    // אותה תבנית-גריד לכותרות ולשורות — העמודות מתיישרות
    expect(boardSrc.match(/gridTemplateColumns: ROW_GRID/g)?.length).toBe(2);
  });

  it('אין מתג-קיפול פנימי (useState(true) / "הסתר") — הקיפול היחיד הוא של העוטף', () => {
    expect(boardSrc).not.toMatch(/useState\(true\)/);
    expect(boardSrc).not.toContain('setOpen');
    expect(boardSrc).not.toContain("'הסתר'");
  });

  it('מונה-הכותרת עוקב אחרי סינון-השלב ("N מתוך M"), וריק-בגלל-סינון מקבל נוסח משלו', () => {
    expect(boardSrc).toContain("rows.length + ' מתוך ' + active.length");
    expect(boardSrc).toContain("'אין פריטים בשלב זה'");
    expect(boardSrc).toContain('active.length > 0');
    // הנוסח ההיסטורי לריק-אמיתי נשמר
    expect(boardSrc).toContain('אין פריטים פעילים בלוח — פתחו כרטיס ');
  });

  it('יעד שעבר: isoToday + סימון "באיחור" (⚠ · אדום · title); השעה נלווית (לגאסי script:2921)', () => {
    expect(boardSrc).toContain("import { isoToday } from '../../lib/date-util'");
    expect(boardSrc).toContain('a.nextTalk < today');
    expect(boardSrc).toContain("'באיחור'");
    expect(boardSrc).toContain("'⚠ '");
    expect(boardSrc).toContain("'#b3261e'");
    expect(boardSrc).toContain("' · ' + a.nextTalkTime");
  });

  it('שורת-השמות: מונה ריק/0 לא מודפס (לגאסי script:2920 — בדיקת-אמת)', () => {
    expect(boardSrc).toContain("(+n.eyes || 0) > 0 ? ' ·' + n.eyes");
    expect(boardSrc).not.toContain("n.eyes !== '' && n.eyes != null");
  });

  it('צ׳יפ "💰 שולם" מגודר opt-in מפורש (=== true) — חסר-הדגל ⇒ אין צ׳יפ', () => {
    expect(boardSrc).toContain("cfg.features?.['supporters.ayin.paygate'] === true");
    expect(boardSrc).toContain('payGateOn && a.paid');
    expect(boardSrc).toContain('💰 שולם');
  });

  it('מובייל: לשורה className="ayin-row" (הגריד ה-inline נשאר לדסקטופ)', () => {
    expect(boardSrc).toContain('className="ayin-row"');
    expect(boardSrc).toContain("const ROW_GRID = 'minmax(90px,.9fr) 1.6fr 1.1fr .8fr .8fr 140px'");
  });

  it('לא נגענו בנרמול-השלב של הסינון ובחיווט הכפתור-החכם', () => {
    expect(boardSrc).toContain("(sp.ayin!.stage || 'new') === filter");
    expect(boardSrc).toContain('advance(sp.id)');
    expect(boardSrc).toContain('{ayinAdvanceLabel(cfg, a)}');
  });
});

describe('🗂 AyinCard — באנר-סיום ו-"🔁 שוב"', () => {
  it('ב-"הושלם" מוצג באנר-סיום (לגאסי doneLine markup:2730-2731) מעל "↻ מחזור חדש"', () => {
    expect(cardSrc).toContain("a.stage === 'done' && (");
    expect(cardSrc).toContain("'✓ הטיפול הושלם · '");
    expect(cardSrc).toContain("' נמסרו · '");
    expect(cardSrc.indexOf('הטיפול הושלם')).toBeLessThan(cardSrc.indexOf('↻ מחזור חדש'));
  });

  it('"🔁 שוב" מנוטרל בלי מועד (לגאסי script:2957 הסתיר אותו) — עם title מסביר', () => {
    expect(cardSrc).toContain('disabled={!a.nextTalk}');
    expect(cardSrc).toContain('🔁 שוב');
  });
});

describe('📋 AyinNamesBoard — כותרת-העמודה דרך termOf', () => {
  it('<th>תורם/ת</th> הקשיח הוחלף ב-termOf עם אותה ברירת-מחדל', () => {
    expect(namesSrc).toContain("<th>{termOf(config, 'entity.supporter', 'תורם/ת')}</th>");
    expect(namesSrc).not.toContain('<th>תורם/ת</th>');
  });
});

describe('💛 SupportersView — כותרת-הלוח, מונה על המתג, מונים על visibleBase, דליפות-מונח', () => {
  it('כותרת-הלוח דרך featLabel (לא "לוח מעקב הטיפול" קשיח — דלף בחבילות המסחריות)', () => {
    expect(viewSrc).toContain("{'🩺 לוח ' + featLabel(config)}");
    expect(viewSrc).not.toContain('🩺 לוח מעקב הטיפול');
  });

  it('מתג-ההצגה נושא מונה-פעילים; מחרוזות-הרטצ׳ט "▲ הסתרה"/"▼ הצגה" נשמרות verbatim', () => {
    expect(viewSrc).toContain("ayinBoardOpen ? '▲ הסתרה' : '▼ הצגה'");
    expect(viewSrc).toContain("(ayinBoardOpen ? '▲ הסתרה' : '▼ הצגה') + (ayinActiveCount ? ' · ' + ayinActiveCount : '')");
    expect(viewSrc).toContain(
      'const ayinActiveCount = visibleBase.filter((sp) => ayinActive(sp.ayin)).length;' /* לא useMemo — return-מוקדם (warehouseMode) לפניו */,
    );
    // ברירת-המחדל נשארת סגורה (הרטצ'ט המקורי — ayin-board-default.test.ts)
    expect(viewSrc).toMatch(/const \[ayinBoardOpen, setAyinBoardOpen\] = useState\(false\)/);
  });

  it('"כל השמות" ותפריט-⋯ דרך מונח-הפריט — ברירת-המחדל "שמות" ביט-זהה (המונח יחיד: "שם לטיפול")', () => {
    expect(viewSrc).toContain("const ayinItemsLabel = termOf(config, 'entity.ayinItem', 'שמות')");
    expect(viewSrc).toContain("{'📋 כל ה' + ayinItemsLabel}");
    expect(viewSrc).toContain("' — כל ה' + ayinItemsLabel");
    expect(viewSrc).not.toContain('📋 כל השמות');
  });

  it('מוני-הטיפול על visibleBase (הרשאת-ייעוד) — לא על db.supporters; "(N)" בדוח-היומי', () => {
    expect(viewSrc).toContain("'עודכן היום · ' + ayinTodayCount");
    expect(viewSrc).toContain("'📋 דוח יומי (' + ayinTodayCount + ')'");
    expect(viewSrc).toMatch(/const ayinTodayCount = visibleBase\.filter\(/);
    expect(viewSrc).not.toMatch(/db\.supporters\.filter\(\(sp\) => sp\.ayin && \(sp\.ayin\.lastTouch === today/);
    // צ'יפי-הו"ק באותו כלל
    expect(viewSrc).toContain("visibleBase.filter((sp) => sp.hok?.active).length");
    expect(viewSrc).toContain("'⏳ טרם נרשמו החודש · ' + hokDue(visibleBase, today).length");
  });

  it('טוסטי דוח-השמות דרך termOf — הנוסח ההיסטורי כברירת-מחדל', () => {
    expect(viewSrc).toContain("'עדיין לא נוספו ' + ayinItemsLabel + ' בכרטיסי ' + termOf(config, 'nav.ayin', 'מעקב-הטיפול')");
    expect(viewSrc).toContain("'דוח ' + ayinItemsLabel + ': ' + (rows.length - 1) + ' ' + ayinItemsLabel + ' — הקובץ ירד'");
    expect(viewSrc).not.toContain("'עדיין לא נוספו שמות בכרטיסי מעקב-הטיפול'");
  });
});

describe('📱 global.css — לוח-הטיפול במובייל (ריצה 3.9, F2: הכפתור-החכם ב-x≈−65)', () => {
  it('כללי .ayin-row / .ayin-head בתוך בלוק max-width: 760px', () => {
    expect(CSS).toMatch(
      /@media \(max-width: 760px\) \{\s*\.ayin-row \{\s*grid-template-columns: 1fr 1fr !important;\s*\}/,
    );
    expect(CSS).toMatch(/\.ayin-row > :nth-child\(3\) \{\s*grid-column: 1 \/ -1;\s*white-space: normal !important;/);
    expect(CSS).toMatch(/\.ayin-row > :last-child \{\s*grid-column: 1 \/ -1;/);
    expect(CSS).toMatch(/\.ayin-head \{\s*display: none !important;/);
  });
});
