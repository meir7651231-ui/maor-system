/**
 * ratchet — גיליון העיניים round-trip (P0.4, feature supporters.ayin.sheet).
 *
 * מקור האמת בלגאסי (legacy-main-script.js):
 * - ייצוא: 196-198 (exportImportFormat, kind==='ayin') — כותרת 8 עמודות,
 *   שורה פר-שם, 'שולם' ברמת התיק (a.paid), פסיקים בתשובה → רווח.
 * - ייבוא: 852-869 (processImport) — זיהוי עמודות לפי הכלה, normName להתאמה,
 *   yes()=/כן|yes|✓|v|שולם/i, שורה בלי שום ערך מדולגת, שם לא קיים נספר miss,
 *   שגיאה רק על חוסר עמודות "שם למסירה"/"כמה עיניים".
 * - החלה: 983-993 (applyImport) — eyes השתנה → unshift ל-log; done; paid על
 *   התיק; answer בדה-דופ + answeredNote; lead='כן' ו-stage לא מתקדם → 'eyes';
 *   תמיד lastTouch=today.
 */
import { describe, expect, it } from 'vitest';
import {
  AYIN_SHEET_HEADER,
  applyAyinSheet,
  ayinSheetRows,
  parseAyinSheet,
} from '../ayin';
import { emptyAyin, type Supporter } from '../../types/domain';

const TODAY = '2026-07-29';

function sup(over: Partial<Supporter>): Supporter {
  return {
    id: 'sp1',
    name: 'גולדשטיין',
    phone: '054-7654321',
    email: '',
    address: '',
    idNum: '',
    cat: '',
    forWho: '',
    notes: '',
    count: 0,
    ils: 0,
    usd: 0,
    first: '',
    last: '',
    nextDate: '',
    donations: [],
    ...over,
  };
}

/** תומכת עם תיק פעיל — שני שמות, תשובה קודמת, שלב lead. */
function seeded(): Supporter[] {
  return [
    sup({
      id: 'sp1',
      name: 'גולדשטיין',
      ayin: {
        ...emptyAyin(),
        stage: 'lead',
        names: [
          { id: 'an1', name: 'לאה בת חנה', eyes: 2, done: false },
          { id: 'an2', name: 'רחל בת שרה', eyes: '', done: false },
        ],
        answers: [{ date: '2026-07-01', note: 'תשובה קיימת' }],
        answeredNote: 'תשובה קיימת',
      },
    }),
    sup({ id: 'sp2', name: 'ברגר', phone: '', ayin: { ...emptyAyin(), stage: 'done', paid: true, names: [{ id: 'an3', name: 'שם אחר', eyes: 5, done: true }] } }),
    sup({ id: 'sp3', name: 'בלי תיק' }),
  ];
}

describe('📤 ייצוא — ayinSheetRows (legacy:196-198)', () => {
  it('כותרת מדויקת + שורה פר-שם; שולם פר-תיק; eyes ריק נשאר ריק', () => {
    const rows = ayinSheetRows(seeded());
    expect(rows[0]).toEqual([...AYIN_SHEET_HEADER]);
    expect(rows).toHaveLength(4); // כותרת + 2 שמות של sp1 + שם אחד של sp2
    expect(rows[1]).toEqual(['גולדשטיין', '054-7654321', 'לאה בת חנה', '2', 'לא', 'לא', 'תשובה קיימת', 'לא']);
    expect(rows[2][3]).toBe(''); // eyes '' → ריק
  });

  // 🔁 בקשת-בעלים 31.8: הורדה-מסוננת — keep מגביל לשמות שנבחרו (הסינון המקסימלי).
  it('keep מגביל לשמות הנבחרים בלבד; חסר-keep = כל השמות (ביט-זהה)', () => {
    const data = seeded();
    const all = ayinSheetRows(data);
    // רק "לאה בת חנה" של sp1 — שאר השמות מסוננים החוצה
    const only = ayinSheetRows(data, (sid, nm) => sid === 'sp1' && nm === 'לאה בת חנה');
    expect(only).toHaveLength(2); // כותרת + שורה אחת
    expect(only[0]).toEqual([...AYIN_SHEET_HEADER]);
    expect(only[1][2]).toBe('לאה בת חנה');
    // keep שמחזיר תמיד true = זהה להורדה-המלאה (אין רגרסיה)
    expect(ayinSheetRows(data, () => true)).toEqual(all);
    // sp2: תיק paid ו-stage done → שולם 'כן', עופרת 'כן', נמסר 'כן'
    expect(all[3]).toEqual(['ברגר', '', 'שם אחר', '5', 'כן', 'כן', '', 'כן']);
  });

  it('פסיקים בתשובה מוחלפים ברווח (לא שוברים CSV, כמו בלגאסי)', () => {
    const s = seeded();
    s[0].ayin!.answers = [{ date: '2026-07-01', note: 'א, ב, ג' }];
    const rows = ayinSheetRows(s);
    expect(rows[1][6]).toBe('א  ב  ג');
  });
});

describe('📥 ייבוא — parseAyinSheet (legacy:852-869)', () => {
  it('round-trip מלא: ייצוא → שינוי ערכים → ייבוא → החלה — כל השדות מתעדכנים', () => {
    const sups = seeded();
    const rows = ayinSheetRows(sups);
    // המזכירה ממלאת: לאה 3 עיניים+נמסר, התיק שולם, תשובה חדשה, עופרת בוצעה.
    // 'שולם' הוא פר-תיק ומיושם שורה-אחר-שורה (האחרונה גוברת, כמו בלגאסי) —
    // לכן מילוי אמיתי מסמן את כל שורות התיק.
    rows[1] = ['גולדשטיין', '054-7654321', 'לאה בת חנה', '3', 'כן', 'כן', 'תשובה חדשה', 'כן'];
    rows[2] = ['גולדשטיין', '054-7654321', 'רחל בת שרה', '', 'לא', 'כן', '', 'כן'];
    const parsed = parseAyinSheet(rows, sups);
    expect(parsed.error).toBeUndefined();
    expect(parsed.miss).toBe(0);
    // כמו בלגאסי: 'לא' בעמודות נמסר/שולם/עופרת הוא ערך (yes()=false) — לכן גם
    // שורות שחזרו ללא שינוי נספרות כעדכון (3: לאה שעודכנה, רחל, ושל sp2)
    expect(parsed.upds).toHaveLength(3);
    const applied = applyAyinSheet(sups, parsed.upds, TODAY);
    const a = applied.supporters[0].ayin!;
    // eyes השתנה 2→3 → רישום log בראש + עדכון השם
    expect(applied.logged).toBe(1);
    expect(a.log[0]).toEqual({ date: TODAY, eyes: 3, name: 'לאה בת חנה' });
    expect(a.names.find((n) => n.id === 'an1')!.eyes).toBe(3);
    expect(a.names.find((n) => n.id === 'an1')!.done).toBe(true);
    // paid ברמת התיק (לא על השם — הכרעת הארכיטקט לפי legacy:990, 197)
    expect(a.paid).toBe(true);
    expect((a.names[0] as { paid?: boolean }).paid).toBeUndefined();
    // תשובה חדשה נכנסת בראש + answeredNote
    expect(a.answers[0]).toEqual({ date: TODAY, note: 'תשובה חדשה' });
    expect(a.answeredNote).toBe('תשובה חדשה');
    // עופרת בוצעה ושלב lead (לא מתקדם) → stage='eyes'
    expect(a.stage).toBe('eyes');
    expect(a.lastTouch).toBe(TODAY);
    // אימוטביליות — המקור לא שונה
    expect(sups[0].ayin!.names[0].eyes).toBe(2);
  });

  it('שורה של sp2 שחוזרת ללא שינוי ערכים עדיין נספרת (done/paid/lead מלאים) אך אינה משנה תוכן', () => {
    const sups = seeded();
    const rows = ayinSheetRows(sups);
    const parsed = parseAyinSheet(rows, sups);
    // שורת ברגר: '5','כן','כן','','כן' — יש ערכים ⇒ עדכון (כמו בלגאסי, שם אין השוואת-שינוי בפענוח)
    const upd = parsed.upds.find((u) => u.supporterId === 'sp2')!;
    expect(upd).toBeDefined();
    const applied = applyAyinSheet(sups, parsed.upds, TODAY);
    const a2 = applied.supporters[1].ayin!;
    expect(applied.logged).toBe(0); // eyes 5→5: לא השתנה — אין רישום log
    expect(a2.stage).toBe('done'); // כבר מתקדם — lead לא מוריד אותו
    expect(a2.lastTouch).toBe(TODAY);
  });

  it('eyes=0 הוא ערך תקין (ספרות בלבד) — נקלט ומתועד', () => {
    const sups = seeded();
    const parsed = parseAyinSheet(
      [[...AYIN_SHEET_HEADER], ['גולדשטיין', '', 'לאה בת חנה', '0', '', '', '', '']],
      sups,
    );
    expect(parsed.upds).toHaveLength(1);
    expect(parsed.upds[0].eyes).toBe(0);
    const applied = applyAyinSheet(sups, parsed.upds, TODAY);
    expect(applied.logged).toBe(1); // 2→0 השתנה
    expect(applied.supporters[0].ayin!.names[0].eyes).toBe(0);
  });

  it('שם שלא קיים נספר miss; שורה ריקה לגמרי מדולגת בלי miss', () => {
    const sups = seeded();
    const parsed = parseAyinSheet(
      [
        [...AYIN_SHEET_HEADER],
        ['גולדשטיין', '', 'שם שלא קיים', '4', '', '', '', ''],
        ['גולדשטיין', '', 'רחל בת שרה', '', '', '', '', ''],
      ],
      sups,
    );
    expect(parsed.miss).toBe(1);
    expect(parsed.upds).toHaveLength(0);
  });

  it('דה-דופ תשובות — תשובה שכבר קיימת לא נכנסת שוב', () => {
    const sups = seeded();
    const parsed = parseAyinSheet(
      [[...AYIN_SHEET_HEADER], ['גולדשטיין', '', 'לאה בת חנה', '', '', '', 'תשובה קיימת', '']],
      sups,
    );
    expect(parsed.upds).toHaveLength(1);
    const applied = applyAyinSheet(sups, parsed.upds, TODAY);
    const a = applied.supporters[0].ayin!;
    expect(a.answers).toHaveLength(1); // לא נוספה כפולה
    expect(a.lastTouch).toBe(TODAY); // אבל המגע נרשם
  });

  it('עמודות חסרות — שגיאה רק על "שם למסירה"/"כמה עיניים"; זיהוי לפי הכלה', () => {
    const sups = seeded();
    expect(parseAyinSheet([['תומכת', 'טלפון'], ['x', 'y']], sups).error).toContain('חסרות עמודות');
    // בלי עמודת תומכת — עדיין עובד (התאמה לפי שם בלבד)
    const parsed = parseAyinSheet(
      [['שם למסירה', 'כמה עיניים'], ['לאה בת חנה', '7']],
      sups,
    );
    expect(parsed.error).toBeUndefined();
    expect(parsed.upds).toHaveLength(1);
    expect(parsed.upds[0].supporterId).toBe('sp1');
  });

  it('yes() — כן/yes/✓/v/שולם כולם אמת; ערך אחר שקר (legacy:860)', () => {
    const sups = seeded();
    for (const [val, expected] of [['כן', true], ['yes', true], ['✓', true], ['v', true], ['שולם', true], ['לא', false], ['x', false]] as const) {
      const parsed = parseAyinSheet(
        [[...AYIN_SHEET_HEADER], ['גולדשטיין', '', 'לאה בת חנה', '', '', val, '', '']],
        sups,
      );
      expect(parsed.upds[0]?.paid).toBe(expected);
    }
  });
});

// 🔁 בקשת-בעלים 31.8: "כפתור להורדה + סינון מקסימלי מה להוריד + צמוד אליו העלאה
// באותו סגנון" — במסך-השמות המלא (AyinNamesBoard), לצד הסינון הקיים.
describe('🔁 הגנת-מקור — הורדה-מסוננת + ייבוא במסך-השמות', () => {
  it('AyinNamesBoard בונה keep מהסינון (shown) ומוריד רק אותו, וצמוד ייבוא-דו-שלבי', async () => {
    const src = await import('../../components/supporters/AyinNamesBoard.tsx?raw').then((m) => m.default);
    // הורדה מסוננת — keys מ-shown, ו-ayinSheetRows עם predicate
    expect(src).toContain('shown.map((it) => it.supporterId');
    expect(src).toContain('ayinSheetRows(supporters, (sid, nm) => keys.has');
    expect(src).toContain("downloadCsv('maor-ayin-eyes.csv', rows)");
    // ייבוא צמוד — קלט-קובץ + parseAyinSheet + החלה דרך ה-store
    expect(src).toContain('parseAyinSheet(parseCsv(await readCsvFileText(file))');
    expect(src).toContain('applySheet(parsed.upds)');
    expect(src).toContain('⬆ ייבוא גיליון שמולא');
    // מגודר באותו תת-דגל של גיליון-ההגדרות (חסר=פעיל, ביט-זהה)
    expect(src).toContain("featureOn(config, 'supporters.ayin.sheet')");
  });
});
