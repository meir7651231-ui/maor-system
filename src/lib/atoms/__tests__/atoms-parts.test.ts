/**
 * ratchet — 🧩 שכבת החלקים (ATOMS, 14.10.2026): ההתנהגות הגנרית של שמונת המנועים הקטנים.
 * מה זה שומר: כל חלק עובד על "סוג" ולא על מוצר — מספרים, רצפים, רשימות, טקסט — ולא זורק על קלט
 * זבל. קצוות: אפס, שלילי, ריק, שארית שלא מתחלקת, סכום שחייב לצאת מדויק, דטרמיניזם.
 */
import { describe, expect, it } from 'vitest';
import {
  dayIndex,
  divideAmount,
  divideSpan,
  escalationPlan,
  escalationState,
  fairAssign,
  firstRun,
  fuzzyFind,
  mergeRuns,
  nextAfter,
  offsetAll,
  pointsAt,
  resolveRelative,
  roundAll,
  roundTo,
  turnIndex,
  turnOf,
  wordScore,
} from '../parts';

const GARBAGE: unknown[] = [undefined, null, NaN, Infinity, 'x', {}, [], -1, 0];

describe('✂️ divide', () => {
  it('לפי מספר: 12 חלקים שווים, הגבולות רציפים והאחרון נגמר בדיוק בסוף', () => {
    const p = divideSpan({ from: 360, to: 1080 }, { parts: 12 });
    expect(p).toHaveLength(12);
    expect(p[0]).toEqual({ from: 360, to: 420, length: 60 });
    expect(p[11].to).toBe(1080);
    for (let i = 1; i < p.length; i++) expect(p[i].from).toBe(p[i - 1].to);
  });
  it('לפי גודל: עם הפסקה; שארית נזרקת או מקוצרת', () => {
    expect(divideSpan({ from: 0, to: 100 }, { size: 30, gap: 5 })).toEqual([
      { from: 0, to: 30, length: 30 },
      { from: 35, to: 65, length: 30 },
      { from: 70, to: 100, length: 30 },
    ]);
    expect(divideSpan({ from: 0, to: 95 }, { size: 30, gap: 5 })).toHaveLength(2); // 70→100 חורג — נזרק
    expect(divideSpan({ from: 0, to: 95 }, { size: 30, gap: 5, remainder: 'shorten' }).at(-1)).toEqual({ from: 70, to: 95, length: 25 });
    expect(divideSpan({ from: 0, to: 100 }, { size: 30, remainder: 'shorten' }).at(-1)).toEqual({ from: 90, to: 100, length: 10 });
    expect(divideSpan({ from: 0, to: 90 }, { size: 30 })).toHaveLength(3); // מתחלק בדיוק — אין שארית
  });
  it('טווח אפס / הפוך / קלט זבל ⇒ [] בלי לזרוק; תקרת-בטיחות', () => {
    expect(divideSpan({ from: 5, to: 5 }, { size: 1 })).toEqual([]);
    expect(divideSpan({ from: 5, to: 1 }, { parts: 2 })).toEqual([]);
    expect(divideSpan({ from: 0, to: 10 }, { parts: 0 })).toEqual([]);
    expect(divideSpan({ from: 0, to: 10 }, { size: -3 })).toEqual([]);
    expect(divideSpan({ from: 0, to: 1e9 }, { size: 1 })).toHaveLength(10_000);
    for (const g of GARBAGE) expect(() => divideSpan(g as never, g as never)).not.toThrow();
  });
  it('pointsAt: 3, 4 ו-6 מתוך 12; גם שבר', () => {
    expect(pointsAt({ from: 360, to: 1080 }, 12, [3, 4, 6, 10.75])).toEqual([540, 600, 720, 1005]);
    expect(pointsAt({ from: 0, to: 10 }, 0, [1])).toEqual([]);
    expect(pointsAt({ from: 0, to: 12 }, 12, [NaN, 1])).toEqual([1]);
  });
  it('divideAmount: הסכום יוצא בדיוק, השארית לחלק הראשון', () => {
    expect(divideAmount(100, 3)).toEqual([34, 33, 33]);
    expect(divideAmount(100, 4)).toEqual([25, 25, 25, 25]);
    expect(divideAmount(0, 3)).toEqual([0, 0, 0]);
    expect(divideAmount(-100, 3)).toEqual([-34, -33, -33]);
    expect(divideAmount(1000, 3, 50)).toEqual([400, 300, 300]);
    const cents = divideAmount(100, 3, 0.01);
    expect(cents).toEqual([33.34, 33.33, 33.33]);
    expect(Math.round(cents.reduce((a, b) => a + b, 0) * 100)).toBe(10000);
    for (const [t, n] of [[7, 7], [1, 5], [999, 10], [12345, 7]] as const) expect(divideAmount(t, n).reduce((a, b) => a + b, 0)).toBe(t);
    expect(divideAmount(10, 0)).toEqual([]);
    expect(divideAmount(NaN, 3)).toEqual([]);
    for (const g of GARBAGE) expect(() => divideAmount(g as never, g as never, g as never)).not.toThrow();
  });
});

describe('🔗 merge', () => {
  it('רצפים צמודים; רווח שובר', () => {
    expect(mergeRuns([0, 1, 1, 0, 1, 0, 0, 1, 1, 1])).toEqual([
      { from: 1, to: 2, length: 2 },
      { from: 4, to: 4, length: 1 },
      { from: 7, to: 9, length: 3 },
    ]);
  });
  it('maxGap בולע רווח קצר; minLength מסנן; רווח בקצה לא נכלל', () => {
    expect(mergeRuns([1, 0, 1, 0, 0, 1, 0], undefined, { maxGap: 1 })).toEqual([
      { from: 0, to: 2, length: 3 },
      { from: 5, to: 5, length: 1 },
    ]);
    expect(mergeRuns([1, 0, 1, 1, 0, 1], undefined, { minLength: 2 })).toEqual([{ from: 2, to: 3, length: 2 }]);
  });
  it('עם פרדיקט על אובייקטים', () => {
    const days = ['פנוי', 'תפוס', 'תפוס', 'פנוי'].map((s) => ({ s }));
    expect(mergeRuns(days, (d) => d.s === 'תפוס')).toEqual([{ from: 1, to: 2, length: 2 }]);
  });
  it('ריק / זבל ⇒ [] בלי לזרוק', () => {
    expect(mergeRuns([])).toEqual([]);
    expect(mergeRuns([0, 0])).toEqual([]);
    for (const g of GARBAGE) expect(() => mergeRuns(g as never, g as never, g as never)).not.toThrow();
  });
});

describe('⏭️ next', () => {
  it('nextAfter: אחרי עכשיו (לא כולל), ממוין, count', () => {
    expect(nextAfter([600, 300, 900, 720], 600)).toEqual([720]);
    expect(nextAfter([600, 300, 900, 720], 0, 2)).toEqual([300, 600]);
    expect(nextAfter(['08:00', '06:30', '19:15'], '07:00', 5)).toEqual(['08:00', '19:15']);
    expect(nextAfter([1, 2], 5)).toEqual([]);
    expect(nextAfter([1, 2], 0, 0)).toEqual([]);
  });
  it('nextAfter: סוג אחר / פגום מדולג; זבל לא זורק', () => {
    expect(nextAfter([NaN, 3, '4' as never, 5], 2, 9)).toEqual([3, 5]);
    for (const g of GARBAGE) expect(() => nextAfter(g as never, g as never, g as never)).not.toThrow();
  });
  it('firstRun: האורך המינימלי, וחיתוך רצף שכבר התחיל', () => {
    const runs = mergeRuns([1, 1, 0, 1, 0, 1, 1, 1]);
    expect(firstRun(runs, 3)).toEqual({ from: 5, to: 7, length: 3 });
    expect(firstRun(runs, 1, 1)).toEqual({ from: 1, to: 1, length: 1 });
    expect(firstRun(runs, 2, 1)).toEqual({ from: 5, to: 7, length: 3 });
    expect(firstRun(runs, 9)).toBeNull();
    expect(firstRun([], 1)).toBeNull();
    for (const g of GARBAGE) expect(() => firstRun(g as never, g as never, g as never)).not.toThrow();
  });
});

describe('🎯 round', () => {
  it('שלושה כיוונים, כל צעד', () => {
    expect(roundTo(12.5, 1, 'down')).toBe(12);
    expect(roundTo(12.1, 1, 'up')).toBe(13);
    expect(roundTo(12.5, 1, 'nearest')).toBe(13);
    expect(roundTo(37, 5, 'down')).toBe(35);
    expect(roundTo(37, 5, 'up')).toBe(40);
    expect(roundTo(1.234, 0.01, 'up')).toBe(1.24);
    expect(roundTo(-7.5, 5, 'down')).toBe(-10);
    expect(roundTo(0, 5, 'up')).toBe(0);
  });
  it('צעד פגום ⇒ 1; ערך פגום ⇒ NaN; roundAll מדלג', () => {
    expect(roundTo(3.7, 0, 'down')).toBe(3);
    expect(roundTo(3.7, -2, 'up')).toBe(4);
    expect(roundTo(NaN, 1, 'up')).toBeNaN();
    expect(roundAll([1.2, NaN, 2.8], 1, 'down')).toEqual([1, 2]);
    for (const g of GARBAGE) expect(() => roundTo(g as never, g as never, g as never)).not.toThrow();
  });
});

describe('⏱️ offset', () => {
  it('offsetAll: לפני ואחרי', () => {
    expect(offsetAll([1000, 1100], -10)).toEqual([990, 1090]);
    expect(offsetAll([1000, NaN], 5)).toEqual([1005]);
    expect(offsetAll([], 5)).toEqual([]);
  });
  it('resolveRelative: עוגנים בשם כלשהו, עברית, קבוע, חסר', () => {
    const a = { sh: 1080, tz: '18:40', שקיעה: 1080, open: null };
    expect(resolveRelative('sh-10', a)).toBe(1070);
    expect(resolveRelative('SH + 15', a)).toBe(1095);
    expect(resolveRelative('tz', a)).toBe(1120);
    expect(resolveRelative('שקיעה-20', a)).toBe(1060);
    expect(resolveRelative('06:45', a)).toBe(405);
    expect(resolveRelative('24:00', a)).toBeNull();
    expect(resolveRelative('open+5', a)).toBeNull();
    expect(resolveRelative('nope+5', a)).toBeNull();
    expect(resolveRelative('constructor', a)).toBeNull(); // לא דולף לאב-טיפוס
    expect(resolveRelative('sh+1000', a)).toBeNull(); // עד 3 ספרות
    for (const g of GARBAGE) expect(() => resolveRelative(g, g as never)).not.toThrow();
  });
});

describe('📣 escalate', () => {
  const H = 3_600_000;
  const steps = [
    { to: ['בעלי המקצוע'], waitMin: 180 },
    { to: ['הגבאי'], waitMin: 60 },
    { to: ['כל הקהילה'], waitMin: 0 },
  ];
  it('מתקדם בשלבים לפי הזמן', () => {
    expect(escalationState({ createdMs: 0, steps, nowMs: H })).toEqual({ stepIndex: 0, currentTo: ['בעלי המקצוע'], nextMoveMs: 3 * H, done: false });
    expect(escalationState({ createdMs: 0, steps, nowMs: 3 * H })).toEqual({ stepIndex: 1, currentTo: ['הגבאי'], nextMoveMs: 4 * H, done: false });
    expect(escalationState({ createdMs: 0, steps, nowMs: 9 * H })).toEqual({ stepIndex: 2, currentTo: ['כל הקהילה'], nextMoveMs: null, done: true });
  });
  it('דחוף מקצר כל שלב ל-urgentWaitMin; תשובה מקפיאה', () => {
    expect(escalationState({ createdMs: 0, steps, urgent: true, nowMs: H }).stepIndex).toBe(1);
    expect(escalationState({ createdMs: 0, steps, urgent: true, urgentWaitMin: 30, nowMs: H }).stepIndex).toBe(2);
    expect(escalationState({ createdMs: 0, steps, answeredMs: H, nowMs: 9 * H })).toEqual({ stepIndex: 0, currentTo: ['בעלי המקצוע'], nextMoveMs: null, done: true });
    expect(escalationState({ createdMs: 0, steps, answeredMs: 10 * H, nowMs: H }).done).toBe(false); // תשובה "בעתיד" לא נחשבת
  });
  it('שלב בלי מקבלים — עוברים מיד; אין שלבים; יצירה פגומה ⇒ לא נתקעים', () => {
    const s2 = [{ to: [], waitMin: 180 }, { to: ['כולם'], waitMin: 0 }];
    expect(escalationState({ createdMs: 0, steps: s2, nowMs: 0 }).stepIndex).toBe(1);
    expect(escalationState({ createdMs: 0, steps: [], nowMs: 0 })).toEqual({ stepIndex: -1, currentTo: [], nextMoveMs: null, done: true });
    expect(escalationState({ createdMs: NaN, steps, nowMs: 0 }).stepIndex).toBe(2);
    for (const g of GARBAGE) expect(() => escalationState(g as never)).not.toThrow();
  });
  it('תוכנית: כל שלב עם הזמן שלו; אחרי התשובה ⇒ null', () => {
    expect(escalationPlan({ createdMs: 0, steps }).map((r) => r.atMs)).toEqual([0, 3 * H, 4 * H]);
    expect(escalationPlan({ createdMs: 0, steps, urgent: true }).map((r) => r.atMs)).toEqual([0, H, 2 * H]);
    expect(escalationPlan({ createdMs: 0, steps, answeredMs: H }).map((r) => r.atMs)).toEqual([0, null, null]);
    for (const g of GARBAGE) expect(() => escalationPlan(g as never)).not.toThrow();
  });
});

describe('🔄 rotate', () => {
  it('turnOf: מודולו, גם שלילי; ריק ⇒ null', () => {
    const l = ['א', 'ב', 'ג'];
    expect([0, 1, 2, 3, 4, -1].map((n) => turnOf(l, n))).toEqual(['א', 'ב', 'ג', 'א', 'ב', 'ג']);
    expect(turnOf([], 5)).toBeNull();
    expect(turnIndex(0, 3)).toBe(-1);
    for (const g of GARBAGE) expect(() => turnOf(g as never, g as never)).not.toThrow();
  });
  it('fairAssign: round robin מנקודת התחלה', () => {
    expect(fairAssign(['1', '2', '3', '4'], ['רחל', 'לאה'], 1).map((x) => x.person)).toEqual(['לאה', 'רחל', 'לאה', 'רחל']);
    expect(fairAssign(['1'], [])).toEqual([]);
    for (const g of GARBAGE) expect(() => fairAssign(g as never, g as never, g as never)).not.toThrow();
  });
  it('dayIndex: יום אחרי יום = +1; פגום ⇒ 0', () => {
    expect(dayIndex('2026-10-15') - dayIndex('2026-10-14')).toBe(1);
    expect(dayIndex('לא תאריך')).toBe(0);
  });
});

describe('🔍 fuzzy', () => {
  const c = [
    { id: 'a', text: 'אינסטלטור מוסמך' },
    { id: 'b', text: 'חשמלאי בבני ברק' },
    { id: 'c', text: 'מורה פרטית לאנגלית' },
    { id: 'd', text: 'חשמל ותאורה' },
  ];
  it('מדויק, תחילית, שגיאת-כתיב אחת', () => {
    expect(fuzzyFind('חשמלאי', c)).toEqual(['b', 'd']); // זהה (3) לפני "מתחיל במילה" (2.2)
    expect(fuzzyFind('בחשמל', c)).toEqual(['d']); // אות-שימוש מוסרת ⇒ "חשמל" זהה
    expect(fuzzyFind('אינסטלתור', c)).toEqual(['a']);
    expect(fuzzyFind('אינסטלתור', c, 0)).toEqual([]);
    expect(fuzzyFind('מורה אנגלית', c)).toEqual(['c']);
    expect(fuzzyFind('מורה חשמל', c)).toEqual([]); // וגם: כל מילה חייבת להתאים
  });
  it('ניקוד וסופיות לא משנים; ריק/זבל ⇒ []', () => {
    expect(fuzzyFind('חַשְׁמַל', c)).toEqual(['d', 'b']);
    expect(fuzzyFind('', c)).toEqual([]);
    expect(wordScore('', 'x')).toBe(0);
    for (const g of GARBAGE) expect(() => fuzzyFind(g as never, g as never, g as never)).not.toThrow();
  });
  it('דטרמיניסטי: אותה קריאה ⇒ אותה תוצאה', () => {
    expect(fuzzyFind('חשמל', c)).toEqual(fuzzyFind('חשמל', c));
  });
});
